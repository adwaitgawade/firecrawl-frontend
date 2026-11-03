import * as React from 'react'
import { Link } from 'react-router'
import { ClockIcon, Trash2Icon, XIcon } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState, StatusBadge } from '@/components/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clearJobs, jobHref, removeJob, useJobHistory, type JobHistoryEntry } from '@/lib/job-history'
import { formatDate, formatRelative } from '@/lib/utils'

import { kindMeta } from '../lib'

const COLLAPSED_COUNT = 8

function JobRow({ job }: { job: JobHistoryEntry }) {
  const meta = kindMeta(job.kind)
  const Icon = meta.icon
  return (
    <li className="group hover:bg-muted/50 relative flex items-center gap-3 rounded-lg px-2 py-2 transition-colors">
      <div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to={jobHref(job)}
          className="block truncate text-sm font-medium after:absolute after:inset-0 after:content-['']"
          title={job.label}
        >
          {job.label || job.id}
        </Link>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {meta.label}
          </Badge>
          <span title={formatDate(job.createdAt)}>{formatRelative(job.createdAt)}</span>
          <span className="hidden truncate font-mono sm:inline" title={job.id}>
            {job.id}
          </span>
        </div>
      </div>
      {job.status && <StatusBadge status={job.status} className="relative hidden sm:inline-flex" />}
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground relative shrink-0 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
        onClick={() => removeJob(job.id)}
        aria-label={`Remove ${job.label || job.id} from history`}
      >
        <XIcon />
      </Button>
    </li>
  )
}

function ClearHistoryButton({ count }: { count: number }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Trash2Icon /> Clear
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear job history?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes all {count} entries from this browser. Jobs on the server are not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              clearJobs()
              toast.success('Job history cleared')
            }}
          >
            Clear history
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Jobs started from this browser (localStorage), newest first. */
export function RecentJobs() {
  const jobs = useJobHistory()
  const [expanded, setExpanded] = React.useState(false)
  const visible = expanded ? jobs : jobs.slice(0, COLLAPSED_COUNT)

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Recent jobs</CardTitle>
        <CardDescription>Started from this browser</CardDescription>
        {jobs.length > 0 && (
          <CardAction>
            <ClearHistoryButton count={jobs.length} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {jobs.length === 0 ? (
          <EmptyState
            icon={ClockIcon}
            title="No jobs yet"
            description="Scrapes, crawls, extractions and agent runs you start will appear here so you can jump back in."
            action={
              <Button asChild size="sm">
                <Link to="/scrape">Run your first scrape</Link>
              </Button>
            }
          />
        ) : (
          <>
            <ul className="-mx-2 space-y-0.5">
              {visible.map(job => (
                <JobRow key={job.id} job={job} />
              ))}
            </ul>
            {jobs.length > COLLAPSED_COUNT && (
              <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setExpanded(e => !e)}>
                {expanded ? 'Show less' : `Show all ${jobs.length}`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
