import * as React from 'react'
import { DownloadIcon, FolderTreeIcon, ListIcon, NetworkIcon, SearchIcon, SearchXIcon, TriangleAlertIcon } from 'lucide-react'
import { Link } from 'react-router'

import { CopyButton } from '@/components/shared/CopyButton'
import { EmptyState } from '@/components/shared/EmptyState'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { MapLink, MapResponse } from '@/lib/api/types'
import { formatNumber } from '@/lib/utils'

import { exportLinks } from '../export'
import { buildPathTree } from '../path-tree'
import type { MapViewMode } from '../types'
import { LinkActions } from './LinkActions'
import { PathTreeView } from './PathTreeView'

const PAGE_SIZE = 250

function LinkList({ links }: { links: MapLink[] }) {
  const [visible, setVisible] = React.useState(PAGE_SIZE)
  const shown = links.slice(0, visible)
  return (
    <div className="space-y-3">
      <ul className="divide-y rounded-lg border">
        {shown.map((link, i) => (
          <li key={`${i}:${link.url}`} className="group hover:bg-muted/50 flex items-start gap-3 px-3 py-2">
            <span className="text-muted-foreground w-8 shrink-0 pt-0.5 text-right text-xs tabular-nums">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-mono text-sm hover:underline"
                title={link.url}
              >
                {link.url}
              </a>
              {link.title && <div className="truncate text-sm font-medium">{link.title}</div>}
              {link.description && <p className="text-muted-foreground line-clamp-2 text-xs">{link.description}</p>}
            </div>
            <div className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
              <LinkActions url={link.url} />
            </div>
          </li>
        ))}
      </ul>
      {links.length > visible && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setVisible(v => v + PAGE_SIZE)}>
            Show {formatNumber(Math.min(PAGE_SIZE, links.length - visible))} more of {formatNumber(links.length - visible)}
          </Button>
        </div>
      )}
    </div>
  )
}

export function MapResults({ result, mappedUrl, durationMs }: { result: MapResponse; mappedUrl: string; durationMs?: number }) {
  const [filter, setFilter] = React.useState('')
  const [view, setView] = React.useState<MapViewMode>('list')
  const links = React.useMemo(() => result.links ?? [], [result.links])

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return links
    return links.filter(
      l =>
        l.url.toLowerCase().includes(q) ||
        l.title?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q),
    )
  }, [links, filter])
  const tree = React.useMemo(() => (view === 'tree' ? buildPathTree(filtered) : []), [filtered, view])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-baseline gap-2">
            {formatNumber(links.length)} <span className="text-muted-foreground text-sm font-normal">links found</span>
          </CardTitle>
          {durationMs !== undefined && (
            <p className="text-muted-foreground text-xs">
              in {(durationMs / 1000).toFixed(1)}s{result.id ? ` · id ${result.id}` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link to={`/crawl?url=${encodeURIComponent(mappedUrl)}`}>
              <NetworkIcon /> Crawl this site
            </Link>
          </Button>
          <CopyButton
            variant="outline"
            size="sm"
            label="Copy all"
            value={() => filtered.map(l => l.url).join('\n')}
            toastMessage={`Copied ${filtered.length} URLs`}
            disabled={filtered.length === 0}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={filtered.length === 0}>
                <DownloadIcon /> Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                {filter ? `${formatNumber(filtered.length)} filtered links` : `${formatNumber(links.length)} links`}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => exportLinks(filtered, 'txt', mappedUrl)}>Plain text (.txt)</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportLinks(filtered, 'json', mappedUrl)}>JSON (.json)</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportLinks(filtered, 'csv', mappedUrl)}>CSV (.csv)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.warning && (
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertDescription>{result.warning}</AlertDescription>
          </Alert>
        )}
        {links.length === 0 ? (
          <EmptyState
            icon={SearchXIcon}
            title="No links found"
            description="Try turning off “Filter by path”, enabling subdomains, or mapping the base domain."
          />
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                <Input
                  className="pl-8"
                  placeholder="Filter links by URL, title or description"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                {filter && (
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {formatNumber(filtered.length)} of {formatNumber(links.length)}
                  </span>
                )}
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  value={view}
                  onValueChange={v => v && setView(v as MapViewMode)}
                  aria-label="View mode"
                >
                  <ToggleGroupItem value="list" aria-label="List view">
                    <ListIcon />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="tree" aria-label="Path tree view">
                    <FolderTreeIcon />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            {filtered.length === 0 ? (
              <EmptyState icon={SearchXIcon} title="No matching links" description={`Nothing matches “${filter}”.`} />
            ) : view === 'list' ? (
              <LinkList key={filter} links={filtered} />
            ) : (
              <PathTreeView roots={tree} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
