import { toast } from 'sonner'

import { getErrorMessage } from '@/components/shared'
import { Switch } from '@/components/ui/switch'

import { useUpdateMonitor } from '../api'
import type { Monitor } from '../types'

/** Active/paused switch backed by `PATCH /v2/monitor/:id { status }`. */
export function MonitorStatusToggle({ monitor, showLabel }: { monitor: Pick<Monitor, 'id' | 'name' | 'status'>; showLabel?: boolean }) {
  const update = useUpdateMonitor()
  const pendingStatus = update.isPending ? update.variables?.body.status : undefined
  const checked = (pendingStatus ?? monitor.status) === 'active'

  return (
    <label className="inline-flex items-center gap-2">
      <Switch
        checked={checked}
        disabled={update.isPending}
        aria-label={checked ? `Pause ${monitor.name}` : `Resume ${monitor.name}`}
        onCheckedChange={v =>
          update.mutate(
            { id: monitor.id, body: { status: v ? 'active' : 'paused' } },
            {
              onSuccess: () => toast.success(v ? 'Monitor resumed' : 'Monitor paused'),
              onError: err => toast.error(getErrorMessage(err)),
            },
          )
        }
      />
      {showLabel && <span className="text-sm">{checked ? 'Enabled' : 'Paused'}</span>}
    </label>
  )
}
