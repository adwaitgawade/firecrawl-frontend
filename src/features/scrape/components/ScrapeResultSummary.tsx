import { ExternalLinkIcon, TriangleAlertIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared/CopyButton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import type { ScrapeResponse } from '@/lib/api/types'
import { formatDate, formatDuration, formatNumber } from '@/lib/utils'

interface ScrapeResultSummaryProps {
  response: ScrapeResponse
  durationMs?: number
  scrapeId?: string
}

function statusVariant(code: number | undefined) {
  if (code === undefined) return 'muted' as const
  if (code >= 200 && code < 300) return 'success' as const
  if (code >= 300 && code < 400) return 'info' as const
  if (code >= 400 && code < 500) return 'warning' as const
  return 'destructive' as const
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{label}</dt>
      <dd className="mt-0.5 truncate text-sm">{children}</dd>
    </div>
  )
}

/** Title, URL, status code and the interesting bits of `metadata` + any warnings. */
export function ScrapeResultSummary({ response, durationMs, scrapeId }: ScrapeResultSummaryProps) {
  const doc = response.data
  const meta = doc?.metadata ?? { statusCode: 0 }
  const url = meta.sourceURL ?? meta.url ?? doc?.url
  const finalUrl = meta.url && meta.url !== meta.sourceURL ? meta.url : undefined
  const title = meta.title ?? doc?.title
  const warnings = [response.warning, doc?.warning].filter((w): w is string => !!w)
  const metaError = typeof meta.error === 'string' ? meta.error : undefined

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {typeof meta.favicon === 'string' && (
          <img src={meta.favicon} alt="" className="mt-1 size-5 shrink-0 rounded-sm" loading="lazy" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(meta.statusCode)} className="font-mono">
              {meta.statusCode || '—'}
            </Badge>
            <h3 className="min-w-0 truncate font-semibold">{title || 'Untitled page'}</h3>
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground mt-1 inline-flex max-w-full items-center gap-1 font-mono text-xs"
            >
              <span className="truncate">{url}</span>
              <ExternalLinkIcon className="size-3 shrink-0" />
            </a>
          )}
          {finalUrl && (
            <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">→ redirected to {finalUrl}</p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-3 sm:grid-cols-3 xl:grid-cols-4">
        <Stat label="Credits used">{formatNumber(meta.creditsUsed)}</Stat>
        <Stat label="Cache">
          {meta.cacheState ? (
            <span title={meta.cachedAt ? `Cached at ${formatDate(meta.cachedAt)}` : undefined}>
              <Badge variant={meta.cacheState === 'hit' ? 'info' : 'muted'}>{meta.cacheState}</Badge>
              {meta.cachedAt && meta.cacheState === 'hit' && (
                <span className="text-muted-foreground ml-1.5 text-xs">{formatDate(meta.cachedAt, 'MMM d HH:mm')}</span>
              )}
            </span>
          ) : (
            '—'
          )}
        </Stat>
        <Stat label="Duration">{formatDuration(durationMs)}</Stat>
        <Stat label="Proxy">{meta.proxyUsed ?? '—'}</Stat>
        <Stat label="Content type">
          <span className="font-mono text-xs">{meta.contentType ?? '—'}</span>
        </Stat>
        {typeof meta.numPages === 'number' && <Stat label="Pages">{formatNumber(meta.numPages)}</Stat>}
        {meta.language && <Stat label="Language">{meta.language}</Stat>}
        {meta.concurrencyLimited && (
          <Stat label="Queued (concurrency)">{formatDuration(meta.concurrencyQueueDurationMs ?? 0)}</Stat>
        )}
        {scrapeId && (
          <Stat label="Scrape ID">
            <span className="flex items-center gap-1">
              <span className="truncate font-mono text-xs" title={scrapeId}>
                {scrapeId}
              </span>
              <CopyButton value={scrapeId} size="icon-sm" className="size-6" toastMessage="Scrape ID copied" />
            </span>
          </Stat>
        )}
      </dl>

      {metaError && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertTitle>Page error</AlertTitle>
          <AlertDescription>{metaError}</AlertDescription>
        </Alert>
      )}
      {warnings.map(w => (
        <Alert key={w} variant="warning">
          <TriangleAlertIcon />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{w}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
