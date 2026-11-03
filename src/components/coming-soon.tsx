import { ConstructionIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'

/** Placeholder page used by feature route stubs until the feature is implemented. */
export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState icon={ConstructionIcon} title="Coming soon" description="This screen is under construction." />
    </div>
  )
}
