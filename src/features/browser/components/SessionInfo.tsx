import { ExternalLinkIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatDuration, formatRelative } from '@/lib/utils'

import type { BrowserSession } from '../types'
import { useNow } from '../use-now'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  )
}

function UrlRow({ label, url, openable }: { label: string; url: string; openable?: boolean }) {
  return (
    <Row label={label}>
      <div className="flex min-w-0 items-center gap-1">
        <code className="bg-muted min-w-0 flex-1 truncate rounded px-2 py-1 font-mono text-xs" title={url}>
          {url}
        </code>
        <CopyButton value={url} toastMessage={`${label} copied`} />
        {openable && (
          <Button variant="ghost" size="icon-sm" asChild aria-label={`Open ${label}`}>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
            </a>
          </Button>
        )}
      </div>
    </Row>
  )
}

export function SessionInfo({ session, expiresAt }: { session: BrowserSession; expiresAt?: string }) {
  const now = useNow()
  const active = session.status === 'active'
  const created = new Date(session.createdAt).getTime()
  const age = (active ? now : new Date(session.lastActivity).getTime()) - created
  const remaining = expiresAt ? new Date(expiresAt).getTime() - now : null

  return (
    <Card>
      <CardContent className="space-y-4">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Row label="Created">
            <span title={formatDate(session.createdAt, 'PPpp')}>{formatRelative(session.createdAt)}</span>
          </Row>
          <Row label={active ? 'Age' : 'Duration'}>
            <span className="font-mono">{Number.isFinite(age) && age >= 0 ? formatDuration(age) : '—'}</span>
          </Row>
          <Row label="Last activity">{formatRelative(session.lastActivity)}</Row>
          <Row label={active && remaining !== null ? 'Expires in' : 'Live view streaming'}>
            {active && remaining !== null ? (
              <span className="font-mono">{remaining > 0 ? formatDuration(remaining) : 'expired'}</span>
            ) : session.streamWebView ? (
              'Enabled'
            ) : (
              'Disabled'
            )}
          </Row>
        </dl>
        {active && (
          <dl className="grid gap-4 lg:grid-cols-2">
            {session.cdpUrl && <UrlRow label="CDP URL" url={session.cdpUrl} />}
            {(session.interactiveLiveViewUrl || session.liveViewUrl) && (
              <UrlRow
                label="Live view URL"
                url={session.interactiveLiveViewUrl || session.liveViewUrl}
                openable
              />
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
