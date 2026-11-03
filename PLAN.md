# Firecrawl Frontend — Build Plan & Shared Contract

A web UI for the Firecrawl **v2** API (`apps/api/src/routes/v2.ts`, controllers in
`apps/api/src/controllers/v2/`, request/response zod schemas in
`apps/api/src/controllers/v2/types.ts`). Every agent MUST read the relevant controller and
schema before building a screen, so field names and shapes match the API exactly.

## Decisions (from the user)
- **Stack:** TypeScript, Vite 8, React 19, Tailwind CSS v4 (`@tailwindcss/vite`), shadcn/ui-style
  components (Radix primitives + CVA), React Router v7 (data/`createBrowserRouter`), TanStack Query v5,
  lucide-react icons, sonner toasts, recharts for charts, react-markdown + remark-gfm.
- **Scope:** core playgrounds + usage dashboard. NOT in scope: threat-protection/Zscaler, SIEM,
  Slack, support proxy, keyless, feedback, research/developer proxies, admin.
- **Auth/host:** `VITE_FIRECRAWL_API_URL` (default `http://localhost:3002`) and
  `VITE_FIRECRAWL_API_KEY` are build-time defaults; a Settings page can override both, persisted
  in `localStorage` (key `firecrawl.settings`). Requests send `Authorization: Bearer <key>`.
- **Git:** do not run any git commands.

## Phases & ownership

| Phase | Agent | Owns (may create/edit) |
|---|---|---|
| 0 (blocking) | **Foundation** | everything outside `src/features/*/` + placeholder `src/features/*/routes.tsx` |
| 1 (parallel) | **A — Scrape & Batch** | `src/features/scrape/**`, `src/features/batch/**` |
| 1 (parallel) | **B — Crawl & Map** | `src/features/crawl/**`, `src/features/map/**` |
| 1 (parallel) | **C — Search, Extract, Agent** | `src/features/search/**`, `src/features/extract/**`, `src/features/agent/**` |
| 1 (parallel) | **D — Parse, Browser, Monitors** | `src/features/parse/**`, `src/features/browser/**`, `src/features/monitors/**` |
| 1 (parallel) | **E — Usage & Home** | `src/features/usage/**`, `src/features/home/**` |
| 2 | **Lead (main session)** | integration: typecheck, lint, build, smoke test, fixes anywhere |

### Hard rules for Phase 1 agents
1. Only touch files inside the folders you own. Never edit `src/components/**`, `src/lib/**`,
   `src/layouts/**`, `src/App.tsx`, `src/main.tsx`, `src/routes.tsx`, `package.json`, configs.
2. Do NOT install dependencies or touch the lockfile. Use what Foundation installed. If you need a
   UI primitive that doesn't exist, build it inside your own feature folder.
3. Each feature exports `routes: RouteObject[]` from `src/features/<name>/routes.tsx` (Foundation
   creates a placeholder; you replace it). Paths are fixed — see the route table.
4. Before finishing, run `pnpm exec tsc -b --noEmit` (or `pnpm typecheck`) and `pnpm lint` and fix
   errors in YOUR files. Errors in other agents' folders are not yours — ignore them.
5. Every screen needs: loading state, error state (`<ErrorAlert>`), empty state, and a
   `<RequestPreview>` showing the equivalent cURL of the request being sent.

## Route table (fixed)

