import * as React from 'react'
import { ChevronDownIcon, EraserIcon, Loader2Icon, PlayIcon, SquareIcon } from 'lucide-react'

import { RequestPreview, getErrorMessage } from '@/components/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { isFirecrawlApiError } from '@/lib/api/client'

import { executeCode } from '../api'
import { LANGUAGE_META, TEMPLATES } from '../templates'
import type { BrowserExecuteRequest, BrowserLanguage, ExecutionEntry } from '../types'
import { ExecutionLog } from './ExecutionLog'

const LANGUAGES: BrowserLanguage[] = ['node', 'python', 'bash']
const MAX_HISTORY = 100

function historyKey(sessionId: string) {
  return `firecrawl.browser.history.${sessionId}`
}

function loadHistory(sessionId: string): ExecutionEntry[] {
  try {
    const raw = sessionStorage.getItem(historyKey(sessionId))
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    // Drop entries that were still running when the page unloaded.
    return Array.isArray(parsed) ? (parsed as ExecutionEntry[]).filter(e => e.status !== 'running') : []
  } catch {
    return []
  }
}

function newId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

export function ExecuteConsole({ sessionId, disabled }: { sessionId: string; disabled?: boolean }) {
  const [language, setLanguage] = React.useState<BrowserLanguage>('node')
  const [codeByLang, setCodeByLang] = React.useState<Record<BrowserLanguage, string>>(() => ({
    node: TEMPLATES.node[0].code,
    python: TEMPLATES.python[0].code,
    bash: TEMPLATES.bash[0].code,
  }))
  const [timeout, setTimeoutValue] = React.useState('30')
  const [history, setHistory] = React.useState<ExecutionEntry[]>(() => loadHistory(sessionId))
  const abortRef = React.useRef<AbortController | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    try {
      sessionStorage.setItem(historyKey(sessionId), JSON.stringify(history.slice(-MAX_HISTORY)))
    } catch {
      // storage full / unavailable — history is still kept in memory
    }
  }, [history, sessionId])

  const code = codeByLang[language]
  const timeoutNum = Number(timeout)
  const timeoutError = !Number.isFinite(timeoutNum) || timeoutNum < 1 || timeoutNum > 300 ? 'Timeout must be 1–300 s' : null
  const running = history.some(e => e.status === 'running')
  const body: BrowserExecuteRequest = { code, language, ...(timeoutNum !== 30 && !timeoutError ? { timeout: timeoutNum } : {}) }
  const canRun = !disabled && !running && !timeoutError && code.trim().length > 0 && code.length <= 100_000

  const setCode = (value: string) => setCodeByLang(prev => ({ ...prev, [language]: value }))

  const run = async () => {
    if (!canRun) return
    const entry: ExecutionEntry = {
      id: newId(),
      language,
      code,
      timeout: timeoutNum,
      startedAt: Date.now(),
      status: 'running',
    }
    const update = (patch: Partial<ExecutionEntry>) =>
      setHistory(h => h.map(e => (e.id === entry.id ? { ...e, ...patch } : e)))
    setHistory(h => [...h, entry].slice(-MAX_HISTORY))
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const response = await executeCode(sessionId, body, controller.signal)
      update({ status: 'done', response, durationMs: Date.now() - entry.startedAt })
    } catch (error) {
      update({
        status: 'error',
        error: isFirecrawlApiError(error)
          ? `${error.status ? `HTTP ${error.status}: ` : ''}${error.message}`
          : getErrorMessage(error),
        durationMs: Date.now() - entry.startedAt,
      })
    } finally {
      abortRef.current = null
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void run()
      return
    }
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      const el = e.currentTarget
      const { selectionStart, selectionEnd, value } = el
      const next = `${value.slice(0, selectionStart)}  ${value.slice(selectionEnd)}`
      setCode(next)
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + 2
      })
    }
  }

  const onReuse = (entry: ExecutionEntry) => {
    setLanguage(entry.language)
    setCodeByLang(prev => ({ ...prev, [entry.language]: entry.code }))
    textareaRef.current?.focus()
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Language</Label>
            <Select value={language} onValueChange={v => setLanguage(v as BrowserLanguage)}>
              <SelectTrigger size="sm" className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l} value={l}>
                    {LANGUAGE_META[l].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exec-timeout" className="text-xs">
              Timeout (s)
            </Label>
            <Input
              id="exec-timeout"
              type="number"
              min={1}
              max={300}
              value={timeout}
              aria-invalid={!!timeoutError || undefined}
              onChange={e => setTimeoutValue(e.target.value)}
              className="h-8 w-24"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Templates <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>{LANGUAGE_META[language].label}</DropdownMenuLabel>
              {TEMPLATES[language].map(t => (
                <DropdownMenuItem key={t.label} onSelect={() => setCode(t.code)}>
                  {t.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-muted-foreground text-xs">{LANGUAGE_META[language].hint}</p>

        <Textarea
          ref={textareaRef}
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          rows={14}
          className="min-h-72 resize-y bg-zinc-950 font-mono text-xs leading-relaxed text-zinc-100 dark:bg-zinc-950"
          placeholder={language === 'bash' ? 'agent-browser snapshot -i' : 'await page.goto("https://example.com")'}
          aria-label="Code to execute"
        />

        {timeoutError && <p className="text-destructive text-xs">{timeoutError}</p>}
        {disabled && (
          <Alert variant="warning">
            <AlertDescription>This session is no longer active, so code can&apos;t be executed.</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {running ? (
            <Button variant="outline" onClick={() => abortRef.current?.abort()}>
              <SquareIcon /> Stop waiting
            </Button>
          ) : (
            <Button onClick={() => void run()} disabled={!canRun}>
              <PlayIcon /> Run
            </Button>
          )}
          {running && <Loader2Icon className="text-primary size-4 animate-spin" />}
          <span className="text-muted-foreground hidden text-xs sm:inline">⌘/Ctrl + Enter to run</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            disabled={history.length === 0 || running}
            onClick={() => setHistory([])}
          >
            <EraserIcon /> Clear log
          </Button>
        </div>

        <RequestPreview method="POST" path={`/browser/${sessionId}/execute`} body={body} />
      </div>

      <ExecutionLog entries={history} onReuse={onReuse} className="h-[32rem] xl:h-auto xl:max-h-[44rem] xl:min-h-[32rem]" />
    </div>
  )
}
