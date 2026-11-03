import { FlameIcon, GlobeIcon, SquareIcon } from 'lucide-react'

import { ActionsEditor } from '@/components/shared/ActionsEditor'
import { FormatSelector } from '@/components/shared/FormatSelector'
import { ScrapeOptionsForm } from '@/components/shared/ScrapeOptionsForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { ScrapeFormState } from '../request'
import { JsonBodyEditor } from './JsonBodyEditor'

export type ScrapeTab = 'formats' | 'options' | 'actions' | 'json'

interface ScrapeRequestCardProps {
  form: ScrapeFormState
  onFormChange: (form: ScrapeFormState) => void
  tab: ScrapeTab
  onTabChange: (tab: ScrapeTab) => void
  jsonText: string
  onJsonTextChange: (text: string) => void
  jsonError?: string
  onJsonReset: () => void
  /** URL shown in the URL bar (the JSON body's url while on the JSON tab). */
  displayUrl: string
  urlError?: string
  canRun: boolean
  isRunning: boolean
  onRun: () => void
  onCancel: () => void
}

export function ScrapeRequestCard({
  form,
  onFormChange,
  tab,
  onTabChange,
  jsonText,
  onJsonTextChange,
  jsonError,
  onJsonReset,
  displayUrl,
  urlError,
  canRun,
  isRunning,
  onRun,
  onCancel,
}: ScrapeRequestCardProps) {
  const jsonMode = tab === 'json'
  const actionCount = form.actions?.length ?? 0

  return (
    <Card>
      <CardContent className="space-y-4">
        <form
          onSubmit={e => {
            e.preventDefault()
            if (canRun && !isRunning) onRun()
          }}
          className="space-y-1.5"
        >
          <Label htmlFor="scrape-url" className="sr-only">
            URL
          </Label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <GlobeIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="scrape-url"
                value={displayUrl}
                onChange={e => onFormChange({ ...form, url: e.target.value })}
                placeholder="https://example.com"
                className="h-10 pl-9 font-mono text-sm"
                disabled={jsonMode}
                aria-invalid={!!urlError || undefined}
                autoComplete="url"
                spellCheck={false}
                autoFocus
              />
            </div>
            {isRunning ? (
              <Button type="button" variant="outline" className="h-10" onClick={onCancel}>
                <SquareIcon className="fill-current" /> Stop
              </Button>
            ) : (
              <Button type="submit" className="h-10 px-5" disabled={!canRun}>
                <FlameIcon /> Scrape
              </Button>
            )}
          </div>
          {jsonMode && <p className="text-muted-foreground text-xs">The URL is taken from the JSON body.</p>}
          {!jsonMode && urlError && <p className="text-destructive text-xs">{urlError}</p>}
        </form>

        <Tabs value={tab} onValueChange={v => onTabChange(v as ScrapeTab)}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="formats">Formats</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="actions">
              Actions
              {actionCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {actionCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="json">JSON body</TabsTrigger>
          </TabsList>

          <TabsContent value="formats" className="pt-2">
            <FormatSelector value={form.formats} onChange={formats => onFormChange({ ...form, formats })} />
          </TabsContent>

          <TabsContent value="options" className="space-y-4 pt-2">
            <ScrapeOptionsForm
              value={form.options}
              onChange={options => onFormChange({ ...form, options })}
              hide={['actions']}
              inline
            />
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="scrape-zdr">Zero data retention</Label>
                <p className="text-muted-foreground text-xs">
                  Don&apos;t persist the scrape (must be enabled for your team). Disables job lookup and interact.
                </p>
              </div>
              <Switch
                id="scrape-zdr"
                checked={form.zeroDataRetention}
                onCheckedChange={v => onFormChange({ ...form, zeroDataRetention: v })}
              />
            </div>
          </TabsContent>

          <TabsContent value="actions" className="pt-2">
            <p className="text-muted-foreground mb-3 text-xs">
              Browser actions run in order before the page is captured (max 50; total wait ≤ 60s).
            </p>
            <ActionsEditor value={form.actions} onChange={actions => onFormChange({ ...form, actions })} />
          </TabsContent>

          <TabsContent value="json" className="pt-2">
            <JsonBodyEditor value={jsonText} onChange={onJsonTextChange} error={jsonError} onReset={onJsonReset} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
