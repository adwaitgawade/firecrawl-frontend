import { parseUrlList } from '@/components/shared/UrlListInput'
import type { AgentModel, AgentRequest, AgentWebhookEvent, JsonSchema, WebhookOptions } from '@/lib/api/types'
import { initialSchemaInput, resolveSchema, type SchemaInputState } from '@/features/extract/schema-builder'

export const AGENT_EXAMPLE_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    companies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          website: { type: 'string' },
          founded_year: { type: 'integer' },
          funding_stage: { type: 'string' },
        },
        required: ['name'],
      },
    },
  },
  required: ['companies'],
}

export const AGENT_PROMPT_EXAMPLES = [
  'Find the 5 most recently funded AI infrastructure startups and their lead investors.',
  'Compare the pricing plans of Firecrawl, Apify and ScrapingBee.',
  'List the speakers and talk titles from the latest React Conf.',
]

export interface AgentFormState {
  prompt: string
  urlsText: string
  schema: SchemaInputState
  model: AgentModel
  maxCredits: string
  strictConstrainToURLs: boolean
  webhookUrl: string
  webhookEvents: AgentWebhookEvent[]
}

export function initialAgentForm(): AgentFormState {
  return {
    prompt: '',
    urlsText: '',
    schema: initialSchemaInput('none'),
    model: 'spark-1-pro',
    maxCredits: '',
    strictConstrainToURLs: false,
    webhookUrl: '',
    webhookEvents: [],
  }
}

/** Build the exact `POST /v2/agent` body plus blocking validation errors. */
export function buildAgentBody(f: AgentFormState): { body: AgentRequest; errors: string[] } {
  const errors: string[] = []
  const prompt = f.prompt.trim()
  const { urls, invalid } = parseUrlList(f.urlsText)
  const schema = resolveSchema(f.schema)

  if (!prompt) errors.push('A prompt is required.')
  if (prompt.length > 10000) errors.push('Prompt must be at most 10,000 characters.')
  if (invalid.length) errors.push(`${invalid.length} invalid URL${invalid.length === 1 ? '' : 's'}.`)
  if (schema.error) errors.push(schema.error)
  const maxCredits = f.maxCredits.trim() ? Number(f.maxCredits) : undefined
  if (maxCredits !== undefined && (!Number.isFinite(maxCredits) || maxCredits <= 0))
    errors.push('Max credits must be a positive number.')

  const body: AgentRequest = { prompt }
  if (urls.length) body.urls = urls
  if (schema.schema) body.schema = schema.schema
  if (f.model !== 'spark-1-pro') body.model = f.model
  if (maxCredits !== undefined && Number.isFinite(maxCredits) && maxCredits > 0) body.maxCredits = maxCredits
  if (f.strictConstrainToURLs && urls.length) body.strictConstrainToURLs = true
  const hook = f.webhookUrl.trim()
  if (hook) {
    body.webhook = f.webhookEvents.length
      ? ({ url: hook, events: f.webhookEvents } satisfies WebhookOptions<AgentWebhookEvent>)
      : hook
  }
  return { body, errors }
}

/** Rebuild form state from a previously sent body ("run again"). */
export function agentFormFromBody(body: AgentRequest): AgentFormState {
  const base = initialAgentForm()
  const webhook = body.webhook
  return {
    ...base,
    prompt: body.prompt ?? '',
    urlsText: (body.urls ?? []).join('\n'),
    schema: body.schema
      ? { ...base.schema, mode: 'json', jsonText: JSON.stringify(body.schema, null, 2), jsonSchema: body.schema }
      : base.schema,
    model: body.model ?? 'spark-1-pro',
    maxCredits: body.maxCredits != null ? String(body.maxCredits) : '',
    strictConstrainToURLs: body.strictConstrainToURLs ?? false,
    webhookUrl: typeof webhook === 'string' ? webhook : (webhook?.url ?? ''),
    webhookEvents: typeof webhook === 'object' ? (webhook.events ?? []) : [],
  }
}
