import { ChevronDownIcon, ImageIcon, NewspaperIcon, GlobeIcon, SlidersHorizontalIcon } from 'lucide-react'

import { TagListInput } from '@/components/shared/TagListInput'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { SearchCategoryType, SearchSourceType } from '@/lib/api/types'
import { SwitchRow } from '@/features/extract/components/SwitchRow'

import {
  CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  SOURCE_OPTIONS,
  TIME_OPTIONS,
} from '../constants'
import type { HighlightsMode, SearchFormState } from '../types'

const SOURCE_ICONS = { web: GlobeIcon, news: NewspaperIcon, images: ImageIcon } as const
const LIMIT_OPTIONS = [5, 10, 20, 30, 50, 100]
const DEFAULT_SENTINEL = '__default'

interface SearchFiltersProps {
  value: SearchFormState
  onChange: (patch: Partial<SearchFormState>) => void
  disabled?: boolean
}

/** Count of "advanced" filters that differ from their defaults (shown on the toggle). */
function advancedCount(f: SearchFormState): number {
  return [
    f.categories.length > 0,
    !!f.location.trim(),
    f.includeDomains.length > 0,
    f.excludeDomains.length > 0,
    !!f.timeoutSec.trim(),
    f.ignoreInvalidURLs,
    f.highlights !== 'auto',
  ].filter(Boolean).length
}

export function SearchFilters({ value: f, onChange, disabled }: SearchFiltersProps) {
  const adv = advancedCount(f)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          value={f.sources}
          disabled={disabled}
          aria-label="Sources"
          onValueChange={v => v.length && onChange({ sources: v as SearchSourceType[] })}
        >
          {SOURCE_OPTIONS.map(s => {
            const Icon = SOURCE_ICONS[s.value]
            return (
              <ToggleGroupItem key={s.value} value={s.value} title={s.description} className="px-3 text-xs">
                <Icon /> {s.label}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>

        <Select value={f.time} onValueChange={time => onChange({ time })} disabled={disabled}>
          <SelectTrigger size="sm" className="text-xs" aria-label="Time range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_OPTIONS.map(t => (
              <SelectItem key={t.value} value={t.value} className="text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(f.limit)} onValueChange={v => onChange({ limit: Number(v) })} disabled={disabled}>
          <SelectTrigger size="sm" className="text-xs" aria-label="Result limit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map(n => (
              <SelectItem key={n} value={String(n)} className="text-xs">
                {n} results
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={f.country || DEFAULT_SENTINEL}
          onValueChange={v => onChange({ country: v === DEFAULT_SENTINEL ? '' : v })}
          disabled={disabled}
        >
          <SelectTrigger size="sm" className="text-xs" aria-label="Country">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_SENTINEL} className="text-xs">
              Country: default
            </SelectItem>
            {COUNTRY_OPTIONS.map(c => (
              <SelectItem key={c.value} value={c.value} className="text-xs">
                {c.label} <span className="text-muted-foreground font-mono uppercase">{c.value}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={f.lang} onValueChange={lang => onChange({ lang })} disabled={disabled}>
          <SelectTrigger size="sm" className="text-xs" aria-label="Language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map(l => (
              <SelectItem key={l.value} value={l.value} className="text-xs">
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {f.time === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="search-from" className="text-xs">
              From
            </Label>
            <Input
              id="search-from"
              type="date"
              value={f.customFrom}
              disabled={disabled}
              onChange={e => onChange({ customFrom: e.target.value })}
              className="h-8 w-40 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="search-to" className="text-xs">
              To
            </Label>
            <Input
              id="search-to"
              type="date"
              value={f.customTo}
              disabled={disabled}
              onChange={e => onChange({ customTo: e.target.value })}
              className="h-8 w-40 text-xs"
            />
          </div>
          <p className="text-muted-foreground pb-2 text-xs">Sent as a <code className="font-mono">cdr:1</code> tbs range.</p>
        </div>
      )}

      <Collapsible defaultOpen={adv > 0}>
        <CollapsibleTrigger className="group text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium">
          <SlidersHorizontalIcon className="size-3.5" />
          More filters
          {adv > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {adv}
            </Badge>
          )}
          <ChevronDownIcon className="size-3.5 transition-transform group-data-[state=closed]:-rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4 rounded-lg border p-4">
          <div className="space-y-1.5">
            <span className="text-sm font-medium">Categories</span>
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={f.categories}
              disabled={disabled}
              className="flex-wrap"
              onValueChange={v => onChange({ categories: v as SearchCategoryType[] })}
            >
              {CATEGORY_OPTIONS.map(c => (
                <ToggleGroupItem key={c.value} value={c.value} title={c.description} className="px-3 text-xs">
                  {c.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-muted-foreground text-xs">Bias web results toward these kinds of sources.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="search-location">Location</Label>
              <Input
                id="search-location"
                value={f.location}
                disabled={disabled}
                placeholder="San Francisco,California,United States"
                onChange={e => onChange({ location: e.target.value })}
              />
              <p className="text-muted-foreground text-xs">Geo-targets results; disables the default US country.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search-timeout">Timeout (seconds)</Label>
              <Input
                id="search-timeout"
                type="number"
                min={1}
                step="any"
                value={f.timeoutSec}
                disabled={disabled}
                placeholder="60"
                onChange={e => onChange({ timeoutSec: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search-include">Include domains</Label>
              <TagListInput
                id="search-include"
                value={f.includeDomains}
                disabled={disabled || f.excludeDomains.length > 0}
                placeholder="docs.firecrawl.dev, github.com"
                onChange={v => onChange({ includeDomains: v ?? [] })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="search-exclude">Exclude domains</Label>
              <TagListInput
                id="search-exclude"
                value={f.excludeDomains}
                disabled={disabled || f.includeDomains.length > 0}
                placeholder="pinterest.com"
                onChange={v => onChange({ excludeDomains: v ?? [] })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Highlights</Label>
              <Select value={f.highlights} onValueChange={v => onChange({ highlights: v as HighlightsMode })} disabled={disabled}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (server decides)</SelectItem>
                  <SelectItem value="on">On — replace snippets with highlights</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SwitchRow
              label="Ignore invalid URLs"
              hint="Drop results the scraper can't fetch instead of failing"
              checked={f.ignoreInvalidURLs}
              onCheckedChange={v => onChange({ ignoreInvalidURLs: v })}
              disabled={disabled}
              className="self-end"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
