import { CoinsIcon, HashIcon, TimerIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared/CopyButton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { formatDuration, formatNumber } from '@/lib/utils'

import { totalResults } from '../result-utils'
import type { TimedSearchResponse } from '../types'

/** Result count, credits, request id, duration and warning for a search response. */
export function SearchMeta({ response }: { response: TimedSearchResponse }) {
  const total = totalResults(response.data)
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="text-foreground text-sm font-medium">
          {formatNumber(total)} result{total === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1">
          <CoinsIcon className="size-3.5" /> {formatNumber(response.creditsUsed)} credit{response.creditsUsed === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-1">
          <TimerIcon className="size-3.5" /> {formatDuration(response.durationMs)}
        </span>
        {response.id && (
          <span className="flex items-center gap-1">
            <HashIcon className="size-3.5" />
            <code className="font-mono">{response.id}</code>
            <CopyButton value={response.id} size="icon-sm" className="size-6" toastMessage="Search ID copied" />
          </span>
        )}
      </div>
      {response.warning && (
        <Alert variant="warning">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{response.warning}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
