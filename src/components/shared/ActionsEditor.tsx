import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  MAX_ACTIONS,
  type Action,
  type ActionType,
  type PdfPaperFormat,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

export interface ActionsEditorProps {
  value: Action[] | undefined
  onChange: (actions: Action[] | undefined) => void
  className?: string
}

const ACTION_LABELS: Record<ActionType, string> = {
  wait: 'Wait',
  click: 'Click',
  write: 'Write text',
  press: 'Press key',
  scroll: 'Scroll',
  screenshot: 'Screenshot',
  scrape: 'Scrape',
  executeJavascript: 'Execute JavaScript',
  pdf: 'Generate PDF',
}

const PDF_FORMATS: PdfPaperFormat[] = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'Letter', 'Legal', 'Tabloid', 'Ledger']

function defaultAction(type: ActionType): Action {
  switch (type) {
    case 'wait':
      return { type, milliseconds: 1000 }
    case 'click':
      return { type, selector: '' }
    case 'write':
      return { type, text: '' }
    case 'press':
      return { type, key: 'Enter' }
    case 'scroll':
      return { type, direction: 'down' }
    case 'screenshot':
      return { type }
    case 'scrape':
      return { type }
    case 'executeJavascript':
      return { type, script: '' }
    case 'pdf':
      return { type }
  }
}

const num = (v: string) => (v === '' ? undefined : Number(v))

/** Editor for the v2 `actions` array (wait, click, write, press, scroll, screenshot, scrape, executeJavascript, pdf). */
export function ActionsEditor({ value, onChange, className }: ActionsEditorProps) {
  const actions = value ?? []
  const set = (next: Action[]) => onChange(next.length ? next : undefined)
  const update = (i: number, a: Action) => set(actions.map((x, j) => (j === i ? a : x)))
  const move = (i: number, d: -1 | 1) => {
    const next = [...actions]
    const [item] = next.splice(i, 1)
    next.splice(i + d, 0, item)
    set(next)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {actions.length === 0 && (
        <p className="text-muted-foreground text-xs">
          No actions. Actions run in order before the page is scraped (max {MAX_ACTIONS}, total wait ≤ 60s).
        </p>
      )}
      {actions.map((a, i) => (
        <div key={i} className="bg-background space-y-2 rounded-md border p-2.5">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-5 text-xs tabular-nums">{i + 1}.</span>
            <Select value={a.type} onValueChange={t => update(i, defaultAction(t as ActionType))}>
              <SelectTrigger size="sm" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACTION_LABELS) as ActionType[]).map(t => (
                  <SelectItem key={t} value={t}>
                    {ACTION_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center">
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={i === actions.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Move down"
              >
                <ArrowDownIcon />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => set(actions.filter((_, j) => j !== i))} aria-label="Remove action">
                <Trash2Icon />
              </Button>
            </div>
          </div>
          <ActionFields action={a} onChange={next => update(i, next)} />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={actions.length >= MAX_ACTIONS}
        onClick={() => set([...actions, defaultAction('wait')])}
      >
        <PlusIcon /> Add action
      </Button>
    </div>
  )
}

function ActionFields({ action: a, onChange }: { action: Action; onChange: (a: Action) => void }) {
  switch (a.type) {
    case 'wait':
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            type="number"
            min={1}
            placeholder="milliseconds"
            value={a.milliseconds ?? ''}
            onChange={e => onChange({ type: 'wait', milliseconds: num(e.target.value) })}
          />
          <Input
            placeholder="…or wait for CSS selector"
            className="font-mono text-xs"
            value={a.selector ?? ''}
            onChange={e => onChange({ type: 'wait', selector: e.target.value || undefined, milliseconds: e.target.value ? undefined : 1000 })}
          />
        </div>
      )
    case 'click':
      return (
        <div className="flex items-center gap-3">
          <Input
            placeholder="CSS selector"
            className="font-mono text-xs"
            value={a.selector}
            onChange={e => onChange({ ...a, selector: e.target.value })}
          />
          <div className="flex shrink-0 items-center gap-2">
            <Switch checked={!!a.all} onCheckedChange={v => onChange({ ...a, all: v || undefined })} />
            <Label className="text-xs">All matches</Label>
          </div>
        </div>
      )
    case 'write':
      return <Input placeholder="Text to type" value={a.text} onChange={e => onChange({ ...a, text: e.target.value })} />
    case 'press':
      return <Input placeholder="Key, e.g. Enter" value={a.key} onChange={e => onChange({ ...a, key: e.target.value })} />
    case 'scroll':
      return (
        <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
          <Select value={a.direction ?? 'down'} onValueChange={v => onChange({ ...a, direction: v as 'up' | 'down' })}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="down">down</SelectItem>
              <SelectItem value="up">up</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Element selector (optional)"
            className="font-mono text-xs"
            value={a.selector ?? ''}
            onChange={e => onChange({ ...a, selector: e.target.value || undefined })}
          />
        </div>
      )
    case 'screenshot':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={!!a.fullPage} onCheckedChange={v => onChange({ ...a, fullPage: v || undefined })} />
            <Label className="text-xs">Full page</Label>
          </div>
          <Input
            type="number"
            min={1}
            max={100}
            placeholder="quality"
            className="w-28"
            value={a.quality ?? ''}
            onChange={e => onChange({ ...a, quality: num(e.target.value) })}
          />
        </div>
      )
    case 'executeJavascript':
      return (
        <Textarea
          placeholder="document.querySelector('button').click()"
          className="font-mono text-xs"
          rows={3}
          value={a.script}
          onChange={e => onChange({ ...a, script: e.target.value })}
        />
      )
    case 'pdf':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Select value={a.format ?? 'Letter'} onValueChange={v => onChange({ ...a, format: v as PdfPaperFormat })}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PDF_FORMATS.map(f => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch checked={!!a.landscape} onCheckedChange={v => onChange({ ...a, landscape: v || undefined })} />
            <Label className="text-xs">Landscape</Label>
          </div>
          <Input
            type="number"
            step="0.1"
            placeholder="scale (1)"
            className="w-28"
            value={a.scale ?? ''}
            onChange={e => onChange({ ...a, scale: num(e.target.value) })}
          />
        </div>
      )
    case 'scrape':
      return <p className="text-muted-foreground text-xs">Captures the page HTML at this point (returned in actions.scrapes).</p>
  }
}
