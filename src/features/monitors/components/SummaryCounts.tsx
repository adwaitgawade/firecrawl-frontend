import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatNumber } from '@/lib/utils'

import type { MonitorSummary } from '../types'

const ITEMS: { key: keyof MonitorSummary; label: string; className: string }[] = [
  { key: 'changed', label: 'changed', className: 'text-warning' },
  { key: 'new', label: 'new', className: 'text-info' },
  { key: 'removed', label: 'removed', className: 'text-destructive' },
  { key: 'error', label: 'errors', className: 'text-destructive' },
]

/** Inline "3 changed · 1 new" style summary; zero counts are hidden. */
export function SummaryCounts({ summary, className }: { summary: MonitorSummary | null | undefined; className?: string }) {
  if (!summary) return <span className={cn('text-muted-foreground text-sm', className)}>—</span>
  const nonZero = ITEMS.filter(i => (summary[i.key] ?? 0) > 0)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex flex-wrap items-center gap-x-2 text-xs whitespace-nowrap', className)}>
          {nonZero.length === 0 ? (
            <span className="text-muted-foreground">
              {summary.totalPages ? `No changes · ${formatNumber(summary.totalPages)} pages` : 'No pages'}
            </span>
          ) : (
            nonZero.map(i => (
              <span key={i.key} className={cn('font-medium', i.className)}>
                {formatNumber(summary[i.key])} {i.label}
              </span>
            ))
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {formatNumber(summary.totalPages)} total · {formatNumber(summary.same)} same · {formatNumber(summary.changed)} changed
        · {formatNumber(summary.new)} new · {formatNumber(summary.removed)} removed · {formatNumber(summary.error)} errors
      </TooltipContent>
    </Tooltip>
  )
}
