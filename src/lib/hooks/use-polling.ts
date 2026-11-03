import { useQuery, type QueryKey, type UseQueryResult } from '@tanstack/react-query'
import { isTerminalStatus } from '@/lib/api/types'

export interface PollingOptions<T> {
  /** Poll interval in ms (default 2000). */
  intervalMs?: number
  /**
   * Return true when polling should stop (e.g. job reached a terminal state).
   * Default: stops when `data.status` is a terminal status (completed/failed/cancelled/…).
   */
  stopWhen?: (data: T) => boolean
  /** Disable the query entirely (e.g. no job id yet). Default true. */
  enabled?: boolean
  /** Stop polling after an error (default true). */
  stopOnError?: boolean
}

function defaultStopWhen(data: unknown): boolean {
  if (data && typeof data === 'object' && 'status' in data) {
    return isTerminalStatus(String((data as { status: unknown }).status))
  }
  return false
}

/**
 * TanStack Query wrapper that refetches every `intervalMs` until `stopWhen(data)` is true.
 * The query fn receives an AbortSignal — pass it to `api.get(path, { signal })`.
 *
 * @example
 * const q = usePollingQuery(['crawl', id], signal => api.get<CrawlStatusResponse>(`/crawl/${id}`, { signal }))
 */
export function usePollingQuery<T>(
  key: QueryKey,
  fn: (signal: AbortSignal) => Promise<T>,
  { intervalMs = 2000, stopWhen = defaultStopWhen, enabled = true, stopOnError = true }: PollingOptions<T> = {},
): UseQueryResult<T, Error> & { isPolling: boolean } {
  const query = useQuery<T, Error>({
    queryKey: key,
    queryFn: ({ signal }) => fn(signal),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: q => {
      const data = q.state.data
      if (stopOnError && q.state.status === 'error') return false
      if (data !== undefined && stopWhen(data)) return false
      return intervalMs
    },
  })
  const isPolling =
    enabled &&
    !(stopOnError && query.isError) &&
    !(query.data !== undefined && stopWhen(query.data))
  return Object.assign(query, { isPolling })
}
