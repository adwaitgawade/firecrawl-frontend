import { api } from '@/lib/api/client'
import type {
  AsyncJobStartResponse,
  CrawlErrorsResponse,
  CrawlRequest,
  CrawlStatusResponse,
  OngoingCrawlsResponse,
} from '@/lib/api/types'

import type { CrawlCancelResponse, CrawlParamsPreviewRequest, CrawlParamsPreviewResponse } from './types'

export const crawlKeys = {
  all: ['crawl'] as const,
  ongoing: () => ['crawl', 'ongoing'] as const,
  status: (id: string, variant: 'meta' | 'full') => ['crawl', id, 'status', variant] as const,
  errors: (id: string) => ['crawl', id, 'errors'] as const,
}

export function startCrawl(body: CrawlRequest) {
  return api.post<AsyncJobStartResponse>('/crawl', body)
}

export function previewCrawlParams(body: CrawlParamsPreviewRequest) {
  return api.post<CrawlParamsPreviewResponse>('/crawl/params-preview', body)
}

export interface CrawlPageParams {
  skip?: number
  limit?: number
}

export function getCrawlStatus(id: string, page: CrawlPageParams = {}, signal?: AbortSignal) {
  return api.get<CrawlStatusResponse>(`/crawl/${id}`, {
    query: { skip: page.skip, limit: page.limit },
    signal,
  })
}

/**
 * Extract `skip`/`limit` from a `next` URL. The server builds `next` from the request host, which
 * can be wrong behind a proxy, so we re-issue the request against the configured API URL instead.
 */
export function pageFromNext(next: string): CrawlPageParams {
  try {
    const u = new URL(next)
    const skip = u.searchParams.get('skip')
    const limit = u.searchParams.get('limit')
    return {
      skip: skip !== null ? Number(skip) : undefined,
      limit: limit !== null ? Number(limit) : undefined,
    }
  } catch {
    return {}
  }
}

export function getCrawlErrors(id: string, signal?: AbortSignal) {
  return api.get<CrawlErrorsResponse>(`/crawl/${id}/errors`, { signal })
}

/** `GET /crawl/active` is routed to the same controller and returns the same payload. */
export function getOngoingCrawls(signal?: AbortSignal) {
  return api.get<OngoingCrawlsResponse>('/crawl/ongoing', { signal })
}

export function cancelCrawl(id: string) {
  return api.delete<CrawlCancelResponse>(`/crawl/${id}`)
}
