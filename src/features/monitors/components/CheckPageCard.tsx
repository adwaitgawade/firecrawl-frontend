import * as React from 'react'
import { ChevronDownIcon, ExternalLinkIcon, SparklesIcon } from 'lucide-react'

import { JsonViewer, StatusBadge } from '@/components/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import { isFieldDiff } from '../format'
import type { MonitorCheckPage, MonitorJudgment } from '../types'
import { DiffView } from './DiffView'
import { JsonFieldDiff } from './JsonFieldDiff'

function JudgmentView({ judgment }: { judgment: MonitorJudgment }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant={judgment.meaningful ? 'warning' : 'muted'}>
          {judgment.meaningful ? 'Meaningful change' : 'Not meaningful'}
        </Badge>
        <Badge variant="outline">{judgment.confidence} confidence</Badge>
      </div>
      <p className="text-sm">{judgment.reason}</p>
      {judgment.meaningfulChanges.length > 0 && (
        <ul className="space-y-2">
          {judgment.meaningfulChanges.map((c, i) => (
            <li key={i} className="space-y-1 rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge status={c.type === 'added' ? 'new' : c.type} />
                <span className="text-muted-foreground text-xs">{c.reason}</span>
              </div>
              {c.before && (
                <p className="bg-destructive/10 text-destructive rounded px-2 py-1 font-mono text-xs break-words whitespace-pre-wrap">
                  − {c.before}
                </p>
              )}
              {c.after && (
                <p className="bg-success/10 text-success rounded px-2 py-1 font-mono text-xs break-words whitespace-pre-wrap">
                  + {c.after}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function CheckPageCard({ page, defaultOpen }: { page: MonitorCheckPage; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(!!defaultOpen)
  const diffText = page.diff?.text
  const fieldDiff = isFieldDiff(page.diff?.json) ? page.diff.json : null
  const snapshot = page.snapshot?.json
  const hasDetail = !!(diffText || fieldDiff || snapshot || page.judgment || page.error)

  const tabs = [
    diffText ? 'diff' : null,
    fieldDiff ? 'fields' : null,
    page.judgment ? 'judgment' : null,
    snapshot ? 'snapshot' : null,
    'raw',
  ].filter((t): t is string => !!t)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger className="hover:bg-muted/40 flex w-full items-center gap-2 px-3 py-2 text-left">
        <ChevronDownIcon className={cn('text-muted-foreground size-4 shrink-0 transition-transform', !open && '-rotate-90')} />
        <StatusBadge status={page.status} />
        <span className="min-w-0 flex-1 truncate font-mono text-xs" title={page.url}>
          {page.url}
        </span>
        {page.judgment?.meaningful && (
          <span title="AI judge: meaningful change">
            <SparklesIcon className="text-warning size-4 shrink-0" />
          </span>
        )}
        {page.statusCode != null && (
          <Badge variant={page.statusCode >= 400 ? 'destructive' : 'muted'} className="font-mono">
            {page.statusCode}
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t p-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <a href={page.url} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
            Open page <ExternalLinkIcon className="size-3" />
          </a>
          {page.currentScrapeId && (
            <span className="text-muted-foreground">
              scrape <span className="font-mono">{page.currentScrapeId.slice(0, 8)}</span>
            </span>
          )}
        </div>
        {page.error && (
          <Alert variant="destructive">
            <AlertDescription className="font-mono text-xs break-words">{page.error}</AlertDescription>
          </Alert>
        )}
        {!hasDetail && page.status === 'same' && <p className="text-muted-foreground text-sm">No changes since the previous check.</p>}
        <Tabs defaultValue={tabs[0]}>
          <TabsList>
            {tabs.includes('diff') && <TabsTrigger value="diff">Diff</TabsTrigger>}
            {tabs.includes('fields') && <TabsTrigger value="fields">Field changes</TabsTrigger>}
            {tabs.includes('judgment') && <TabsTrigger value="judgment">AI judgment</TabsTrigger>}
            {tabs.includes('snapshot') && <TabsTrigger value="snapshot">Snapshot</TabsTrigger>}
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
          {diffText && (
            <TabsContent value="diff">
              <DiffView text={diffText} />
            </TabsContent>
          )}
          {fieldDiff && (
            <TabsContent value="fields">
              <JsonFieldDiff diff={fieldDiff} />
            </TabsContent>
          )}
          {page.judgment && (
            <TabsContent value="judgment">
              <JudgmentView judgment={page.judgment} />
            </TabsContent>
          )}
          {snapshot && (
            <TabsContent value="snapshot">
              <JsonViewer data={snapshot} collapsed={2} maxHeight="24rem" filename="snapshot.json" />
            </TabsContent>
          )}
          <TabsContent value="raw">
            <JsonViewer data={page} collapsed={1} maxHeight="24rem" filename={`page-${page.id}.json`} />
          </TabsContent>
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  )
}
