import { cleanScrapeOptions, defaultScrapeOptions, validateFormats } from '@/components/shared/scrape-options'
import type { SearchFormatInput, SearchRequest } from '@/lib/api/types'

import { DEFAULT_LIMIT, DEFAULT_TIMEOUT_MS } from './constants'
import type { SearchFormState } from './types'

const { formats: _formats, ...scrapeOptionsNoFormats } = defaultScrapeOptions

export function initialSearchForm(query = ''): SearchFormState {
  return {
    query,
    limit: DEFAULT_LIMIT,
    sources: ['web'],
    categories: [],
    time: 'any',
    customFrom: '',
    customTo: '',
    lang: 'en',
    country: '',
    location: '',
    timeoutSec: '',
    ignoreInvalidURLs: false,
    includeDomains: [],
    excludeDomains: [],
    highlights: 'auto',
    scrape: false,
    formats: ['markdown'],
    scrapeOptions: scrapeOptionsNoFormats,
  }
}

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/

/** Same hostname rule as the API's `searchDomainSchema`. */
export function invalidDomains(list: string[]): string[] {
  return list.filter(d => !DOMAIN_RE.test(d.trim().toLowerCase()))
}

/** yyyy-mm-dd → M/D/YYYY (Google `cd_min` / `cd_max` format). */
function toTbsDate(iso: string): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${Number(m[2])}/${Number(m[3])}/${m[1]}` : undefined
}

export function buildTbs(f: Pick<SearchFormState, 'time' | 'customFrom' | 'customTo'>): string | undefined {
  if (f.time === 'any') return undefined
  if (f.time !== 'custom') return f.time
  const min = toTbsDate(f.customFrom)
  const max = toTbsDate(f.customTo)
  if (!min && !max) return undefined
  return ['cdr:1', min && `cd_min:${min}`, max && `cd_max:${max}`].filter(Boolean).join(',')
}

/** Build the exact `POST /v2/search` body plus blocking validation errors. */
export function buildSearchBody(f: SearchFormState): { body: SearchRequest; errors: string[] } {
  const errors: string[] = []
  const query = f.query.trim()
  if (!query) errors.push('Enter a search query.')
  if (!f.sources.length) errors.push('Select at least one source.')
  if (f.includeDomains.length && f.excludeDomains.length)
    errors.push('Include domains and exclude domains cannot both be set.')
  const badDomains = invalidDomains([...f.includeDomains, ...f.excludeDomains])
  if (badDomains.length) errors.push(`Invalid domain(s): ${badDomains.join(', ')} — use bare hostnames like example.com.`)
  if (f.time === 'custom' && f.customFrom && f.customTo && f.customFrom > f.customTo)
    errors.push('Custom range start must be before its end.')
  const timeoutMs = f.timeoutSec.trim() ? Math.round(Number(f.timeoutSec) * 1000) : undefined
  if (timeoutMs !== undefined && (!Number.isFinite(timeoutMs) || timeoutMs <= 0)) errors.push('Timeout must be positive.')

  const body: SearchRequest = { query }
  if (f.limit !== DEFAULT_LIMIT) body.limit = f.limit
  if (f.sources.length && !(f.sources.length === 1 && f.sources[0] === 'web')) body.sources = f.sources
  if (f.categories.length) body.categories = f.categories
  const tbs = buildTbs(f)
  if (tbs) body.tbs = tbs
  if (f.lang && f.lang !== 'en') body.lang = f.lang
  if (f.country) body.country = f.country
  if (f.location.trim()) body.location = f.location.trim()
  if (timeoutMs && timeoutMs > 0 && timeoutMs !== DEFAULT_TIMEOUT_MS) body.timeout = timeoutMs
  if (f.ignoreInvalidURLs) body.ignoreInvalidURLs = true
  const include = f.includeDomains.map(d => d.trim().toLowerCase()).filter(Boolean)
  const exclude = f.excludeDomains.map(d => d.trim().toLowerCase()).filter(Boolean)
  if (include.length) body.includeDomains = include
  if (exclude.length) body.excludeDomains = exclude
  if (f.highlights !== 'auto') body.highlights = f.highlights === 'on'

  if (f.scrape) {
    if (!f.formats.length) errors.push('Pick at least one format to scrape results.')
    errors.push(...validateFormats(f.formats))
    const so = cleanScrapeOptions(f.scrapeOptions)
    body.scrapeOptions = { ...so, formats: f.formats as SearchFormatInput[] }
  }
  return { body, errors }
}
