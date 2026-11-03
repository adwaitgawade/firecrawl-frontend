import { ExternalLinkIcon, ScanTextIcon } from 'lucide-react'
import { Link } from 'react-router'

import { CopyButton } from '@/components/shared/CopyButton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

/** Per-link actions: scrape (deep link), open, copy. */
export function LinkActions({ url }: { url: string }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to={`/scrape?url=${encodeURIComponent(url)}`} aria-label="Scrape this URL">
              <ScanTextIcon />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Scrape</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={url} target="_blank" rel="noreferrer" aria-label="Open in a new tab">
              <ExternalLinkIcon />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Open</TooltipContent>
      </Tooltip>
      <CopyButton value={url} size="icon-sm" toastMessage="URL copied" />
    </div>
  )
}
