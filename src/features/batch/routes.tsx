import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/batch', lazy: async () => ({ Component: (await import('./BatchPage')).BatchPage }) },
  { path: '/batch/:jobId', lazy: async () => ({ Component: (await import('./BatchJobPage')).BatchJobPage }) },
]
