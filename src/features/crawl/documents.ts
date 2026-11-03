import type { Document } from '@/lib/api/types'
import { downloadFile } from '@/lib/utils'

export function documentUrl(doc: Document): string {
  return doc.metadata?.url ?? doc.metadata?.sourceURL ?? doc.url ?? ''
}

export function documentTitle(doc: Document): string {
  return doc.metadata?.title ?? doc.title ?? doc.metadata?.ogTitle ?? ''
}

/** Stable identity of a crawled document, used to merge WebSocket and REST results. */
export function documentKey(doc: Document): string {
  return doc.metadata?.scrapeId ?? `${documentUrl(doc)}#${doc.metadata?.statusCode ?? ''}`
}

/** Append `incoming` to `existing`, skipping documents already present. Returns `existing` if nothing new. */
export function mergeDocuments(existing: Document[], incoming: Document[]): Document[] {
  if (incoming.length === 0) return existing
  const seen = new Set(existing.map(documentKey))
  const added: Document[] = []
  for (const doc of incoming) {
    const key = documentKey(doc)
    if (seen.has(key)) continue
    seen.add(key)
    added.push(doc)
  }
  return added.length ? [...existing, ...added] : existing
}

export function documentsToMarkdown(docs: Document[]): string {
  return docs
    .map(doc => {
      const title = documentTitle(doc) || documentUrl(doc) || 'Untitled'
      const body = doc.markdown?.trim() || '_No markdown content (the markdown format was not requested)._'
      return `# ${title}\n\nSource: ${documentUrl(doc)}\n\n${body}\n`
    })
    .join('\n---\n\n')
}

export function exportDocuments(jobId: string, docs: Document[], format: 'json' | 'markdown') {
  const base = `crawl-${jobId.slice(0, 8)}`
  if (format === 'json') {
    downloadFile(`${base}.json`, JSON.stringify(docs, null, 2), 'application/json')
  } else {
    downloadFile(`${base}.md`, documentsToMarkdown(docs), 'text/markdown;charset=utf-8')
  }
}

export function statusCodeTone(code: number | undefined): 'success' | 'warning' | 'destructive' | 'muted' {
  if (!code) return 'muted'
  if (code >= 200 && code < 300) return 'success'
  if (code >= 300 && code < 400) return 'warning'
  return 'destructive'
}
