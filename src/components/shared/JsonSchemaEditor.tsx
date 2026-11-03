import * as React from 'react'
import { WandSparklesIcon } from 'lucide-react'

import { parseJson } from '@/components/shared/scrape-options'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { JsonSchema } from '@/lib/api/types'
import { cn } from '@/lib/utils'

export const EXAMPLE_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    price: { type: 'number' },
    features: { type: 'array', items: { type: 'string' } },
  },
  required: ['title'],
}

/**
 * Parse schema text. Returns `{ schema }` (undefined when empty) or `{ error }`.
 * Also rejects non-object JSON.
 */
export function parseJsonSchema(text: string): { schema?: JsonSchema; error?: string } {
  const { value, error } = parseJson<unknown>(text)
  if (error) return { error }
  if (value === undefined) return { schema: undefined }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: 'Schema must be a JSON object' }
  }
  return { schema: value as JsonSchema }
}

export interface JsonSchemaEditorProps {
  /** Raw JSON text. */
  value: string
  /** Called with the new text plus parse result. */
  onChange: (text: string, result: { schema?: JsonSchema; error?: string }) => void
  placeholder?: string
  rows?: number
  /** Show "Example" / "Format" buttons (default true). */
  showToolbar?: boolean
  /** Example inserted by the "Example" button. */
  example?: JsonSchema
  disabled?: boolean
  className?: string
}

/** JSON textarea with live validation, "Format" and "Insert example" helpers. */
export function JsonSchemaEditor({
  value,
  onChange,
  placeholder = '{\n  "type": "object",\n  "properties": { ... }\n}',
  rows = 8,
  showToolbar = true,
  example = EXAMPLE_JSON_SCHEMA,
  disabled,
  className,
}: JsonSchemaEditorProps) {
  const result = React.useMemo(() => parseJsonSchema(value), [value])
  const emit = (text: string) => onChange(text, parseJsonSchema(text))

  return (
    <div className={cn('space-y-1.5', className)}>
      <Textarea
        value={value}
        rows={rows}
        disabled={disabled}
        spellCheck={false}
        placeholder={placeholder}
        aria-invalid={!!result.error || undefined}
        className="min-h-32 font-mono text-xs [field-sizing:fixed]"
        onChange={e => emit(e.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('text-xs', result.error ? 'text-destructive' : 'text-muted-foreground')}>
          {result.error ? `Invalid JSON: ${result.error}` : value.trim() ? 'Valid JSON' : 'Optional'}
        </span>
        {showToolbar && (
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={disabled}
              onClick={() => emit(JSON.stringify(example, null, 2))}
            >
              <WandSparklesIcon /> Example
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={disabled || !!result.error || !value.trim()}
              onClick={() => emit(JSON.stringify(result.schema, null, 2))}
            >
              Format
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
