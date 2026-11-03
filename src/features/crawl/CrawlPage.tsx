import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronDownIcon, Loader2Icon, NetworkIcon, PlayIcon, RotateCcwIcon, WebhookIcon } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { FormatSelector } from '@/components/shared/FormatSelector'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { ScrapeOptionsForm } from '@/components/shared/ScrapeOptionsForm'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addJob } from '@/lib/job-history'
import { cn, isValidUrl } from '@/lib/utils'

import { startCrawl } from './api'
import { CrawlerOptionsFields } from './components/CrawlerOptionsFields'
import { CrawlJobsTabs } from './components/CrawlJobsTabs'
import { SwitchField } from './components/form-fields'
import { PromptPanel } from './components/PromptPanel'
import { WebhookFields } from './components/WebhookFields'
import { buildCrawlBody, initialCrawlForm, validateCrawlForm } from './crawl-form'
import type { CrawlerFormOptions, CrawlFormState } from './types'

export function CrawlPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlParam = searchParams.get('url') ?? ''
  const [form, setForm] = React.useState<CrawlFormState>(() => initialCrawlForm(urlParam))
  const [highlighted, setHighlighted] = React.useState<ReadonlySet<keyof CrawlerFormOptions>>(new Set())
  const [submitted, setSubmitted] = React.useState(false)
  const [webhookOpen, setWebhookOpen] = React.useState(false)

  // Support `/crawl?url=…` deep links even when already on this page.
  const [prevUrlParam, setPrevUrlParam] = React.useState(urlParam)
  if (urlParam !== prevUrlParam) {
    setPrevUrlParam(urlParam)
    if (urlParam) setForm(f => ({ ...f, url: urlParam }))
  }

  const patch = (p: Partial<CrawlFormState>) => setForm(f => ({ ...f, ...p }))
  const body = React.useMemo(() => buildCrawlBody(form), [form])
  const problems = React.useMemo(() => validateCrawlForm(form), [form])
  const urlInvalid = form.url.trim() !== '' && !isValidUrl(form.url)

  const mutation = useMutation({
    mutationFn: startCrawl,
    onSuccess: (res, vars) => {
      addJob({ kind: 'crawl', id: res.id, label: vars.url, status: 'scraping' })
      toast.success('Crawl started')
      navigate(`/crawl/${res.id}`)
    },
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (problems.length) return
    mutation.mutate(body)
  }

  const applyPreview = (options: CrawlerFormOptions, keepPrompt: boolean) => {
    setForm(f => ({ ...f, crawler: { ...f.crawler, ...options }, prompt: keepPrompt ? f.prompt : '' }))
    setHighlighted(new Set(Object.keys(options) as (keyof CrawlerFormOptions)[]))
    toast.success(`Applied ${Object.keys(options).length} crawler options${keepPrompt ? '' : ' — prompt cleared'}`)
  }

  const webhookSet = form.webhook.url.trim() !== ''

  return (
    <div className="space-y-6">
      <PageHeader
        icon={NetworkIcon}
        title="Crawl"
        description="Recursively discover and scrape every page of a website, with live progress."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setForm(initialCrawlForm())
              setHighlighted(new Set())
              setSubmitted(false)
              mutation.reset()
            }}
          >
            <RotateCcwIcon /> Reset
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="crawl-url" className="text-xs">
                Start URL
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="crawl-url"
                  autoFocus={!urlParam}
                  className="font-mono"
                  placeholder="https://docs.firecrawl.dev"
                  value={form.url}
                  aria-invalid={urlInvalid || undefined}
                  onChange={e => patch({ url: e.target.value })}
                />
                <Button type="submit" disabled={mutation.isPending} className="sm:w-36">
                  {mutation.isPending ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
                  Start crawl
                </Button>
              </div>
              {urlInvalid && <p className="text-destructive text-xs">Enter a valid http(s) URL.</p>}
            </div>
            <PromptPanel
              url={form.url}
              prompt={form.prompt}
              onPromptChange={prompt => patch({ prompt })}
              crawler={form.crawler}
              onApply={applyPreview}
            />
          </CardContent>
        </Card>

        {submitted && problems.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Fix these before starting the crawl</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {problems.map(p => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        {mutation.isError && <ErrorAlert error={mutation.error} title="Could not start the crawl" />}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Crawler options</CardTitle>
              <CardDescription>Control which pages are discovered. Unset fields use server defaults.</CardDescription>
            </CardHeader>
            <CardContent>
              <CrawlerOptionsFields
                value={form.crawler}
                onChange={crawler => {
                  patch({ crawler })
                  if (highlighted.size) setHighlighted(new Set())
                }}
                highlighted={highlighted}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scrape options</CardTitle>
              <CardDescription>
                Applied to every crawled page (sent as <code className="text-xs">scrapeOptions</code>).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormatSelector value={form.formats} onChange={formats => patch({ formats })} />
              <ScrapeOptionsForm value={form.scrapeOptions} onChange={scrapeOptions => patch({ scrapeOptions })} />
              <SwitchField
                id="crawl-zdr"
                label="Zero data retention"
                hint="Don't store crawl results on Firecrawl servers (requires an enabled team)."
                checked={form.zeroDataRetention}
                onCheckedChange={zeroDataRetention => patch({ zeroDataRetention })}
              />
            </CardContent>
          </Card>
        </div>

        <Collapsible open={webhookOpen} onOpenChange={setWebhookOpen} className="rounded-xl border">
          <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium">
            <WebhookIcon className="text-muted-foreground size-4" />
            Webhook
            {webhookSet && <Badge variant="secondary">configured</Badge>}
            <ChevronDownIcon className={cn('text-muted-foreground ml-auto size-4 transition-transform', webhookOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="border-t p-4">
            <WebhookFields value={form.webhook} onChange={webhook => patch({ webhook })} />
          </CollapsibleContent>
        </Collapsible>

        <RequestPreview method="POST" path="/crawl" body={body} />
      </form>

      <CrawlJobsTabs />
    </div>
  )
}
