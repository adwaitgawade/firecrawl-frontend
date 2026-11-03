import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { index: true, lazy: async () => ({ Component: (await import('./HomePage')).HomePage }) },
]
