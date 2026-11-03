import { cleanScrapeOptions, defaultScrapeOptions } from '@/components/shared/scrape-options'
import type { Action, FormatInput, ScrapeOptions } from '@/lib/api/types'

/** Everything the scrape form edits. */
export interface ScrapeFormState {
  url: string
  formats: FormatInput[]
  /** Scrape options other than `formats` / `actions`. */
  options: ScrapeOptions
  actions?: Action[]
  zeroDataRetention: boolean
}

export function initialFormState(url = ''): ScrapeFormState {
  const { formats, ...options } = defaultScrapeOptions
  return {
    url,
    formats: formats ?? ['markdown'],
    options,
    actions: undefined,
    zeroDataRetention: false,
  }
}

/** Minimal POST /v2/scrape body for the form (server defaults stripped). */
export function buildScrapeBody(state: ScrapeFormState): Record<string, unknown> {
  const cleaned = cleanScrapeOptions({
    ...state.options,
    formats: state.formats,
    actions: state.actions,
  })
  const body: Record<string, unknown> = { url: state.url.trim(), ...cleaned }
  if (state.zeroDataRetention) body.zeroDataRetention = true
  return body
}

/**
 * Map a raw JSON body back to form state (used when leaving the JSON tab). Unknown keys are kept in
 * `options` so they round-trip; `ScrapeOptionsForm` simply ignores them.
 */
export function bodyToFormState(body: Record<string, unknown>): ScrapeFormState {
  const base = initialFormState()
  const { url, formats, actions, zeroDataRetention, ...rest } = body
  return {
    url: typeof url === 'string' ? url : '',
    formats: Array.isArray(formats) ? (formats as FormatInput[]) : base.formats,
    actions: Array.isArray(actions) && actions.length ? (actions as Action[]) : undefined,
    zeroDataRetention: zeroDataRetention === true,
    options: { ...base.options, ...(rest as ScrapeOptions) },
  }
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}
