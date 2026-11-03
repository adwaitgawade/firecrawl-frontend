import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { openWebSocket } from '@/lib/api/client'
import { isTerminalStatus, type CrawlStatusResponse, type Document } from '@/lib/api/types'
import { usePollingQuery } from '@/lib/hooks/use-polling'
import { updateJob } from '@/lib/job-history'

import { crawlKeys, getCrawlStatus, pageFromNext } from './api'
import { mergeDocuments } from './documents'
import type { CrawlWatchMode, CrawlWsMessage } from './types'

/** Give up on the socket (and poll instead) if no catchup arrives within this window. */
const CONNECT_TIMEOUT_MS = 10_000

export type CrawlMeta = Omit<CrawlStatusResponse, 'data' | 'next'>

export interface CrawlWatchResult {
  mode: CrawlWatchMode
  /** Why the socket was abandoned (only informational — polling takes over). */
  socketError?: string
  meta?: CrawlMeta
  /** All documents received so far (WebSocket + REST pages, de-duplicated, arrival order). */
  documents: Document[]
  isLoading: boolean
  /** REST error, only surfaced when nothing could be loaded at all. */
  error: Error | null
  isTerminal: boolean
  isPolling: boolean
  canLoadMore: boolean
  loadMore: () => void
  isLoadingMore: boolean
  loadMoreError: Error | null
  /** Close the socket and let REST polling take over (e.g. after cancelling). */
  stopLive: () => void
  refresh: () => void
}

function parseMessage(raw: unknown): CrawlWsMessage | undefined {
  if (typeof raw !== 'string' || !raw) return undefined
  try {
    const msg = JSON.parse(raw) as unknown
    return msg && typeof msg === 'object' && 'type' in msg ? (msg as CrawlWsMessage) : undefined
  } catch {
    return undefined
  }
}

/**
 * Watch a crawl job: streams documents over `WS /v2/crawl/:id` and falls back to polling
 * `GET /v2/crawl/:id` if the socket fails or closes early. Once the socket finishes, REST polling
 * provides the authoritative final status (credits, completedAt, `next` pagination).
 *
 * State is per job id — mount the consumer with `key={jobId}` so it resets when the id changes.
 */
