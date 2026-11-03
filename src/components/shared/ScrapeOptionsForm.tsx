import * as React from 'react'
import { ChevronDownIcon, SlidersHorizontalIcon } from 'lucide-react'

import { ActionsEditor } from '@/components/shared/ActionsEditor'
import { KeyValueEditor } from '@/components/shared/KeyValueEditor'
import { TagListInput } from '@/components/shared/TagListInput'
import { cleanScrapeOptions } from '@/components/shared/scrape-options'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import type { Parser, PdfParserMode, ProxyMode, ScrapeOptions } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export { defaultScrapeOptions, cleanScrapeOptions } from '@/components/shared/scrape-options'

/** Fields of ScrapeOptions this form can edit (formats is handled by FormatSelector). */
export type ScrapeOptionsField = Exclude<keyof ScrapeOptions, 'formats'>

export interface ScrapeOptionsFormProps {
  value: ScrapeOptions
  onChange: (value: ScrapeOptions) => void
  /** Fields to hide (e.g. `['actions']` for crawl, or fields an endpoint doesn't support). */
  hide?: ScrapeOptionsField[]
  /** Start expanded (default false). */
  defaultOpen?: boolean
  /** Render without the collapsible wrapper. */
  inline?: boolean
  title?: string
  className?: string
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{title}</h4>
      {children}
    </div>
  )
}

function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string
  hint?: React.ReactNode
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