| Path | Feature folder | API endpoints |
|---|---|---|
| `/` | home | overview, quick links, recent jobs, credit snapshot |
| `/scrape` | scrape | `POST /v2/scrape`, `GET /v2/scrape/:jobId`, `POST/DELETE /v2/scrape/:jobId/interact` |
| `/batch`, `/batch/:jobId` | batch | `POST /v2/batch/scrape`, `GET/DELETE /v2/batch/scrape/:jobId`, `GET /v2/batch/scrape/:jobId/errors` |
| `/crawl`, `/crawl/:jobId` | crawl | `POST /v2/crawl`, `POST /v2/crawl/params-preview`, `GET /v2/crawl/ongoing`, `GET /v2/crawl/active`, `GET/DELETE /v2/crawl/:jobId`, `WS /v2/crawl/:jobId`, `GET /v2/crawl/:jobId/errors` |
| `/map` | map | `POST /v2/map` |
| `/search` | search | `POST /v2/search` |
| `/extract`, `/extract/:jobId` | extract | `POST /v2/extract`, `GET /v2/extract/:jobId` |
| `/agent`, `/agent/:jobId` | agent | `POST /v2/agent`, `GET/DELETE /v2/agent/:jobId` |
| `/parse` | parse | `POST /v2/parse/upload-url`, `PUT /v2/parse/upload/:uploadId`, `POST /v2/parse` |
| `/browser`, `/browser/:sessionId` | browser | `POST/GET /v2/browser`, `POST /v2/browser/:id/execute`, `GET /v2/browser/:id/replay[/:pageId]`, `DELETE /v2/browser/:id` |
| `/monitors`, `/monitors/new`, `/monitors/:monitorId` | monitors | `POST/GET /v2/monitor`, `GET/PATCH/DELETE /v2/monitor/:id`, `POST /v2/monitor/:id/run`, `GET /v2/monitor/:id/checks[/:checkId]` |
| `/usage` | usage | `GET /v2/team/credit-usage[/historical]`, `GET /v2/team/token-usage[/historical]`, `GET /v2/concurrency-check`, `GET /v2/team/queue-status`, `GET /v2/team/activity` |
| `/settings` | (Foundation, `src/pages/Settings.tsx`) | test connection via `GET /v2/team/credit-usage` |

## Shared code provided by Foundation (import, don't copy)

> Kept accurate by Foundation. Signatures below are the real ones.

- `@/lib/config` — `type Settings = { apiUrl, apiKey }`; `getSettings()`, `saveSettings(patch)`,
  `resetSettings()`, `useSettings()` (reactive, useSyncExternalStore), `hasApiKey(settings?)`,
  `maskApiKey(key)`, `envDefaults`, `subscribeSettings(fn)`, `SETTINGS_STORAGE_KEY`.
- `@/lib/api/client`:
  - `api.get<T>(path, opts?)`, `api.post<T>(path, body?, opts?)`, `api.put<T>(path, body?, opts?)`,
    `api.patch<T>(path, body?, opts?)`, `api.delete<T>(path, opts?)` — `opts: RequestOptions =
    { query?, signal?, headers? }`. Paths are relative to `/v2` (`api.post('/scrape', body)`);
    absolute `http(s)://` URLs (e.g. a `next` pagination URL) are used as-is. Returns the parsed
    JSON body as `T` (the whole envelope, e.g. `{ success, data }` — not unwrapped).
  - `api.raw(url, init?: RawRequestInit): Promise<Response>` — non-JSON calls. Never sets
    `Content-Type`. `url` may be absolute or `/v2`-relative. Adds `Authorization` only when the URL
    is on the configured API host (override with `init.auth: true|false`), so signed cloud-storage
    upload URLs work. Throws `FirecrawlApiError` on non-2xx.
  - `FirecrawlApiError extends Error { status, code?, details?, body? }` (status 0 = network error /
    aborted; `code` `'NETWORK_ERROR'`/`'ABORTED'`). JSON methods also throw on a 2xx body with
    `{ success: false, error }`. `isFirecrawlApiError(e)`.
  - `buildUrl(path, query?)`, `apiBaseUrl()`, `wsUrl(path)`, `wsProtocols()`, `openWebSocket(path)`.
