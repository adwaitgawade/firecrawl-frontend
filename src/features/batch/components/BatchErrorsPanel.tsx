import type { UseQueryResult } from '@tanstack/react-query'
import { CircleCheckIcon, ShieldAlertIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CrawlErrorsResponse } from '@/lib/api/types'
import { formatDate } from '@/lib/utils'

import { batchPath } from '../api'

interface BatchErrorsPanelProps {
  jobId: string
  query: UseQueryResult<CrawlErrorsResponse>
}

export function BatchErrorsPanel({ jobId, query }: BatchErrorsPanelProps) {
  const { data, isPending, isError, error, refetch } = query

  if (isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
    )
  }
  if (isError) return <ErrorAlert error={error} title="Could not load errors" onRetry={() => refetch()} />

  const errors = data?.errors ?? []
  const robots = data?.robotsBlocked ?? []

  return (
    <div className="space-y-4">
      {robots.length > 0 && (
        <Alert variant="warning">
          <ShieldAlertIcon />
          <AlertTitle>
            {robots.length} URL{robots.length === 1 ? '' : 's'} blocked by robots.txt
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-1 max-h-40 w-full space-y-0.5 overflow-auto font-mono text-xs">
              {robots.map(u => (
                <li key={u} className="truncate">
                  {u}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {errors.length === 0 ? (
        robots.length === 0 && (
          <EmptyState icon={CircleCheckIcon} title="No errors" description="Every URL processed so far succeeded." />
        )
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Error</TableHead>
                <TableHead className="hidden w-36 lg:table-cell">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="max-w-0 min-w-36">
                    <p className="truncate font-mono text-xs" title={e.url}>
                      {e.url}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-48 whitespace-normal">
                    {e.code && (
                      <Badge variant="destructive" className="mb-1 font-mono text-[10px]">
                        {e.code}
                      </Badge>
                    )}
                    <p className="text-sm break-words">{e.error}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                    {formatDate(e.timestamp, 'MMM d HH:mm:ss')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <RequestPreview method="GET" path={`${batchPath(jobId)}/errors`} />
    </div>
  )
}
