import * as React from 'react'
import { Loader2Icon, PlusIcon, SaveIcon } from 'lucide-react'

import { ErrorAlert, KeyValueEditor, RequestPreview, TagListInput } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

import { buildMonitorRequest, newTarget, type MonitorFormState, type TargetDraft } from '../form-state'
import { MONITOR_WEBHOOK_EVENTS, type CreateMonitorRequest, type Monitor, type UpdateMonitorRequest } from '../types'
import { ScheduleField } from './ScheduleField'
import { TargetEditor } from './TargetEditor'

type MonitorFormProps =
  | {
      mode: 'create'
      initial: MonitorFormState
      existing?: undefined
      pending: boolean
      error: unknown
      onSubmit: (body: CreateMonitorRequest) => void
      onCancel?: () => void
    }
  | {
      mode: 'edit'
      initial: MonitorFormState
      existing: Monitor
      pending: boolean
      error: unknown
      onSubmit: (body: UpdateMonitorRequest) => void
      onCancel?: () => void
    }

function SwitchRow({
  id,
  label,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  label: string
  hint?: React.ReactNode
  checked: boolean
  disabled?: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function MonitorForm(props: MonitorFormProps) {
  const { mode, initial, pending, error, onCancel } = props
  const [state, setState] = React.useState<MonitorFormState>(initial)
  const [showErrors, setShowErrors] = React.useState(false)
  const patch = (p: Partial<MonitorFormState>) => setState(s => ({ ...s, ...p }))
  const patchTarget = (key: string, p: Partial<TargetDraft>) =>
    setState(s => ({ ...s, targets: s.targets.map(t => (t.key === key ? { ...t, ...p } : t)) }))

  const built =
    props.mode === 'create' ? buildMonitorRequest(state, 'create') : buildMonitorRequest(state, 'edit', props.existing)
  const hadWebhook = mode === 'edit' && !!props.existing?.webhook?.url

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (built.errors.length) return
    if (props.mode === 'create') props.onSubmit(built.body as CreateMonitorRequest)
    else props.onSubmit(built.body as UpdateMonitorRequest)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div className="space-y-1.5">
            <Label htmlFor="monitor-name">Name</Label>
            <Input
              id="monitor-name"
              value={state.name}
              maxLength={256}
              placeholder="Competitor pricing pages"
              onChange={e => patch({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="monitor-retention">Retention (days)</Label>
            <Input
              id="monitor-retention"
              type="number"
              min={1}
              max={365}
              value={state.retentionDays}
              onChange={e => patch({ retentionDays: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>How often checks run. Each check re-scrapes every target.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleField state={state} onChange={patch} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold">Targets</h3>
            <p className="text-muted-foreground text-sm">What to watch — up to 50 targets.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={state.targets.length >= 50}
            onClick={() => patch({ targets: [...state.targets, newTarget('scrape')] })}
          >
            <PlusIcon /> Add target
          </Button>
        </div>
        {state.targets.map((t, i) => (
          <TargetEditor
            key={t.key}
            index={i}
            draft={t}
            onChange={p => patchTarget(t.key, p)}
            onRemove={
              state.targets.length > 1
                ? () => patch({ targets: state.targets.filter(x => x.key !== t.key) })
                : undefined
            }
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goal &amp; AI judge</CardTitle>
          <CardDescription>
            Describe what counts as a meaningful change. The judge filters out noise and explains each change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={state.goal}
            maxLength={2000}
            rows={3}
            placeholder="Alert me when prices, plan limits or feature lists change. Ignore copy tweaks and footer changes."
            onChange={e => patch({ goal: e.target.value })}
          />
          <SwitchRow
            id="judge-enabled"
            label="Enable AI judge"
            hint="Uses an LLM to judge whether a change matches the goal (extra credits)."
            checked={state.judgeEnabled}
            onCheckedChange={v => patch({ judgeEnabled: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SwitchRow
            id="email-enabled"
            label="Email"
            hint="Recipients must confirm their subscription before receiving alerts."
            checked={state.emailEnabled}
            onCheckedChange={v => patch({ emailEnabled: v })}
          />
          {state.emailEnabled && (
            <div className="space-y-3 border-l-2 pl-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Recipients (max 25)</Label>
                <TagListInput
                  value={state.emailRecipients}
                  onChange={emailRecipients => patch({ emailRecipients })}
                  placeholder="alice@example.com, bob@example.com"
                />
              </div>
              <SwitchRow
                id="include-diffs"
                label="Include diffs in emails"
                checked={state.includeDiffs}
                onCheckedChange={v => patch({ includeDiffs: v })}
              />
            </div>
          )}
          {state.slack?.enabled && (
            <p className="text-muted-foreground text-xs">
              Slack alerts to <span className="font-mono">#{state.slack.channelName ?? state.slack.channelId}</span> are
              configured and will be kept.
            </p>
          )}

          <SwitchRow
            id="webhook-enabled"
            label="Webhook"
            hint={
              hadWebhook && state.webhookEnabled
                ? 'The API cannot remove a webhook once set; you can change its URL and events.'
                : 'POST check results to your endpoint.'
            }
            checked={state.webhookEnabled}
            disabled={hadWebhook}
            onCheckedChange={v => patch({ webhookEnabled: v })}
          />
          {state.webhookEnabled && (
            <div className="space-y-3 border-l-2 pl-4">
              <div className="space-y-1.5">
                <Label htmlFor="webhook-url" className="text-xs">
                  URL
                </Label>
                <Input
                  id="webhook-url"
                  value={state.webhookUrl}
                  placeholder="https://example.com/hooks/firecrawl"
                  className="font-mono"
                  onChange={e => patch({ webhookUrl: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Events</Label>
                <div className="flex flex-wrap gap-4">
                  {MONITOR_WEBHOOK_EVENTS.map(ev => (
                    <label key={ev} className="flex items-center gap-2 font-mono text-xs">
                      <Checkbox
                        checked={state.webhookEvents.includes(ev)}
                        onCheckedChange={c =>
                          patch({
                            webhookEvents: c
                              ? [...state.webhookEvents, ev]
                              : state.webhookEvents.filter(x => x !== ev),
                          })
                        }
                      />
                      {ev}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Headers</Label>
                <KeyValueEditor
                  value={state.webhookHeaders}
                  onChange={webhookHeaders => patch({ webhookHeaders })}
                  keyPlaceholder="Header"
                  addLabel="Add header"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Metadata</Label>
                <KeyValueEditor
                  value={state.webhookMetadata}
                  onChange={webhookMetadata => patch({ webhookMetadata })}
                  keyPlaceholder="Key"
                  addLabel="Add metadata"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showErrors && built.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>Please fix the following</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-0.5 pl-4">
              {built.errors.map(err => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {!!error && <ErrorAlert error={error} title={mode === 'create' ? 'Could not create monitor' : 'Could not save changes'} />}

      <RequestPreview
        method={mode === 'create' ? 'POST' : 'PATCH'}
        path={mode === 'create' ? '/monitor' : `/monitor/${props.existing?.id}`}
        body={built.body}
      />

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : mode === 'create' ? <PlusIcon /> : <SaveIcon />}
          {mode === 'create' ? 'Create monitor' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
