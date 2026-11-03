import * as React from 'react'
import { BracesIcon, FileTextIcon, InboxIcon, TableIcon } from 'lucide-react'

import { EmptyState } from '@/components/shared/EmptyState'
import { JsonViewer } from '@/components/shared/JsonViewer'
import { MarkdownView } from '@/components/shared/MarkdownView'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { findTabularData, isEmptyData } from '../data-table'
import { DataTable } from './DataTable'

interface DataResultViewProps {
  data: unknown
  /** Base filename (without extension) for downloads. */
  filename?: string
  emptyTitle?: string
  emptyDescription?: string
}

/** Shows extracted data as JSON, plus a table when it contains arrays of flat objects, or markdown for text. */
export function DataResultView({
  data,
  filename = 'result',
  emptyTitle = 'No data returned',
  emptyDescription = 'The job finished without producing any data.',
}: DataResultViewProps) {
  const candidates = React.useMemo(() => findTabularData(data), [data])
  const [selectedPath, setSelectedPath] = React.useState<string | undefined>(undefined)
  const candidate = candidates.find(c => c.path === selectedPath) ?? candidates[0]
  const isText = typeof data === 'string'

  if (isEmptyData(data)) {
    return <EmptyState icon={InboxIcon} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <Tabs defaultValue={isText ? 'text' : candidate ? 'table' : 'json'} className="gap-3">
      <TabsList>
        {isText && (
          <TabsTrigger value="text">
            <FileTextIcon /> Text
          </TabsTrigger>
        )}
        {candidate && (
          <TabsTrigger value="table">
            <TableIcon /> Table
          </TabsTrigger>
        )}
        <TabsTrigger value="json">
          <BracesIcon /> JSON
        </TabsTrigger>
      </TabsList>
      {isText && (
        <TabsContent value="text">
          <div className="rounded-lg border p-4">
            <MarkdownView markdown={data} />
          </div>
        </TabsContent>
      )}
      {candidate && (
        <TabsContent value="table" className="space-y-2">
          {candidates.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Array</span>
              <Select value={candidate.path} onValueChange={setSelectedPath}>
                <SelectTrigger size="sm" className="font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map(c => (
                    <SelectItem key={c.path} value={c.path} className="font-mono text-xs">
                      {c.path} ({c.rows.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DataTable candidate={candidate} filename={`${filename}${candidate.path ? `-${candidate.path}` : ''}.csv`} />
        </TabsContent>
      )}
      <TabsContent value="json">
        <JsonViewer data={data} filename={`${filename}.json`} collapsed={3} />
      </TabsContent>
    </Tabs>
  )
}
