import { CheckCircle2Icon, CircleAlertIcon, Loader2Icon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatDate, formatDuration } from '@/lib/utils'

import type { ExtractStep } from '../types'

const STEP_LABELS: Record<string, string> = {
  initial: 'Initializing',
  map: 'Mapping URLs',
  'map-rerank': 'Ranking relevant pages',
  'multi-entity': 'Multi-entity analysis',
  'multi-entity-scrape': 'Scraping pages (multi-entity)',
  'multi-entity-extract': 'Extracting entities',
  scrape: 'Scraping pages',
  extract: 'Extracting data',
}

function stepError(err: unknown): string | undefined {
  if (!err) return undefined
  if (typeof err === 'string') return err
  if (typeof err === 'object' && 'message' in err && typeof err.message === 'string') return err.message
  return JSON.stringify(err)
}

interface ExtractStepsProps {
  steps: ExtractStep[]
  /** Whether the job is still running (unfinished steps show a spinner). */
  running: boolean
}

/** Timeline of the extract pipeline steps (the API keeps only the latest 5). */
export function ExtractSteps({ steps, running }: ExtractStepsProps) {
  return (
    <ol className="relative space-y-4 border-l pl-6">
      {steps.map((s, i) => {
        const err = stepError(s.error)
        const done = s.finishedAt != null
        const Icon = err ? CircleAlertIcon : done || !running ? CheckCircle2Icon : Loader2Icon
        return (
          <li key={`${s.step}-${s.startedAt}-${i}`} className="relative">
            <span className="bg-background absolute top-0.5 -left-[2.0625rem] flex size-5 items-center justify-center rounded-full">
              <Icon
                className={
                  err
                    ? 'text-destructive size-4'
                    : done || !running
                      ? 'text-success size-4'
                      : 'text-info size-4 animate-spin'
                }
              />
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-medium">{STEP_LABELS[s.step] ?? s.step}</span>
              <code className="text-muted-foreground font-mono text-[11px]">{s.step}</code>
              {done && (
                <Badge variant="muted" className="text-[10px]">
                  {formatDuration((s.finishedAt as number) - s.startedAt)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">Started {formatDate(s.startedAt, 'HH:mm:ss')}</p>
            {err && <p className="text-destructive mt-1 text-xs break-words">{err}</p>}
            {!!s.discoveredLinks?.length && (
              <Collapsible className="mt-1">
                <CollapsibleTrigger className="text-primary text-xs hover:underline">
                  {s.discoveredLinks.length} discovered link{s.discoveredLinks.length === 1 ? '' : 's'}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="bg-muted/30 mt-1 max-h-48 space-y-0.5 overflow-auto rounded-md border p-2">
                    {s.discoveredLinks.map(l => (
                      <li key={l} className="truncate font-mono text-[11px]">
                        <a href={l} target="_blank" rel="noreferrer" className="hover:underline">
                          {l}
                        </a>
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            )}
          </li>
        )
      })}
    </ol>
  )
}
