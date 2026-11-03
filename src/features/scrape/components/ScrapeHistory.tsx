import { HashIcon, HistoryIcon, Loader2Icon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn, formatRelative, shortUrl, truncate } from '@/lib/utils'

import type { ScrapeRun } from '../types'

interface ScrapeHistoryProps {
  runs: ScrapeRun[]
  selectedId?: string
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
}

function StatusDot({ run }: { run: ScrapeRun }) {
  if (run.status === 'pending') return <Loader2Icon className="text-info size-3 animate-spin" />
  const code = run.response?.data?.metadata?.statusCode
  const bad = run.status === 'error' || (typeof code === 'number' && code >= 400)
  return <span className={cn('size-2 shrink-0 rounded-full', bad ? 'bg-destructive' : 'bg-success')} />
}

/** Session-scoped list of the last few scrapes; click to switch the results pane. */
export function ScrapeHistory({ runs, selectedId, onSelect, onRemove, onClear }: ScrapeHistoryProps) {
  if (runs.length === 0) return null
  return (
    <div className="flex items-center gap-2">
      <HistoryIcon className="text-muted-foreground hidden size-4 shrink-0 sm:block" aria-hidden />
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Recent scrapes">
        {runs.map(run => {
          const active = run.id === selectedId
          return (
            <div
              key={run.id}
              className={cn(
                'group flex shrink-0 items-center rounded-md border text-xs transition-colors',
                active ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/60',
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(run.id)}
                className="flex items-center gap-1.5 py-1 pr-1 pl-2"
                title={`${run.url} — ${formatRelative(run.startedAt)}`}
              >
                <StatusDot run={run} />
                {run.source === 'lookup' && <HashIcon className="text-muted-foreground size-3" />}
                <span className="max-w-44 truncate font-mono">{truncate(shortUrl(run.url) || 'untitled', 40)}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(run.id)}
                className="text-muted-foreground hover:text-foreground rounded p-1 opacity-60 group-hover:opacity-100"
                aria-label={`Remove ${run.url} from history`}
              >
                <XIcon className="size-3" />
              </button>
            </div>
          )
        })}
      </div>
      <Button type="button" variant="ghost" size="sm" className="text-muted-foreground shrink-0" onClick={onClear}>
        Clear
      </Button>
    </div>
  )
}
