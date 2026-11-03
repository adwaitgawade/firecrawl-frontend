import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/search', lazy: async () => ({ Component: (await import('./SearchPage')).SearchPage }) },
]
