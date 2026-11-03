import { Loader2Icon } from 'lucide-react'

/** Suspense fallback for lazily-loaded routes. */
export function RouteFallback() {
  return (
    <div className="text-muted-foreground flex min-h-[40vh] items-center justify-center gap-2 text-sm">
      <Loader2Icon className="size-4 animate-spin" /> Loading…
    </div>
  )
}
