import { FormatSelector, SEARCH_FORMAT_TYPES } from '@/components/shared/FormatSelector'
import { ScrapeOptionsForm } from '@/components/shared/ScrapeOptionsForm'
import { SwitchRow } from '@/features/extract/components/SwitchRow'

import type { SearchFormState } from '../types'

interface SearchScrapeSectionProps {
  value: SearchFormState
  onChange: (patch: Partial<SearchFormState>) => void
  disabled?: boolean
}

/** "Scrape results" toggle revealing formats + scrape options (sent as `scrapeOptions`). */
export function SearchScrapeSection({ value: f, onChange, disabled }: SearchScrapeSectionProps) {
  return (
    <div className="space-y-3">
      <SwitchRow
        label="Scrape results"
        hint="Fetch each result's page content in the chosen formats (costs extra credits per result)"
        checked={f.scrape}
        onCheckedChange={scrape => onChange({ scrape })}
        disabled={disabled}
      />
      {f.scrape && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <span className="text-sm font-medium">Formats</span>
            <FormatSelector
              value={f.formats}
              onChange={formats => onChange({ formats })}
              allowed={SEARCH_FORMAT_TYPES}
            />
          </div>
          <ScrapeOptionsForm
            value={f.scrapeOptions}
            onChange={scrapeOptions => onChange({ scrapeOptions })}
            title="Scrape options"
          />
        </div>
      )}
    </div>
  )
}
