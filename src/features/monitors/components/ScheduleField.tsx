import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import type { MonitorFormState, ScheduleMode } from '../form-state'
import { SCHEDULE_PRESETS, SCHEDULE_TEXT_EXAMPLES, describeCron, timezoneOptions } from '../schedule'

interface ScheduleFieldProps {
  state: MonitorFormState
  onChange: (patch: Partial<MonitorFormState>) => void
}

export function ScheduleField({ state, onChange }: ScheduleFieldProps) {
  const zones = React.useMemo(() => timezoneOptions(), [])
  const zoneListId = React.useId()
  const preset = SCHEDULE_PRESETS.find(p => p.text === state.preset)

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={state.scheduleMode}
        onValueChange={v => v && onChange({ scheduleMode: v as ScheduleMode })}
      >
        <ToggleGroupItem value="preset" className="px-3 text-xs">
          Preset
        </ToggleGroupItem>
        <ToggleGroupItem value="text" className="px-3 text-xs">
          Plain English
        </ToggleGroupItem>
        <ToggleGroupItem value="cron" className="px-3 text-xs">
          Cron
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="grid gap-4 sm:grid-cols-2">
        {state.scheduleMode === 'preset' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Frequency</Label>
            <Select value={state.preset} onValueChange={v => onChange({ preset: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_PRESETS.map(p => (
                  <SelectItem key={p.text} value={p.text}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {preset && <p className="text-muted-foreground font-mono text-xs">cron: {preset.cron}</p>}
          </div>
        )}
        {state.scheduleMode === 'text' && (
          <div className="space-y-1.5">
            <Label htmlFor="schedule-text" className="text-xs">
              Schedule
            </Label>
            <Input
              id="schedule-text"
              value={state.scheduleText}
              maxLength={128}
              placeholder="every 30 minutes"
              onChange={e => onChange({ scheduleText: e.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              e.g. {SCHEDULE_TEXT_EXAMPLES.map(t => `“${t}”`).join(', ')}. Validated by the server.
            </p>
          </div>
        )}
        {state.scheduleMode === 'cron' && (
          <div className="space-y-1.5">
            <Label htmlFor="schedule-cron" className="text-xs">
              Cron expression
            </Label>
            <Input
              id="schedule-cron"
              value={state.cron}
              maxLength={128}
              placeholder="*/30 * * * *"
              className="font-mono"
              onChange={e => onChange({ cron: e.target.value })}
            />
            <p className="text-muted-foreground text-xs">
              {state.cron.trim() ? describeCron(state.cron) : 'minute hour day-of-month month day-of-week'}
            </p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="schedule-tz" className="text-xs">
            Timezone
          </Label>
          <Input
            id="schedule-tz"
            list={zoneListId}
            value={state.timezone}
            placeholder="UTC"
            onChange={e => onChange({ timezone: e.target.value })}
          />
          <datalist id={zoneListId}>
            {zones.map(z => (
              <option key={z} value={z} />
            ))}
          </datalist>
          <p className="text-muted-foreground text-xs">IANA name, e.g. UTC, Europe/Berlin, America/New_York.</p>
        </div>
      </div>
    </div>
  )
}
