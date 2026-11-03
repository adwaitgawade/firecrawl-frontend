import * as React from 'react'
import { DownloadIcon, ExternalLinkIcon, TriangleAlertIcon } from 'lucide-react'

import { CodeBlock } from '@/components/shared/CodeBlock'
import { CopyButton } from '@/components/shared/CopyButton'
import { JsonViewer } from '@/components/shared/JsonViewer'
import { MarkdownView } from '@/components/shared/MarkdownView'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Document } from '@/lib/api/types'
import { cn, downloadFile, formatDate } from '@/lib/utils'

export interface DocumentViewerProps {
  document: Document
  /** Initial tab (defaults to the first present one). */
  defaultTab?: string
  className?: string
}

interface TabDef {
  value: string
  label: string
  count?: number
  /** Text used by copy/download; omit for no copy/download. */
  text?: () => string
  filename?: string
  mime?: string
  render: () => React.ReactNode
}

function slugFromUrl(url?: string): string {
  if (!url) return 'document'
  try {
    const u = new URL(url)
    return `${u.hostname}${u.pathname}`.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || 'document'
  } catch {
    return 'document'
  }
}

function MarkdownTab({ markdown }: { markdown: string }) {
  const [mode, setMode] = React.useState<'rendered' | 'raw'>('rendered')
  return (
    <div className="space-y-2">
      <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={v => v && setMode(v as 'rendered' | 'raw')}>
        <ToggleGroupItem value="rendered" className="px-3 text-xs">
          Rendered
        </ToggleGroupItem>
        <ToggleGroupItem value="raw" className="px-3 text-xs">
          Raw
        </ToggleGroupItem>
      </ToggleGroup>
      {mode === 'rendered' ? (
        <div className="max-h-[40rem] overflow-auto rounded-lg border p-4">
          <MarkdownView markdown={markdown} />
        </div>
      ) : (
        <CodeBlock code={markdown} language="md" wrap maxHeight="40rem" />
      )}
    </div>
  )
}

function HtmlTab({ html }: { html: string }) {
  const [mode, setMode] = React.useState<'code' | 'preview'>('code')
  return (
    <div className="space-y-2">
      <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={v => v && setMode(v as 'code' | 'preview')}>
        <ToggleGroupItem value="code" className="px-3 text-xs">
          Source
        </ToggleGroupItem>
        <ToggleGroupItem value="preview" className="px-3 text-xs">
          Preview
        </ToggleGroupItem>
      </ToggleGroup>
      {mode === 'code' ? (
        <CodeBlock code={html} language="html" maxHeight="40rem" />
      ) : (
        <iframe
          title="HTML preview"
          sandbox=""
          srcDoc={html}
          className="h-[40rem] w-full rounded-lg border bg-white"
        />
      )}
    </div>
  )
}

function UrlList({ urls, images }: { urls: string[]; images?: boolean }) {
  if (images) {
    return (
      <div className="grid max-h-[40rem] grid-cols-2 gap-2 overflow-auto sm:grid-cols-3 lg:grid-cols-4">
        {urls.map((u, i) => (
          <a key={`${u}-${i}`} href={u} target="_blank" rel="noreferrer" className="group bg-muted/30 overflow-hidden rounded-md border">
            <img src={u} alt="" loading="lazy" className="aspect-video w-full object-contain" />
            <div className="text-muted-foreground truncate px-2 py-1 text-[10px]">{u}</div>
          </a>
        ))}
      </div>
    )
  }
  return (
    <ul className="max-h-[40rem] divide-y overflow-auto rounded-lg border text-xs">
      {urls.map((u, i) => (
        <li key={`${u}-${i}`} className="hover:bg-muted/50 flex items-center gap-2 px-3 py-1.5">
          <a href={u} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono hover:underline">
            {u}
          </a>
          <ExternalLinkIcon className="text-muted-foreground size-3 shrink-0" />
        </li>
      ))}
    </ul>
  )
}

function Screenshot({ src }: { src: string }) {
  return (
    <div className="space-y-2">
      <a href={src} target="_blank" rel="noreferrer" className="block max-h-[40rem] overflow-auto rounded-lg border">
        <img src={src} alt="Page screenshot" className="w-full" />
      </a>
      {!src.startsWith('data:') && (
        <p className="text-muted-foreground text-xs">Screenshot URLs expire after 24 hours.</p>
      )}
    </div>
  )
}

