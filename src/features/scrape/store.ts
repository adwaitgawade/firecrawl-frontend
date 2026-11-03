import { useSyncExternalStore } from 'react'

import type { InteractLogEntry, ScrapeRun } from './types'

/**
 * Session-scoped scrape history (last few runs) and interact logs per scrape id. Kept in memory and
 * mirrored to sessionStorage on a best-effort basis (documents can be large — e.g. base64
 * screenshots — so quota errors are swallowed and the in-memory copy remains authoritative).
 */

const RUNS_KEY = 'firecrawl.scrape.runs'
const LOGS_KEY = 'firecrawl.scrape.interact'
export const MAX_RUNS = 6

function load<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function persist(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // ignore
    }
  }
}

// Pending runs can't be resumed after a reload; mark them as interrupted.
let runs: ScrapeRun[] = load<ScrapeRun[]>(RUNS_KEY, []).map(r =>
  r.status === 'pending' ? { ...r, status: 'error', error: { message: 'Interrupted (page reloaded)' } } : r,
)
let logs: Record<string, InteractLogEntry[]> = load(LOGS_KEY, {})

const listeners = new Set<() => void>()
const emit = () => listeners.forEach(l => l())
function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

function setRuns(next: ScrapeRun[]) {
  runs = next.slice(0, MAX_RUNS)
  persist(RUNS_KEY, runs)
  emit()
}

export function addRun(run: ScrapeRun) {
  setRuns([run, ...runs.filter(r => r.id !== run.id)])
}

export function updateRun(id: string, patch: Partial<ScrapeRun>) {
  setRuns(runs.map(r => (r.id === id ? { ...r, ...patch } : r)))
}

export function removeRun(id: string) {
  setRuns(runs.filter(r => r.id !== id))
}

export function clearRuns() {
  setRuns([])
}

export function useScrapeRuns(): ScrapeRun[] {
  return useSyncExternalStore(subscribe, () => runs, () => runs)
}

export function appendInteractLog(scrapeId: string, entry: InteractLogEntry) {
  logs = { ...logs, [scrapeId]: [...(logs[scrapeId] ?? []), entry] }
  persist(LOGS_KEY, logs)
  emit()
}

export function clearInteractLog(scrapeId: string) {
  const { [scrapeId]: _removed, ...rest } = logs
  logs = rest
  persist(LOGS_KEY, logs)
  emit()
}

const EMPTY: InteractLogEntry[] = []

export function useInteractLog(scrapeId: string | undefined): InteractLogEntry[] {
  return useSyncExternalStore(
    subscribe,
    () => (scrapeId ? (logs[scrapeId] ?? EMPTY) : EMPTY),
    () => EMPTY,
  )
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
