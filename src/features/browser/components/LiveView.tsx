import * as React from 'react'
import { ExternalLinkIcon, MonitorOffIcon, RotateCwIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import type { BrowserSession } from '../types'

export function LiveView({ session }: { session: BrowserSession }) {
  const hasInteractive = !!session.interactiveLiveViewUrl
  const [mode, setMode] = React.useState<'interactive' | 'view'>(hasInteractive ? 'interactive' : 'view')
  const [reloadKey, setReloadKey] = React.useState(0)
  const url = mode === 'interactive' && hasInteractive ? session.interactiveLiveViewUrl : session.liveViewUrl

  if (session.status !== 'active') {
    return (
      <EmptyState
        icon={MonitorOffIcon}
        title="Session is not active"
        description="The live view is only available while the browser is running. Check the Replay tab for recordings."
      />
    )
  }
  if (!url) {
    return (
      <EmptyState
        icon={MonitorOffIcon}
        title="No live view URL"
        description="This session was created without streaming the web view (streamWebView: false)."
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {hasInteractive && session.liveViewUrl && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={mode}
            onValueChange={v => v && setMode(v as 'interactive' | 'view')}
          >
            <ToggleGroupItem value="interactive" className="px-3 text-xs">
              Interactive
            </ToggleGroupItem>
            <ToggleGroupItem value="view" className="px-3 text-xs">
              View only
            </ToggleGroupItem>
          </ToggleGroup>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setReloadKey(k => k + 1)}>
            <RotateCwIcon /> Reload
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLinkIcon /> Open in new tab
            </a>
          </Button>
        </div>
      </div>
      <div className="bg-muted/30 relative aspect-video w-full overflow-hidden rounded-lg border">
        <iframe
          key={`${mode}-${reloadKey}`}
          src={url}
          title="Browser live view"
          className="absolute inset-0 size-full"
          allow="clipboard-read; clipboard-write; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
      <p className="text-muted-foreground text-xs">
        {mode === 'interactive'
          ? 'Interactive mode forwards your clicks and keystrokes to the remote browser.'
          : 'View-only stream of the remote browser.'}
      </p>
    </div>
  )
}
