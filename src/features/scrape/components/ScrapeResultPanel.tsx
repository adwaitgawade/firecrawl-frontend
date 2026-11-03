import { DownloadIcon, FlameIcon, Loader2Icon, MousePointerClickIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared/CopyButton'
import { DocumentViewer } from '@/components/shared/DocumentViewer'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { downloadFile, shortUrl } from '@/lib/utils'

import { deserializeError } from '../api'
import type { ScrapeRun } from '../types'
import { scrapeIdOf } from '../use-scrape-runner'
import { ElapsedTimer } from './ElapsedTimer'
import { ScrapeResultSummary } from './ScrapeResultSummary'

interface ScrapeResultPanelProps {
  run?: ScrapeRun
  onRetry?: () => void
  onCancel?: () => void
  onInteract?: (scrapeId: string) => void
}

function fileSlug(url: string) {
  return (shortUrl(url) || 'scrape').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'scrape'
}

export function ScrapeResultPanel({ run, onRetry, onCancel, onInteract }: ScrapeResultPanelProps) {
  if (!run) {
    return (
      <EmptyState
        icon={FlameIcon}
        title="No scrape yet"
        description="Enter a URL and hit Scrape. Results, metadata and every requested format show up here."
        className="h-full min-h-80"
      />
    )
  }

  if (run.status === 'pending') {
    return (
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2Icon className="text-primary size-5 animate-spin" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{run.source === 'lookup' ? 'Loading scrape job…' : 'Scraping…'}</p>
              <p className="text-muted-foreground truncate font-mono text-xs">{run.url}</p>
            </div>
            <ElapsedTimer since={run.startedAt} className="text-muted-foreground font-mono text-xs tabular-nums" />
            {onCancel && run.source === 'run' && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (run.status === 'error' || !run.response) {
    const error = run.error ? deserializeError(run.error) : new Error('Unknown error')
    return (
      <ErrorAlert
        error={error}
        title={
          run.error?.code === 'ABORTED'
            ? 'Scrape cancelled'
            : run.error?.status === undefined
              ? 'Scrape failed'
              : undefined
        }
        onRetry={onRetry}
      />
    )
  }

  const response = run.response
  const scrapeId = scrapeIdOf(response)
  const json = () => JSON.stringify(response, null, 2)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <ScrapeResultSummary response={response} durationMs={run.durationMs} scrapeId={scrapeId} />
          <div className="flex flex-wrap gap-2">
            {scrapeId && onInteract && (
              <Button size="sm" onClick={() => onInteract(scrapeId)}>
                <MousePointerClickIcon /> Interact
              </Button>
            )}
            <CopyButton value={json} label="Copy JSON" variant="outline" size="sm" toastMessage="Response copied" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadFile(`${fileSlug(run.url)}.json`, json(), 'application/json')}
            >
              <DownloadIcon /> Download JSON
            </Button>
          </div>
        </CardContent>
      </Card>
      {response.data ? (
        <DocumentViewer key={run.id} document={response.data} />
      ) : (
        <EmptyState title="Empty document" description="The API returned no document data." />
      )}
    </div>
  )
}
