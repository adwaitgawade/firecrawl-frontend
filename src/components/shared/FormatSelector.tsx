import * as React from 'react'
import { PlusIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react'

import { JsonSchemaEditor } from '@/components/shared/JsonSchemaEditor'
import { normalizeFormats, validateFormats } from '@/components/shared/scrape-options'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type {
  AttributesFormat,
  ChangeTrackingFormat,
  ChangeTrackingMode,
  FormatInput,
  FormatObject,
  FormatType,
  JsonSchema,
  QueryFormat,
  ScreenshotFormat,
} from '@/lib/api/types'
import { cn } from '@/lib/utils'

export interface FormatMeta {
  label: string
  description: string
  /** Format needs options and is always sent as an object. */
  object?: boolean
  /** Uses an LLM (costs extra credits). */
  ai?: boolean
  deprecated?: boolean
}

export const FORMAT_META: Record<FormatType, FormatMeta> = {
  markdown: { label: 'Markdown', description: 'Clean markdown of the page' },
  html: { label: 'HTML', description: 'Cleaned HTML' },
  rawHtml: { label: 'Raw HTML', description: 'Unmodified page HTML' },
  links: { label: 'Links', description: 'All links found on the page' },
  images: { label: 'Images', description: 'All image URLs on the page' },
  screenshot: { label: 'Screenshot', description: 'Screenshot of the page', object: true },
  summary: { label: 'Summary', description: 'LLM-generated summary', ai: true },
  json: { label: 'JSON', description: 'Structured extraction with a schema/prompt', object: true, ai: true },
  deterministicJson: {
    label: 'Deterministic JSON',
    description: 'JSON via a cached, reusable extractor',
    object: true,
    ai: true,
  },
  changeTracking: {
    label: 'Change tracking',
    description: 'Diff against the previous scrape (needs markdown)',
    object: true,
  },
  attributes: { label: 'Attributes', description: 'Extract element attributes by CSS selector', object: true },
  question: { label: 'Question', description: 'Answer a question about the page', object: true, ai: true },
  highlights: { label: 'Highlights', description: 'Query-relevant highlights', object: true, ai: true },
  branding: { label: 'Branding', description: 'Brand colors, fonts, logo, tone' },
  product: { label: 'Product', description: 'Product data (price, variants, stock)' },
  menu: { label: 'Menu', description: 'Restaurant menu extraction' },
  audio: { label: 'Audio', description: 'Extract audio from the page' },
  video: { label: 'Video', description: 'Extract videos from the page' },
  query: { label: 'Query (deprecated)', description: 'Use Question or Highlights instead', object: true, ai: true, deprecated: true },
}

/** All formats accepted by /scrape, /batch/scrape, /crawl scrapeOptions (deprecated `query` omitted). */
export const SCRAPE_FORMAT_TYPES: FormatType[] = [
  'markdown',
  'html',
  'rawHtml',
  'links',
  'images',
  'screenshot',
  'summary',
  'json',
  'deterministicJson',
  'changeTracking',
  'attributes',
  'question',
  'highlights',
  'branding',
  'product',
  'menu',
  'audio',
  'video',
]

/** Formats accepted by /search `scrapeOptions.formats`. */
export const SEARCH_FORMAT_TYPES: FormatType[] = [
  'markdown',
  'html',
  'rawHtml',
  'links',
  'images',
  'screenshot',
  'summary',
  'json',
  'question',
  'highlights',
  'product',
  'menu',
]

export interface FormatSelectorProps {
  value: FormatInput[] | undefined
  onChange: (formats: FormatInput[]) => void
  /** Restrict selectable formats (default SCRAPE_FORMAT_TYPES). */
  allowed?: FormatType[]
  /** Hide the inline validation warnings. */
  hideValidation?: boolean
  className?: string
}

/** Remove undefined / empty-string keys from a format object. */
function compact<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === '') continue
    out[k] = v
  }
  return out as T
}

/** Serialize: simple formats → strings; object formats → objects (screenshot w/o options → string). */
function serialize(list: FormatObject[]): FormatInput[] {
  return list.map(f => {
    const meta = FORMAT_META[f.type]
    if (!meta.object) return f.type as FormatInput
    if (f.type === 'screenshot' && Object.keys(f).length === 1) return 'screenshot'
    return f
  })
}

function defaultFormat(type: FormatType): FormatObject {
  switch (type) {
    case 'attributes':
      return { type, selectors: [{ selector: '', attribute: '' }] }
    case 'question':
      return { type, question: '' }
    case 'highlights':
      return { type, query: '' }
    case 'query':
      return { type, prompt: '' }
    default:
      return { type } as FormatObject
  }
}

