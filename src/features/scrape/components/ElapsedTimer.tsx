import * as React from 'react'

import { formatDuration } from '@/lib/utils'

/** Live "12.3s" counter since an ISO timestamp. */
export function ElapsedTimer({ since, className }: { since: string; className?: string }) {
  const start = React.useMemo(() => new Date(since).getTime(), [since])
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [])
  return <span className={className}>{formatDuration(Math.max(0, now - start))}</span>
}
