import * as React from 'react'
import { ChevronDownIcon, TerminalIcon } from 'lucide-react'

import { CodeBlock } from '@/components/shared/CodeBlock'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { buildUrl } from '@/lib/api/client'
import { maskApiKey, useSettings } from '@/lib/config'
import { cn } from '@/lib/utils'

import type { ParseOptions } from '../types'

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

/** cURL preview for the multipart `POST /v2/parse` flow (RequestPreview only handles JSON bodies). */
export function MultipartRequestPreview({
  filename,
  options,
}: {
  filename: string
  options: Partial<ParseOptions>
}) {
  const settings = useSettings()
  const [open, setOpen] = React.useState(false)
  // settings is read so the preview updates when the API URL / key change
  const url = React.useMemo(() => buildUrl('/parse'), [settings]) // eslint-disable-line react-hooks/exhaustive-deps
  const key = settings.apiKey ? maskApiKey(settings.apiKey) : 'YOUR_API_KEY'
  const lines = [
    `curl -X POST ${shellQuote(url)}`,
    `-H ${shellQuote(`Authorization: Bearer ${key}`)}`,
    `-F ${shellQuote(`file=@${filename}`)}`,
  ]
  if (Object.keys(options).length > 0) lines.push(`-F ${shellQuote(`options=${JSON.stringify(options)}`)}`)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium">
        <TerminalIcon className="text-muted-foreground size-4" />
        <span>Request preview</span>
        <span className="text-muted-foreground ml-1 truncate font-mono text-xs">POST /v2/parse (multipart)</span>
        <ChevronDownIcon className={cn('text-muted-foreground ml-auto size-4 transition-transform', open && 'rotate-180')} />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">
        <CodeBlock code={lines.join(' \\\n  ')} language="bash" maxHeight="24rem" />
      </CollapsibleContent>
    </Collapsible>
  )
}
