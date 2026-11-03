import { BellIcon, CalendarClockIcon, GlobeIcon, NetworkIcon, SearchIcon, SparklesIcon, WebhookIcon } from 'lucide-react'

import { StatCard, StatusBadge } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatNumber, formatRelative, shortUrl } from '@/lib/utils'

import { summarizeTargets } from '../format'
import { describeCron } from '../schedule'
import type { Monitor, MonitorTarget } from '../types'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}

function formatsOf(t: MonitorTarget): string | null {
  if (t.type === 'search') return null
  const formats = t.scrapeOptions?.formats
  if (!formats?.length) return 'markdown'
  return formats.map(f => (typeof f === 'string' ? f : f.type)).join(', ')
}

function TargetItem({ target }: { target: MonitorTarget }) {
  const Icon = target.type === 'scrape' ? GlobeIcon : target.type === 'crawl' ? NetworkIcon : SearchIcon
  const formats = formatsOf(target)
  return (
    <li className="space-y-1.5 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="text-muted-foreground size-4" />
        {target.type === 'scrape' ? 'Pages' : target.type === 'crawl' ? 'Crawl' : 'Search'}
        {formats && <span className="text-muted-foreground ml-auto font-mono text-xs font-normal">{formats}</span>}
      </div>
      {target.type === 'scrape' && (
        <ul className="space-y-0.5">
          {target.urls.slice(0, 8).map(u => (
            <li key={u} className="truncate font-mono text-xs">
              <a href={u} target="_blank" rel="noreferrer" className="hover:underline">
                {u}
              </a>
            </li>
          ))}
          {target.urls.length > 8 && <li className="text-muted-foreground text-xs">+{target.urls.length - 8} more</li>}
        </ul>
      )}
      {target.type === 'crawl' && (
        <div className="space-y-0.5 text-xs">
          <a href={target.url} target="_blank" rel="noreferrer" className="block truncate font-mono hover:underline">
            {target.url}
          </a>
          <p className="text-muted-foreground">
            {target.crawlOptions?.limit != null && <>limit {String(target.crawlOptions.limit)} · </>}
            {target.crawlOptions?.maxDiscoveryDepth != null && <>depth {String(target.crawlOptions.maxDiscoveryDepth)} · </>}
            {target.crawlOptions?.includePaths?.length ? <>include {target.crawlOptions.includePaths.join(', ')} · </> : null}
            {target.crawlOptions?.excludePaths?.length ? <>exclude {target.crawlOptions.excludePaths.join(', ')}</> : null}
          </p>
        </div>
      )}
      {target.type === 'search' && (
        <div className="space-y-1 text-xs">
          <div className="flex flex-wrap gap-1">
            {target.queries.map(q => (
              <Badge key={q} variant="secondary" className="font-normal">
                {q}
              </Badge>
            ))}
          </div>
          <p className="text-muted-foreground">
            window {target.searchWindow ?? '24h'} · up to {target.maxResults ?? 10} results
            {target.includeDomains?.length ? ` · only ${target.includeDomains.map(d => shortUrl(d)).join(', ')}` : ''}
            {target.excludeDomains?.length ? ` · excluding ${target.excludeDomains.join(', ')}` : ''}
          </p>
        </div>
      )}
    </li>
  )
}

export function MonitorOverview({ monitor }: { monitor: Monitor }) {
  const email = monitor.notification?.email
  const slack = monitor.notification?.slack
  const summary = monitor.lastCheckSummary

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Last check"
          value={monitor.currentCheckId ? 'Running…' : formatRelative(monitor.lastRunAt)}
          description={monitor.lastRunAt ? formatDate(monitor.lastRunAt) : 'Never run'}
        />
        <StatCard
          title="Next run"
          value={monitor.status === 'active' ? formatRelative(monitor.nextRunAt) : 'Paused'}
          description={monitor.status === 'active' && monitor.nextRunAt ? formatDate(monitor.nextRunAt) : undefined}
        />
        <StatCard
          title="Last changes"
          value={summary ? formatNumber(summary.changed + summary.new + summary.removed) : '—'}
          description={
            summary
              ? `${summary.changed} changed · ${summary.new} new · ${summary.removed} removed · ${summary.error} errors`
              : 'No completed checks yet'
          }
        />
        <StatCard
          title="Est. credits / month"
          value={formatNumber(monitor.estimatedCreditsPerMonth)}
          description={`Retention ${monitor.retentionDays} days`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Targets</span>
              <span className="text-muted-foreground text-sm font-normal">{summarizeTargets(monitor.targets)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {monitor.targets.map((t, i) => (
                <TargetItem key={t.id ?? i} target={t} />
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="gap-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarClockIcon className="text-muted-foreground size-4" /> Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y">
                <Row label="Frequency">{describeCron(monitor.schedule.cron)}</Row>
                <Row label="Cron">
                  <code className="font-mono text-xs">{monitor.schedule.cron}</code>
                </Row>
                <Row label="Timezone">{monitor.schedule.timezone}</Row>
                <Row label="Status">
                  <StatusBadge status={monitor.status} />
                </Row>
                <Row label="Created">{formatDate(monitor.createdAt)}</Row>
              </dl>
            </CardContent>
          </Card>

          <Card className="gap-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BellIcon className="text-muted-foreground size-4" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <Badge variant={email?.enabled ? 'success' : 'muted'}>{email?.enabled ? 'On' : 'Off'}</Badge>
                </div>
                {email?.enabled && (
                  <ul className="space-y-0.5 text-xs">
                    {(monitor.emailRecipientSubscriptions?.length
                      ? monitor.emailRecipientSubscriptions
                      : (email.recipients ?? []).map(r => ({ email: r, status: undefined }))
                    ).map(r => (
                      <li key={r.email} className="flex items-center justify-between gap-2">
                        <span className="truncate font-mono">{r.email}</span>
                        {r.status && <StatusBadge status={r.status} hideIcon />}
                      </li>
                    ))}
                    {email.includeDiffs && <li className="text-muted-foreground">Diffs included</li>}
                  </ul>
                )}
              </div>
              {slack?.enabled && (
                <div className="flex items-center justify-between">
                  <span>Slack</span>
                  <span className="font-mono text-xs">#{slack.channelName ?? slack.channelId}</span>
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <WebhookIcon className="size-3.5" /> Webhook
                  </span>
                  <Badge variant={monitor.webhook?.url ? 'success' : 'muted'}>{monitor.webhook?.url ? 'On' : 'Off'}</Badge>
                </div>
                {monitor.webhook?.url && (
                  <>
                    <p className="truncate font-mono text-xs" title={monitor.webhook.url}>
                      {monitor.webhook.url}
                    </p>
                    {monitor.webhook.events?.length ? (
                      <p className="text-muted-foreground font-mono text-xs">{monitor.webhook.events.join(', ')}</p>
                    ) : null}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {(monitor.goal || monitor.judgeEnabled) && (
            <Card className="gap-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SparklesIcon className="text-muted-foreground size-4" /> Goal
                  <Badge variant={monitor.judgeEnabled ? 'info' : 'muted'} className="ml-auto">
                    AI judge {monitor.judgeEnabled ? 'on' : 'off'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{monitor.goal || <span className="text-muted-foreground">No goal set</span>}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
