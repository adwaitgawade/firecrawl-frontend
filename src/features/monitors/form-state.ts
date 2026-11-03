import { cleanScrapeOptions, parseUrlList, validateFormats } from '@/components/shared'
import type { FormatInput, ScrapeOptions } from '@/lib/api/types'
import { isValidUrl } from '@/lib/utils'

import { SCHEDULE_PRESETS, browserTimezone } from './schedule'
import type {
  CreateMonitorRequest,
  Monitor,
  MonitorNotification,
  MonitorScrapeOptions,
  MonitorSlackNotification,
  MonitorTarget,
  MonitorTargetType,
  MonitorWebhookEvent,
  SearchWindow,
  UpdateMonitorRequest,
} from './types'
import { MONITOR_WEBHOOK_EVENTS } from './types'

export interface TargetDraft {
  /** Client-side React key. */
  key: string
  /** Existing target id (edit mode) — sent back so page history is preserved. */
  id?: string
  type: MonitorTargetType
  // scrape
  urlsText: string
  // crawl
  url: string
  crawlLimit: string
  maxDiscoveryDepth: string
  includePaths?: string[]
  excludePaths?: string[]
  /** Unknown crawlOptions from an existing target, preserved as-is. */
  crawlExtra: Record<string, unknown>
  // scrape + crawl
  formats: FormatInput[]
  scrapeOptions: ScrapeOptions
  // search
  queriesText: string
  searchWindow: SearchWindow
  includeDomains?: string[]
  excludeDomains?: string[]
  maxResults: string
}

export type ScheduleMode = 'preset' | 'text' | 'cron'

export interface MonitorFormState {
  name: string
  scheduleMode: ScheduleMode
  preset: string
  scheduleText: string
  cron: string
  timezone: string
  targets: TargetDraft[]
  goal: string
  judgeEnabled: boolean
  emailEnabled: boolean
  emailRecipients?: string[]
  includeDiffs: boolean
  /** Slack config isn't editable here (Slack integration is out of scope) but is preserved on edit. */
  slack?: MonitorSlackNotification
  webhookEnabled: boolean
  webhookUrl: string
  webhookHeaders: Record<string, string>
  webhookMetadata: Record<string, string>
  webhookEvents: MonitorWebhookEvent[]
  retentionDays: string
}

let keyCounter = 0
const nextKey = () => `t${++keyCounter}`

const BASE_SCRAPE_OPTIONS: ScrapeOptions = {
  onlyMainContent: true,
  blockAds: true,
  proxy: 'auto',
  removeBase64Images: true,
}

export function newTarget(type: MonitorTargetType = 'scrape'): TargetDraft {
  return {
    key: nextKey(),
    type,
    urlsText: '',
    url: '',
    crawlLimit: '50',
    maxDiscoveryDepth: '',
    crawlExtra: {},
    formats: ['markdown'],
    scrapeOptions: { ...BASE_SCRAPE_OPTIONS },
    queriesText: '',
    searchWindow: '24h',
    maxResults: '10',
  }
}

export function emptyFormState(): MonitorFormState {
  return {
    name: '',
    scheduleMode: 'preset',
    preset: 'every 6 hours',
    scheduleText: '',
    cron: '0 */6 * * *',
    timezone: browserTimezone(),
    targets: [newTarget('scrape')],
    goal: '',
    judgeEnabled: true,
    emailEnabled: false,
    includeDiffs: false,
    webhookEnabled: false,
    webhookUrl: '',
    webhookHeaders: {},
    webhookMetadata: {},
    webhookEvents: [...MONITOR_WEBHOOK_EVENTS],
    retentionDays: '30',
  }
}

function splitScrapeOptions(opts: MonitorScrapeOptions | undefined): { formats: FormatInput[]; scrapeOptions: ScrapeOptions } {
  const { formats, ...rest } = opts ?? {}
  return {
    formats: Array.isArray(formats) && formats.length > 0 ? formats : ['markdown'],
    scrapeOptions: { ...BASE_SCRAPE_OPTIONS, ...(rest as ScrapeOptions) },
  }
}

