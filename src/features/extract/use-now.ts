import * as React from 'react'

/** Current time (epoch ms), re-rendering every `intervalMs` while `enabled`. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (!enabled) return
    const tick = () => setNow(Date.now())
    const t = window.setInterval(tick, intervalMs)
    const first = window.setTimeout(tick, 0)
    return () => {
      window.clearInterval(t)
      window.clearTimeout(first)
    }
  }, [intervalMs, enabled])
  return now
}
