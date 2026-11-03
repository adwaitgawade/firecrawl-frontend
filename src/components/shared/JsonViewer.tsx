import * as React from 'react'
import { ChevronRightIcon, DownloadIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared/CopyButton'
import { Button } from '@/components/ui/button'
import { cn, downloadFile } from '@/lib/utils'

export interface JsonViewerProps {
  data: unknown
  /**
   * Collapse behaviour: `true` collapses everything below the root, `false` (default) expands all
   * up to depth 2, a number expands nodes up to that depth.
   */
  collapsed?: boolean | number
  /** CSS max-height of the scroll area (default 32rem; `none` for unlimited). */
  maxHeight?: string
  /** Show the toolbar with copy/download/raw toggle (default true). */
  toolbar?: boolean
  /** Download filename (default data.json). */
  filename?: string
  className?: string
}

const STRING_TRUNCATE = 500

function Primitive({ value }: { value: unknown }) {
  const [expanded, setExpanded] = React.useState(false)
  if (value === null) return <span className="text-muted-foreground">null</span>
  if (typeof value === 'string') {
    const long = value.length > STRING_TRUNCATE
    const shown = long && !expanded ? `${value.slice(0, STRING_TRUNCATE)}…` : value
    return (
      <span className="break-all text-emerald-700 dark:text-emerald-400">
        &quot;{shown}&quot;
        {long && (
          <button
            type="button"
            className="text-primary ml-1 text-[10px] underline"
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? 'less' : `+${value.length - STRING_TRUNCATE} chars`}
          </button>
        )}
      </span>
    )
  }
  if (typeof value === 'number') return <span className="text-sky-700 dark:text-sky-400">{value}</span>
  if (typeof value === 'boolean')
    return <span className="text-violet-700 dark:text-violet-400">{String(value)}</span>
  if (value === undefined) return <span className="text-muted-foreground">undefined</span>
  return <span>{String(value)}</span>
}

function Node({
  name,
  value,
  depth,
  expandDepth,
  isLast,
}: {
  name?: string | number
  value: unknown
  depth: number
  expandDepth: number
  isLast: boolean
}) {
  const isObj = value !== null && typeof value === 'object'
  const [open, setOpen] = React.useState(depth < expandDepth)
  const comma = isLast ? '' : ','
  const label =
    name !== undefined ? (
      <span className="text-foreground/80">
        {typeof name === 'number' ? name : `"${name}"`}
        <span className="text-muted-foreground">: </span>
      </span>
    ) : null

  if (!isObj) {
    return (
      <div className="pl-4">
        {label}
        <Primitive value={value} />
        <span className="text-muted-foreground">{comma}</span>
      </div>
    )
  }

  const isArray = Array.isArray(value)
  const entries: [string | number, unknown][] = isArray
    ? (value as unknown[]).map((v, i) => [i, v])
    : Object.entries(value as Record<string, unknown>)
  const [openB, closeB] = isArray ? ['[', ']'] : ['{', '}']

  if (entries.length === 0) {
    return (
      <div className="pl-4">
        {label}
        <span className="text-muted-foreground">
          {openB}
          {closeB}
          {comma}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(depth > 0 && 'pl-4')}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="hover:bg-muted -ml-4 inline-flex items-center rounded text-left"
      >
        <ChevronRightIcon className={cn('size-4 transition-transform', open && 'rotate-90')} />
        {label}
        <span className="text-muted-foreground">{openB}</span>
        {!open && (
          <span className="text-muted-foreground">
            {' '}
            {entries.length} {isArray ? (entries.length === 1 ? 'item' : 'items') : entries.length === 1 ? 'key' : 'keys'}{' '}
            {closeB}
            {comma}
          </span>
        )}
      </button>
      {open && (
        <>
          {entries.map(([k, v], i) => (
            <Node
              key={k}
              name={isArray ? undefined : k}
              value={v}
              depth={depth + 1}
              expandDepth={expandDepth}
              isLast={i === entries.length - 1}
            />
          ))}
          <div className="text-muted-foreground">
            {closeB}
            {comma}
          </div>
        </>
      )}
    </div>
  )
}

/** Collapsible JSON tree with copy / download / raw toggle. */
export function JsonViewer({
  data,
  collapsed = false,
  maxHeight = '32rem',
  toolbar = true,
  filename = 'data.json',
  className,
}: JsonViewerProps) {
  const [raw, setRaw] = React.useState(false)
  const text = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2) ?? 'undefined'
    } catch {
      return String(data)
    }
  }, [data])
  const expandDepth = collapsed === true ? 1 : collapsed === false ? 3 : collapsed

  return (
    <div className={cn('bg-muted/30 relative rounded-lg border', className)}>
      {toolbar && (
        <div className="flex items-center justify-end gap-1 border-b px-2 py-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setRaw(r => !r)}>
            {raw ? 'Tree' : 'Raw'}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Download JSON"
            aria-label="Download JSON"
            onClick={() => downloadFile(filename, text, 'application/json')}
          >
            <DownloadIcon />
          </Button>
          <CopyButton value={text} />
        </div>
      )}
      <div
        className="overflow-auto p-3 font-mono text-xs leading-relaxed"
        style={{ maxHeight: maxHeight === 'none' ? undefined : maxHeight }}
      >
        {raw ? (
          <pre className="whitespace-pre-wrap break-all">{text}</pre>
        ) : (
          <div className="pl-4">
            <Node value={data} depth={0} expandDepth={expandDepth} isLast />
          </div>
        )}
      </div>
    </div>
  )
}
