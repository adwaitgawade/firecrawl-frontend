import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { ExternalLinkIcon, Loader2Icon, MousePointerClickIcon, PlayIcon, PowerIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { RequestPreview } from '@/components/shared/RequestPreview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

import { interact, interactPath, serializeError, stopInteract } from '../api'
import { appendInteractLog, clearInteractLog, newId, useInteractLog } from '../store'
import type { InteractLanguage, InteractLogEntry, InteractRequest } from '../types'
import { InteractLog } from './InteractLog'

interface InteractSheetProps {
  scrapeId?: string
  url?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Mode = 'prompt' | 'code'

const CODE_PLACEHOLDER: Record<InteractLanguage, string> = {
  node: "// `page` is the browser page of the replayed scrape\nconsole.log(await page.url())\nconsole.log(await page.title())",
  python: '# `page` is the browser page of the replayed scrape\nprint(await page.url())',
  bash: 'echo "hello from the browser sandbox"',
}

/** Latest session info (from the most recent exec), or undefined once the session was ended. */
function sessionInfo(entries: InteractLogEntry[]) {
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i]
    if (e.kind === 'stop') {
      if (!e.error) return undefined
      continue
    }
    if (e.response?.sessionId) return e.response
  }
  return undefined
}

/** Drawer for `POST/DELETE /v2/scrape/:jobId/interact`. */
export function InteractSheet({ scrapeId, url, open, onOpenChange }: InteractSheetProps) {
  const entries = useInteractLog(scrapeId)
  const [mode, setMode] = React.useState<Mode>('prompt')
  const [prompt, setPrompt] = React.useState('')
  const [code, setCode] = React.useState('')
  const [language, setLanguage] = React.useState<InteractLanguage>('node')
  const [timeout, setTimeoutSec] = React.useState(30)

  const session = sessionInfo(entries)

  const body: InteractRequest =
    mode === 'prompt'
      ? { prompt: prompt.trim(), ...(timeout !== 30 ? { timeout } : {}) }
      : { code, language, ...(timeout !== 30 ? { timeout } : {}) }
  const canRun =
    !!scrapeId &&
    timeout >= 1 &&
    timeout <= 300 &&
    (mode === 'prompt' ? prompt.trim().length > 0 && prompt.length <= 10_000 : code.trim().length > 0)

  const exec = useMutation({
    mutationFn: async (vars: { jobId: string; body: InteractRequest }) => {
      const started = performance.now()
      try {
        const response = await interact(vars.jobId, vars.body)
        return { response, durationMs: Math.round(performance.now() - started) }
      } catch (error) {
        throw Object.assign(new Error('interact failed'), {
          cause: error,
          durationMs: Math.round(performance.now() - started),
        })
      }
    },
    onSuccess: ({ response, durationMs }, { jobId, body: req }) => {
      appendInteractLog(jobId, { id: newId(), kind: 'exec', at: new Date().toISOString(), request: req, durationMs, response })
    },
    onError: (err, { jobId, body: req }) => {
      const e = err as Error & { cause?: unknown; durationMs?: number }
      appendInteractLog(jobId, {
        id: newId(),
        kind: 'exec',
        at: new Date().toISOString(),
        request: req,
        durationMs: e.durationMs ?? 0,
        error: serializeError(e.cause ?? e),
      })
    },
  })

  const stop = useMutation({
    mutationFn: (jobId: string) => stopInteract(jobId),
    onSuccess: (response, jobId) => {
      appendInteractLog(jobId, { id: newId(), kind: 'stop', at: new Date().toISOString(), response })
      toast.success('Browser session ended')
    },
    onError: (error, jobId) => {
      appendInteractLog(jobId, { id: newId(), kind: 'stop', at: new Date().toISOString(), error: serializeError(error) })
    },
  })

  const run = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canRun || !scrapeId || exec.isPending) return
    exec.mutate({ jobId: scrapeId, body })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <MousePointerClickIcon className="text-primary size-4" /> Interact with page
          </SheetTitle>
          <SheetDescription className="truncate font-mono text-xs">{url ?? scrapeId}</SheetDescription>
          {session && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <Badge variant="success">session active</Badge>
              {session.interactiveLiveViewUrl && (
                <a className="text-primary inline-flex items-center gap-1 hover:underline" href={session.interactiveLiveViewUrl} target="_blank" rel="noreferrer">
                  Interactive live view <ExternalLinkIcon className="size-3" />
                </a>
              )}
              {session.liveViewUrl && (
                <a className="text-primary inline-flex items-center gap-1 hover:underline" href={session.liveViewUrl} target="_blank" rel="noreferrer">
                  Live view <ExternalLinkIcon className="size-3" />
                </a>
              )}
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-4">
            <form onSubmit={run} className="space-y-3">
              <Tabs value={mode} onValueChange={v => setMode(v as Mode)}>
                <TabsList>
                  <TabsTrigger value="prompt">Prompt</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>
              </Tabs>
              {mode === 'prompt' ? (
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={4}
                  maxLength={10_000}
                  placeholder="Click the 'Pricing' link and tell me the price of the Pro plan"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run()
                  }}
                />
              ) : (
                <Textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  rows={7}
                  spellCheck={false}
                  className="font-mono text-xs"
                  placeholder={CODE_PLACEHOLDER[language]}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run()
                  }}
                />
              )}
              <div className="flex flex-wrap items-end gap-3">
                {mode === 'code' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Language</Label>
                    <Select value={language} onValueChange={v => setLanguage(v as InteractLanguage)}>
                      <SelectTrigger size="sm" className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="node">Node</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="bash">Bash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="interact-timeout" className="text-xs">
                    Timeout (s)
                  </Label>
                  <Input
                    id="interact-timeout"
                    type="number"
                    min={1}
                    max={300}
                    value={Number.isFinite(timeout) ? timeout : ''}
                    onChange={e => setTimeoutSec(e.target.valueAsNumber)}
                    className="h-8 w-24"
                  />
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!scrapeId || stop.isPending}
                    onClick={() => scrapeId && stop.mutate(scrapeId)}
                  >
                    {stop.isPending ? <Loader2Icon className="animate-spin" /> : <PowerIcon />}
                    End session
                  </Button>
                  <Button type="submit" size="sm" disabled={!canRun || exec.isPending}>
                    {exec.isPending ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
                    {exec.isPending ? 'Running…' : 'Run'}
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                Sessions are billed by duration until ended (or until they time out from inactivity). ⌘/Ctrl + Enter to run.
              </p>
            </form>

            {scrapeId && <RequestPreview method="POST" path={interactPath(scrapeId)} body={body} />}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Output log</h4>
                {entries.length > 0 && scrapeId && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => clearInteractLog(scrapeId)}>
                    <Trash2Icon /> Clear
                  </Button>
                )}
              </div>
              {exec.isPending && (
                <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-3 text-xs">
                  <Loader2Icon className="size-4 animate-spin" />
                  {entries.length === 0 ? 'Starting browser session and replaying the scrape…' : 'Executing…'}
                </div>
              )}
              <InteractLog entries={entries} />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
