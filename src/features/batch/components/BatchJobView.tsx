import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, LayersIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { CopyButton } from '@/components/shared/CopyButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isFirecrawlApiError } from '@/lib/api/client'
import { isTerminalStatus, type Document } from '@/lib/api/types'
import { usePollingQuery } from '@/lib/hooks/use-polling'
import { addJob, getJobs, updateJob } from '@/lib/job-history'

import { batchPath, documentKey, getBatchStatus, pageFromNext, type PageQuery } from '../api'
import { useBatchErrors } from '../hooks'
import { isUuid } from '../request'
import type { BatchJobLocationState } from '../types'
import { BatchErrorsPanel } from './BatchErrorsPanel'
import { BatchProgressCard } from './BatchProgressCard'
import { BatchResultsTable } from './BatchResultsTable'
import { CancelBatchButton } from './CancelBatchButton'
import { DocumentSheet } from './DocumentSheet'
import { ExportMenu } from './ExportMenu'

interface ExtraPage {
  docs: Document[]
  next?: PageQuery
}

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link to="/batch">
        <ArrowLeftIcon /> Batch scrape
      </Link>
    </Button>
  )
}

export function BatchJobView({ jobId }: { jobId: string }) {
  const location = useLocation()
  const queryClient = useQueryClient()
  const invalidURLs = (location.state as BatchJobLocationState | null)?.invalidURLs ?? []
  const validId = isUuid(jobId)

  const statusQuery = usePollingQuery(['batch', jobId], signal => getBatchStatus(jobId, {}, signal), {
    intervalMs: 3000,
    enabled: validId,
  })
  const status = statusQuery.data
  const errorsQuery = useBatchErrors(jobId, status?.status)

  const [extra, setExtra] = React.useState<ExtraPage[]>([])
  const [selected, setSelected] = React.useState<Document | null>(null)
  const [tab, setTab] = React.useState('results')

  const loadMore = useMutation({
    mutationFn: (page: PageQuery) => getBatchStatus(jobId, page),
    onSuccess: res => setExtra(prev => [...prev, { docs: res.data ?? [], next: pageFromNext(res.next) }]),
  })

  // Keep local job history in sync with the live status.
  const liveStatus = status?.status
  const firstUrl = status?.data?.[0]?.metadata?.sourceURL
  React.useEffect(() => {
    if (!liveStatus) return
    if (getJobs('batch').some(j => j.id === jobId)) updateJob(jobId, { status: liveStatus })
    else addJob({ kind: 'batch', id: jobId, label: firstUrl ?? `Batch ${jobId.slice(0, 8)}`, status: liveStatus })
  }, [jobId, liveStatus, firstUrl])

  const docs = React.useMemo(() => {
    const seen = new Set<string>()
    const out: Document[] = []
    for (const [i, d] of [...(status?.data ?? []), ...extra.flatMap(p => p.docs)].entries()) {
      const key = documentKey(d, i)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(d)
    }
    return out
  }, [status?.data, extra])

  if (!validId) {
    return (
      <div className="space-y-6">
        <BackLink />
        <EmptyState icon={LayersIcon} title="Invalid job ID" description={`“${jobId}” is not a valid batch job ID.`} />
      </div>
    )
  }

  const terminal = isTerminalStatus(status?.status)
  const isScraping = status?.status === 'scraping'
  const lastExtra = extra[extra.length - 1]
  const nextPage = lastExtra ? lastExtra.next : pageFromNext(status?.next)
  const lastEmpty = lastExtra ? lastExtra.docs.length === 0 : (status?.data?.length ?? 0) === 0
  const hasMore = !!nextPage && !(terminal && lastEmpty)
  const errorCount = (errorsQuery.data?.errors.length ?? 0) + (errorsQuery.data?.robotsBlocked.length ?? 0)

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['batch', jobId] })
  }

  const notFound = isFirecrawlApiError(statusQuery.error) && statusQuery.error.status === 404

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackLink />
        <PageHeader
          icon={LayersIcon}
          title="Batch job"
          description={
            <span className="inline-flex max-w-full items-center gap-1">
              <span className="truncate font-mono text-xs">{jobId}</span>
              <CopyButton value={jobId} size="icon-sm" className="size-6" toastMessage="Job ID copied" />
            </span>
          }
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={refresh} disabled={statusQuery.isFetching}>
                <RefreshCwIcon className={statusQuery.isFetching ? 'animate-spin' : undefined} /> Refresh
              </Button>
              <ExportMenu jobId={jobId} disabled={!status} isScraping={isScraping} />
              {isScraping && <CancelBatchButton jobId={jobId} onCancelled={refresh} />}
            </>
          }
        />
      </div>

      {invalidURLs.length > 0 && (
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertTitle>
            {invalidURLs.length} URL{invalidURLs.length === 1 ? ' was' : 's were'} skipped as invalid or blocked
          </AlertTitle>
          <AlertDescription>
            <ul className="max-h-32 w-full overflow-auto font-mono text-xs">
              {invalidURLs.map(u => (
                <li key={u} className="truncate">
                  {u}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {statusQuery.isPending ? (
        <Card>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-2 w-full" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </CardContent>
        </Card>
      ) : !status ? (
        <ErrorAlert
          error={statusQuery.error}
          title={notFound ? 'Batch job not found (it may have expired)' : 'Could not load batch job'}
          onRetry={() => void statusQuery.refetch()}
        />
      ) : (
        <>
          {statusQuery.isError && (
            <ErrorAlert error={statusQuery.error} title="Live updates stopped" onRetry={() => void statusQuery.refetch()} />
          )}
          <BatchProgressCard status={status} isPolling={statusQuery.isPolling} fetching={statusQuery.isFetching} />

          {status.error && (
            <Alert variant="destructive">
              <TriangleAlertIcon />
              <AlertTitle>Batch failed</AlertTitle>
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          )}
          {status.warning && (
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>{status.warning}</AlertDescription>
            </Alert>
          )}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="results">
                Results
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] tabular-nums">
                  {docs.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="errors">
                Errors
                {errorCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px] tabular-nums">
                    {errorCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="results" className="pt-2">
              <BatchResultsTable
                docs={docs}
                onSelect={setSelected}
                isScraping={isScraping}
                hasMore={hasMore}
                onLoadMore={() => nextPage && loadMore.mutate(nextPage)}
                loadingMore={loadMore.isPending}
                loadMoreError={loadMore.error}
              />
            </TabsContent>
            <TabsContent value="errors" className="pt-2">
              <BatchErrorsPanel jobId={jobId} query={errorsQuery} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <RequestPreview method="GET" path={batchPath(jobId)} />
      <DocumentSheet doc={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
