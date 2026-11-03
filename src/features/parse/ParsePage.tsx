import * as React from 'react'
import { FileScanIcon, Loader2Icon, PlayIcon, RotateCcwIcon, SquareIcon } from 'lucide-react'
import { toast } from 'sonner'

import {
  DocumentViewer,
  EmptyState,
  ErrorAlert,
  FormatSelector,
  PageHeader,
  RequestPreview,
  ScrapeOptionsForm,
  cleanScrapeOptions,
  defaultScrapeOptions,
  validateFormats,
} from '@/components/shared'
import type { ScrapeOptionsField } from '@/components/shared'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { isFirecrawlApiError } from '@/lib/api/client'
import type { Document, FormatInput, FormatType, ScrapeOptions } from '@/lib/api/types'
import { addJob } from '@/lib/job-history'
import { formatNumber } from '@/lib/utils'

import { parseMultipart, parseUploadRef, requestUploadUrl, uploadToTarget, uploadUrlBody } from './api'
import { FileDropzone } from './components/FileDropzone'
import { MultipartRequestPreview } from './components/MultipartRequestPreview'
import { ParseProgress } from './components/ParseProgress'
import type { ParseMode, ParseOptions, ParseRequestBody, ParseRunState } from './types'

/** Formats that make sense for uploaded files (the controller rejects screenshot/branding/changeTracking). */
const PARSE_FORMAT_TYPES: FormatType[] = [
  'markdown',
  'html',
  'rawHtml',
  'links',
  'images',
  'summary',
  'json',
  'attributes',
  'question',
  'highlights',
]

/** Scrape options that parse rejects or that don't apply to uploaded files. */
const HIDDEN_FIELDS: ScrapeOptionsField[] = [
  'actions',
  'waitFor',
  'mobile',
  'location',
  'proxy',
  'headers',
  'skipTlsVerification',
  'maxAge',
  'minAge',
  'storeInCache',
  'blockAds',
  'fastMode',
  'profile',
]

const STORAGE_ERROR_CODES = new Set(['PARSE_UPLOAD_REF_SECRET_MISSING', 'PARSE_UPLOAD_STORAGE_DISABLED'])

const initialOptions: ScrapeOptions = (() => {
  const { formats: _formats, ...rest } = defaultScrapeOptions
  return rest
})()

function buildParseOptions(options: ScrapeOptions, formats: FormatInput[]): Partial<ParseOptions> {
  const cleaned = cleanScrapeOptions({ ...options, formats }) as Record<string, unknown>
  for (const field of HIDDEN_FIELDS) delete cleaned[field]
  // markdown is the server default; omit to keep the body minimal
  if (formats.length === 1 && formats[0] === 'markdown') delete cleaned.formats
  return cleaned as Partial<ParseOptions>
}

