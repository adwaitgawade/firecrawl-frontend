/** Types mirrored from `apps/api/src/controllers/v2/browser.ts` and `browser-replay.ts`. */

/** Body of `POST /v2/browser`. */
export interface BrowserCreateRequest {
  /** Total session lifetime in seconds, 30–3600, default 600. */
  ttl?: number
  /** Idle timeout in seconds, 10–3600, default 300. */
  activityTtl?: number
  /** default true */
  streamWebView?: boolean
  /** default true */
  recordSession?: boolean
  profile?: {
    /** 1–128 chars */
    name: string
    /** default true */
    saveChanges?: boolean
  }
}

export interface BrowserCreateResponse {
  success: true
  id: string
  cdpUrl: string
  liveViewUrl: string
  interactiveLiveViewUrl: string
  expiresAt: string
}

export type BrowserSessionStatus = 'active' | 'destroyed'

export interface BrowserSession {
  id: string
  status: BrowserSessionStatus | string
  cdpUrl: string
  liveViewUrl: string
  interactiveLiveViewUrl: string
  streamWebView: boolean
  createdAt: string
  lastActivity: string
}

export interface BrowserListResponse {
  success: true
  sessions: BrowserSession[]
}

export type BrowserLanguage = 'node' | 'python' | 'bash'

/** Body of `POST /v2/browser/:id/execute`. */
export interface BrowserExecuteRequest {
  /** 1–100000 chars */
  code: string
  /** default "node" */
  language?: BrowserLanguage
  /** seconds, 1–300, default 30 */
  timeout?: number
}

export interface BrowserExecuteResponse {
  success: true
  stdout?: string
  result?: string
  stderr?: string
  exitCode?: number
  killed?: boolean
  /** Present when exitCode !== 0 or the process was killed. */
  error?: string
}

export interface BrowserDeleteResponse {
  success: true
  sessionDurationMs?: number
  creditsBilled?: number
}

export interface BrowserReplayPage {
  pageId: string
  /** API path serving this page's HLS playlist (relative to the API origin). */
  url: string
  /** First page URL recorded on this tab. */
  pageUrl: string
  /** Milliseconds from session start. */
  startTimeMs: number
  endTimeMs: number
}

export interface BrowserReplayResponse {
  success: true
  pages: BrowserReplayPage[]
  pageCount: number
}

/** Client-side record of one execute call, shown in the console history. */
export interface ExecutionEntry {
  id: string
  language: BrowserLanguage
  code: string
  timeout: number
  startedAt: number
  durationMs?: number
  status: 'running' | 'done' | 'error'
  response?: BrowserExecuteResponse
  /** Request error message (kept as a string so history can be persisted). */
  error?: string
}
