import * as React from 'react'

import { KeyValueEditor } from '@/components/shared/KeyValueEditor'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { WebhookEvent } from '@/lib/api/types'

import { WEBHOOK_EVENTS } from '../crawl-form'
import type { WebhookFormState } from '../types'
import { Field } from './form-fields'

const EVENT_HINTS: Record<WebhookEvent, string> = {
  started: 'Crawl started',
  page: 'Each page scraped',
  completed: 'Crawl finished',
  failed: 'Crawl failed',
}

export function WebhookFields({ value, onChange }: { value: WebhookFormState; onChange: (v: WebhookFormState) => void }) {
  const id = React.useId()
  const disabled = !value.url.trim()
  const toggleEvent = (event: WebhookEvent, on: boolean) =>
    onChange({
      ...value,
      events: on
        ? WEBHOOK_EVENTS.filter(e => e === event || value.events.includes(e))
        : value.events.filter(e => e !== event),
    })

  return (
    <div className="space-y-4">
      <Field label="Webhook URL" htmlFor={`${id}-url`} hint="Receives POST notifications signed with X-Firecrawl-Signature.">
        <Input
          id={`${id}-url`}
          className="font-mono"
          placeholder="https://example.com/webhooks/firecrawl"
          value={value.url}
          onChange={e => onChange({ ...value, url: e.target.value })}
        />
      </Field>
      <div className="space-y-1.5">
        <Label className="text-xs">Events</Label>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {WEBHOOK_EVENTS.map(event => (
            <label key={event} className="flex items-center gap-2 text-sm" title={EVENT_HINTS[event]}>
              <Checkbox
                checked={value.events.includes(event)}
                disabled={disabled}
                onCheckedChange={c => toggleEvent(event, c === true)}
              />
              <span className="font-mono">{event}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Headers">
          <KeyValueEditor
            value={value.headers}
            onChange={headers => onChange({ ...value, headers })}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
            addLabel="Add header"
            disabled={disabled}
          />
        </Field>
        <Field label="Metadata" hint="Echoed back in every webhook payload.">
          <KeyValueEditor
            value={value.metadata}
            onChange={metadata => onChange({ ...value, metadata })}
            keyPlaceholder="Key"
            valuePlaceholder="Value"
            addLabel="Add metadata"
            disabled={disabled}
          />
        </Field>
      </div>
    </div>
  )
}
