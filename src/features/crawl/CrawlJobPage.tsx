import { ArrowLeftIcon, CircleAlertIcon, FileTextIcon, NetworkIcon, PlusIcon, RadioIcon, RefreshCwIcon, TriangleAlertIcon } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { CopyButton } from '@/components/shared/CopyButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useJobHistory } from '@/lib/job-history'
import { cn, shortUrl } from '@/lib/utils'

import { CancelCrawlButton, ExportMenu } from './components/CrawlJobActions'
import { CrawlErrorsPanel } from './components/CrawlErrorsPanel'
import { CrawlResultsList } from './components/CrawlResultsList'
import { CrawlStats } from './components/CrawlStats'
import type { CrawlWatchMode } from './types'
import { useCrawlWatch } from './useCrawlWatch'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const MODE_LABEL: Record<CrawlWatchMode, { label: string; hint: string }> = {
  connecting: { label: 'Connecting', hint: 'Opening a WebSocket to stream results…' },
  live: { label: 'Live', hint: 'Streaming documents over WebSocket' },
  finished: { label: 'Stream ended', hint: 'WebSocket finished; final status comes from the REST API' },
  polling: { label: 'Polling', hint: 'WebSocket unavailable; polling GET /v2/crawl/:id' },
}

function ConnectionBadge({ mode, reason, polling }: { mode: CrawlWatchMode; reason?: string; polling: boolean }) {
  const { label, hint } = MODE_LABEL[mode]
  const variant = mode === 'live' ? 'success' : mode === 'polling' ? 'warning' : 'muted'
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={variant} className="cursor-default">
          {mode === 'live' ? <RadioIcon className="animate-pulse" /> : mode === 'polling' ? <RefreshCwIcon className={cn(polling && 'animate-spin')} /> : null}
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {hint}
        {reason && mode === 'polling' ? ` — ${reason}` : ''}
      </TooltipContent>
    </Tooltip>
  )
}

function CrawlJobView({ jobId }: { jobId: string }) {
  const watch = useCrawlWatch(jobId)
  const history = useJobHistory('crawl').find(j => j.id === jobId)
  const { meta, documents } = watch
  const streaming = !watch.isTerminal && (watch.mode === 'live' || watch.mode === 'connecting' || meta?.status === 'scraping')

  return (
    <div className="space-y-6">
      <PageHeader
        icon={NetworkIcon}
        title={
          <span className="flex items-center gap-3">
            Crawl job
            <ConnectionBadge mode={watch.mode} reason={watch.socketError} polling={watch.isPolling} />
          </span>
        }
        description={
          <span className="flex min-w-0 items-center gap-1">
            {history && <span className="truncate font-mono">{shortUrl(history.label)} ·</span>}
            <span className="truncate font-mono text-xs">{jobId}</span>
            <CopyButton value={jobId} size="icon-sm" toastMessage="Job ID copied" />
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/crawl">
                <PlusIcon /> New crawl
              </Link>
            </Button>
            <ExportMenu jobId={jobId} documents={documents} partial={watch.canLoadMore} />
            {meta && !watch.isTerminal && <CancelCrawlButton jobId={jobId} onCancelled={watch.stopLive} />}
          </div>
        }
      />

      {watch.error && !watch.isLoading ? (
        <ErrorAlert error={watch.error} title="Could not load this crawl" onRetry={watch.refresh} />
      ) : (
        <>
          <CrawlStats meta={meta} loading={watch.isLoading} />

          {meta?.status === 'failed' && meta.error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Crawl failed</AlertTitle>
              <AlertDescription>{meta.error}</AlertDescription>
            </Alert>
          )}
          {meta?.warning && (
            <Alert variant="warning">
              <TriangleAlertIcon />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>{meta.warning}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="results" className="gap-3">
            <TabsList>
              <TabsTrigger value="results">
                <FileTextIcon /> Results
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 tabular-nums">
                  {documents.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="errors">
                <CircleAlertIcon /> Errors
              </TabsTrigger>
            </TabsList>
            <TabsContent value="results">
              {watch.isLoading ? (
                <EmptyState icon={<RefreshCwIcon className="size-6 animate-spin" />} title="Connecting to the crawl…" />
              ) : (
                <CrawlResultsList
                  documents={documents}
                  live={streaming}
                  canLoadMore={watch.canLoadMore}
                  onLoadMore={watch.loadMore}
                  isLoadingMore={watch.isLoadingMore}
                  loadMoreError={watch.loadMoreError}
                  totalCompleted={meta?.completed}
                />
              )}
            </TabsContent>
            <TabsContent value="errors">
              <CrawlErrorsPanel jobId={jobId} live={streaming} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <RequestPreview method="GET" path={`/crawl/${jobId}`} title="Status request" />
    </div>
  )
}

export function CrawlJobPage() {
  const { jobId = '' } = useParams()

  if (!UUID_RE.test(jobId)) {
    return (
      <EmptyState
        icon={CircleAlertIcon}
        title="Invalid crawl ID"
        description={`“${jobId}” is not a valid job ID.`}
        action={
          <Button variant="outline" asChild>
            <Link to="/crawl">
              <ArrowLeftIcon /> Back to Crawl
            </Link>
          </Button>
        }
      />
    )
  }

  return <CrawlJobView key={jobId} jobId={jobId} />
}
