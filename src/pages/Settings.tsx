import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2Icon, EyeIcon, EyeOffIcon, Loader2Icon, PlugZapIcon, RotateCcwIcon, SaveIcon, SettingsIcon } from 'lucide-react'
import { toast } from 'sonner'

import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { PageHeader } from '@/components/shared/PageHeader'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { api, FirecrawlApiError } from '@/lib/api/client'
import type { ConcurrencyCheckResponse, CreditUsageResponse } from '@/lib/api/types'
import { envDefaults, maskApiKey, resetSettings, saveSettings, useSettings } from '@/lib/config'
import { clearJobs, useJobHistory } from '@/lib/job-history'
import { formatDate, formatNumber } from '@/lib/utils'
import { useTheme, type Theme } from '@/providers/theme-provider'

type TestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success'
      concurrency: ConcurrencyCheckResponse
      credits: CreditUsageResponse['data'] | null
      ms: number
    }
  | { status: 'error'; error: unknown }

export function SettingsPage() {
  const settings = useSettings()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const jobs = useJobHistory()
  const [apiUrl, setApiUrl] = React.useState(settings.apiUrl)
  const [apiKey, setApiKey] = React.useState(settings.apiKey)
  const [reveal, setReveal] = React.useState(false)
  const [test, setTest] = React.useState<TestState>({ status: 'idle' })

  // Re-sync the form when settings change elsewhere (reset, another tab).
  const [prev, setPrev] = React.useState(settings)
  if (prev !== settings) {
    setPrev(settings)
    setApiUrl(settings.apiUrl)
    setApiKey(settings.apiKey)
  }

  const urlValid = React.useMemo(() => {
    try {
      const u = new URL(apiUrl.trim())
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }, [apiUrl])
  const dirty = apiUrl.trim().replace(/\/+$/, '') !== settings.apiUrl || apiKey.trim() !== settings.apiKey

  const onSave = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!urlValid) return
    saveSettings({ apiUrl, apiKey })
    queryClient.invalidateQueries()
    toast.success('Settings saved')
  }

  const onReset = () => {
    resetSettings()
    queryClient.invalidateQueries()
    setTest({ status: 'idle' })
    toast.success('Reset to environment defaults')
  }

  const onTest = async () => {
    if (!urlValid) return
    setTest({ status: 'loading' })
    const started = performance.now()
    const base = apiUrl.trim().replace(/\/+$/, '').replace(/\/v[0-9]+$/, '')
    const headers: Record<string, string> = apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {}
    const init = { auth: false, headers }
    const getJson = async <T,>(path: string): Promise<T> => {
      const res = await api.raw(`${base}/v2${path}`, init)
      const body: unknown = await res.json().catch(() => null)
      const b = (body ?? {}) as { success?: boolean; error?: string; code?: string; details?: unknown }
      if (!res.ok || b.success === false) {
        throw new FirecrawlApiError(b.error ?? `${res.status} ${res.statusText}`, {
          status: res.status,
          code: b.code,
          details: b.details,
          body,
        })
      }
      return body as T
    }
    try {
      // concurrency-check is auth-protected and works on every deployment (incl. self-hosted
      // without billing), so it is the reachability + key check.
      const concurrency = await getJson<ConcurrencyCheckResponse>('/concurrency-check')
      const ms = Math.round(performance.now() - started)
      // Credit usage needs the billing service; treat it as optional extra info.
      const credits = await getJson<CreditUsageResponse>('/team/credit-usage')
        .then(r => r.data)
        .catch(() => null)
      setTest({ status: 'success', concurrency, credits, ms })
    } catch (error) {
      setTest({ status: 'error', error })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={SettingsIcon} title="Settings" description="Configure which Firecrawl API this playground talks to." />

      <form onSubmit={onSave}>
        <Card>
          <CardHeader>
            <CardTitle>API connection</CardTitle>
            <CardDescription>
              Stored in this browser&apos;s localStorage. Defaults come from <code className="text-xs">VITE_FIRECRAWL_API_URL</code> /{' '}
              <code className="text-xs">VITE_FIRECRAWL_API_KEY</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="api-url">API URL</Label>
              <Input
                id="api-url"
                value={apiUrl}
                placeholder="http://localhost:3002"
                aria-invalid={!urlValid || undefined}
                onChange={e => setApiUrl(e.target.value)}
                className="font-mono"
              />
              <p className="text-muted-foreground text-xs">
                Base URL without <code>/v2</code>. Env default: <span className="font-mono">{envDefaults.apiUrl}</span>
              </p>
              {!urlValid && <p className="text-destructive text-xs">Enter a valid http(s) URL.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="api-key">API key</Label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type={reveal ? 'text' : 'password'}
                  value={apiKey}
                  placeholder="fc-..."
                  autoComplete="off"
                  spellCheck={false}
                  onChange={e => setApiKey(e.target.value)}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setReveal(r => !r)}
                  aria-label={reveal ? 'Hide API key' : 'Show API key'}
                >
                  {reveal ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Sent as <code>Authorization: Bearer &lt;key&gt;</code>. Env default:{' '}
                <span className="font-mono">{envDefaults.apiKey ? maskApiKey(envDefaults.apiKey) : 'not set'}</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!urlValid || !dirty}>
              <SaveIcon /> Save
            </Button>
            <Button type="button" variant="outline" onClick={onTest} disabled={!urlValid || test.status === 'loading'}>
              {test.status === 'loading' ? <Loader2Icon className="animate-spin" /> : <PlugZapIcon />}
              Test connection
            </Button>
            <Button type="button" variant="ghost" onClick={onReset}>
              <RotateCcwIcon /> Reset to defaults
            </Button>
          </CardFooter>
        </Card>
      </form>

      {test.status === 'success' && (
        <Alert variant="success">
          <CheckCircle2Icon />
          <AlertTitle>Connected ({test.ms} ms)</AlertTitle>
          <AlertDescription>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <span>
                Concurrency: <strong>{formatNumber(test.concurrency.concurrency)}</strong> /{' '}
                {formatNumber(test.concurrency.maxConcurrency)}
              </span>
              {test.credits ? (
                <>
                  <span>
                    Remaining credits: <strong>{formatNumber(test.credits.remainingCredits)}</strong>
                  </span>
                  <span>
                    Plan credits: <strong>{formatNumber(test.credits.planCredits)}</strong>
                  </span>
                  <span>Billing period start: {formatDate(test.credits.billingPeriodStart, 'MMM d, yyyy')}</span>
                  <span>Billing period end: {formatDate(test.credits.billingPeriodEnd, 'MMM d, yyyy')}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Credit usage unavailable (normal for self-hosted without billing).</span>
              )}
            </div>
            {dirty && <p className="mt-1 text-xs">These values aren&apos;t saved yet — click Save to use them.</p>}
          </AlertDescription>
        </Alert>
      )}
      {test.status === 'error' && <ErrorAlert error={test.error} title="Connection test failed" />}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme preference for this browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={theme} onValueChange={v => setTheme(v as Theme)} className="flex flex-wrap gap-4">
              {(['light', 'dark', 'system'] as const).map(t => (
                <div key={t} className="flex items-center gap-2">
                  <RadioGroupItem id={`theme-${t}`} value={t} />
                  <Label htmlFor={`theme-${t}`} className="capitalize">
                    {t}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Local data</CardTitle>
            <CardDescription>Recent job history is kept in localStorage ({jobs.length} entries).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              disabled={jobs.length === 0}
              onClick={() => {
                clearJobs()
                toast.success('Job history cleared')
              }}
            >
              Clear job history
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
