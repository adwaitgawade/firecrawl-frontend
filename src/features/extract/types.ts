import type { ExtractRequest, ExtractStartResponse, ExtractStatusResponse } from '@/lib/api/types'

/** Step names recorded by the extract worker (`apps/api/src/lib/extract/extract-redis.ts`). */
export type ExtractStepName =
  | 'initial'
  | 'map'
  | 'map-rerank'
  | 'multi-entity'
  | 'multi-entity-scrape'
  | 'multi-entity-extract'
  | 'scrape'
  | 'extract'
  | (string & {})

export interface ExtractStep {
  step: ExtractStepName
  /** epoch ms */
  startedAt: number
  /** epoch ms, null while running */
  finishedAt: number | null
  error?: unknown
  discoveredLinks?: string[]
}

/**
 * Body actually accepted by `POST /v2/extract`. Adds the experimental flags (`extractOptions` in
 * `controllers/v2/types.ts`) that control what the status endpoint returns.
 */
export interface ExtractRequestBody extends ExtractRequest {
  /** Status returns `steps` when true. */
  __experimental_streamSteps?: boolean
  /** Status returns `llmUsage` when true. */
  __experimental_llmUsage?: boolean
  /** Status returns `costTracking` when true. */
  __experimental_showCostTracking?: boolean
}

/** `POST /v2/extract` — `invalidURLs` is present when `ignoreInvalidURLs` dropped some URLs. */
export interface ExtractStartPayload extends ExtractStartResponse {
  invalidURLs?: string[]
}

/** `GET /v2/extract/:jobId` with the optional fields `extract-status.ts` may add. */
export interface ExtractStatusPayload extends ExtractStatusResponse {
  steps?: ExtractStep[]
  llmUsage?: number
  costTracking?: unknown
  sessionIds?: string[]
}
