import { CalendarClockIcon, CoinsIcon, TimerIcon } from 'lucide-react'

import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { BatchScrapeStatusResponse } from '@/lib/api/types'
import { cn, formatDate, formatDuration, formatNumber, formatRelative } from '@/lib/utils'

interface BatchProgressCardProps {
  status: BatchScrapeStatusResponse
  isPolling: boolean
  fetching: boolean
}

function Meta({ icon: Icon, label, value, title }: { icon: typeof CoinsIcon; label: string; value: string; title?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5" title={title}>
      <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{label}</p>
        <p className="truncate text-sm font-medium tabular-nums">{value}</p>
      </div>
    </div>
  )
}

export function BatchProgressCard({ status, isPolling, fetching }: BatchProgressCardProps) {
  const pct = status.total > 0 ? Math.round((status.completed / status.total) * 100) : status.status === 'completed' ? 100 : 0
  const indicator =
    status.status === 'failed'
      ? 'bg-destructive'
      : status.status === 'cancelled'
        ? 'bg-muted-foreground'
        : status.status === 'completed'
          ? 'bg-success'
          : undefined
  // `creditsUsed` is -1 when billing info isn't available (e.g. self-hosted without DB auth).
  const credits = status.creditsUsed >= 0 ? formatNumber(status.creditsUsed) : '—'
  const duration = status.duration !== undefined ? formatDuration(status.duration * 1000) : '—'

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={status.status} />
              {isPolling && (
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <span className={cn('bg-info size-1.5 rounded-full', fetching && 'animate-pulse')} />
                  Live
                </span>
              )}
            </div>
            <p className="text-sm tabular-nums">
              <span className="font-semibold">{formatNumber(status.completed)}</span>
              <span className="text-muted-foreground"> / {formatNumber(status.total)} pages · {pct}%</span>
            </p>
          </div>
          <Progress value={pct} indicatorClassName={indicator} aria-label="Batch progress" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Meta icon={CoinsIcon} label="Credits used" value={credits} />
          <Meta
            icon={TimerIcon}
            label="Duration"
            value={duration}
            title={status.createdAt ? `Started ${formatDate(status.createdAt)}` : undefined}
          />
          <Meta
            icon={CalendarClockIcon}
            label="Results expire"
            value={formatRelative(status.expiresAt)}
            title={formatDate(status.expiresAt)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
