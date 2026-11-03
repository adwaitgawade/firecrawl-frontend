import { useQuery } from '@tanstack/react-query'
import { BotOffIcon, CircleCheckIcon, RefreshCwIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared/CopyButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn, formatDate, shortUrl } from '@/lib/utils'

import { crawlKeys, getCrawlErrors } from '../api'

export function CrawlErrorsPanel({ jobId, live }: { jobId: string; live: boolean }) {
  const query = useQuery({
    queryKey: crawlKeys.errors(jobId),
    queryFn: ({ signal }) => getCrawlErrors(jobId, signal),
    refetchInterval: live ? 5000 : false,
  })

  if (query.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }
  if (query.isError) return <ErrorAlert error={query.error} title="Could not load crawl errors" onRetry={() => query.refetch()} />

  const errors = query.data?.errors ?? []
  const robots = query.data?.robotsBlocked ?? []

  return (
    <div className="space-y-6">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          {errors.length} failed · {robots.length} blocked by robots.txt
        </span>
        <Button variant="ghost" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCwIcon className={cn(query.isFetching && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {errors.length === 0 && robots.length === 0 && (
        <EmptyState icon={CircleCheckIcon} title="No errors" description="Every discovered page was scraped successfully so far." />
      )}

      {errors.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium">Failed pages</h3>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="hidden md:table-cell">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map(err => (
                  <TableRow key={err.id}>
                    <TableCell className="max-w-56 align-top">
                      <a href={err.url} target="_blank" rel="noreferrer" className="block truncate font-mono text-xs hover:underline" title={err.url}>
                        {shortUrl(err.url)}
                      </a>
                    </TableCell>
                    <TableCell className="align-top whitespace-normal">
                      {err.code && (
                        <Badge variant="destructive" className="mb-1 font-mono">
                          {err.code}
                        </Badge>
                      )}
                      <p className="text-xs break-words">{err.error}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden align-top text-xs whitespace-nowrap md:table-cell">
                      {formatDate(err.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {robots.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <BotOffIcon className="text-warning size-4" /> Blocked by robots.txt
            </h3>
            <CopyButton value={() => robots.join('\n')} label="Copy URLs" size="sm" />
          </div>
          <p className="text-muted-foreground text-xs">
            These URLs were skipped because robots.txt disallows them. Use the Scrape endpoint to fetch them individually.
          </p>
          <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
            {robots.map(url => (
              <li key={url} className="truncate px-3 py-2 font-mono text-xs" title={url}>
                {url}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
