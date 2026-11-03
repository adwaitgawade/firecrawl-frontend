import * as React from 'react'
import { FileTextIcon, FileSpreadsheetIcon, FileCodeIcon, UploadCloudIcon, XIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, formatBytes } from '@/lib/utils'

import { PARSE_ACCEPT, PARSE_EXTENSIONS, detectFileKind, fileExtension, validateParseFile } from '../file-types'

interface FileDropzoneProps {
  file: File | null
  onFileChange: (file: File | null) => void
  disabled?: boolean
}

function FileIcon({ file, className }: { file: File; className?: string }) {
  const ext = fileExtension(file.name)
  if (ext === '.xlsx' || ext === '.xls') return <FileSpreadsheetIcon className={className} />
  if (detectFileKind(file) === 'html') return <FileCodeIcon className={className} />
  return <FileTextIcon className={className} />
}

export function FileDropzone({ file, onFileChange, disabled }: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const accept = (candidate: File | undefined) => {
    if (!candidate) return
    const problem = validateParseFile(candidate)
    setError(problem)
    if (!problem) onFileChange(candidate)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    accept(e.dataTransfer.files[0])
  }

  if (file) {
    const meta = PARSE_EXTENSIONS[fileExtension(file.name)]
    return (
      <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
          <FileIcon file={file} className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={file.name}>
            {file.name}
          </p>
          <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
            <span>{formatBytes(file.size)}</span>
            {meta && <Badge variant="muted">{meta.label}</Badge>}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove file"
          disabled={disabled}
          onClick={() => {
            onFileChange(null)
            setError(null)
          }}
        >
          <XIcon />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors',
          'hover:border-primary/60 hover:bg-muted/40 focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
          dragging && 'border-primary bg-primary/5',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <UploadCloudIcon className={cn('text-muted-foreground size-8', dragging && 'text-primary')} />
        <span className="text-sm font-medium">Drop a file here or click to browse</span>
        <span className="text-muted-foreground text-xs">PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, HTML · up to 50 MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={PARSE_ACCEPT}
        className="hidden"
        onChange={e => {
          accept(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
