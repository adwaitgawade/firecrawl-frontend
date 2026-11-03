import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { formatNumber } from '@/lib/utils'

import { compactNumber, type ChartRow, type ChartSeries } from '../lib'

interface UsageBarChartProps {
  rows: ChartRow[]
  series: ChartSeries[]
  /** Unit name for tooltips, e.g. "credits". */
  unit: string
}

interface TooltipBodyProps {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: unknown }>
  series: ChartSeries[]
  unit: string
}

function TooltipBody({ active, payload, series, unit }: TooltipBodyProps) {
  const row = payload?.[0]?.payload as ChartRow | undefined
  if (!active || !row) return null
  const multi = series.length > 1
  return (
    <div className="bg-popover text-popover-foreground min-w-44 rounded-lg border px-3 py-2 text-xs shadow-md">
      <div className="mb-1.5 font-medium">
        {row.range}
        {row.current && <span className="text-muted-foreground font-normal"> (in progress)</span>}
      </div>
      {multi && (
        <div className="space-y-1">
          {series.map(s => (
            <div key={s.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="size-2 shrink-0 rounded-[2px]" style={{ background: s.color }} />
                <span className="text-muted-foreground truncate">{s.name}</span>
              </span>
              <span className="font-mono tabular-nums">{formatNumber(row[s.dataKey] as number)}</span>
            </div>
          ))}
        </div>
      )}
      <div className={multi ? 'mt-1.5 flex justify-between gap-4 border-t pt-1.5' : 'flex justify-between gap-4'}>
        <span className="text-muted-foreground">Total</span>
        <span className="font-mono font-medium tabular-nums">
          {formatNumber(row.total)} {unit}
        </span>
      </div>
    </div>
  )
}

/** Monthly usage columns; stacked per API key when `series` has more than one entry. */
export function UsageBarChart({ rows, series, unit }: UsageBarChartProps) {
  const lastIndex = series.length - 1
  return (
    <div className="h-72 w-full" role="img" aria-label={`Monthly ${unit} usage chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 20, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={(v: number) => compactNumber(v)}
            width={52}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
            content={p => <TooltipBody active={p.active} payload={p.payload} series={series} unit={unit} />}
          />
          {series.map((s, i) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name}
              stackId="usage"
              fill={s.color}
              // 1px card-colored stroke on each segment → a 2px surface gap between stacked fills.
              stroke="var(--card)"
              strokeWidth={series.length > 1 ? 1 : 0}
              maxBarSize={40}
              radius={i === lastIndex ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            >
              {i === lastIndex && (
                <LabelList
                  dataKey="total"
                  position="top"
                  offset={6}
                  formatter={(v: unknown) => (typeof v === 'number' && v > 0 ? compactNumber(v) : '')}
                  style={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
