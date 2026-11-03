import type { Action, FormatInput, ScrapeOptions, WebhookEvent } from '@/lib/api/types'

/** DELETE /v2/batch/scrape/:jobId (controllers/v2/crawl-cancel.ts). */
export interface BatchCancelResponse {
  status: 'cancelled'
}

export interface WebhookFormState {
  enabled: boolean
  url: string
  events: WebhookEvent[]
  headers: Record<string, string>
  metadata: Record<string, string>
}

/** Everything the batch form edits (mirrors `batchScrapeRequestSchema` in controllers/v2/types.ts). */
export interface BatchFormState {
  urlsText: string
  formats: FormatInput[]
  /** Scrape options other than `formats` (actions included). */
  options: ScrapeOptions & { actions?: Action[] }
  /** default true server-side */
  ignoreInvalidURLs: boolean
  /** positive integer; empty = team default */
  maxConcurrency?: number
  zeroDataRetention: boolean
  /** Append to an existing batch job (UUID). */
  appendToId: string
  webhook: WebhookFormState
}

/** Router state passed from the batch form to the job page. */
export interface BatchJobLocationState {
  invalidURLs?: string[]
}
