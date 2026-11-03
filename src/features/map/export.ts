import type { MapLink } from '@/lib/api/types'
import { downloadFile } from '@/lib/utils'

function csvCell(value: string | undefined): string {
  const v = value ?? ''
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function linksToCsv(links: MapLink[]): string {
  const rows = links.map(l => [csvCell(l.url), csvCell(l.title), csvCell(l.description)].join(','))
  return ['url,title,description', ...rows].join('\n')
}

export function hostSlug(url: string): string {
  try {
    return new URL(/^[a-z]+:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/[^a-z0-9]+/gi, '-')
  } catch {
    return 'map'
  }
}

export function exportLinks(links: MapLink[], format: 'txt' | 'json' | 'csv', baseUrl: string) {
  const name = `map-${hostSlug(baseUrl)}`
  switch (format) {
    case 'txt':
      return downloadFile(`${name}.txt`, links.map(l => l.url).join('\n'))
    case 'json':
      return downloadFile(`${name}.json`, JSON.stringify(links, null, 2), 'application/json')
    case 'csv':
      return downloadFile(`${name}.csv`, linksToCsv(links), 'text/csv;charset=utf-8')
  }
}
