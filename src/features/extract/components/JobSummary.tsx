import * as React from 'react'
import { RefreshCwIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared/CopyButton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatDuration, formatRelative } from '@/lib/utils'

import { useNow } from '../use-now'

export interface JobStat {
  label: string
  value: React.ReactNode
  hint?: string
}

interface JobSummaryProps {
  id: string
  status?: string
  /** ISO time the job was submitted (from local history), if known. */
  createdAt?: string
  isPolling: boolean
  stats?: JobStat[]
  /** Extra content under the status row (e.g. activity text). */
  children?: React.ReactNode
}

/** Status row for an async job: badge, id, live elapsed time while running, and key numbers. */
export function JobSummary({ id, status, createdAt, isPolling, stats = [], children }: JobSummaryProps) {
  const running = isPolling && (!status || status === 'processing')
  const now = useNow(1000, running && !!createdAt)
  const started = createdAt ? new Date(createdAt).getTime() : undefined

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StatusBadge status={status ?? 'pending'} className="text-sm" />
          <div className="flex min-w-0 items-center gap-1">
            <code className="text-muted-foreground truncate font-mono text-xs">{id}</code>
            <CopyButton value={id} size="icon-sm" toastMessage="Job ID copied" />
          </div>
          {started !== undefined && (
            <span className="text-muted-foreground text-xs" title={formatDate(createdAt)}>
              {running ? `Running for ${formatDuration(Math.max(0, now - started))}` : `Started ${formatRelative(createdAt)}`}
            </span>
          )}
          {isPolling && (
            <span className="text-muted-foreground ml-auto flex items-center gap-1.5 text-xs">
              <RefreshCwIcon className="size-3 animate-spin" /> Polling every 2s
            </span>
          )}
        </div>
        {running && <div className="bg-primary/50 h-1 w-full animate-pulse rounded-full" aria-hidden />}
        {children}
        {stats.length > 0 && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map(s => (
              <div key={s.label} className="bg-muted/30 rounded-md border px-3 py-2" title={s.hint}>
                <dt className="text-muted-foreground text-xs">{s.label}</dt>
                <dd className="mt-0.5 truncate text-sm font-medium tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
