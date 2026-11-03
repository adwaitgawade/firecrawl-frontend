import { CopyButton } from '@/components/shared/CopyButton'
import { cn } from '@/lib/utils'

export interface CodeBlockProps {
  code: string
  /** Shown as a small label in the corner (no syntax highlighting). */
  language?: string
  /** CSS max-height (default 32rem). Pass `none` for unlimited. */
  maxHeight?: string
  /** Wrap long lines instead of scrolling horizontally. */
  wrap?: boolean
  className?: string
}

export function CodeBlock({ code, language, maxHeight = '32rem', wrap = false, className }: CodeBlockProps) {
  return (
    <div className={cn('bg-muted/50 group relative rounded-lg border', className)}>
      <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
        {language && (
          <span className="text-muted-foreground bg-background/80 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase">
            {language}
          </span>
        )}
        <CopyButton value={code} className="bg-background/80 opacity-80 group-hover:opacity-100" />
      </div>
      <pre
        className={cn(
          'overflow-auto p-4 pr-24 font-mono text-xs leading-relaxed',
          wrap ? 'break-words whitespace-pre-wrap' : 'whitespace-pre',
        )}
        style={{ maxHeight: maxHeight === 'none' ? undefined : maxHeight }}
      >
        <code>{code}</code>
      </pre>
    </div>
  )
}
