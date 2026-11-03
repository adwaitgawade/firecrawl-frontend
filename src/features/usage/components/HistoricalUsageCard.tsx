import * as React from 'react'
import { ChartColumnIcon, KeyRoundIcon, TableIcon } from 'lucide-react'

import { EmptyState, ErrorAlert, RequestPreview } from '@/components/shared'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn, formatNumber } from '@/lib/utils'

import { historicalPath, useHistoricalUsage } from '../api'
import { buildChartData, type ChartRow, type ChartSeries } from '../lib'
import type { UsageMetric } from '../types'
import { UsageBarChart } from './UsageBarChart'

type View = 'chart' | 'table'

function Legend({ series }: { series: ChartSeries[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs" aria-label="Legend">
      {series.map(s => (
        <li key={s.dataKey} className="flex min-w-0 items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
          <span className="max-w-48 truncate" title={s.name}>
            {s.name}
          </span>
          <span className="text-muted-foreground tabular-nums">{formatNumber(s.total)}</span>
        </li>
      ))}
    </ul>
  )
}

function UsageTable({ rows, series, unit }: { rows: ChartRow[]; series: ChartSeries[]; unit: string }) {
  const multi = series.length > 1
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            {multi &&
              series.map(s => (
                <TableHead key={s.dataKey} className="text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-[2px]" style={{ background: s.color }} />
                    <span className="max-w-32 truncate">{s.name}</span>
                  </span>
                </TableHead>
              ))}
            <TableHead className="text-right capitalize">Total {unit}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.range}>
              <TableCell className="whitespace-nowrap">
                {r.range}
                {r.current && <span className="text-muted-foreground"> · in progress</span>}
              </TableCell>
              {multi &&
                series.map(s => (
                  <TableCell key={s.dataKey} className="text-right font-mono tabular-nums">
                    {formatNumber(r[s.dataKey] as number)}
                  </TableCell>
                ))}
              <TableCell className="text-right font-mono font-medium tabular-nums">{formatNumber(r.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** Historical credit / token usage (last ~90 days, monthly buckets), optionally split by API key. */
export function HistoricalUsageCard() {
  const [metric, setMetric] = React.useState<UsageMetric>('credits')
  const [byApiKey, setByApiKey] = React.useState(false)
  const [view, setView] = React.useState<View>('chart')
  const q = useHistoricalUsage(metric, byApiKey)

  // Render from the params the (possibly placeholder) data was fetched with, not the new selection.
  const { rows, series } = React.useMemo(
    () => (q.data ? buildChartData(q.data.periods, q.data.byApiKey) : { rows: [], series: [] }),
    [q.data],
  )
  const unit = (q.data?.metric ?? metric) === 'credits' ? 'credits' : 'tokens'
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0)
  const switchId = React.useId()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage history</CardTitle>
        <CardDescription>
          Last 90 days, grouped by calendar month (UTC)
          {q.data && rows.length > 0 && (
            <>
              {' · '}
              <span className="text-foreground font-medium tabular-nums">{formatNumber(grandTotal)}</span> {unit} total
            </>
          )}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={view}
            onValueChange={v => v && setView(v as View)}
            aria-label="View"
          >
            <ToggleGroupItem value="chart" aria-label="Chart view">
              <ChartColumnIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={metric} onValueChange={v => setMetric(v as UsageMetric)}>
            <TabsList>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Switch id={switchId} checked={byApiKey} onCheckedChange={setByApiKey} />
            <Label htmlFor={switchId} className="flex items-center gap-1.5 text-sm font-normal">
              <KeyRoundIcon className="text-muted-foreground size-3.5" /> By API key
            </Label>
          </div>
        </div>

        <div className={cn('space-y-3 transition-opacity', q.isPlaceholderData && 'opacity-60')}>
          {q.isPending ? (
            <Skeleton className="h-72 w-full" />
          ) : q.isError ? (
            <ErrorAlert
              error={q.error}
              title={`Couldn't load ${unit} history`}
              onRetry={() => q.refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ChartColumnIcon}
              title="No usage recorded yet"
              description={`No ${unit} were used by this team in the last 90 days.`}
            />
          ) : (
            <>
              {series.length > 1 && <Legend series={series} />}
              {view === 'chart' ? (
                <UsageBarChart rows={rows} series={series} unit={unit} />
              ) : (
                <UsageTable rows={rows} series={series} unit={unit} />
              )}
            </>
          )}
        </div>

        <RequestPreview
          method="GET"
          path={historicalPath(metric)}
          query={byApiKey ? { byApiKey: true } : undefined}
        />
      </CardContent>
    </Card>
  )
}
