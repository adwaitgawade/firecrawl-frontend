import { hasApiKey, useSettings } from '@/lib/config'
import { useJobHistory } from '@/lib/job-history'

import { CreditSnapshotCard } from './components/CreditSnapshotCard'
import { FeatureGrid } from './components/FeatureGrid'
import { GettingStarted } from './components/GettingStarted'
import { HomeHero } from './components/HomeHero'
import { RecentJobs } from './components/RecentJobs'

export function HomePage() {
  const settings = useSettings()
  const jobs = useJobHistory()
  const configured = hasApiKey(settings)

  return (
    <div className="space-y-6">
      <HomeHero />

      {!configured && <GettingStarted apiUrl={settings.apiUrl} hasRunJob={jobs.length > 0} />}

      <FeatureGrid />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentJobs />
        </div>
        <CreditSnapshotCard />
      </div>
    </div>
  )
}
