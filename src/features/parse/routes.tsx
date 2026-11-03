import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/parse', lazy: async () => ({ Component: (await import('./ParsePage')).ParsePage }) },
]
