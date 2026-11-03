import type { RouteObject } from 'react-router'

import { AppLayout } from '@/layouts/AppLayout'
import { NotFound } from '@/pages/NotFound'

import { routes as agentRoutes } from '@/features/agent/routes'
import { routes as batchRoutes } from '@/features/batch/routes'
import { routes as browserRoutes } from '@/features/browser/routes'
import { routes as crawlRoutes } from '@/features/crawl/routes'
import { routes as extractRoutes } from '@/features/extract/routes'
import { routes as homeRoutes } from '@/features/home/routes'
import { routes as mapRoutes } from '@/features/map/routes'
import { routes as monitorsRoutes } from '@/features/monitors/routes'
import { routes as parseRoutes } from '@/features/parse/routes'
import { routes as scrapeRoutes } from '@/features/scrape/routes'
import { routes as searchRoutes } from '@/features/search/routes'
import { routes as usageRoutes } from '@/features/usage/routes'

/**
 * Route tree. Each feature exports `routes: RouteObject[]` from `src/features/<name>/routes.tsx`;
 * feature pages should be lazy-loaded via the route object's `lazy` property (see PLAN.md notes).
 */
export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      ...homeRoutes,
      ...usageRoutes,
      ...scrapeRoutes,
      ...batchRoutes,
      ...crawlRoutes,
      ...mapRoutes,
      ...searchRoutes,
      ...extractRoutes,
      ...agentRoutes,
      ...parseRoutes,
      ...browserRoutes,
      ...monitorsRoutes,
      {
        path: '/settings',
        lazy: async () => ({ Component: (await import('@/pages/Settings')).SettingsPage }),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]

