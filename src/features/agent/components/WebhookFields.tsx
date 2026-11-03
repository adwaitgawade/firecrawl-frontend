import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AgentWebhookEvent } from '@/lib/api/types'

import { AGENT_WEBHOOK_EVENTS } from '../types'

interface WebhookFieldsProps {
  url: string
  events: AgentWebhookEvent[]
  onChange: (patch: { webhookUrl?: string; webhookEvents?: AgentWebhookEvent[] }) => void
  disabled?: boolean
}

export function WebhookFields({ url, events, onChange, disabled }: WebhookFieldsProps) {
  const toggle = (e: AgentWebhookEvent, on: boolean) =>
    onChange({ webhookEvents: on ? [...events, e] : events.filter(x => x !== e) })
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="agent-webhook">Webhook URL</Label>
        <Input
          id="agent-webhook"
          type="url"
          value={url}
          disabled={disabled}
          placeholder="https://example.com/hooks/firecrawl"
          className="font-mono text-xs"
          onChange={e => onChange({ webhookUrl: e.target.value })}
        />
        <p className="text-muted-foreground text-xs">
          Receives <code className="font-mono">action</code> events as the agent works — the status endpoint only reports
          the final result.
        </p>
      </div>
      {url.trim() && (
        <div className="space-y-1.5">
          <span className="text-muted-foreground text-xs font-medium">Events (none selected = all)</span>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {AGENT_WEBHOOK_EVENTS.map(e => (
              <label key={e} className="flex items-center gap-2 text-sm">
                <Checkbox checked={events.includes(e)} disabled={disabled} onCheckedChange={v => toggle(e, v === true)} />
                <span className="font-mono text-xs">{e}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
