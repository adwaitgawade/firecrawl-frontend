import * as React from 'react'
import { PlusIcon, RadarIcon, RefreshCwIcon } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState, ErrorAlert, PageHeader, RequestPreview } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { PAGE_SIZE, useMonitors } from './api'
import { MonitorsTable } from './components/MonitorsTable'
import { Pager } from './components/Pager'

function NewMonitorButton() {
  return (
    <Button asChild>
      <Link to="/monitors/new">
        <PlusIcon /> New monitor
      </Link>
    </Button>
  )
}

export function MonitorsPage() {
  const [offset, setOffset] = React.useState(0)
  const query = useMonitors(offset)
  const monitors = query.data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        icon={RadarIcon}
        title="Monitors"
        description="Scheduled change detection for pages, whole sites and web searches."
        actions={<NewMonitorButton />}
      />

      {query.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorAlert error={query.error} title="Could not load monitors" onRetry={() => void query.refetch()} />
      ) : monitors.length === 0 && offset === 0 ? (
        <EmptyState
          icon={RadarIcon}
          title="No monitors yet"
          description="Create a monitor to get notified when pages change, new pages appear on a site, or new search results show up."
          action={<NewMonitorButton />}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
              <RefreshCwIcon className={cn(query.isFetching && 'animate-spin')} /> Refresh
            </Button>
          </div>
          <MonitorsTable monitors={monitors} />
          <Pager offset={offset} limit={PAGE_SIZE} count={monitors.length} onChange={setOffset} disabled={query.isFetching} />
        </div>
      )}

      <RequestPreview method="GET" path="/monitor" query={{ limit: PAGE_SIZE, offset }} />
    </div>
  )
}
