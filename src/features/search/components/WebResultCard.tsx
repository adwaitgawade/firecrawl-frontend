import { Badge } from '@/components/ui/badge'
import type { WebSearchResult } from '@/lib/api/types'

import { hasScrapedContent, hostOf } from '../result-utils'
import { ResultActions } from './ResultActions'

interface WebResultCardProps {
  result: WebSearchResult
  onViewContent: (result: WebSearchResult) => void
}

/** A search-engine style web result. */
export function WebResultCard({ result, onViewContent }: WebResultCardProps) {
  const scraped = hasScrapedContent(result)
  const favicon = typeof result.metadata?.favicon === 'string' ? result.metadata.favicon : undefined
  const snippet = result.highlights || result.description
  return (
    <article className="group hover:bg-muted/30 rounded-lg border p-4 transition-colors">
      <div className="flex items-start gap-3">
        {result.position != null && (
          <span className="text-muted-foreground bg-muted mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums">
            {result.position}
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
            {favicon && <img src={favicon} alt="" className="size-3.5 shrink-0 rounded-sm" loading="lazy" />}
            <span className="truncate font-mono" title={result.url}>
              {hostOf(result.url)}
              <span className="opacity-60">{result.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 80)}</span>
            </span>
          </div>
          <a
            href={result.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary line-clamp-2 text-base font-medium break-words hover:underline"
          >
            {result.title || result.url}
          </a>
          {snippet && <p className="text-muted-foreground line-clamp-3 text-sm break-words">{snippet}</p>}
          {result.answer && (
            <p className="bg-info/10 text-foreground rounded-md px-2 py-1 text-sm">
              <span className="text-info font-medium">Answer: </span>
              {result.answer}
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap gap-1">
              {result.category && <Badge variant="outline">{result.category}</Badge>}
              {scraped && <Badge variant="success">Scraped</Badge>}
            </div>
            <ResultActions url={result.url} onViewContent={scraped ? () => onViewContent(result) : undefined} />
          </div>
        </div>
      </div>
    </article>
  )
}
