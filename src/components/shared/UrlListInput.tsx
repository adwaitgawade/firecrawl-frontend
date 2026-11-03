import * as React from 'react'

import { Textarea } from '@/components/ui/textarea'
import { cn, isValidUrl } from '@/lib/utils'

export interface ParsedUrlList {
  /** Valid, de-duplicated URLs in input order. */
  urls: string[]
  /** Lines that don't look like http(s) URLs. */
  invalid: string[]
}

/** Split text on newlines / commas / whitespace into URLs, validating each. */
export function parseUrlList(text: string): ParsedUrlList {
  const seen = new Set<string>()
  const urls: string[] = []
  const invalid: string[] = []
  for (const part of text.split(/[\s,]+/)) {
    const v = part.trim()
    if (!v) continue
    if (!isValidUrl(v)) {
      invalid.push(v)
      continue
    }
    if (!seen.has(v)) {
      seen.add(v)
      urls.push(v)
    }
  }
  return { urls, invalid }
}

export interface UrlListInputProps
  extends Omit<React.ComponentProps<'textarea'>, 'value' | 'onChange'> {
  /** Raw textarea text (one URL per line). Use `parseUrlList(text)` to get the URLs. */
  value: string
  onChange: (text: string, parsed: ParsedUrlList) => void
  /** Optional max number of URLs; shows a warning when exceeded. */
  max?: number
}

/** Multi-line URL input with live count + validation feedback. */
export function UrlListInput({ value, onChange, max, className, rows = 6, placeholder, ...props }: UrlListInputProps) {
  const parsed = React.useMemo(() => parseUrlList(value), [value])
  const over = max !== undefined && parsed.urls.length > max
  return (
    <div className="space-y-1.5">
      <Textarea
        value={value}
        rows={rows}
        placeholder={placeholder ?? 'https://example.com\nhttps://firecrawl.dev/pricing'}
        className={cn('min-h-28 font-mono text-xs [field-sizing:fixed]', className)}
        aria-invalid={parsed.invalid.length > 0 || over || undefined}
        onChange={e => onChange(e.target.value, parseUrlList(e.target.value))}
        {...props}
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-muted-foreground">
          {parsed.urls.length} valid URL{parsed.urls.length === 1 ? '' : 's'}
          {max !== undefined && ` (max ${max})`}
        </span>
        {over && <span className="text-destructive">Too many URLs.</span>}
        {parsed.invalid.length > 0 && (
          <span className="text-destructive truncate" title={parsed.invalid.join('\n')}>
            {parsed.invalid.length} invalid: {parsed.invalid.slice(0, 3).join(', ')}
            {parsed.invalid.length > 3 && '…'}
          </span>
        )}
      </div>
    </div>
  )
}