function draftFromTarget(t: MonitorTarget): TargetDraft {
  const base = newTarget(t.type)
  if (t.type === 'scrape') {
    return { ...base, id: t.id, urlsText: t.urls.join('\n'), ...splitScrapeOptions(t.scrapeOptions) }
  }
  if (t.type === 'crawl') {
    const { limit, maxDiscoveryDepth, includePaths, excludePaths, ...extra } = t.crawlOptions ?? {}
    return {
      ...base,
      id: t.id,
      url: t.url,
      crawlLimit: limit != null ? String(limit) : '',
      maxDiscoveryDepth: maxDiscoveryDepth != null ? String(maxDiscoveryDepth) : '',
      includePaths: includePaths?.length ? includePaths : undefined,
      excludePaths: excludePaths?.length ? excludePaths : undefined,
      crawlExtra: extra,
      ...splitScrapeOptions(t.scrapeOptions),
    }
  }
  return {
    ...base,
    id: t.id,
    queriesText: t.queries.join('\n'),
    searchWindow: t.searchWindow ?? '24h',
    includeDomains: t.includeDomains?.length ? t.includeDomains : undefined,
    excludeDomains: t.excludeDomains?.length ? t.excludeDomains : undefined,
    maxResults: t.maxResults != null ? String(t.maxResults) : '10',
  }
}

export function formStateFromMonitor(m: Monitor): MonitorFormState {
  const preset = SCHEDULE_PRESETS.find(p => p.cron === m.schedule.cron)
  const webhook = m.webhook
  return {
    name: m.name,
    scheduleMode: preset ? 'preset' : 'cron',
    preset: preset?.text ?? 'every 6 hours',
    scheduleText: '',
    cron: m.schedule.cron,
    timezone: m.schedule.timezone || 'UTC',
    targets: m.targets.length ? m.targets.map(draftFromTarget) : [newTarget()],
    goal: m.goal ?? '',
    judgeEnabled: m.judgeEnabled,
    emailEnabled: !!m.notification?.email?.enabled,
    emailRecipients: m.notification?.email?.recipients?.length ? m.notification.email.recipients : undefined,
    includeDiffs: !!m.notification?.email?.includeDiffs,
    slack: m.notification?.slack,
    webhookEnabled: !!webhook?.url,
    webhookUrl: webhook?.url ?? '',
    webhookHeaders: webhook?.headers ?? {},
    webhookMetadata: webhook?.metadata ?? {},
    webhookEvents: webhook?.events?.length ? webhook.events : [...MONITOR_WEBHOOK_EVENTS],
    retentionDays: String(m.retentionDays ?? 30),
  }
}

// ---------------------------------------------------------------------------
// Serialization + validation
// ---------------------------------------------------------------------------

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function lines(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
}

function intOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function buildScrapeOptions(draft: TargetDraft): MonitorScrapeOptions | undefined {
  const formats = draft.formats.length === 1 && draft.formats[0] === 'markdown' ? undefined : draft.formats
  const cleaned = cleanScrapeOptions({ ...draft.scrapeOptions, formats }) as MonitorScrapeOptions
  return Object.keys(cleaned).length ? cleaned : undefined
}

