import { ExternalLinkIcon } from 'lucide-react'
import { Link } from 'react-router'

import { CopyButton, StatusBadge } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDate, formatDuration, formatRelative } from '@/lib/utils'

import type { BrowserSession } from '../types'
import { useNow } from '../use-now'
import { DeleteSessionButton } from './DeleteSessionButton'

function shortId(id: string) {
  return id.length > 13 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
}

export function SessionsTable({ sessions }: { sessions: BrowserSession[] }) {
  const now = useNow()
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="hidden md:table-cell">Age</TableHead>
            <TableHead className="hidden md:table-cell">Last activity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map(s => {
            const active = s.status === 'active'
            const ageMs = (active ? now : new Date(s.lastActivity).getTime()) - new Date(s.createdAt).getTime()
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Link to={`/browser/${s.id}`} className="font-mono text-sm hover:underline" title={s.id}>
                      {shortId(s.id)}
                    </Link>
                    <CopyButton value={s.id} toastMessage="Session ID copied" />
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm whitespace-nowrap">{formatRelative(s.createdAt)}</span>
                    </TooltipTrigger>
                    <TooltipContent>{formatDate(s.createdAt, 'PPpp')}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="hidden font-mono text-sm md:table-cell">
                  {Number.isFinite(ageMs) && ageMs >= 0 ? formatDuration(ageMs) : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-sm whitespace-nowrap md:table-cell">
                  {formatRelative(s.lastActivity)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {active && s.liveViewUrl && (
                      <Button variant="ghost" size="icon-sm" asChild aria-label="Open live view">
                        <a href={s.interactiveLiveViewUrl || s.liveViewUrl} target="_blank" rel="noreferrer">
                          <ExternalLinkIcon />
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/browser/${s.id}`}>Open</Link>
                    </Button>
                    {active && <DeleteSessionButton sessionId={s.id} compact />}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
