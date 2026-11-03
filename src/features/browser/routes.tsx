import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  {
    path: '/browser',
    lazy: async () => ({ Component: (await import('./BrowserSessionsPage')).BrowserSessionsPage }),
  },
  {
    path: '/browser/:sessionId',
    lazy: async () => ({ Component: (await import('./BrowserSessionPage')).BrowserSessionPage }),
  },
]
