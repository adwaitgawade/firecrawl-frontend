import { isFirecrawlApiError } from '@/lib/api/client'
import { formatNumber } from '@/lib/utils'

import type { ActivityEndpoint, ActivityItem, UsagePeriod } from './types'

/** Categorical slots from the theme (fixed order, never cycled). */
const SERIES_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)'] as const
/** Neutral for the folded "Other" bucket so it never competes with a real key. */
const OTHER_COLOR = 'var(--muted-foreground)'
const OTHER_LABEL = 'Other keys'

export interface ChartSeries {
  /** Safe recharts dataKey (`s0`, `s1`, …). */
  dataKey: string
  name: string
  color: string
  total: number
}

export interface ChartRow {
  label: string
  /** Full period description used in tooltips / table. */
  range: string
  current: boolean
  total: number
  [dataKey: string]: string | number | boolean
}

/** Month label in UTC — the API buckets by UTC calendar month. */
export function monthLabel(iso: string | null, opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }): string {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return d.toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' })
}

function rangeLabel(start: string | null, end: string | null): string {
  const s = monthLabel(start, { month: 'short', day: 'numeric', year: 'numeric' })
  if (!end) return `${s} – now`
  const endDate = new Date(end)
  // `endDate` is the (exclusive) start of the next month; show the inclusive last day.
  const inclusive = Number.isNaN(endDate.getTime())
    ? null
    : new Date(endDate.getTime() - 24 * 60 * 60 * 1000).toISOString()
  return `${s} – ${monthLabel(inclusive, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

/**
 * Pivot API periods into one row per month. With `byApiKey`, each key becomes a stacked series;
 * the top keys (by total) keep a categorical color, the rest fold into "Other keys".
 */
export function buildChartData(
  periods: UsagePeriod[],
  byApiKey: boolean,
): { rows: ChartRow[]; series: ChartSeries[] } {
  const totalsByKey = new Map<string, number>()
  if (byApiKey) {
    for (const p of periods) {
      const k = p.apiKey || 'Unknown'
      totalsByKey.set(k, (totalsByKey.get(k) ?? 0) + p.value)
    }
  }

  // Decide which keys get their own slot (by volume), then order those alphabetically so a key's
  // color depends on its identity, not its rank.
  const ranked = [...totalsByKey.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k)
  const needsOther = ranked.length > SERIES_COLORS.length
  const keptCount = Math.min(ranked.length, SERIES_COLORS.length)
  const kept = ranked.slice(0, keptCount).sort((a, b) => a.localeCompare(b))
  const keptSet = new Set(kept)

  const series: ChartSeries[] = byApiKey
    ? kept.map((name, i) => ({
        dataKey: `s${i}`,
        name,
        color: SERIES_COLORS[i],
        total: totalsByKey.get(name) ?? 0,
      }))
    : [{ dataKey: 's0', name: 'Usage', color: SERIES_COLORS[0], total: 0 }]
  if (byApiKey && needsOther) {
    const otherTotal = ranked.slice(keptCount).reduce((sum, k) => sum + (totalsByKey.get(k) ?? 0), 0)
    series.push({ dataKey: 'other', name: OTHER_LABEL, color: OTHER_COLOR, total: otherTotal })
  }
  const keyToDataKey = new Map(series.map(s => [s.name, s.dataKey]))

  const rowsByMonth = new Map<string, ChartRow>()
  for (const p of periods) {
    const id = p.startDate ?? 'unknown'
    let row = rowsByMonth.get(id)
    if (!row) {
      row = {
        label: monthLabel(p.startDate),
        range: rangeLabel(p.startDate, p.endDate),
        current: p.endDate === null,
        total: 0,
      }
      for (const s of series) row[s.dataKey] = 0
      rowsByMonth.set(id, row)
    }
    const dataKey = byApiKey
      ? keptSet.has(p.apiKey || 'Unknown')
        ? keyToDataKey.get(p.apiKey || 'Unknown')!
        : 'other'
      : 's0'
    row[dataKey] = (row[dataKey] as number) + p.value
    row.total += p.value
  }

  // API already sorts ascending by startDate; Map preserves insertion order.
  const rows = [...rowsByMonth.values()]
  if (!byApiKey) series[0].total = rows.reduce((sum, r) => sum + r.total, 0)
  return { rows, series }
}

export const compactNumber = (n: number) =>
  formatNumber(n, Math.abs(n) >= 10_000 ? { notation: 'compact', maximumFractionDigits: 1 } : undefined)

export const ACTIVITY_ENDPOINT_LABELS: Record<ActivityEndpoint, string> = {
  scrape: 'Scrape',
  crawl: 'Crawl',
  batch_scrape: 'Batch scrape',
  search: 'Search',
  extract: 'Extract',
  llmstxt: 'LLMs.txt',
  deep_research: 'Deep research',
  map: 'Map',
  agent: 'Agent',
  browser: 'Browser',
  interact: 'Interact',
}

export function endpointLabel(endpoint: string | null): string {
  if (!endpoint) return 'Unknown'
  return ACTIVITY_ENDPOINT_LABELS[endpoint as ActivityEndpoint] ?? endpoint
}

/** Detail route for an activity row whose id is a job/session id this app can open. */
export function activityHref(item: Pick<ActivityItem, 'endpoint' | 'id'>): string | null {
  const id = encodeURIComponent(item.id)
  switch (item.endpoint) {
    case 'crawl':
      return `/crawl/${id}`
    case 'batch_scrape':
      return `/batch/${id}`
    case 'extract':
      return `/extract/${id}`
    case 'agent':
      return `/agent/${id}`
    case 'browser':
      return `/browser/${id}`
    default:
      return null
  }
}

/** Playground route for endpoints without a detail page (scrape, search, map). */
export function activityPlaygroundHref(item: Pick<ActivityItem, 'endpoint' | 'target'>): string | null {
  const target = item.target ?? ''
  const isUrl = /^https?:\/\//i.test(target)
  switch (item.endpoint) {
    case 'scrape':
      return isUrl ? `/scrape?url=${encodeURIComponent(target)}` : '/scrape'
    case 'map':
      return isUrl ? `/map?url=${encodeURIComponent(target)}` : '/map'
    case 'search':
      return target && !isUrl ? `/search?q=${encodeURIComponent(target)}` : '/search'
    default:
      return null
  }
}

/** Short, human summary of why a usage endpoint failed (self-hosted deployments often lack billing/DB). */
export function describeUsageError(error: unknown): string {
  if (isFirecrawlApiError(error)) {
    if (error.status === 0) return 'API unreachable'
    if (error.status === 401 || error.status === 403) return 'Not authorized'
    if (error.status === 404) return 'Not available on this deployment'
    if (error.status >= 500) return 'Unavailable on this deployment'
  }
  return 'Failed to load'
}

/** Whole days from now until `iso` (negative when in the past), or null for empty/invalid input. */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  return Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000))
}

/** Fraction of `part` over `whole`, or null when it can't be computed meaningfully. */
export function ratioOf(part: number | null | undefined, whole: number | null | undefined): number | null {
  if (part == null || whole == null || !Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return null
  return part / whole
}
