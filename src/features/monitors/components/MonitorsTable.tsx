import { Loader2Icon } from 'lucide-react'
import { Link } from 'react-router'

import { StatusBadge } from '@/components/shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatRelative } from '@/lib/utils'

import { describeTarget, summarizeTargets } from '../format'
import { describeCron } from '../schedule'
import type { Monitor } from '../types'
import { DeleteMonitorButton } from './DeleteMonitorButton'
import { MonitorStatusToggle } from './MonitorStatusToggle'
import { SummaryCounts } from './SummaryCounts'

function TimeCell({ value, empty = '—' }: { value: string | null; empty?: string }) {
  if (!value) return <span className="text-muted-foreground">{empty}</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="whitespace-nowrap">{formatRelative(value)}</span>
      </TooltipTrigger>
      <TooltipContent>{formatDate(value, 'PPpp')}</TooltipContent>
    </Tooltip>
  )
}

export function MonitorsTable({ monitors }: { monitors: Monitor[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden lg:table-cell">Targets</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead className="hidden md:table-cell">Last check</TableHead>
            <TableHead className="hidden xl:table-cell">Next run</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Enabled</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {monitors.map(m => (
            <TableRow key={m.id}>
              <TableCell className="max-w-64">
                <Link to={`/monitors/${m.id}`} className="block truncate font-medium hover:underline" title={m.name}>
                  {m.name}
                </Link>
                <span className="text-muted-foreground block truncate text-xs lg:hidden">{summarizeTargets(m.targets)}</span>
              </TableCell>
              <TableCell className="hidden max-w-72 lg:table-cell">
                <div className="truncate text-sm">{summarizeTargets(m.targets)}</div>
                <div className="text-muted-foreground truncate font-mono text-xs" title={m.targets.map(describeTarget).join('\n')}>
                  {m.targets.map(describeTarget).join(', ')}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm whitespace-nowrap">{describeCron(m.schedule.cron)}</div>
                <div className="text-muted-foreground font-mono text-xs">{m.schedule.timezone}</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="text-sm">
                  {m.currentCheckId ? (
                    <span className="text-info inline-flex items-center gap-1">
                      <Loader2Icon className="size-3 animate-spin" /> Running
                    </span>
                  ) : (
                    <TimeCell value={m.lastRunAt} empty="Never" />
                  )}
                </div>
                <SummaryCounts summary={m.lastCheckSummary} />
              </TableCell>
              <TableCell className="hidden text-sm xl:table-cell">
                {m.status === 'active' ? <TimeCell value={m.nextRunAt} /> : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>
                <StatusBadge status={m.status} />
              </TableCell>
              <TableCell className="text-right">
                <MonitorStatusToggle monitor={m} />
              </TableCell>
              <TableCell>
                <DeleteMonitorButton monitorId={m.id} name={m.name} compact />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
