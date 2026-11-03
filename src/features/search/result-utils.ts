import type { Document, DocumentMetadata, NewsSearchResult, SearchData, WebSearchResult } from '@/lib/api/types'

import type { ResultGroup } from './types'

const CONTENT_KEYS = [
  'markdown',
  'html',
  'rawHtml',
  'links',
  'images',
  'screenshot',
  'summary',
  'json',
  'product',
  'menu',
] as const

/** True when a web/news result carries scraped content (i.e. `scrapeOptions.formats` was set). */
export function hasScrapedContent(result: WebSearchResult | NewsSearchResult): boolean {
  const r = result as unknown as Record<string, unknown>
  return CONTENT_KEYS.some(k => {
    const v = r[k]
    return v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0) && v !== ''
  })
}

/** Adapt a scraped search result to the shared `Document` shape for `DocumentViewer`. */
export function toDocument(result: WebSearchResult | NewsSearchResult): Document {
  const { metadata, ...rest } = result as (WebSearchResult | NewsSearchResult) & Record<string, unknown>
  const meta = (metadata ?? {}) as Partial<DocumentMetadata>
  return {
    ...(rest as Omit<Document, 'metadata'>),
    metadata: {
      ...meta,
      statusCode: typeof meta.statusCode === 'number' ? meta.statusCode : 200,
      title: meta.title ?? result.title,
      sourceURL: meta.sourceURL ?? result.url,
    },
  }
}

export const GROUP_LABELS: Record<ResultGroup, string> = {
  web: 'Web',
  news: 'News',
  images: 'Images',
  developer: 'Developer',
}

/** Non-empty result groups in a stable display order. */
export function resultGroups(data: SearchData | undefined): { group: ResultGroup; count: number }[] {
  if (!data) return []
  const order: ResultGroup[] = ['web', 'news', 'images', 'developer']
  return order
    .map(group => ({ group, count: data[group]?.length ?? 0 }))
    .filter(g => g.count > 0)
}

export function totalResults(data: SearchData | undefined): number {
  return resultGroups(data).reduce((n, g) => n + g.count, 0)
}

export function hostOf(url: string | undefined): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
