/**
 * Plain TypeScript mirrors of the Firecrawl v2 API shapes.
 * Source of truth: `apps/api/src/controllers/v2/types.ts` (zod schemas) and the v2 controllers.
 *
 * Request types describe the *input* (what you send): every field with a server default is optional.
 * Feature-specific response types not listed here should be declared in the feature folder after
 * reading the relevant controller.
 */

// ---------------------------------------------------------------------------
// Generic envelopes
// ---------------------------------------------------------------------------

export interface ErrorResponse {
  success: false
  code?: string
  error: string
  details?: unknown
}

export type JsonSchema = Record<string, unknown>

// ---------------------------------------------------------------------------
// Formats
// ---------------------------------------------------------------------------

/** Formats that take no options; may be sent as a plain string or `{ type }`. */
export type SimpleFormatType =
  | 'markdown'
  | 'html'
  | 'rawHtml'
  | 'links'
  | 'images'
  | 'summary'
  | 'branding'
  | 'product'
  | 'menu'
  | 'audio'
  | 'video'

/** Formats that take options and must be sent as objects. */
export type ObjectFormatType =
  | 'json'
  | 'deterministicJson'
  | 'changeTracking'
  | 'screenshot'
  | 'attributes'
  | 'question'
  | 'highlights'
  | 'query'

export type FormatType = SimpleFormatType | ObjectFormatType

export interface Viewport {
  /** max 7680 */
  width: number
  /** max 4320 */
  height: number
}

export interface JsonFormat {
  type: 'json'
  schema?: JsonSchema
  /** max 10000 chars */
  prompt?: string
}

/** Same as `json` but extracted by a cached reusable JS extractor. Mutually exclusive with `json`. */
export interface DeterministicJsonFormat {
  type: 'deterministicJson'
  schema?: JsonSchema
  prompt?: string
}

export type ChangeTrackingMode = 'json' | 'git-diff'

/** Requires the `markdown` format as well. */
export interface ChangeTrackingFormat {
  type: 'changeTracking'
  prompt?: string
  schema?: JsonSchema
  /** default [] */
  modes?: ChangeTrackingMode[]
  /** default null */
  tag?: string | null
}

/** Only one screenshot format per request. */
export interface ScreenshotFormat {
  type: 'screenshot'
  /** default false */
  fullPage?: boolean
  /** 1–100 */
  quality?: number
  viewport?: Viewport
}

export interface AttributeSelector {
  selector: string
  attribute: string
}

export interface AttributesFormat {
  type: 'attributes'
  selectors: AttributeSelector[]
}

/** Populates `document.answer`. */
export interface QuestionFormat {
  type: 'question'
  /** 1–10000 chars */
  question: string
}

/** Populates `document.highlights`. */
export interface HighlightsFormat {
  type: 'highlights'
  /** 1–10000 chars */
  query: string
}

/** @deprecated Use `question` or `highlights`. */
export interface QueryFormat {
  type: 'query'
  prompt: string
  /** default "freeform" */
  mode?: 'freeform' | 'directQuote'
}

export interface SimpleFormatObject<T extends SimpleFormatType = SimpleFormatType> {
  type: T
}

export type FormatObject =
  | SimpleFormatObject
  | JsonFormat
  | DeterministicJsonFormat
  | ChangeTrackingFormat
  | ScreenshotFormat
  | AttributesFormat
  | QuestionFormat
  | HighlightsFormat
  | QueryFormat

/** What `formats` accepts: simple format strings or format objects (strings are normalized server-side). */
export type FormatInput = SimpleFormatType | 'screenshot' | FormatObject

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** Provide exactly one of `milliseconds` or `selector`. */
export interface WaitAction {
  type: 'wait'
  milliseconds?: number
  selector?: string
}
export interface ClickAction {
  type: 'click'
  selector: string
  /** default false */
  all?: boolean
}
export interface ScreenshotAction {
  type: 'screenshot'
  fullPage?: boolean
  quality?: number
  viewport?: Viewport
}
export interface WriteAction {
  type: 'write'
  text: string
}
export interface PressAction {
  type: 'press'
  key: string
}
export interface ScrollAction {
  type: 'scroll'
  /** default "down" */
  direction?: 'up' | 'down'
  selector?: string
}
export interface ScrapeAction {
  type: 'scrape'
}
export interface ExecuteJavascriptAction {
  type: 'executeJavascript'
  script: string
}
export type PdfPaperFormat =
  | 'A0'
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'Letter'
  | 'Legal'
  | 'Tabloid'
  | 'Ledger'
