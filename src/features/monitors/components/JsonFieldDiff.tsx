import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { FieldDiff } from '../format'

function render(value: unknown): string {
  if (value === undefined) return '—'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export function JsonFieldDiff({ diff }: { diff: FieldDiff }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Field</TableHead>
            <TableHead>Previous</TableHead>
            <TableHead>Current</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(diff).map(([field, { previous, current }]) => (
            <TableRow key={field} className="align-top">
              <TableCell className="font-mono text-xs font-medium">{field}</TableCell>
              <TableCell>
                <pre className="bg-destructive/10 text-destructive max-h-48 overflow-auto rounded px-2 py-1 font-mono text-xs break-words whitespace-pre-wrap">
                  {render(previous)}
                </pre>
              </TableCell>
              <TableCell>
                <pre className="bg-success/10 text-success max-h-48 overflow-auto rounded px-2 py-1 font-mono text-xs break-words whitespace-pre-wrap">
                  {render(current)}
                </pre>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
