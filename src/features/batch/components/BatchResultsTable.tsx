import * as React from 'react'
import { FileSearchIcon, Loader2Icon, SearchIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Document } from '@/lib/api/types'

interface BatchResultsTableProps {
  docs: Document[]
  onSelect: (doc: Document) => void
  isScraping: boolean
  hasMore: boolean
  onLoadMore: () => void
  loadingMore: boolean
  loadMoreError?: unknown
}

function statusVariant(code: number | undefined) {
  if (!code) return 'muted' as const
  if (code < 300) return 'success' as const
  if (code < 400) return 'info' as const
  if (code < 500) return 'warning' as const
  return 'destructive' as const
}

const urlOf = (d: Document) => d.metadata?.sourceURL ?? d.metadata?.url ?? d.url ?? ''

export function BatchResultsTable({
  docs,
  onSelect,
  isScraping,
  hasMore,
  onLoadMore,
  loadingMore,
  loadMoreError,
}: BatchResultsTableProps) {
  const [filter, setFilter] = React.useState('')
  const q = filter.trim().toLowerCase()
  const rows = React.useMemo(
    () =>
      docs
        .map((doc, i) => ({ doc, i }))
        .filter(({ doc }) => !q || urlOf(doc).toLowerCase().includes(q) || (doc.metadata?.title ?? '').toLowerCase().includes(q)),
    [docs, q],
  )

  if (docs.length === 0) {
    return (
      <EmptyState
        icon={isScraping ? <Loader2Icon className="size-6 animate-spin" /> : FileSearchIcon}
        title={isScraping ? 'Waiting for the first results…' : 'No results'}
        description={
          isScraping
            ? 'Pages appear here as soon as they are scraped.'
            : 'This job returned no documents. Check the Errors tab for failed URLs.'
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by URL or title"
          className="h-8 pl-8 text-sm"
        />
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-right">#</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="hidden md:table-cell">Title</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ doc, i }) => {
              const code = doc.metadata?.statusCode
              const hasError = typeof doc.metadata?.error === 'string'
              return (
                <TableRow
                  key={`${doc.metadata?.scrapeId ?? urlOf(doc)}-${i}`}
                  className="cursor-pointer"
                  tabIndex={0}
                  onClick={() => onSelect(doc)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(doc)
                    }
                  }}
                >
                  <TableCell className="text-muted-foreground text-right text-xs tabular-nums">{i + 1}</TableCell>
                  <TableCell className="max-w-0 min-w-40">
                    <p className="truncate font-mono text-xs" title={urlOf(doc)}>
                      {urlOf(doc)}
                    </p>
                    <p className="text-muted-foreground truncate text-xs md:hidden">{doc.metadata?.title}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={hasError ? 'destructive' : statusVariant(code)} className="font-mono" title={hasError ? String(doc.metadata.error) : undefined}>
                      {code || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden max-w-0 md:table-cell">
                    <p className="truncate text-sm" title={doc.metadata?.title}>
                      {doc.metadata?.title || <span className="text-muted-foreground italic">Untitled</span>}
                    </p>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                  No loaded results match “{filter}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {loadMoreError ? <ErrorAlert error={loadMoreError} title="Could not load more results" onRetry={onLoadMore} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {docs.length} result{docs.length === 1 ? '' : 's'} loaded
          {isScraping && ' · first page refreshes live while the job runs'}
        </p>
        {hasMore && (
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore && <Loader2Icon className="animate-spin" />}
            Load more
          </Button>
        )}
      </div>
    </div>
  )
}
