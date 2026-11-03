import { DownloadIcon } from 'lucide-react'

import { CopyButton } from '@/components/shared/CopyButton'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadFile, isValidUrl } from '@/lib/utils'

import { formatCell, toCsv, type TabularCandidate } from '../data-table'

interface DataTableProps {
  candidate: TabularCandidate
  filename?: string
}

/** Renders an array of flat objects as a table with CSV copy/download. */
export function DataTable({ candidate, filename = 'data.csv' }: DataTableProps) {
  const { rows, columns } = candidate
  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
        <span className="text-muted-foreground text-xs">
          {rows.length} row{rows.length === 1 ? '' : 's'} × {columns.length} column{columns.length === 1 ? '' : 's'}
          {candidate.path && (
            <>
              {' '}
              from <code className="font-mono">{candidate.path}</code>
            </>
          )}
        </span>
        <div className="flex gap-1">
          <CopyButton value={() => toCsv(candidate)} label="CSV" size="sm" className="h-7 text-xs" toastMessage="CSV copied" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => downloadFile(filename, toCsv(candidate), 'text/csv;charset=utf-8')}
          >
            <DownloadIcon /> Download
          </Button>
        </div>
      </div>
      <div className="max-h-[32rem] overflow-auto">
        <Table>
          <TableHeader className="bg-muted/40 sticky top-0">
            <TableRow>
              <TableHead className="text-muted-foreground w-10 text-right">#</TableHead>
              {columns.map(col => (
                <TableHead key={col} className="font-mono text-xs">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground text-right text-xs tabular-nums">{i + 1}</TableCell>
                {columns.map(col => {
                  const text = formatCell(row[col])
                  return (
                    <TableCell key={col} className="max-w-[24rem] align-top text-xs whitespace-normal break-words">
                      {typeof row[col] === 'string' && isValidUrl(text) ? (
                        <a href={text} target="_blank" rel="noreferrer" className="text-primary font-mono hover:underline">
                          {text}
                        </a>
                      ) : typeof row[col] === 'boolean' ? (
                        <code className="font-mono">{text}</code>
                      ) : (
                        text || <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
