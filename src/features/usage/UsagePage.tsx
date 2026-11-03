import * as React from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { ChartColumnIcon, RefreshCwIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import { LIVE_REFRESH_MS, usageKeys } from './api'
import { ActivityCard } from './components/ActivityCard'
import { BillingCards } from './components/BillingCards'
import { HistoricalUsageCard } from './components/HistoricalUsageCard'
import { LiveCards } from './components/LiveCards'

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{children}</h2>
      {aside}
    </div>
  )
}

export function UsagePage() {
  const queryClient = useQueryClient()
  const fetching = useIsFetching({ queryKey: usageKeys.all }) > 0
  const [autoRefresh, setAutoRefresh] = React.useState(true)
  const switchId = React.useId()

  const refreshAll = () => queryClient.invalidateQueries({ queryKey: usageKeys.all })

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ChartColumnIcon}
        title="Usage"
        description="Credits, tokens, concurrency and recent activity for your team."
        actions={
          <>
            <div className="flex items-center gap-2">
              <Switch id={switchId} checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <Label htmlFor={switchId} className="text-sm font-normal">
                Auto-refresh ({LIVE_REFRESH_MS / 1000}s)
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={fetching}>
              <RefreshCwIcon className={cn(fetching && 'animate-spin')} />
              Refresh
            </Button>
          </>
        }
      />

      <section className="space-y-3">
        <SectionTitle>Balance</SectionTitle>
        <BillingCards />
      </section>

      <section className="space-y-3">
        <SectionTitle>Live</SectionTitle>
        <LiveCards autoRefresh={autoRefresh} />
      </section>

      <HistoricalUsageCard />

      <ActivityCard />
    </div>
  )
}
