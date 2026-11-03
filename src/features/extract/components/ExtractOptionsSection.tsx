import { ScrapeOptionsForm } from '@/components/shared/ScrapeOptionsForm'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { ExtractFormState } from '../form'
import { SwitchRow } from './SwitchRow'

interface ExtractOptionsSectionProps {
  value: ExtractFormState
  onChange: (patch: Partial<ExtractFormState>) => void
  disabled?: boolean
}

export function ExtractOptionsSection({ value: f, onChange, disabled }: ExtractOptionsSectionProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <SwitchRow
          label="Enable web search"
          hint="Search the web for extra sources (also allows external links)"
          checked={f.enableWebSearch}
          onCheckedChange={v => onChange({ enableWebSearch: v })}
          disabled={disabled}
        />
        <SwitchRow
          label="Show sources"
          hint="Return the URLs each field came from"
          checked={f.showSources}
          onCheckedChange={v => onChange({ showSources: v })}
          disabled={disabled}
        />
        <SwitchRow
          label="Include subdomains"
          hint="Follow subdomains when expanding /* URLs"
          checked={f.includeSubdomains}
          onCheckedChange={v => onChange({ includeSubdomains: v })}
          disabled={disabled}
        />
        <SwitchRow
          label="Ignore sitemap"
          hint="Don't use sitemap.xml to discover pages"
          checked={f.ignoreSitemap}
          onCheckedChange={v => onChange({ ignoreSitemap: v })}
          disabled={disabled}
        />
        <SwitchRow
          label="Allow external links"
          hint="Follow links to other domains"
          checked={f.allowExternalLinks || f.enableWebSearch}
          onCheckedChange={v => onChange({ allowExternalLinks: v })}
          disabled={disabled || f.enableWebSearch}
        />
        <SwitchRow
          label="Ignore invalid URLs"
          hint="Skip blocked URLs instead of failing the request"
          checked={f.ignoreInvalidURLs}
          onCheckedChange={v => onChange({ ignoreInvalidURLs: v })}
          disabled={disabled}
        />
        <SwitchRow
          label="Stream steps"
          hint="Experimental: report pipeline steps while running"
          checked={f.streamSteps}
          onCheckedChange={v => onChange({ streamSteps: v })}
          disabled={disabled}
        />
        <SwitchRow
          label="LLM usage"
          hint="Experimental: report LLM usage in the status"
          checked={f.llmUsage}
          onCheckedChange={v => onChange({ llmUsage: v })}
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="extract-limit">Limit</Label>
          <Input
            id="extract-limit"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="No limit"
            value={f.limit}
            disabled={disabled}
            onChange={e => onChange({ limit: e.target.value })}
          />
          <p className="text-muted-foreground text-xs">Max pages / entities considered</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="extract-timeout">Timeout (seconds)</Label>
          <Input
            id="extract-timeout"
            type="number"
            min={1}
            step="any"
            placeholder="Default"
            value={f.timeoutSec}
            disabled={disabled}
            onChange={e => onChange({ timeoutSec: e.target.value })}
          />
          <p className="text-muted-foreground text-xs">Minimum 1s</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="extract-webhook">Webhook URL</Label>
          <Input
            id="extract-webhook"
            type="url"
            placeholder="https://…"
            value={f.webhookUrl}
            disabled={disabled}
            onChange={e => onChange({ webhookUrl: e.target.value })}
            className="font-mono text-xs"
          />
          <p className="text-muted-foreground text-xs">Notified on job events</p>
        </div>
      </div>

      <div className="space-y-3">
        <SwitchRow
          label="Custom scrape options"
          hint="Override how each page is fetched (proxy, wait, headers, actions…)"
          checked={f.useScrapeOptions}
          onCheckedChange={v => onChange({ useScrapeOptions: v })}
          disabled={disabled}
        />
        {f.useScrapeOptions && (
          <ScrapeOptionsForm
            value={f.scrapeOptions}
            onChange={scrapeOptions => onChange({ scrapeOptions })}
            title="Scrape options"
            defaultOpen
          />
        )}
      </div>
    </div>
  )
}