export interface PdfAction {
  type: 'pdf'
  landscape?: boolean
  scale?: number
  /** default "Letter" */
  format?: PdfPaperFormat
}

/** Max 50 actions; total wait time (waitFor + wait actions) ≤ 60s. */
export type Action =
  | WaitAction
  | ClickAction
  | ScreenshotAction
  | WriteAction
  | PressAction
  | ScrollAction
  | ScrapeAction
  | ExecuteJavascriptAction
  | PdfAction

export type ActionType = Action['type']

export const MAX_ACTIONS = 50
export const ACTIONS_MAX_WAIT_MS = 60_000

// ---------------------------------------------------------------------------
// Scrape options
// ---------------------------------------------------------------------------

export interface Location {
  /** ISO 3166-1 alpha-2 (or "us-generic" / "us-whitelist"). Server default "us-generic". */
  country?: string
  languages?: string[]
}

export type PdfParserMode = 'fast' | 'auto' | 'ocr'
export interface PdfParser {
  type: 'pdf'
  mode?: PdfParserMode
  /** 1–10000 */
  maxPages?: number
}
/** default ["pdf"]; send [] to disable PDF parsing. */
export type Parser = 'pdf' | PdfParser

export type ProxyMode = 'basic' | 'stealth' | 'enhanced' | 'auto'

export type RedactPIIEntity = 'PERSON' | 'EMAIL' | 'PHONE' | 'LOCATION' | 'FINANCIAL' | 'SECRET'
export interface RedactPIIOptions {
  /** default "accurate" */
  mode?: 'accurate' | 'aggressive' | 'fast'
  entities?: RedactPIIEntity[]
  /** default "tag" */
  replaceStyle?: 'tag' | 'mask' | 'remove'
}

export interface ScrapeProfile {
  /** 1–128 chars */
  name: string
  /** default true */
  saveChanges?: boolean
}

/**
 * v2 scrape options (`baseScrapeOptions`). Shared by /scrape, /batch/scrape, /crawl
 * (`scrapeOptions`), /search (`scrapeOptions`), /extract (`scrapeOptions`), /parse.
 * Defaults noted per field are applied server-side when omitted.
 */
