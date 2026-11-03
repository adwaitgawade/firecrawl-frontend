/** Minimal helpers for the HLS VOD playlists returned by `GET /v2/browser/:id/replay/:pageId`. */

export interface PlaylistInfo {
  segments: { uri: string; duration: number }[]
  totalDuration: number
}

export function parsePlaylist(text: string): PlaylistInfo {
  const segments: PlaylistInfo['segments'] = []
  let pending: number | null = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#EXTINF:')) {
      pending = parseFloat(line.slice('#EXTINF:'.length)) || 0
    } else if (!line.startsWith('#')) {
      segments.push({ uri: line, duration: pending ?? 0 })
      pending = null
    }
  }
  return { segments, totalDuration: segments.reduce((sum, s) => sum + s.duration, 0) }
}

/** Rewrite relative segment URIs as absolute ones (so the playlist works from a data: URL). */
export function absolutizePlaylist(text: string, baseUrl: string): string {
  return text
    .split(/\r?\n/)
    .map(line => {
      const t = line.trim()
      if (!t || t.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(t)) return line
      try {
        return new URL(t, baseUrl).toString()
      } catch {
        return line
      }
    })
    .join('\n')
}

/** Whether this browser can play HLS natively in a <video> element (Safari, some Chromium builds). */
export function canPlayHlsNatively(): boolean {
  if (typeof document === 'undefined') return false
  const video = document.createElement('video')
  return video.canPlayType('application/vnd.apple.mpegurl') !== ''
}

export function toDataUrl(playlist: string): string {
  const bytes = new TextEncoder().encode(playlist)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return `data:application/vnd.apple.mpegurl;base64,${btoa(binary)}`
}
