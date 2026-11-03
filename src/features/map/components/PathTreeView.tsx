import * as React from 'react'
import { ChevronRightIcon, FileIcon, FolderIcon, GlobeIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import type { PathTreeNode } from '../types'
import { LinkActions } from './LinkActions'

function TreeNode({ node, depth, isRoot }: { node: PathTreeNode; depth: number; isRoot?: boolean }) {
  const hasChildren = node.children.length > 0
  const [open, setOpen] = React.useState(depth < 1)
  const Icon = isRoot ? GlobeIcon : hasChildren ? FolderIcon : FileIcon

  return (
    <li>
      <div
        className="group hover:bg-muted/50 flex items-center gap-1.5 rounded-md py-1 pr-1"
        style={{ paddingLeft: `${depth * 1.1 + 0.25}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Collapse' : 'Expand'}
            aria-expanded={open}
          >
            <ChevronRightIcon className={cn('size-4 transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <Icon className={cn('size-4 shrink-0', isRoot ? 'text-primary' : 'text-muted-foreground')} />
        <button
          type="button"
          className={cn('min-w-0 truncate text-left font-mono text-sm', !hasChildren && 'cursor-default', isRoot && 'font-semibold')}
          onClick={() => hasChildren && setOpen(o => !o)}
          title={node.url ?? node.name}
        >
          {isRoot ? node.name : `/${node.name}`}
        </button>
        {node.title && <span className="text-muted-foreground hidden min-w-0 truncate text-xs md:inline">— {node.title}</span>}
        {hasChildren && (
          <Badge variant="muted" className="h-5 px-1.5 tabular-nums">
            {node.count}
          </Badge>
        )}
        <div className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {node.url && <LinkActions url={node.url} />}
        </div>
      </div>
      {hasChildren && open && (
        <ul>
          {node.children.map(child => (
            <TreeNode key={child.name} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function PathTreeView({ roots }: { roots: PathTreeNode[] }) {
  return (
    <ul className="max-h-[40rem] overflow-y-auto rounded-lg border p-2">
      {roots.map(root => (
        <TreeNode key={root.name} node={root} depth={0} isRoot />
      ))}
    </ul>
  )
}
