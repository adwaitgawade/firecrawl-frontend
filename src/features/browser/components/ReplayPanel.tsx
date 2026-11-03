import * as React from 'react'
import { DownloadIcon, FilmIcon, InfoIcon, RefreshCwIcon } from 'lucide-react'

import { CodeBlock, EmptyState, ErrorAlert, RequestPreview } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { buildUrl, isFirecrawlApiError } from '@/lib/api/client'
import { cn, downloadFile, formatDuration, shortUrl } from '@/lib/utils'

import { useReplay, useReplayPlaylist } from '../api'
import { absolutizePlaylist, canPlayHlsNatively, parsePlaylist, toDataUrl } from '../hls'
import type { BrowserReplayPage } from '../types'

function PlaylistView({ sessionId, page }: { sessionId: string; page: BrowserReplayPage }) {
  const playlist = useReplayPlaylist(sessionId, page.pageId)
  const native = React.useMemo(() => canPlayHlsNatively(), [])
  const path = `/browser/${sessionId}/replay/${page.pageId}`

  const prepared = React.useMemo(() => {
    if (!playlist.data) return null
    const absolute = absolutizePlaylist(playlist.data, buildUrl(path))
    return { text: absolute, info: parsePlaylist(absolute), dataUrl: native ? toDataUrl(absolute) : null }
  }, [playlist.data, path, native])

  if (playlist.isPending) return <Skeleton className="aspect-video w-full" />
  if (playlist.isError)
    return <ErrorAlert error={playlist.error} title="Could not load recording" onRetry={() => void playlist.refetch()} />
  if (!prepared) return null

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="muted">{prepared.info.segments.length} segments</Badge>
        <Badge variant="muted">{formatDuration(prepared.info.totalDuration * 1000)}</Badge>
        <span className="truncate font-mono" title={page.pageUrl}>
          {page.pageUrl}
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void playlist.refetch()} disabled={playlist.isFetching}>
            <RefreshCwIcon className={cn(playlist.isFetching && 'animate-spin')} /> Refresh links
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadFile(`replay-${sessionId.slice(0, 8)}-page-${page.pageId}.m3u8`, prepared.text, 'application/vnd.apple.mpegurl')
            }
          >
            <DownloadIcon /> .m3u8
          </Button>
        </div>
      </div>

      {prepared.dataUrl ? (
        <video key={prepared.dataUrl} controls className="aspect-video w-full rounded-lg border bg-black" src={prepared.dataUrl} />
      ) : (
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>In-browser playback isn&apos;t available here</AlertTitle>
          <AlertDescription>
            Recordings are HLS playlists. This browser has no native HLS support (Safari does), so download the .m3u8 and
            open it in VLC or <code className="text-xs">ffplay</code>, or open individual segments below. Segment links are
            pre-signed and expire after ~6 hours — use “Refresh links” to mint new ones.
          </AlertDescription>
        </Alert>
      )}

      {prepared.info.segments.length > 0 && (
        <details className="rounded-lg border">
          <summary className="hover:bg-muted/50 cursor-pointer px-3 py-2 text-sm font-medium">Segments</summary>
          <ol className="max-h-64 space-y-1 overflow-y-auto border-t p-3 text-xs">
            {prepared.info.segments.map((s, i) => (
              <li key={`${i}-${s.uri}`} className="flex items-center gap-2">
                <span className="text-muted-foreground w-8 shrink-0 font-mono">#{i + 1}</span>
                <span className="text-muted-foreground w-14 shrink-0 font-mono">{s.duration.toFixed(1)}s</span>
                <a href={s.uri} target="_blank" rel="noreferrer" className="text-primary truncate font-mono hover:underline">
                  {s.uri.split('?')[0].split('/').pop() || s.uri}
                </a>
              </li>
            ))}
          </ol>
        </details>
      )}

      <details className="rounded-lg border">
        <summary className="hover:bg-muted/50 cursor-pointer px-3 py-2 text-sm font-medium">Raw playlist</summary>
        <div className="border-t p-3">
          <CodeBlock code={prepared.text} maxHeight="20rem" />
        </div>
      </details>

      <RequestPreview method="GET" path={path} title="Playlist request" />
    </div>
  )
}

export function ReplayPanel({ sessionId }: { sessionId: string }) {
  const replay = useReplay(sessionId, true)
  const pages = replay.data?.pages ?? []
  const [selected, setSelected] = React.useState<string | null>(null)
  const current = pages.find(p => p.pageId === selected) ?? pages[0]

  if (replay.isPending) {
    return (
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <Skeleton className="h-40" />
        <Skeleton className="aspect-video" />
      </div>
    )
  }
  if (replay.isError) {
    if (isFirecrawlApiError(replay.error) && replay.error.status === 404) {
      return (
        <EmptyState
          icon={FilmIcon}
          title="No replay found"
          description="Replays exist only for sessions created with recordSession enabled. Segments upload every ~10 s, so very short sessions may have nothing yet."
          action={
            <Button variant="outline" size="sm" onClick={() => void replay.refetch()}>
              <RefreshCwIcon /> Check again
            </Button>
          }
        />
      )
    }
    return <ErrorAlert error={replay.error} title="Could not load replay" onRetry={() => void replay.refetch()} />
  }
  if (pages.length === 0) {
    return (
      <EmptyState
        icon={FilmIcon}
        title="No recorded pages yet"
        description="Run some code that navigates the browser, then check back."
        action={
          <Button variant="outline" size="sm" onClick={() => void replay.refetch()}>
            <RefreshCwIcon /> Refresh
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center justify-between border-b py-3">
          <CardTitle className="text-sm">
            Pages <span className="text-muted-foreground font-normal">({replay.data.pageCount})</span>
          </CardTitle>
          <Button variant="ghost" size="icon-sm" aria-label="Refresh pages" onClick={() => void replay.refetch()}>
            <RefreshCwIcon className={cn(replay.isFetching && 'animate-spin')} />
          </Button>
        </CardHeader>
        <CardContent className="p-2">
          <ul className="space-y-1">
            {pages.map(p => (
              <li key={p.pageId}>
                <button
                  type="button"
                  onClick={() => setSelected(p.pageId)}
                  className={cn(
                    'hover:bg-muted w-full rounded-md px-3 py-2 text-left transition-colors',
                    current?.pageId === p.pageId && 'bg-muted',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium">Tab {p.pageId}</span>
                    <span className="text-muted-foreground font-mono">
                      {formatDuration(p.startTimeMs)} → {formatDuration(p.endTimeMs)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs" title={p.pageUrl}>
                    {p.pageUrl ? shortUrl(p.pageUrl) : '(blank)'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="min-w-0 space-y-3">
        {current && <PlaylistView key={current.pageId} sessionId={sessionId} page={current} />}
        <RequestPreview method="GET" path={`/browser/${sessionId}/replay`} title="Pages request" />
      </div>
    </div>
  )
}
