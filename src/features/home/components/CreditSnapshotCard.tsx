import { Link } from 'react-router'
import { ArrowRightIcon, InfoIcon, WalletIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreditUsage } from '@/features/usage/api'
import { Meter } from '@/features/usage/components/Meter'
import { daysUntil, describeUsageError, ratioOf } from '@/features/usage/lib'
import { isFirecrawlApiError } from '@/lib/api/client'
import { formatNumber } from '@/lib/utils'

function Unavailable({ error }: { error: unknown }) {
  const unreachable = isFirecrawlApiError(error) && error.status === 0
  return (
    <div className="text-muted-foreground flex items-start gap-2 text-sm">
      <InfoIcon className="mt-0.5 size-4 shrink-0" />
      <p>
        <span className="text-foreground font-medium">{describeUsageError(error)}.</span>{' '}
        {unreachable ? (
          <>
            Check the API URL in{' '}
            <Link to="/settings" className="text-primary underline-offset-4 hover:underline">
              Settings
            </Link>
            .
          </>
        ) : (
          'Self-hosted deployments usually don’t track credits — everything else still works.'
        )}
      </p>
    </div>
  )
}

/** Remaining-credits snapshot; degrades to a neutral notice when billing isn't available. */
export function CreditSnapshotCard() {
  const q = useCreditUsage()
  const d = q.data
  const ratio = ratioOf(d?.remainingCredits, d?.planCredits)
  const left = daysUntil(d?.billingPeriodEnd)

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Credits</CardTitle>
        <CardDescription>Current billing period</CardDescription>
        <CardAction>
          <WalletIcon className="text-muted-foreground size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {q.isPending ? (
          <>
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-1.5 w-full" />
            <Skeleton className="h-3 w-40" />
          </>
        ) : q.isError ? (
          <Unavailable error={q.error} />
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span
                className={
                  d && d.remainingCredits < 0
                    ? 'text-destructive text-3xl font-semibold tabular-nums'
                    : 'text-3xl font-semibold tabular-nums'
                }
              >
                {formatNumber(d?.remainingCredits)}
              </span>
              <span className="text-muted-foreground text-sm">remaining</span>
            </div>
            {ratio != null && <Meter ratio={1 - ratio} label="Credits used this period" />}
            <p className="text-muted-foreground text-xs">
              {d && d.planCredits > 0 ? `${formatNumber(d.planCredits)} plan credits` : 'No plan credits reported'}
              {left != null && left > 0 && ` · resets in ${left} day${left === 1 ? '' : 's'}`}
            </p>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/usage">
            View usage <ArrowRightIcon />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
