import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

import { isUuid } from '../request'
import type { BatchFormState } from '../types'
import { WebhookEditor } from './WebhookEditor'

interface BatchOptionsCardProps {
  value: BatchFormState
  onChange: (value: BatchFormState) => void
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/** Batch-only request fields: ignoreInvalidURLs, maxConcurrency, zeroDataRetention, appendToId, webhook. */
export function BatchOptionsCard({ value, onChange }: BatchOptionsCardProps) {
  const appendInvalid = value.appendToId.trim() !== '' && !isUuid(value.appendToId)
  const concurrencyInvalid = value.maxConcurrency !== undefined && !(value.maxConcurrency >= 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Batch options</CardTitle>
        <CardDescription>Settings that apply to the whole job.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleRow
          id="batch-ignore-invalid"
          label="Ignore invalid URLs"
          hint="Skip invalid or blocked URLs instead of failing the whole request. Skipped URLs are reported back."
          checked={value.ignoreInvalidURLs}
          onChange={ignoreInvalidURLs => onChange({ ...value, ignoreInvalidURLs })}
        />
        <ToggleRow
          id="batch-zdr"
          label="Zero data retention"
          hint="Don't persist results beyond delivery (must be enabled for your team)."
          checked={value.zeroDataRetention}
          onChange={zeroDataRetention => onChange({ ...value, zeroDataRetention })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="batch-concurrency">Max concurrency</Label>
            <Input
              id="batch-concurrency"
              type="number"
              min={1}
              step={1}
              placeholder="Team default"
              value={value.maxConcurrency ?? ''}
              aria-invalid={concurrencyInvalid || undefined}
              onChange={e =>
                onChange({
                  ...value,
                  maxConcurrency: e.target.value === '' ? undefined : e.target.valueAsNumber,
                })
              }
            />
            <p className="text-muted-foreground text-xs">Cap on pages scraped in parallel for this job.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch-append">Append to job</Label>
            <Input
              id="batch-append"
              placeholder="Existing batch ID (optional)"
              className="font-mono text-xs"
              value={value.appendToId}
              aria-invalid={appendInvalid || undefined}
              onChange={e => onChange({ ...value, appendToId: e.target.value })}
            />
            <p className={appendInvalid ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>
              {appendInvalid ? 'Must be a batch job UUID.' : 'Add these URLs to an existing batch.'}
            </p>
          </div>
        </div>
        <Separator />
        <WebhookEditor value={value.webhook} onChange={webhook => onChange({ ...value, webhook })} />
      </CardContent>
    </Card>
  )
}
