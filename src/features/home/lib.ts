import type { LucideIcon } from 'lucide-react'
import { CircleDotIcon } from 'lucide-react'

import type { JobKind } from '@/lib/job-history'
import { findNavItem, navGroups, type NavItem } from '@/lib/nav'

/** Root route of each job kind's feature page. */
const KIND_ROOT: Record<JobKind, string> = {
  scrape: '/scrape',
  batch: '/batch',
  crawl: '/crawl',
  extract: '/extract',
  agent: '/agent',
  browser: '/browser',
  search: '/search',
  map: '/map',
  parse: '/parse',
  monitor: '/monitors',
}

export interface KindMeta {
  label: string
  icon: LucideIcon
}

export function kindMeta(kind: JobKind): KindMeta {
  const item = findNavItem(KIND_ROOT[kind] ?? `/${kind}`)
  return { label: item?.title ?? kind, icon: item?.icon ?? CircleDotIcon }
}

export interface FeatureEntry extends NavItem {
  group: string
}

/** Tool pages (everything except the overview pages and settings), tagged with their nav group. */
export const featureEntries: FeatureEntry[] = navGroups
  .filter(g => g.title !== 'Overview' && g.title !== 'Settings')
  .flatMap(g => g.items.map(item => ({ ...item, group: g.title })))

/** Normalise user input into an absolute http(s) URL (adds `https://` when no scheme is given). */
export function normalizeUrlInput(value: string): string {
  const v = value.trim()
  if (!v) return v
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`
}

/** Host part of a URL for display, falling back to the raw string. */
export function displayHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
