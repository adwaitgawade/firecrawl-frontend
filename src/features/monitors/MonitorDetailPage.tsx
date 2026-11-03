import * as React from 'react'
import { ArrowLeftIcon, Loader2Icon, PencilIcon, PlayIcon, RadarIcon } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { EmptyState, ErrorAlert, PageHeader, RequestPreview, StatusBadge, getErrorMessage } from '@/components/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isFirecrawlApiError } from '@/lib/api/client'

import { useMonitor, useRunMonitor, useUpdateMonitor } from './api'
import { CheckDetailSheet } from './components/CheckDetailSheet'
import { ChecksTable } from './components/ChecksTable'
import { DeleteMonitorButton } from './components/DeleteMonitorButton'
import { MonitorForm } from './components/MonitorForm'
import { MonitorOverview } from './components/MonitorOverview'
import { MonitorStatusToggle } from './components/MonitorStatusToggle'
import { formStateFromMonitor } from './form-state'
import type { Monitor, MonitorCheckStatus } from './types'

function BackLink() {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2">
      <Link to="/monitors">
        <ArrowLeftIcon /> All monitors
      </Link>
    </Button>
  )
}

function runningCheckId(error: unknown): string | null {
  if (!isFirecrawlApiError(error) || error.status !== 409) return null
  const body = error.body as { checkId?: unknown } | undefined
  return typeof body?.checkId === 'string' ? body.checkId : null
}

function EditMonitor({ monitor, onDone }: { monitor: Monitor; onDone: () => void }) {
  const update = useUpdateMonitor()
  const [initial] = React.useState(() => formStateFromMonitor(monitor))
  return (
    <MonitorForm
      mode="edit"
      existing={monitor}
      initial={initial}
      pending={update.isPending}
      error={update.error}
      onCancel={onDone}
      onSubmit={body =>
        update.mutate(
          { id: monitor.id, body },
          {
            onSuccess: () => {
              toast.success('Monitor updated')
              onDone()
            },
          },
        )
      }
    />
  )
}

export function MonitorDetailPage() {
  const { monitorId = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const query = useMonitor(monitorId)
  const run = useRunMonitor()
  const [checksOffset, setChecksOffset] = React.useState(0)
  const [checksStatus, setChecksStatus] = React.useState<MonitorCheckStatus | undefined>(undefined)

  const editing = params.get('edit') === '1'
  const selectedCheck = params.get('check')
  const setParam = (key: string, value: string | null) =>
    setParams(
      prev => {
        const next = new URLSearchParams(prev)
        if (value === null) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: key === 'check' ? false : true },
    )

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (query.isError) {
    const notFound = isFirecrawlApiError(query.error) && (query.error.status === 404 || query.error.status === 400)
    return (
      <div className="space-y-6">
        <BackLink />
        {notFound ? (
          <EmptyState
            icon={RadarIcon}
            title="Monitor not found"
            description="It may have been deleted, or it belongs to a different team."
            action={
              <Button asChild variant="outline">
                <Link to="/monitors">Back to monitors</Link>
              </Button>
            }
          />
        ) : (
          <ErrorAlert error={query.error} title="Could not load monitor" onRetry={() => void query.refetch()} />
        )}
      </div>
    )
  }

  const monitor = query.data.data
  const isRunning = !!monitor.currentCheckId

  const onRun = () =>
    run.mutate(monitor.id, {
      onSuccess: res => {
        toast.success('Check started')
        setParam('check', res.id)
      },
      onError: err => {
        const existing = runningCheckId(err)
        if (existing) {
          toast.info('A check is already running')
          setParam('check', existing)
        } else {
          toast.error(getErrorMessage(err))
        }
      },
    })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackLink />
        <PageHeader
          icon={RadarIcon}
          title={
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate">{monitor.name}</span>
              <StatusBadge status={monitor.status} />
            </span>
          }
          description={<span className="font-mono text-xs">{monitor.id}</span>}
          actions={
            !editing && (
              <div className="flex flex-wrap items-center gap-2">
                <MonitorStatusToggle monitor={monitor} showLabel />
                <Button
                  variant="outline"
                  onClick={onRun}
                  disabled={run.isPending || isRunning || monitor.status === 'paused'}
                  title={monitor.status === 'paused' ? 'Resume the monitor to run a check' : undefined}
                >
                  {run.isPending || isRunning ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
                  {isRunning ? 'Running…' : 'Run now'}
                </Button>
                <Button variant="outline" onClick={() => setParam('edit', '1')}>
                  <PencilIcon /> Edit
                </Button>
                <DeleteMonitorButton monitorId={monitor.id} name={monitor.name} onDeleted={() => navigate('/monitors')} />
              </div>
            )
          }
        />
      </div>

      {editing ? (
        <div className="mx-auto max-w-4xl">
          <EditMonitor monitor={monitor} onDone={() => setParam('edit', null)} />
        </div>
      ) : (
        <>
          {isRunning && (
            <Alert variant="info">
              <Loader2Icon className="animate-spin" />
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>A check is in progress.</span>
                <Button size="sm" variant="outline" onClick={() => setParam('check', monitor.currentCheckId)}>
                  View progress
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <MonitorOverview monitor={monitor} />

          <ChecksTable
            monitorId={monitor.id}
            running={isRunning}
            offset={checksOffset}
            status={checksStatus}
            onOffsetChange={setChecksOffset}
            onStatusChange={s => {
              setChecksStatus(s)
              setChecksOffset(0)
            }}
            onSelect={id => setParam('check', id)}
          />

          <div className="space-y-2">
            <RequestPreview method="GET" path={`/monitor/${monitor.id}`} title="Get monitor" />
            <RequestPreview method="POST" path={`/monitor/${monitor.id}/run`} body={{}} title="Run now" />
          </div>
        </>
      )}

      <CheckDetailSheet monitorId={monitor.id} checkId={selectedCheck} onClose={() => setParam('check', null)} />
    </div>
  )
}
