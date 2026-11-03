import * as React from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckIcon, Loader2Icon, SparklesIcon, XIcon } from 'lucide-react'

import { ErrorAlert } from '@/components/shared/ErrorAlert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { isValidUrl } from '@/lib/utils'

import { previewCrawlParams } from '../api'
import { CRAWLER_OPTION_LABELS, formatOptionValue, previewToCrawlerOptions } from '../crawl-form'
import type { CrawlerFormOptions } from '../types'

const PROMPT_EXAMPLES = [
  'Only crawl the blog posts, skip tag and author pages',
  'Crawl the documentation and API reference, max 200 pages',
  'Get product pages but ignore cart, checkout and account pages',
]

export interface PromptPanelProps {
  url: string
  prompt: string
  onPromptChange: (prompt: string) => void
  crawler: CrawlerFormOptions
  /** Apply generated options; `keepPrompt` false also clears the prompt. */
  onApply: (options: CrawlerFormOptions, keepPrompt: boolean) => void
}

export function PromptPanel({ url, prompt, onPromptChange, crawler, onApply }: PromptPanelProps) {
  const id = React.useId()
  const [keepPrompt, setKeepPrompt] = React.useState(false)
  const preview = useMutation({ mutationFn: previewCrawlParams })

  const canPreview = isValidUrl(url) && prompt.trim().length > 0 && !preview.isPending
  const generated = preview.data?.data ? previewToCrawlerOptions(preview.data.data) : undefined
  const rows = generated
    ? (Object.entries(generated) as [keyof CrawlerFormOptions, unknown][]).map(([key, value]) => ({
        key,
        value,
        current: crawler[key],
        changed: formatOptionValue(value) !== formatOptionValue(crawler[key]),
      }))
    : []

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${id}-prompt`} className="text-xs">
            Prompt <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <span className="text-muted-foreground text-xs tabular-nums">{prompt.length.toLocaleString()} / 10,000</span>
        </div>
        <Textarea
          id={`${id}-prompt`}
          rows={2}
          maxLength={10000}
          placeholder="Describe what to crawl in plain English — Firecrawl derives the crawler options for you."
          value={prompt}
          onChange={e => onPromptChange(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          {!prompt &&
            PROMPT_EXAMPLES.map(example => (
              <button
                key={example}
                type="button"
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full border px-2.5 py-0.5 text-xs transition-colors"
                onClick={() => onPromptChange(example)}
              >
                {example}
              </button>
            ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={!canPreview}
            onClick={() => preview.mutate({ url: url.trim(), prompt: prompt.trim() })}
            title={!isValidUrl(url) ? 'Enter a valid URL first' : !prompt.trim() ? 'Write a prompt first' : undefined}
          >
            {preview.isPending ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
            Preview params
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Explicit options below always override prompt-generated ones. Preview to see (and pin) what the prompt produces.
        </p>
      </div>

      {preview.isPending && (
        <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm">
          <Loader2Icon className="size-4 animate-spin" />
          Mapping the site and generating crawler options… this can take a few seconds.
        </div>
      )}

      {preview.isError && <ErrorAlert error={preview.error} title="Could not generate crawler options" />}

      {preview.isSuccess && (
        <div className="bg-muted/30 space-y-3 rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <SparklesIcon className="text-primary size-4" />
            <span className="text-sm font-medium">Generated crawler options</span>
            <Badge variant="secondary">{rows.length} fields</Badge>
            <Button type="button" variant="ghost" size="icon-sm" className="ml-auto" onClick={() => preview.reset()} aria-label="Dismiss preview">
              <XIcon />
            </Button>
          </div>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">The prompt did not produce any specific options — server defaults would apply.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Option</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead className="hidden sm:table-cell">Current form</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(row => (
                    <TableRow key={row.key}>
                      <TableCell className="text-xs font-medium whitespace-nowrap">{CRAWLER_OPTION_LABELS[row.key]}</TableCell>
                      <TableCell className="max-w-xs font-mono text-xs break-all whitespace-normal">
                        {formatOptionValue(row.value)}
                        {row.changed && (
                          <Badge variant="info" className="ml-2">
                            changed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden max-w-xs font-mono text-xs break-all whitespace-normal sm:table-cell">
                        {formatOptionValue(row.current)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              disabled={!generated || rows.length === 0}
              onClick={() => {
                if (generated) onApply(generated, keepPrompt)
                preview.reset()
              }}
            >
              <CheckIcon /> Apply to form
            </Button>
            <div className="flex items-center gap-2">
              <Switch id={`${id}-keep`} checked={keepPrompt} onCheckedChange={setKeepPrompt} />
              <Label htmlFor={`${id}-keep`} className="text-muted-foreground text-xs">
                Keep prompt in the request
              </Label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
