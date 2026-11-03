/**
 * Schedule helpers. The API accepts either a 5-field `cron` or a `text` phrase that it converts to
 * cron (see `parseMonitorScheduleText` in apps/api/src/services/monitoring/cron.ts).
 */

export const SCHEDULE_PRESETS: { label: string; text: string; cron: string }[] = [
  { label: 'Every 15 minutes', text: 'every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Every 30 minutes', text: 'every 30 minutes', cron: '*/30 * * * *' },
  { label: 'Hourly', text: 'hourly', cron: '0 * * * *' },
  { label: 'Every 6 hours', text: 'every 6 hours', cron: '0 */6 * * *' },
  { label: 'Every 12 hours', text: 'every 12 hours', cron: '0 */12 * * *' },
  { label: 'Daily at 9:00', text: 'daily at 9:00', cron: '0 9 * * *' },
  { label: 'Daily at midnight', text: 'daily', cron: '0 0 * * *' },
  { label: 'Weekly (Sunday)', text: 'weekly', cron: '0 0 * * 0' },
]

export const SCHEDULE_TEXT_EXAMPLES = ['every 10 minutes', 'every 2 hours', 'hourly at :15', 'daily at 6:30 pm', 'weekly']

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Best-effort human description of common cron shapes; falls back to the raw expression. */
export function describeCron(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return cron
  const [min, hour, dom, mon, dow] = parts
  const isNum = (v: string) => /^\d+$/.test(v)

  if (dom === '*' && mon === '*' && dow === '*') {
    let m = min.match(/^\*\/(\d+)$/)
    if (m && hour === '*') return Number(m[1]) === 1 ? 'Every minute' : `Every ${m[1]} minutes`
    m = min.match(/^(\d+)-59\/(\d+)$/)
    if (m && hour === '*') return `Every ${m[2]} minutes from :${pad(Number(m[1]))}`
    if (min === '*' && hour === '*') return 'Every minute'
    if (isNum(min) && hour === '*') return Number(min) === 0 ? 'Hourly' : `Hourly at :${pad(Number(min))}`
    m = hour.match(/^\*\/(\d+)$/)
    if (m && isNum(min)) return `Every ${m[1]} hours${Number(min) ? ` at :${pad(Number(min))}` : ''}`
    if (isNum(min) && isNum(hour)) return `Daily at ${pad(Number(hour))}:${pad(Number(min))}`
  }
  if (dom === '*' && mon === '*' && isNum(dow) && isNum(min) && isNum(hour)) {
    return `Weekly on ${DAYS[Number(dow) % 7]} at ${pad(Number(hour))}:${pad(Number(min))}`
  }
  return cron
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function timezoneOptions(): string[] {
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    const zones = intl.supportedValuesOf?.('timeZone') ?? []
    return zones.includes('UTC') ? zones : ['UTC', ...zones]
  } catch {
    return ['UTC']
  }
}
