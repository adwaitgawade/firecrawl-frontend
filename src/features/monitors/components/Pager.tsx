import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

/** Offset pager for endpoints that return a page of `limit` items with no total count. */
export function Pager({
  offset,
  limit,
  count,
  onChange,
  disabled,
}: {
  offset: number
  limit: number
  count: number
  onChange: (offset: number) => void
  disabled?: boolean
}) {
  if (offset === 0 && count < limit) return null
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">
        {count === 0 ? 'No results' : `Showing ${offset + 1}–${offset + count}`}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={disabled || offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
          <ChevronLeftIcon /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={disabled || count < limit} onClick={() => onChange(offset + limit)}>
          Next <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}
