import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/agent', lazy: async () => ({ Component: (await import('./AgentPage')).AgentPage }) },
  { path: '/agent/:jobId', lazy: async () => ({ Component: (await import('./AgentJobPage')).AgentJobPage }) },
]
