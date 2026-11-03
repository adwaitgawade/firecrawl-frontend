import { api, isFirecrawlApiError } from '@/lib/api/client'
import type {
  AsyncJobStartResponse,
  BatchScrapeStatusResponse,
  CrawlErrorsResponse,
  Document,
} from '@/lib/api/types'

import type { BatchCancelResponse } from './types'

export const batchPath = (id: string) => `/batch/scrape/${encodeURIComponent(id)}`

export function startBatch(body: unknown): Promise<AsyncJobStartResponse> {
  return api.post<AsyncJobStartResponse>('/batch/scrape', body)
}

export interface PageQuery {
  skip?: number
  limit?: number
}

function isStatusBody(body: unknown): body is BatchScrapeStatusResponse {
  return !!body && typeof body === 'object' && 'status' in body && 'completed' in body && 'total' in body
}

/**
 * GET /v2/batch/scrape/:id. When the batch failed at kickoff the API answers 200 with
 * `{ success: false, status: 'failed', error, … }`; the shared client throws on that, so recover the
 * body and return it as a normal (failed) status.
 */
export async function getBatchStatus(
  id: string,
  page: PageQuery = {},
  signal?: AbortSignal,
): Promise<BatchScrapeStatusResponse> {
  try {
    return await api.get<BatchScrapeStatusResponse>(batchPath(id), {
      signal,
      query: { skip: page.skip || undefined, limit: page.limit },
    })
  } catch (e) {
    if (isFirecrawlApiError(e) && e.status === 200 && isStatusBody(e.body)) return e.body
    throw e
  }
}

export function getBatchErrors(id: string, signal?: AbortSignal): Promise<CrawlErrorsResponse> {
  return api.get<CrawlErrorsResponse>(`${batchPath(id)}/errors`, { signal })
}

export function cancelBatch(id: string): Promise<BatchCancelResponse> {
  return api.delete<BatchCancelResponse>(batchPath(id))
}

/**
 * The `next` URL is built from the API's own `req.protocol`/`req.host`, which can differ from the
 * configured API URL behind proxies / in Docker. Extract `skip`/`limit` and re-issue the request
 * against the configured host instead of fetching `next` verbatim.
 */
export function pageFromNext(next: string | undefined): PageQuery | undefined {
  if (!next) return undefined
  try {
    const u = new URL(next)
    const skip = Number(u.searchParams.get('skip') ?? '0')
    const limitRaw = u.searchParams.get('limit')
    return {
      skip: Number.isFinite(skip) ? skip : 0,
      limit: limitRaw && Number.isFinite(Number(limitRaw)) ? Number(limitRaw) : undefined,
    }
  } catch {
    return undefined
  }
}

/** Fetch every result page (follows `next` until it's gone or a page comes back empty). */
export async function fetchAllBatchDocuments(
  id: string,
  onProgress?: (count: number) => void,
  signal?: AbortSignal,
): Promise<Document[]> {
  const docs: Document[] = []
  let page: PageQuery | undefined = {}
  for (let i = 0; page && i < 1000; i++) {
    const res: BatchScrapeStatusResponse = await getBatchStatus(id, page, signal)
    const data = res.data ?? []
    docs.push(...data)
    onProgress?.(docs.length)
    if (data.length === 0) break
    page = pageFromNext(res.next)
  }
  return docs
}

/** Stable identity for de-duplicating documents across result pages. */
export function documentKey(doc: Document, index: number): string {
  const id = doc.metadata?.scrapeId
  return typeof id === 'string' ? id : `${doc.metadata?.sourceURL ?? doc.metadata?.url ?? 'doc'}#${index}`
}
