import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Braces,
  ChartColumn,
  FileText,
  Flame,
  House,
  Layers,
  Map as MapIcon,
  MonitorPlay,
  Radar,
  Search,
  Settings,
  Network,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description?: string
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Home', href: '/', icon: House, description: 'Overview and recent jobs' },
      { title: 'Usage', href: '/usage', icon: ChartColumn, description: 'Credits, tokens and queue' },
    ],
  },
  {
    title: 'Scrape',
    items: [
      { title: 'Scrape', href: '/scrape', icon: Flame, description: 'Scrape a single URL' },
      { title: 'Batch Scrape', href: '/batch', icon: Layers, description: 'Scrape many URLs at once' },
      { title: 'Crawl', href: '/crawl', icon: Network, description: 'Crawl a whole site' },
      { title: 'Map', href: '/map', icon: MapIcon, description: 'Discover all URLs on a site' },
      { title: 'Search', href: '/search', icon: Search, description: 'Search the web and scrape results' },
    ],
  },
  {
    title: 'AI',
    items: [
      { title: 'Extract', href: '/extract', icon: Braces, description: 'Structured data with LLMs' },
      { title: 'Agent', href: '/agent', icon: Bot, description: 'Autonomous web research agent' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { title: 'Parse', href: '/parse', icon: FileText, description: 'Parse uploaded files' },
      { title: 'Browser', href: '/browser', icon: MonitorPlay, description: 'Remote browser sessions' },
      { title: 'Monitors', href: '/monitors', icon: Radar, description: 'Scheduled change monitoring' },
    ],
  },
  {
    title: 'Settings',
    items: [{ title: 'Settings', href: '/settings', icon: Settings, description: 'API URL and key' }],
  },
]

/** Flat list of all nav items. */
export const navItems: NavItem[] = navGroups.flatMap(g => g.items)

/** Find the nav item matching a pathname (longest prefix wins). */
export function findNavItem(pathname: string): NavItem | undefined {
  return navItems
    .filter(i => (i.href === '/' ? pathname === '/' : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]
}

