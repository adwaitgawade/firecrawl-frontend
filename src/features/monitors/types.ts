/**
 * Types mirrored from `apps/api/src/controllers/v2/monitor.ts` (serializers) and
 * `apps/api/src/services/monitoring/types.ts` (zod request schemas).
 */
import type { CrawlerOptions, FormatInput, ScrapeOptions } from '@/lib/api/types'

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

export type MonitorScrapeOptions = ScrapeOptions & { formats?: FormatInput[] } & Record<string, unknown>

export interface ScrapeTarget {
  id?: string
  type: 'scrape'
  /** ≥ 1 URL */
  urls: string[]
  scrapeOptions?: MonitorScrapeOptions
}

export interface CrawlTarget {
  id?: string
  type: 'crawl'
  url: string
  crawlOptions?: Partial<CrawlerOptions> & Record<string, unknown>
  scrapeOptions?: MonitorScrapeOptions
}

export type SearchWindow = '5m' | '15m' | '1h' | '6h' | '24h' | '7d'

export interface SearchTarget {
  id?: string
  type: 'search'
  /** 1–12 queries, each 1–256 chars */
  queries: string[]
  /** default "24h" */
  searchWindow?: SearchWindow
  /** hostnames, max 50; mutually exclusive with excludeDomains */
  includeDomains?: string[]
  excludeDomains?: string[]
  /** 1–50, default 10 */
  maxResults?: number
}

export type MonitorTarget = ScrapeTarget | CrawlTarget | SearchTarget
export type MonitorTargetType = MonitorTarget['type']

// ---------------------------------------------------------------------------
// Schedule / notifications / webhook
// ---------------------------------------------------------------------------

/** Request schedule: exactly one of `cron` or `text` (e.g. "every 30 minutes", "daily at 9:00"). */
export interface MonitorScheduleInput {
  cron?: string
  text?: string
  /** default "UTC" */
  timezone?: string
}

export interface MonitorSchedule {
  cron: string
  timezone: string
}

export interface MonitorEmailNotification {
  enabled?: boolean
  recipients?: string[]
  includeDiffs?: boolean
}

export interface MonitorSlackNotification {
  enabled?: boolean
  channelId?: string
  channelName?: string
}

export interface MonitorNotification {
  email?: MonitorEmailNotification
  slack?: MonitorSlackNotification
}

export type MonitorWebhookEvent = 'monitor.page' | 'monitor.check.completed'
export const MONITOR_WEBHOOK_EVENTS: MonitorWebhookEvent[] = ['monitor.page', 'monitor.check.completed']

export interface MonitorWebhook {
  url: string
  headers?: Record<string, string>
  metadata?: Record<string, string>
  events?: MonitorWebhookEvent[]
}

export interface EmailRecipientSubscription {
  email: string
  status: 'pending' | 'confirmed' | 'unsubscribed'
  source: 'team' | 'opt_in' | 'legacy'
  confirmationEmailSent?: boolean
}

// ---------------------------------------------------------------------------
// Monitor
// ---------------------------------------------------------------------------

export interface MonitorSummary {
  totalPages: number
  same: number
  changed: number
  new: number
  removed: number
  error: number
}

export type MonitorStatus = 'active' | 'paused' | 'deleted'

export interface Monitor {
  id: string
  name: string
  status: MonitorStatus
  schedule: MonitorSchedule
  nextRunAt: string | null
  lastRunAt: string | null
  currentCheckId: string | null
  targets: (MonitorTarget & { id: string })[]
  webhook: MonitorWebhook | null
  notification: MonitorNotification | null
  emailRecipientSubscriptions?: EmailRecipientSubscription[]
  retentionDays: number
  estimatedCreditsPerMonth: number | null
  lastCheckSummary: MonitorSummary | null
  goal: string | null
  judgeEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateMonitorRequest {
  /** 1–256 chars */
  name: string
  schedule: MonitorScheduleInput
  webhook?: MonitorWebhook
  notification?: MonitorNotification
  /** 1–50 targets */
  targets: MonitorTarget[]
  /** 1–365, default 30 */
  retentionDays?: number
  /** ≤ 2000 chars; required (non-empty) for search targets unless judgeEnabled is false */
  goal?: string | null
  judgeEnabled?: boolean
}

export type UpdateMonitorRequest = Partial<CreateMonitorRequest> & { status?: 'active' | 'paused' }

export interface MonitorResponse {
  success: true
  data: Monitor
}

export interface MonitorListResponse {
  success: true
  data: Monitor[]
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

export type MonitorCheckStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'partial'
  | 'skipped_overlap'
  | 'skipped_no_credits'

export const MONITOR_CHECK_STATUSES: MonitorCheckStatus[] = [
  'queued',
  'running',
  'completed',
  'failed',
  'partial',
  'skipped_overlap',
  'skipped_no_credits',
]

export interface MonitorCheck {
  id: string
  monitorId: string
  status: MonitorCheckStatus
  trigger: 'scheduled' | 'manual'
  scheduledFor: string | null
  startedAt: string | null
  finishedAt: string | null
  estimatedCredits: number | null
  reservedCredits: number | null
  actualCredits: number | null
  billingStatus: string
  summary: MonitorSummary
  targetResults: unknown
  notificationStatus: unknown
  error: string | null
  createdAt: string
  updatedAt: string
}

export type MonitorPageStatus = 'same' | 'new' | 'changed' | 'removed' | 'error'
export const MONITOR_PAGE_STATUSES: MonitorPageStatus[] = ['changed', 'new', 'removed', 'error', 'same']

export interface MonitorJudgment {
  meaningful: boolean
  confidence: 'high' | 'medium' | 'low'
  reason: string
  meaningfulChanges: {
    type: 'added' | 'removed' | 'changed'
    before: string | null
    after: string | null
    reason: string
  }[]
}

export interface MonitorPageDiff {
  /** git-style unified diff of the markdown */
  text?: string
  /** markdown: parsed diff structure; json: per-field `{ previous, current }` */
  json?: unknown
}

export interface MonitorCheckPage {
  id: string
  targetId: string
  url: string
  status: MonitorPageStatus
  previousScrapeId: string | null
  currentScrapeId: string | null
  statusCode: number | null
  error: string | null
  metadata: unknown
  judgment: MonitorJudgment | null
  createdAt: string
  diff: MonitorPageDiff | null
  /** Present for JSON-extraction monitors: the full current extraction. */
  snapshot?: { json: Record<string, unknown> }
}

export interface MonitorCheckDetail extends MonitorCheck {
  pages: MonitorCheckPage[]
  next?: string
}

export interface MonitorCheckListResponse {
  success: true
  data: MonitorCheck[]
}

export interface MonitorCheckDetailResponse {
  success: true
  next?: string
  data: MonitorCheckDetail
}

export interface RunMonitorResponse {
  success: true
  id: string
  data: MonitorCheck
}
