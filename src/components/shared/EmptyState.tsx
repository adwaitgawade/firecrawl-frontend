import * as React from 'react'
import { InboxIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  /** A Lucide icon component (or any component taking className), or a ready element. */
  icon?: React.ComponentType<{ className?: string }> | React.ReactElement
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  let iconNode: React.ReactNode
  if (React.isValidElement(icon)) {
    iconNode = icon
  } else {
    const Icon = (icon as React.ComponentType<{ className?: string }> | undefined) ?? InboxIcon
    iconNode = <Icon className="size-6" />
  }
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        {iconNode}
      </div>
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        {description && (
          <p className="text-muted-foreground mx-auto max-w-md text-sm">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
