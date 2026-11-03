import { CalendarClockIcon, CoinsIcon, GaugeIcon, TimerIcon } from 'lucide-react'

import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Progress } from '@/components/ui/progress'
import { formatDate, formatDuration, formatNumber, formatRelative } from '@/lib/utils'

import type { CrawlMeta } from '../useCrawlWatch'

export function CrawlStats({ meta, loading }: { meta?: CrawlMeta; loading?: boolean }) {
  const completed = meta?.completed ?? 0
  const total = meta?.total ?? 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : meta?.status === 'completed' ? 100 : 0
  const scraping = meta?.status === 'scraping'
  // creditsUsed is -1 when billing data isn't available (e.g. self-hosted without DB auth).
  const credits = meta && meta.creditsUsed >= 0 ? formatNumber(meta.creditsUsed) : '—'

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Progress"
        icon={GaugeIcon}
        loading={loading}
        value={
          <span>
            {formatNumber(completed)}
            <span className="text-muted-foreground text-base font-normal"> / {formatNumber(total)}</span>
          </span>
        }
        footer={
          <div className="space-y-1 pt-1">
            <Progress value={pct} indicatorClassName={scraping ? 'animate-pulse' : undefined} />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{pct}%</span>
              {meta && <StatusBadge status={meta.status} className="h-5" />}
            </div>
          </div>
        }
      />
      <StatCard
        title="Credits used"
        icon={CoinsIcon}
        loading={loading}
        value={credits}
        description={meta && meta.creditsUsed < 0 ? 'Not reported by this server' : scraping ? 'Updates as pages finish' : undefined}
      />
      <StatCard
        title="Duration"
        icon={TimerIcon}
        loading={loading}
        value={meta?.duration !== undefined ? formatDuration(meta.duration * 1000) : '—'}
        description={
          meta?.createdAt
            ? `Started ${formatDate(meta.createdAt)}${meta.completedAt ? ` · finished ${formatDate(meta.completedAt)}` : ''}`
            : undefined
        }
      />
      <StatCard
        title="Results expire"
        icon={CalendarClockIcon}
        loading={loading}
        value={meta?.expiresAt ? formatRelative(meta.expiresAt) : '—'}
        description={meta?.expiresAt ? formatDate(meta.expiresAt) : undefined}
      />
    </div>
  )
}
