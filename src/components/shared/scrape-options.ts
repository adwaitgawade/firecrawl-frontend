import type {
  Action,
  FormatInput,
  FormatObject,
  FormatType,
  Location,
  Parser,
  ScrapeOptions,
} from '@/lib/api/types'

/**
 * Sensible starting value for `ScrapeOptionsForm` / scrape-like request bodies. Mirrors the server
 * defaults so that `cleanScrapeOptions(defaultScrapeOptions)` → `{ formats: ['markdown'] }`.
 */
export const defaultScrapeOptions: ScrapeOptions = {
  formats: ['markdown'],
  onlyMainContent: true,
  onlyCleanContent: false,
  waitFor: 0,
  mobile: false,
  blockAds: true,
  proxy: 'auto',
  removeBase64Images: true,
  fastMode: false,
  storeInCache: true,
  lockdown: false,
}

/** Server-side defaults; fields equal to these are stripped by `cleanScrapeOptions`. */
const SERVER_DEFAULTS: Partial<Record<keyof ScrapeOptions, unknown>> = {
  onlyMainContent: true,
  onlyCleanContent: false,
  waitFor: 0,
  mobile: false,
  blockAds: true,
  proxy: 'auto',
  removeBase64Images: true,
  fastMode: false,
  storeInCache: true,
  lockdown: false,
  redactPII: false,
}

function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (typeof v === 'number') return Number.isNaN(v)
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') return Object.keys(v as object).length === 0
  return false
}

function cleanLocation(loc: Location | undefined): Location | undefined {
  if (!loc) return undefined
  const out: Location = {}
  if (loc.country && loc.country.trim()) out.country = loc.country.trim()
  const langs = (loc.languages ?? []).map(l => l.trim()).filter(Boolean)
  if (langs.length) out.languages = langs
  return Object.keys(out).length ? out : undefined
}

function cleanHeaders(h: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!h) return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(h)) {
    if (k.trim()) out[k.trim()] = v
  }
  return Object.keys(out).length ? out : undefined
}

function isDefaultParsers(p: Parser[] | undefined): boolean {
  return !!p && p.length === 1 && (p[0] === 'pdf' || (typeof p[0] === 'object' && p[0].type === 'pdf' && !p[0].mode && !p[0].maxPages))
}

/**
 * Strip empty and server-default values so request bodies stay minimal.
 *
 * - removes `undefined`/`null`/`''`/`NaN`, empty arrays (except `parsers: []`, which disables PDF
 *   parsing) and empty objects
 * - removes fields equal to server defaults (onlyMainContent: true, waitFor: 0, proxy: 'auto', …)
 * - `parsers` equal to the default `['pdf']` is removed
 * - trims list entries (includeTags, excludeTags) and drops blank header keys / location fields
 * - `formats` is passed through untouched (defaults differ between endpoints, e.g. search uses [])
 *
 * Works on any object that extends ScrapeOptions (extra keys like `url` are preserved, but also
 * stripped when empty).
 */
export function cleanScrapeOptions<T extends ScrapeOptions>(opts: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [key, raw] of Object.entries(opts) as [string, unknown][]) {
    let value = raw
    switch (key) {
      case 'formats':
        if (value !== undefined) out.formats = value
        continue
      case 'parsers':
        if (Array.isArray(value) && !isDefaultParsers(value as Parser[])) out.parsers = value
        continue
      case 'location':
        value = cleanLocation(value as Location | undefined)
        break
      case 'headers':
        value = cleanHeaders(value as Record<string, string> | undefined)
        break
      case 'includeTags':
      case 'excludeTags':
        value = Array.isArray(value)
          ? (value as string[]).map(s => s.trim()).filter(Boolean)
          : value
        break
      case 'profile': {
        const p = value as ScrapeOptions['profile']
        value = p && p.name && p.name.trim() ? { ...p, name: p.name.trim() } : undefined
        break
      }
      case 'actions':
        value = Array.isArray(value) ? (value as Action[]) : undefined
        break
    }
    if (isEmptyValue(value)) continue
    if (key in SERVER_DEFAULTS && SERVER_DEFAULTS[key as keyof ScrapeOptions] === value) continue
    out[key] = value
  }
  return out as Partial<T>
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

/** Normalize a formats array to objects (`'markdown'` → `{ type: 'markdown' }`). */
export function normalizeFormats(formats: FormatInput[] | undefined): FormatObject[] {
  return (formats ?? []).map(f => (typeof f === 'string' ? ({ type: f } as FormatObject) : f))
}

/** Whether a formats array includes the given format type. */
export function hasFormat(formats: FormatInput[] | undefined, type: FormatType): boolean {
  return (formats ?? []).some(f => (typeof f === 'string' ? f : f.type) === type)
}

/** Find the (normalized) format object of a given type. */
export function getFormat<T extends FormatType>(
  formats: FormatInput[] | undefined,
  type: T,
): Extract<FormatObject, { type: T }> | undefined {
  return normalizeFormats(formats).find(f => f.type === type) as
    | Extract<FormatObject, { type: T }>
    | undefined
}

/** Client-side mirror of the server's formats refinements. Returns human-readable problems. */
export function validateFormats(formats: FormatInput[] | undefined): string[] {
  const errors: string[] = []
  const list = normalizeFormats(formats)
  if (list.filter(f => f.type === 'screenshot').length > 1) {
    errors.push('You may only specify one screenshot format.')
  }
  if (list.some(f => f.type === 'changeTracking') && !list.some(f => f.type === 'markdown')) {
    errors.push('The changeTracking format requires the markdown format as well.')
  }
  if (list.some(f => f.type === 'json') && list.some(f => f.type === 'deterministicJson')) {
    errors.push('Cannot specify both json and deterministicJson formats.')
  }
  for (const f of list) {
    if (f.type === 'question' && !f.question.trim()) errors.push('The question format needs a question.')
    if (f.type === 'highlights' && !f.query.trim()) errors.push('The highlights format needs a query.')
    if (f.type === 'attributes' && f.selectors.length === 0)
      errors.push('The attributes format needs at least one selector.')
  }
  return errors
}

/** Parse a JSON string; returns `{ value }` or `{ error }`. Empty input → `{ value: undefined }`. */
export function parseJson<T = unknown>(text: string): { value?: T; error?: string } {
  if (!text.trim()) return { value: undefined }
  try {
    return { value: JSON.parse(text) as T }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Invalid JSON' }
  }
}
