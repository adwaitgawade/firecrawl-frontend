import type { AgentModel, AgentStatusResponse, AgentWebhookEvent } from '@/lib/api/types'

/** `GET /v2/agent/:jobId` (`agent-status.ts`). No step/activity data is exposed by the API. */
export type AgentStatusPayload = AgentStatusResponse

/** `DELETE /v2/agent/:jobId` — 409 when the agent already finished or was cancelled. */
export interface AgentCancelResponse {
  success: boolean
}

export interface AgentModelOption {
  value: AgentModel
  label: string
  description: string
}

export const AGENT_MODELS: AgentModelOption[] = [
  { value: 'spark-1-pro', label: 'Spark 1 Pro', description: 'Default. Most capable — best for complex, multi-step research.' },
  { value: 'spark-1-mini', label: 'Spark 1 Mini', description: 'Lighter and cheaper — good for simpler, well-scoped lookups.' },
]

export const AGENT_WEBHOOK_EVENTS: AgentWebhookEvent[] = ['started', 'action', 'completed', 'failed', 'cancelled']
