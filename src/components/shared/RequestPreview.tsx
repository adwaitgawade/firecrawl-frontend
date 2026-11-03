import * as React from 'react'
import { ChevronDownIcon, TerminalIcon } from 'lucide-react'

import { CodeBlock } from '@/components/shared/CodeBlock'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { QueryParams } from '@/lib/api/client'
import { useSettings } from '@/lib/config'
import { toCurl } from '@/lib/curl'
import { cn } from '@/lib/utils'

export interface RequestPreviewProps {
  method: string
  /** `/v2`-relative path, e.g. `/scrape`. */
  path: string
  body?: unknown
  query?: QueryParams
  /** Start expanded (default false). */
  defaultOpen?: boolean
  title?: string
  className?: string
}

/** Collapsible panel showing the equivalent cURL command and JSON body for a request. */
export function RequestPreview({
  method,
  path,
  body,
  query,
  defaultOpen = false,
  title = 'Request preview',
  className,
}: RequestPreviewProps) {
  const settings = useSettings()
  const [open, setOpen] = React.useState(defaultOpen)
  const [reveal, setReveal] = React.useState(false)
  const revealId = React.useId()
  // settings is read so the preview re-renders when URL/key change
  const curl = React.useMemo(
    () => toCurl({ method, path, body, query, maskKey: !reveal }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [method, path, body, query, reveal, settings],
  )
  const hasBody = body !== undefined && method.toUpperCase() !== 'GET'

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn('rounded-lg border', className)}>
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium">
        <TerminalIcon className="text-muted-foreground size-4" />
        <span>{title}</span>
        <span className="text-muted-foreground ml-1 truncate font-mono text-xs">
          {method.toUpperCase()} /v2{path.startsWith('/') ? path : `/${path}`}
        </span>
        <ChevronDownIcon
          className={cn('text-muted-foreground ml-auto size-4 transition-transform', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">
        <Tabs defaultValue="curl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="curl">cURL</TabsTrigger>
              {hasBody && <TabsTrigger value="body">JSON body</TabsTrigger>}
            </TabsList>
            <div className="flex items-center gap-2">
              <Switch id={revealId} checked={reveal} onCheckedChange={setReveal} />
              <Label htmlFor={revealId} className="text-muted-foreground text-xs">
                Show API key
              </Label>
            </div>
          </div>
          <TabsContent value="curl">
            <CodeBlock code={curl} language="bash" maxHeight="24rem" />
          </TabsContent>
          {hasBody && (
            <TabsContent value="body">
              <CodeBlock code={JSON.stringify(body, null, 2)} language="json" maxHeight="24rem" />
            </TabsContent>
          )}
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  )
}
