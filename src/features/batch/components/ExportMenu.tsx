import * as React from 'react'
import { ChevronDownIcon, DownloadIcon, FileJsonIcon, FileTextIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/components/shared/ErrorAlert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { downloadFile } from '@/lib/utils'

import { fetchAllBatchDocuments } from '../api'
import { documentsToMarkdown } from '../request'

interface ExportMenuProps {
  jobId: string
  disabled?: boolean
  /** Shown as a hint when the job is still running (export is a snapshot). */
  isScraping?: boolean
}

type ExportFormat = 'json' | 'markdown'

/** Fetches every result page and downloads one JSON file or one concatenated markdown file. */
export function ExportMenu({ jobId, disabled, isScraping }: ExportMenuProps) {
  const [busy, setBusy] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => () => abortRef.current?.abort(), [])

  const run = async (format: ExportFormat) => {
    const controller = new AbortController()
    abortRef.current = controller
    setBusy(true)
    const toastId = toast.loading('Fetching results…')
    try {
      const docs = await fetchAllBatchDocuments(
        jobId,
        n => toast.loading(`Fetching results… ${n} loaded`, { id: toastId }),
        controller.signal,
      )
      if (docs.length === 0) {
        toast.info('Nothing to export yet', { id: toastId })
        return
      }
      const short = jobId.slice(0, 8)
      if (format === 'json') {
        downloadFile(`batch-${short}.json`, JSON.stringify(docs, null, 2), 'application/json')
      } else {
        downloadFile(`batch-${short}.md`, documentsToMarkdown(docs), 'text/markdown;charset=utf-8')
      }
      toast.success(`Exported ${docs.length} document${docs.length === 1 ? '' : 's'}`, { id: toastId })
    } catch (e) {
      toast.error('Export failed', { id: toastId, description: getErrorMessage(e) })
    } finally {
      setBusy(false)
      abortRef.current = null
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || busy}>
          {busy ? <Loader2Icon className="animate-spin" /> : <DownloadIcon />}
          Export
          <ChevronDownIcon className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {isScraping ? 'Snapshot of results so far' : 'All results'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void run('json')}>
          <FileJsonIcon /> JSON (all documents)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void run('markdown')}>
          <FileTextIcon /> Markdown (concatenated)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
