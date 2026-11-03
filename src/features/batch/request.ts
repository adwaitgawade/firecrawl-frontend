import { cleanScrapeOptions, defaultScrapeOptions } from '@/components/shared/scrape-options'
import { parseUrlList } from '@/components/shared/UrlListInput'
import type { Document, WebhookEvent, WebhookOptions } from '@/lib/api/types'

import type { BatchFormState, WebhookFormState } from './types'

export const WEBHOOK_EVENTS: WebhookEvent[] = ['started', 'page', 'completed', 'failed']

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: string) => UUID_RE.test(v.trim())

export function initialBatchForm(): BatchFormState {
  const { formats, ...options } = defaultScrapeOptions
  return {
    urlsText: '',
    formats: formats ?? ['markdown'],
    options,
    ignoreInvalidURLs: true,
    maxConcurrency: undefined,
    zeroDataRetention: false,
    appendToId: '',
    webhook: { enabled: false, url: '', events: [...WEBHOOK_EVENTS], headers: {}, metadata: {} },
  }
}

function cleanRecord(r: Record<string, string>): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(r)) if (k.trim()) out[k.trim()] = v
  return Object.keys(out).length ? out : undefined
}

function buildWebhook(w: WebhookFormState): string | WebhookOptions | undefined {
  if (!w.enabled || !w.url.trim()) return undefined
  const headers = cleanRecord(w.headers)
  const metadata = cleanRecord(w.metadata)
  const allEvents = w.events.length === WEBHOOK_EVENTS.length
  if (!headers && !metadata && allEvents) return w.url.trim()
  return {
    url: w.url.trim(),
    ...(headers ? { headers } : {}),
    ...(metadata ? { metadata } : {}),
    ...(allEvents ? {} : { events: w.events }),
  }
}

/** Minimal POST /v2/batch/scrape body (server defaults stripped). */
export function buildBatchBody(form: BatchFormState): Record<string, unknown> {
  const { urls } = parseUrlList(form.urlsText)
  const body: Record<string, unknown> = {
    urls,
    ...cleanScrapeOptions({ ...form.options, formats: form.formats }),
  }
  if (!form.ignoreInvalidURLs) body.ignoreInvalidURLs = false
  if (form.maxConcurrency && form.maxConcurrency > 0) body.maxConcurrency = Math.floor(form.maxConcurrency)
  if (form.zeroDataRetention) body.zeroDataRetention = true
  if (form.appendToId.trim()) body.appendToId = form.appendToId.trim()
  const webhook = buildWebhook(form.webhook)
  if (webhook) body.webhook = webhook
  return body
}

/** Pull http(s) URLs out of an uploaded .txt / .csv file (quotes, columns and headers are ignored). */
export function extractUrlsFromFile(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s,;"'<>]+/gi) ?? []
  if (matches.length) return matches
  // Fallback: bare domains, one per line / cell.
  return text
    .split(/[\r\n,;\t]+/)
    .map(s => s.trim().replace(/^["']|["']$/g, ''))
    .filter(s => /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s))
}

/** Concatenated markdown for export. */
export function documentsToMarkdown(docs: Document[]): string {
  return docs
    .map(d => {
      const url = d.metadata?.sourceURL ?? d.metadata?.url ?? d.url ?? ''
      const title = d.metadata?.title ?? d.title
      const header = [`<!-- source: ${url} -->`, title ? `# ${title}` : `# ${url}`].join('\n')
      return `${header}\n\n${d.markdown ?? '_No markdown content (request the markdown format)._'}`
    })
    .join('\n\n---\n\n')
}