export function useCrawlWatch(jobId: string): CrawlWatchResult {
  const queryClient = useQueryClient()
  const [mode, setMode] = React.useState<CrawlWatchMode>('connecting')
  const [socketError, setSocketError] = React.useState<string>()
  const [catchup, setCatchup] = React.useState<CrawlStatusResponse>()
  const [liveDocs, setLiveDocs] = React.useState<Document[]>([])
  const [liveExtra, setLiveExtra] = React.useState(0)
  const socketRef = React.useRef<WebSocket | null>(null)

  React.useEffect(() => {
    let disposed = false
    let gotCatchup = false
    let finished = false
    let ws: WebSocket | null = null

    const fallback = (reason: string) => {
      if (disposed) return
      disposed = true
      setSocketError(reason)
      setMode('polling')
    }

    let timeout = setTimeout(() => {
      if (!gotCatchup) {
        ws?.close()
        fallback('Timed out waiting for the WebSocket — polling instead.')
      }
    }, CONNECT_TIMEOUT_MS)

    try {
      ws = openWebSocket(`/crawl/${jobId}`)
      socketRef.current = ws
    } catch (e) {
      clearTimeout(timeout)
      const reason = `Could not open WebSocket: ${e instanceof Error ? e.message : String(e)}`
      timeout = setTimeout(() => fallback(reason), 0)
    }

    if (ws) {
      ws.onmessage = ev => {
        if (disposed) return
        const msg = parseMessage(ev.data)
        if (!msg) return
        switch (msg.type) {
          case 'catchup':
            gotCatchup = true
            clearTimeout(timeout)
            setCatchup(msg.data)
            setLiveDocs(prev => mergeDocuments(msg.data.data ?? [], prev))
            setLiveExtra(0)
            setMode('live')
            break
          case 'document':
            setLiveDocs(prev => mergeDocuments(prev, [msg.data]))
            if (gotCatchup) setLiveExtra(n => n + 1)
            break
          case 'done':
            finished = true
            break
          case 'error':
            setSocketError(msg.error)
            break
        }
      }
      // The server sends `done` / `error` as the JSON close reason.
      ws.onclose = ev => {
        if (disposed) return
        clearTimeout(timeout)
        const msg = parseMessage(ev.reason)
        if (msg?.type === 'done') finished = true
        if (finished || (gotCatchup && ev.code === 1000 && !msg)) {
          disposed = true
          setMode('finished')
          return
        }
        const reason =
          msg?.type === 'error'
            ? msg.error
            : `WebSocket closed${ev.code ? ` (code ${ev.code})` : ''} — polling instead.`
        fallback(reason)
      }
    }

    return () => {
      disposed = true
      clearTimeout(timeout)
      if (ws) {
        ws.onmessage = null
        ws.onclose = null
        if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) ws.close(1000)
      }
      if (socketRef.current === ws) socketRef.current = null
    }
  }, [jobId])

  // While the socket streams documents, poll a 1-document page for accurate counters; afterwards
  // (or as fallback) poll full pages until the job is terminal.
  const variant = mode === 'live' ? 'meta' : 'full'
  const statusQuery = usePollingQuery(
    crawlKeys.status(jobId, variant),
    signal => getCrawlStatus(jobId, variant === 'meta' ? { limit: 1 } : {}, signal),
    { intervalMs: variant === 'meta' ? 3000 : 2000, enabled: mode !== 'connecting' },
  )

  // Keep the last REST response across variant switches to avoid flashing.
  const [lastRest, setLastRest] = React.useState<CrawlStatusResponse>()
  if (statusQuery.data && statusQuery.data !== lastRest) setLastRest(statusQuery.data)
  const rest = statusQuery.data ?? lastRest
  const fullPage = variant === 'full' ? statusQuery.data : undefined

  // "Load more" pages (chained through each page's `next`).
  const [extra, setExtra] = React.useState<{ docs: Document[]; next?: string | null }>({ docs: [] })
  const nextUrl = extra.next !== undefined ? extra.next : fullPage?.next

  const loadMoreMutation = useMutation({
    mutationFn: (next: string) => getCrawlStatus(jobId, pageFromNext(next)),
    onSuccess: page => setExtra(prev => ({ docs: mergeDocuments(prev.docs, page.data ?? []), next: page.next ?? null })),
  })

  const documents = React.useMemo(
    () => mergeDocuments(mergeDocuments(liveDocs, fullPage?.data ?? []), extra.docs),
    [liveDocs, fullPage, extra.docs],
  )

  const meta = React.useMemo<CrawlMeta | undefined>(() => {
    const base = rest ?? catchup
    if (!base) return undefined
    const { data: _data, next: _next, ...m } = base
    const liveCompleted = catchup ? catchup.completed + liveExtra : 0
    const completed = Math.max(m.completed ?? 0, mode === 'live' ? liveCompleted : 0)
    return { ...m, completed, total: Math.max(m.total ?? 0, completed) }
  }, [rest, catchup, liveExtra, mode])

  const status = meta?.status
  const isTerminal = isTerminalStatus(status)

  React.useEffect(() => {
    if (status) updateJob(jobId, { status })
  }, [jobId, status])

  const stopLive = React.useCallback(() => {
    const ws = socketRef.current
    if (ws) {
      ws.onmessage = null
      ws.onclose = null
      ws.close(1000)
      socketRef.current = null
    }
    setMode(m => (m === 'live' || m === 'connecting' ? 'finished' : m))
    void queryClient.invalidateQueries({ queryKey: [...crawlKeys.all, jobId] })
  }, [jobId, queryClient])

  const refresh = React.useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: [...crawlKeys.all, jobId] })
  }, [jobId, queryClient])

  const { mutate } = loadMoreMutation
  const loadMore = React.useCallback(() => {
    if (nextUrl) mutate(nextUrl)
  }, [mutate, nextUrl])

  return {
    mode,
    socketError,
    meta,
    documents,
    isLoading: !meta && (mode === 'connecting' || statusQuery.isLoading),
    error: meta ? null : statusQuery.error,
    isTerminal,
    isPolling: statusQuery.isPolling,
    canLoadMore: isTerminal && !!nextUrl && documents.length < (meta?.completed ?? Infinity),
    loadMore,
    isLoadingMore: loadMoreMutation.isPending,
    loadMoreError: loadMoreMutation.error,
    stopLive,
    refresh,
  }
}
