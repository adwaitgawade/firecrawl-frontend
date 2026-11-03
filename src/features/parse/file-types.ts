/** Mirrors `detectUploadedFileKind` in `apps/api/src/controllers/v2/parse.ts`. */

export const PARSE_MAX_BYTES = 50 * 1024 * 1024

export type ParseFileKind = 'pdf' | 'document' | 'html'

export const PARSE_EXTENSIONS: Record<string, { kind: ParseFileKind; mime: string; label: string }> = {
  '.pdf': { kind: 'pdf', mime: 'application/pdf', label: 'PDF' },
  '.docx': {
    kind: 'document',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'Word',
  },
  '.doc': { kind: 'document', mime: 'application/msword', label: 'Word (legacy)' },
  '.odt': { kind: 'document', mime: 'application/vnd.oasis.opendocument.text', label: 'OpenDocument' },
  '.rtf': { kind: 'document', mime: 'application/rtf', label: 'Rich text' },
  '.xlsx': {
    kind: 'document',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    label: 'Excel',
  },
  '.xls': { kind: 'document', mime: 'application/vnd.ms-excel', label: 'Excel (legacy)' },
  '.html': { kind: 'html', mime: 'text/html', label: 'HTML' },
  '.htm': { kind: 'html', mime: 'text/html', label: 'HTML' },
  '.xhtml': { kind: 'html', mime: 'application/xhtml+xml', label: 'XHTML' },
}

/** `accept` attribute value for the file input. */
export const PARSE_ACCEPT = Object.entries(PARSE_EXTENSIONS)
  .flatMap(([ext, { mime }]) => [ext, mime])
  .filter((v, i, arr) => arr.indexOf(v) === i)
  .join(',')

export function fileExtension(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

export function detectFileKind(file: Pick<File, 'name' | 'type'>): ParseFileKind | null {
  const ext = PARSE_EXTENSIONS[fileExtension(file.name)]
  if (ext) return ext.kind
  const type = file.type.toLowerCase()
  if (type.startsWith('application/pdf')) return 'pdf'
  for (const meta of Object.values(PARSE_EXTENSIONS)) {
    if (type && type.includes(meta.mime)) return meta.kind
  }
  if (type.includes('text/rtf')) return 'document'
  return null
}

/** Content type to declare: the browser's type, or one inferred from the extension. */
export function contentTypeFor(file: Pick<File, 'name' | 'type'>): string {
  return file.type || PARSE_EXTENSIONS[fileExtension(file.name)]?.mime || 'application/octet-stream'
}

/** Returns an error message when the file can't be parsed, otherwise null. */
export function validateParseFile(file: File): string | null {
  if (!detectFileKind(file)) {
    return `Unsupported file type. Supported: ${Object.keys(PARSE_EXTENSIONS).join(', ')}`
  }
  if (file.size === 0) return 'The file is empty.'
  if (file.size > PARSE_MAX_BYTES) return 'File exceeds the 50 MB limit.'
  return null
}
