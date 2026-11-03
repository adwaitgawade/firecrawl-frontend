import type { JsonSchema } from '@/lib/api/types'

export type SchemaFieldType = 'string' | 'number' | 'integer' | 'boolean' | 'string[]' | 'number[]'

export interface SchemaField {
  id: string
  name: string
  type: SchemaFieldType
  description: string
  required: boolean
}

export type SchemaShape = 'object' | 'list'

export interface SchemaBuilderState {
  /** `object`: one record. `list`: an array of records under `listKey`. */
  shape: SchemaShape
  listKey: string
  fields: SchemaField[]
}

export const FIELD_TYPE_LABELS: Record<SchemaFieldType, string> = {
  string: 'Text',
  number: 'Number',
  integer: 'Integer',
  boolean: 'Boolean',
  'string[]': 'List of text',
  'number[]': 'List of numbers',
}

let counter = 0
export function newField(partial: Partial<SchemaField> = {}): SchemaField {
  counter += 1
  return { id: `f${Date.now().toString(36)}${counter}`, name: '', type: 'string', description: '', required: false, ...partial }
}

export function initialBuilderState(): SchemaBuilderState {
  return {
    shape: 'object',
    listKey: 'items',
    fields: [
      newField({ name: 'name', type: 'string', description: 'Name of the item', required: true }),
      newField({ name: 'price', type: 'number', description: 'Price in USD' }),
    ],
  }
}

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_-]*$/

export function validateFieldName(name: string): string | undefined {
  if (!name.trim()) return 'Required'
  if (!NAME_RE.test(name.trim())) return 'Letters, digits, _ or - (no spaces)'
  return undefined
}

function fieldSchema(f: SchemaField): JsonSchema {
  const base: JsonSchema =
    f.type === 'string[]'
      ? { type: 'array', items: { type: 'string' } }
      : f.type === 'number[]'
        ? { type: 'array', items: { type: 'number' } }
        : { type: f.type }
  if (f.description.trim()) base.description = f.description.trim()
  return base
}

/** Build a JSON schema from the builder state. Fields with empty/duplicate names are skipped. */
export function builderToSchema(state: SchemaBuilderState): JsonSchema | undefined {
  const properties: Record<string, JsonSchema> = {}
  const required: string[] = []
  for (const f of state.fields) {
    const name = f.name.trim()
    if (validateFieldName(name) || name in properties) continue
    properties[name] = fieldSchema(f)
    if (f.required) required.push(name)
  }
  if (Object.keys(properties).length === 0) return undefined
  const record: JsonSchema = { type: 'object', properties, ...(required.length ? { required } : {}) }
  if (state.shape === 'object') return record
  const key = state.listKey.trim() && NAME_RE.test(state.listKey.trim()) ? state.listKey.trim() : 'items'
  return { type: 'object', properties: { [key]: { type: 'array', items: record } }, required: [key] }
}

/** Names that appear more than once (case-sensitive). */
export function duplicateNames(fields: SchemaField[]): Set<string> {
  const seen = new Set<string>()
  const dupes = new Set<string>()
  for (const f of fields) {
    const n = f.name.trim()
    if (!n) continue
    if (seen.has(n)) dupes.add(n)
    seen.add(n)
  }
  return dupes
}

// ---------------------------------------------------------------------------
// Combined schema input (none / visual builder / raw JSON)
// ---------------------------------------------------------------------------

export type SchemaMode = 'none' | 'builder' | 'json'

export interface SchemaInputState {
  mode: SchemaMode
  builder: SchemaBuilderState
  jsonText: string
  jsonSchema?: JsonSchema
  jsonError?: string
}

export function initialSchemaInput(mode: SchemaMode = 'none'): SchemaInputState {
  return { mode, builder: initialBuilderState(), jsonText: '' }
}

/** The schema to send (or a blocking error) for the current input state. */
export function resolveSchema(state: SchemaInputState): { schema?: JsonSchema; error?: string } {
  switch (state.mode) {
    case 'none':
      return {}
    case 'builder': {
      const schema = builderToSchema(state.builder)
      return schema ? { schema } : { error: 'Add at least one field with a valid name.' }
    }
    case 'json':
      if (!state.jsonText.trim()) return {}
      if (state.jsonError) return { error: `Schema: ${state.jsonError}` }
      return { schema: state.jsonSchema }
  }
}
