import * as React from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface SwitchRowProps {
  label: React.ReactNode
  hint?: React.ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/** Bordered row with a label, optional hint and a switch. */
export function SwitchRow({ label, hint, checked, onCheckedChange, disabled, className }: SwitchRowProps) {
  const id = React.useId()
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-md border px-3 py-2.5',
        disabled && 'opacity-60',
        className,
      )}
    >
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className="mt-0.5" />
    </div>
  )
}
