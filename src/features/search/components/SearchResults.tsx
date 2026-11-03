import * as React from 'react'
import { BracesIcon, SearchXIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { JsonViewer } from '@/components/shared/JsonViewer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Document, NewsSearchResult, WebSearchResult } from '@/lib/api/types'

import { GROUP_LABELS, resultGroups, toDocument } from '../result-utils'
import type { ResultGroup, TimedSearchResponse } from '../types'
import { ImageResultGrid } from './ImageResultGrid'
import { NewsResultCard } from './NewsResultCard'
import { ScrapedContentSheet } from './ScrapedContentSheet'
import { WebResultCard } from './WebResultCard'

interface SearchResultsProps {
  response: TimedSearchResponse
}

/** Results grouped by source in tabs, plus a raw JSON tab. */
export function SearchResults({ response }: SearchResultsProps) {
  const groups = resultGroups(response.data)
  const [tab, setTab] = React.useState<string | undefined>(undefined)
  const [doc, setDoc] = React.useState<Document | null>(null)

  // Reset to the first tab whenever a new response arrives.
  const [prevResponse, setPrevResponse] = React.useState(response)
  if (prevResponse !== response) {
    setPrevResponse(response)
    setTab(undefined)
    setDoc(null)
  }

  const { durationMs: _durationMs, ...raw } = response
  const open = (r: WebSearchResult | NewsSearchResult) => setDoc(toDocument(r))
  const active = tab ?? groups[0]?.group ?? 'raw'

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="No results"
        description="Try a broader query, a different time range, or other sources."
      />
    )
  }

  const renderGroup = (group: ResultGroup) => {
    const data = response.data
    switch (group) {
      case 'images':
        return <ImageResultGrid results={data.images ?? []} />
      case 'news':
        return (
          <div className="space-y-3">
            {(data.news ?? []).map((r, i) => (
              <NewsResultCard key={`${r.url}-${i}`} result={r} onViewContent={open} />
            ))}
          </div>
        )
      case 'web':
      case 'developer':
        return (
          <div className="space-y-3">
            {(data[group] ?? []).map((r, i) => (
              <WebResultCard key={`${r.url}-${i}`} result={r} onViewContent={open} />
            ))}
          </div>
        )
    }
  }

  return (
    <>
      <Tabs value={active} onValueChange={setTab} className="gap-4">
        <TabsList className="max-w-full overflow-x-auto">
          {groups.map(g => (
            <TabsTrigger key={g.group} value={g.group}>
              {GROUP_LABELS[g.group]}
              <span className="text-muted-foreground text-xs tabular-nums">{g.count}</span>
            </TabsTrigger>
          ))}
          <TabsTrigger value="raw">
            <BracesIcon /> JSON
          </TabsTrigger>
        </TabsList>
        {groups.map(g => (
          <TabsContent key={g.group} value={g.group}>
            {renderGroup(g.group)}
          </TabsContent>
        ))}
        <TabsContent value="raw">
          <JsonViewer data={raw} collapsed={2} filename={`search-${response.id ?? 'results'}.json`} />
        </TabsContent>
      </Tabs>
      <ScrapedContentSheet document={doc} onOpenChange={o => !o && setDoc(null)} />
    </>
  )
}
