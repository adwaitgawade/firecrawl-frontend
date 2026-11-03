import { ExternalLinkIcon, FileTextIcon, FlameIcon } from 'lucide-react'
import { Link } from 'react-router'

import { CopyButton } from '@/components/shared/CopyButton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ResultActionsProps {
  url?: string
  /** Show "View content" (scraped result). */
  onViewContent?: () => void
  copyLabel?: string
}

/** Open / copy URL / send to Scrape / view scraped content. */
export function ResultActions({ url, onViewContent, copyLabel = 'Copy URL' }: ResultActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      {onViewContent && (
        <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={onViewContent}>
          <FileTextIcon /> View content
        </Button>
      )}
      {url && (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <a href={url} target="_blank" rel="noreferrer" aria-label="Open in new tab">
                  <ExternalLinkIcon />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open</TooltipContent>
          </Tooltip>
          <CopyButton value={url} size="icon-sm" toastMessage="URL copied" aria-label={copyLabel} title={copyLabel} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link to={`/scrape?url=${encodeURIComponent(url)}`} aria-label="Scrape this URL">
                  <FlameIcon />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scrape</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  )
}
