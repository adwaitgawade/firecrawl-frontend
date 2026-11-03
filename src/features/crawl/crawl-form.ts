import { cleanScrapeOptions, defaultScrapeOptions, validateFormats } from '@/components/shared/scrape-options'
import type { CrawlRequest, WebhookEvent, WebhookOptions } from '@/lib/api/types'
import { isValidUrl } from '@/lib/utils'

import type { CrawlerFormOptions, CrawlFormState, CrawlParamsPreviewData } from './types'

export const WEBHOOK_EVENTS: WebhookEvent[] = ['started', 'page', 'completed', 'failed']

/** Server defaults from `crawlerOptions` in controllers/v2/types.ts. */
export const CRAWLER_DEFAULTS = {
  limit: 10000,
  sitemap: 'include',
  allowExternalLinks: false,
  allowSubdomains: false,
  ignoreRobotsTxt: false,
  deduplicateSimilarURLs: true,
  ignoreQueryParameters: false,
  regexOnFullURL: false,
} as const

export function initialCrawlForm(url = ''): CrawlFormState {
  const { formats, ...scrapeOptions } = defaultScrapeOptions
  return {
    url,
    prompt: '',
    crawler: { limit: 100 },
    formats: formats ?? ['markdown'],
    scrapeOptions,
    webhook: { url: '', events: [...WEBHOOK_EVENTS], headers: {}, metadata: {} },
    zeroDataRetention: false,
  }
}

const trimList = (list: string[] | undefined) => (list ?? []).map(s => s.trim()).filter(Boolean)

/** Only explicitly-set, non-default crawler options (explicit values override prompt-generated ones). */
export function cleanCrawlerOptions(opts: CrawlerFormOptions): Partial<CrawlRequest> {
  const out: Partial<CrawlRequest> = {}
  const num = (v: number | undefined) => (v !== undefined && Number.isFinite(v) ? v : undefined)

  if (num(opts.limit) !== undefined) out.limit = opts.limit
  if (num(opts.maxDiscoveryDepth) !== undefined) out.maxDiscoveryDepth = opts.maxDiscoveryDepth
  const include = trimList(opts.includePaths)
  if (include.length) out.includePaths = include
  const exclude = trimList(opts.excludePaths)
  if (exclude.length) out.excludePaths = exclude
  if (opts.sitemap && opts.sitemap !== CRAWLER_DEFAULTS.sitemap) out.sitemap = opts.sitemap
  if (opts.crawlEntireDomain) out.crawlEntireDomain = true
  if (opts.allowSubdomains) out.allowSubdomains = true
  if (opts.allowExternalLinks) out.allowExternalLinks = true
  if (opts.ignoreQueryParameters) out.ignoreQueryParameters = true
  if (opts.deduplicateSimilarURLs === false) out.deduplicateSimilarURLs = false
  if (opts.regexOnFullURL) out.regexOnFullURL = true
  if (opts.ignoreRobotsTxt) out.ignoreRobotsTxt = true
  if (opts.robotsUserAgent?.trim()) out.robotsUserAgent = opts.robotsUserAgent.trim()
  const delay = num(opts.delay)
  if (delay !== undefined && delay > 0) out.delay = delay
  const maxConcurrency = num(opts.maxConcurrency)
  if (maxConcurrency !== undefined && maxConcurrency > 0) out.maxConcurrency = maxConcurrency
  return out
}

function buildWebhook(state: CrawlFormState): CrawlRequest['webhook'] {
  const { url, events, headers, metadata } = state.webhook
  if (!url.trim()) return undefined
  const cleanRecord = (r: Record<string, string>) => {
    const entries = Object.entries(r).filter(([k]) => k.trim())
    return entries.length ? Object.fromEntries(entries.map(([k, v]) => [k.trim(), v])) : undefined
  }
  const h = cleanRecord(headers)
  const m = cleanRecord(metadata)
  const allEvents = events.length === WEBHOOK_EVENTS.length
  if (!h && !m && allEvents) return url.trim()
  const out: WebhookOptions = { url: url.trim() }
  if (h) out.headers = h
  if (m) out.metadata = m
  if (!allEvents) out.events = events
  return out
}

