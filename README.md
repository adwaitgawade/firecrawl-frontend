# Firecrawl Frontend

A web playground and dashboard for the Firecrawl **v2** API (`apps/api`).

**Stack:** TypeScript · Vite 8 · React 19 · Tailwind CSS v4 · shadcn-style UI (Radix) · React Router 7 · TanStack Query 5 · recharts.

## Getting started

```bash
pnpm install
cp .env.example .env   # optional: set VITE_FIRECRAWL_API_URL / VITE_FIRECRAWL_API_KEY
pnpm dev
```

The API URL defaults to `http://localhost:3002`. You can change the URL and key at runtime on the **Settings** page; they are stored in this browser's localStorage and override the env values.

| Script | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Typecheck and build for production into `dist/` |
| `pnpm typecheck` | `tsc -b` |
| `pnpm lint` | ESLint |
| `pnpm preview` | Serve the production build |

## Pages

| Route | API |
|---|---|
| `/` | Overview, quick scrape/search, recent jobs, credit snapshot |
| `/scrape` | `POST /v2/scrape`, `GET /v2/scrape/:id`, interact |
| `/batch`, `/batch/:id` | Batch scrape: submit, status, errors, cancel, export |
| `/crawl`, `/crawl/:id` | Crawl: AI params preview, live WebSocket status, errors, cancel, export |
| `/map` | `POST /v2/map` |
| `/search` | `POST /v2/search` |
| `/extract`, `/extract/:id` | Extract jobs |
| `/agent`, `/agent/:id` | Agent jobs |
| `/parse` | Upload a document and parse it |
| `/browser`, `/browser/:id` | Browser sessions: create, execute code, live view, replay |
| `/monitors`, `/monitors/new`, `/monitors/:id` | Change monitors and check history |
| `/usage` | Credits, tokens, history charts, concurrency, queue, activity |
| `/settings` | API URL/key, connection test, theme |

## Self-hosted notes

Some endpoints need services a default self-hosted deployment doesn't run: credit/token usage needs billing, activity/browser/monitors need the database, and scrape interact needs DB auth. Those cards and pages show the API's error instead of breaking the rest of the app. The Settings connection test uses `/v2/concurrency-check`, which works everywhere.

## Project layout

```
src/
  lib/            API client, shared types, settings, job history, polling, cURL builder
  components/ui/  UI primitives
  components/shared/  DocumentViewer, FormatSelector, ScrapeOptionsForm, RequestPreview, …
  layouts/        App shell (sidebar, top bar)
  pages/          Settings, 404
  features/<name>/  One folder per feature: routes.tsx, pages, api.ts, types.ts, components/
```

See `PLAN.md` for the build plan and the conventions each feature follows.
