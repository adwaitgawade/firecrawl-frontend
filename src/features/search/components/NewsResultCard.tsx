import { CalendarIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { NewsSearchResult } from '@/lib/api/types'

import { hasScrapedContent, hostOf } from '../result-utils'
import { ResultActions } from './ResultActions'

interface NewsResultCardProps {
  result: NewsSearchResult
  onViewContent: (result: NewsSearchResult) => void
}

export function NewsResultCard({ result, onViewContent }: NewsResultCardProps) {
  const scraped = hasScrapedContent(result)
  const snippet = result.highlights || result.snippet
  return (
    <article className="hover:bg-muted/30 flex gap-4 rounded-lg border p-4 transition-colors">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="text-foreground font-medium">{hostOf(result.url)}</span>
          {result.date && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3" /> {result.date}
            </span>
          )}
          {result.position != null && <span className="tabular-nums">#{result.position}</span>}
        </div>
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="text-primary line-clamp-2 font-medium break-words hover:underline"
        >
          {result.title || result.url}
        </a>
        {snippet && <p className="text-muted-foreground line-clamp-3 text-sm">{snippet}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex gap-1">
            {result.category && <Badge variant="outline">{result.category}</Badge>}
            {scraped && <Badge variant="success">Scraped</Badge>}
          </div>
          <ResultActions url={result.url} onViewContent={scraped ? () => onViewContent(result) : undefined} />
        </div>
      </div>
      {result.imageUrl && (
        <img
          src={result.imageUrl}
          alt=""
          loading="lazy"
          className="bg-muted hidden size-24 shrink-0 rounded-md object-cover sm:block"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
      )}
    </article>
  )
}
