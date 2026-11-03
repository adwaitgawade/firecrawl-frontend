import * as React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { InlineError } from './InlineError'

interface MetricCardProps {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  /** Main figure. Ignored while loading or on error. */
  value?: React.ReactNode
  /** Secondary line under the value. */
  caption?: React.ReactNode
  /** Extra content (meter, breakdown) under the caption. */
  children?: React.ReactNode
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

/** Stat tile with built-in loading skeleton and a compact per-card error state. */
export function MetricCard({
  label,
  icon: Icon,
  value,
  caption,
  children,
  loading,
  error,
  onRetry,
  retrying,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('gap-0 py-4', className)}>
      <CardContent className="flex h-full flex-col gap-1.5 px-4">
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
          <span className="truncate">{label}</span>
          {Icon && <Icon className="size-4 shrink-0" />}
        </div>
        {loading ? (
          <div className="space-y-2 pt-0.5">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        ) : error ? (
          <div className="flex min-h-14 items-center">
            <InlineError error={error} onRetry={onRetry} retrying={retrying} />
          </div>
        ) : (
          <>
            <div className="truncate text-2xl font-semibold tabular-nums">{value}</div>
            {caption && <div className="text-muted-foreground text-xs">{caption}</div>}
            {children}
          </>
        )}
      </CardContent>
    </Card>
  )
}
