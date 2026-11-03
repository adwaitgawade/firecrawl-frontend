import { ExternalLinkIcon } from 'lucide-react'

import { shortUrl } from '@/lib/utils'

interface ExtractSourcesProps {
  sources: Record<string, string[]>
}

/** Field path → source URLs, as returned when `showSources` is enabled. */
export function ExtractSources({ sources }: ExtractSourcesProps) {
  const entries = Object.entries(sources).filter(([, urls]) => Array.isArray(urls) && urls.length > 0)
  if (!entries.length) {
    return <p className="text-muted-foreground text-sm">No sources were reported for this job.</p>
  }
  return (
    <dl className="divide-y rounded-lg border">
      {entries.map(([field, urls]) => (
        <div key={field} className="grid gap-1 px-3 py-2 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-4">
          <dt className="truncate font-mono text-xs font-medium" title={field}>
            {field}
          </dt>
          <dd className="space-y-0.5">
            {urls.map(u => (
              <a
                key={u}
                href={u}
                target="_blank"
                rel="noreferrer"
                className="text-primary flex items-center gap-1 truncate text-xs hover:underline"
                title={u}
              >
                <ExternalLinkIcon className="size-3 shrink-0" />
                <span className="truncate">{shortUrl(u)}</span>
              </a>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  )
}
