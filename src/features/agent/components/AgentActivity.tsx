import { BotIcon, GlobeIcon, SearchIcon, SparklesIcon } from 'lucide-react'

const STAGES = [
  { icon: SearchIcon, text: 'Plans and searches the web' },
  { icon: GlobeIcon, text: 'Browses and reads relevant pages' },
  { icon: SparklesIcon, text: 'Synthesizes the answer (matching your schema)' },
]

interface AgentActivityProps {
  /** Webhook configured for the run, if any (where step events go). */
  hasWebhook: boolean
}

/**
 * "Working" panel. The status API does not expose individual agent steps, so this explains what is
 * happening instead of faking progress; real per-action events are delivered to the run's webhook.
 */
export function AgentActivity({ hasWebhook }: AgentActivityProps) {
  return (
    <div className="bg-muted/30 flex items-start gap-3 rounded-lg border p-4">
      <div className="bg-primary/10 text-primary relative flex size-10 shrink-0 items-center justify-center rounded-full">
        <BotIcon className="size-5" />
        <span className="bg-primary absolute -top-0.5 -right-0.5 size-2.5 animate-ping rounded-full" />
      </div>
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-medium">The agent is working on your task…</p>
        <ul className="text-muted-foreground space-y-1">
          {STAGES.map(s => (
            <li key={s.text} className="flex items-center gap-2 text-xs">
              <s.icon className="size-3.5 shrink-0" /> {s.text}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs">
          The status endpoint only reports the final result.{' '}
          {hasWebhook
            ? 'Per-step events are being sent to your webhook.'
            : 'Configure a webhook with the "action" event to receive per-step updates.'}
        </p>
      </div>
    </div>
  )
}
