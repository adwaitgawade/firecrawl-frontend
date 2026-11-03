import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/extract', lazy: async () => ({ Component: (await import('./ExtractPage')).ExtractPage }) },
  { path: '/extract/:jobId', lazy: async () => ({ Component: (await import('./ExtractJobPage')).ExtractJobPage }) },
]
