import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { ChevronDownIcon, Loader2Icon, MapIcon, RotateCcwIcon, SearchIcon, SlidersHorizontalIcon, SquareIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { isFirecrawlApiError } from '@/lib/api/client'
import type { MapRequest } from '@/lib/api/types'
import { addJob } from '@/lib/job-history'
import { cn, isValidUrl } from '@/lib/utils'

import { runMap } from './api'
import { MapOptionsFields } from './components/MapOptionsFields'
import { MapResults } from './components/MapResults'
import { buildMapBody, initialMapForm, validateMapForm } from './map-form'
import type { MapFormState } from './types'

async function timedMap(body: MapRequest, signal: AbortSignal) {
  const started = performance.now()
  const result = await runMap(body, signal)
  return { result, durationMs: performance.now() - started, url: body.url }
}

export function MapPage() {
  const [searchParams] = useSearchParams()
  const urlParam = searchParams.get('url') ?? ''
  const [form, setForm] = React.useState<MapFormState>(() => initialMapForm(urlParam))
  const [optionsOpen, setOptionsOpen] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)

  const [prevUrlParam, setPrevUrlParam] = React.useState(urlParam)
  if (urlParam !== prevUrlParam) {
    setPrevUrlParam(urlParam)
    if (urlParam) setForm(f => ({ ...f, url: urlParam }))
  }

  React.useEffect(() => () => abortRef.current?.abort(), [])

  const body = React.useMemo(() => buildMapBody(form), [form])
  const problems = React.useMemo(() => validateMapForm(form), [form])
  const urlInvalid = form.url.trim() !== '' && !isValidUrl(form.url)
  const modifiedOptions = Object.keys(body).filter(k => k !== 'url' && k !== 'search').length

  const mutation = useMutation({
    mutationFn: (vars: MapRequest) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      return timedMap(vars, controller.signal)
    },
    onSuccess: ({ result, url }) => {
      if (result.id) addJob({ kind: 'map', id: result.id, label: url, status: 'completed' })
    },
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (problems.length) return
    mutation.mutate(body)
  }

  const cancel = () => {
    abortRef.current?.abort()
    mutation.reset()
  }

  const aborted = isFirecrawlApiError(mutation.error) && mutation.error.code === 'ABORTED'
  const patch = (p: Partial<MapFormState>) => setForm(f => ({ ...f, ...p }))

  return (
    <div className="space-y-6">
      <PageHeader
        icon={MapIcon}
        title="Map"
        description="Discover every URL on a website in seconds — from sitemaps, the index and on-page links."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              cancel()
              setForm(initialMapForm())
              setSubmitted(false)
            }}
          >
            <RotateCcwIcon /> Reset
          </Button>
        }
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_16rem_auto] md:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="map-url" className="text-xs">
                  Website URL
                </Label>
                <Input
                  id="map-url"
                  autoFocus={!urlParam}
                  className="font-mono"
                  placeholder="https://firecrawl.dev"
                  value={form.url}
                  aria-invalid={urlInvalid || undefined}
                  onChange={e => patch({ url: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="map-search" className="text-xs">
                  Search <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                  <Input
                    id="map-search"
                    className="pl-8"
                    placeholder="e.g. blog, pricing"
                    value={form.search}
                    onChange={e => patch({ search: e.target.value })}
                  />
                </div>
              </div>
              {mutation.isPending ? (
                <Button type="button" variant="outline" onClick={cancel} className="md:w-32">
                  <SquareIcon /> Cancel
                </Button>
              ) : (
                <Button type="submit" className="md:w-32">
                  <MapIcon /> Map
                </Button>
              )}
            </div>
            {urlInvalid && <p className="text-destructive text-xs">Enter a valid http(s) URL.</p>}
            <p className="text-muted-foreground text-xs">
              <strong className="font-medium">Search</strong> ranks links by relevance to the query (and filters them) on the server.
            </p>

            <Collapsible open={optionsOpen} onOpenChange={setOptionsOpen}>
              <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontalIcon className="size-4" />
                Options
                {modifiedOptions > 0 && <Badge variant="secondary">{modifiedOptions} set</Badge>}
                <ChevronDownIcon className={cn('size-4 transition-transform', optionsOpen && 'rotate-180')} />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <MapOptionsFields value={form} onChange={setForm} />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {submitted && problems.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Fix these before mapping</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4">
                {problems.map(p => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <RequestPreview method="POST" path="/map" body={body} />
      </form>

      {mutation.isPending && (
        <Card>
          <CardContent className="space-y-3">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2Icon className="size-4 animate-spin" /> Mapping {form.url.trim() || 'site'}…
            </div>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {mutation.isError && !aborted && (
        <ErrorAlert error={mutation.error} title="Map failed" onRetry={() => mutation.mutate(body)} />
      )}

      {mutation.isSuccess && (
        <MapResults
          key={mutation.submittedAt}
          result={mutation.data.result}
          mappedUrl={mutation.data.url}
          durationMs={mutation.data.durationMs}
        />
      )}

      {mutation.isIdle && (
        <EmptyState
          icon={MapIcon}
          title="Map a website"
          description="Enter a URL to list its pages. From the results you can scrape single pages or crawl the whole site."
        />
      )}
    </div>
  )
}
