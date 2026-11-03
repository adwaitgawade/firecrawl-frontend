import * as React from 'react'
import { Loader2Icon, PlusIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { ErrorAlert, RequestPreview } from '@/components/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { addJob } from '@/lib/job-history'

import { useCreateSession } from '../api'
import type { BrowserCreateRequest } from '../types'

interface FormState {
  ttl: string
  activityTtl: string
  streamWebView: boolean
  recordSession: boolean
  profileName: string
  saveChanges: boolean
}

const DEFAULTS: FormState = {
  ttl: '600',
  activityTtl: '300',
  streamWebView: true,
  recordSession: true,
  profileName: '',
  saveChanges: true,
}

function rangeError(value: string, min: number, max: number): string | null {
  if (value.trim() === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max) return `Must be between ${min} and ${max}`
  return null
}

function toBody(form: FormState): BrowserCreateRequest {
  const body: BrowserCreateRequest = {}
  if (form.ttl.trim() && Number(form.ttl) !== 600) body.ttl = Number(form.ttl)
  if (form.activityTtl.trim() && Number(form.activityTtl) !== 300) body.activityTtl = Number(form.activityTtl)
  if (!form.streamWebView) body.streamWebView = false
  if (!form.recordSession) body.recordSession = false
  if (form.profileName.trim()) {
    body.profile = { name: form.profileName.trim() }
    if (!form.saveChanges) body.profile.saveChanges = false
  }
  return body
}

function SwitchRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function NewSessionDialog({ trigger }: { trigger?: React.ReactNode }) {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(DEFAULTS)
  const create = useCreateSession()
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  const ttlError = rangeError(form.ttl, 30, 3600)
  const activityError = rangeError(form.activityTtl, 10, 3600)
  const profileError = form.profileName.trim().length > 128 ? 'Max 128 characters' : null
  const body = toBody(form)
  const invalid = !!(ttlError || activityError || profileError)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (invalid) return
    create.mutate(body, {
      onSuccess: data => {
        addJob({ kind: 'browser', id: data.id, label: body.profile?.name ?? 'Browser session', status: 'active' })
        toast.success('Browser session created')
        setOpen(false)
        setForm(DEFAULTS)
        create.reset()
        navigate(`/browser/${data.id}`)
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        setOpen(v)
        if (!v) create.reset()
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon /> New session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New browser session</DialogTitle>
            <DialogDescription>
              Launches a remote Chromium you can drive with code or CDP. Billed by session duration.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ttl">Session TTL (s)</Label>
              <Input
                id="ttl"
                type="number"
                min={30}
                max={3600}
                value={form.ttl}
                aria-invalid={!!ttlError || undefined}
                onChange={e => set('ttl', e.target.value)}
              />
              <p className={ttlError ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>
                {ttlError ?? 'Max lifetime, 30–3600 (default 600)'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity-ttl">Idle timeout (s)</Label>
              <Input
                id="activity-ttl"
                type="number"
                min={10}
                max={3600}
                value={form.activityTtl}
                aria-invalid={!!activityError || undefined}
                onChange={e => set('activityTtl', e.target.value)}
              />
              <p className={activityError ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>
                {activityError ?? 'Destroy after inactivity, 10–3600 (default 300)'}
              </p>
            </div>
          </div>

          <SwitchRow
            id="stream-web-view"
            label="Stream live view"
            hint="Expose an embeddable live view of the browser."
            checked={form.streamWebView}
            onCheckedChange={v => set('streamWebView', v)}
          />
          <SwitchRow
            id="record-session"
            label="Record session"
            hint="Keep a video replay of each tab after the session ends."
            checked={form.recordSession}
            onCheckedChange={v => set('recordSession', v)}
          />

          <Separator />

          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Profile (optional)</Label>
            <Input
              id="profile-name"
              placeholder="e.g. my-logged-in-profile"
              value={form.profileName}
              aria-invalid={!!profileError || undefined}
              onChange={e => set('profileName', e.target.value)}
            />
            <p className={profileError ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>
              {profileError ?? 'Persist cookies and storage across sessions under this name.'}
            </p>
          </div>
          {form.profileName.trim() && (
            <SwitchRow
              id="profile-save"
              label="Save profile changes"
              hint="Write cookies/storage back to the profile when the session ends."
              checked={form.saveChanges}
              onCheckedChange={v => set('saveChanges', v)}
            />
          )}

          <RequestPreview method="POST" path="/browser" body={body} />

          {create.isError && <ErrorAlert error={create.error} title="Could not create session" />}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={invalid || create.isPending}>
              {create.isPending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
              Create session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
