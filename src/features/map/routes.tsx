import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/map', lazy: async () => ({ Component: (await import('./MapPage')).MapPage }) },
]
