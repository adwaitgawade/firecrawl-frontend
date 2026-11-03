import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { SearchIcon } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { runSearch } from './api'
import { SearchBar } from './components/SearchBar'
import { SearchFilters } from './components/SearchFilters'
import { SearchMeta } from './components/SearchMeta'
import { SearchResults } from './components/SearchResults'
import { SearchScrapeSection } from './components/SearchScrapeSection'
import { EXAMPLE_QUERIES } from './constants'
import { buildSearchBody, initialSearchForm } from './form'
import type { SearchFormState } from './types'

function ResultsSkeleton() {
  return (
    <div className="space-y-3" aria-busy>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-4">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const [form, setForm] = React.useState<SearchFormState>(() => initialSearchForm(urlQuery))
  const [attempted, setAttempted] = React.useState(false)
  const patch = (p: Partial<SearchFormState>) => setForm(f => ({ ...f, ...p }))

  // Follow external ?q= changes (e.g. a link to /search?q=… while already on this page).
  const [prevUrlQuery, setPrevUrlQuery] = React.useState(urlQuery)
  if (prevUrlQuery !== urlQuery) {
    setPrevUrlQuery(urlQuery)
    if (urlQuery !== form.query) setForm(f => ({ ...f, query: urlQuery }))
  }

  const { body, errors } = React.useMemo(() => buildSearchBody(form), [form])
  const mutation = useMutation({ mutationFn: runSearch })

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setAttempted(true)
    if (errors.length) return
    const q = form.query.trim()
    if (q !== urlQuery) {
      setPrevUrlQuery(q)
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.set('q', q)
        return next
      }, { replace: true })
    }
    mutation.mutate(body)
  }

  const showErrors = attempted && errors.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SearchIcon}
        title="Search"
        description="Search the web, news and images — optionally scraping every result in one request."
      />

      <form onSubmit={submit} className="space-y-4">
        <SearchBar value={form.query} onChange={query => patch({ query })} loading={mutation.isPending} />
        <SearchFilters value={form} onChange={patch} disabled={mutation.isPending} />
        <SearchScrapeSection value={form} onChange={patch} disabled={mutation.isPending} />
        {showErrors && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc pl-4">
                {errors.map(e => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        <RequestPreview method="POST" path="/search" body={body} />
      </form>

      <section className="space-y-4" aria-live="polite">
        {mutation.isPending ? (
          <ResultsSkeleton />
        ) : mutation.isError ? (
          <ErrorAlert error={mutation.error} title="Search failed" onRetry={() => submit()} />
        ) : mutation.data ? (
          <>
            <SearchMeta response={mutation.data} />
            <SearchResults response={mutation.data} />
          </>
        ) : (
          <Card>
            <CardContent>
              <EmptyState
                icon={SearchIcon}
                title="Search the web"
                description="Results show up here, grouped by source. Try one of these:"
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {EXAMPLE_QUERIES.map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => patch({ query: q })}
                        className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full border px-3 py-1 text-xs transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                }
              />
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
