import { cleanScrapeOptions, defaultScrapeOptions } from '@/components/shared/scrape-options'
import { parseUrlList } from '@/components/shared/UrlListInput'
import type { JsonSchema, ScrapeOptions } from '@/lib/api/types'

import { initialSchemaInput, resolveSchema, type SchemaInputState } from './schema-builder'
import type { ExtractRequestBody } from './types'

export const EXTRACT_MAX_URLS = 10

export const EXTRACT_EXAMPLE_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    company_name: { type: 'string', description: 'Name of the company' },
    mission: { type: 'string' },
    is_open_source: { type: 'boolean' },
    pricing_tiers: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, price_per_month: { type: 'number' } },
        required: ['name'],
      },
    },
  },
  required: ['company_name'],
}

export interface ExtractFormState {
  urlsText: string
  prompt: string
  systemPrompt: string
  schema: SchemaInputState
  enableWebSearch: boolean
  showSources: boolean
  ignoreSitemap: boolean
  includeSubdomains: boolean
  allowExternalLinks: boolean
  ignoreInvalidURLs: boolean
  urlTrace: boolean
  streamSteps: boolean
  llmUsage: boolean
  limit: string
  /** seconds (converted to ms) */
  timeoutSec: string
  webhookUrl: string
  useScrapeOptions: boolean
  scrapeOptions: ScrapeOptions
}

const { formats: _formats, ...defaultScrapeOptionsNoFormats } = defaultScrapeOptions

export function initialExtractForm(): ExtractFormState {
  return {
    urlsText: '',
    prompt: '',
    systemPrompt: '',
    schema: initialSchemaInput('none'),
    enableWebSearch: false,
    showSources: true,
    ignoreSitemap: false,
    includeSubdomains: true,
    allowExternalLinks: false,
    ignoreInvalidURLs: true,
    urlTrace: false,
    streamSteps: true,
    llmUsage: false,
    limit: '',
    timeoutSec: '',
    webhookUrl: '',
    useScrapeOptions: false,
    scrapeOptions: defaultScrapeOptionsNoFormats,
  }
}

function positiveInt(text: string): number | undefined {
  const n = Number(text)
  return text.trim() && Number.isInteger(n) && n > 0 ? n : undefined
}

/** Build the exact `POST /v2/extract` body plus blocking validation errors. */
export function buildExtractBody(f: ExtractFormState): { body: ExtractRequestBody; errors: string[] } {
  const errors: string[] = []
  const { urls, invalid } = parseUrlList(f.urlsText)
  const prompt = f.prompt.trim()
  const schema = resolveSchema(f.schema)

  if (!urls.length && !prompt) errors.push('Provide at least one URL or a prompt.')
  if (invalid.length) errors.push(`${invalid.length} invalid URL${invalid.length === 1 ? '' : 's'}.`)
  if (urls.length > EXTRACT_MAX_URLS) errors.push(`At most ${EXTRACT_MAX_URLS} URLs are allowed while extract is in beta.`)
  if (prompt.length > 10000) errors.push('Prompt must be at most 10,000 characters.')
  if (schema.error) errors.push(schema.error)
  if (f.limit.trim() && positiveInt(f.limit) === undefined) errors.push('Limit must be a positive integer.')
  const timeoutMs = f.timeoutSec.trim() ? Math.round(Number(f.timeoutSec) * 1000) : undefined
  if (timeoutMs !== undefined && (!Number.isFinite(timeoutMs) || timeoutMs < 1000))
    errors.push('Timeout must be at least 1 second.')

  const body: ExtractRequestBody = {}
  if (urls.length) body.urls = urls
  if (prompt) body.prompt = prompt
  if (f.systemPrompt.trim()) body.systemPrompt = f.systemPrompt.trim()
  if (schema.schema) body.schema = schema.schema
  if (f.enableWebSearch) body.enableWebSearch = true
  if (f.showSources) body.showSources = true
  if (f.ignoreSitemap) body.ignoreSitemap = true
  if (!f.includeSubdomains) body.includeSubdomains = false
  if (f.allowExternalLinks) body.allowExternalLinks = true
  if (!f.ignoreInvalidURLs) body.ignoreInvalidURLs = false
  if (f.urlTrace) body.urlTrace = true
  const limit = positiveInt(f.limit)
  if (limit) body.limit = limit
  if (timeoutMs && timeoutMs >= 1000) body.timeout = timeoutMs
  if (f.webhookUrl.trim()) body.webhook = f.webhookUrl.trim()
  if (f.useScrapeOptions) {
    const so = cleanScrapeOptions(f.scrapeOptions)
    if (Object.keys(so).length) body.scrapeOptions = so
  }
  if (f.streamSteps) body.__experimental_streamSteps = true
  if (f.llmUsage) body.__experimental_llmUsage = true
  return { body, errors }
}

/** Rebuild form state from a previously sent body ("run again"). */
export function extractFormFromBody(body: ExtractRequestBody): ExtractFormState {
  const base = initialExtractForm()
  const schemaText = body.schema ? JSON.stringify(body.schema, null, 2) : ''
  return {
    ...base,
    urlsText: (body.urls ?? []).join('\n'),
    prompt: body.prompt ?? '',
    systemPrompt: body.systemPrompt ?? '',
    schema: body.schema
      ? { ...base.schema, mode: 'json', jsonText: schemaText, jsonSchema: body.schema }
      : base.schema,
    enableWebSearch: body.enableWebSearch ?? false,
    showSources: body.showSources ?? false,
    ignoreSitemap: body.ignoreSitemap ?? false,
    includeSubdomains: body.includeSubdomains ?? true,
    allowExternalLinks: body.allowExternalLinks ?? false,
    ignoreInvalidURLs: body.ignoreInvalidURLs ?? true,
    urlTrace: body.urlTrace ?? false,
    streamSteps: body.__experimental_streamSteps ?? false,
    llmUsage: body.__experimental_llmUsage ?? false,
    limit: body.limit ? String(body.limit) : '',
    timeoutSec: body.timeout ? String(body.timeout / 1000) : '',
    webhookUrl: typeof body.webhook === 'string' ? body.webhook : (body.webhook?.url ?? ''),
    useScrapeOptions: !!body.scrapeOptions,
    scrapeOptions: body.scrapeOptions ? { ...base.scrapeOptions, ...body.scrapeOptions } : base.scrapeOptions,
  }
}

/** Short history label for a job. */
export function extractJobLabel(body: ExtractRequestBody): string {
  const prompt = body.prompt?.trim()
  const urls = body.urls ?? []
  if (prompt && urls.length) return `${prompt} — ${urls[0]}${urls.length > 1 ? ` +${urls.length - 1}` : ''}`
  return prompt || urls.join(', ') || 'Extract job'
}
