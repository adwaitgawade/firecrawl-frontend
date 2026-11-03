import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ScrapeResponse } from '@/lib/api/types'
import { addJob } from '@/lib/job-history'

import { getScrape, runScrape, serializeError } from './api'
import { addRun, newId, updateRun } from './store'

interface RunVars {
  runId: string
  body: Record<string, unknown>
  signal: AbortSignal
  startedAt: number
}

interface LookupVars {
  runId: string
  jobId: string
  startedAt: number
}

const elapsed = (startedAt: number) => Math.round(performance.now() - startedAt)

/** The scrape job id: `scrape_id` (website origin only) or `metadata.scrapeId` (always set). */
export function scrapeIdOf(res: ScrapeResponse | undefined): string | undefined {
  if (!res) return undefined
  const fromMeta = res.data?.metadata?.scrapeId
  return res.scrape_id ?? (typeof fromMeta === 'string' ? fromMeta : undefined)
}

/**
 * Runs scrapes / job-id lookups and records them in the session history store (store updates
 * happen in mutation-level callbacks, so they land even if the page unmounts mid-request).
 * `onStart` is called with the new run id so the page can select it.
 */
export function useScrapeRunner(onStart: (runId: string) => void) {
  const abortRef = React.useRef<AbortController | null>(null)

  const runMutation = useMutation({
    mutationFn: ({ body, signal }: RunVars) => runScrape(body, signal),
    onMutate: ({ runId, body }) => {
      addRun({
        id: runId,
        source: 'run',
        url: typeof body.url === 'string' ? body.url : '',
        body,
        startedAt: new Date().toISOString(),
        status: 'pending',
      })
    },
    onSuccess: (response, { runId, body, startedAt }) => {
      updateRun(runId, { status: 'success', response, durationMs: elapsed(startedAt) })
      const id = scrapeIdOf(response)
      if (id) {
        const label = response.data?.metadata?.sourceURL ?? (typeof body.url === 'string' ? body.url : id)
        addJob({ kind: 'scrape', id, label, status: 'completed' })
      }
    },
    onError: (error, { runId, startedAt }) => {
      updateRun(runId, { status: 'error', error: serializeError(error), durationMs: elapsed(startedAt) })
    },
  })

  const lookupMutation = useMutation({
    mutationFn: ({ jobId }: LookupVars) => getScrape(jobId),
    onMutate: ({ runId, jobId }) => {
      addRun({ id: runId, source: 'lookup', url: jobId, startedAt: new Date().toISOString(), status: 'pending' })
    },
    onSuccess: (res, { runId, jobId, startedAt }) => {
      const response: ScrapeResponse = { success: true, data: res.data, scrape_id: jobId }
      updateRun(runId, {
        status: 'success',
        response,
        durationMs: elapsed(startedAt),
        url: res.data?.metadata?.sourceURL ?? res.data?.metadata?.url ?? jobId,
      })
    },
    onError: (error, { runId, startedAt }) => {
      updateRun(runId, { status: 'error', error: serializeError(error), durationMs: elapsed(startedAt) })
      toast.error('Could not load scrape job')
    },
  })

  const { mutate: mutateRun } = runMutation
  const { mutate: mutateLookup } = lookupMutation

  const run = React.useCallback(
    (body: Record<string, unknown>) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const runId = newId()
      onStart(runId)
      mutateRun(
        { runId, body, signal: controller.signal, startedAt: performance.now() },
        {
          onSettled: () => {
            if (abortRef.current === controller) abortRef.current = null
          },
        },
      )
    },
    [onStart, mutateRun],
  )

  const lookup = React.useCallback(
    (jobId: string) => {
      const runId = newId()
      onStart(runId)
      mutateLookup({ runId, jobId: jobId.trim(), startedAt: performance.now() })
    },
    [onStart, mutateLookup],
  )

  const cancel = React.useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  return {
    run,
    lookup,
    cancel,
    isRunning: runMutation.isPending,
    isLookingUp: lookupMutation.isPending,
  }
}
