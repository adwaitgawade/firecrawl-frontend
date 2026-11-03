import { api, isFirecrawlApiError } from '@/lib/api/client'
import { usePollingQuery } from '@/lib/hooks/use-polling'

import type { ExtractRequestBody, ExtractStartPayload, ExtractStatusPayload } from './types'

export function startExtract(body: ExtractRequestBody): Promise<ExtractStartPayload> {
  return api.post<ExtractStartPayload>('/extract', body)
}

/**
 * Status endpoints for failed jobs answer `200 { success: false, status: 'failed', error }`. The
 * shared client throws on any `success: false` body, so recover the payload from the error when the
 * HTTP status was 2xx and the body still looks like a status document.
 */
export async function getJobStatusTolerant<T>(path: string, signal?: AbortSignal): Promise<T> {
  try {
    return await api.get<T>(path, { signal })
  } catch (err) {
    if (
      isFirecrawlApiError(err) &&
      err.status >= 200 &&
      err.status < 300 &&
      err.body &&
      typeof err.body === 'object' &&
      typeof (err.body as Record<string, unknown>).status === 'string'
    ) {
      return err.body as T
    }
    throw err
  }
}

export function getExtractStatus(id: string, signal?: AbortSignal): Promise<ExtractStatusPayload> {
  return getJobStatusTolerant<ExtractStatusPayload>(`/extract/${encodeURIComponent(id)}`, signal)
}

/** Polls `GET /v2/extract/:id` every 2s until the job reaches a terminal status. */
export function useExtractStatus(id: string | undefined) {
  return usePollingQuery(['extract', id], signal => getExtractStatus(id ?? '', signal), {
    enabled: !!id,
    intervalMs: 2000,
  })
}
