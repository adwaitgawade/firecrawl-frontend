import { useSyncExternalStore } from 'react'

export type JobKind =
  | 'scrape'
  | 'batch'
  | 'crawl'
  | 'extract'
  | 'agent'
  | 'browser'
  | 'search'
  | 'map'
  | 'parse'
  | 'monitor'

export interface JobHistoryEntry {
  kind: JobKind
  /** Job / session id returned by the API. */
  id: string
  /** Short human label, typically the URL or prompt. */
  label: string
  /** ISO timestamp. */
  createdAt: string
  /** Optional last-known status (e.g. "scraping", "completed"). */
  status?: string
}

export const JOB_HISTORY_STORAGE_KEY = 'firecrawl.jobHistory'
const MAX_ENTRIES = 200

type Listener = () => void
const listeners = new Set<Listener>()

function read(): JobHistoryEntry[] {
  try {
    const raw = localStorage.getItem(JOB_HISTORY_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed as JobHistoryEntry[]) : []
  } catch {
    return []
  }
}

let snapshot: JobHistoryEntry[] = read()

function write(entries: JobHistoryEntry[]) {
  snapshot = entries.slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(JOB_HISTORY_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // ignore
  }
  listeners.forEach(l => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === JOB_HISTORY_STORAGE_KEY || e.key === null) {
      snapshot = read()
      listeners.forEach(l => l())
    }
  })
}

/**
 * Record a job (newest first). Re-adding an existing id moves it to the top and merges fields.
 * `createdAt` defaults to now.
 */
export function addJob(
  entry: Omit<JobHistoryEntry, 'createdAt'> & { createdAt?: string },
): void {
  const existing = snapshot.find(j => j.id === entry.id)
  const next: JobHistoryEntry = {
    ...existing,
    ...entry,
    createdAt: entry.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
  }
  write([next, ...snapshot.filter(j => j.id !== entry.id)])
}

/** Update fields (e.g. status) of an existing entry. No-op if not found. */
export function updateJob(id: string, patch: Partial<Omit<JobHistoryEntry, 'id'>>): void {
  if (!snapshot.some(j => j.id === id)) return
  write(snapshot.map(j => (j.id === id ? { ...j, ...patch } : j)))
}

export function removeJob(id: string): void {
  write(snapshot.filter(j => j.id !== id))
}

/** Clear all history, or only entries of one kind. */
export function clearJobs(kind?: JobKind): void {
  write(kind ? snapshot.filter(j => j.kind !== kind) : [])
}

export function getJobs(kind?: JobKind): JobHistoryEntry[] {
  return kind ? snapshot.filter(j => j.kind === kind) : snapshot
}

function subscribe(l: Listener) {
  listeners.add(l)
  return () => listeners.delete(l)
}

const getSnapshot = () => snapshot

/** Reactive list of recent jobs, newest first, optionally filtered by kind. */
export function useJobHistory(kind?: JobKind): JobHistoryEntry[] {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return kind ? all.filter(j => j.kind === kind) : all
}

/** Route path for a job entry's detail view (falls back to the feature root). */
export function jobHref(entry: Pick<JobHistoryEntry, 'kind' | 'id'>): string {
  switch (entry.kind) {
    case 'batch':
    case 'crawl':
    case 'extract':
    case 'agent':
      return `/${entry.kind}/${entry.id}`
    case 'browser':
      return `/browser/${entry.id}`
    case 'monitor':
      return `/monitors/${entry.id}`
    case 'scrape':
      return `/scrape?jobId=${encodeURIComponent(entry.id)}`
    default:
      return `/${entry.kind}`
  }
}
