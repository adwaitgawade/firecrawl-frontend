import * as React from 'react'

import { KeyValueEditor } from '@/components/shared/KeyValueEditor'
import { TagListInput } from '@/components/shared/TagListInput'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SitemapMode } from '@/lib/api/types'
import { Field, FieldSection, NumberInput, SwitchField } from '@/features/crawl/components/form-fields'

import { MAP_DEFAULT_LIMIT, MAP_MAX_LIMIT } from '../map-form'
import type { MapFormState } from '../types'

const SITEMAP_HINTS: Record<SitemapMode, string> = {
  include: 'Combine the sitemap with discovered links (default).',
  skip: 'Ignore the sitemap; discover links from pages only.',
  only: 'Return only URLs listed in the sitemap.',
}

export function MapOptionsFields({ value, onChange }: { value: MapFormState; onChange: (v: MapFormState) => void }) {
  const id = React.useId()
  const set = <K extends keyof MapFormState>(key: K, v: MapFormState[K]) => onChange({ ...value, [key]: v })

  return (
    <div className="space-y-6">
      <FieldSection title="Discovery">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Limit" htmlFor={`${id}-limit`} hint={`1 – ${MAP_MAX_LIMIT.toLocaleString()} links.`}>
            <NumberInput
              id={`${id}-limit`}
              min={1}
              max={MAP_MAX_LIMIT}
              step={1}
              placeholder={String(MAP_DEFAULT_LIMIT)}
              value={value.limit}
              onValueChange={v => set('limit', v)}
            />
          </Field>
          <Field label="Sitemap" hint={SITEMAP_HINTS[value.sitemap]}>
            <Select value={value.sitemap} onValueChange={v => set('sitemap', v as SitemapMode)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="include">Include (default)</SelectItem>
                <SelectItem value="skip">Skip</SelectItem>
                <SelectItem value="only">Only</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Timeout (ms)" htmlFor={`${id}-timeout`} hint="Abort the map after this long.">
            <NumberInput
              id={`${id}-timeout`}
              min={1}
              step={1000}
              placeholder="No timeout"
              value={value.timeout}
              onValueChange={v => set('timeout', v)}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SwitchField
            id={`${id}-subdomains`}
            label="Include subdomains"
            hint="Also return links on subdomains (default on)."
            checked={value.includeSubdomains}
            onCheckedChange={v => set('includeSubdomains', v)}
          />
          <SwitchField
            id={`${id}-query`}
            label="Ignore query parameters"
            hint="Collapse URLs that differ only by query string (default on)."
            checked={value.ignoreQueryParameters}
            onCheckedChange={v => set('ignoreQueryParameters', v)}
          />
          <SwitchField
            id={`${id}-path`}
            label="Filter by path"
            hint="Only return links under the start URL's path (default on)."
            checked={value.filterByPath}
            onCheckedChange={v => set('filterByPath', v)}
          />
          <SwitchField
            id={`${id}-external`}
            label="Allow external links"
            hint="Include links to other domains."
            checked={value.allowExternalLinks}
            onCheckedChange={v => set('allowExternalLinks', v)}
          />
        </div>
      </FieldSection>

      <FieldSection title="Cache & index">
        <div className="grid gap-3 sm:grid-cols-2">
          <SwitchField
            id={`${id}-index`}
            label="Use index"
            hint="Seed results from Firecrawl's URL index (default on)."
            checked={value.useIndex}
            onCheckedChange={v => set('useIndex', v)}
          />
          <SwitchField
            id={`${id}-cache`}
            label="Ignore cache"
            hint="Bypass cached sitemap results."
            checked={value.ignoreCache}
            onCheckedChange={v => set('ignoreCache', v)}
          />
        </div>
      </FieldSection>

      <FieldSection title="Request">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Country" htmlFor={`${id}-country`} hint="ISO 3166-1 alpha-2 code (default us-generic).">
            <Input
              id={`${id}-country`}
              className="uppercase"
              maxLength={12}
              placeholder="US"
              value={value.country}
              onChange={e => set('country', e.target.value)}
            />
          </Field>
          <Field label="Languages" htmlFor={`${id}-langs`} hint="Comma separated, e.g. en-US, de.">
            <TagListInput id={`${id}-langs`} placeholder="en-US" value={value.languages} onChange={v => set('languages', v)} />
          </Field>
        </div>
        <Field label="Headers" hint="Sent with requests made while mapping (e.g. cookies).">
          <KeyValueEditor
            value={value.headers}
            onChange={headers => set('headers', headers)}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
            addLabel="Add header"
          />
        </Field>
      </FieldSection>
    </div>
  )
}
