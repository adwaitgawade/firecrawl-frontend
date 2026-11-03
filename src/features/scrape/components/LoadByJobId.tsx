import * as React from 'react'
import { HashIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface LoadByJobIdProps {
  onLoad: (jobId: string) => void
  loading?: boolean
}

/** Small popover to fetch a past scrape via `GET /v2/scrape/:jobId`. */
export function LoadByJobId({ onLoad, loading }: LoadByJobIdProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const trimmed = value.trim()
  const valid = UUID_RE.test(trimmed)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    onLoad(trimmed)
    setOpen(false)
    setValue('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          {loading ? <Loader2Icon className="animate-spin" /> : <HashIcon />}
          Load by job ID
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form onSubmit={submit} className="space-y-2">
          <div>
            <p className="text-sm font-medium">Load a past scrape</p>
            <p className="text-muted-foreground text-xs">
              Fetches <code>GET /v2/scrape/:jobId</code> (the <code>metadata.scrapeId</code> of a previous scrape).
            </p>
          </div>
          <Input
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="019a2c4e-…"
            className="font-mono text-xs"
            aria-invalid={(trimmed !== '' && !valid) || undefined}
          />
          {trimmed !== '' && !valid && <p className="text-destructive text-xs">Job IDs are UUIDs.</p>}
          <Button type="submit" size="sm" className="w-full" disabled={!valid}>
            Load
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )
}