function buildTarget(draft: TargetDraft, label: string, errors: string[]): MonitorTarget {
  const withId = <T extends object>(t: T) => (draft.id ? { id: draft.id, ...t } : t)
  if (draft.type === 'scrape') {
    const { urls, invalid } = parseUrlList(draft.urlsText)
    if (urls.length === 0) errors.push(`${label}: add at least one URL`)
    if (invalid.length) errors.push(`${label}: invalid URL(s): ${invalid.slice(0, 3).join(', ')}`)
    errors.push(...validateFormats(draft.formats).map(e => `${label}: ${e}`))
    const scrapeOptions = buildScrapeOptions(draft)
    return withId({ type: 'scrape' as const, urls, ...(scrapeOptions ? { scrapeOptions } : {}) })
  }
  if (draft.type === 'crawl') {
    if (!isValidUrl(draft.url)) errors.push(`${label}: enter a valid start URL`)
    errors.push(...validateFormats(draft.formats).map(e => `${label}: ${e}`))
    const limit = intOrUndefined(draft.crawlLimit)
    const depth = intOrUndefined(draft.maxDiscoveryDepth)
    if (draft.crawlLimit.trim() && (limit === undefined || limit < 1)) errors.push(`${label}: page limit must be ≥ 1`)
    if (draft.maxDiscoveryDepth.trim() && (depth === undefined || depth < 0)) errors.push(`${label}: depth must be ≥ 0`)
    const crawlOptions: Record<string, unknown> = { ...draft.crawlExtra }
    if (limit !== undefined) crawlOptions.limit = limit
    if (depth !== undefined) crawlOptions.maxDiscoveryDepth = depth
    if (draft.includePaths?.length) crawlOptions.includePaths = draft.includePaths
    if (draft.excludePaths?.length) crawlOptions.excludePaths = draft.excludePaths
    const scrapeOptions = buildScrapeOptions(draft)
    return withId({
      type: 'crawl' as const,
      url: draft.url.trim(),
      ...(Object.keys(crawlOptions).length ? { crawlOptions } : {}),
      ...(scrapeOptions ? { scrapeOptions } : {}),
    })
  }
  const queries = lines(draft.queriesText)
  if (queries.length === 0) errors.push(`${label}: add at least one query`)
  if (queries.length > 12) errors.push(`${label}: at most 12 queries`)
  if (queries.some(q => q.length > 256)) errors.push(`${label}: queries must be ≤ 256 characters`)
  const maxResults = intOrUndefined(draft.maxResults)
  if (maxResults !== undefined && (maxResults < 1 || maxResults > 50)) errors.push(`${label}: max results must be 1–50`)
  const include = draft.includeDomains?.map(d => d.trim().toLowerCase()).filter(Boolean)
  const exclude = draft.excludeDomains?.map(d => d.trim().toLowerCase()).filter(Boolean)
  if (include?.length && exclude?.length) errors.push(`${label}: include and exclude domains are mutually exclusive`)
  const badDomain = [...(include ?? []), ...(exclude ?? [])].find(d => !DOMAIN_RE.test(d))
  if (badDomain) errors.push(`${label}: "${badDomain}" must be a hostname without protocol or path`)
  return withId({
    type: 'search' as const,
    queries,
    searchWindow: draft.searchWindow,
    ...(include?.length ? { includeDomains: include } : {}),
    ...(exclude?.length ? { excludeDomains: exclude } : {}),
    ...(maxResults !== undefined && maxResults !== 10 ? { maxResults } : {}),
  })
}

export interface BuildResult<T> {
  body: T
  errors: string[]
}

