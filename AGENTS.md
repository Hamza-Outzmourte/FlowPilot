# FlowPilot — agent guide

Visual AI workflow automation: n8n-style canvas editor + dashboard. React 19 + TS + Tailwind v4 frontend, FastAPI backend. Dark-first.

## Mission

Build a product that feels like **n8n's website**, not like an AI template:
clean, premium, minimal, confident. Generous whitespace, bold type,
one accent, real product surfaces. Never "AI-looking."

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TS (strict), Vite, Tailwind v4, Radix/shadcn, @xyflow/react, Zustand, TanStack Query, Framer Motion, Lucide |
| Backend | Python 3.12 + FastAPI, SQLAlchemy 2 (async) + Alembic, Celery + Redis, LangChain/LangGraph, pgvector |
| DB | PostgreSQL 16 (+ pgvector) |
| Tooling | pnpm, uv, ESLint, Ruff, mypy, Vitest, Playwright, Pytest |

Do not introduce other frameworks (MUI, Chakra, Redux, Django) without asking.

## Commands

```bash
pnpm install && cd apps/api && uv sync
docker compose up -d postgres redis
pnpm --filter web dev          # :5173
cd apps/api && uv run fastapi dev flowpilot/main.py   # :8000
pnpm --filter web lint && pnpm --filter web typecheck && pnpm --filter web test
cd apps/api && uv run ruff check . && uv run mypy flowpilot && uv run pytest
```

## Design direction (n8n-like, minimal)

**Aesthetic.** Calm canvas, expressive nodes. Depth via light, not borders.
One accent (violet → cyan gradient, used sparingly). Green/red/amber only
for status. Motion with purpose (120–220 ms ease-out). Dense but precise.

**Anti-patterns (never do these — they read as AI-generated):**
- Gradient text on headings, neon glows on every element, glassmorphism blur everywhere
- Over-rounded corners (keep 8–14 px for app chrome; 22 px nodes only)
- Stock/AI illustrations, emoji in UI, "AI" buzzwords in copy
- Tiny 11 px body text, cramped 4 px spacing, rainbow palettes
- Decorative blobs, animated backgrounds, pulsing dots without meaning

**Tokens.** Always use CSS variables in `styles/tokens.css`. Never hard-code
hex/spacing/font. Tailwind compose via `cva` + `cn()`.

**Typography.** Geist 13–14 px / 1.4 for UI; node title 15–16 px semibold;
panel titles 18–20 px semibold, `-0.01em`. Code/IDs in Geist Mono 12–13 px.
Headings confident and large (24–40 px on marketing surfaces).

**Surfaces.** `--bg-app` canvas, `--bg-surface` panels, `--bg-node` tiles.
1 px hairlines (`--line-subtle`), soft layered shadows. Selected = 1.5 px
accent ring + soft glow (no layout shift). Floating UI = 85% opacity + blur.

**Spacing.** 4/8 px base; sections 64–96 px vertical on marketing surfaces;
editor internals stay compact (4–12 px).

**Motion.** Respect `prefers-reduced-motion`. 150–220 ms ease-out.
Animated edges only while executing.

## Layout (editor shell)

- Left icon rail ≈ 48 px. Top bar ≈ 78 px (breadcrumb, segmented
  Editor/Executions/Evaluations, Publish split-button).
- Right floating toolbar pill (Add/Search/Sticky/Panel/Ask AI).
- Bottom-left canvas controls (fit/zoom/tidy). Bottom-center Execute pill.
- Bottom Logs bar (collapsed 40 px, expandable).
- Canvas: dot grid 24 px, min zoom 0.2, max 2.5, snap 12 px, undo/redo ≥ 100.

## Nodes (invariants only)

Shapes: **square** tiles (110×110, trigger/action/flow), **wide** (258×110,
agent, label inside), **circle** (92 Ø, sub-nodes). Labels render *below*
tiles (except agent). Handles: 16–18 px circles for `main`; 12 px diamonds for
`ai_*` sub-connections. Add-stub `+` on unconnected outputs.

Node kinds: triggers, actions, flow, AI (agent + sub-nodes), data transform,
core, human review. Connection types: `main` + `ai_*` (see §7.2 of legacy spec).

Agent needs exactly one `ai_languageModel`, ≤1 `ai_memory`,
any number of `ai_tool`.

