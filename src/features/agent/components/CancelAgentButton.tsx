import { useMutation } from '@tanstack/react-query'
import { Loader2Icon, SquareIcon } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { isFirecrawlApiError } from '@/lib/api/client'

import { cancelAgent } from '../api'

interface CancelAgentButtonProps {
  jobId: string
  /** Called after the API accepted the cancel (or reported it was already cancelled). */
  onCancelled: () => void
  /** Called when the API says the agent already finished (409). */
  onAlreadyFinished?: () => void
}

/** Confirm dialog → `DELETE /v2/agent/:jobId`. */
export function CancelAgentButton({ jobId, onCancelled, onAlreadyFinished }: CancelAgentButtonProps) {
  const mutation = useMutation({
    mutationFn: () => cancelAgent(jobId),
    onSuccess: () => {
      toast.success('Agent cancelled')
      onCancelled()
    },
    onError: err => {
      if (isFirecrawlApiError(err) && err.status === 409) {
        if (/cancel/i.test(err.message)) {
          toast.info(err.message)
          onCancelled()
        } else {
          toast.info(err.message || 'Agent already finished')
          onAlreadyFinished?.()
        }
        return
      }
      toast.error('Could not cancel agent', { description: getErrorMessage(err) })
    },
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2Icon className="animate-spin" /> : <SquareIcon />}
          Cancel agent
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this agent run?</AlertDialogTitle>
          <AlertDialogDescription>
            The agent stops working on the task. Credits already consumed are not refunded and no result will be
            produced.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep running</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutation.mutate()}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            Cancel agent
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
