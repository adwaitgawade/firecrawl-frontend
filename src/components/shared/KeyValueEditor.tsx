import * as React from 'react'
import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface KeyValueEditorProps {
  value: Record<string, string> | undefined
  onChange: (value: Record<string, string>) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  addLabel?: string
  disabled?: boolean
  className?: string
}

interface Row {
  id: number
  key: string
  value: string
}

let rowId = 0
const toRows = (v: Record<string, string> | undefined): Row[] =>
  Object.entries(v ?? {}).map(([key, value]) => ({ id: ++rowId, key, value }))

const toRecord = (rows: Row[]): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const r of rows) if (r.key.trim()) out[r.key.trim()] = r.value
  return out
}

const sameRecord = (a: Record<string, string>, b: Record<string, string>) => {
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  return ak.length === bk.length && ak.every(k => a[k] === b[k])
}

/** Editable list of key/value string pairs (e.g. HTTP headers, webhook metadata). */
export function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  addLabel = 'Add',
  disabled,
  className,
}: KeyValueEditorProps) {
  const [rows, setRows] = React.useState<Row[]>(() => toRows(value))
  const [prevValue, setPrevValue] = React.useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (!sameRecord(toRecord(rows), value ?? {})) setRows(toRows(value))
  }

  const update = (next: Row[]) => {
    setRows(next)
    const rec = toRecord(next)
    if (!sameRecord(rec, value ?? {})) onChange(rec)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {rows.map(row => (
        <div key={row.id} className="flex items-center gap-2">
          <Input
            value={row.key}
            placeholder={keyPlaceholder}
            disabled={disabled}
            className="font-mono text-xs"
            onChange={e => update(rows.map(r => (r.id === row.id ? { ...r, key: e.target.value } : r)))}
          />
          <Input
            value={row.value}
            placeholder={valuePlaceholder}
            disabled={disabled}
            className="font-mono text-xs"
            onChange={e => update(rows.map(r => (r.id === row.id ? { ...r, value: e.target.value } : r)))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label="Remove"
            onClick={() => update(rows.filter(r => r.id !== row.id))}
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setRows([...rows, { id: ++rowId, key: '', value: '' }])}
      >
        <PlusIcon /> {addLabel}
      </Button>
    </div>
  )
}
