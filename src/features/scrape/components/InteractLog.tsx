import { BotIcon, CodeIcon, PowerIcon, SquareTerminalIcon } from 'lucide-react'

import { CodeBlock } from '@/components/shared/CodeBlock'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate, formatDuration, formatNumber } from '@/lib/utils'

import type { InteractLogEntry } from '../types'

function Output({ label, text, tone }: { label: string; text?: string; tone?: 'error' }) {
  if (!text || !text.trim()) return null
  return (
    <div className="space-y-1">
      <p className={cn('text-[11px] font-medium tracking-wide uppercase', tone === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
        {label}
      </p>
      <CodeBlock code={text} wrap maxHeight="18rem" />
    </div>
  )
}

function ExecEntry({ entry }: { entry: Extract<InteractLogEntry, { kind: 'exec' }> }) {
  const { request, response, error } = entry
  const isPrompt = !!request.prompt && !request.code
  const failed = !!error || (response && !response.success)
  return (
    <li className="space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {isPrompt ? <BotIcon className="text-primary size-4" /> : <CodeIcon className="text-primary size-4" />}
        <span className="font-medium">{isPrompt ? 'Prompt' : `Code (${request.language ?? 'node'})`}</span>
        <Badge variant={failed ? 'destructive' : 'success'}>
          {error ? 'error' : response?.killed ? 'killed' : `exit ${response?.exitCode ?? 0}`}
        </Badge>
        <span className="text-muted-foreground ml-auto">
          {formatDate(entry.at, 'HH:mm:ss')} · {formatDuration(entry.durationMs)}
        </span>
      </div>
      <pre className="bg-muted/50 max-h-40 overflow-auto rounded-md px-2.5 py-2 font-mono text-xs whitespace-pre-wrap">
        {isPrompt ? request.prompt : request.code}
      </pre>
      {error && <p className="text-destructive text-sm">{error.message}</p>}
      {response && (
        <div className="space-y-2">
          <Output label="Output" text={response.output} />
          <Output label="Result" text={response.result} />
          <Output label="stdout" text={response.stdout} />
          <Output label="stderr" text={response.stderr} tone="error" />
          {!response.output && !response.result && !response.stdout?.trim() && !response.stderr?.trim() && (
            <p className="text-muted-foreground text-xs italic">No output.</p>
          )}
        </div>
      )}
    </li>
  )
}

function StopEntry({ entry }: { entry: Extract<InteractLogEntry, { kind: 'stop' }> }) {
  return (
    <li className="bg-muted/30 flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3 text-xs">
      <PowerIcon className="text-muted-foreground size-4" />
      <span className="font-medium">Session ended</span>
      {entry.error ? (
        <span className="text-destructive">{entry.error.message}</span>
      ) : (
        <span className="text-muted-foreground">
          {entry.response?.sessionDurationMs !== undefined && `${formatDuration(entry.response.sessionDurationMs)} · `}
          {entry.response?.creditsBilled !== undefined && `${formatNumber(entry.response.creditsBilled)} credits billed`}
        </span>
      )}
      <span className="text-muted-foreground ml-auto">{formatDate(entry.at, 'HH:mm:ss')}</span>
    </li>
  )
}

export function InteractLog({ entries }: { entries: InteractLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={SquareTerminalIcon}
        title="No interactions yet"
        description="The first run starts a browser session that replays this scrape, then executes your prompt or code."
        className="py-8"
      />
    )
  }
  return (
    <ol className="space-y-3">
      {entries.map(e => (e.kind === 'exec' ? <ExecEntry key={e.id} entry={e} /> : <StopEntry key={e.id} entry={e} />))}
    </ol>
  )
}
