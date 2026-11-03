// Response shapes for the team usage endpoints, mirrored from
// apps/api/src/controllers/v2/{token-usage,credit-usage-historical,token-usage-historical,queue-status}.ts
// and apps/api/src/controllers/v1/activity.ts (which backs GET /v2/team/activity).
// `CreditUsageResponse` and `ConcurrencyCheckResponse` live in `@/lib/api/types`.

/** GET /v2/team/token-usage */
export interface TokenUsageResponse {
  success: true
  data: {
    remainingTokens: number
    planTokens: number
    billingPeriodStart: string | null
    billingPeriodEnd: string | null
  }
}

/**
 * One period of historical usage. The API rolls the last 90 days of daily usage into
 * calendar-month buckets (sorted ascending by `startDate`; `endDate` is null for the current month).
 * `apiKey` is the key's display *name* and is only present with `?byApiKey=true`.
 */
interface HistoricalPeriodBase {
  startDate: string | null
  endDate: string | null
  apiKey?: string
}

/** GET /v2/team/credit-usage/historical[?byApiKey=true] */
export interface CreditUsageHistoricalResponse {
  success: true
  periods: (HistoricalPeriodBase & { creditsUsed: number })[]
}

/** GET /v2/team/token-usage/historical[?byApiKey=true] */
export interface TokenUsageHistoricalResponse {
  success: true
  periods: (HistoricalPeriodBase & { tokensUsed: number })[]
}

export type UsageMetric = 'credits' | 'tokens'

/** Normalised historical period used by the chart (metric-agnostic). */
export interface UsagePeriod {
  startDate: string | null
  endDate: string | null
  apiKey?: string
  value: number
}

/** GET /v2/team/queue-status */
export interface QueueStatusResponse {
  success: boolean
  jobsInQueue: number
  activeJobsInQueue: number
  waitingJobsInQueue: number
  maxConcurrency: number
  mostRecentSuccess: string | null
}

/** Valid `endpoint` filter values for GET /v2/team/activity. */
export const ACTIVITY_ENDPOINTS = [
  'scrape',
  'crawl',
  'batch_scrape',
  'search',
  'extract',
  'llmstxt',
  'deep_research',
  'map',
  'agent',
  'browser',
  'interact',
] as const

export type ActivityEndpoint = (typeof ACTIVITY_ENDPOINTS)[number]

export interface ActivityItem {
  /** Request id — equals the job / session id for async jobs. */
  id: string
  endpoint: ActivityEndpoint | null
  api_version: string | null
  created_at: string
  /** URL / query hint captured at request time. */
  target: string | null
}

/**
 * GET /v2/team/activity?endpoint=&limit=&cursor=
 * Only covers the last 24 hours. `limit` defaults to 50, max 100. Keyset pagination via `cursor`.
 */
export interface ActivityResponse {
  success: true
  data: ActivityItem[]
  cursor: string | null
  has_more: boolean
}
