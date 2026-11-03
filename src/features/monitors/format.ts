import { shortUrl } from '@/lib/utils'

import type { MonitorCheck, MonitorTarget } from './types'

/** One-line description of a target. */
export function describeTarget(t: MonitorTarget): string {
  if (t.type === 'scrape') {
    const first = t.urls[0] ? shortUrl(t.urls[0]) : ''
    return t.urls.length > 1 ? `${first} +${t.urls.length - 1}` : first
  }
  if (t.type === 'crawl') return `Crawl ${shortUrl(t.url)}`
  const first = t.queries[0] ?? ''
  return t.queries.length > 1 ? `“${first}” +${t.queries.length - 1}` : `“${first}”`
}

/** Compact summary of all targets, e.g. "3 pages · 1 crawl · 2 queries". */
export function summarizeTargets(targets: MonitorTarget[]): string {
  let pages = 0
  let crawls = 0
  let queries = 0
  for (const t of targets) {
    if (t.type === 'scrape') pages += t.urls.length
    else if (t.type === 'crawl') crawls += 1
    else queries += t.queries.length
  }
  const parts: string[] = []
  if (pages) parts.push(`${pages} page${pages === 1 ? '' : 's'}`)
  if (crawls) parts.push(`${crawls} crawl${crawls === 1 ? '' : 's'}`)
  if (queries) parts.push(`${queries} quer${queries === 1 ? 'y' : 'ies'}`)
  return parts.join(' · ') || 'No targets'
}

export function checkDurationMs(check: Pick<MonitorCheck, 'startedAt' | 'finishedAt'>): number | null {
  if (!check.startedAt || !check.finishedAt) return null
  const ms = new Date(check.finishedAt).getTime() - new Date(check.startedAt).getTime()
  return Number.isFinite(ms) && ms >= 0 ? ms : null
}

export function humanizeStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

export type FieldDiff = Record<string, { previous: unknown; current: unknown }>

/** True when `value` looks like the per-field `{ previous, current }` diff produced for JSON monitors. */
export function isFieldDiff(value: unknown): value is FieldDiff {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const entries = Object.values(value as Record<string, unknown>)
  return (
    entries.length > 0 &&
    entries.every(v => !!v && typeof v === 'object' && ('previous' in (v as object) || 'current' in (v as object)))
  )
}