function SwitchField({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  hint?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border p-2.5">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

const numOrUndef = (v: string) => (v === '' ? undefined : Number(v))

function pdfParser(parsers: Parser[] | undefined) {
  if (parsers === undefined) return { enabled: true, mode: undefined, maxPages: undefined }
  const p = parsers.find(x => x === 'pdf' || (typeof x === 'object' && x.type === 'pdf'))
  if (!p) return { enabled: false, mode: undefined, maxPages: undefined }
  if (p === 'pdf') return { enabled: true, mode: undefined, maxPages: undefined }
  return { enabled: true, mode: p.mode, maxPages: p.maxPages }
}

function buildParsers(enabled: boolean, mode?: PdfParserMode, maxPages?: number): Parser[] | undefined {
  if (!enabled) return []
  if (!mode && !maxPages) return undefined
  return [{ type: 'pdf', ...(mode ? { mode } : {}), ...(maxPages ? { maxPages } : {}) }]
}

/**
 * Advanced scrape options shared by scrape / batch / crawl / search / extract. Does NOT edit
 * `formats` — pair with `<FormatSelector>`. Use `cleanScrapeOptions(value)` when building the body.
 */
export function ScrapeOptionsForm({
  value,
  onChange,
  hide = [],
  defaultOpen = false,
  inline = false,
  title = 'Advanced options',
  className,
}: ScrapeOptionsFormProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const id = React.useId()
  const show = (f: ScrapeOptionsField) => !hide.includes(f)
  const set = <K extends keyof ScrapeOptions>(key: K, v: ScrapeOptions[K]) => onChange({ ...value, [key]: v })

  const modifiedCount = React.useMemo(() => {
    const { formats: _formats, ...rest } = cleanScrapeOptions(value)
    return Object.keys(rest).length
  }, [value])

  const pdf = pdfParser(value.parsers)

  const body = (
    <div className="space-y-5">
      <Section title="Content">
        <div className="grid gap-2 sm:grid-cols-2">
          {show('onlyMainContent') && (
            <SwitchField
              id={`${id}-omc`}
              label="Only main content"
              hint="Strip headers, navs, footers"
              checked={value.onlyMainContent ?? true}
              onCheckedChange={v => set('onlyMainContent', v)}
            />
          )}
          {show('onlyCleanContent') && (
            <SwitchField
              id={`${id}-occ`}
              label="Only clean content"
              hint="Extra cleanup of boilerplate"
              checked={value.onlyCleanContent ?? false}
              onCheckedChange={v => set('onlyCleanContent', v)}
            />
          )}
          {show('removeBase64Images') && (
            <SwitchField
              id={`${id}-b64`}
              label="Remove base64 images"
              checked={value.removeBase64Images ?? true}
              onCheckedChange={v => set('removeBase64Images', v)}
            />
          )}
          {show('blockAds') && (
            <SwitchField
              id={`${id}-ads`}
              label="Block ads"
              hint="Ads and cookie popups"
              checked={value.blockAds ?? true}
              onCheckedChange={v => set('blockAds', v)}
            />
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {show('includeTags') && (
            <Field label="Include tags" hint="CSS selectors, comma-separated">
              <TagListInput
                className="font-mono text-xs"
                placeholder="article, .content, #main"
                value={value.includeTags}
                onChange={v => set('includeTags', v)}
              />
            </Field>
          )}
          {show('excludeTags') && (
            <Field label="Exclude tags" hint="CSS selectors, comma-separated">
              <TagListInput
                className="font-mono text-xs"
                placeholder="nav, footer, .ads"
                value={value.excludeTags}
                onChange={v => set('excludeTags', v)}
              />
            </Field>
          )}
        </div>
      </Section>

      {(show('waitFor') || show('timeout') || show('mobile') || show('proxy') || show('location')) && (
        <>
          <Separator />
          <Section title="Browser">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {show('waitFor') && (
                <Field label="Wait for (ms)" htmlFor={`${id}-wait`} hint="0–60000; ≤ timeout/2">
                  <Input
                    id={`${id}-wait`}
                    type="number"
                    min={0}
                    max={60000}
                    step={500}
                    placeholder="0"
                    value={value.waitFor || ''}
                    onChange={e => set('waitFor', numOrUndef(e.target.value))}
                  />
                </Field>
              )}
              {show('timeout') && (
                <Field label="Timeout (ms)" htmlFor={`${id}-timeout`} hint="min 1000">
                  <Input
                    id={`${id}-timeout`}
                    type="number"
                    min={1000}
                    step={1000}
                    placeholder="default"
                    value={value.timeout ?? ''}
                    onChange={e => set('timeout', numOrUndef(e.target.value))}
                  />
                </Field>
              )}
              {show('proxy') && (
                <Field label="Proxy">
                  <Select value={value.proxy ?? 'auto'} onValueChange={v => set('proxy', v as ProxyMode)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">auto</SelectItem>
                      <SelectItem value="basic">basic</SelectItem>
                      <SelectItem value="enhanced">enhanced</SelectItem>
                      <SelectItem value="stealth">stealth</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              {show('mobile') && (
                <Field label="Device">
                  <div className="flex h-9 items-center gap-2">
                    <Switch id={`${id}-mobile`} checked={value.mobile ?? false} onCheckedChange={v => set('mobile', v)} />
                    <Label htmlFor={`${id}-mobile`} className="font-normal">
                      Emulate mobile
                    </Label>
                  </div>
                </Field>
              )}
            </div>
            {show('location') && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Country" hint="ISO 3166-1 alpha-2, e.g. US, DE">
                  <Input
                    maxLength={12}
                    placeholder="US"
                    value={value.location?.country ?? ''}
                    onChange={e => set('location', { ...value.location, country: e.target.value || undefined })}
                  />
                </Field>
                <Field label="Languages" hint="Comma-separated, e.g. en-US, de">
                  <TagListInput
                    placeholder="en-US"
                    value={value.location?.languages}
                    onChange={v => set('location', { ...value.location, languages: v })}
                  />
                </Field>
              </div>
            )}
            {show('skipTlsVerification') && (
              <SwitchField
                id={`${id}-tls`}
                label="Skip TLS verification"
                hint="Server default: on, unless headers or actions are set"
                checked={value.skipTlsVerification ?? false}
                onCheckedChange={v => set('skipTlsVerification', v ? true : undefined)}
              />
            )}
          </Section>
        </>
      )}

      {(show('maxAge') || show('storeInCache')) && (
        <>
          <Separator />
          <Section title="Cache">
            <div className="grid gap-3 sm:grid-cols-2">
              {show('maxAge') && (
                <Field label="Max age (ms)" htmlFor={`${id}-maxage`} hint="Use cached data younger than this; 0 forces a fresh scrape">
                  <Input
                    id={`${id}-maxage`}
                    type="number"
                    min={0}
                    placeholder="server default"
                    value={value.maxAge ?? ''}
                    onChange={e => set('maxAge', numOrUndef(e.target.value))}
                  />
                </Field>
              )}
              {show('storeInCache') && (
                <SwitchField
                  id={`${id}-store`}
                  label="Store in cache"
                  checked={value.storeInCache ?? true}
                  onCheckedChange={v => set('storeInCache', v)}
                />
              )}
            </div>
          </Section>
        </>
      )}

      {show('parsers') && (
        <>
          <Separator />
          <Section title="PDF parsing">
            <div className="grid gap-3 sm:grid-cols-3">
              <SwitchField
                id={`${id}-pdf`}
                label="Parse PDFs"
                checked={pdf.enabled}
                onCheckedChange={v => set('parsers', buildParsers(v, pdf.mode, pdf.maxPages))}
              />
              <Field label="Mode">
                <Select
                  disabled={!pdf.enabled}
                  value={pdf.mode ?? 'auto'}
                  onValueChange={v =>
                    set('parsers', buildParsers(true, v === 'auto' ? undefined : (v as PdfParserMode), pdf.maxPages))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">auto</SelectItem>
                    <SelectItem value="fast">fast</SelectItem>
                    <SelectItem value="ocr">ocr</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Max pages">
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  disabled={!pdf.enabled}
                  placeholder="all"
                  value={pdf.maxPages ?? ''}
                  onChange={e => set('parsers', buildParsers(true, pdf.mode, numOrUndef(e.target.value)))}
                />
              </Field>
            </div>
          </Section>
        </>
      )}

      {show('headers') && (
        <>
          <Separator />
          <Section title="Headers">
            <KeyValueEditor
              value={value.headers}
              onChange={v => set('headers', v)}
              keyPlaceholder="Header name"
              valuePlaceholder="Value"
              addLabel="Add header"
            />
          </Section>
        </>
      )}

      {show('actions') && (
        <>
          <Separator />
          <Section title="Actions">
            <ActionsEditor value={value.actions} onChange={v => set('actions', v)} />
          </Section>
        </>
      )}

      {(show('redactPII') || show('lockdown')) && (
        <>
          <Separator />
          <Section title="Other">
            <div className="grid gap-2 sm:grid-cols-2">
              {show('redactPII') && (
                <SwitchField
                  id={`${id}-pii`}
                  label="Redact PII"
                  hint="Mask names, emails, phones, … in the output"
                  checked={!!value.redactPII}
                  onCheckedChange={v => set('redactPII', v ? true : undefined)}
                />
              )}
              {show('lockdown') && (
                <SwitchField
                  id={`${id}-lockdown`}
                  label="Lockdown"
                  hint="Serve from cache only; never hit the live site"
                  checked={value.lockdown ?? false}
                  onCheckedChange={v => set('lockdown', v)}
                />
              )}
            </div>
          </Section>
        </>
      )}
    </div>
  )

  if (inline) return <div className={className}>{body}</div>

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn('rounded-lg border', className)}>
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium">
        <SlidersHorizontalIcon className="text-muted-foreground size-4" />
        {title}
        {modifiedCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {modifiedCount} set
          </Badge>
        )}
        <ChevronDownIcon className={cn('text-muted-foreground ml-auto size-4 transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-4">{body}</CollapsibleContent>
    </Collapsible>
  )
}
