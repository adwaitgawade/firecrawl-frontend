import { api, FirecrawlApiError, isFirecrawlApiError } from '@/lib/api/client'
import type { ScrapeResponse } from '@/lib/api/types'

import type {
  InteractRequest,
  InteractResponse,
  InteractStopResponse,
  ScrapeStatusResponse,
  SerializedError,
} from './types'

export function runScrape(body: unknown, signal?: AbortSignal): Promise<ScrapeResponse> {
  return api.post<ScrapeResponse>('/scrape', body, { signal })
}

export function getScrape(jobId: string, signal?: AbortSignal): Promise<ScrapeStatusResponse> {
  return api.get<ScrapeStatusResponse>(`/scrape/${encodeURIComponent(jobId)}`, { signal })
}

export function interactPath(jobId: string): string {
  return `/scrape/${encodeURIComponent(jobId)}/interact`
}

/**
 * Run code / a prompt in the scrape's browser session. The API returns HTTP 200 with
 * `success: false` when the execution itself fails; the shared client throws on such bodies, so we
 * recover the full response from the error to keep stdout/stderr.
 */
export async function interact(jobId: string, body: InteractRequest): Promise<InteractResponse> {
  try {
    return await api.post<InteractResponse>(interactPath(jobId), body)
  } catch (e) {
    if (isFirecrawlApiError(e) && e.status === 200 && isInteractBody(e.body)) return e.body
    throw e
  }
}

export function stopInteract(jobId: string): Promise<InteractStopResponse> {
  return api.delete<InteractStopResponse>(interactPath(jobId))
}

function isInteractBody(body: unknown): body is InteractResponse {
  return (
    !!body &&
    typeof body === 'object' &&
    ('stdout' in body || 'stderr' in body || 'exitCode' in body || 'sessionId' in body)
  )
}

export function serializeError(e: unknown): SerializedError {
  if (e instanceof FirecrawlApiError) {
    return { message: e.message, status: e.status, code: e.code, details: e.details }
  }
  if (e instanceof Error) return { message: e.message }
  return { message: String(e) }
}

/** Rebuild a FirecrawlApiError so `<ErrorAlert>` renders status + zod details. */
export function deserializeError(e: SerializedError): FirecrawlApiError {
  return new FirecrawlApiError(e.message, { status: e.status ?? 0, code: e.code, details: e.details })
}
