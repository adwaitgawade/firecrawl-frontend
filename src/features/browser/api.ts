import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api/client'
import { updateJob } from '@/lib/job-history'

import type {
  BrowserCreateRequest,
  BrowserCreateResponse,
  BrowserDeleteResponse,
  BrowserExecuteRequest,
  BrowserExecuteResponse,
  BrowserListResponse,
  BrowserReplayResponse,
  BrowserSession,
} from './types'

/** Create response plus the client-side creation time (cached for the session page). */
type CreatedSession = BrowserCreateResponse & { createdAt: string }

export type SessionFilter = 'all' | 'active' | 'destroyed'

export const browserKeys = {
  all: ['browser'] as const,
  list: (filter: SessionFilter) => ['browser', 'sessions', filter] as const,
  created: (id: string) => ['browser', 'created', id] as const,
  replay: (id: string) => ['browser', 'replay', id] as const,
  replayPage: (id: string, pageId: string) => ['browser', 'replay', id, pageId] as const,
}

export function listSessions(filter: SessionFilter, signal?: AbortSignal) {
  return api.get<BrowserListResponse>('/browser', {
    signal,
    query: { status: filter === 'all' ? undefined : filter },
  })
}

export function useBrowserSessions(filter: SessionFilter, opts: { refetchInterval?: number | false } = {}) {
  return useQuery({
    queryKey: browserKeys.list(filter),
    queryFn: ({ signal }) => listSessions(filter, signal),
    refetchInterval: opts.refetchInterval ?? 15_000,
  })
}

/**
 * There is no `GET /v2/browser/:id`; the session is looked up from the list. The create response
 * (cached under `browserKeys.created`) is used as a fallback right after creation.
 */
export function useBrowserSession(id: string) {
  const queryClient = useQueryClient()
  const list = useBrowserSessions('all', { refetchInterval: 10_000 })
  const created = queryClient.getQueryData<CreatedSession>(browserKeys.created(id))
  const fromList = list.data?.sessions.find(s => s.id === id)
  const session: BrowserSession | undefined =
    fromList ??
    (created
      ? {
          id: created.id,
          status: 'active',
          cdpUrl: created.cdpUrl,
          liveViewUrl: created.liveViewUrl,
          interactiveLiveViewUrl: created.interactiveLiveViewUrl,
          streamWebView: true,
          createdAt: created.createdAt,
          lastActivity: created.createdAt,
        }
      : undefined)
  return { list, session, expiresAt: created?.expiresAt }
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: BrowserCreateRequest) => api.post<BrowserCreateResponse>('/browser', body),
    onSuccess: data => {
      const cached: CreatedSession = { ...data, createdAt: new Date().toISOString() }
      queryClient.setQueryData(browserKeys.created(data.id), cached)
      void queryClient.invalidateQueries({ queryKey: ['browser', 'sessions'] })
    },
  })
}

export function useDeleteSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<BrowserDeleteResponse>(`/browser/${id}`),
    onSuccess: (_data, id) => {
      updateJob(id, { status: 'destroyed' })
      void queryClient.invalidateQueries({ queryKey: ['browser', 'sessions'] })
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ['browser', 'sessions'] })
    },
  })
}

export function executeCode(id: string, body: BrowserExecuteRequest, signal?: AbortSignal) {
  return api.post<BrowserExecuteResponse>(`/browser/${id}/execute`, body, { signal })
}

export function useReplay(id: string, enabled: boolean) {
  return useQuery({
    queryKey: browserKeys.replay(id),
    queryFn: ({ signal }) => api.get<BrowserReplayResponse>(`/browser/${id}/replay`, { signal }),
    enabled,
    retry: false,
  })
}

/** HLS VOD playlist (.m3u8) for one recorded page. Segment URLs are pre-signed (~6h). */
export function useReplayPlaylist(id: string, pageId: string | null) {
  return useQuery({
    queryKey: browserKeys.replayPage(id, pageId ?? ''),
    queryFn: async ({ signal }) => {
      const res = await api.raw(`/browser/${id}/replay/${pageId}`, { signal })
      return res.text()
    },
    enabled: !!pageId,
    retry: false,
    staleTime: 30 * 60_000,
  })
}
