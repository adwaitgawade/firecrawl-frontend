import type { ScrapeOptions } from '@/lib/api/types'

/**
 * Types mirrored from `apps/api/src/controllers/v2/parse-upload.ts` and `parse.ts`.
 * The parse response itself is a regular `ScrapeResponse` (`{ success, data: Document }`).
 */

/** Body of `POST /v2/parse/upload-url` (strict schema). */
export interface ParseUploadUrlRequest {
  /** 1–512 chars; the extension is used to detect the file kind. */
  filename: string
  contentType?: string
  /** Positive int ≤ 50 MB. */
  declaredSizeBytes?: number
}

export interface ParseUploadTarget {
  uploadUrl: string
  /** Signed reference passed to `POST /v2/parse` as `uploadRef`. */
  uploadRef: string
  /** `PUT` for the local (self-hosted/dev) driver, `POST` (signed policy form) for GCS. */
  method: 'PUT' | 'POST'
  headers: Record<string, string>
  /** Form fields for the GCS signed POST policy. */
  fields?: Record<string, string>
  expiresAt: string
  maxSizeBytes: number
}

export interface ParseUploadUrlResponse {
  success: true
  data: ParseUploadTarget
}

/**
 * Options accepted by `POST /v2/parse` — `baseScrapeOptions` minus the options the controller
 * rejects for uploads (actions, screenshot/branding/changeTracking formats, waitFor, location,
 * mobile, proxy other than auto/basic).
 */
export type ParseOptions = Omit<ScrapeOptions, 'actions' | 'waitFor' | 'location' | 'mobile' | 'proxy'> & {
  proxy?: 'auto' | 'basic'
  zeroDataRetention?: boolean
}

/** JSON body for the upload-ref flow. */
export type ParseRequestBody = Partial<ParseOptions> & { uploadRef: string }

export type ParseMode = 'signed' | 'multipart'

export type ParseStep = 'upload-url' | 'upload' | 'parse'

export type ParseRunState =
  | { phase: 'idle' }
  | { phase: 'running'; step: ParseStep; progress?: number }
  | { phase: 'done'; durationMs: number }
  | { phase: 'error'; step: ParseStep; error: unknown }
