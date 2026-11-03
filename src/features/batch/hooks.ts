import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { getBatchErrors } from './api'

/**
 * Errors for a batch job (`GET /v2/batch/scrape/:id/errors`). The job status is part of the key so
 * the list refreshes on every status transition; while scraping it also refreshes every 10s.
 */
export function useBatchErrors(jobId: string, status: string | undefined) {
  return useQuery({
    queryKey: ['batch', jobId, 'errors', status],
    queryFn: ({ signal }) => getBatchErrors(jobId, signal),
    enabled: !!status,
    placeholderData: keepPreviousData,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: status === 'scraping' ? 10_000 : false,
  })
}
