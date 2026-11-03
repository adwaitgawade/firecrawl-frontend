import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { api, isFirecrawlApiError } from '@/lib/api/client'
import type { ConcurrencyCheckResponse, CreditUsageResponse } from '@/lib/api/types'

import type {
  ActivityEndpoint,
  ActivityResponse,
  CreditUsageHistoricalResponse,
  QueueStatusResponse,
  TokenUsageHistoricalResponse,
  TokenUsageResponse,
  UsageMetric,
  UsagePeriod,
} from './types'

/** Interval used for the live (concurrency / queue) cards when auto-refresh is on. */
export const LIVE_REFRESH_MS = 10_000

export const ACTIVITY_PAGE_SIZE = 25

export const usageKeys = {
  all: ['usage'] as const,
  credits: () => [...usageKeys.all, 'credits'] as const,
  tokens: () => [...usageKeys.all, 'tokens'] as const,
  concurrency: () => [...usageKeys.all, 'concurrency'] as const,
  queue: () => [...usageKeys.all, 'queue'] as const,
  historical: (metric: UsageMetric, byApiKey: boolean) =>
    [...usageKeys.all, 'historical', metric, byApiKey] as const,
  activity: (endpoint: ActivityEndpoint | undefined) =>
    [...usageKeys.all, 'activity', endpoint ?? 'all'] as const,
}

/**
 * Retry once for transient failures, never for client errors (401/403/404) — those are
 * expected on self-hosted deployments without billing / DB auth and won't fix themselves.
 */
function retryTransient(failureCount: number, error: unknown): boolean {
  if (isFirecrawlApiError(error) && error.status >= 400 && error.status < 500) return false
  return failureCount < 1
}

const baseOptions = { retry: retryTransient, refetchOnWindowFocus: false } as const

export function useCreditUsage() {
  return useQuery({
    ...baseOptions,
    queryKey: usageKeys.credits(),
    queryFn: ({ signal }) => api.get<CreditUsageResponse>('/team/credit-usage', { signal }),
    select: r => r.data,
    staleTime: 30_000,
  })
}

export function useTokenUsage() {
  return useQuery({
    ...baseOptions,
    queryKey: usageKeys.tokens(),
    queryFn: ({ signal }) => api.get<TokenUsageResponse>('/team/token-usage', { signal }),
    select: r => r.data,
    staleTime: 30_000,
  })
}

export function useConcurrency(autoRefresh: boolean) {
  return useQuery({
    ...baseOptions,
    queryKey: usageKeys.concurrency(),
    queryFn: ({ signal }) => api.get<ConcurrencyCheckResponse>('/concurrency-check', { signal }),
    refetchInterval: autoRefresh ? LIVE_REFRESH_MS : false,
  })
}

export function useQueueStatus(autoRefresh: boolean) {
  return useQuery({
    ...baseOptions,
    queryKey: usageKeys.queue(),
    queryFn: ({ signal }) => api.get<QueueStatusResponse>('/team/queue-status', { signal }),
    refetchInterval: autoRefresh ? LIVE_REFRESH_MS : false,
  })
}

export function historicalPath(metric: UsageMetric): string {
  return metric === 'credits' ? '/team/credit-usage/historical' : '/team/token-usage/historical'
}

/** Historical periods tagged with the params they were fetched with (so placeholder data renders consistently). */
export interface HistoricalUsage {
  metric: UsageMetric
  byApiKey: boolean
  periods: UsagePeriod[]
}

async function fetchHistorical(
  metric: UsageMetric,
  byApiKey: boolean,
  signal: AbortSignal,
): Promise<HistoricalUsage> {
  const query = byApiKey ? { byApiKey: true } : undefined
  if (metric === 'credits') {
    const r = await api.get<CreditUsageHistoricalResponse>(historicalPath(metric), { query, signal })
    const periods = (r.periods ?? []).map(({ creditsUsed, ...p }) => ({ ...p, value: creditsUsed ?? 0 }))
    return { metric, byApiKey, periods }
  }
  const r = await api.get<TokenUsageHistoricalResponse>(historicalPath(metric), { query, signal })
  const periods = (r.periods ?? []).map(({ tokensUsed, ...p }) => ({ ...p, value: tokensUsed ?? 0 }))
  return { metric, byApiKey, periods }
}

export function useHistoricalUsage(metric: UsageMetric, byApiKey: boolean) {
  return useQuery({
    ...baseOptions,
    queryKey: usageKeys.historical(metric, byApiKey),
    queryFn: ({ signal }) => fetchHistorical(metric, byApiKey, signal),
    // Historical aggregation is slow server-side (it walks raw events); cache generously.
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  })
}

export function useTeamActivity(endpoint: ActivityEndpoint | undefined) {
  return useInfiniteQuery({
    ...baseOptions,
    queryKey: usageKeys.activity(endpoint),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ signal, pageParam }) =>
      api.get<ActivityResponse>('/team/activity', {
        signal,
        query: { endpoint, limit: ACTIVITY_PAGE_SIZE, cursor: pageParam },
      }),
    getNextPageParam: last => (last.has_more && last.cursor ? last.cursor : undefined),
    staleTime: 15_000,
  })
}
