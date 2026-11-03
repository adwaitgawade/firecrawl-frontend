import { api } from '@/lib/api/client'
import type { SearchRequest, SearchResponse } from '@/lib/api/types'

import type { TimedSearchResponse } from './types'

export async function runSearch(body: SearchRequest): Promise<TimedSearchResponse> {
  const started = performance.now()
  const res = await api.post<SearchResponse>('/search', body)
  return { ...res, durationMs: Math.round(performance.now() - started) }
}