export function buildMonitorRequest(state: MonitorFormState, mode: 'create'): BuildResult<CreateMonitorRequest>
export function buildMonitorRequest(
  state: MonitorFormState,
  mode: 'edit',
  existing: Monitor,
): BuildResult<UpdateMonitorRequest>
export function buildMonitorRequest(
  state: MonitorFormState,
  mode: 'create' | 'edit',
  existing?: Monitor,
): BuildResult<CreateMonitorRequest | UpdateMonitorRequest> {
  const errors: string[] = []
  const name = state.name.trim()
  if (!name) errors.push('Name is required')
  if (name.length > 256) errors.push('Name must be ≤ 256 characters')

  // Schedule
  const timezone = state.timezone.trim() || 'UTC'
  let schedule: CreateMonitorRequest['schedule']
  if (state.scheduleMode === 'cron') {
    if (!state.cron.trim()) errors.push('Cron expression is required')
    else if (state.cron.trim().split(/\s+/).length !== 5) errors.push('Cron must have 5 fields (min hour day month weekday)')
    schedule = { cron: state.cron.trim(), timezone }
  } else {
    const text = state.scheduleMode === 'preset' ? state.preset : state.scheduleText.trim()
    if (!text) errors.push('Schedule text is required')
    schedule = { text, timezone }
  }

  // Targets
  if (state.targets.length === 0) errors.push('Add at least one target')
  if (state.targets.length > 50) errors.push('At most 50 targets')
  const targets = state.targets.map((t, i) => buildTarget(t, `Target ${i + 1}`, errors))

  // Goal / judge
  const goal = state.goal.trim()
  if (goal.length > 2000) errors.push('Goal must be ≤ 2000 characters')
  const hasSearch = targets.some(t => t.type === 'search')
  if (hasSearch && state.judgeEnabled && !goal) errors.push('Search targets need a goal (or disable the AI judge)')

  // Notifications
  const recipients = (state.emailRecipients ?? []).map(r => r.trim()).filter(Boolean)
  const badEmail = recipients.find(r => !EMAIL_RE.test(r))
  if (badEmail) errors.push(`Invalid email: ${badEmail}`)
  if (recipients.length > 25) errors.push('At most 25 email recipients')
  const notification: MonitorNotification = {}
  if (state.emailEnabled || recipients.length || state.includeDiffs) {
    notification.email = { enabled: state.emailEnabled, recipients, includeDiffs: state.includeDiffs }
  }
  if (state.slack) notification.slack = state.slack

  // Webhook
  let webhook: CreateMonitorRequest['webhook']
  if (state.webhookEnabled) {
    if (!isValidUrl(state.webhookUrl) || !/^https?:\/\//i.test(state.webhookUrl.trim())) {
      errors.push('Webhook URL must be a full http(s) URL')
    }
    if (Object.keys(state.webhookHeaders).some(h => h.toLowerCase() === 'x-firecrawl-signature')) {
      errors.push('The x-firecrawl-signature webhook header is not allowed')
    }
    webhook = { url: state.webhookUrl.trim() }
    const headers = Object.fromEntries(Object.entries(state.webhookHeaders).filter(([k]) => k.trim()))
    const metadata = Object.fromEntries(Object.entries(state.webhookMetadata).filter(([k]) => k.trim()))
    if (Object.keys(headers).length) webhook.headers = headers
    if (Object.keys(metadata).length) webhook.metadata = metadata
    if (state.webhookEvents.length === 0) errors.push('Select at least one webhook event')
    if (state.webhookEvents.length && state.webhookEvents.length < MONITOR_WEBHOOK_EVENTS.length) {
      webhook.events = state.webhookEvents
    }
  }

  const retention = intOrUndefined(state.retentionDays)
  if (retention === undefined || retention < 1 || retention > 365 || !Number.isInteger(retention)) {
    errors.push('Retention must be 1–365 days')
  }

  if (mode === 'create') {
    const body: CreateMonitorRequest = { name, schedule, targets }
    if (Object.keys(notification).length) body.notification = notification
    if (webhook) body.webhook = webhook
    if (retention !== undefined && retention !== 30) body.retentionDays = retention
    if (goal) body.goal = goal
    if (goal || hasSearch) body.judgeEnabled = state.judgeEnabled
    return { body, errors }
  }

  const body: UpdateMonitorRequest = { name, schedule, targets, judgeEnabled: state.judgeEnabled }
  body.goal = goal || null
  if (retention !== undefined) body.retentionDays = retention
  // Send notification whenever there is or was any config, so disabling email persists.
  if (Object.keys(notification).length || existing?.notification) {
    body.notification = Object.keys(notification).length ? notification : { email: { enabled: false, recipients: [] } }
  }
  if (webhook) body.webhook = webhook
  return { body, errors }
}
