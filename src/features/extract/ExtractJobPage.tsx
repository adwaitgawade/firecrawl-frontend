import * as React from 'react'
import { FileJsonIcon, PlusIcon, RotateCcwIcon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { JsonViewer } from '@/components/shared/JsonViewer'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { isTerminalStatus } from '@/lib/api/types'
import { updateJob, useJobHistory } from '@/lib/job-history'
import { formatDate, formatNumber, formatRelative } from '@/lib/utils'

import { useExtractStatus } from './api'
import { DataResultView } from './components/DataResultView'
import { ExtractSources } from './components/ExtractSources'
import { ExtractSteps } from './components/ExtractSteps'
import { JobSummary, type JobStat } from './components/JobSummary'
import { RecentJobsCard } from './components/RecentJobsCard'
import { UrlTraceTable } from './components/UrlTraceTable'
import { getJobRequest } from './request-store'
import type { ExtractRequestBody } from './types'

export function ExtractJobPage() {
  const { jobId = '' } = useParams()
  const navigate = useNavigate()
  const history = useJobHistory('extract')
  const entry = history.find(j => j.id === jobId)
  const request = React.useMemo(() => getJobRequest<ExtractRequestBody>(jobId), [jobId])
  const query = useExtractStatus(jobId)
  const { data } = query
  const status = data?.status

  React.useEffect(() => {
    if (status && jobId) updateJob(jobId, { status })
  }, [jobId, status])

  const terminal = isTerminalStatus(status)
  const failed = status === 'failed' || status === 'cancelled'

  const stats: JobStat[] = []
  if (data) {
    stats.push({ label: 'Credits used', value: formatNumber(data.creditsUsed) })
    stats.push({ label: 'Tokens billed', value: formatNumber(data.tokensUsed) })
    if (data.llmUsage != null) stats.push({ label: 'LLM usage', value: formatNumber(data.llmUsage) })
    stats.push({
      label: 'Expires',
      value: data.expiresAt ? formatRelative(data.expiresAt) : '—',
      hint: data.expiresAt ? formatDate(data.expiresAt) : undefined,
    })
    if (request?.urls?.length) stats.push({ label: 'URLs', value: formatNumber(request.urls.length) })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileJsonIcon}
        title="Extract job"
        description={entry?.label ?? request?.prompt ?? 'Structured extraction results'}
        actions={
          <>
            {request && (
              <Button variant="outline" size="sm" onClick={() => navigate('/extract', { state: { body: request } })}>
                <RotateCcwIcon /> Run again
              </Button>
            )}
            <Button size="sm" asChild>
              <Link to="/extract">
                <PlusIcon /> New extraction
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {query.isError && (
            <ErrorAlert error={query.error} title="Could not load extract job" onRetry={() => query.refetch()} />
          )}

          {query.isPending && !query.isError ? (
            <Card>
              <CardContent className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : data ? (
            <>
              <JobSummary
                id={jobId}
                status={status}
                createdAt={entry?.createdAt}
                isPolling={query.isPolling}
                stats={stats}
              />

              {failed && (
                <Alert variant="destructive">
                  <AlertTitle>Extraction {status}</AlertTitle>
                  <AlertDescription>{data.error || 'The job did not complete successfully.'}</AlertDescription>
                </Alert>
              )}
              {data.warning && (
                <Alert variant="warning">
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>{data.warning}</AlertDescription>
                </Alert>
              )}

              {!!data.steps?.length && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Steps</CardTitle>
                    <CardDescription>Latest pipeline steps reported by the worker.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExtractSteps steps={data.steps} running={!terminal} />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Extracted data</CardTitle>
                </CardHeader>
                <CardContent>
                  {!terminal ? (
                    <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
                      <div className="bg-primary/50 h-1 w-40 animate-pulse rounded-full" />
                      Extracting… results appear here when the job completes.
                    </div>
                  ) : (
                    <DataResultView
                      key={jobId}
                      data={data.data}
                      filename={`extract-${jobId.slice(0, 8)}`}
                      emptyDescription={failed ? 'The job failed before producing data.' : undefined}
                    />
                  )}
                </CardContent>
              </Card>

              {data.sources && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sources</CardTitle>
                    <CardDescription>Where each extracted value came from.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExtractSources sources={data.sources} />
                  </CardContent>
                </Card>
              )}

              {!!data.urlTrace?.length && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">URL trace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UrlTraceTable trace={data.urlTrace} />
                  </CardContent>
                </Card>
              )}

              {request && <RequestPreview method="POST" path="/extract" body={request} title="Original request" />}
              <RequestPreview method="GET" path={`/extract/${jobId}`} title="Status request" />

              <Collapsible className="rounded-lg border">
                <CollapsibleTrigger className="hover:bg-muted/50 w-full rounded-lg px-3 py-2 text-left text-sm font-medium">
                  Raw status response
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t p-3">
                  <JsonViewer data={data} collapsed={2} filename={`extract-${jobId}.json`} />
                </CollapsibleContent>
              </Collapsible>
            </>
          ) : null}
        </div>

        <aside className="space-y-6">
          <RecentJobsCard kind="extract" title="Recent extractions" activeId={jobId} />
        </aside>
      </div>
    </div>
  )
}
