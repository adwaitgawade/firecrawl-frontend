import * as React from 'react'
import { Trash2Icon, UploadIcon } from 'lucide-react'
import { toast } from 'sonner'

import { UrlListInput } from '@/components/shared/UrlListInput'
import { Button } from '@/components/ui/button'

import { extractUrlsFromFile } from '../request'

interface UrlSourceInputProps {
  value: string
  onChange: (text: string) => void
}

const MAX_FILE_BYTES = 5 * 1024 * 1024

/** UrlListInput plus .txt/.csv upload (appends) and drag-and-drop. */
export function UrlSourceInput({ value, onChange }: UrlSourceInputProps) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)

  const importFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error('File too large', { description: 'Upload a file under 5 MB.' })
      return
    }
    const urls = extractUrlsFromFile(await file.text())
    if (urls.length === 0) {
      toast.error(`No URLs found in ${file.name}`)
      return
    }
    const prefix = value.trim() ? `${value.replace(/\s+$/, '')}\n` : ''
    onChange(prefix + urls.join('\n'))
    toast.success(`Imported ${urls.length} URL${urls.length === 1 ? '' : 's'} from ${file.name}`)
  }

  return (
    <div
      className={dragging ? 'ring-primary/50 rounded-md ring-2' : undefined}
      onDragOver={e => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setDragging(true)
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        const file = e.dataTransfer.files?.[0]
        if (!file) return
        e.preventDefault()
        setDragging(false)
        void importFile(file)
      }}
    >
      <UrlListInput
        value={value}
        onChange={text => onChange(text)}
        rows={8}
        placeholder={'https://firecrawl.dev\nhttps://docs.firecrawl.dev/introduction\nhttps://example.com/pricing'}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.csv,text/plain,text/csv"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) void importFile(file)
            e.target.value = ''
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <UploadIcon /> Upload .txt / .csv
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onChange('')}>
            <Trash2Icon /> Clear
          </Button>
        )}
        <span className="text-muted-foreground self-center text-xs">or drop a file here</span>
      </div>
    </div>
  )
}
