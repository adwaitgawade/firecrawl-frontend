import * as React from 'react'
import { Loader2Icon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { getErrorMessage } from '@/components/shared'
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

import { useDeleteSession } from '../api'

interface DeleteSessionButtonProps {
  sessionId: string
  /** Render a compact icon button (table rows). */
  compact?: boolean
  onDeleted?: () => void
}

export function DeleteSessionButton({ sessionId, compact, onDeleted }: DeleteSessionButtonProps) {
  const [open, setOpen] = React.useState(false)
  const del = useDeleteSession()

  const onConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    del.mutate(sessionId, {
      onSuccess: () => {
        toast.success('Session destroyed')
        setOpen(false)
        onDeleted?.()
      },
      onError: err => toast.error(getErrorMessage(err)),
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon-sm" aria-label="Destroy session" className="text-destructive">
            <Trash2Icon />
          </Button>
        ) : (
          <Button variant="outline" className="text-destructive">
            <Trash2Icon /> Destroy
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Destroy this browser session?</AlertDialogTitle>
          <AlertDialogDescription>
            The browser is shut down immediately and billing stops. Recorded replays stay available.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={del.isPending}
            className={buttonVariants({ variant: 'destructive' })}
          >
            {del.isPending && <Loader2Icon className="animate-spin" />}
            Destroy session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
