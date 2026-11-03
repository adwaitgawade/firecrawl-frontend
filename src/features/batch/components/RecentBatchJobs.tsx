import { ChevronRightIcon, LayersIcon, XIcon } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clearJobs, removeJob, useJobHistory } from '@/lib/job-history'
import { formatRelative } from '@/lib/utils'

/** Recent batch jobs from local job history. */
export function RecentBatchJobs() {
  const jobs = useJobHistory('batch')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent batch jobs</CardTitle>
        <CardDescription>Stored in this browser.</CardDescription>
        {jobs.length > 0 && (
          <CardAction>
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => clearJobs('batch')}>
              Clear
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <EmptyState
            icon={LayersIcon}
            title="No batch jobs yet"
            description="Jobs you start here show up in this list."
            className="py-8"
          />
        ) : (
          <ul className="-mx-2 divide-y">
            {jobs.slice(0, 20).map(job => (
              <li key={job.id} className="group flex items-center gap-1">
                <Link
                  to={`/batch/${job.id}`}
                  className="hover:bg-muted/60 flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{job.label}</p>
                    <p className="text-muted-foreground truncate font-mono text-[11px]">
                      {job.id} · {formatRelative(job.createdAt)}
                    </p>
                  </div>
                  {job.status && <StatusBadge status={job.status} />}
                  <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  onClick={() => removeJob(job.id)}
                  aria-label="Remove from history"
                >
                  <XIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
