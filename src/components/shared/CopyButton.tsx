import * as React from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn, copyToClipboard } from '@/lib/utils'

export interface CopyButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'value' | 'onClick' | 'children'> {
  /** Text to copy, or a function producing it lazily. */
  value: string | (() => string)
  /** Optional visible label; icon-only when omitted. */
  label?: string
  /** Toast message on success (set to false to disable). */
  toastMessage?: string | false
}

export function CopyButton({
  value,
  label,
  toastMessage = 'Copied to clipboard',
  variant = 'ghost',
  size,
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const onClick = async () => {
    const text = typeof value === 'function' ? value() : value
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      if (toastMessage) toast.success(toastMessage)
    } else {
      toast.error('Could not copy to clipboard')
    }
  }

  const Icon = copied ? CheckIcon : CopyIcon
  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (label ? 'sm' : 'icon-sm')}
      className={cn(className)}
      onClick={onClick}
      aria-label={label ?? 'Copy'}
      title={label ?? 'Copy'}
      {...props}
    >
      <Icon className={cn(copied && 'text-success')} />
      {label}
    </Button>
  )
}
