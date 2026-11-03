import { api, buildUrl, FirecrawlApiError } from '@/lib/api/client'
import type { ScrapeResponse } from '@/lib/api/types'
import { getSettings } from '@/lib/config'

import { contentTypeFor } from './file-types'
import type { ParseOptions, ParseRequestBody, ParseUploadTarget, ParseUploadUrlResponse } from './types'

interface XhrOptions {
  method: string
  url: string
  headers?: Record<string, string>
  body: XMLHttpRequestBodyInit
  /** Attach `Authorization: Bearer <key>` (only for the Firecrawl API host). */
  auth?: boolean
  signal?: AbortSignal
  /** Upload progress, 0–1. */
  onProgress?: (fraction: number) => void
}

function parseText(text: string): unknown {
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function toApiError(status: number, body: unknown): FirecrawlApiError {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    const message =
      (typeof b.error === 'string' && b.error) ||
      (typeof b.message === 'string' && b.message) ||
      `Request failed with status ${status}`
    return new FirecrawlApiError(message, {
      status,
      code: typeof b.code === 'string' ? b.code : undefined,
      details: b.details,
      body,
    })
  }
  const text = typeof body === 'string' ? body.trim() : ''
  // Cloud storage errors are XML; keep them short but informative.
  const xmlMessage = text.match(/<Message>([^<]+)<\/Message>/)?.[1]
  return new FirecrawlApiError(
    xmlMessage ?? (text && text.length < 300 ? text : `Request failed with status ${status}`),
    { status, body },
  )
}

/**
 * XMLHttpRequest wrapper — used instead of `fetch`/`api.raw` because fetch cannot report upload
 * progress. Resolves with the parsed body, rejects with `FirecrawlApiError` like the shared client.
 */
function xhrRequest({ method, url, headers, body, auth, signal, onProgress }: XhrOptions): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, url)
    for (const [k, v] of Object.entries(headers ?? {})) xhr.setRequestHeader(k, v)
    const { apiKey, apiUrl } = getSettings()
    if (auth && apiKey) xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`)

    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total)
      }
    }
    const onAbort = () => xhr.abort()
    signal?.addEventListener('abort', onAbort, { once: true })
    const cleanup = () => signal?.removeEventListener('abort', onAbort)

    xhr.onload = () => {
      cleanup()
      const parsed = parseText(xhr.responseText)
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(toApiError(xhr.status, parsed))
        return
      }
      if (parsed && typeof parsed === 'object' && (parsed as Record<string, unknown>).success === false) {
        reject(toApiError(xhr.status, parsed))
        return
      }
      resolve(parsed)
    }
    xhr.onerror = () => {
      cleanup()
      reject(
        new FirecrawlApiError(
          auth
            ? `Could not reach the Firecrawl API at ${apiUrl}. Check the API URL in Settings and that the server is running (and allows CORS).`
            : 'Upload failed: the storage server could not be reached (network or CORS error).',
          { status: 0, code: 'NETWORK_ERROR' },
        ),
      )
    }
    xhr.onabort = () => {
      cleanup()
      reject(new FirecrawlApiError('Request was cancelled', { status: 0, code: 'ABORTED' }))
    }
    if (signal?.aborted) {
      xhr.abort()
      return
    }
    xhr.send(body)
  })
}

export function uploadUrlBody(file: File) {
  return {
    filename: file.name,
    contentType: contentTypeFor(file),
    declaredSizeBytes: file.size,
  }
}

/** Step 1: `POST /v2/parse/upload-url`. */
export async function requestUploadUrl(file: File, signal?: AbortSignal): Promise<ParseUploadTarget> {
  const res = await api.post<ParseUploadUrlResponse>('/parse/upload-url', uploadUrlBody(file), { signal })
  return res.data
}

/** Step 2: send the bytes to the returned URL (PUT for local storage, signed POST form for GCS). */
export async function uploadToTarget(
  target: ParseUploadTarget,
  file: File,
  opts: { signal?: AbortSignal; onProgress?: (fraction: number) => void } = {},
): Promise<void> {
  const isApiHost = (() => {
    try {
      return new URL(target.uploadUrl).origin === new URL(getSettings().apiUrl).origin
    } catch {
      return false
    }
  })()

  if (target.method === 'POST') {
    const form = new FormData()
    for (const [k, v] of Object.entries(target.fields ?? {})) form.append(k, v)
    form.append('file', file)
    await xhrRequest({ method: 'POST', url: target.uploadUrl, body: form, auth: false, ...opts })
    return
  }

  // Local driver: the uploadRef in the query string is the credential; no auth header needed, but
  // sending it to our own host is harmless.
  await xhrRequest({
    method: 'PUT',
    url: target.uploadUrl,
    headers: target.headers,
    body: file,
    auth: isApiHost,
    ...opts,
  })
}

/** Step 3: `POST /v2/parse` with the upload reference. */
export function parseUploadRef(body: ParseRequestBody, signal?: AbortSignal): Promise<ScrapeResponse> {
  return api.post<ScrapeResponse>('/parse', body, { signal })
}

/** Alternative single-request flow: `POST /v2/parse` as multipart/form-data (`file` + `options` JSON). */
export async function parseMultipart(
  file: File,
  options: Partial<ParseOptions>,
  opts: { signal?: AbortSignal; onProgress?: (fraction: number) => void } = {},
): Promise<ScrapeResponse> {
  const form = new FormData()
  form.append('file', file, file.name)
  if (Object.keys(options).length > 0) form.append('options', JSON.stringify(options))
  const res = await xhrRequest({ method: 'POST', url: buildUrl('/parse'), body: form, auth: true, ...opts })
  return res as ScrapeResponse
}