- `@/lib/api/types` — mirrored from `apps/api/src/controllers/v2/types.ts`: `Document`,
  `DocumentMetadata`, `FormatInput` (what `formats` accepts: string | object), `FormatObject`,
  `FormatType`, `SimpleFormatType`, `JsonFormat`, `ScreenshotFormat`, `ChangeTrackingFormat`,
  `AttributesFormat`, `QuestionFormat`, `HighlightsFormat`, `ScrapeOptions` (input shape, all
  optional), `Action` (+ each action type), `Location`, `Parser`, `ProxyMode`, `WebhookOptions<E>`,
  `CrawlerOptions`, request bodies `ScrapeRequest`, `BatchScrapeRequest`, `CrawlRequest`,
  `MapRequest`, `SearchRequest`, `ExtractRequest`, `AgentRequest`; responses `ScrapeResponse`,
  `AsyncJobStartResponse`, `CrawlStatusResponse` (= `BatchScrapeStatusResponse`),
  `CrawlErrorsResponse`, `OngoingCrawlsResponse`, `MapResponse`, `SearchResponse`/`SearchData`,
  `ExtractStartResponse`, `ExtractStatusResponse`, `AgentStartResponse`, `AgentStatusResponse`,
  `CreditUsageResponse`, `ConcurrencyCheckResponse`, `ErrorResponse`; statuses `CrawlStatus`,
  `ExtractStatus`, `AgentStatus`, `JobStatus`, `isTerminalStatus(s)`, `TERMINAL_STATUSES`.
  Types for browser / monitor / parse / team-usage / activity / queue-status responses are NOT
  here — declare them in your feature folder after reading the controller.
- `@/lib/job-history` — `type JobKind = 'scrape'|'batch'|'crawl'|'extract'|'agent'|'browser'|
  'search'|'map'|'parse'|'monitor'`; `addJob({ kind, id, label, createdAt?, status? })`
  (createdAt defaults to now; re-adding an id moves it to the top), `updateJob(id, patch)`,
  `removeJob(id)`, `clearJobs(kind?)`, `getJobs(kind?)`, `useJobHistory(kind?)`, `jobHref(entry)`.
- `@/lib/hooks/use-polling` — `usePollingQuery<T>(key, fn: (signal) => Promise<T>,
  { intervalMs = 2000, stopWhen?, enabled = true, stopOnError = true })` → TanStack
  `UseQueryResult<T>` plus `isPolling`. Default `stopWhen` stops on a terminal `data.status`.
- `@/lib/curl` — `toCurl({ method, path, body?, query?, maskKey = true })`.
- `@/lib/utils` — `cn()`, `formatBytes`, `formatDate(value, pattern?)`, `formatRelative`,
  `formatNumber(n, intlOpts?)`, `formatDuration(ms)`, `downloadFile(name, content, mime?)`,
  `copyToClipboard(text)`, `truncate`, `shortUrl`, `isValidUrl`.
- `@/lib/nav` — `navGroups`, `navItems`, `findNavItem(pathname)`.
- `@/components/ui/*` (kebab-case files, shadcn API) — accordion, alert (variants default /
  destructive / warning / success / info), alert-dialog, badge (variants default / secondary /
  destructive / outline / success / warning / info / muted), button (sizes default / sm / lg /
  icon / icon-sm / icon-lg), card (+ CardAction), checkbox, collapsible, dialog, dropdown-menu,
  input, label, popover, progress (`indicatorClassName`), radio-group, scroll-area, select
  (`SelectTrigger size="sm"`), separator, sheet, skeleton, slider, sonner (`Toaster`, re-exports
  `toast`), switch, table, tabs, textarea, toggle-group, tooltip (self-providing).
