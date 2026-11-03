import { StatusBadge } from '@/components/shared/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { URLTrace } from '@/lib/api/types'
import { formatNumber, shortUrl } from '@/lib/utils'

/** Per-URL trace (`urlTrace: true`): status, relevance, tokens, whether it was used. */
export function UrlTraceTable({ trace }: { trace: URLTrace[] }) {
  return (
    <div className="max-h-[28rem] overflow-auto rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/40 sticky top-0">
          <TableRow>
            <TableHead>URL</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Relevance</TableHead>
            <TableHead className="text-right">Tokens</TableHead>
            <TableHead>Used</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trace.map((t, i) => (
            <TableRow key={`${t.url}-${i}`}>
              <TableCell className="max-w-[22rem]">
                <a href={t.url} target="_blank" rel="noreferrer" className="block truncate font-mono text-xs hover:underline" title={t.url}>
                  {shortUrl(t.url)}
                </a>
                {(t.error || t.warning) && (
                  <p className={t.error ? 'text-destructive text-[11px]' : 'text-warning text-[11px]'}>{t.error ?? t.warning}</p>
                )}
              </TableCell>
              <TableCell>
                <StatusBadge status={t.status === 'scraped' ? 'completed' : t.status === 'error' ? 'failed' : 'pending'} className="text-[10px]" />
                <span className="text-muted-foreground ml-1 text-[11px]">{t.status}</span>
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums">
                {t.relevanceScore != null ? t.relevanceScore.toFixed(2) : '—'}
              </TableCell>
              <TableCell className="text-right text-xs tabular-nums">{formatNumber(t.contentStats?.tokensUsed)}</TableCell>
              <TableCell className="text-xs">{t.usedInCompletion == null ? '—' : t.usedInCompletion ? 'Yes' : 'No'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
