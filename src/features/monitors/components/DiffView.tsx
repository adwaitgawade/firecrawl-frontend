import * as React from 'react'

import { CopyButton } from '@/components/shared'
import { cn } from '@/lib/utils'

function lineClass(line: string): string {
  if (line.startsWith('+++') || line.startsWith('---')) return 'text-muted-foreground font-semibold'
  if (line.startsWith('@@')) return 'bg-info/10 text-info'
  if (line.startsWith('+')) return 'bg-success/10 text-success'
  if (line.startsWith('-')) return 'bg-destructive/10 text-destructive'
  if (line.startsWith('diff ') || line.startsWith('index ')) return 'text-muted-foreground'
  return ''
}

/** Unified (git-style) diff with +/- coloring. */
export function DiffView({ text, maxHeight = '28rem', className }: { text: string; maxHeight?: string; className?: string }) {
  const lines = React.useMemo(() => text.replace(/\n$/, '').split('\n'), [text])
  const stats = React.useMemo(() => {
    let add = 0
    let del = 0
    for (const l of lines) {
      if (l.startsWith('+') && !l.startsWith('+++')) add++
      else if (l.startsWith('-') && !l.startsWith('---')) del++
    }
    return { add, del }
  }, [lines])

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <div className="bg-muted/40 flex items-center justify-between gap-2 border-b px-3 py-1.5 text-xs">
        <span className="font-mono">
          <span className="text-success">+{stats.add}</span> <span className="text-destructive">−{stats.del}</span>
        </span>
        <CopyButton value={text} toastMessage="Diff copied" />
      </div>
      <pre className="overflow-auto py-1 font-mono text-xs leading-relaxed" style={{ maxHeight }}>
        {lines.map((line, i) => (
          <div key={i} className={cn('px-3 break-words whitespace-pre-wrap', lineClass(line))}>
            {line || ' '}
          </div>
        ))}
      </pre>
    </div>
  )
}
