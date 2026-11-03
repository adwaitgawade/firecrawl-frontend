import { CalendarRangeIcon, CoinsIcon, SparklesIcon, WalletIcon } from 'lucide-react'

import { formatDate, formatNumber } from '@/lib/utils'

import { useCreditUsage, useTokenUsage } from '../api'
import { daysUntil, ratioOf } from '../lib'
import { MetricCard } from './MetricCard'
import { Meter } from './Meter'

function RemainingCreditsCard() {
  const q = useCreditUsage()
  const d = q.data
  const ratio = ratioOf(d?.remainingCredits, d?.planCredits)
  const overage = d ? d.remainingCredits < 0 : false
  return (
    <MetricCard
      label="Remaining credits"
      icon={WalletIcon}
      loading={q.isPending}
      error={q.error}
      onRetry={() => q.refetch()}
      retrying={q.isFetching}
      value={<span className={overage ? 'text-destructive' : undefined}>{formatNumber(d?.remainingCredits)}</span>}
      caption={
        overage
          ? 'In overage for this billing period'
          : ratio != null
            ? `${formatNumber(Math.max(0, 1 - ratio), { style: 'percent', maximumFractionDigits: 0 })} of plan credits used`
            : 'This billing period'
      }
    >
      {ratio != null && (
        // The meter fills with *usage* so it turns warning → destructive as credits run out.
        <Meter ratio={1 - ratio} label="Credits used this period" className="mt-1" />
      )}
    </MetricCard>
  )
}

function PlanCreditsCard() {
  const q = useCreditUsage()
  const d = q.data
  const used = d ? Math.max(0, d.planCredits - d.remainingCredits) : null
  return (
    <MetricCard
      label="Plan credits"
      icon={CoinsIcon}
      loading={q.isPending}
      error={q.error}
      onRetry={() => q.refetch()}
      retrying={q.isFetching}
      value={formatNumber(d?.planCredits)}
      caption={used != null && d && d.planCredits > 0 ? `${formatNumber(used)} used so far` : 'Included in your plan'}
    />
  )
}

function TokensCard() {
  const q = useTokenUsage()
  const d = q.data
  const ratio = ratioOf(d?.remainingTokens, d?.planTokens)
  return (
    <MetricCard
      label="Tokens remaining"
      icon={SparklesIcon}
      loading={q.isPending}
      error={q.error}
      onRetry={() => q.refetch()}
      retrying={q.isFetching}
      value={formatNumber(d?.remainingTokens, { notation: 'compact', maximumFractionDigits: 1 })}
      caption={
        d ? `of ${formatNumber(d.planTokens, { notation: 'compact', maximumFractionDigits: 1 })} plan tokens` : undefined
      }
    >
      {ratio != null && <Meter ratio={1 - ratio} label="Tokens used this period" className="mt-1" />}
    </MetricCard>
  )
}

function BillingPeriodCard() {
  const q = useCreditUsage()
  const d = q.data
  const left = daysUntil(d?.billingPeriodEnd)
  const hasPeriod = Boolean(d?.billingPeriodStart || d?.billingPeriodEnd)
  return (
    <MetricCard
      label="Billing period"
      icon={CalendarRangeIcon}
      loading={q.isPending}
      error={q.error}
      onRetry={() => q.refetch()}
      retrying={q.isFetching}
      value={
        hasPeriod ? (
          <span className="text-lg">
            {formatDate(d?.billingPeriodStart, 'MMM d')} – {formatDate(d?.billingPeriodEnd, 'MMM d, yyyy')}
          </span>
        ) : (
          <span className="text-muted-foreground text-lg">No billing period</span>
        )
      }
      caption={
        left == null
          ? hasPeriod
            ? 'Open-ended period'
            : 'Not reported by this deployment'
          : left > 0
            ? `Resets in ${left} day${left === 1 ? '' : 's'}`
            : 'Period ended'
      }
    />
  )
}

/** Credit / token balance tiles (credit-usage + token-usage endpoints), each failing independently. */
export function BillingCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <RemainingCreditsCard />
      <PlanCreditsCard />
      <TokensCard />
      <BillingPeriodCard />
    </div>
  )
}
