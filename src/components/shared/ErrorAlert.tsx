import { AlertCircleIcon, RotateCcwIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FirecrawlApiError } from '@/lib/api/client'
import { cn } from '@/lib/utils'

export interface ErrorAlertProps {
  error: unknown
  /** Defaults to "Request failed" (+ status for API errors). */
  title?: string
  onRetry?: () => void
  className?: string
}

interface ZodLikeIssue {
  path?: (string | number)[]
  message?: string
}

function isIssueArray(v: unknown): v is ZodLikeIssue[] {
  return Array.isArray(v) && v.every(i => i && typeof i === 'object' && 'message' in i)
}

/** Extract a human-readable message from any thrown value. */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error'
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export function ErrorAlert({ error, title, onRetry, className }: ErrorAlertProps) {
  if (!error) return null
  const apiError = error instanceof FirecrawlApiError ? error : null
  const heading =
    title ??
    (apiError
      ? apiError.status
        ? `Request failed (${apiError.status})`
        : 'Network error'
      : 'Something went wrong')
  const details = apiError?.details

  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircleIcon />
      <AlertTitle className="line-clamp-none">{heading}</AlertTitle>
      <AlertDescription>
        <p className="break-words whitespace-pre-wrap">{getErrorMessage(error)}</p>
        {apiError?.code && apiError.code !== 'NETWORK_ERROR' && (
          <p className="font-mono text-xs opacity-80">code: {apiError.code}</p>
        )}
        {details !== undefined && details !== null && (
          isIssueArray(details) ? (
            <ul className="list-disc space-y-0.5 pl-4 text-xs">
              {details.map((issue, i) => (
                <li key={i}>
                  {issue.path && issue.path.length > 0 && (
                    <span className="font-mono">{issue.path.join('.')}: </span>
                  )}
                  {issue.message}
                </li>
              ))}
            </ul>
          ) : (
            <pre className="bg-destructive/5 max-h-48 w-full overflow-auto rounded p-2 text-xs whitespace-pre-wrap">
              {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
            </pre>
          )
        )}
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            <RotateCcwIcon /> Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
