import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/monitors', lazy: async () => ({ Component: (await import('./MonitorsPage')).MonitorsPage }) },
  { path: '/monitors/new', lazy: async () => ({ Component: (await import('./NewMonitorPage')).NewMonitorPage }) },
  {
    path: '/monitors/:monitorId',
    lazy: async () => ({ Component: (await import('./MonitorDetailPage')).MonitorDetailPage }),
  },
]
