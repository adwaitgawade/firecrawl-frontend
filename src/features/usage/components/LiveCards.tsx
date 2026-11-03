import * as React from 'react'
import { ActivityIcon, CheckCircle2Icon, GaugeIcon, ListOrderedIcon } from 'lucide-react'

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatNumber, formatRelative } from '@/lib/utils'

import { useConcurrency, useQueueStatus } from '../api'
import { ratioOf } from '../lib'
import { InlineError } from './InlineError'
import { Meter } from './Meter'

function LiveDot({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <span className="relative flex size-2" aria-label="Auto-refreshing">
      <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" />
      <span className="bg-success relative inline-flex size-2 rounded-full" />
    </span>
  )
}

function ConcurrencyCard({ autoRefresh }: { autoRefresh: boolean }) {
  const q = useConcurrency(autoRefresh)
  const d = q.data
  const ratio = ratioOf(d?.concurrency, d?.maxConcurrency)
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GaugeIcon className="text-muted-foreground size-4" /> Concurrency
        </CardTitle>
        <CardDescription>Active jobs vs. your concurrency limit</CardDescription>
        <CardAction>
          <LiveDot active={autoRefresh && !q.isError} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.isPending ? (
          <>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-2 w-full" />
          </>
        ) : q.isError ? (
          <InlineError error={q.error} onRetry={() => q.refetch()} retrying={q.isFetching} />
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums">{formatNumber(d?.concurrency)}</span>
              <span className="text-muted-foreground text-sm">/ {formatNumber(d?.maxConcurrency)} max</span>
            </div>
            <Meter
              ratio={ratio ?? 0}
              label={`Concurrency ${d?.concurrency ?? 0} of ${d?.maxConcurrency ?? 0}`}
            />
            <p className="text-muted-foreground text-xs">
              {ratio == null
                ? 'No concurrency limit reported'
                : ratio >= 1
                  ? 'At your limit — new jobs will queue until a slot frees up'
                  : `${formatNumber(Math.max(0, (d?.maxConcurrency ?? 0) - (d?.concurrency ?? 0)))} slots free`}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function QueueFigure({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="bg-muted/40 min-w-0 rounded-lg border px-3 py-2">
      <div className="text-muted-foreground flex items-center gap-1 truncate text-xs">
        {icon}
        {label}
      </div>
      <div className="truncate text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function QueueStatusCard({ autoRefresh }: { autoRefresh: boolean }) {
  const q = useQueueStatus(autoRefresh)
  const d = q.data
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrderedIcon className="text-muted-foreground size-4" /> Queue status
        </CardTitle>
        <CardDescription>Jobs currently queued for your team</CardDescription>
        <CardAction>
          <LiveDot active={autoRefresh && !q.isError} />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.isPending ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : q.isError ? (
          <InlineError error={q.error} onRetry={() => q.refetch()} retrying={q.isFetching} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <QueueFigure label="In queue" value={formatNumber(d?.jobsInQueue)} />
              <QueueFigure
                label="Active"
                value={formatNumber(d?.activeJobsInQueue)}
                icon={<ActivityIcon className="size-3" />}
              />
              <QueueFigure label="Waiting" value={formatNumber(d?.waitingJobsInQueue)} />
              <QueueFigure label="Max concurrency" value={formatNumber(d?.maxConcurrency)} />
            </div>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <CheckCircle2Icon className="text-success size-3.5" />
              Most recent success:{' '}
              {d?.mostRecentSuccess ? (
                <span className="text-foreground" title={formatDate(d.mostRecentSuccess)}>
                  {formatRelative(d.mostRecentSuccess)}
                </span>
              ) : (
                'none recorded'
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

/** Concurrency + queue cards; polled every 10s while `autoRefresh` is on. */
export function LiveCards({ autoRefresh }: { autoRefresh: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ConcurrencyCard autoRefresh={autoRefresh} />
      <QueueStatusCard autoRefresh={autoRefresh} />
    </div>
  )
}
