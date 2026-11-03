import * as React from 'react'
import { BotIcon, PlusIcon, RotateCcwIcon } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { JsonViewer } from '@/components/shared/JsonViewer'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { isTerminalStatus, type AgentRequest } from '@/lib/api/types'
import { updateJob, useJobHistory } from '@/lib/job-history'
import { formatDate, formatNumber, formatRelative } from '@/lib/utils'
import { DataResultView } from '@/features/extract/components/DataResultView'
import { JobSummary, type JobStat } from '@/features/extract/components/JobSummary'
import { RecentJobsCard } from '@/features/extract/components/RecentJobsCard'
import { getJobRequest } from '@/features/extract/request-store'

import { useAgentStatus } from './api'
import { AgentActivity } from './components/AgentActivity'
import { CancelAgentButton } from './components/CancelAgentButton'
import { AGENT_MODELS } from './types'

export function AgentJobPage() {
  const { jobId = '' } = useParams()
  const navigate = useNavigate()
  const history = useJobHistory('agent')
  const entry = history.find(j => j.id === jobId)
  const request = React.useMemo(() => getJobRequest<AgentRequest>(jobId), [jobId])

  // After a successful DELETE the status endpoint keeps saying "processing" until the agent service
  // records the run, so a local "cancelled" in the job history wins over a server "processing".
  const locallyCancelled = entry?.status === 'cancelled'
  const query = useAgentStatus(jobId, d => isTerminalStatus(d.status) || locallyCancelled)
  const { data } = query
  const serverStatus = data?.status
  const status = locallyCancelled && serverStatus === 'processing' ? 'cancelled' : serverStatus

  React.useEffect(() => {
    if (!jobId || !serverStatus) return
    if (locallyCancelled && serverStatus === 'processing') return
    updateJob(jobId, { status: serverStatus })
  }, [jobId, serverStatus, locallyCancelled])

  const running = status === 'processing'
  const failed = status === 'failed' || status === 'cancelled'
  const modelLabel = AGENT_MODELS.find(m => m.value === (data?.model ?? request?.model))?.label

  const stats: JobStat[] = []
  if (data) {
    stats.push({ label: 'Credits used', value: formatNumber(data.creditsUsed) })
    stats.push({ label: 'Model', value: modelLabel ?? data.model ?? '—' })
    if (request?.maxCredits != null) stats.push({ label: 'Max credits', value: formatNumber(request.maxCredits) })
    stats.push({
      label: 'Expires',
      value: data.expiresAt ? formatRelative(data.expiresAt) : '—',
      hint: data.expiresAt ? formatDate(data.expiresAt) : undefined,
    })
  }

  const markCancelled = () => {
    updateJob(jobId, { status: 'cancelled' })
    query.refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BotIcon}
        title="Agent run"
        description={request?.prompt ?? entry?.label ?? 'Agent results'}
        actions={
          <>
            {running && <CancelAgentButton jobId={jobId} onCancelled={markCancelled} onAlreadyFinished={() => query.refetch()} />}
            {request && (
              <Button variant="outline" size="sm" onClick={() => navigate('/agent', { state: { body: request } })}>
                <RotateCcwIcon /> Run again
              </Button>
            )}
            <Button size="sm" asChild>
              <Link to="/agent">
                <PlusIcon /> New run
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          {query.isError && <ErrorAlert error={query.error} title="Could not load agent run" onRetry={() => query.refetch()} />}

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
              <JobSummary id={jobId} status={status} createdAt={entry?.createdAt} isPolling={query.isPolling} stats={stats}>
                {running && <AgentActivity hasWebhook={!!request?.webhook} />}
              </JobSummary>

              {failed && (
                <Alert variant={status === 'cancelled' ? 'warning' : 'destructive'}>
                  <AlertTitle>{status === 'cancelled' ? 'Agent cancelled' : 'Agent failed'}</AlertTitle>
                  <AlertDescription>
                    {data.error ||
                      (status === 'cancelled'
                        ? 'This run was cancelled before it produced a result.'
                        : 'The agent did not complete successfully.')}
                  </AlertDescription>
                </Alert>
              )}

              {(request?.urls?.length || request?.schema) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Task</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="whitespace-pre-wrap">{request.prompt}</p>
                    {!!request.urls?.length && (
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs font-medium">
                          Starting URLs{request.strictConstrainToURLs ? ' (strict)' : ''}
                        </p>
                        <ul className="space-y-0.5">
                          {request.urls.map(u => (
                            <li key={u} className="truncate font-mono text-xs">
                              <a href={u} target="_blank" rel="noreferrer" className="hover:underline">
                                {u}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {request.schema && (
                      <Collapsible>
                        <CollapsibleTrigger className="text-primary text-xs hover:underline">Output schema</CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <JsonViewer data={request.schema} toolbar={false} maxHeight="16rem" />
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Result</CardTitle>
                </CardHeader>
                <CardContent>
                  {running ? (
                    <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
                      <div className="bg-primary/50 h-1 w-40 animate-pulse rounded-full" />
                      Agent runs can take a few minutes. You can leave this page — the run continues and is listed under
                      recent runs.
                    </div>
                  ) : (
                    <DataResultView
                      key={jobId}
                      data={data.data}
                      filename={`agent-${jobId.slice(0, 8)}`}
                      emptyDescription={failed ? 'No result was produced.' : undefined}
                    />
                  )}
                </CardContent>
              </Card>

              {request && <RequestPreview method="POST" path="/agent" body={request} title="Original request" />}
              <RequestPreview method="GET" path={`/agent/${jobId}`} title="Status request" />

              <Collapsible className="rounded-lg border">
                <CollapsibleTrigger className="hover:bg-muted/50 w-full rounded-lg px-3 py-2 text-left text-sm font-medium">
                  Raw status response
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t p-3">
                  <JsonViewer data={data} collapsed={2} filename={`agent-${jobId}.json`} />
                </CollapsibleContent>
              </Collapsible>
            </>
          ) : null}
        </div>

        <aside className="space-y-6">
          <RecentJobsCard kind="agent" title="Recent agent runs" activeId={jobId} />
        </aside>
      </div>
    </div>
  )
}
