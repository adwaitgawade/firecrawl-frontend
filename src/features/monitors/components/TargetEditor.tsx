import { GlobeIcon, NetworkIcon, SearchIcon, Trash2Icon } from 'lucide-react'

import { FormatSelector, ScrapeOptionsForm, TagListInput, UrlListInput } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { FormatType } from '@/lib/api/types'

import type { TargetDraft } from '../form-state'
import type { MonitorTargetType, SearchWindow } from '../types'

/** Formats that are meaningful for monitoring (markdown is always diffed; json enables field diffs). */
const MONITOR_FORMAT_TYPES: FormatType[] = ['markdown', 'html', 'links', 'summary', 'json', 'changeTracking']

const SEARCH_WINDOWS: { value: SearchWindow; label: string }[] = [
  { value: '5m', label: 'Last 5 minutes' },
  { value: '15m', label: 'Last 15 minutes' },
  { value: '1h', label: 'Last hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
]

const TYPE_META: Record<MonitorTargetType, { label: string; icon: typeof GlobeIcon; description: string }> = {
  scrape: { label: 'Pages', icon: GlobeIcon, description: 'Re-scrape a fixed list of URLs and diff each page.' },
  crawl: { label: 'Crawl', icon: NetworkIcon, description: 'Crawl a site each run; detects new, changed and removed pages.' },
  search: { label: 'Search', icon: SearchIcon, description: 'Run web searches and alert on new results matching your goal.' },
}

interface TargetEditorProps {
  index: number
  draft: TargetDraft
  onChange: (patch: Partial<TargetDraft>) => void
  onRemove?: () => void
}

function ScrapeFields({ draft, onChange }: Pick<TargetEditorProps, 'draft' | 'onChange'>) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Formats</Label>
        <FormatSelector value={draft.formats} onChange={formats => onChange({ formats })} allowed={MONITOR_FORMAT_TYPES} />
        <p className="text-muted-foreground text-xs">
          Markdown is always diffed. Add JSON (or change tracking with the <code>json</code> mode) to diff extracted fields;
          add <code>git-diff</code> mode to get both.
        </p>
      </div>
      <ScrapeOptionsForm
        value={draft.scrapeOptions}
        onChange={scrapeOptions => onChange({ scrapeOptions })}
        hide={['actions', 'storeInCache', 'maxAge', 'minAge']}
        title="Scrape options"
      />
    </div>
  )
}

export function TargetEditor({ index, draft, onChange, onRemove }: TargetEditorProps) {
  const meta = TYPE_META[draft.type]
  const Icon = meta.icon
  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row flex-wrap items-center gap-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="text-muted-foreground size-4" /> Target {index + 1}
        </CardTitle>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={draft.type}
          disabled={!!draft.id}
          onValueChange={v => v && onChange({ type: v as MonitorTargetType })}
        >
          {(Object.keys(TYPE_META) as MonitorTargetType[]).map(t => (
            <ToggleGroupItem key={t} value={t} className="px-3 text-xs">
              {TYPE_META[t].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive ml-auto"
            aria-label={`Remove target ${index + 1}`}
            onClick={onRemove}
          >
            <Trash2Icon />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground -mt-2 text-xs">{meta.description}</p>

        {draft.type === 'scrape' && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">URLs</Label>
              <UrlListInput value={draft.urlsText} onChange={text => onChange({ urlsText: text })} rows={4} />
            </div>
            <ScrapeFields draft={draft} onChange={onChange} />
          </>
        )}

        {draft.type === 'crawl' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={`${draft.key}-url`} className="text-xs">
                Start URL
              </Label>
              <Input
                id={`${draft.key}-url`}
                value={draft.url}
                placeholder="https://docs.example.com"
                className="font-mono"
                onChange={e => onChange({ url: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${draft.key}-limit`} className="text-xs">
                  Page limit
                </Label>
                <Input
                  id={`${draft.key}-limit`}
                  type="number"
                  min={1}
                  value={draft.crawlLimit}
                  onChange={e => onChange({ crawlLimit: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${draft.key}-depth`} className="text-xs">
                  Max discovery depth
                </Label>
                <Input
                  id={`${draft.key}-depth`}
                  type="number"
                  min={0}
                  placeholder="unlimited"
                  value={draft.maxDiscoveryDepth}
                  onChange={e => onChange({ maxDiscoveryDepth: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Include paths (regex)</Label>
                <TagListInput
                  value={draft.includePaths}
                  onChange={includePaths => onChange({ includePaths })}
                  placeholder="^/blog/.*, ^/docs/.*"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exclude paths (regex)</Label>
                <TagListInput
                  value={draft.excludePaths}
                  onChange={excludePaths => onChange({ excludePaths })}
                  placeholder="^/admin/.*"
                />
              </div>
            </div>
            <ScrapeFields draft={draft} onChange={onChange} />
          </>
        )}

        {draft.type === 'search' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor={`${draft.key}-queries`} className="text-xs">
                Queries (one per line, max 12)
              </Label>
              <Textarea
                id={`${draft.key}-queries`}
                rows={3}
                value={draft.queriesText}
                placeholder={'firecrawl funding\n"web scraping api" launch'}
                onChange={e => onChange({ queriesText: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Search window</Label>
                <Select value={draft.searchWindow} onValueChange={v => onChange({ searchWindow: v as SearchWindow })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEARCH_WINDOWS.map(w => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${draft.key}-max`} className="text-xs">
                  Max results per query
                </Label>
                <Input
                  id={`${draft.key}-max`}
                  type="number"
                  min={1}
                  max={50}
                  value={draft.maxResults}
                  onChange={e => onChange({ maxResults: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Only these domains</Label>
                <TagListInput
                  value={draft.includeDomains}
                  onChange={includeDomains => onChange({ includeDomains })}
                  placeholder="techcrunch.com, news.ycombinator.com"
                  disabled={!!draft.excludeDomains?.length}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exclude domains</Label>
                <TagListInput
                  value={draft.excludeDomains}
                  onChange={excludeDomains => onChange({ excludeDomains })}
                  placeholder="pinterest.com"
                  disabled={!!draft.includeDomains?.length}
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">Search targets require a goal (below) unless the AI judge is disabled.</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
