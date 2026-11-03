import { KeyValueEditor } from '@/components/shared/KeyValueEditor'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { isValidUrl } from '@/lib/utils'

import { WEBHOOK_EVENTS } from '../request'
import type { WebhookFormState } from '../types'

interface WebhookEditorProps {
  value: WebhookFormState
  onChange: (value: WebhookFormState) => void
}

const EVENT_HINTS: Record<string, string> = {
  started: 'batch started',
  page: 'each scraped page',
  completed: 'batch finished',
  failed: 'batch failed',
}

export function WebhookEditor({ value, onChange }: WebhookEditorProps) {
  const urlInvalid = value.enabled && value.url.trim() !== '' && !isValidUrl(value.url)
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="batch-webhook">Webhook</Label>
          <p className="text-muted-foreground text-xs">POST events for this batch to your endpoint.</p>
        </div>
        <Switch
          id="batch-webhook"
          checked={value.enabled}
          onCheckedChange={enabled => onChange({ ...value, enabled })}
        />
      </div>
      {value.enabled && (
        <div className="space-y-3 border-l-2 pl-3">
          <div className="space-y-1.5">
            <Label htmlFor="batch-webhook-url" className="text-xs">
              URL
            </Label>
            <Input
              id="batch-webhook-url"
              value={value.url}
              onChange={e => onChange({ ...value, url: e.target.value })}
              placeholder="https://example.com/webhooks/firecrawl"
              className="font-mono text-xs"
              aria-invalid={urlInvalid || undefined}
            />
            {urlInvalid && <p className="text-destructive text-xs">Enter a valid URL.</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Events</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {WEBHOOK_EVENTS.map(ev => (
                <label key={ev} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={value.events.includes(ev)}
                    onCheckedChange={checked =>
                      onChange({
                        ...value,
                        events: checked
                          ? WEBHOOK_EVENTS.filter(e => e === ev || value.events.includes(e))
                          : value.events.filter(e => e !== ev),
                      })
                    }
                  />
                  <span className="font-mono text-xs">{ev}</span>
                  <span className="text-muted-foreground hidden text-xs sm:inline">({EVENT_HINTS[ev]})</span>
                </label>
              ))}
            </div>
            {value.events.length === 0 && (
              <p className="text-warning text-xs">No events selected — the webhook will never fire.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Headers</Label>
            <KeyValueEditor
              value={value.headers}
              onChange={headers => onChange({ ...value, headers })}
              keyPlaceholder="Authorization"
              valuePlaceholder="Bearer …"
              addLabel="Add header"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Metadata</Label>
            <KeyValueEditor
              value={value.metadata}
              onChange={metadata => onChange({ ...value, metadata })}
              keyPlaceholder="key"
              valuePlaceholder="value"
              addLabel="Add metadata"
            />
          </div>
        </div>
      )}
    </div>
  )
}
