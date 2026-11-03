import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { LayersIcon, Loader2Icon, RocketIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { FormatSelector } from '@/components/shared/FormatSelector'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { ScrapeOptionsForm } from '@/components/shared/ScrapeOptionsForm'
import { validateFormats } from '@/components/shared/scrape-options'
import { parseUrlList } from '@/components/shared/UrlListInput'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { addJob } from '@/lib/job-history'
import { isValidUrl, shortUrl } from '@/lib/utils'

import { startBatch } from './api'
import { BatchOptionsCard } from './components/BatchOptionsCard'
import { RecentBatchJobs } from './components/RecentBatchJobs'
import { UrlSourceInput } from './components/UrlSourceInput'
import { buildBatchBody, initialBatchForm, isUuid } from './request'
import type { BatchJobLocationState } from './types'

export function BatchPage() {
  const navigate = useNavigate()
  const [form, setForm] = React.useState(initialBatchForm)

  const parsed = React.useMemo(() => parseUrlList(form.urlsText), [form.urlsText])
  const body = React.useMemo(() => buildBatchBody(form), [form])
  const formatErrors = React.useMemo(() => validateFormats(form.formats), [form.formats])

  const problems: string[] = []
  if (parsed.urls.length === 0) problems.push('Add at least one valid URL.')
  if (formatErrors.length) problems.push(...formatErrors)
  if (form.appendToId.trim() && !isUuid(form.appendToId)) problems.push('"Append to job" must be a UUID.')
  if (form.maxConcurrency !== undefined && !(form.maxConcurrency >= 1)) problems.push('Max concurrency must be ≥ 1.')
  if (form.webhook.enabled && !isValidUrl(form.webhook.url)) problems.push('Enter a valid webhook URL.')

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => startBatch(payload),
    onSuccess: (res, payload) => {
      const urls = (payload.urls as string[]) ?? []
      const label = `${urls.length} URL${urls.length === 1 ? '' : 's'} · ${shortUrl(urls[0] ?? '')}`
      addJob({ kind: 'batch', id: res.id, label, status: 'scraping' })
      const skipped = res.invalidURLs?.length ?? 0
      toast.success('Batch scrape started', {
        description: skipped ? `${skipped} invalid URL${skipped === 1 ? ' was' : 's were'} skipped.` : undefined,
      })
      const state: BatchJobLocationState = { invalidURLs: res.invalidURLs }
      navigate(`/batch/${res.id}`, { state })
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (problems.length || mutation.isPending) return
    mutation.mutate(body)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayersIcon}
        title="Batch scrape"
        description="Scrape many URLs in one asynchronous job with shared formats and options."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={submit} className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">URLs</CardTitle>
              <CardDescription>One per line (commas and spaces also work). Duplicates are removed.</CardDescription>
            </CardHeader>
            <CardContent>
              <UrlSourceInput value={form.urlsText} onChange={urlsText => setForm(f => ({ ...f, urlsText }))} />
              {parsed.invalid.length > 0 && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Invalid entries are left out of the request.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formats</CardTitle>
              <CardDescription>What to return for every page.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormatSelector value={form.formats} onChange={formats => setForm(f => ({ ...f, formats }))} />
            </CardContent>
          </Card>

          <ScrapeOptionsForm
            value={form.options}
            onChange={options => setForm(f => ({ ...f, options }))}
            title="Scrape options"
          />

          <BatchOptionsCard value={form} onChange={setForm} />

          {mutation.isError && <ErrorAlert error={mutation.error} title="Could not start batch" />}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" size="lg" disabled={problems.length > 0 || mutation.isPending}>
              {mutation.isPending ? <Loader2Icon className="animate-spin" /> : <RocketIcon />}
              Start batch ({parsed.urls.length} URL{parsed.urls.length === 1 ? '' : 's'})
            </Button>
            {problems.length > 0 && parsed.urls.length > 0 && (
              <p className="text-destructive text-xs">{problems[0]}</p>
            )}
          </div>

          <RequestPreview method="POST" path="/batch/scrape" body={body} />
        </form>

        <div className="lg:sticky lg:top-6">
          <RecentBatchJobs />
        </div>
      </div>
    </div>
  )
}
