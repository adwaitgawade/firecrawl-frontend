import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api/client'
import { addJob, removeJob } from '@/lib/job-history'

import type {
  CreateMonitorRequest,
  MonitorCheckDetailResponse,
  MonitorCheckListResponse,
  MonitorCheckStatus,
  MonitorListResponse,
  MonitorPageStatus,
  MonitorResponse,
  RunMonitorResponse,
  UpdateMonitorRequest,
} from './types'

export const PAGE_SIZE = 25

export const monitorKeys = {
  all: ['monitors'] as const,
  list: (offset: number) => ['monitors', 'list', offset] as const,
  detail: (id: string) => ['monitors', 'detail', id] as const,
  checks: (id: string, offset: number, status?: MonitorCheckStatus) => ['monitors', 'checks', id, offset, status ?? 'all'] as const,
  check: (id: string, checkId: string, status?: MonitorPageStatus) =>
    ['monitors', 'check', id, checkId, status ?? 'all'] as const,
}

export function useMonitors(offset: number) {
  return useQuery({
    queryKey: monitorKeys.list(offset),
    queryFn: ({ signal }) => api.get<MonitorListResponse>('/monitor', { signal, query: { limit: PAGE_SIZE, offset } }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  })
}

export function useMonitor(id: string) {
  return useQuery({
    queryKey: monitorKeys.detail(id),
    queryFn: ({ signal }) => api.get<MonitorResponse>(`/monitor/${id}`, { signal }),
    // Poll faster while a check is running.
    refetchInterval: q => (q.state.data?.data.currentCheckId ? 3000 : 30_000),
  })
}

export function useMonitorChecks(id: string, offset: number, status?: MonitorCheckStatus, running?: boolean) {
  return useQuery({
    queryKey: monitorKeys.checks(id, offset, status),
    queryFn: ({ signal }) =>
      api.get<MonitorCheckListResponse>(`/monitor/${id}/checks`, { signal, query: { limit: PAGE_SIZE, offset, status } }),
    placeholderData: keepPreviousData,
    refetchInterval: running ? 3000 : false,
  })
}

/** Check detail; `skip` pagination over pages is handled by the caller via `fetchCheckPage`. */
export function useMonitorCheck(id: string, checkId: string | null, status?: MonitorPageStatus) {
  return useQuery({
    queryKey: monitorKeys.check(id, checkId ?? '', status),
    queryFn: ({ signal }) => fetchCheckPage(id, checkId!, 0, status, signal),
    enabled: !!checkId,
    placeholderData: keepPreviousData,
    refetchInterval: q => {
      const s = q.state.data?.data.status
      return s === 'queued' || s === 'running' ? 3000 : false
    },
  })
}

export function fetchCheckPage(
  id: string,
  checkId: string,
  skip: number,
  status?: MonitorPageStatus,
  signal?: AbortSignal,
) {
  return api.get<MonitorCheckDetailResponse>(`/monitor/${id}/checks/${checkId}`, {
    signal,
    query: { limit: PAGE_SIZE, skip: skip || undefined, status },
  })
}

function useInvalidateMonitor() {
  const queryClient = useQueryClient()
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['monitors', 'list'] })
    if (id) {
      void queryClient.invalidateQueries({ queryKey: monitorKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: ['monitors', 'checks', id] })
    }
  }
}

export function useCreateMonitor() {
  const invalidate = useInvalidateMonitor()
  return useMutation({
    mutationFn: (body: CreateMonitorRequest) => api.post<MonitorResponse>('/monitor', body),
    onSuccess: res => {
      addJob({ kind: 'monitor', id: res.data.id, label: res.data.name, status: res.data.status })
      invalidate()
    },
  })
}

export function useUpdateMonitor() {
  const queryClient = useQueryClient()
  const invalidate = useInvalidateMonitor()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMonitorRequest }) =>
      api.patch<MonitorResponse>(`/monitor/${id}`, body),
    onSuccess: res => {
      queryClient.setQueryData(monitorKeys.detail(res.data.id), res)
      invalidate(res.data.id)
    },
  })
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ success: true }>(`/monitor/${id}`),
    onSuccess: (_res, id) => {
      removeJob(id)
      queryClient.removeQueries({ queryKey: monitorKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: ['monitors', 'list'] })
    },
  })
}

export function useRunMonitor() {
  const invalidate = useInvalidateMonitor()
  return useMutation({
    mutationFn: (id: string) => api.post<RunMonitorResponse>(`/monitor/${id}/run`),
    onSuccess: (_res, id) => invalidate(id),
  })
}
