import { CheckCircle2Icon, CircleIcon, Loader2Icon, XCircleIcon } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { cn, formatDuration } from '@/lib/utils'

import type { ParseMode, ParseRunState, ParseStep } from '../types'

const STEP_LABELS: Record<ParseStep, { title: string; description: string }> = {
  'upload-url': { title: 'Request upload URL', description: 'POST /v2/parse/upload-url' },
  upload: { title: 'Upload file', description: 'Send the bytes to storage' },
  parse: { title: 'Parse document', description: 'POST /v2/parse' },
}

function stepsFor(mode: ParseMode): ParseStep[] {
  return mode === 'signed' ? ['upload-url', 'upload', 'parse'] : ['upload', 'parse']
}

type StepStatus = 'pending' | 'active' | 'done' | 'error'

function statusOf(step: ParseStep, steps: ParseStep[], state: ParseRunState): StepStatus {
  if (state.phase === 'idle') return 'pending'
  if (state.phase === 'done') return 'done'
  const current = steps.indexOf(state.step)
  const index = steps.indexOf(step)
  if (index < current) return 'done'
  if (index > current) return 'pending'
  return state.phase === 'error' ? 'error' : 'active'
}

export function ParseProgress({ mode, state }: { mode: ParseMode; state: ParseRunState }) {
  const steps = stepsFor(mode)
  return (
    <ol className="space-y-3">
      {steps.map(step => {
        const status = statusOf(step, steps, state)
        const label = STEP_LABELS[step]
        const description =
          mode === 'multipart' && step === 'upload'
            ? 'multipart/form-data to POST /v2/parse'
            : mode === 'multipart' && step === 'parse'
              ? 'Waiting for the parse result'
              : label.description
        const progress = state.phase === 'running' && state.step === step ? state.progress : undefined
        return (
          <li key={step} className="flex gap-3">
            <span className="mt-0.5">
              {status === 'done' && <CheckCircle2Icon className="text-success size-4" />}
              {status === 'active' && <Loader2Icon className="text-primary size-4 animate-spin" />}
              {status === 'error' && <XCircleIcon className="text-destructive size-4" />}
              {status === 'pending' && <CircleIcon className="text-muted-foreground/50 size-4" />}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('text-sm font-medium', status === 'pending' && 'text-muted-foreground')}>
                  {label.title}
                </p>
                {progress !== undefined && (
                  <span className="text-muted-foreground font-mono text-xs">{Math.round(progress * 100)}%</span>
                )}
              </div>
              <p className="text-muted-foreground font-mono text-xs">{description}</p>
              {progress !== undefined && <Progress value={progress * 100} className="h-1.5" />}
            </div>
          </li>
        )
      })}
      {state.phase === 'done' && (
        <li className="text-muted-foreground pl-7 text-xs">Finished in {formatDuration(state.durationMs)}</li>
      )}
    </ol>
  )
}
