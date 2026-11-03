import * as React from 'react'
import { ExternalLinkIcon, FileTextIcon, Loader2Icon, SearchIcon } from 'lucide-react'

import { DocumentViewer } from '@/components/shared/DocumentViewer'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Document } from '@/lib/api/types'
import { formatNumber, shortUrl } from '@/lib/utils'

import { documentKey, documentTitle, documentUrl, statusCodeTone } from '../documents'

const PAGE_SIZE = 200

export interface CrawlResultsListProps {
  documents: Document[]
  live: boolean
  canLoadMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
  loadMoreError: Error | null
  totalCompleted?: number
}

export function CrawlResultsList({
  documents,
  live,
  canLoadMore,
  onLoadMore,
  isLoadingMore,
  loadMoreError,
  totalCompleted,
}: CrawlResultsListProps) {
  const [filter, setFilter] = React.useState('')
  const [visible, setVisible] = React.useState(PAGE_SIZE)
  const [selected, setSelected] = React.useState<Document | null>(null)

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return documents
    return documents.filter(d => documentUrl(d).toLowerCase().includes(q) || documentTitle(d).toLowerCase().includes(q))
  }, [documents, filter])
  const shown = filtered.slice(0, visible)

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={live ? <Loader2Icon className="size-6 animate-spin" /> : FileTextIcon}
        title={live ? 'Waiting for the first pages…' : 'No pages crawled'}
        description={
          live
            ? 'Results stream in here as soon as pages finish scraping.'
            : 'This crawl did not return any documents. Check the Errors tab for failed or robots-blocked URLs.'
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            className="pl-8"
            placeholder="Filter by URL or title"
            value={filter}
            onChange={e => {
              setFilter(e.target.value)
              setVisible(PAGE_SIZE)
            }}
          />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {live && (
            <span className="text-success flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-75" />
                <span className="bg-success relative inline-flex size-2 rounded-full" />
              </span>
              Live
            </span>
          )}
          <span>
            {filter ? `${formatNumber(filtered.length)} of ` : ''}
            {formatNumber(documents.length)}
            {totalCompleted !== undefined && totalCompleted > documents.length ? ` / ${formatNumber(totalCompleted)}` : ''} pages
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Page</TableHead>
              <TableHead className="w-20 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground py-8 text-center text-sm">
                  No pages match “{filter}”.
                </TableCell>
              </TableRow>
            ) : (
              shown.map((doc, i) => {
                const url = documentUrl(doc)
                const title = documentTitle(doc)
                const code = doc.metadata?.statusCode
                return (
                  <TableRow key={documentKey(doc)} className="cursor-pointer" onClick={() => setSelected(doc)}>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">{i + 1}</TableCell>
                    <TableCell className="max-w-0 w-full">
                      <div className="truncate text-sm font-medium">{title || <span className="text-muted-foreground italic">Untitled</span>}</div>
                      <div className="text-muted-foreground truncate font-mono text-xs" title={url}>
                        {shortUrl(url)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {code ? <Badge variant={statusCodeTone(code)}>{code}</Badge> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {filtered.length > visible && (
          <Button variant="outline" size="sm" onClick={() => setVisible(v => v + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
          </Button>
        )}
        {canLoadMore && (
          <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore && <Loader2Icon className="animate-spin" />}
            Load more from server
          </Button>
        )}
      </div>
      {loadMoreError && <ErrorAlert error={loadMoreError} title="Could not load the next page" />}

      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="w-full gap-0 sm:max-w-3xl">
          {selected && (
            <>
              <SheetHeader className="border-b pr-12">
                <SheetTitle className="truncate">{documentTitle(selected) || 'Untitled page'}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <span className="truncate font-mono text-xs">{documentUrl(selected)}</span>
                  {documentUrl(selected) && (
                    <a
                      href={documentUrl(selected)}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground shrink-0"
                      aria-label="Open page in a new tab"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  )}
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <DocumentViewer document={selected} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
