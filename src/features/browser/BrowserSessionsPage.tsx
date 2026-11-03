import * as React from 'react'
import { AppWindowIcon, RefreshCwIcon } from 'lucide-react'

import { EmptyState, ErrorAlert, PageHeader, RequestPreview, StatCard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

import { useBrowserSessions, type SessionFilter } from './api'
import { NewSessionDialog } from './components/NewSessionDialog'
import { SessionsTable } from './components/SessionsTable'

export function BrowserSessionsPage() {
  const [filter, setFilter] = React.useState<SessionFilter>('all')
  const query = useBrowserSessions(filter)
  const sessions = React.useMemo(
    () =>
      [...(query.data?.sessions ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [query.data],
  )
  const activeCount = sessions.filter(s => s.status === 'active').length

  return (
    <div className="space-y-6">
      <PageHeader
        icon={AppWindowIcon}
        title="Browser"
        description="Remote browser sessions you can script with Playwright, agent-browser or CDP, with live view and replays."
        actions={<NewSessionDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Sessions" value={sessions.length} loading={query.isPending} description={filter === 'all' ? 'All statuses' : `Filtered: ${filter}`} />
        <StatCard title="Active" value={activeCount} loading={query.isPending} description="Currently billing" />
        <StatCard
          title="Destroyed"
          value={sessions.length - activeCount}
          loading={query.isPending}
          description="Replays may still be available"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={filter}
          onValueChange={v => v && setFilter(v as SessionFilter)}
        >
          <ToggleGroupItem value="all" className="px-3 text-xs">
            All
          </ToggleGroupItem>
          <ToggleGroupItem value="active" className="px-3 text-xs">
            Active
          </ToggleGroupItem>
          <ToggleGroupItem value="destroyed" className="px-3 text-xs">
            Destroyed
          </ToggleGroupItem>
        </ToggleGroup>
        <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCwIcon className={cn(query.isFetching && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {query.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorAlert error={query.error} title="Could not load sessions" onRetry={() => void query.refetch()} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={AppWindowIcon}
          title={filter === 'all' ? 'No browser sessions yet' : `No ${filter} sessions`}
          description="Create a session to get a remote browser with a live view, CDP endpoint and code execution."
          action={<NewSessionDialog />}
        />
      ) : (
        <SessionsTable sessions={sessions} />
      )}

      <RequestPreview method="GET" path="/browser" query={{ status: filter === 'all' ? undefined : filter }} />
    </div>
  )
}
