import { getSettings, maskApiKey } from '@/lib/config'
import { buildUrl, type QueryParams } from '@/lib/api/client'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface CurlOptions {
  method: HttpMethod | string
  /** `/v2`-relative path (e.g. `/scrape`) or absolute URL. */
  path: string
  body?: unknown
  query?: QueryParams
  /** Mask the API key (default true). */
  maskKey?: boolean
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/** Build an equivalent cURL command for a request using current settings. */
export function toCurl({ method, path, body, query, maskKey = true }: CurlOptions): string {
  const { apiKey } = getSettings()
  const m = method.toUpperCase()
  const lines = [`curl -X ${m} ${shellQuote(buildUrl(path, query))}`]
  const key = apiKey ? (maskKey ? maskApiKey(apiKey) : apiKey) : 'YOUR_API_KEY'
  lines.push(`-H ${shellQuote(`Authorization: Bearer ${key}`)}`)
  if (body !== undefined && m !== 'GET' && m !== 'DELETE') {
    lines.push(`-H 'Content-Type: application/json'`)
    lines.push(`-d ${shellQuote(JSON.stringify(body, null, 2))}`)
  }
  return lines.join(' \\\n  ')
}
