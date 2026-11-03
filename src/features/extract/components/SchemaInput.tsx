import { BracesIcon, ListTreeIcon } from 'lucide-react'

import { JsonSchemaEditor } from '@/components/shared/JsonSchemaEditor'
import { JsonViewer } from '@/components/shared/JsonViewer'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { JsonSchema } from '@/lib/api/types'

import { builderToSchema, type SchemaInputState, type SchemaMode } from '../schema-builder'
import { SchemaBuilder } from './SchemaBuilder'

interface SchemaInputProps {
  value: SchemaInputState
  onChange: (value: SchemaInputState) => void
  example?: JsonSchema
  disabled?: boolean
  /** Label for the "no schema" tab. */
  noneLabel?: string
}

/** Tabs for "no schema" / visual field builder / raw JSON schema. */
export function SchemaInput({ value, onChange, example, disabled, noneLabel = 'None' }: SchemaInputProps) {
  const built = value.mode === 'builder' ? builderToSchema(value.builder) : undefined

  const editAsJson = () => {
    const schema = builderToSchema(value.builder)
    onChange({
      ...value,
      mode: 'json',
      jsonText: schema ? JSON.stringify(schema, null, 2) : value.jsonText,
      jsonSchema: schema ?? value.jsonSchema,
      jsonError: schema ? undefined : value.jsonError,
    })
  }

  return (
    <Tabs value={value.mode} onValueChange={m => onChange({ ...value, mode: m as SchemaMode })}>
      <TabsList>
        <TabsTrigger value="none" disabled={disabled}>
          {noneLabel}
        </TabsTrigger>
        <TabsTrigger value="builder" disabled={disabled}>
          <ListTreeIcon /> Builder
        </TabsTrigger>
        <TabsTrigger value="json" disabled={disabled}>
          <BracesIcon /> JSON
        </TabsTrigger>
      </TabsList>
      <TabsContent value="none">
        <p className="text-muted-foreground text-xs">
          No schema — the model decides the output shape from your prompt. Add a schema for predictable, typed results.
        </p>
      </TabsContent>
      <TabsContent value="builder" className="space-y-3">
        <SchemaBuilder
          value={value.builder}
          disabled={disabled}
          onChange={builder => onChange({ ...value, builder })}
        />
        {built && (
          <Collapsible>
            <div className="flex flex-wrap items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs">
                  Show generated schema
                </Button>
              </CollapsibleTrigger>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={editAsJson} disabled={disabled}>
                Edit as JSON
              </Button>
            </div>
            <CollapsibleContent className="pt-2">
              <JsonViewer data={built} maxHeight="16rem" toolbar={false} />
            </CollapsibleContent>
          </Collapsible>
        )}
      </TabsContent>
      <TabsContent value="json">
        <JsonSchemaEditor
          value={value.jsonText}
          example={example}
          disabled={disabled}
          rows={10}
          onChange={(text, r) => onChange({ ...value, jsonText: text, jsonSchema: r.schema, jsonError: r.error })}
        />
      </TabsContent>
    </Tabs>
  )
}
