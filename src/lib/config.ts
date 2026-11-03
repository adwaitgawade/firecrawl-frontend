import { useSyncExternalStore } from 'react'

export interface Settings {
  /** Base URL of the Firecrawl API, without trailing slash and without `/v2`. */
  apiUrl: string
  /** API key (`fc-...`). Empty string when not configured. */
  apiKey: string
}

export const SETTINGS_STORAGE_KEY = 'firecrawl.settings'

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').replace(/\/v[0-9]+$/, '')
}

/** Build-time defaults from `VITE_FIRECRAWL_API_URL` / `VITE_FIRECRAWL_API_KEY`. */
export const envDefaults: Settings = {
  apiUrl: normalizeUrl(import.meta.env.VITE_FIRECRAWL_API_URL || 'http://localhost:3002'),
  apiKey: (import.meta.env.VITE_FIRECRAWL_API_KEY || '').trim(),
}

type Listener = () => void
const listeners = new Set<Listener>()

function readStored(): Partial<Settings> {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const p = parsed as Record<string, unknown>
    const out: Partial<Settings> = {}
    if (typeof p.apiUrl === 'string') out.apiUrl = p.apiUrl
    if (typeof p.apiKey === 'string') out.apiKey = p.apiKey
    return out
  } catch {
    return {}
  }
}

function compute(): Settings {
  const stored = readStored()
  return {
    apiUrl: normalizeUrl(stored.apiUrl || envDefaults.apiUrl),
    apiKey: (stored.apiKey ?? envDefaults.apiKey).trim(),
  }
}

let snapshot: Settings = compute()

function emit() {
  snapshot = compute()
  listeners.forEach(l => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key === SETTINGS_STORAGE_KEY || e.key === null) emit()
  })
}

/** Current effective settings (localStorage override → env defaults). Stable reference until changed. */
export function getSettings(): Settings {
  return snapshot
}

/** Persist a (partial) override to localStorage and notify subscribers. */
export function saveSettings(patch: Partial<Settings>): void {
  const next = { ...readStored(), ...patch }
  if (next.apiUrl !== undefined) next.apiUrl = normalizeUrl(next.apiUrl)
  if (next.apiKey !== undefined) next.apiKey = next.apiKey.trim()
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore quota / privacy-mode errors
  }
  emit()
}

/** Remove all overrides and fall back to env defaults. */
export function resetSettings(): void {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY)
  } catch {
    // ignore
  }
  emit()
}

export function subscribeSettings(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Reactive settings hook. Re-renders when settings change (in this or another tab). */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribeSettings, getSettings, getSettings)
}

/** Whether an API key is configured. */
export function hasApiKey(settings: Settings = getSettings()): boolean {
  return settings.apiKey.length > 0
}

/** Mask an API key for display: `fc-abcd…wxyz`. */
export function maskApiKey(key: string): string {
  if (!key) return ''
  if (key.length <= 10) return `${key.slice(0, 3)}…`
  return `${key.slice(0, 7)}…${key.slice(-4)}`
}
