import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ActivityIcon, ChevronRightIcon, HistoryIcon, RefreshCwIcon, Trash2Icon, XIcon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { clearJobs, removeJob, useJobHistory } from '@/lib/job-history'
import { cn, formatDate, formatRelative, shortUrl } from '@/lib/utils'

import { crawlKeys, getOngoingCrawls } from '../api'

function JobRow({
  to,
  title,
  subtitle,
  right,
  onRemove,
}: {
  to: string
  title: string
  subtitle: ReactNode
  right?: ReactNode
  onRemove?: () => void
}) {
  return (
    <li className="group hover:bg-muted/50 flex items-center gap-3 px-3 py-2.5 transition-colors">
      <Link to={to} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm">{title}</div>
          <div className="text-muted-foreground truncate text-xs">{subtitle}</div>
        </div>
        {right}
        <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
      </Link>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          onClick={onRemove}
          aria-label="Remove from history"
        >
          <XIcon />
        </Button>
      )}
    </li>
  )
}

function OngoingCrawls() {
  const query = useQuery({
    queryKey: crawlKeys.ongoing(),
    queryFn: ({ signal }) => getOngoingCrawls(signal),
    refetchInterval: 5000,
  })

  if (query.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }
  if (query.isError) return <ErrorAlert error={query.error} title="Could not load ongoing crawls" onRetry={() => query.refetch()} />

  const crawls = query.data?.crawls ?? []
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          {crawls.length} running for this team · <code>GET /v2/crawl/ongoing</code>
        </span>
        <Button variant="ghost" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
          <RefreshCwIcon className={cn(query.isFetching && 'animate-spin')} /> Refresh
        </Button>
      </div>
      {crawls.length === 0 ? (
        <EmptyState icon={ActivityIcon} title="No ongoing crawls" description="Crawls that are currently running for your team show up here." />
      ) : (
        <ul className="divide-y rounded-lg border">
          {crawls.map(c => (
            <JobRow
              key={c.id}
              to={`/crawl/${c.id}`}
              title={shortUrl(c.url)}
              subtitle={
                <span title={formatDate(c.created_at)}>
                  Started {formatRelative(c.created_at)} · <span className="font-mono">{c.id}</span>
                </span>
              }
              right={
                <div className="hidden items-center gap-1.5 sm:flex">
                  {c.options?.limit !== undefined && <Badge variant="outline">limit {c.options.limit}</Badge>}
                  <StatusBadge status="scraping" />
                </div>
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function RecentCrawls() {
  const jobs = useJobHistory('crawl')
  if (jobs.length === 0) {
    return <EmptyState icon={HistoryIcon} title="No crawls yet" description="Crawls you start from this browser are remembered here." />
  }
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{jobs.length} saved in this browser</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearJobs('crawl')
            toast.success('Crawl history cleared')
          }}
        >
          <Trash2Icon /> Clear
        </Button>
      </div>
      <ul className="divide-y rounded-lg border">
        {jobs.map(job => (
          <JobRow
            key={job.id}
            to={`/crawl/${job.id}`}
            title={shortUrl(job.label)}
            subtitle={
              <span title={formatDate(job.createdAt)}>
                {formatRelative(job.createdAt)} · <span className="font-mono">{job.id}</span>
              </span>
            }
            right={job.status ? <StatusBadge status={job.status} className="hidden sm:inline-flex" /> : undefined}
            onRemove={() => removeJob(job.id)}
          />
        ))}
      </ul>
    </div>
  )
}

export function CrawlJobsTabs() {
  return (
    <Tabs defaultValue="ongoing" className="gap-3">
      <TabsList>
        <TabsTrigger value="ongoing">
          <ActivityIcon /> Ongoing crawls
        </TabsTrigger>
        <TabsTrigger value="recent">
          <HistoryIcon /> Recent crawls
        </TabsTrigger>
      </TabsList>
      <TabsContent value="ongoing">
        <OngoingCrawls />
      </TabsContent>
      <TabsContent value="recent">
        <RecentCrawls />
      </TabsContent>
    </Tabs>
  )
}
