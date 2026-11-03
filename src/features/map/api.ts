import { api } from '@/lib/api/client'
import type { MapRequest, MapResponse } from '@/lib/api/types'

export function runMap(body: MapRequest, signal?: AbortSignal) {
  return api.post<MapResponse>('/map', body, { signal })
}
