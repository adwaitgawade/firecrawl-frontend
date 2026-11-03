import * as React from 'react'
import { FlameIcon, Undo2Icon } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { RequestPreview } from '@/components/shared/RequestPreview'
import { parseJson, validateFormats } from '@/components/shared/scrape-options'
import { Button } from '@/components/ui/button'
import { isValidUrl } from '@/lib/utils'

import { InteractSheet } from './components/InteractSheet'
import { LoadByJobId } from './components/LoadByJobId'
import { ScrapeHistory } from './components/ScrapeHistory'
import { ScrapeRequestCard, type ScrapeTab } from './components/ScrapeRequestCard'
import { ScrapeResultPanel } from './components/ScrapeResultPanel'
import { bodyToFormState, buildScrapeBody, initialFormState, isPlainObject } from './request'
import { clearRuns, removeRun, useScrapeRuns } from './store'
import { scrapeIdOf, useScrapeRunner } from './use-scrape-runner'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateJsonBody(text: string): { body?: Record<string, unknown>; error?: string } {
  const { value, error } = parseJson(text)
  if (error) return { error }
  if (!isPlainObject(value)) return { error: 'The body must be a JSON object.' }
  if (typeof value.url !== 'string' || !value.url.trim()) return { error: 'The body needs a "url" string.' }
  return { body: value }
}

export function ScrapePage() {
  const [searchParams] = useSearchParams()
  const paramUrl = searchParams.get('url')
  const paramJobId = searchParams.get('jobId')
  const runs = useScrapeRuns()

  const [form, setForm] = React.useState(() => initialFormState(paramUrl ?? ''))
  const [tab, setTab] = React.useState<ScrapeTab>('formats')
  const [jsonText, setJsonText] = React.useState('')
  const [selectedId, setSelectedId] = React.useState<string | undefined>(() => runs[0]?.id)
  const [interactId, setInteractId] = React.useState<string>()
  const [interactOpen, setInteractOpen] = React.useState(false)

  // Prefill from `?url=` when it changes while mounted (deep links from other pages).
  const [prevParamUrl, setPrevParamUrl] = React.useState(paramUrl)
  if (paramUrl !== prevParamUrl) {
    setPrevParamUrl(paramUrl)
    if (paramUrl) {
      setForm(f => ({ ...f, url: paramUrl }))
      setTab(t => (t === 'json' ? 'formats' : t))
    }
  }

  const { run, lookup, cancel, isRunning, isLookingUp } = useScrapeRunner(setSelectedId)

  // `?jobId=` deep link → load that scrape once.
  const lookedUp = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!paramJobId || !UUID_RE.test(paramJobId) || lookedUp.current === paramJobId) return
    lookedUp.current = paramJobId
    lookup(paramJobId)
  }, [paramJobId, lookup])

  const formBody = React.useMemo(() => buildScrapeBody(form), [form])
  const json = React.useMemo(() => (tab === 'json' ? validateJsonBody(jsonText) : undefined), [tab, jsonText])
  const body = tab === 'json' ? json?.body : formBody

  const formatErrors = React.useMemo(() => validateFormats(form.formats), [form.formats])
  const urlTrimmed = form.url.trim()
  const urlError = urlTrimmed && !isValidUrl(urlTrimmed) ? 'Enter a valid http(s) URL.' : undefined
  const canRun =
    tab === 'json' ? !!json?.body : !!urlTrimmed && !urlError && formatErrors.length === 0

  const changeTab = (next: ScrapeTab) => {
    if (next === tab) return
    if (next === 'json') {
      setJsonText(JSON.stringify(formBody, null, 2))
    } else if (tab === 'json') {
      const parsed = parseJson(jsonText)
      if (parsed.error || !isPlainObject(parsed.value)) {
        toast.error('Fix the JSON body before switching tabs', {
          description: parsed.error ?? 'The body must be a JSON object.',
        })
        return
      }
      setForm(bodyToFormState(parsed.value))
    }
    setTab(next)
  }

  const onRun = () => {
    if (!body || !canRun) return
    run(body)
  }

  const selected = runs.find(r => r.id === selectedId) ?? runs[0]

  const retry = () => {
    if (!selected) return
    if (selected.source === 'lookup') lookup(selected.url)
    else if (isPlainObject(selected.body)) run(selected.body)
  }

  const restoreRequest = () => {
    if (!selected || !isPlainObject(selected.body)) return
    setForm(bodyToFormState(selected.body))
    setTab('formats')
    toast.success('Request restored into the form')
  }

  const openInteract = (scrapeId: string) => {
    setInteractId(scrapeId)
    setInteractOpen(true)
  }

  const interactRun = runs.find(r => scrapeIdOf(r.response) === interactId)

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FlameIcon}
        title="Scrape"
        description="Turn any URL into clean markdown, HTML, screenshots or structured data."
        actions={<LoadByJobId onLoad={lookup} loading={isLookingUp} />}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="min-w-0 space-y-4">
          <ScrapeRequestCard
            form={form}
            onFormChange={setForm}
            tab={tab}
            onTabChange={changeTab}
            jsonText={jsonText}
            onJsonTextChange={setJsonText}
            jsonError={json?.error}
            onJsonReset={() => setJsonText(JSON.stringify(formBody, null, 2))}
            displayUrl={tab === 'json' ? (typeof json?.body?.url === 'string' ? json.body.url : '') : form.url}
            urlError={urlError}
            canRun={canRun}
            isRunning={isRunning}
            onRun={onRun}
            onCancel={cancel}
          />
          <RequestPreview method="POST" path="/scrape" body={body} />
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <ScrapeHistory
                runs={runs}
                selectedId={selected?.id}
                onSelect={setSelectedId}
                onRemove={removeRun}
                onClear={clearRuns}
              />
            </div>
            {selected && isPlainObject(selected.body) && selected.status !== 'pending' && (
              <Button variant="ghost" size="sm" className="self-start sm:self-auto" onClick={restoreRequest}>
                <Undo2Icon /> Restore request
              </Button>
            )}
          </div>
          <ScrapeResultPanel run={selected} onRetry={retry} onCancel={cancel} onInteract={openInteract} />
        </div>
      </div>

      <InteractSheet
        scrapeId={interactId}
        url={interactRun?.response?.data?.metadata?.sourceURL ?? interactRun?.url}
        open={interactOpen}
        onOpenChange={setInteractOpen}
      />
    </div>
  )
}
