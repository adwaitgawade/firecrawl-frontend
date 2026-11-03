import { PlusIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

import {
  FIELD_TYPE_LABELS,
  duplicateNames,
  newField,
  validateFieldName,
  type SchemaBuilderState,
  type SchemaField,
  type SchemaFieldType,
} from '../schema-builder'

interface SchemaBuilderProps {
  value: SchemaBuilderState
  onChange: (value: SchemaBuilderState) => void
  disabled?: boolean
}

/** Simple visual editor that produces a flat JSON schema (one record or a list of records). */
export function SchemaBuilder({ value, onChange, disabled }: SchemaBuilderProps) {
  const dupes = duplicateNames(value.fields)

  const patchField = (id: string, patch: Partial<SchemaField>) =>
    onChange({ ...value, fields: value.fields.map(f => (f.id === id ? { ...f, ...patch } : f)) })
  const removeField = (id: string) => onChange({ ...value, fields: value.fields.filter(f => f.id !== id) })
  const addField = () => onChange({ ...value, fields: [...value.fields, newField()] })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted-foreground text-xs font-medium">Shape</span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={value.shape}
          disabled={disabled}
          onValueChange={v => v && onChange({ ...value, shape: v as SchemaBuilderState['shape'] })}
        >
          <ToggleGroupItem value="object" className="px-3 text-xs">
            Single record
          </ToggleGroupItem>
          <ToggleGroupItem value="list" className="px-3 text-xs">
            List of records
          </ToggleGroupItem>
        </ToggleGroup>
        {value.shape === 'list' && (
          <div className="flex items-center gap-2">
            <Label htmlFor="schema-list-key" className="text-muted-foreground text-xs">
              under key
            </Label>
            <Input
              id="schema-list-key"
              value={value.listKey}
              disabled={disabled}
              onChange={e => onChange({ ...value, listKey: e.target.value })}
              className="h-8 w-32 font-mono text-xs"
              placeholder="items"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-muted-foreground hidden grid-cols-[minmax(0,1fr)_9rem_minmax(0,1.4fr)_4.5rem_2rem] gap-2 px-1 text-xs font-medium md:grid">
          <span>Field name</span>
          <span>Type</span>
          <span>Description (helps the model)</span>
          <span className="text-center">Required</span>
          <span />
        </div>
        {value.fields.map(field => {
          const nameError = field.name ? validateFieldName(field.name) : undefined
          const isDupe = dupes.has(field.name.trim())
          return (
            <div
              key={field.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-md border p-2 md:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1.4fr)_4.5rem_2rem] md:border-0 md:p-0"
            >
              <div className="col-span-2 md:col-span-1">
                <Input
                  aria-label="Field name"
                  value={field.name}
                  disabled={disabled}
                  placeholder="field_name"
                  aria-invalid={!!nameError || isDupe || undefined}
                  onChange={e => patchField(field.id, { name: e.target.value })}
                  className="h-8 font-mono text-xs"
                />
                {(nameError || isDupe) && (
                  <p className="text-destructive mt-1 text-[11px]">{isDupe ? 'Duplicate name' : nameError}</p>
                )}
              </div>
              <Select
                value={field.type}
                disabled={disabled}
                onValueChange={v => patchField(field.id, { type: v as SchemaFieldType })}
              >
                <SelectTrigger size="sm" className="w-full text-xs" aria-label="Field type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FIELD_TYPE_LABELS) as SchemaFieldType[]).map(t => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {FIELD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label="Field description"
                value={field.description}
                disabled={disabled}
                placeholder="Optional"
                onChange={e => patchField(field.id, { description: e.target.value })}
                className="col-span-2 h-8 text-xs md:col-span-1"
              />
              <label
                className={cn(
                  'flex items-center gap-2 text-xs md:justify-center',
                  disabled && 'pointer-events-none opacity-60',
                )}
              >
                <Checkbox
                  checked={field.required}
                  disabled={disabled}
                  onCheckedChange={v => patchField(field.id, { required: v === true })}
                />
                <span className="md:sr-only">Required</span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                onClick={() => removeField(field.id)}
                aria-label={`Remove field ${field.name || ''}`}
                className="justify-self-end"
              >
                <Trash2Icon />
              </Button>
            </div>
          )
        })}
        {value.fields.length === 0 && (
          <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
            No fields yet. Add the properties you want extracted.
          </p>
        )}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addField} disabled={disabled}>
        <PlusIcon /> Add field
      </Button>
    </div>
  )
}
