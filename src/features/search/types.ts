import type {
  FormatInput,
  ImageSearchResult,
  NewsSearchResult,
  ScrapeOptions,
  SearchCategoryType,
  SearchResponse,
  SearchSourceType,
  WebSearchResult,
} from '@/lib/api/types'

export type HighlightsMode = 'auto' | 'on' | 'off'

export interface SearchFormState {
  query: string
  limit: number
  sources: SearchSourceType[]
  categories: SearchCategoryType[]
  /** 'any' | a `qdr:*` preset | 'custom' */
  time: string
  /** yyyy-mm-dd (custom range) */
  customFrom: string
  customTo: string
  lang: string
  /** '' = server default (us, unless a location is set) */
  country: string
  location: string
  timeoutSec: string
  ignoreInvalidURLs: boolean
  includeDomains: string[]
  excludeDomains: string[]
  highlights: HighlightsMode
  scrape: boolean
  formats: FormatInput[]
  scrapeOptions: ScrapeOptions
}

/** Result groups returned in `data` (developer comes from the developer category). */
export type ResultGroup = 'web' | 'news' | 'images' | 'developer'

export type AnySearchResult = WebSearchResult | NewsSearchResult | ImageSearchResult

/** Search response plus client-measured round-trip time. */
export interface TimedSearchResponse extends SearchResponse {
  durationMs: number
}
