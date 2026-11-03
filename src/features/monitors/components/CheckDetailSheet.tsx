import * as React from 'react'
import { FileSearchIcon, Loader2Icon } from 'lucide-react'

import { EmptyState, ErrorAlert, JsonViewer, RequestPreview, StatusBadge, getErrorMessage } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn, formatDate, formatDuration, formatNumber } from '@/lib/utils'

import { PAGE_SIZE, fetchCheckPage, useMonitorCheck } from '../api'
import { checkDurationMs, humanizeStatus } from '../format'
import type { MonitorCheckDetail, MonitorCheckPage, MonitorPageStatus, MonitorSummary } from '../types'
import { MONITOR_PAGE_STATUSES } from '../types'
import { CheckPageCard } from './CheckPageCard'

const SUMMARY_TILES: { key: keyof MonitorSummary; label: string; className?: string }[] = [
  { key: 'totalPages', label: 'Pages' },
  { key: 'same', label: 'Same' },
  { key: 'changed', label: 'Changed', className: 'text-warning' },
  { key: 'new', label: 'New', className: 'text-info' },
  { key: 'removed', label: 'Removed', className: 'text-destructive' },
  { key: 'error', label: 'Errors', className: 'text-destructive' },
]

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

function CheckSummary({ check }: { check: MonitorCheckDetail }) {
  const duration = checkDurationMs(check)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SUMMARY_TILES.map(t => (
          <div key={t.key} className="rounded-lg border p-2 text-center">
            <div className={cn('text-lg font-semibold tabular-nums', check.summary[t.key] > 0 && t.className)}>
              {formatNumber(check.summary[t.key])}
            </div>
            <div className="text-muted-foreground text-xs">{t.label}</div>
          </div>
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="Trigger">
          <Badge variant="outline">{check.trigger}</Badge>
        </Meta>
        <Meta label="Started">{formatDate(check.startedAt ?? check.scheduledFor ?? check.createdAt)}</Meta>
        <Meta label="Duration">{duration !== null ? formatDuration(duration) : '—'}</Meta>
        <Meta label="Credits">
          {formatNumber(check.actualCredits ?? check.reservedCredits ?? check.estimatedCredits)}
          {check.actualCredits == null && check.estimatedCredits != null && (
            <span className="text-muted-foreground text-xs"> (est.)</span>
          )}
        </Meta>
      </dl>
      {check.error && (
        <Alert variant="destructive">
          <AlertTitle>Check error</AlertTitle>
          <AlertDescription className="font-mono text-xs break-words">{check.error}</AlertDescription>
        </Alert>
      )}
      {(check.notificationStatus != null || check.targetResults != null) && (
        <details className="rounded-lg border">
          <summary className="hover:bg-muted/50 cursor-pointer px-3 py-2 text-sm font-medium">
            Notifications &amp; target results
          </summary>
          <div className="space-y-3 border-t p-3">
            {check.notificationStatus != null && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Notification status</p>
                <JsonViewer data={check.notificationStatus} collapsed={2} maxHeight="16rem" />
              </div>
            )}
            {check.targetResults != null && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Target results</p>
                <JsonViewer data={check.targetResults} collapsed={2} maxHeight="16rem" />
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}

function PagesList({
  monitorId,
  checkId,
  status,
  initial,
}: {
  monitorId: string
  checkId: string
  status?: MonitorPageStatus
  initial: { pages: MonitorCheckPage[]; next?: string }
}) {
  const [extra, setExtra] = React.useState<MonitorCheckPage[]>([])
  const [hasMoreOverride, setHasMoreOverride] = React.useState<boolean | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<unknown>(null)
  const pages = [...initial.pages, ...extra]
  const hasMore = hasMoreOverride ?? !!initial.next

  const loadMore = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchCheckPage(monitorId, checkId, pages.length, status)
      setExtra(e => [...e, ...res.data.pages])
      setHasMoreOverride(!!(res.next ?? res.data.next))
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  if (pages.length === 0) {
    return <EmptyState icon={FileSearchIcon} title="No pages" description="No pages match this filter for this check." />
  }

  return (
    <div className="space-y-2">
      {pages.map((p, i) => (
        <CheckPageCard key={p.id} page={p} defaultOpen={i < 3 && (p.status === 'changed' || p.status === 'new')} />
      ))}
      {error != null && <p className="text-destructive text-xs">{getErrorMessage(error)}</p>}
      {hasMore && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => void loadMore()} disabled={loading}>
          {loading && <Loader2Icon className="animate-spin" />} Load {PAGE_SIZE} more
        </Button>
      )}
    </div>
  )
}

function CheckDetail({ monitorId, checkId }: { monitorId: string; checkId: string }) {
  const [status, setStatus] = React.useState<MonitorPageStatus | undefined>(undefined)
  const query = useMonitorCheck(monitorId, checkId, status)
  const check = query.data?.data

  if (query.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (query.isError) return <ErrorAlert error={query.error} title="Could not load check" onRetry={() => void query.refetch()} />
  if (!check) return null

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <StatusBadge status={check.status} />
        <span className="text-muted-foreground text-xs capitalize">{humanizeStatus(check.status)}</span>
        {(check.status === 'queued' || check.status === 'running') && (
          <Loader2Icon className="text-primary size-4 animate-spin" />
        )}
      </div>
      <CheckSummary check={check} />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Pages</h3>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={status ?? 'all'}
            onValueChange={v => v && setStatus(v === 'all' ? undefined : (v as MonitorPageStatus))}
            className="flex-wrap"
          >
            <ToggleGroupItem value="all" className="px-2 text-xs">
              All
            </ToggleGroupItem>
            {MONITOR_PAGE_STATUSES.map(s => (
              <ToggleGroupItem key={s} value={s} className="px-2 text-xs capitalize">
                {s}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        {query.isFetching && query.isPlaceholderData ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <PagesList
            key={`${status ?? 'all'}-${query.dataUpdatedAt}`}
            monitorId={monitorId}
            checkId={checkId}
            status={status}
            initial={{ pages: check.pages, next: query.data.next ?? check.next }}
          />
        )}
      </div>

      <RequestPreview
        method="GET"
        path={`/monitor/${monitorId}/checks/${checkId}`}
        query={{ limit: PAGE_SIZE, status }}
      />
    </div>
  )
}

export function CheckDetailSheet({
  monitorId,
  checkId,
  onClose,
}: {
  monitorId: string
  checkId: string | null
  onClose: () => void
}) {
  return (
    <Sheet open={!!checkId} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Check details</SheetTitle>
          <SheetDescription className="font-mono text-xs">{checkId}</SheetDescription>
        </SheetHeader>
        {checkId && (
          <div className="px-4 pb-6">
            <CheckDetail key={checkId} monitorId={monitorId} checkId={checkId} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

