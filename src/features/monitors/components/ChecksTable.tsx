import { HistoryIcon, RefreshCwIcon } from 'lucide-react'

import { EmptyState, ErrorAlert, RequestPreview, StatusBadge } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn, formatDate, formatDuration, formatNumber, formatRelative } from '@/lib/utils'

import { PAGE_SIZE, useMonitorChecks } from '../api'
import { checkDurationMs, humanizeStatus } from '../format'
import { MONITOR_CHECK_STATUSES, type MonitorCheckStatus } from '../types'
import { Pager } from './Pager'
import { SummaryCounts } from './SummaryCounts'

interface ChecksTableProps {
  monitorId: string
  running: boolean
  offset: number
  status?: MonitorCheckStatus
  onOffsetChange: (offset: number) => void
  onStatusChange: (status: MonitorCheckStatus | undefined) => void
  onSelect: (checkId: string) => void
}

export function ChecksTable({ monitorId, running, offset, status, onOffsetChange, onStatusChange, onSelect }: ChecksTableProps) {
  const query = useMonitorChecks(monitorId, offset, status, running)
  const checks = query.data?.data ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <HistoryIcon className="text-muted-foreground size-4" /> Check history
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select
            value={status ?? 'all'}
            onValueChange={v => onStatusChange(v === 'all' ? undefined : (v as MonitorCheckStatus))}
          >
            <SelectTrigger size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {MONITOR_CHECK_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="capitalize">
                  {humanizeStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Refresh checks"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCwIcon className={cn(query.isFetching && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {query.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorAlert error={query.error} title="Could not load checks" onRetry={() => void query.refetch()} />
        ) : checks.length === 0 && offset === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title={status ? `No ${humanizeStatus(status)} checks` : 'No checks yet'}
            description={status ? 'Try another status filter.' : 'Checks appear here after the first scheduled run, or press “Run now”.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="hidden sm:table-cell">Trigger</TableHead>
                    <TableHead className="hidden md:table-cell">Duration</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checks.map(c => {
                    const duration = checkDurationMs(c)
                    const when = c.startedAt ?? c.scheduledFor ?? c.createdAt
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        tabIndex={0}
                        onClick={() => onSelect(c.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSelect(c.id)
                          }
                        }}
                      >
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap" title={formatDate(when, 'PPpp')}>
                          {formatRelative(when)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{c.trigger}</Badge>
                        </TableCell>
                        <TableCell className="hidden font-mono text-sm md:table-cell">
                          {duration !== null ? formatDuration(duration) : '—'}
                        </TableCell>
                        <TableCell>
                          {c.error && c.status === 'failed' ? (
                            <span className="text-destructive line-clamp-1 text-xs" title={c.error}>
                              {c.error}
                            </span>
                          ) : (
                            <SummaryCounts summary={c.summary} />
                          )}
                        </TableCell>
                        <TableCell className="hidden text-right font-mono text-sm lg:table-cell">
                          {formatNumber(c.actualCredits ?? c.estimatedCredits)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <Pager offset={offset} limit={PAGE_SIZE} count={checks.length} onChange={onOffsetChange} disabled={query.isFetching} />
          </>
        )}
        <RequestPreview method="GET" path={`/monitor/${monitorId}/checks`} query={{ limit: PAGE_SIZE, offset, status }} />
      </CardContent>
    </Card>
  )
}
