import type { SitemapMode } from '@/lib/api/types'

/** Map form state. Only the options `controllers/v2/map.ts` actually uses are exposed. */
export interface MapFormState {
  url: string
  search: string
  /** 1–100000, server default 5000 */
  limit?: number
  sitemap: SitemapMode
  /** server default true */
  includeSubdomains: boolean
  /** server default true */
  ignoreQueryParameters: boolean
  /** server default false */
  allowExternalLinks: boolean
  /** server default true */
  filterByPath: boolean
  /** server default true */
  useIndex: boolean
  /** server default false */
  ignoreCache: boolean
  /** ms */
  timeout?: number
  country: string
  languages?: string[]
  headers: Record<string, string>
}

export type MapViewMode = 'list' | 'tree'

export interface PathTreeNode {
  /** Segment label (host for root nodes). */
  name: string
  /** Full URL when this node itself is a mapped link. */
  url?: string
  title?: string
  children: PathTreeNode[]
  /** Number of mapped links in this subtree (including the node itself). */
  count: number
}