/** The exact body sent to `POST /v2/crawl` (also shown in RequestPreview). */
export function buildCrawlBody(state: CrawlFormState): CrawlRequest {
  const scrapeOptions = cleanScrapeOptions({ ...state.scrapeOptions, formats: state.formats })
  const body: CrawlRequest = { url: state.url.trim() }
  if (state.prompt.trim()) body.prompt = state.prompt.trim()
  Object.assign(body, cleanCrawlerOptions(state.crawler))
  // Only send scrapeOptions when they differ from the server default (`formats: ['markdown']`).
  const isDefaultScrape =
    Object.keys(scrapeOptions).length === 1 &&
    Array.isArray(scrapeOptions.formats) &&
    scrapeOptions.formats.length === 1 &&
    scrapeOptions.formats[0] === 'markdown'
  if (!isDefaultScrape) body.scrapeOptions = scrapeOptions
  const webhook = buildWebhook(state)
  if (webhook) body.webhook = webhook
  if (state.zeroDataRetention) body.zeroDataRetention = true
  return body
}

function invalidRegexes(list: string[] | undefined): string[] {
  return trimList(list).filter(p => {
    try {
      new RegExp(p)
      return false
    } catch {
      return true
    }
  })
}

/** Client-side mirror of the server validation. Returns a list of problems. */
export function validateCrawlForm(state: CrawlFormState): string[] {
  const errors: string[] = []
  if (!isValidUrl(state.url)) errors.push('Enter a valid URL to crawl.')
  if (state.prompt.length > 10000) errors.push('The prompt cannot exceed 10,000 characters.')
  const { limit, delay, maxConcurrency, maxDiscoveryDepth } = state.crawler
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) errors.push('Limit must be a positive integer.')
  if (maxDiscoveryDepth !== undefined && maxDiscoveryDepth < 0) errors.push('Max discovery depth cannot be negative.')
  if (delay !== undefined && (delay <= 0 || delay > 60)) errors.push('Delay must be between 0 and 60 seconds.')
  if (maxConcurrency !== undefined && (!Number.isInteger(maxConcurrency) || maxConcurrency < 1))
    errors.push('Max concurrency must be a positive integer.')
  const badInclude = invalidRegexes(state.crawler.includePaths)
  if (badInclude.length) errors.push(`Invalid include path regex: ${badInclude.join(', ')}`)
  const badExclude = invalidRegexes(state.crawler.excludePaths)
  if (badExclude.length) errors.push(`Invalid exclude path regex: ${badExclude.join(', ')}`)
  if (state.webhook.url.trim() && !isValidUrl(state.webhook.url)) errors.push('Webhook URL is not a valid URL.')
  if (state.webhook.url.trim() && state.webhook.events.length === 0) errors.push('Select at least one webhook event.')
  errors.push(...validateFormats(state.formats))
  return errors
}

/** Map AI-generated params to form options (only fields that were generated). */
export function previewToCrawlerOptions(data: CrawlParamsPreviewData): CrawlerFormOptions {
  const out: CrawlerFormOptions = {}
  if (data.limit !== undefined) out.limit = data.limit
  const depth = data.maxDiscoveryDepth ?? data.maxDepth
  if (depth !== undefined) out.maxDiscoveryDepth = depth
  if (data.includePaths) out.includePaths = data.includePaths
  if (data.excludePaths) out.excludePaths = data.excludePaths
  if (data.sitemap) out.sitemap = data.sitemap
  if (data.crawlEntireDomain !== undefined) out.crawlEntireDomain = data.crawlEntireDomain
  if (data.allowSubdomains !== undefined) out.allowSubdomains = data.allowSubdomains
  if (data.allowExternalLinks !== undefined) out.allowExternalLinks = data.allowExternalLinks
  if (data.ignoreQueryParameters !== undefined) out.ignoreQueryParameters = data.ignoreQueryParameters
  if (data.deduplicateSimilarURLs !== undefined) out.deduplicateSimilarURLs = data.deduplicateSimilarURLs
  if (data.delay !== undefined) out.delay = data.delay
  return out
}

export const CRAWLER_OPTION_LABELS: Record<keyof CrawlerFormOptions, string> = {
  limit: 'Limit',
  maxDiscoveryDepth: 'Max discovery depth',
  includePaths: 'Include paths',
  excludePaths: 'Exclude paths',
  sitemap: 'Sitemap',
  crawlEntireDomain: 'Crawl entire domain',
  allowSubdomains: 'Allow subdomains',
  allowExternalLinks: 'Allow external links',
  ignoreQueryParameters: 'Ignore query parameters',
  deduplicateSimilarURLs: 'Deduplicate similar URLs',
  regexOnFullURL: 'Regex on full URL',
  ignoreRobotsTxt: 'Ignore robots.txt',
  robotsUserAgent: 'Robots user agent',
  delay: 'Delay (s)',
  maxConcurrency: 'Max concurrency',
}

export function formatOptionValue(value: unknown): string {
  if (value === undefined || value === null) return '—'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '[]'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}
