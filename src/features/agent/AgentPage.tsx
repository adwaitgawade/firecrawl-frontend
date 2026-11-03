import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { BotIcon, ChevronDownIcon, Loader2Icon, RotateCcwIcon, SendIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { UrlListInput, parseUrlList } from '@/components/shared/UrlListInput'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AgentRequest } from '@/lib/api/types'
import { addJob } from '@/lib/job-history'
import { truncate } from '@/lib/utils'
import { RecentJobsCard } from '@/features/extract/components/RecentJobsCard'
import { SchemaInput } from '@/features/extract/components/SchemaInput'
import { SwitchRow } from '@/features/extract/components/SwitchRow'
import { saveJobRequest } from '@/features/extract/request-store'

import { startAgent } from './api'
import { ModelPicker } from './components/ModelPicker'
import { WebhookFields } from './components/WebhookFields'
import {
  AGENT_EXAMPLE_SCHEMA,
  AGENT_PROMPT_EXAMPLES,
  agentFormFromBody,
  buildAgentBody,
  initialAgentForm,
  type AgentFormState,
} from './form'

interface AgentLocationState {
  body?: AgentRequest
}

export function AgentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = React.useState<AgentFormState>(() => {
    const prefill = (location.state as AgentLocationState | null)?.body
    return prefill ? agentFormFromBody(prefill) : initialAgentForm()
  })
  const [attempted, setAttempted] = React.useState(false)
  const patch = (p: Partial<AgentFormState>) => setForm(f => ({ ...f, ...p }))

  const { body, errors } = React.useMemo(() => buildAgentBody(form), [form])
  const hasUrls = React.useMemo(() => parseUrlList(form.urlsText).urls.length > 0, [form.urlsText])

  const mutation = useMutation({
    mutationFn: startAgent,
    onSuccess: (res, sent) => {
      addJob({ kind: 'agent', id: res.id, label: truncate(sent.prompt, 140), status: 'processing' })
      saveJobRequest(res.id, sent)
      toast.success('Agent started')
      navigate(`/agent/${res.id}`)
    },
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    if (errors.length) return
    mutation.mutate(body)
  }

  const busy = mutation.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BotIcon}
        title="Agent"
        description="Describe what you need — the agent searches, browses and returns the answer as structured data."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setForm(initialAgentForm())
              setAttempted(false)
              mutation.reset()
            }}
          >
            <RotateCcwIcon /> Reset
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form onSubmit={onSubmit} className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task</CardTitle>
              <CardDescription>What should the agent find out?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                id="agent-prompt"
                aria-label="Prompt"
                rows={5}
                value={form.prompt}
                disabled={busy}
                maxLength={10000}
                placeholder={AGENT_PROMPT_EXAMPLES[0]}
                className="text-base md:text-sm"
                onChange={e => patch({ prompt: e.target.value })}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {AGENT_PROMPT_EXAMPLES.map(p => (
                    <button
                      key={p}
                      type="button"
                      disabled={busy}
                      onClick={() => patch({ prompt: p })}
                      className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground max-w-full truncate rounded-full border px-2.5 py-0.5 text-xs transition-colors"
                    >
                      {truncate(p, 48)}
                    </button>
                  ))}
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">{form.prompt.length}/10000</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model</CardTitle>
            </CardHeader>
            <CardContent>
              <ModelPicker value={form.model} onChange={model => patch({ model })} disabled={busy} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Starting URLs</CardTitle>
              <CardDescription>Optional. Point the agent at specific pages to start from.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <UrlListInput
                value={form.urlsText}
                onChange={text => patch({ urlsText: text })}
                rows={3}
                disabled={busy}
                placeholder={'https://firecrawl.dev/pricing'}
              />
              <SwitchRow
                label="Strictly constrain to these URLs"
                hint={hasUrls ? "Don't browse beyond the URLs above" : 'Add URLs to enable'}
                checked={form.strictConstrainToURLs && hasUrls}
                onCheckedChange={v => patch({ strictConstrainToURLs: v })}
                disabled={busy || !hasUrls}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Output schema</CardTitle>
              <CardDescription>Optional JSON schema for the result. Without one, the agent picks the shape.</CardDescription>
            </CardHeader>
            <CardContent>
              <SchemaInput
                value={form.schema}
                onChange={schema => patch({ schema })}
                example={AGENT_EXAMPLE_SCHEMA}
                disabled={busy}
              />
            </CardContent>
          </Card>

          <Collapsible className="rounded-xl border">
            <CollapsibleTrigger className="group hover:bg-muted/50 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium">
              <ChevronDownIcon className="text-muted-foreground size-4 transition-transform group-data-[state=closed]:-rotate-90" />
              Limits &amp; webhook
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 border-t p-4">
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="agent-max-credits">Max credits</Label>
                <Input
                  id="agent-max-credits"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="No cap"
                  value={form.maxCredits}
                  disabled={busy}
                  onChange={e => patch({ maxCredits: e.target.value })}
                />
                <p className="text-muted-foreground text-xs">
                  Upper bound on credits this run may spend.
                  {Number(form.maxCredits) > 2500 && ' Above 2,500 the run never uses a free request.'}
                </p>
              </div>
              <WebhookFields url={form.webhookUrl} events={form.webhookEvents} onChange={patch} disabled={busy} />
            </CollapsibleContent>
          </Collapsible>

          {attempted && errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>Fix these before submitting</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errors.map(e => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {mutation.isError && <ErrorAlert error={mutation.error} title="Could not start agent" />}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy || (attempted && errors.length > 0)} className="min-w-32">
              {busy ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
              {busy ? 'Starting…' : 'Run agent'}
            </Button>
            <span className="text-muted-foreground text-xs">⌘/Ctrl + Enter to submit. Runs asynchronously.</span>
          </div>

          <RequestPreview method="POST" path="/agent" body={body} />
        </form>

        <aside className="space-y-6">
          <RecentJobsCard kind="agent" title="Recent agent runs" />
        </aside>
      </div>
    </div>
  )
}
