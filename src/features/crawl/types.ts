import type {
  CrawlStatusResponse,
  Document,
  FormatInput,
  ScrapeOptions,
  SitemapMode,
  WebhookEvent,
} from '@/lib/api/types'

/** `data` of `POST /v2/crawl/params-preview` (controllers/v2/crawl-params-preview.ts). */
export interface CrawlParamsPreviewData {
  url: string
  includePaths?: string[]
  excludePaths?: string[]
  /** legacy name the LLM may still emit; mapped to maxDiscoveryDepth */
  maxDepth?: number
  maxDiscoveryDepth?: number
  crawlEntireDomain?: boolean
  allowExternalLinks?: boolean
  allowSubdomains?: boolean
  sitemap?: SitemapMode
  ignoreQueryParameters?: boolean
  deduplicateSimilarURLs?: boolean
  delay?: number
  limit?: number
}

export interface CrawlParamsPreviewResponse {
  success: true
  data?: CrawlParamsPreviewData
}

export interface CrawlParamsPreviewRequest {
  url: string
  prompt: string
}

/** `DELETE /v2/crawl/:jobId` (controllers/v2/crawl-cancel.ts). */
export interface CrawlCancelResponse {
  status: 'cancelled'
}

/**
 * Messages of `WS /v2/crawl/:jobId` (controllers/v2/crawl-status-ws.ts). Note that the server sends
 * `done` and `error` as the JSON *close reason*, not as regular messages — handle both.
 */
export type CrawlWsMessage =
  | { type: 'catchup'; data: CrawlStatusResponse }
  | { type: 'document'; data: Document }
  | { type: 'done' }
  | { type: 'error'; error: string }

/**
 * Crawler options the form edits. `undefined` means "not set" — the field is omitted from the body
 * so server defaults (and prompt-generated options) apply.
 */
export interface CrawlerFormOptions {
  limit?: number
  maxDiscoveryDepth?: number
  includePaths?: string[]
  excludePaths?: string[]
  sitemap?: SitemapMode
  crawlEntireDomain?: boolean
  allowSubdomains?: boolean
  allowExternalLinks?: boolean
  ignoreQueryParameters?: boolean
  /** server default true */
  deduplicateSimilarURLs?: boolean
  regexOnFullURL?: boolean
  ignoreRobotsTxt?: boolean
  robotsUserAgent?: string
  /** seconds, 0 < delay ≤ 60 */
  delay?: number
  maxConcurrency?: number
}

export interface WebhookFormState {
  url: string
  events: WebhookEvent[]
  headers: Record<string, string>
  metadata: Record<string, string>
}

export interface CrawlFormState {
  url: string
  prompt: string
  crawler: CrawlerFormOptions
  formats: FormatInput[]
  /** Everything except `formats` (edited by ScrapeOptionsForm). */
  scrapeOptions: ScrapeOptions
  webhook: WebhookFormState
  zeroDataRetention: boolean
}

/** Live connection state of the crawl watcher. */
export type CrawlWatchMode =
  /** WebSocket opening, waiting for catchup. */
  | 'connecting'
  /** WebSocket streaming documents. */
  | 'live'
  /** WebSocket finished normally (done); REST provides the final status. */
  | 'finished'
  /** WebSocket failed / closed early; polling REST instead. */
  | 'polling'
