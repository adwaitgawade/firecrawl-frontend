import type { MapRequest } from '@/lib/api/types'
import { isValidUrl } from '@/lib/utils'

import type { MapFormState } from './types'

export const MAP_MAX_LIMIT = 100000
export const MAP_DEFAULT_LIMIT = 5000

export function initialMapForm(url = ''): MapFormState {
  return {
    url,
    search: '',
    limit: undefined,
    sitemap: 'include',
    includeSubdomains: true,
    ignoreQueryParameters: true,
    allowExternalLinks: false,
    filterByPath: true,
    useIndex: true,
    ignoreCache: false,
    timeout: undefined,
    country: '',
    languages: undefined,
    headers: {},
  }
}

/** The exact body sent to `POST /v2/map` — only non-default values are included. */
export function buildMapBody(state: MapFormState): MapRequest {
  const body: MapRequest = { url: state.url.trim() }
  if (state.search.trim()) body.search = state.search.trim()
  if (state.limit !== undefined && Number.isFinite(state.limit)) body.limit = state.limit
  if (state.sitemap !== 'include') body.sitemap = state.sitemap
  if (!state.includeSubdomains) body.includeSubdomains = false
  if (!state.ignoreQueryParameters) body.ignoreQueryParameters = false
  if (state.allowExternalLinks) body.allowExternalLinks = true
  if (!state.filterByPath) body.filterByPath = false
  if (!state.useIndex) body.useIndex = false
  if (state.ignoreCache) body.ignoreCache = true
  if (state.timeout !== undefined && state.timeout > 0) body.timeout = state.timeout
  const country = state.country.trim()
  const languages = (state.languages ?? []).map(l => l.trim()).filter(Boolean)
  if (country || languages.length) {
    body.location = {}
    if (country) body.location.country = country
    if (languages.length) body.location.languages = languages
  }
  const headers = Object.entries(state.headers).filter(([k]) => k.trim())
  if (headers.length) body.headers = Object.fromEntries(headers.map(([k, v]) => [k.trim(), v]))
  return body
}

export function validateMapForm(state: MapFormState): string[] {
  const errors: string[] = []
  if (!isValidUrl(state.url)) errors.push('Enter a valid URL to map.')
  if (state.limit !== undefined && (!Number.isInteger(state.limit) || state.limit < 1 || state.limit > MAP_MAX_LIMIT))
    errors.push(`Limit must be an integer between 1 and ${MAP_MAX_LIMIT.toLocaleString()}.`)
  if (state.timeout !== undefined && state.timeout <= 0) errors.push('Timeout must be a positive number of milliseconds.')
  const country = state.country.trim()
  if (country && !/^[a-z]{2}$/i.test(country) && !/^us-(generic|whitelist)$/i.test(country))
    errors.push('Country must be an ISO 3166-1 alpha-2 code (e.g. US, DE).')
  return errors
}
