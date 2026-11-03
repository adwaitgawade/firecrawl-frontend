import { ExternalLinkIcon } from 'lucide-react'

import { DocumentViewer } from '@/components/shared/DocumentViewer'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Document } from '@/lib/api/types'

interface ScrapedContentSheetProps {
  document: Document | null
  onOpenChange: (open: boolean) => void
}

/** Side sheet showing a scraped search result with the shared DocumentViewer. */
export function ScrapedContentSheet({ document, onOpenChange }: ScrapedContentSheetProps) {
  const url = document?.metadata.sourceURL ?? document?.url
  return (
    <Sheet open={!!document} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-3xl">
        <SheetHeader className="border-b">
          <SheetTitle className="pr-6 break-words">{document?.metadata.title ?? document?.title ?? 'Scraped content'}</SheetTitle>
          {url && (
            <SheetDescription asChild>
              <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate font-mono text-xs hover:underline">
                <ExternalLinkIcon className="size-3 shrink-0" /> <span className="truncate">{url}</span>
              </a>
            </SheetDescription>
          )}
        </SheetHeader>
        <div className="p-4">{document && <DocumentViewer document={document} />}</div>
      </SheetContent>
    </Sheet>
  )
}
