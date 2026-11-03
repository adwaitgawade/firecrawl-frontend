import type { MapLink } from '@/lib/api/types'

import type { PathTreeNode } from './types'

interface MutableNode {
  name: string
  url?: string
  title?: string
  children: Map<string, MutableNode>
}

function finalize(node: MutableNode): PathTreeNode {
  const children = [...node.children.values()].map(finalize)
  // Folders (with children) first, then alphabetical.
  children.sort((a, b) => Number(b.children.length > 0) - Number(a.children.length > 0) || a.name.localeCompare(b.name))
  const count = (node.url ? 1 : 0) + children.reduce((sum, c) => sum + c.count, 0)
  return { name: node.name, url: node.url, title: node.title, children, count }
}

/** Group links into a host → path-segment tree. */
export function buildPathTree(links: MapLink[]): PathTreeNode[] {
  const roots = new Map<string, MutableNode>()
  for (const link of links) {
    let u: URL
    try {
      u = new URL(link.url)
    } catch {
      continue
    }
    let root = roots.get(u.host)
    if (!root) {
      root = { name: u.host, children: new Map() }
      roots.set(u.host, root)
    }
    let node: MutableNode = root
    const segments = u.pathname.split('/').filter(Boolean)
    if (u.search) {
      if (segments.length) segments[segments.length - 1] += u.search
      else segments.push(u.search)
    }
    for (const seg of segments) {
      let child: MutableNode | undefined = node.children.get(seg)
      if (!child) {
        child = { name: decodeSafe(seg), children: new Map() }
        node.children.set(seg, child)
      }
      node = child
    }
    node.url = link.url
    node.title = link.title
  }
  return [...roots.values()].map(finalize).sort((a, b) => b.count - a.count)
}

function decodeSafe(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}
