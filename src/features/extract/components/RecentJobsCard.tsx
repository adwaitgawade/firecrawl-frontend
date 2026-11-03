import { HistoryIcon, Trash2Icon, XIcon } from 'lucide-react'
import { Link } from 'react-router'

import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clearJobs, jobHref, removeJob, useJobHistory, type JobKind } from '@/lib/job-history'
import { cn, formatRelative, truncate } from '@/lib/utils'

interface RecentJobsCardProps {
  kind: JobKind
  title?: string
  /** Highlight this job id (e.g. the one being viewed). */
  activeId?: string
  limit?: number
  className?: string
}

/** Recent jobs of one kind from the local job history. */
export function RecentJobsCard({ kind, title = 'Recent jobs', activeId, limit = 10, className }: RecentJobsCardProps) {
  const jobs = useJobHistory(kind)
  const shown = jobs.slice(0, limit)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HistoryIcon className="text-muted-foreground size-4" /> {title}
        </CardTitle>
        <CardDescription>Stored in this browser.</CardDescription>
        {jobs.length > 0 && (
          <CardAction>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => clearJobs(kind)}>
              <Trash2Icon /> Clear
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">No jobs yet. Submitted jobs show up here.</p>
        ) : (
          <ul className="-mx-2 space-y-0.5">
            {shown.map(job => (
              <li key={job.id} className="group relative">
                <Link
                  to={jobHref(job)}
                  className={cn(
                    'hover:bg-muted/60 flex flex-col gap-1 rounded-md px-2 py-2 pr-8 text-sm transition-colors',
                    job.id === activeId && 'bg-muted',
                  )}
                >
                  <span className="line-clamp-2 break-words">{truncate(job.label || job.id, 120)}</span>
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    {job.status && <StatusBadge status={job.status} className="h-5 text-[10px]" />}
                    <span>{formatRelative(job.createdAt)}</span>
                    <span className="truncate font-mono opacity-70">{job.id.slice(0, 8)}</span>
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1.5 right-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label="Remove from history"
                  onClick={() => removeJob(job.id)}
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
