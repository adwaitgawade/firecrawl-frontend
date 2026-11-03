import type { AgentRequest, AgentStartResponse } from '@/lib/api/types'
import { api } from '@/lib/api/client'
import { usePollingQuery } from '@/lib/hooks/use-polling'
import { getJobStatusTolerant } from '@/features/extract/api'

import type { AgentCancelResponse, AgentStatusPayload } from './types'

export function startAgent(body: AgentRequest): Promise<AgentStartResponse> {
  return api.post<AgentStartResponse>('/agent', body)
}

export function getAgentStatus(id: string, signal?: AbortSignal): Promise<AgentStatusPayload> {
  return getJobStatusTolerant<AgentStatusPayload>(`/agent/${encodeURIComponent(id)}`, signal)
}

export function cancelAgent(id: string): Promise<AgentCancelResponse> {
  return api.delete<AgentCancelResponse>(`/agent/${encodeURIComponent(id)}`)
}

/**
 * Polls `GET /v2/agent/:id` every 3s until terminal. `stopWhen` lets the page stop polling after a
 * local cancel (the status endpoint keeps answering "processing" until the agent service writes a row).
 */
export function useAgentStatus(id: string | undefined, stopWhen: (d: AgentStatusPayload) => boolean) {
  return usePollingQuery(['agent', id], signal => getAgentStatus(id ?? '', signal), {
    enabled: !!id,
    intervalMs: 3000,
    stopWhen,
  })
}
