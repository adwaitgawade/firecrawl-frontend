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

import { useDeleteMonitor } from '../api'

interface DeleteMonitorButtonProps {
  monitorId: string
  name: string
  compact?: boolean
  onDeleted?: () => void
}

export function DeleteMonitorButton({ monitorId, name, compact, onDeleted }: DeleteMonitorButtonProps) {
  const [open, setOpen] = React.useState(false)
  const del = useDeleteMonitor()

  const onConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    del.mutate(monitorId, {
      onSuccess: () => {
        toast.success(`Deleted “${name}”`)
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
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${name}`}>
            <Trash2Icon />
          </Button>
        ) : (
          <Button variant="outline" className="text-destructive">
            <Trash2Icon /> Delete
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Scheduled checks stop immediately. The monitor and its check history will no longer be accessible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={del.isPending} className={buttonVariants({ variant: 'destructive' })}>
            {del.isPending && <Loader2Icon className="animate-spin" />}
            Delete monitor
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
