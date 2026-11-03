import { CheckIcon } from 'lucide-react'

import type { AgentModel } from '@/lib/api/types'
import { cn } from '@/lib/utils'

import { AGENT_MODELS } from '../types'

interface ModelPickerProps {
  value: AgentModel
  onChange: (model: AgentModel) => void
  disabled?: boolean
}

/** Card-style radio group for the agent model. */
export function ModelPicker({ value, onChange, disabled }: ModelPickerProps) {
  return (
    <div role="radiogroup" aria-label="Model" className="grid gap-2 sm:grid-cols-2">
      {AGENT_MODELS.map(m => {
        const selected = m.value === value
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(m.value)}
            className={cn(
              'focus-visible:ring-ring/50 relative rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-[3px] disabled:opacity-60',
              selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{m.label}</span>
              {selected && <CheckIcon className="text-primary size-4" />}
            </div>
            <code className="text-muted-foreground font-mono text-[11px]">{m.value}</code>
            <p className="text-muted-foreground mt-1 text-xs">{m.description}</p>
          </button>
        )
      })}
    </div>
  )
}