- `@/components/shared/*` — PascalCase files, each with a named export; everything is also
  re-exported from the barrel `@/components/shared`:
  - `PageHeader { title, description?, actions?, icon?, className? }`
  - `ErrorAlert { error, title?, onRetry?, className? }` (understands `FirecrawlApiError`, renders
    zod `details` issues) + `getErrorMessage(err)`
  - `EmptyState { icon?, title, description?, action?, className? }` (icon = Lucide component or element)
  - `JsonViewer { data, collapsed?: boolean | number, maxHeight?, toolbar?, filename?, className? }`
  - `CodeBlock { code, language?, maxHeight?, wrap?, className? }` (copy button)
  - `MarkdownView { markdown, className? }`
  - `DocumentViewer { document, defaultTab?, className? }` — tabs for markdown (rendered/raw),
    summary, answer/highlights, json, html, rawHtml (source/preview), screenshot, links, images,
    attributes, changeTracking, branding, product, menu, actions, media, metadata — only present
    fields; copy + download.
  - `FormatSelector { value: FormatInput[] | undefined, onChange(formats), allowed?: FormatType[],
    hideValidation?, className? }` — `SCRAPE_FORMAT_TYPES` (default), `SEARCH_FORMAT_TYPES`,
    `FORMAT_META`. Emits simple formats as strings and option formats as objects.
  - `ScrapeOptionsForm { value: ScrapeOptions, onChange, hide?: ScrapeOptionsField[], defaultOpen?,
    inline?, title?, className? }` — does NOT edit `formats` (pair with FormatSelector).
  - `defaultScrapeOptions`, `cleanScrapeOptions(opts)`, `normalizeFormats`, `hasFormat`,
    `getFormat`, `validateFormats(formats): string[]`, `parseJson(text)` (from `scrape-options.ts`,
    also re-exported by `ScrapeOptionsForm`).
  - `KeyValueEditor { value?: Record<string,string>, onChange, keyPlaceholder?, valuePlaceholder?,
    addLabel?, disabled? }`
  - `UrlListInput { value: string (raw text), onChange(text, parsed), max?, ...textarea props }` +
    `parseUrlList(text) → { urls, invalid }`
  - `JsonSchemaEditor { value: string, onChange(text, { schema?, error? }), rows?, showToolbar?,
    example?, disabled? }` + `parseJsonSchema(text)`, `EXAMPLE_JSON_SCHEMA`
  - `TagListInput { value?: string[], onChange(list | undefined), separator? }` (comma list input)
  - `ActionsEditor { value?: Action[], onChange(actions | undefined) }`
  - `StatusBadge { status, hideIcon?, className? }`, `RequestPreview { method, path, body?, query?,
    defaultOpen?, title? }`, `CopyButton { value: string | () => string, label?, toastMessage? }`,
    `StatCard { title, value, description?, icon?, loading?, footer? }`.
- `@/components/coming-soon` — `ComingSoon { title, description? }` (placeholder page).
- `@/layouts/AppLayout` — `AppLayout` (named export): sidebar from `@/lib/nav`, top bar with API
  host + key indicator + theme toggle, no-key warning banner, `<Suspense>` around the `<Outlet>`.
- `@/providers/theme-provider` — `ThemeProvider`, `useTheme() → { theme, resolvedTheme, setTheme }`.

## Visual direction
Clean developer-tool aesthetic, dark-mode first-class. Neutral zinc palette, one orange accent
(Firecrawl brand-ish `#ff4c00`-ish via CSS token `--primary`). Inter / system font, JetBrains Mono for code.
Responsive down to mobile (sidebar collapses to a sheet).

## Foundation notes (read before starting Phase 1)

