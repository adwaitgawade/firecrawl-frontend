import * as React from 'react'
import { useNavigate } from 'react-router'
import { ArrowRightIcon, FlameIcon, GlobeIcon, SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidUrl } from '@/lib/utils'

import { normalizeUrlInput } from '../lib'

function QuickScrapeForm() {
  const navigate = useNavigate()
  const [url, setUrl] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const valid = isValidUrl(url)
  const showError = touched && url.trim() !== '' && !valid

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    navigate(`/scrape?url=${encodeURIComponent(normalizeUrlInput(url))}`)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1.5" noValidate>
      <label htmlFor="home-quick-scrape" className="text-sm font-medium">
        Scrape a page
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <GlobeIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="home-quick-scrape"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="https://example.com"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            aria-invalid={showError || undefined}
            className="bg-background pl-9 font-mono"
          />
        </div>
        <Button type="submit" disabled={!url.trim()}>
          <FlameIcon /> <span className="hidden sm:inline">Scrape</span>
        </Button>
      </div>
      {showError && <p className="text-destructive text-xs">Enter a valid URL, e.g. example.com</p>}
    </form>
  )
}

function QuickSearchForm() {
  const navigate = useNavigate()
  const [q, setQ] = React.useState('')

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = q.trim()
    if (!query) return
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-1.5">
      <label htmlFor="home-quick-search" className="text-sm font-medium">
        Search the web
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="home-quick-search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="latest web scraping news"
            className="bg-background pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" disabled={!q.trim()}>
          <ArrowRightIcon /> <span className="hidden sm:inline">Search</span>
        </Button>
      </div>
    </form>
  )
}

/** Welcome banner with quick-scrape and quick-search entry points. */
export function HomeHero() {
  return (
    <section className="from-primary/10 via-card to-card relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-sm sm:p-8">
      <div
        aria-hidden
        className="bg-primary/20 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl"
      />
      <div className="relative space-y-6">
        <div className="max-w-2xl space-y-2">
          <div className="text-primary inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
            <FlameIcon className="size-3.5" /> Firecrawl playground
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Turn any website into LLM-ready data</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Scrape, crawl, map, search and extract — try every Firecrawl API from one place and copy the exact request
            when you&apos;re ready to ship.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <QuickScrapeForm />
          <QuickSearchForm />
        </div>
      </div>
    </section>
  )
}
