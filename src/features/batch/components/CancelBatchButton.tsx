import { useMutation } from '@tanstack/react-query'
import { BanIcon, Loader2Icon } from 'lucide-react'
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

import { cancelBatch } from '../api'

interface CancelBatchButtonProps {
  jobId: string
  onCancelled: () => void
}

/** DELETE /v2/batch/scrape/:id behind a confirm dialog. */
export function CancelBatchButton({ jobId, onCancelled }: CancelBatchButtonProps) {
  const mutation = useMutation({
    mutationFn: () => cancelBatch(jobId),
    onSuccess: () => {
      toast.success('Batch job cancelled')
      onCancelled()
    },
    onError: error => toast.error('Could not cancel the job', { description: getErrorMessage(error) }),
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2Icon className="animate-spin" /> : <BanIcon />}
          Cancel job
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this batch scrape?</AlertDialogTitle>
          <AlertDialogDescription>
            Queued URLs won&apos;t be scraped. Pages that already finished stay available until the job expires.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep running</AlertDialogCancel>
          <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={() => mutation.mutate()}>
            Cancel job
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
