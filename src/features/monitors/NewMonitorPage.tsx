import * as React from 'react'
import { ArrowLeftIcon, RadarIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'

import { useCreateMonitor } from './api'
import { MonitorForm } from './components/MonitorForm'
import { emptyFormState } from './form-state'

export function NewMonitorPage() {
  const navigate = useNavigate()
  const create = useCreateMonitor()
  const [initial] = React.useState(emptyFormState)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/monitors">
            <ArrowLeftIcon /> All monitors
          </Link>
        </Button>
        <PageHeader
          icon={RadarIcon}
          title="New monitor"
          description="Watch pages, sites or searches on a schedule and get notified when something meaningful changes."
        />
      </div>
      <MonitorForm
        mode="create"
        initial={initial}
        pending={create.isPending}
        error={create.error}
        onCancel={() => navigate('/monitors')}
        onSubmit={body =>
          create.mutate(body, {
            onSuccess: res => {
              toast.success(`Monitor “${res.data.name}” created`)
              navigate(`/monitors/${res.data.id}`)
            },
          })
        }
      />
    </div>
  )
}
