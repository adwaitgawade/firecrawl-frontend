import * as React from 'react'
import { ChevronRightIcon, CornerUpLeftIcon, Loader2Icon, TerminalIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatDate, formatDuration } from '@/lib/utils'

import type { ExecutionEntry } from '../types'

function OutputBlock({ label, text, tone }: { label: string; text: string; tone?: 'error' | 'result' }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">{label}</div>
      <pre
        className={cn(
          'max-h-96 overflow-auto font-mono text-xs leading-relaxed break-words whitespace-pre-wrap',
          tone === 'error' ? 'text-red-400' : tone === 'result' ? 'text-emerald-300' : 'text-zinc-200',
        )}
      >
        {text}
      </pre>
    </div>
  )
}

function entryOutput(entry: ExecutionEntry): string {
  const r = entry.response
  if (!r) return entry.error ?? ''
  return [r.stdout, r.stderr, r.result].filter(Boolean).join('\n')
}

function EntryView({ entry, onReuse }: { entry: ExecutionEntry; onReuse: (entry: ExecutionEntry) => void }) {
  const [showCode, setShowCode] = React.useState(false)
  const r = entry.response
  const exitCode = r?.exitCode
  const failed = entry.status === 'error' || (r && (r.killed || (exitCode !== undefined && exitCode !== 0)))
  const firstLine = entry.code.split('\n').find(l => l.trim()) ?? ''
  const result = r?.result?.trim()
  const stdout = r?.stdout?.trimEnd()
  const stderr = r?.stderr?.trimEnd()
  const showResult = !!result && result !== stdout?.trim()
  const output = entryOutput(entry)

  return (
    <div className="group border-b border-zinc-800 px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setShowCode(v => !v)}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-zinc-300 hover:text-white"
        >
          <ChevronRightIcon className={cn('size-3.5 shrink-0 transition-transform', showCode && 'rotate-90')} />
          <span className="text-primary font-mono">$ {entry.language}</span>
          <span className="truncate font-mono text-zinc-400">{firstLine}</span>
        </button>
        <span className="text-zinc-500">{formatDate(entry.startedAt, 'HH:mm:ss')}</span>
        {entry.durationMs !== undefined && <span className="font-mono text-zinc-500">{formatDuration(entry.durationMs)}</span>}
        {entry.status === 'running' ? (
          <Badge variant="info">
            <Loader2Icon className="animate-spin" /> running
          </Badge>
        ) : r?.killed ? (
          <Badge variant="destructive">killed (timeout {entry.timeout}s)</Badge>
        ) : exitCode !== undefined ? (
          <Badge variant={exitCode === 0 ? 'success' : 'destructive'}>exit {exitCode}</Badge>
        ) : failed ? (
          <Badge variant="destructive">request failed</Badge>
        ) : null}
        <div className="flex items-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Load code into editor"
            title="Load code into editor"
            onClick={() => onReuse(entry)}
          >
            <CornerUpLeftIcon />
          </Button>
          {output && (
            <CopyButton value={output} className="text-zinc-400 hover:bg-zinc-800 hover:text-white" toastMessage="Output copied" />
          )}
        </div>
      </div>

      {showCode && (
        <pre className="mt-2 max-h-64 overflow-auto rounded border border-zinc-800 bg-zinc-900 p-2 font-mono text-xs text-zinc-300">
          {entry.code}
        </pre>
      )}

      <div className="mt-2 space-y-2 pl-5">
        {stdout && <OutputBlock label="stdout" text={stdout} />}
        {stderr && <OutputBlock label="stderr" text={stderr} tone="error" />}
        {showResult && <OutputBlock label="result" text={result} tone="result" />}
        {entry.status === 'error' && <OutputBlock label="error" text={entry.error ?? 'Request failed'} tone="error" />}
        {entry.status === 'done' && !stdout && !stderr && !showResult && (
          <p className="font-mono text-xs text-zinc-500 italic">(no output)</p>
        )}
      </div>
    </div>
  )
}

export function ExecutionLog({
  entries,
  onReuse,
  className,
}: {
  entries: ExecutionEntry[]
  onReuse: (entry: ExecutionEntry) => void
  className?: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const lastId = entries[entries.length - 1]?.id
  const lastStatus = entries[entries.length - 1]?.status

  React.useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lastId, lastStatus])

  return (
    <div
      ref={containerRef}
      className={cn('overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100', className)}
    >
      {entries.length === 0 ? (
        <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 p-6 text-center">
          <TerminalIcon className="size-6 text-zinc-600" />
          <p className="text-sm text-zinc-400">No commands run yet</p>
          <p className="text-xs text-zinc-600">Output from each run (stdout, stderr, result, exit code) appears here.</p>
        </div>
      ) : (
        entries.map(e => <EntryView key={e.id} entry={e} onReuse={onReuse} />)
      )}
    </div>
  )
}
