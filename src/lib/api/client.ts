import { getSettings } from '@/lib/config'

/**
 * Error thrown for any non-2xx response (or `{ success: false }` body) from the Firecrawl API.
 * Parses the standard error body `{ success: false, error, code?, details? }`.
 */
export class FirecrawlApiError extends Error {
  /** HTTP status code (0 for network errors / aborted requests). */
  readonly status: number
  /** `details` field from the error body (e.g. zod issues for 400s), if any. */
  readonly details?: unknown
  /** Machine-readable `code` from the error body, if any. */
  readonly code?: string
  /** Full parsed response body (JSON object, or raw text when not JSON). */
  readonly body?: unknown

  constructor(
    message: string,
    opts: { status: number; details?: unknown; code?: string; body?: unknown },
  ) {
    super(message)
    this.name = 'FirecrawlApiError'
    this.status = opts.status
    this.details = opts.details
    this.code = opts.code
    this.body = opts.body
  }
}

export function isFirecrawlApiError(err: unknown): err is FirecrawlApiError {
  return err instanceof FirecrawlApiError
}

export type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue | QueryValue[]>

export interface RequestOptions {
  /** Query-string params; `undefined`/`null`/`''` values are dropped, arrays are repeated. */
  query?: QueryParams
  signal?: AbortSignal
  /** Extra headers (merged over defaults). */
  headers?: Record<string, string>
}

export interface RawRequestInit extends RequestInit {
  /**
   * Whether to attach `Authorization: Bearer <key>`. Defaults to `true` when the URL points at the
   * configured API host (or is a relative `/...` path), `false` for foreign hosts (e.g. signed
   * cloud-storage upload URLs).
   */
  auth?: boolean
}

/** `${apiUrl}/v2` for the current settings. */
export function apiBaseUrl(): string {
  return `${getSettings().apiUrl}/v2`
}

function buildQuery(query?: QueryParams): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value]
    for (const v of values) {
      if (v === undefined || v === null || v === '') continue
      params.append(key, String(v))
    }
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

/**
 * Build a full v2 URL. `path` is relative to `/v2` (e.g. `/scrape`). Absolute `http(s)://` URLs are
 * returned unchanged (plus query) — useful for `next` pagination URLs returned by the API.
 */
export function buildUrl(path: string, query?: QueryParams): string {
  if (/^https?:\/\//i.test(path)) {
    if (!query) return path
    const qs = buildQuery(query)
    return qs ? `${path}${path.includes('?') ? '&' : '?'}${qs.slice(1)}` : path
  }
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiBaseUrl()}${p}${buildQuery(query)}`
}

/**
 * WebSocket URL for a v2 path (e.g. `wsUrl('/crawl/' + id)` → `ws://localhost:3002/v2/crawl/<id>`).
 * Browsers can't set headers on WebSockets; the API accepts the API key as the
 * `Sec-WebSocket-Protocol` value instead — use `openWebSocket()` or pass `wsProtocols()`.
 */
export function wsUrl(path: string): string {
  return buildUrl(path).replace(/^http/i, 'ws')
}

/** Sub-protocol list carrying the API key, for `new WebSocket(wsUrl(path), wsProtocols())`. */
export function wsProtocols(): string[] | undefined {
  const { apiKey } = getSettings()
  return apiKey ? [apiKey] : undefined
}

/** Open an authenticated WebSocket to a v2 path. */
export function openWebSocket(path: string): WebSocket {
  return new WebSocket(wsUrl(path), wsProtocols())
}

function authHeaders(): Record<string, string> {
  const { apiKey } = getSettings()
  return apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined
  const text = await res.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function errorFromBody(status: number, statusText: string, body: unknown): FirecrawlApiError {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>
    const message =
      (typeof b.error === 'string' && b.error) ||
      (typeof b.message === 'string' && b.message) ||
      `Request failed with status ${status}${statusText ? ` ${statusText}` : ''}`
    return new FirecrawlApiError(message, {
      status,
      details: b.details,
      code: typeof b.code === 'string' ? b.code : undefined,
      body,
    })
  }
  const text = typeof body === 'string' ? body.trim() : ''
  return new FirecrawlApiError(
    text && text.length < 300
      ? text
      : `Request failed with status ${status}${statusText ? ` ${statusText}` : ''}`,
    { status, body },
  )
}

function networkError(err: unknown): FirecrawlApiError {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new FirecrawlApiError('Request was cancelled', { status: 0, code: 'ABORTED' })
  }
  const base = getSettings().apiUrl
  return new FirecrawlApiError(
    `Could not reach the Firecrawl API at ${base}. Check the API URL in Settings and that the server is running (and allows CORS).`,
    { status: 0, code: 'NETWORK_ERROR', details: err instanceof Error ? err.message : String(err) },
  )
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...authHeaders(),
    ...opts.headers,
  }
  let payload: BodyInit | undefined
  if (body !== undefined) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    payload = JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: payload,
      signal: opts.signal,
    })
  } catch (err) {
    throw networkError(err)
  }

  const parsed = await parseBody(res)
  if (!res.ok) throw errorFromBody(res.status, res.statusText, parsed)
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>
    // Job status endpoints (crawl, batch, extract, agent) answer 200 with
    // `{ success: false, status: 'failed', error }` for a failed job. That is a valid status
    // payload, not a request error, so hand it back to the caller instead of throwing.
    const isJobStatusPayload = typeof obj.status === 'string'
    if (obj.success === false && typeof obj.error === 'string' && !isJobStatusPayload) {
      throw errorFromBody(res.status, res.statusText, parsed)
    }
  }
  return parsed as T
}

function isApiHost(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return true
  try {
    return new URL(url).origin === new URL(getSettings().apiUrl).origin
  } catch {
    return false
  }
}

async function raw(url: string, init: RawRequestInit = {}): Promise<Response> {
  const { auth, headers: initHeaders, ...rest } = init
  const fullUrl = /^https?:\/\//i.test(url) ? url : buildUrl(url)
  const headers = new Headers(initHeaders)
  if ((auth ?? isApiHost(url)) && !headers.has('Authorization')) {
    const { apiKey } = getSettings()
    if (apiKey) headers.set('Authorization', `Bearer ${apiKey}`)
  }
  let res: Response
  try {
    res = await fetch(fullUrl, { ...rest, headers })
  } catch (err) {
    throw networkError(err)
  }
  if (!res.ok) {
    const parsed = await parseBody(res)
    throw errorFromBody(res.status, res.statusText, parsed)
  }
  return res
}

/**
 * Firecrawl v2 API client. Paths are relative to `/v2`, e.g. `api.post('/scrape', body)`.
 * All JSON methods throw `FirecrawlApiError` on non-2xx responses or `{ success: false }` bodies
 * (except 2xx job-status payloads carrying a `status` field, e.g. a failed crawl, which are returned).
 */
export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, body ?? {}, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, body ?? {}, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, body ?? {}, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, undefined, opts),
  /**
   * Low-level fetch for non-JSON calls (binary upload, downloads). Does NOT set `Content-Type`
   * (pass your own). `url` may be absolute or a `/v2`-relative path. Adds auth for the API host
   * (see `RawRequestInit.auth`). Throws `FirecrawlApiError` on non-2xx; returns the raw `Response`.
   */
  raw,
}

export type ApiClient = typeof api