**Installed versions:** react 19.3, react-router **7.18.5** (import from `react-router`, not
`react-router-dom`), @tanstack/react-query 5.105, radix-ui 1.8 (unified package:
`import { Dialog as DialogPrimitive } from 'radix-ui'`), lucide-react 1.66 (some icon names
differ from older docs: e.g. `House`, `ChartColumn`; there is no `Spider`), sonner 2.0, recharts 3.10,
react-markdown 10.1 + remark-gfm 4.0, date-fns 4.4, class-variance-authority 0.7, clsx, tailwind-merge 3.7,
tailwindcss 4.3 + tw-animate-css, typescript 6.0 (pinned: typescript-eslint doesn't support TS 7 yet).

**Routes & lazy loading.** Your `routes.tsx` exports `routes: RouteObject[]`. These are spread as
children of the `/` layout route, so use absolute paths from the route table (`'/crawl'`,
`'/crawl/:jobId'`); home uses `{ index: true }`. Lazy-load each page with React Router's `lazy`:
```tsx
export const routes: RouteObject[] = [
  { path: '/crawl', lazy: async () => ({ Component: (await import('./CrawlPage')).CrawlPage }) },
  { path: '/crawl/:jobId', lazy: async () => ({ Component: (await import('./CrawlJobPage')).CrawlJobPage }) },
]
```
`routes.tsx` files may export non-components (the react-refresh lint rule is off for them, as for
`src/components/ui|shared`). In page files, export only components (put helpers in separate `.ts` files).

**API calls.** Use `api.*` inside TanStack Query `useQuery`/`useMutation`; pass `signal` through.
Bodies: `cleanScrapeOptions({ ...scrapeOptions, formats })` then add endpoint fields (`url`,
`urls`, crawler options…). For crawl/search/extract, the scrape options go under `scrapeOptions`.
The client returns the whole response envelope, e.g. `const r = await api.post<ScrapeResponse>('/scrape', body); r.data`.
`RequestPreview` should get the exact same `body` you send.

**WebSocket auth (crawl watch).** Browsers can't set headers on WS. The API accepts the raw API key
as the `Sec-WebSocket-Protocol`: `const ws = openWebSocket('/crawl/' + id)` (= `new WebSocket(wsUrl(path), wsProtocols())`).
Messages: `{type:'catchup', data: CrawlStatusResponse}`, `{type:'document', data: Document}`,
`{type:'done'}`, `{type:'error', error}`. Close the socket in the effect cleanup; fall back to polling on error.

**Parse uploads.** `POST /parse/upload-url` returns `{ uploadUrl, method: 'PUT'|'POST', headers, fields? }`.
For `PUT` (self-hosted) use `api.raw(uploadUrl, { method: 'PUT', headers, body: file })`. For `POST`
(signed GCS policy) build `FormData` from `fields` + file and `api.raw(uploadUrl, { method: 'POST', body: form })`
(auth is skipped automatically for foreign hosts).

**Polling.** `usePollingQuery(['crawl', id], signal => api.get<CrawlStatusResponse>(`/crawl/${id}`, { signal }))`
stops on terminal statuses; pass `stopWhen` for custom shapes. Large crawl/batch results paginate via `next`
(absolute URL — `api.get(next)` works).

**Job history.** After starting an async job call `addJob({ kind: 'crawl', id, label: url })`;
optionally `updateJob(id, { status })` when it finishes. Home reads `useJobHistory()`.

**Styling.** Tailwind v4 tokens: `bg-background`, `text-muted-foreground`, `border`, `bg-primary`
(Firecrawl orange), `text-success|warning|info|destructive` (+ `bg-*/10`), `bg-sidebar`, chart colors
`var(--chart-1..5)` (use `fill="var(--chart-1)"` in recharts). Dark mode is class-based (`.dark` on `<html>`).
Use `font-mono` for code/URLs. Rendered markdown uses the `.markdown-body` class (MarkdownView applies it).
Page skeleton: `<div className="space-y-6"><PageHeader …/>…</div>` — AppLayout already provides padding/max-width.

**Toasts:** `import { toast } from 'sonner'`. **Confirm dialogs:** `@/components/ui/alert-dialog`.

**Checks:** `pnpm typecheck` (= `tsc -b`; `pnpm exec tsc -b --noEmit` also works), `pnpm lint`,
`pnpm build`. ESLint uses react-hooks v7 (React Compiler rules): no `setState` inside `useEffect`
bodies for derived state (use the "store previous prop in state" pattern or compute during render),
no reading `ref.current` during render.
