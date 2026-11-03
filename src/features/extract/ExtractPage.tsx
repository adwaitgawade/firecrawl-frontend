import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronDownIcon, FileJsonIcon, Loader2Icon, RotateCcwIcon, SparklesIcon } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { UrlListInput } from '@/components/shared/UrlListInput'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { addJob } from '@/lib/job-history'

import { startExtract } from './api'
import { ExtractOptionsSection } from './components/ExtractOptionsSection'
import { RecentJobsCard } from './components/RecentJobsCard'
import { SchemaInput } from './components/SchemaInput'
import {
  EXTRACT_EXAMPLE_SCHEMA,
  EXTRACT_MAX_URLS,
  buildExtractBody,
  extractFormFromBody,
  extractJobLabel,
  initialExtractForm,
  type ExtractFormState,
} from './form'
import { saveJobRequest } from './request-store'
import type { ExtractRequestBody } from './types'

interface ExtractLocationState {
  body?: ExtractRequestBody
}

export function ExtractPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [form, setForm] = React.useState<ExtractFormState>(() => {
    const prefill = (location.state as ExtractLocationState | null)?.body
    if (prefill) return extractFormFromBody(prefill)
    const initial = initialExtractForm()
    const url = searchParams.get('url')
    return url ? { ...initial, urlsText: url } : initial
  })
  const [attempted, setAttempted] = React.useState(false)
  const patch = (p: Partial<ExtractFormState>) => setForm(f => ({ ...f, ...p }))

  const { body, errors } = React.useMemo(() => buildExtractBody(form), [form])

  const mutation = useMutation({
    mutationFn: startExtract,
    onSuccess: (res, sent) => {
      addJob({ kind: 'extract', id: res.id, label: extractJobLabel(sent), status: 'processing' })
      saveJobRequest(res.id, sent)
      if (res.invalidURLs?.length) {
        toast.warning(`${res.invalidURLs.length} URL(s) were skipped as unsupported`, {
          description: res.invalidURLs.slice(0, 3).join(', '),
        })
      } else {
        toast.success('Extract job started')
      }
      navigate(`/extract/${res.id}`)
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
        icon={FileJsonIcon}
        title="Extract"
        description="Pull structured data from one or more pages (or the web) with a prompt and an optional JSON schema."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setForm(initialExtractForm())
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
              <CardTitle className="text-base">URLs</CardTitle>
              <CardDescription>
                Up to {EXTRACT_MAX_URLS} URLs. End a URL with <code className="font-mono">/*</code> (e.g.{' '}
                <code className="font-mono">https://firecrawl.dev/*</code>) to extract across the whole site. Optional
                when a prompt is given and web search is enabled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UrlListInput
                value={form.urlsText}
                onChange={text => patch({ urlsText: text })}
                max={EXTRACT_MAX_URLS}
                rows={4}
                disabled={busy}
                placeholder={'https://firecrawl.dev\nhttps://docs.firecrawl.dev/*'}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What to extract</CardTitle>
              <CardDescription>Describe the data in plain language, define its shape with a schema, or both.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="extract-prompt">Prompt</Label>
                <Textarea
                  id="extract-prompt"
                  rows={4}
                  value={form.prompt}
                  disabled={busy}
                  maxLength={10000}
                  placeholder="Extract the company mission, whether it is open source, and its pricing tiers."
                  onChange={e => patch({ prompt: e.target.value })}
                />
                <p className="text-muted-foreground text-right text-xs tabular-nums">{form.prompt.length}/10000</p>
              </div>

              <div className="space-y-2">
                <Label>Schema</Label>
                <SchemaInput
                  value={form.schema}
                  onChange={schema => patch({ schema })}
                  example={EXTRACT_EXAMPLE_SCHEMA}
                  disabled={busy}
                />
              </div>

              <Collapsible defaultOpen={!!form.systemPrompt}>
                <CollapsibleTrigger className="group text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium">
                  <ChevronDownIcon className="size-4 transition-transform group-data-[state=closed]:-rotate-90" />
                  System prompt
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <Textarea
                    rows={3}
                    value={form.systemPrompt}
                    disabled={busy}
                    maxLength={10000}
                    placeholder="Optional instructions that steer the extraction model."
                    onChange={e => patch({ systemPrompt: e.target.value })}
                  />
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent>
              <ExtractOptionsSection value={form} onChange={patch} disabled={busy} />
            </CardContent>
          </Card>

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
          {mutation.isError && <ErrorAlert error={mutation.error} title="Could not start extract job" />}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy || (attempted && errors.length > 0)} className="min-w-36">
              {busy ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
              {busy ? 'Starting…' : 'Start extraction'}
            </Button>
            <span className="text-muted-foreground text-xs">Runs asynchronously — you&apos;ll be taken to the job page.</span>
          </div>

          <RequestPreview method="POST" path="/extract" body={body} />
        </form>

        <aside className="space-y-6">
          <RecentJobsCard kind="extract" title="Recent extractions" />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2 text-sm">
              <p>
                Use <strong className="text-foreground">List of records</strong> in the builder for repeated items
                (products, people, jobs) — results then render as a table.
              </p>
              <p>Field descriptions are passed to the model; short, specific hints improve accuracy.</p>
              <p>Extract is billed in tokens/credits; check the job page for usage once it finishes.</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
