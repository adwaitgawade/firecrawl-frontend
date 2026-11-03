import * as React from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: React.ReactNode
  value: React.ReactNode
  description?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  loading?: boolean
  /** Optional footer/trend node rendered under the value. */
  footer?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, loading, footer, className }: StatCardProps) {
  return (
    <Card className={cn('gap-2 py-4', className)}>
      <CardContent className="space-y-1 px-4">
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
          <span className="truncate">{title}</span>
          {Icon && <Icon className="size-4 shrink-0" />}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="truncate text-2xl font-semibold tabular-nums">{value}</div>
        )}
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
        {footer}
      </CardContent>
    </Card>
  )
}
