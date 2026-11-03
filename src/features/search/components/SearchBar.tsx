import { Loader2Icon, SearchIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  loading?: boolean
  className?: string
}

/** Big search-engine style query input with a submit button (submits the enclosing form). */
export function SearchBar({ value, onChange, loading, className }: SearchBarProps) {
  return (
    <div
      className={cn(
        'bg-background focus-within:border-ring focus-within:ring-ring/40 flex items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-4 shadow-sm transition-shadow focus-within:ring-[3px]',
        className,
      )}
    >
      <SearchIcon className="text-muted-foreground size-5 shrink-0" />
      <input
        type="search"
        value={value}
        autoFocus
        aria-label="Search query"
        placeholder="Search the web…"
        onChange={e => onChange(e.target.value)}
        className="placeholder:text-muted-foreground h-10 min-w-0 flex-1 bg-transparent text-base outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <Button type="button" variant="ghost" size="icon-sm" className="rounded-full" aria-label="Clear" onClick={() => onChange('')}>
          <XIcon />
        </Button>
      )}
      <Button type="submit" className="rounded-full px-5" disabled={loading || !value.trim()}>
        {loading ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
        <span className="hidden sm:inline">Search</span>
      </Button>
    </div>
  )
}
