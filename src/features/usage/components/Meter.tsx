import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface MeterProps {
  /** 0..1 (values outside are clamped). */
  ratio: number
  /** Accessible label, e.g. "Concurrency 3 of 10". */
  label: string
  /** When true, a high ratio is bad (fill turns warning → destructive). Otherwise it is neutral. */
  severity?: boolean
  className?: string
}

/** Thin meter whose fill carries severity; the track is a lighter step of the same hue. */
export function Meter({ ratio, label, severity = true, className }: MeterProps) {
  const clamped = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0
  const tone = !severity || clamped < 0.7 ? 'primary' : clamped < 0.9 ? 'warning' : 'destructive'
  return (
    <Progress
      value={clamped * 100}
      aria-label={label}
      className={cn(
        'h-1.5',
        tone === 'primary' && 'bg-primary/15',
        tone === 'warning' && 'bg-warning/20',
        tone === 'destructive' && 'bg-destructive/20',
        className,
      )}
      indicatorClassName={cn(
        tone === 'primary' && 'bg-primary',
        tone === 'warning' && 'bg-warning',
        tone === 'destructive' && 'bg-destructive',
      )}
    />
  )
}