const schemaToText = (s: unknown) => (s ? JSON.stringify(s, null, 2) : '')

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

function SchemaField({
  schema,
  onSchema,
}: {
  schema: unknown
  onSchema: (schema: JsonSchema | undefined) => void
}) {
  const [text, setText] = React.useState(() => schemaToText(schema))
  return (
    <Field label="JSON schema (optional)">
      <JsonSchemaEditor
        value={text}
        rows={6}
        onChange={(t, r) => {
          setText(t)
          if (!r.error) onSchema(r.schema)
        }}
      />
    </Field>
  )
}

function NumberInput({
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number | undefined
  onChange: (v: number | undefined) => void
}) {
  return (
    <Input
      type="number"
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      {...props}
    />
  )
}

/** Editor for the v2 `formats` array, including object formats and their options. */
export function FormatSelector({
  value,
  onChange,
  allowed = SCRAPE_FORMAT_TYPES,
  hideValidation,
  className,
}: FormatSelectorProps) {
  const list = React.useMemo(() => normalizeFormats(value), [value])
  const selected = new Set(list.map(f => f.type))
  const errors = hideValidation ? [] : validateFormats(value)

  const emit = (next: FormatObject[]) => onChange(serialize(next))

  const toggle = (type: FormatType) => {
    if (selected.has(type)) {
      emit(list.filter(f => f.type !== type))
      return
    }
    let next = [...list, defaultFormat(type)]
    if (type === 'changeTracking' && !selected.has('markdown')) {
      next = [{ type: 'markdown' }, ...next]
    }
    if (type === 'json') next = next.filter(f => f.type !== 'deterministicJson')
    if (type === 'deterministicJson') next = next.filter(f => f.type !== 'json')
    emit(next)
  }

  const patch = <T extends FormatObject>(type: T['type'], p: Partial<T>) => {
    emit(list.map(f => (f.type === type ? compact({ ...f, ...p } as T) : f)))
  }

  // Show deprecated / unknown-to-allowed formats that are already present so they can be removed.
  const shown = [...allowed, ...list.map(f => f.type).filter(t => !allowed.includes(t))]
  const objectFormats = list.filter(f => FORMAT_META[f.type]?.object)

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map(type => {
          const meta = FORMAT_META[type]
          const checked = selected.has(type)
          const id = `fmt-${type}`
          return (
            <label
              key={type}
              htmlFor={id}
              className={cn(
                'hover:bg-muted/50 flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 transition-colors',
                checked && 'border-primary/50 bg-primary/5 hover:bg-primary/10',
              )}
            >
              <Checkbox id={id} checked={checked} onCheckedChange={() => toggle(type)} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  {meta.label}
                  {meta.ai && (
                    <Badge variant="muted" className="px-1 py-0 text-[10px]">
                      AI
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs leading-snug">{meta.description}</p>
              </div>
            </label>
          )
        })}
      </div>

      {objectFormats.length > 0 && (
        <div className="space-y-3">
          {objectFormats.map(f => (
            <div key={f.type} className="bg-muted/30 space-y-3 rounded-md border p-3">
              <div className="text-sm font-medium">{FORMAT_META[f.type].label} options</div>
              {(f.type === 'json' || f.type === 'deterministicJson') && (
                <>
                  <Field label="Prompt (optional)">
                    <Textarea
                      value={f.prompt ?? ''}
                      rows={2}
                      maxLength={10000}
                      placeholder="Extract the product name, price and features"
                      onChange={e => patch(f.type, { prompt: e.target.value })}
                    />
                  </Field>
                  <SchemaField schema={f.schema} onSchema={schema => patch(f.type, { schema })} />
                </>
              )}
              {f.type === 'screenshot' && <ScreenshotOptions f={f} patch={p => patch<ScreenshotFormat>('screenshot', p)} />}
              {f.type === 'changeTracking' && (
                <ChangeTrackingOptions f={f} patch={p => patch<ChangeTrackingFormat>('changeTracking', p)} />
              )}
              {f.type === 'attributes' && (
                <AttributesOptions f={f} patch={p => patch<AttributesFormat>('attributes', p)} />
              )}
              {f.type === 'question' && (
                <Field label="Question">
                  <Textarea
                    value={f.question}
                    rows={2}
                    maxLength={10000}
                    placeholder="What is the refund policy?"
                    onChange={e => emit(list.map(x => (x.type === 'question' ? { type: 'question', question: e.target.value } : x)))}
                  />
                </Field>
              )}
              {f.type === 'highlights' && (
                <Field label="Query">
                  <Input
                    value={f.query}
                    maxLength={10000}
                    placeholder="pricing tiers"
                    onChange={e => emit(list.map(x => (x.type === 'highlights' ? { type: 'highlights', query: e.target.value } : x)))}
                  />
                </Field>
              )}
              {f.type === 'query' && <QueryOptions f={f} onChange={q => emit(list.map(x => (x.type === 'query' ? q : x)))} />}
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="text-destructive space-y-0.5 text-xs">
          {errors.map(e => (
            <div key={e} className="flex items-center gap-1.5">
              <TriangleAlertIcon className="size-3.5" /> {e}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScreenshotOptions({ f, patch }: { f: ScreenshotFormat; patch: (p: Partial<ScreenshotFormat>) => void }) {
  const fullPageId = React.useId()
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-2 sm:col-span-2">
        <Switch id={fullPageId} checked={!!f.fullPage} onCheckedChange={v => patch({ fullPage: v || undefined })} />
        <Label htmlFor={fullPageId}>Full page</Label>
      </div>
      <Field label="Quality (1–100, optional)">
        <NumberInput min={1} max={100} value={f.quality} onChange={quality => patch({ quality })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Viewport width">
          <NumberInput
            min={1}
            max={7680}
            placeholder="1920"
            value={f.viewport?.width}
            onChange={width =>
              patch({
                viewport:
                  width === undefined && !f.viewport?.height
                    ? undefined
                    : { width: width ?? 0, height: f.viewport?.height ?? 0 },
              })
            }
          />
        </Field>
        <Field label="Viewport height">
          <NumberInput
            min={1}
            max={4320}
            placeholder="1080"
            value={f.viewport?.height}
            onChange={height =>
              patch({
                viewport:
                  height === undefined && !f.viewport?.width
                    ? undefined
                    : { width: f.viewport?.width ?? 0, height: height ?? 0 },
              })
            }
          />
        </Field>
      </div>
    </div>
  )
}

function ChangeTrackingOptions({
  f,
  patch,
}: {
  f: ChangeTrackingFormat
  patch: (p: Partial<ChangeTrackingFormat>) => void
}) {
  const modes = f.modes ?? []
  const toggleMode = (m: ChangeTrackingMode, on: boolean) => {
    const next = on ? [...modes.filter(x => x !== m), m] : modes.filter(x => x !== m)
    patch({ modes: next.length ? next : undefined })
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        {(['git-diff', 'json'] as const).map(m => (
          <div key={m} className="flex items-center gap-2">
            <Checkbox id={`ct-${m}`} checked={modes.includes(m)} onCheckedChange={v => toggleMode(m, v === true)} />
            <Label htmlFor={`ct-${m}`} className="font-mono text-xs">
              {m}
            </Label>
          </div>
        ))}
      </div>
      <Field label="Tag (optional)" hint="Separate change-tracking histories per tag.">
        <Input value={f.tag ?? ''} placeholder="production" onChange={e => patch({ tag: e.target.value || undefined })} />
      </Field>
      {modes.includes('json') && (
        <>
          <Field label="Prompt (optional)">
            <Textarea value={f.prompt ?? ''} rows={2} onChange={e => patch({ prompt: e.target.value })} />
          </Field>
          <SchemaField schema={f.schema} onSchema={schema => patch({ schema })} />
        </>
      )}
    </div>
  )
}

function AttributesOptions({ f, patch }: { f: AttributesFormat; patch: (p: Partial<AttributesFormat>) => void }) {
  const set = (i: number, key: 'selector' | 'attribute', v: string) =>
    patch({ selectors: f.selectors.map((s, j) => (j === i ? { ...s, [key]: v } : s)) })
  return (
    <div className="space-y-2">
      {f.selectors.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={s.selector}
            placeholder="CSS selector, e.g. a.product"
            className="font-mono text-xs"
            onChange={e => set(i, 'selector', e.target.value)}
          />
          <Input
            value={s.attribute}
            placeholder="attribute, e.g. href"
            className="font-mono text-xs"
            onChange={e => set(i, 'attribute', e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove selector"
            onClick={() => patch({ selectors: f.selectors.filter((_, j) => j !== i) })}
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => patch({ selectors: [...f.selectors, { selector: '', attribute: '' }] })}
      >
        <PlusIcon /> Add selector
      </Button>
    </div>
  )
}

function QueryOptions({ f, onChange }: { f: QueryFormat; onChange: (q: QueryFormat) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <Field label="Prompt">
        <Input value={f.prompt} onChange={e => onChange({ ...f, prompt: e.target.value })} />
      </Field>
      <Field label="Mode">
        <Select value={f.mode ?? 'freeform'} onValueChange={v => onChange({ ...f, mode: v as QueryFormat['mode'] })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="freeform">freeform</SelectItem>
            <SelectItem value="directQuote">directQuote</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}
