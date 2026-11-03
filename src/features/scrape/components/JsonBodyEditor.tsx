import { AlertCircleIcon, BracesIcon, RotateCcwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface JsonBodyEditorProps {
  value: string
  onChange: (text: string) => void
  /** Parse error for the current text, if any. */
  error?: string
  /** Regenerate the text from the form state. */
  onReset: () => void
}

/** Raw request-body editor for power users. The parsed JSON is sent as-is. */
export function JsonBodyEditor({ value, onChange, error, onReset }: JsonBodyEditorProps) {
  const format = () => {
    try {
      onChange(JSON.stringify(JSON.parse(value), null, 2))
    } catch {
      // keep text; error is already shown
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Edit the exact <code>POST /v2/scrape</code> body. Switching back to another tab applies it to the form.
        </p>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={format} disabled={!!error}>
            <BracesIcon /> Format
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <RotateCcwIcon /> Reset from form
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
        rows={16}
        aria-invalid={!!error || undefined}
        className={cn('min-h-72 font-mono text-xs leading-relaxed [field-sizing:fixed]')}
        onKeyDown={e => {
          if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault()
            const el = e.currentTarget
            const { selectionStart, selectionEnd } = el
            const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`
            onChange(next)
            requestAnimationFrame(() => el.setSelectionRange(selectionStart + 2, selectionStart + 2))
          }
        }}
      />
      {error && (
        <p className="text-destructive flex items-center gap-1.5 text-xs">
          <AlertCircleIcon className="size-3.5" /> {error}
        </p>
      )}
    </div>
  )
}