export interface ScrapeOptions {
  /** default [{type:"markdown"}] */
  formats?: FormatInput[]
  headers?: Record<string, string>
  includeTags?: string[]
  excludeTags?: string[]
  /** default true */
  onlyMainContent?: boolean
  /** default false */
  onlyCleanContent?: boolean
  /** ms, min 1000 */
  timeout?: number
  /** ms, 0–60000, default 0; must be ≤ timeout/2 */
  waitFor?: number
  /** default false */
  mobile?: boolean
  parsers?: Parser[]
  actions?: Action[]
  location?: Location
  skipTlsVerification?: boolean
  /** default true */
  removeBase64Images?: boolean
  /** default false */
  fastMode?: boolean
  /** default true */
  blockAds?: boolean
  /** default "auto" */
  proxy?: ProxyMode
  /** ms; accept cached data younger than this */
  maxAge?: number
  /** ms */
  minAge?: number
  /** default true */
  storeInCache?: boolean
  /** default false */
  lockdown?: boolean
  redactPII?: boolean | RedactPIIOptions
  profile?: ScrapeProfile
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export type WebhookEvent = 'completed' | 'failed' | 'page' | 'started'
export type AgentWebhookEvent = 'started' | 'action' | 'completed' | 'failed' | 'cancelled'

/** May also be sent as a plain URL string. */
export interface WebhookOptions<E extends string = WebhookEvent> {
  url: string
  headers?: Record<string, string>
  metadata?: Record<string, string>
  /** default: all events */
  events?: E[]
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

export interface ScrapeRequest extends ScrapeOptions {
  url: string
  zeroDataRetention?: boolean
  integration?: string
  origin?: string
}

export interface BatchScrapeRequest extends ScrapeOptions {
  urls: string[]
  webhook?: string | WebhookOptions
  appendToId?: string
  /** default true */
  ignoreInvalidURLs?: boolean
  maxConcurrency?: number
  zeroDataRetention?: boolean
  integration?: string
  origin?: string
}

export type SitemapMode = 'skip' | 'include' | 'only'

export interface CrawlerOptions {
  /** regex patterns; default [] */
  includePaths?: string[]
  /** regex patterns; default [] */
  excludePaths?: string[]
  maxDiscoveryDepth?: number
  /** default 10000 */
  limit?: number
  crawlEntireDomain?: boolean
  /** default false */
  allowExternalLinks?: boolean
  /** default false */
  allowSubdomains?: boolean
  /** default false */
  ignoreRobotsTxt?: boolean
  robotsUserAgent?: string
  /** default "include" */
  sitemap?: SitemapMode
  /** default true */
  deduplicateSimilarURLs?: boolean
  /** default false */
  ignoreQueryParameters?: boolean
  /** default false */
  regexOnFullURL?: boolean
  /** seconds, ≤ 60 */
  delay?: number
}

export interface CrawlRequest extends CrawlerOptions {
  url: string
  scrapeOptions?: ScrapeOptions
  webhook?: string | WebhookOptions
  maxConcurrency?: number
  zeroDataRetention?: boolean
  /** natural-language prompt to derive crawler options (max 10000) */
  prompt?: string
  integration?: string
  origin?: string
}

export interface MapRequest {
  url: string
  /** default true */
  includeSubdomains?: boolean
  /** default true */
  ignoreQueryParameters?: boolean
  search?: string
  /** default "include" */
  sitemap?: SitemapMode
  /** 1–100000, default 5000 */
  limit?: number
  /** ms */
  timeout?: number
  /** default true */
  filterByPath?: boolean
  /** default true */
  useIndex?: boolean
  /** default false */
  ignoreCache?: boolean
  location?: Location
  headers?: Record<string, string>
  includePaths?: string[]
  excludePaths?: string[]
  allowExternalLinks?: boolean
  allowSubdomains?: boolean
  crawlEntireDomain?: boolean
  maxDiscoveryDepth?: number
  integration?: string
  origin?: string
}

export type SearchSourceType = 'web' | 'images' | 'news'
export interface WebSearchSource {
  type: 'web'
  tbs?: string
  filter?: string
  lang?: string
  country?: string
  location?: string
}
export type SearchSource = WebSearchSource | { type: 'images' } | { type: 'news' }
export type SearchCategoryType = 'github' | 'research' | 'pdf' | 'developer'

/** Formats allowed in search `scrapeOptions.formats`. */
export type SearchFormatInput =
  | 'markdown'
  | 'html'
  | 'rawHtml'
  | 'links'
  | 'images'
  | 'summary'
  | 'product'
  | 'menu'
  | 'screenshot'
  | SimpleFormatObject<'markdown' | 'html' | 'rawHtml' | 'links' | 'images' | 'summary' | 'product' | 'menu'>
  | JsonFormat
  | QuestionFormat
  | HighlightsFormat
  | QueryFormat
  | ScreenshotFormat

export interface SearchRequest {
  query: string
  /** 1–100, default 10 */
  limit?: number
  /** time-based search, e.g. "qdr:d" */
  tbs?: string
  filter?: string
  /** default ["web"] */
  sources?: SearchSourceType[] | SearchSource[]
  categories?: SearchCategoryType[] | { type: SearchCategoryType }[]
  /** hostnames; cannot combine with excludeDomains */
  includeDomains?: string[]
  excludeDomains?: string[]
  /** default "en" */
  lang?: string
  country?: string
  location?: string
  /** ms, default 60000 */
  timeout?: number
  /** default false */
  ignoreInvalidURLs?: boolean
  /** default false */
  asyncScraping?: boolean
  highlights?: boolean
  enterprise?: ('default' | 'anon' | 'zdr')[]
  scrapeOptions?: Omit<ScrapeOptions, 'formats'> & { formats?: SearchFormatInput[] }
  integration?: string
  origin?: string
}

export interface ExtractRequest {
  /** max 10 while in beta; either urls or prompt is required */
  urls?: string[]
  prompt?: string
  systemPrompt?: string
  schema?: JsonSchema
  limit?: number
  /** default false */
  ignoreSitemap?: boolean
  /** default true */
  includeSubdomains?: boolean
  /** default false */
  allowExternalLinks?: boolean
  /** default false */
  enableWebSearch?: boolean
  scrapeOptions?: ScrapeOptions
  /** default false */
  showSources?: boolean
  /** default false */
  urlTrace?: boolean
  timeout?: number
  /** default true */
  ignoreInvalidURLs?: boolean
  webhook?: string | WebhookOptions
  integration?: string
  origin?: string
}

export type AgentModel = 'spark-1-pro' | 'spark-1-mini'

export interface AgentRequest {
  prompt: string
  urls?: string[]
  schema?: JsonSchema
  maxCredits?: number
  strictConstrainToURLs?: boolean
  webhook?: string | WebhookOptions<AgentWebhookEvent>
  /** default "spark-1-pro" */
  model?: AgentModel
  integration?: string
  origin?: string
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export interface BrandingProfile {
  colorScheme?: 'light' | 'dark'
  logo?: string | null
  fonts?: Array<{ family: string; [key: string]: unknown }>
  colors?: Record<string, string | undefined>
  typography?: {
    fontFamilies?: Record<string, string | undefined>
    fontStacks?: Record<string, string[] | undefined>
    fontSizes?: Record<string, string | undefined>
    lineHeights?: Record<string, number | undefined>
    fontWeights?: Record<string, number | undefined>
  }
  spacing?: Record<string, unknown>
  components?: Record<string, unknown>
  icons?: Record<string, string | undefined>
  images?: {
    logo?: string | null
    logoHref?: string | null
    logoAlt?: string | null
    favicon?: string | null
    ogImage?: string | null
    [key: string]: string | null | undefined
  }
  animations?: Record<string, string | undefined>
  layout?: Record<string, unknown>
  tone?: Record<string, string | undefined>
  personality?: {
    tone: 'professional' | 'playful' | 'modern' | 'traditional' | 'minimalist' | 'bold'
    energy: 'low' | 'medium' | 'high'
    targetAudience: string
  }
  [key: string]: unknown
}

export interface Price {
  amount: number
  currency?: string
  formatted?: string
}
export interface Availability {
  inStock: boolean
  text?: string
}
export interface ImageRef {
  url: string
  alt?: string
}

export interface ProductProfile {
  title: string
  brand?: string
  category?: string
  url: string
  description?: string
  variants: Array<{
    id?: string
    sku?: string
    title?: string
    values?: Record<string, unknown>
    price?: Price
    sale?: { originalPrice: Price }
    availability: Availability
    images?: ImageRef[]
  }>
}

export interface MenuItem {
  id: string
  name: string
  description?: string
  images: ImageRef[]
  price?: Price
  availability: Availability
  dietary: string[]
  calories?: number
  optionGroups: unknown[]
  identifiers: { merchantItemId?: string }
  url?: string
  sourceUrl: string
}

export interface MenuProfile {
  isMenu: boolean
  confidence: number
  merchant: { name: string; type?: string | null; location?: unknown }
  currency?: string | null
  sections: Array<{ id: string; name: string; description?: string; items: MenuItem[] }>
  sourceUrl: string
}

export interface VideoItem {
  url: string
  sourceURL: string
  source: string
  kind?: string
  provider?: string
  title?: string
  thumbnail?: string
  description?: string
  duration?: string
  mimeType?: string
  width?: number
  height?: number
  metadata?: Record<string, unknown>
}

export type ChangeStatus = 'new' | 'same' | 'changed' | 'removed'

export interface ChangeTrackingResult {
  previousScrapeAt: string | null
  changeStatus: ChangeStatus
  visibility: 'visible' | 'hidden'
  diff?: {
    text: string
    json: {
      files: Array<{
        from: string | null
        to: string | null
        chunks: Array<{
          content: string
          changes: Array<{
            type: string
            normal?: boolean
            ln?: number
            ln1?: number
            ln2?: number
            content: string
          }>
        }>
      }>
    }
  }
  json?: unknown
}

export interface DocumentMetadata {
  title?: string
  description?: string
  language?: string
  keywords?: string
  robots?: string
  ogTitle?: string
  ogDescription?: string
  ogUrl?: string
  ogImage?: string
  ogAudio?: string
  ogDeterminer?: string
  ogLocale?: string
  ogLocaleAlternate?: string[]
  ogSiteName?: string
  ogVideo?: string
  favicon?: string
  dcTermsCreated?: string
  dcDateCreated?: string
  dcDate?: string
  dcTermsType?: string
  dcType?: string
  dcTermsAudience?: string
  dcTermsSubject?: string
  dcSubject?: string
  dcDescription?: string
  dcTermsKeywords?: string
  modifiedTime?: string
  publishedTime?: string
  articleTag?: string
  articleSection?: string
  url?: string
  sourceURL?: string
  statusCode: number
  scrapeId?: string
  error?: string
  numPages?: number
  totalPages?: number
  contentType?: string
  timezone?: string
  proxyUsed?: 'basic' | 'stealth'
  cacheState?: 'hit' | 'miss'
  cachedAt?: string
  creditsUsed?: number
  postprocessorsUsed?: string[]
  indexId?: string
  concurrencyLimited?: boolean
  concurrencyQueueDurationMs?: number
  /** The API passes through arbitrary <meta> tags too. */
  [key: string]: unknown
}

export interface Document {
  title?: string
  description?: string
  url?: string
  markdown?: string
  html?: string
  rawHtml?: string
  links?: string[]
  images?: string[]
  /** URL or data: URI */
  screenshot?: string
  audio?: string
  video?: string
  videos?: VideoItem[]
  /** v1-compat alias of json */
  extract?: unknown
  json?: unknown
  summary?: string
  /** from the `question` format */
  answer?: string
  /** from the `highlights` format */
  highlights?: string
  branding?: BrandingProfile
  product?: ProductProfile
  menu?: MenuProfile
  warning?: string
  attributes?: Array<{ selector: string; attribute: string; values: string[] }>
  actions?: {
    screenshots?: string[]
    scrapes?: Array<{ url: string; html: string }>
    javascriptReturns?: Array<{ type: string; value: unknown }>
    pdfs?: string[]
  }
  changeTracking?: ChangeTrackingResult
  metadata: DocumentMetadata
  serpResults?: { title: string; description: string; url: string }
}

// ---------------------------------------------------------------------------
// Status unions
// ---------------------------------------------------------------------------

export type CrawlStatus = 'scraping' | 'completed' | 'failed' | 'cancelled'
export type BatchScrapeStatus = CrawlStatus
export type ExtractStatus = 'processing' | 'completed' | 'failed' | 'cancelled'
export type AgentStatus = 'processing' | 'completed' | 'failed' | 'cancelled'

/** Any status string StatusBadge knows how to color. */
export type JobStatus =
  | CrawlStatus
  | ExtractStatus
  | AgentStatus
  | 'pending'
  | 'queued'
  | 'active'
  | 'running'
  | 'success'
  | 'error'
  | 'paused'
  | 'destroyed'
  | (string & {})

export const TERMINAL_STATUSES: ReadonlySet<string> = new Set([
  'completed',
  'failed',
  'cancelled',
  'success',
  'error',
  'destroyed',
])

export function isTerminalStatus(status: string | undefined | null): boolean {
  return !!status && TERMINAL_STATUSES.has(status)
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export interface ScrapeResponse {
  success: true
  warning?: string
  data: Document
  scrape_id?: string
}

/** POST /crawl and POST /batch/scrape */
export interface AsyncJobStartResponse {
  success: true
  id: string
  url: string
  /** batch only */
  invalidURLs?: string[]
}

/** GET /crawl/:id and GET /batch/scrape/:id */
export interface CrawlStatusResponse {
  success: boolean
  status: CrawlStatus
  completed: number
  total: number
  creditsUsed: number
  expiresAt: string
  createdAt?: string
  completedAt?: string
  duration?: number
  /** absolute URL of the next page of data, if paginated */
  next?: string
  data: Document[]
  warning?: string
  error?: string
}
export type BatchScrapeStatusResponse = CrawlStatusResponse

export interface CrawlErrorsResponse {
  errors: Array<{ id: string; timestamp?: string; url: string; code?: string; error: string }>
  robotsBlocked: string[]
}

export interface OngoingCrawlsResponse {
  success: true
  crawls: Array<{
    id: string
    teamId: string
    url: string
    created_at: string
    options: CrawlerOptions
  }>
}

export interface MapLink {
  url: string
  title?: string
  description?: string
}
export interface MapResponse {
  success: true
  id?: string
  links: MapLink[]
  warning?: string
}

export interface WebSearchResult {
  url: string
  title: string
  description: string
  position?: number
  category?: string
  markdown?: string
  html?: string
  rawHtml?: string
  links?: string[]
  screenshot?: string
  metadata?: Record<string, unknown>
  answer?: string
  highlights?: string
}
export interface ImageSearchResult {
  title?: string
  imageUrl?: string
  imageWidth?: number
  imageHeight?: number
  url?: string
  position?: number
  answer?: string
  highlights?: string
}
export interface NewsSearchResult {
  title?: string
  url?: string
  snippet?: string
  date?: string
  imageUrl?: string
  position?: number
  category?: string
  markdown?: string
  html?: string
  rawHtml?: string
  links?: string[]
  screenshot?: string
  metadata?: Record<string, unknown>
  answer?: string
  highlights?: string
}
export interface SearchData {
  web?: WebSearchResult[]
  images?: ImageSearchResult[]
  news?: NewsSearchResult[]
  developer?: WebSearchResult[]
}
export interface SearchResponse {
  success: true
  warning?: string
  data: SearchData
  scrapeIds?: { web?: string[]; news?: string[]; images?: string[] }
  creditsUsed: number
  id: string
}

export interface URLTrace {
  url: string
  status: 'mapped' | 'scraped' | 'error'
  timing: { discoveredAt: string; scrapedAt?: string; completedAt?: string }
  error?: string
  warning?: string
  contentStats?: { rawContentLength: number; processedContentLength: number; tokensUsed: number }
  relevanceScore?: number
  usedInCompletion?: boolean
  extractedFields?: string[]
}

export interface ExtractStartResponse {
  success: true
  id: string
  urlTrace?: URLTrace[]
}

export interface ExtractStatusResponse {
  success: boolean
  status: ExtractStatus
  data?: unknown
  error?: string
  expiresAt?: string
  warning?: string
  sources?: Record<string, string[]>
  urlTrace?: URLTrace[]
  tokensUsed?: number
  creditsUsed?: number
  [key: string]: unknown
}

export interface AgentStartResponse {
  success: boolean
  id: string
}

export interface AgentStatusResponse {
  success: boolean
  status: AgentStatus
  error?: string
  data?: unknown
  model?: AgentModel
  expiresAt: string
  creditsUsed?: number
}

export interface CreditUsageResponse {
  success: true
  data: {
    remainingCredits: number
    planCredits: number
    billingPeriodStart: string | null
    billingPeriodEnd: string | null
  }
}

export interface ConcurrencyCheckResponse {
  success: true
  concurrency: number
  maxConcurrency: number
}
