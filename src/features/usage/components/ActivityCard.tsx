import * as React from 'react'
import { Link } from 'react-router'
import { ArrowUpRightIcon, HistoryIcon, Loader2Icon } from 'lucide-react'

import { CopyButton, EmptyState, ErrorAlert, RequestPreview } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatRelative, truncate } from '@/lib/utils'

import { ACTIVITY_PAGE_SIZE, useTeamActivity } from '../api'
import { ACTIVITY_ENDPOINT_LABELS, activityHref, activityPlaygroundHref, endpointLabel } from '../lib'
import { ACTIVITY_ENDPOINTS, type ActivityEndpoint, type ActivityItem } from '../types'

const ALL = 'all'

function ActivityRow({ item }: { item: ActivityItem }) {
  const detail = activityHref(item)
  const playground = detail ? null : activityPlaygroundHref(item)
  const href = detail ?? playground
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        <span title={formatDate(item.created_at, 'MMM d, yyyy HH:mm:ss')}>{formatRelative(item.created_at)}</span>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{endpointLabel(item.endpoint)}</Badge>
      </TableCell>
      <TableCell className="max-w-[18rem]">
        {item.target ? (
          <span className="block truncate font-mono text-xs" title={item.target}>
            {item.target}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground font-mono text-xs" title={item.id}>
            {truncate(item.id, 14)}
          </span>
          <CopyButton value={item.id} toastMessage="ID copied" />
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground hidden text-xs sm:table-cell">{item.api_version ?? '—'}</TableCell>
      <TableCell className="text-right">
        {href ? (
          <Button asChild variant="ghost" size="sm">
            <Link to={href}>
              {detail ? 'Open' : 'Playground'}
              <ArrowUpRightIcon />
            </Link>
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

/** Recent team requests (last 24h) from GET /v2/team/activity with endpoint filter + cursor pagination. */
export function ActivityCard() {
  const [endpoint, setEndpoint] = React.useState<ActivityEndpoint | undefined>(undefined)
  const q = useTeamActivity(endpoint)
  const items = React.useMemo(() => q.data?.pages.flatMap(p => p.data ?? []) ?? [], [q.data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Requests made by your team in the last 24 hours</CardDescription>
        <CardAction>
          <Select value={endpoint ?? ALL} onValueChange={v => setEndpoint(v === ALL ? undefined : (v as ActivityEndpoint))}>
            <SelectTrigger size="sm" className="w-40" aria-label="Filter by endpoint">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All endpoints</SelectItem>
              {ACTIVITY_ENDPOINTS.map(e => (
                <SelectItem key={e} value={e}>
                  {ACTIVITY_ENDPOINT_LABELS[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {q.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : q.isError && !q.data ? (
          <ErrorAlert error={q.error} title="Couldn't load activity" onRetry={() => q.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="No recent activity"
            description={
              endpoint
                ? `No ${endpointLabel(endpoint)} requests in the last 24 hours.`
                : 'Requests your team makes will show up here for 24 hours.'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="hidden md:table-cell">ID</TableHead>
                    <TableHead className="hidden sm:table-cell">API</TableHead>
                    <TableHead className="w-0">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                Showing {items.length} request{items.length === 1 ? '' : 's'}
              </span>
              {q.hasNextPage ? (
                <Button variant="outline" size="sm" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
                  {q.isFetchingNextPage && <Loader2Icon className="animate-spin" />}
                  Load more
                </Button>
              ) : (
                <span>End of the 24-hour window</span>
              )}
            </div>
            {q.isFetchNextPageError && <ErrorAlert error={q.error} title="Couldn't load more activity" />}
          </>
        )}

        <RequestPreview method="GET" path="/team/activity" query={{ endpoint, limit: ACTIVITY_PAGE_SIZE }} />
      </CardContent>
    </Card>
  )
}
