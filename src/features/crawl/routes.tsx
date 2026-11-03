import type { RouteObject } from 'react-router'

export const routes: RouteObject[] = [
  { path: '/crawl', lazy: async () => ({ Component: (await import('./CrawlPage')).CrawlPage }) },
  { path: '/crawl/:jobId', lazy: async () => ({ Component: (await import('./CrawlJobPage')).CrawlJobPage }) },
]
