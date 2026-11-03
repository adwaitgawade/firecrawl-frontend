import * as React from 'react'
import { ChevronDownIcon } from 'lucide-react'

import { TagListInput } from '@/components/shared/TagListInput'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SitemapMode } from '@/lib/api/types'
import { cn } from '@/lib/utils'

import { CRAWLER_DEFAULTS } from '../crawl-form'
import type { CrawlerFormOptions } from '../types'
import { Field, FieldSection, NumberInput, SwitchField } from './form-fields'

const SITEMAP_OPTIONS: { value: SitemapMode; label: string; hint: string }[] = [
  { value: 'include', label: 'Include (default)', hint: 'Use the sitemap plus discovered links' },
  { value: 'skip', label: 'Skip', hint: 'Ignore the sitemap, follow links only' },
  { value: 'only', label: 'Only', hint: 'Only crawl URLs listed in the sitemap' },
]

export interface CrawlerOptionsFieldsProps {
  value: CrawlerFormOptions
  onChange: (value: CrawlerFormOptions) => void
  /** Keys recently applied from the AI params preview, highlighted in the UI. */
  highlighted?: ReadonlySet<keyof CrawlerFormOptions>
}

export function CrawlerOptionsFields({ value, onChange, highlighted }: CrawlerOptionsFieldsProps) {
  const id = React.useId()
  const [moreOpen, setMoreOpen] = React.useState(false)
  const set = <K extends keyof CrawlerFormOptions>(key: K, v: CrawlerFormOptions[K]) => onChange({ ...value, [key]: v })
  const hl = (key: keyof CrawlerFormOptions) =>
    highlighted?.has(key) ? 'ring-primary/40 rounded-md ring-2 ring-offset-2 ring-offset-background' : undefined

  const advancedCount = [
    value.regexOnFullURL,
    value.ignoreRobotsTxt,
    value.robotsUserAgent?.trim(),
    value.delay,
    value.maxConcurrency,
    value.deduplicateSimilarURLs === false,
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      <FieldSection title="Scope">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Limit"
            htmlFor={`${id}-limit`}
            hint={`Max pages to crawl (server default ${CRAWLER_DEFAULTS.limit.toLocaleString()}).`}
            className={hl('limit')}
          >
            <NumberInput
              id={`${id}-limit`}
              min={1}
              step={1}
              placeholder={String(CRAWLER_DEFAULTS.limit)}
              value={value.limit}
              onValueChange={v => set('limit', v)}
            />
          </Field>
          <Field
            label="Max discovery depth"
            htmlFor={`${id}-depth`}
            hint="Link hops from the start URL (unlimited by default)."
            className={hl('maxDiscoveryDepth')}
          >
            <NumberInput
              id={`${id}-depth`}
              min={0}
              step={1}
              placeholder="Unlimited"
              value={value.maxDiscoveryDepth}
              onValueChange={v => set('maxDiscoveryDepth', v)}
            />
          </Field>
          <Field label="Sitemap" hint={SITEMAP_OPTIONS.find(o => o.value === (value.sitemap ?? 'include'))?.hint} className={hl('sitemap')}>
            <Select value={value.sitemap ?? 'include'} onValueChange={v => set('sitemap', v as SitemapMode)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITEMAP_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Include paths"
            htmlFor={`${id}-include`}
            hint="Regex patterns, comma separated — only matching paths are crawled (e.g. blog/.*)."
            className={hl('includePaths')}
          >
            <TagListInput
              id={`${id}-include`}
              className="font-mono"
              placeholder="blog/.*, docs/.*"
              value={value.includePaths}
              onChange={v => set('includePaths', v)}
            />
          </Field>
          <Field
            label="Exclude paths"
            htmlFor={`${id}-exclude`}
            hint="Regex patterns, comma separated — matching paths are skipped."
            className={hl('excludePaths')}
          >
            <TagListInput
              id={`${id}-exclude`}
              className="font-mono"
              placeholder="admin/.*, login"
              value={value.excludePaths}
              onChange={v => set('excludePaths', v)}
            />
          </Field>
        </div>
      </FieldSection>

      <FieldSection title="Link following">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={hl('crawlEntireDomain')}>
            <SwitchField
              id={`${id}-entire`}
              label="Crawl entire domain"
              hint="Follow sibling/parent links, not just children of the start path."
              checked={!!value.crawlEntireDomain}
              onCheckedChange={v => set('crawlEntireDomain', v || undefined)}
            />
          </div>
          <div className={hl('allowSubdomains')}>
            <SwitchField
              id={`${id}-subdomains`}
              label="Allow subdomains"
              hint="Follow links to subdomains of the main domain."
              checked={!!value.allowSubdomains}
              onCheckedChange={v => set('allowSubdomains', v || undefined)}
            />
          </div>
          <div className={hl('allowExternalLinks')}>
            <SwitchField
              id={`${id}-external`}
              label="Allow external links"
              hint="Follow links to other websites."
              checked={!!value.allowExternalLinks}
              onCheckedChange={v => set('allowExternalLinks', v || undefined)}
            />
          </div>
          <div className={hl('ignoreQueryParameters')}>
            <SwitchField
              id={`${id}-query`}
              label="Ignore query parameters"
              hint="Treat URLs that differ only by query string as the same page."
              checked={!!value.ignoreQueryParameters}
              onCheckedChange={v => set('ignoreQueryParameters', v || undefined)}
            />
          </div>
        </div>
      </FieldSection>

      <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
        <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium">
          <ChevronDownIcon className={cn('size-4 transition-transform', moreOpen && 'rotate-180')} />
          More crawler options
          {advancedCount > 0 && <Badge variant="secondary">{advancedCount} set</Badge>}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-6">
          <FieldSection title="Matching & robots">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={hl('deduplicateSimilarURLs')}>
                <SwitchField
                  id={`${id}-dedupe`}
                  label="Deduplicate similar URLs"
                  hint="Skip near-duplicates like www/non-www or trailing slashes (default on)."
                  checked={value.deduplicateSimilarURLs !== false}
                  onCheckedChange={v => set('deduplicateSimilarURLs', v ? undefined : false)}
                />
              </div>
              <SwitchField
                id={`${id}-regexfull`}
                label="Regex on full URL"
                hint="Match include/exclude patterns against the full URL instead of the path."
                checked={!!value.regexOnFullURL}
                onCheckedChange={v => set('regexOnFullURL', v || undefined)}
              />
              <SwitchField
                id={`${id}-robots`}
                label="Ignore robots.txt"
                hint="May require a plan/flag that allows it."
                checked={!!value.ignoreRobotsTxt}
                onCheckedChange={v => set('ignoreRobotsTxt', v || undefined)}
              />
              <Field label="Robots user agent" htmlFor={`${id}-ua`} hint="User agent used when evaluating robots.txt.">
                <Input
                  id={`${id}-ua`}
                  placeholder="FirecrawlAgent"
                  value={value.robotsUserAgent ?? ''}
                  onChange={e => set('robotsUserAgent', e.target.value || undefined)}
                />
              </Field>
            </div>
          </FieldSection>
          <FieldSection title="Throughput">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Delay (seconds)" htmlFor={`${id}-delay`} hint="Wait between scrapes, up to 60s." className={hl('delay')}>
                <NumberInput
                  id={`${id}-delay`}
                  min={0}
                  max={60}
                  step={0.5}
                  placeholder="0"
                  value={value.delay}
                  onValueChange={v => set('delay', v)}
                />
              </Field>
              <Field
                label="Max concurrency"
                htmlFor={`${id}-concurrency`}
                hint="Cap parallel scrapes for this crawl (defaults to your team limit)."
              >
                <NumberInput
                  id={`${id}-concurrency`}
                  min={1}
                  step={1}
                  placeholder="Team limit"
                  value={value.maxConcurrency}
                  onValueChange={v => set('maxConcurrency', v)}
                />
              </Field>
            </div>
          </FieldSection>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
