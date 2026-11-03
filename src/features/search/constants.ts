import type { SearchCategoryType, SearchSourceType } from '@/lib/api/types'

export const SOURCE_OPTIONS: { value: SearchSourceType; label: string; description: string }[] = [
  { value: 'web', label: 'Web', description: 'Regular web results' },
  { value: 'news', label: 'News', description: 'News articles with dates' },
  { value: 'images', label: 'Images', description: 'Image results' },
]

export const CATEGORY_OPTIONS: { value: SearchCategoryType; label: string; description: string }[] = [
  { value: 'github', label: 'GitHub', description: 'Repositories, code and issues' },
  { value: 'research', label: 'Research', description: 'Papers and academic sources' },
  { value: 'pdf', label: 'PDF', description: 'PDF documents' },
  { value: 'developer', label: 'Developer', description: 'Developer docs and code search' },
]

/** `tbs` presets (Google-style time-based search). `custom` builds a `cdr:1,...` range. */
export const TIME_OPTIONS: { value: string; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'qdr:h', label: 'Past hour' },
  { value: 'qdr:d', label: 'Past 24 hours' },
  { value: 'qdr:w', label: 'Past week' },
  { value: 'qdr:m', label: 'Past month' },
  { value: 'qdr:y', label: 'Past year' },
  { value: 'custom', label: 'Custom range…' },
]

export const DEFAULT_LIMIT = 10
export const DEFAULT_TIMEOUT_MS = 60000

export const COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'in', label: 'India' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'es', label: 'Spain' },
  { value: 'it', label: 'Italy' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'br', label: 'Brazil' },
  { value: 'mx', label: 'Mexico' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'South Korea' },
  { value: 'sg', label: 'Singapore' },
]

export const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh-cn', label: 'Chinese (Simplified)' },
  { value: 'hi', label: 'Hindi' },
]

export const EXAMPLE_QUERIES = [
  'firecrawl web scraping api',
  'latest open source LLM releases',
  'best practices for RAG pipelines',
]