/** Tabbed viewer for a scraped v2 Document. Only tabs for present fields are shown. */
export function DocumentViewer({ document: doc, defaultTab, className }: DocumentViewerProps) {
  const base = slugFromUrl(doc.metadata?.sourceURL ?? doc.metadata?.url ?? doc.url)
  const json = doc.json ?? doc.extract
  const tabs: TabDef[] = []

  if (doc.markdown !== undefined)
    tabs.push({
      value: 'markdown',
      label: 'Markdown',
      text: () => doc.markdown ?? '',
      filename: `${base}.md`,
      mime: 'text/markdown',
      render: () => <MarkdownTab markdown={doc.markdown ?? ''} />,
    })
  if (doc.summary)
    tabs.push({
      value: 'summary',
      label: 'Summary',
      text: () => doc.summary ?? '',
      filename: `${base}-summary.md`,
      render: () => (
        <div className="rounded-lg border p-4">
          <MarkdownView markdown={doc.summary ?? ''} />
        </div>
      ),
    })
  if (doc.answer || doc.highlights)
    tabs.push({
      value: 'answer',
      label: doc.answer ? 'Answer' : 'Highlights',
      text: () => [doc.answer, doc.highlights].filter(Boolean).join('\n\n'),
      render: () => (
        <div className="space-y-3">
          {doc.answer && (
            <div className="rounded-lg border p-4">
              <div className="text-muted-foreground mb-2 text-xs font-medium uppercase">Answer</div>
              <MarkdownView markdown={doc.answer} />
            </div>
          )}
          {doc.highlights && (
            <div className="rounded-lg border p-4">
              <div className="text-muted-foreground mb-2 text-xs font-medium uppercase">Highlights</div>
              <MarkdownView markdown={doc.highlights} />
            </div>
          )}
        </div>
      ),
    })
  if (json !== undefined && json !== null)
    tabs.push({
      value: 'json',
      label: 'JSON',
      text: () => JSON.stringify(json, null, 2),
      filename: `${base}.json`,
      mime: 'application/json',
      render: () => <JsonViewer data={json} toolbar={false} maxHeight="40rem" />,
    })
  if (doc.html !== undefined)
    tabs.push({
      value: 'html',
      label: 'HTML',
      text: () => doc.html ?? '',
      filename: `${base}.html`,
      mime: 'text/html',
      render: () => <HtmlTab html={doc.html ?? ''} />,
    })
  if (doc.rawHtml !== undefined)
    tabs.push({
      value: 'rawHtml',
      label: 'Raw HTML',
      text: () => doc.rawHtml ?? '',
      filename: `${base}.raw.html`,
      mime: 'text/html',
      render: () => <HtmlTab html={doc.rawHtml ?? ''} />,
    })
  if (doc.screenshot)
    tabs.push({ value: 'screenshot', label: 'Screenshot', render: () => <Screenshot src={doc.screenshot!} /> })
  if (doc.links)
    tabs.push({
      value: 'links',
      label: 'Links',
      count: doc.links.length,
      text: () => (doc.links ?? []).join('\n'),
      filename: `${base}-links.txt`,
      render: () => <UrlList urls={doc.links ?? []} />,
    })
  if (doc.images)
    tabs.push({
      value: 'images',
      label: 'Images',
      count: doc.images.length,
      text: () => (doc.images ?? []).join('\n'),
      filename: `${base}-images.txt`,
      render: () => <UrlList urls={doc.images ?? []} images />,
    })
  if (doc.attributes)
    tabs.push({
      value: 'attributes',
      label: 'Attributes',
      text: () => JSON.stringify(doc.attributes, null, 2),
      filename: `${base}-attributes.json`,
      mime: 'application/json',
      render: () => <JsonViewer data={doc.attributes} toolbar={false} />,
    })
  if (doc.changeTracking)
    tabs.push({
      value: 'changeTracking',
      label: 'Changes',
      text: () => JSON.stringify(doc.changeTracking, null, 2),
      filename: `${base}-changes.json`,
      mime: 'application/json',
      render: () => {
        const ct = doc.changeTracking!
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge status={ct.changeStatus} />
              <Badge variant="outline">{ct.visibility}</Badge>
              <span className="text-muted-foreground text-xs">
                Previous scrape: {ct.previousScrapeAt ? formatDate(ct.previousScrapeAt) : 'none'}
              </span>
            </div>
            {ct.diff?.text && <CodeBlock code={ct.diff.text} language="diff" maxHeight="30rem" />}
            {ct.json !== undefined && <JsonViewer data={ct.json} toolbar={false} />}
          </div>
        )
      },
    })
  if (doc.branding)
    tabs.push({
      value: 'branding',
      label: 'Branding',
      text: () => JSON.stringify(doc.branding, null, 2),
      filename: `${base}-branding.json`,
      mime: 'application/json',
      render: () => {
        const colors = Object.entries(doc.branding?.colors ?? {}).filter(([, v]) => typeof v === 'string')
        return (
          <div className="space-y-3">
            {colors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {colors.map(([name, c]) => (
                  <div key={name} className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
                    <span className="size-4 rounded border" style={{ background: c }} />
                    <span>{name}</span>
                    <span className="text-muted-foreground font-mono">{c}</span>
                  </div>
                ))}
              </div>
            )}
            <JsonViewer data={doc.branding} toolbar={false} collapsed={1} />
          </div>
        )
      },
    })
  if (doc.product)
    tabs.push({
      value: 'product',
      label: 'Product',
      text: () => JSON.stringify(doc.product, null, 2),
      filename: `${base}-product.json`,
      mime: 'application/json',
      render: () => <JsonViewer data={doc.product} toolbar={false} />,
    })
  if (doc.menu)
    tabs.push({
      value: 'menu',
      label: 'Menu',
      text: () => JSON.stringify(doc.menu, null, 2),
      filename: `${base}-menu.json`,
      mime: 'application/json',
      render: () => <JsonViewer data={doc.menu} toolbar={false} collapsed={2} />,
    })
  if (doc.actions && Object.keys(doc.actions).length > 0)
    tabs.push({
      value: 'actions',
      label: 'Actions',
      text: () => JSON.stringify(doc.actions, null, 2),
      filename: `${base}-actions.json`,
      mime: 'application/json',
      render: () => (
        <div className="space-y-3">
          {(doc.actions?.screenshots ?? []).map((s, i) => (
            <Screenshot key={i} src={s} />
          ))}
          <JsonViewer
            data={{ ...doc.actions, screenshots: doc.actions?.screenshots?.length ? `${doc.actions.screenshots.length} shown above` : undefined }}
            toolbar={false}
          />
        </div>
      ),
    })
  if (doc.audio || doc.video || doc.videos)
    tabs.push({
      value: 'media',
      label: 'Media',
      render: () => (
        <div className="space-y-3">
          {doc.audio && <audio controls src={doc.audio} className="w-full" />}
          {doc.video && <video controls src={doc.video} className="w-full rounded-lg border" />}
          {doc.videos && <JsonViewer data={doc.videos} toolbar={false} />}
        </div>
      ),
    })
  tabs.push({
    value: 'metadata',
    label: 'Metadata',
    text: () => JSON.stringify(doc.metadata, null, 2),
    filename: `${base}-metadata.json`,
    mime: 'application/json',
    render: () => <JsonViewer data={doc.metadata} toolbar={false} />,
  })

  const initial = defaultTab && tabs.some(t => t.value === defaultTab) ? defaultTab : tabs[0].value
  const [tab, setTab] = React.useState(initial)
  const active = tabs.find(t => t.value === tab) ?? tabs[0]
  const meta = doc.metadata ?? ({} as Document['metadata'])
  const warning = doc.warning

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {meta.statusCode !== undefined && (
          <Badge variant={meta.statusCode >= 400 ? 'destructive' : 'success'}>HTTP {meta.statusCode}</Badge>
        )}
        {meta.title && <span className="max-w-md truncate font-medium">{String(meta.title)}</span>}
        {(meta.sourceURL || meta.url) && (
          <a
            href={String(meta.url ?? meta.sourceURL)}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground max-w-sm truncate font-mono hover:underline"
          >
            {String(meta.url ?? meta.sourceURL)}
          </a>
        )}
        {meta.cacheState && <Badge variant="muted">cache {meta.cacheState}</Badge>}
        {meta.proxyUsed && <Badge variant="muted">proxy {meta.proxyUsed}</Badge>}
        {typeof meta.creditsUsed === 'number' && <Badge variant="outline">{meta.creditsUsed} credits</Badge>}
      </div>
      {warning && (
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
      {meta.error && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{String(meta.error)}</AlertDescription>
        </Alert>
      )}
      <Tabs value={active.value} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="flex-wrap">
            {tabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="flex-none">
                {t.label}
                {t.count !== undefined && <span className="text-muted-foreground text-xs">{t.count}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
          {active.text && (
            <div className="flex items-center gap-1">
              <CopyButton value={active.text} label="Copy" variant="outline" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadFile(active.filename ?? `${base}.txt`, active.text!(), active.mime)}
              >
                <DownloadIcon /> Download
              </Button>
            </div>
          )}
        </div>
        {tabs.map(t => (
          <TabsContent key={t.value} value={t.value}>
            {t.value === active.value && t.render()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