export function ParsePage() {
  const [file, setFile] = React.useState<File | null>(null)
  const [mode, setMode] = React.useState<ParseMode>('signed')
  const [formats, setFormats] = React.useState<FormatInput[]>(['markdown'])
  const [options, setOptions] = React.useState<ScrapeOptions>(initialOptions)
  const [run, setRun] = React.useState<ParseRunState>({ phase: 'idle' })
  const [result, setResult] = React.useState<{ doc: Document; warning?: string; filename: string } | null>(null)
  const [uploadRef, setUploadRef] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  const parseOptions = React.useMemo(() => buildParseOptions(options, formats), [options, formats])
  const formatErrors = validateFormats(formats)
  const running = run.phase === 'running'
  const requestBody: ParseRequestBody = { uploadRef: uploadRef ?? '<uploadRef from /parse/upload-url>', ...parseOptions }

  const start = async (runMode: ParseMode = mode) => {
    if (!file) return
    const controller = new AbortController()
    abortRef.current = controller
    const { signal } = controller
    const started = performance.now()
    setResult(null)
    let step: 'upload-url' | 'upload' | 'parse' = runMode === 'signed' ? 'upload-url' : 'upload'
    setRun({ phase: 'running', step })
    try {
      let response
      if (runMode === 'signed') {
        const target = await requestUploadUrl(file, signal)
        setUploadRef(target.uploadRef)
        step = 'upload'
        setRun({ phase: 'running', step, progress: 0 })
        await uploadToTarget(target, file, {
          signal,
          onProgress: p => setRun({ phase: 'running', step: 'upload', progress: p }),
        })
        step = 'parse'
        setRun({ phase: 'running', step })
        response = await parseUploadRef({ uploadRef: target.uploadRef, ...parseOptions }, signal)
      } else {
        setRun({ phase: 'running', step, progress: 0 })
        response = await parseMultipart(file, parseOptions, {
          signal,
          onProgress: p => {
            if (p >= 1) {
              step = 'parse'
              setRun({ phase: 'running', step })
            } else {
              setRun({ phase: 'running', step: 'upload', progress: p })
            }
          },
        })
      }
      setRun({ phase: 'done', durationMs: performance.now() - started })
      setResult({ doc: response.data, warning: response.warning, filename: file.name })
      addJob({
        kind: 'parse',
        id: response.data.metadata?.scrapeId ?? response.scrape_id ?? crypto.randomUUID(),
        label: file.name,
        status: 'completed',
      })
      toast.success(`Parsed ${file.name}`)
    } catch (error) {
      if (isFirecrawlApiError(error) && error.code === 'ABORTED') {
        setRun({ phase: 'idle' })
        toast.info('Parse cancelled')
      } else {
        setRun({ phase: 'error', step, error })
      }
    } finally {
      abortRef.current = null
    }
  }

  const cancel = () => abortRef.current?.abort()

  const reset = () => {
    setFile(null)
    setResult(null)
    setUploadRef(null)
    setRun({ phase: 'idle' })
  }

  const storageUnavailable =
    run.phase === 'error' && isFirecrawlApiError(run.error) && !!run.error.code && STORAGE_ERROR_CODES.has(run.error.code)

  const meta = result?.doc.metadata

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileScanIcon}
        title="Parse"
        description="Upload a PDF, Word, spreadsheet or HTML file and turn it into clean markdown or structured data."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File</CardTitle>
              <CardDescription>Files are uploaded, parsed once, then deleted from storage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileDropzone
                file={file}
                disabled={running}
                onFileChange={f => {
                  setFile(f)
                  setUploadRef(null)
                  if (run.phase !== 'running') setRun({ phase: 'idle' })
                }}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">Upload method</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  value={mode}
                  disabled={running}
                  onValueChange={v => {
                    if (!v) return
                    setMode(v as ParseMode)
                    setRun({ phase: 'idle' })
                  }}
                  className="w-full"
                >
                  <ToggleGroupItem value="signed" className="flex-1 text-xs">
                    Upload URL (3 steps)
                  </ToggleGroupItem>
                  <ToggleGroupItem value="multipart" className="flex-1 text-xs">
                    Direct multipart
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-muted-foreground text-xs">
                  {mode === 'signed'
                    ? 'Mints a signed upload URL, uploads the bytes, then parses by uploadRef. Requires upload storage on the server.'
                    : 'Sends the file and options in a single multipart/form-data request.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Output formats</CardTitle>
            </CardHeader>
            <CardContent>
              <FormatSelector value={formats} onChange={setFormats} allowed={PARSE_FORMAT_TYPES} />
            </CardContent>
          </Card>

          <ScrapeOptionsForm value={options} onChange={setOptions} hide={HIDDEN_FIELDS} title="Parse options" />

          <div className="flex gap-2">
            {running ? (
              <Button type="button" variant="outline" className="flex-1" onClick={cancel}>
                <SquareIcon /> Cancel
              </Button>
            ) : (
              <Button
                type="button"
                className="flex-1"
                disabled={!file || formatErrors.length > 0}
                onClick={() => void start()}
              >
                <PlayIcon /> Parse file
              </Button>
            )}
            {(file || result) && !running && (
              <Button type="button" variant="ghost" onClick={reset}>
                <RotateCcwIcon /> Reset
              </Button>
            )}
          </div>

          {mode === 'signed' ? (
            <div className="space-y-2">
              <RequestPreview
                method="POST"
                path="/parse/upload-url"
                body={file ? uploadUrlBody(file) : { filename: 'document.pdf' }}
                title="Step 1"
              />
              <RequestPreview method="POST" path="/parse" body={requestBody} title="Step 3" />
            </div>
          ) : (
            <MultipartRequestPreview filename={file?.name ?? 'document.pdf'} options={parseOptions} />
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {run.phase !== 'idle' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {running && <Loader2Icon className="text-primary size-4 animate-spin" />}
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ParseProgress mode={mode} state={run} />
                {run.phase === 'error' && (
                  <ErrorAlert error={run.error} title="Parse failed" onRetry={() => void start()} />
                )}
                {storageUnavailable && (
                  <Alert variant="info">
                    <AlertTitle>Upload storage isn&apos;t configured on this server</AlertTitle>
                    <AlertDescription>
                      <p>The direct multipart upload doesn&apos;t need signed upload storage.</p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setMode('multipart')
                          void start('multipart')
                        }}
                      >
                        Retry with direct upload
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {result ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{result.filename}</span>
                {typeof meta?.numPages === 'number' && <Badge variant="muted">{formatNumber(meta.numPages)} pages</Badge>}
                {typeof meta?.creditsUsed === 'number' && (
                  <Badge variant="muted">{formatNumber(meta.creditsUsed)} credits</Badge>
                )}
                {typeof meta?.contentType === 'string' && <Badge variant="outline">{meta.contentType}</Badge>}
              </div>
              {result.warning && (
                <Alert variant="warning">
                  <AlertDescription>{result.warning}</AlertDescription>
                </Alert>
              )}
              <DocumentViewer document={result.doc} />
            </div>
          ) : (
            run.phase === 'idle' && (
              <EmptyState
                icon={FileScanIcon}
                title="No document parsed yet"
                description="Choose a file, pick output formats and press Parse file. The result will appear here."
                className="min-h-80"
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}
