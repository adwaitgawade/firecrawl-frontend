/**
 * Remembers the request body sent for async jobs (extract / agent) so the job page can show the
 * original request and offer "run again". Stored in localStorage, newest first, capped.
 */
const STORAGE_KEY = 'firecrawl.jobRequests'
const MAX = 50

interface StoredRequest {
  id: string
  body: unknown
}

function readAll(): StoredRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed as StoredRequest[]) : []
  } catch {
    return []
  }
}

export function saveJobRequest(id: string, body: unknown): void {
  try {
    const next = [{ id, body }, ...readAll().filter(r => r.id !== id)].slice(0, MAX)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // storage full / unavailable — not critical
  }
}

export function getJobRequest<T>(id: string | undefined): T | undefined {
  if (!id) return undefined
  return readAll().find(r => r.id === id)?.body as T | undefined
}
