export type FlatRow = Record<string, unknown>

export interface TabularCandidate {
  /** Dot path of the array inside the data ('' = the data itself). */
  path: string
  rows: FlatRow[]
  columns: string[]
}

function isPrimitive(v: unknown): boolean {
  return v === null || v === undefined || ['string', 'number', 'boolean'].includes(typeof v)
}

function isPlainObject(v: unknown): v is FlatRow {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

/** A value fits in one table cell: primitive or an array of primitives. */
function isCellValue(v: unknown): boolean {
  return isPrimitive(v) || (Array.isArray(v) && v.every(isPrimitive))
}

function asCandidate(path: string, value: unknown): TabularCandidate | null {
  if (!Array.isArray(value) || value.length === 0) return null
  if (!value.every(row => isPlainObject(row) && Object.values(row).every(isCellValue))) return null
  const rows = value as FlatRow[]
  const columns: string[] = []
  for (const row of rows) for (const key of Object.keys(row)) if (!columns.includes(key)) columns.push(key)
  return columns.length ? { path, rows, columns } : null
}

/**
 * Find arrays of flat objects that render nicely as a table: the data itself, or any top-level
 * property of an object (e.g. `{ products: [...] }`). Largest first.
 */
export function findTabularData(data: unknown): TabularCandidate[] {
  const root = asCandidate('', data)
  if (root) return [root]
  if (!isPlainObject(data)) return []
  const out: TabularCandidate[] = []
  for (const [key, value] of Object.entries(data)) {
    const c = asCandidate(key, value)
    if (c) out.push(c)
  }
  return out.sort((a, b) => b.rows.length - a.rows.length)
}

export function formatCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.map(x => (x === null || x === undefined ? '' : String(x))).join(', ')
  return String(v)
}

function csvEscape(s: string): string {
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(c: Pick<TabularCandidate, 'rows' | 'columns'>): string {
  const lines = [c.columns.map(csvEscape).join(',')]
  for (const row of c.rows) lines.push(c.columns.map(col => csvEscape(formatCell(row[col]))).join(','))
  return lines.join('\n')
}

/** True when data is "empty" for display purposes (undefined, null, [], {} or ''). */
export function isEmptyData(data: unknown): boolean {
  if (data === undefined || data === null) return true
  if (typeof data === 'string') return data.trim() === ''
  if (Array.isArray(data)) return data.length === 0
  if (typeof data === 'object') return Object.keys(data).length === 0
  return false
}
