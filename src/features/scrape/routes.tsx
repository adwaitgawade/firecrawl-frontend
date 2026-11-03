import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/scrape', lazy: async () => ({ Component: (await import('./ScrapePage')).ScrapePage }) },
]
