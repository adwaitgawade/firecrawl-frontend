import { CheckCircle2Icon, CircleDashedIcon, Loader2Icon, PauseIcon, XCircleIcon, BanIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface StatusBadgeProps {
  status: string | null | undefined
  className?: string
  /** Hide the leading icon. */
  hideIcon?: boolean
}

type Tone = 'success' | 'destructive' | 'warning' | 'info' | 'muted'

const TONES: Record<string, Tone> = {
  completed: 'success',
  success: 'success',
  succeeded: 'success',
  active: 'info',
  done: 'success',
  same: 'muted',
  new: 'info',
  changed: 'warning',
  removed: 'destructive',
  failed: 'destructive',
  error: 'destructive',
  cancelled: 'muted',
  canceled: 'muted',
  destroyed: 'muted',
  expired: 'muted',
  paused: 'warning',
  scraping: 'info',
  processing: 'info',
  running: 'info',
  pending: 'muted',
  queued: 'muted',
  waiting: 'muted',
}

const SPINNING = new Set(['scraping', 'processing', 'running'])

/** Colored badge for job/check statuses (completed, failed, scraping, processing, cancelled, …). */
export function StatusBadge({ status, className, hideIcon }: StatusBadgeProps) {
  const s = (status ?? 'unknown').toString()
  const key = s.toLowerCase()
  const tone = TONES[key] ?? 'muted'
  const Icon = SPINNING.has(key)
    ? Loader2Icon
    : tone === 'success'
      ? CheckCircle2Icon
      : tone === 'destructive'
        ? XCircleIcon
        : key === 'paused'
          ? PauseIcon
          : key === 'cancelled' || key === 'canceled'
            ? BanIcon
            : CircleDashedIcon
  return (
    <Badge variant={tone} className={cn('capitalize', className)}>
      {!hideIcon && <Icon className={cn(SPINNING.has(key) && 'animate-spin')} />}
      {s.replace(/[_-]/g, ' ')}
    </Badge>
  )
}
