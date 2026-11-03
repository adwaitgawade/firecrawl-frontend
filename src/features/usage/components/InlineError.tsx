import { AlertCircleIcon, RotateCcwIcon } from 'lucide-react'

import { getErrorMessage } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isFirecrawlApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

import { describeUsageError } from '../lib'

interface InlineErrorProps {
  error: unknown
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

/** Compact per-card error: a one-line reason, the full message on hover, and a retry button. */
export function InlineError({ error, onRetry, retrying, className }: InlineErrorProps) {
  const message = getErrorMessage(error)
  const status = isFirecrawlApiError(error) && error.status ? ` (${error.status})` : ''
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-destructive inline-flex min-w-0 cursor-help items-center gap-1.5">
            <AlertCircleIcon className="size-4 shrink-0" />
            <span className="truncate font-medium">
              {describeUsageError(error)}
              {status}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs break-words">{message}</TooltipContent>
      </Tooltip>
      {onRetry && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={onRetry}
          disabled={retrying}
          aria-label="Retry"
        >
          <RotateCcwIcon className={cn(retrying && 'animate-spin')} />
        </Button>
      )}
    </div>
  )
}
