import { useMutation } from '@tanstack/react-query'
import { BanIcon, DownloadIcon, FileJsonIcon, FileTextIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/components/shared/ErrorAlert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Document } from '@/lib/api/types'
import { updateJob } from '@/lib/job-history'

import { cancelCrawl } from '../api'
import { exportDocuments } from '../documents'

export function CancelCrawlButton({ jobId, onCancelled }: { jobId: string; onCancelled: () => void }) {
  const mutation = useMutation({
    mutationFn: () => cancelCrawl(jobId),
    onSuccess: () => {
      updateJob(jobId, { status: 'cancelled' })
      toast.success('Crawl cancelled')
      onCancelled()
    },
    onError: err => toast.error(`Could not cancel: ${getErrorMessage(err)}`),
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={mutation.isPending} className="text-destructive hover:text-destructive">
          {mutation.isPending ? <Loader2Icon className="animate-spin" /> : <BanIcon />}
          Cancel crawl
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this crawl?</AlertDialogTitle>
          <AlertDialogDescription>
            Queued pages will not be scraped. Pages already scraped stay available until the results expire.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep running</AlertDialogCancel>
          <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={() => mutation.mutate()}>
            Cancel crawl
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ExportMenu({ jobId, documents, partial }: { jobId: string; documents: Document[]; partial: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={documents.length === 0}>
          <DownloadIcon /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {documents.length} loaded page{documents.length === 1 ? '' : 's'}
          {partial ? ' (load more to include the rest)' : ''}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => exportDocuments(jobId, documents, 'json')}>
          <FileJsonIcon /> JSON (full documents)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => exportDocuments(jobId, documents, 'markdown')}>
          <FileTextIcon /> Markdown (concatenated)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
