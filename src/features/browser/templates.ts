import type { BrowserLanguage } from './types'

export const LANGUAGE_META: Record<BrowserLanguage, { label: string; hint: string }> = {
  node: {
    label: 'Node.js (Playwright)',
    hint: 'A Playwright `page` is in scope. Top-level await is supported; the last expression / console output is returned.',
  },
  python: {
    label: 'Python (Playwright)',
    hint: 'A Playwright `page` is in scope (async API). Use print() for output.',
  },
  bash: {
    label: 'Bash (agent-browser)',
    hint: 'Shell with the agent-browser CLI, e.g. `agent-browser open <url>`, `agent-browser snapshot -i`, `agent-browser click @e1`.',
  },
}

export interface CodeTemplate {
  label: string
  code: string
}

export const TEMPLATES: Record<BrowserLanguage, CodeTemplate[]> = {
  node: [
    {
      label: 'Open a page',
      code: `await page.goto("https://example.com");\nconsole.log(await page.title());`,
    },
    {
      label: 'Extract links',
      code: `const links = await page.$$eval("a", as => as.map(a => ({ text: a.textContent?.trim(), href: a.href })));\nconsole.log(JSON.stringify(links.slice(0, 20), null, 2));`,
    },
    {
      label: 'Current URL',
      code: `console.log(page.url());`,
    },
  ],
  python: [
    {
      label: 'Open a page',
      code: `await page.goto("https://example.com")\nprint(await page.title())`,
    },
    {
      label: 'Page text',
      code: `text = await page.inner_text("body")\nprint(text[:2000])`,
    },
  ],
  bash: [
    {
      label: 'Open + snapshot',
      code: `agent-browser open https://example.com && agent-browser snapshot -i`,
    },
    {
      label: 'Current URL',
      code: `agent-browser get url`,
    },
    {
      label: 'Click a ref',
      code: `agent-browser click @e1`,
    },
  ],
}
