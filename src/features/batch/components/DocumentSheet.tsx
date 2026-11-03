import { ExternalLinkIcon } from 'lucide-react'

import { DocumentViewer } from '@/components/shared/DocumentViewer'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Document } from '@/lib/api/types'

interface DocumentSheetProps {
  doc: Document | null
  onClose: () => void
}

/** Side drawer with the full DocumentViewer for one batch result. */
export function DocumentSheet({ doc, onClose }: DocumentSheetProps) {
  const url = doc ? (doc.metadata?.sourceURL ?? doc.metadata?.url ?? doc.url) : undefined
  return (
    <Sheet open={!!doc} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full gap-0 sm:max-w-3xl">
        {doc && (
          <>
            <SheetHeader className="border-b pr-12">
              <SheetTitle className="flex min-w-0 items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {doc.metadata?.statusCode || '—'}
                </Badge>
                <span className="truncate">{doc.metadata?.title || 'Untitled page'}</span>
              </SheetTitle>
              <SheetDescription asChild>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground inline-flex max-w-full items-center gap-1 font-mono text-xs"
                  >
                    <span className="truncate">{url}</span>
                    <ExternalLinkIcon className="size-3 shrink-0" />
                  </a>
                ) : (
                  <span />
                )}
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {typeof doc.metadata?.error === 'string' && (
                <p className="text-destructive mb-3 text-sm">{doc.metadata.error}</p>
              )}
              <DocumentViewer key={doc.metadata?.scrapeId ?? url} document={doc} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
