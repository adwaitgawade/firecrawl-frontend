import type { Document, ScrapeResponse } from '@/lib/api/types'

/** GET /v2/scrape/:jobId (controllers/v2/scrape-status.ts). */
export interface ScrapeStatusResponse {
  success: true
  data: Document
}

export type InteractLanguage = 'node' | 'python' | 'bash'

/**
 * POST /v2/scrape/:jobId/interact body (`browserExecuteRequestSchema` in
 * controllers/v2/scrape-browser.ts). Either `code` or `prompt` is required.
 */
export interface InteractRequest {
  /** 1–100000 chars */
  code?: string
  /** 1–10000 chars; runs the browser agent loop */
  prompt?: string
  /** default "node" (only used with `code`) */
  language?: InteractLanguage
  /** seconds, 1–300, default 30 */
  timeout?: number
  origin?: string
}

/**
 * POST /v2/scrape/:jobId/interact response. Note the API answers 200 with `success: false` when the
 * code/agent run fails (non-zero exit code or killed) — stdout/stderr are still present.
 */
export interface InteractResponse {
  success: boolean
  sessionId?: string
  cdpUrl?: string
  liveViewUrl?: string
  interactiveLiveViewUrl?: string
  /** agent (prompt) output */
  output?: string
  stdout?: string
  result?: string
  stderr?: string
  exitCode?: number
  killed?: boolean
  error?: string
}

/** DELETE /v2/scrape/:jobId/interact response. */
export interface InteractStopResponse {
  success: boolean
  sessionDurationMs?: number
  creditsBilled?: number
  error?: string
}

/** One scrape kept in the session history (run or looked up by id). */
export interface ScrapeRun {
  /** Local id. */
  id: string
  source: 'run' | 'lookup'
  url: string
  /** Request body (for `run`), or undefined for lookups. */
  body?: unknown
  startedAt: string
  durationMs?: number
  status: 'pending' | 'success' | 'error'
  response?: ScrapeResponse
  /** Serialized error (FirecrawlApiError fields) — errors aren't kept as class instances. */
  error?: SerializedError
}

export interface SerializedError {
  message: string
  status?: number
  code?: string
  details?: unknown
}

export type InteractLogEntry =
  | {
      id: string
      kind: 'exec'
      at: string
      request: InteractRequest
      durationMs: number
      response?: InteractResponse
      error?: SerializedError
    }
  | {
      id: string
      kind: 'stop'
      at: string
      response?: InteractStopResponse
      error?: SerializedError
    }