Node states (corner badge + ring): idle, running, success, error, waiting,
disabled, pinned. Double-click → NDV (Input | Parameters | Output).

## Node system

- Definitions live once in `packages/node-schema` (JSON Schema) and Python.
- Frontend renders NDV forms from schema. `@register_node` only — no manual wiring.
- Workflow JSON validated by Pydantic (BE) + Zod (FE), both from shared schema.
- Migrate old versions via `engine/migrations`; never mutate stored workflows.

## Backend

API under `/api/v1` (OpenAPI). Areas: auth, workflows, executions, nodes,
credentials, knowledge (RAG), dashboard stats, templates, realtime (WS), webhooks.

Engine: topological resolver, items model (`{json,binary,paired_item}`),
sandboxed expressions (no `eval`), per-port branching, sub-node attachment,
events per node over WS, partial runs, retries, cancellation. Code node runs in
isolated subprocess — never `exec` in API process.

Triggers: Telegram (webhook), Gmail (Pub/Sub/poll), Webhook/Form/Chat, Schedule (Celery beat). Credentials encrypted at rest (Fernet/KMS), never returned.

## AI & RAG

Provider registry maps provider → LangChain factory (Gemini, OpenAI,
Anthropic, Ollama, Azure). Agent via LangGraph with attached model/memory/tools.
RAG: loaders → recursive chunker → embeddings → pgvector (HNSW, hybrid BM25+RRF,
optional rerank/MMR). Ingestion async via Celery with live progress.

Mock all LLM calls in CI (`FakeListChatModel`, deterministic embeddings).

## Data model (compact)

UUIDv7 PKs, `created_at/updated_at`, soft-delete workflows, every query
scoped by `workspace_id`. See legacy spec §11 for full table list.

## Security

Validate all input (Pydantic/Zod). Per-workspace auth, no IDOR. Secrets via
env/KMS, never logged. Webhook signature verify. CORS allow-list, rate limit
(Redis). SSRF protection on HTTP/URL ingestion. Sandbox user code.

## Frontend conventions

- Strict TS (`strict`, `noUncheckedIndexedAccess`), no `any`.
- Feature-sliced folders; components ≤ ~200 lines; hooks for logic.
- Memoize canvas nodes; keep selection/hover out of node data; `useStore`
  selectors; debounce autosave ≈ 800 ms.
- Server state via TanStack Query only; editor graph in Zustand + undo/redo.
- a11y: keyboard reachable, ARIA, contrast ≥ 4.5:1, reduced motion.
- Naming: `PascalCase.tsx`, `useThing.ts`, `thing.store.ts`.

## Backend conventions

- mypy strict on `flowpilot/`, ruff lint+format, async in request paths.
- Layering: `api` (thin) → `services` → `db` (repos). No DB in routers.
- Pydantic for every request/response. Structured JSON logging (structlog)
  with correlation fields. Config via pydantic-settings. Reversible migrations.

## Testing

- FE: Vitest + Testing Library; Playwright E2E + screenshot regression of
  reference workflow (dark + light).
- BE: Pytest + pytest-asyncio; per-node unit tests; engine branch/sub-node/
  failure tests; RAG recall@k on fixture corpus; API tests with testcontainers.
- CI: lint, typecheck, unit, E2E smoke, migration up/down, container build.

## Rules

**Always:** read existing code in the area; match patterns; small commits
(conventional); tokens + existing primitives; tests with behavior changes;
schema as single source of truth.

**Never:** hard-code colors/spacing/fonts; copy n8n source/icons/trademarks;
`eval`/`exec` user code in API process; store/log plaintext secrets; swap
core libs; break visual contract without updating this file; leave TODOs
in merged paths.

## Done when

- [ ] Matches design system + editor spec (dark **and** light)
- [ ] Keyboard accessible, focus visible, reduced motion
- [ ] Strict types, no `any`, no lint warnings
- [ ] Tests added/updated and passing; no unmocked live LLM in CI
- [ ] Loading/empty/error states handled
- [ ] `AGENTS.md` updated if contracts changed

## Legacy reference

The previous detailed spec (pixel measurements, full API tables, data model)
is preserved in `AGENTS.legacy.md` for deep-dive lookup. Prefer this file.