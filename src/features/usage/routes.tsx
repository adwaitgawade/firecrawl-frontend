import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/usage', lazy: async () => ({ Component: (await import('./UsagePage')).UsagePage }) },
]
