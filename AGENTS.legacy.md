# agent.md — FlowPilot

> Instructions for AI coding agents (Claude Code, Cursor, Copilot, Codex, etc.) working in this repository.
> Read this file fully before writing code. When this file and your assumptions disagree, **this file wins**.

---

## 1. Mission

**FlowPilot** is a visual, node-based **AI automation workflow editor**. Users connect triggers, AI agents, tools, and app actions on an infinite canvas, execute them, and monitor results from a dashboard.

- **Look & feel:** the same workflow-canvas language as n8n (dark canvas, rounded node tiles, round "main" handles, diamond "AI" sub-connections, trigger bolts, `+` add-stubs, right-side node-creator drawer) but with a **more modern, premium finish**: refined depth, glassy surfaces, a violet→cyan accent, smooth motion, tight typography. Nothing should look like a default/beginner admin template.
- **AI-native:** LangChain + LangGraph agents, tool calling, memory, and **RAG** (document ingestion → embeddings → vector store → retriever) are first-class node types, not plugins.
- **Stack:** React + TypeScript + Tailwind CSS (frontend), Python + FastAPI (backend).
- **Dark mode is the primary design target.** Light mode must work and be polished, but design dark first.

### Non-goals (for now)
- Mobile-first editing (the editor is desktop/tablet; dashboard must be responsive).
- Self-hosted multi-tenant billing.
- Copying n8n's code, assets, or branding. We replicate the *interaction patterns and layout*, never their source or logos.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | **React 19 + TypeScript (strict)** | Vite build, no CRA, no Next.js for the editor |
| Styling | **Tailwind CSS v4** + CSS variables (design tokens) | Variants via `class-variance-authority`; merge with `tailwind-merge` |
| UI primitives | **Radix UI** (shadcn/ui pattern, copied into `components/ui`) | Fully restyled to FlowPilot tokens |
| Canvas | **@xyflow/react (React Flow v12)** | Custom nodes, edges, handles; never fork the library |
| State | **Zustand** (editor/canvas) + **TanStack Query** (server state) | No Redux |
| Forms / validation | **React Hook Form + Zod** | Zod schemas generated from node definitions |
| Animation | **Framer Motion** | Respect `prefers-reduced-motion` |
| Icons | **Lucide** + custom SVG brand icons (Telegram, Gmail, Gemini, etc.) | Brand icons live in `packages/node-icons` |
| Code editor | **Monaco** (Code node, expressions) | Lazy-loaded |
| Charts | **Recharts** (dashboard) | Themed with tokens |
| Backend framework | **Python 3.12 + FastAPI** | Fully async, Pydantic v2 |
| AI orchestration | **LangChain + LangGraph** | Agents, tools, memory, chains |
| RAG | LangChain loaders + splitters + embeddings → **PostgreSQL + pgvector** | Optional rerank step |
| Database | **PostgreSQL 16** (+ `pgvector`) | SQLAlchemy 2.0 (async) + Alembic |
| Queue / scheduler | **Redis + Celery** (beat for schedules) | One worker per execution; cancellable |
| Realtime | **WebSocket** (execution events, logs) with SSE fallback | |
| Auth | JWT (access + refresh) + OAuth2 for connectors | Argon2 password hashing |
| Tooling | pnpm workspaces, `uv` (Python), Ruff, mypy, ESLint, Prettier, Vitest, Playwright, Pytest | |
| Infra | Docker Compose for dev; Dockerfiles for prod | |

**Do not** introduce additional frameworks (e.g. MUI, Chakra, Redux, Django) without an explicit request.

---

## 3. Repository Layout

```
flowpilot/
├── agent.md                      # this file
├── docker-compose.yml
├── .env.example
├── apps/
│   ├── web/                      # React + TS + Tailwind frontend
│   │   └── src/
│   │       ├── app/              # routes, providers, layouts
│   │       ├── features/
│   │       │   ├── editor/       # canvas, nodes, edges, toolbars, NDV, logs
│   │       │   ├── dashboard/    # overview, charts, tables
│   │       │   ├── executions/
│   │       │   ├── knowledge/    # RAG collections & documents UI
│   │       │   ├── credentials/
│   │       │   ├── templates/
│   │       │   └── settings/
│   │       ├── components/ui/    # design-system primitives
│   │       ├── lib/              # api client, utils, ws client
│   │       ├── stores/           # zustand stores
│   │       ├── styles/           # tokens.css, globals.css
│   │       └── types/            # generated API types
│   └── api/                      # FastAPI backend
│       └── flowpilot/
│           ├── main.py
│           ├── api/              # routers (v1)
│           ├── core/             # config, security, logging
│           ├── db/               # models, session, migrations/
│           ├── engine/           # workflow runner, graph resolver, expressions
│           ├── nodes/            # node implementations
│           │   ├── triggers/     # telegram, gmail, webhook, schedule, manual, chat
│           │   ├── actions/      # telegram, gmail, http, sheets, notion, slack...
│           │   ├── flow/         # if, switch, merge, loop, wait
│           │   ├── ai/           # agent, chat_models, memory, tools, rag
│           │   └── core/         # code, set, http_request, webhook-response
│           ├── ai/               # providers registry, langchain factories
│           ├── rag/              # ingestion, chunking, embeddings, retrieval
│           ├── triggers/         # listener manager, polling, webhooks
│           ├── services/
│           ├── workers/          # celery app + tasks
│           └── tests/
├── packages/
│   ├── node-schema/              # shared JSON Schema for node definitions + workflow JSON
│   └── node-icons/
└── docs/
```

---

## 4. Commands

```bash
# Setup
pnpm install
cd apps/api && uv sync

# Dev (everything)
docker compose up -d postgres redis
pnpm --filter web dev                       # http://localhost:5173
cd apps/api && uv run fastapi dev flowpilot/main.py   # http://localhost:8000
cd apps/api && uv run celery -A flowpilot.workers.app worker -l info

# Quality
pnpm --filter web lint && pnpm --filter web typecheck && pnpm --filter web test
cd apps/api && uv run ruff check . && uv run mypy flowpilot && uv run pytest

# DB
cd apps/api && uv run alembic revision --autogenerate -m "msg" && uv run alembic upgrade head

# API types for frontend (OpenAPI → TS)
pnpm --filter web gen:api
```

Always run lint + typecheck + tests for the area you changed before declaring work done.

---

## 5. Design System

### 5.1 Principles
1. **Calm canvas, expressive nodes.** The canvas is near-black and quiet; nodes carry the visual weight.
2. **Depth through light, not borders.** Use 1px hairlines + soft inner highlights + layered shadows instead of heavy outlines.
3. **One accent.** Violet is the interaction color (focus, selection, primary actions). Cyan appears only in gradients/glows. Green/red/amber are strictly semantic status colors.
4. **Motion with purpose.** 120–220 ms ease-out transitions; animated edges only while executing.
5. **Density like a pro tool.** Compact, precise spacing — never oversized "marketing" padding inside the editor.

### 5.2 Tokens (`styles/tokens.css`)

```css
@import "tailwindcss";

@theme {
  --font-sans: "Geist", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", "JetBrains Mono", ui-monospace, monospace;

  --radius-node: 22px;
  --radius-panel: 14px;
  --radius-control: 10px;
}

:root, .dark {
  /* Surfaces (dark-first) */
  --bg-app:        #0c0c0e;
  --bg-canvas:     #0f0f12;
  --bg-surface:    #17171b;   /* panels, drawers */
  --bg-surface-2:  #1f1f24;   /* headers, inputs */
  --bg-node:       #26262c;
  --bg-node-hover: #2f2f36;

  /* Lines */
  --line-subtle:   rgba(255,255,255,0.06);
  --line-default:  rgba(255,255,255,0.10);
  --line-strong:   rgba(255,255,255,0.18);
  --canvas-dot:    rgba(255,255,255,0.07);
  --edge:          #5b5b64;

  /* Text */
  --text-primary:   #f4f4f6;
  --text-secondary: #b0b0ba;
  --text-muted:     #787884;

  /* Brand + semantic */
  --accent:        #8b5cf6;
  --accent-hover:  #9d75f8;
  --accent-glow:   rgba(139,92,246,0.35);
  --accent-grad:   linear-gradient(135deg, #8b5cf6 0%, #22d3ee 100%);
  --success:       #22c55e;
  --warning:       #f59e0b;
  --danger:        #ef4444;
  --info:          #38bdf8;

  /* Shadows */
  --shadow-node:   0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(0,0,0,0.45);
  --shadow-float:  0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px var(--line-default);
}

.light {
  --bg-app: #f6f6f8;  --bg-canvas: #fafafb;  --bg-surface: #ffffff;  --bg-surface-2: #f1f1f4;
  --bg-node: #ffffff; --bg-node-hover: #f4f4f7;
  --line-subtle: rgba(0,0,0,0.05); --line-default: rgba(0,0,0,0.09); --line-strong: rgba(0,0,0,0.16);
  --canvas-dot: rgba(0,0,0,0.10); --edge: #a1a1ad;
  --text-primary: #131316; --text-secondary: #4a4a55; --text-muted: #8a8a96;
  --shadow-node: 0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(20,20,40,0.08);
}
```

Never hard-code hex values in components. Use tokens via Tailwind (`bg-[--bg-node]` or mapped utilities).

### 5.3 Typography
- UI: **Geist** 13–14 px / 1.4. Node title: 15–16 px semibold. Node subtitle: 12–13 px, `--text-muted`.
- Panel titles: 18–20 px semibold, `-0.01em` tracking.
- Code, expressions, IDs: **Geist Mono** 12–13 px.

### 5.4 Surfaces & effects
- Floating UI (toolbars, drawers, menus): `--bg-surface` at ~85% opacity + `backdrop-blur-xl` + `--shadow-float`.
- Selected node: 1.5px `--accent` ring + soft `--accent-glow` outer glow (no layout shift).
- Hover: raise `--bg-node` → `--bg-node-hover`, translateY(-1px), 150 ms.
- Focus-visible: 2px `--accent` outline with 2px offset, on **every** interactive element.
- Canvas background: dot grid (`--canvas-dot`, 1.2px dots, 24px gap) with a very subtle radial vignette at the edges.

---

## 6. Editor UI Specification (match the reference screenshots)

The reference screenshots show the editor in dark mode. Pixel values below are **reference measurements at 100% zoom** — implement them as design values, not as hard layout hacks.

### 6.1 Application shell

```
┌────┬───────────────────────────────────────────────────────────────────────┐
│    │  Top bar:  [Personal / My workflow  ···]   [Editor|Executions|Eval]   [Publish ▾] │
│ S  ├───────────────────────────────────────────────────────────────────────┤
│ i  │                                                                        │
│ d  │                           CANVAS (dot grid)                    ┌──┐   │
│ e  │                                                                │R │   │
│ b  │  [⛶ + − ✦]                [ Execute ▾ ]                        │T │   │
│ a  │                                                                └──┘   │
│ r  ├───────────────────────────────────────────────────────────────────────┤
│    │  Logs  (collapsed bar, pop-out + chevron on right)                     │
└────┴───────────────────────────────────────────────────────────────────────┘
```

- **Left sidebar (≈48 px, icon rail):** top group — add (`+`), search, toggle-panel. Middle group — AI/sparkle, home (dashboard), workflows. Bottom group — cloud/sync, templates/grid, insights (chart), help (with red notification dot), what's new. Tooltips on hover; active item has `--bg-surface-2` pill.
- **Top bar (≈78 px tall):**
  - Left: breadcrumb `Personal` (project, underlined link) `/` workflow name (inline-editable) and an overflow `···` menu (rename, duplicate, download JSON, import, settings, archive).
  - Center: **segmented control** `Editor | Executions | Evaluations`. Active segment = darker inset pill. Router-backed tabs.
  - Right: **Publish** split-button (pill; main click publishes/activates, chevron opens version history / unpublish / schedule).
- **Right floating toolbar (vertical pill, top-right of canvas):** Add node (`+`), Search nodes, Add sticky note, Toggle side panel / layout, **Ask AI** (sparkle). Glass surface, 44 px buttons.
- **Bottom-left canvas controls (horizontal pill):** Fit view, Zoom in, Zoom out, Tidy up / auto-layout.
- **Bottom-center Execute pill:** white (primary-inverse) pill with the active trigger's icon + label **Execute** + dropdown chevron (choose which trigger to run, run from selected node, run with pinned data). While running it becomes **Stop** with a spinner.
- **Logs bar (bottom):** collapsed 40 px bar labeled `Logs`; right side has "open in new window" and expand chevron. Expanded: resizable split showing per-node timeline, input/output JSON, LLM token usage and tool calls.

### 6.2 Canvas
- Infinite pan/zoom (min 0.2, max 2.5), wheel = zoom to cursor, space+drag / middle-drag = pan, box-select with drag on empty canvas.
- Snap-to-grid 12 px (toggle). Multi-select, copy/paste (JSON clipboard), undo/redo (≥ 100 steps).
- Keyboard: `Tab` open node creator, `Ctrl/Cmd+Enter` execute, `Del` delete, `Ctrl/Cmd+D` duplicate, `D` disable node, `P` pin data, `F2` rename, `Ctrl/Cmd+K` command palette.
- Auto-pan while dragging a connection near edges.

### 6.3 Node anatomy

All node **labels render below the tile**: title (semibold, `--text-primary`) and subtitle (`--text-muted`, e.g. `Updates: message`, `sendMessage: message`, `reply: message`, `Gmail Trigger`). Tiles never contain the text, except the **Agent** node.

| Node kind | Shape | Size (ref) | Handles |
|---|---|---|---|
| **Trigger** (Telegram Trigger, Gmail Trigger, Webhook, Schedule…) | Rounded square, `--radius-node` | 110 × 110 | **Output** circle on right edge. **Lightning-bolt badge** floats ~20 px to the left of the tile. No input. |
| **Action / App** (Send a text message, Reply to a message…) | Rounded square | 110 × 110 | Input circle left, output circle right |
| **Flow** (If, Switch, Merge…) | Rounded square with colored glyph (green for If) | 110 × 110 | Input left; **named outputs** on right, each with a small muted label beside the handle (`true`, `false`) |
| **AI Agent** | Wide rounded rectangle, icon + title **inside** | 258 × 110 | Input left, output right, **diamond sub-handles along bottom** (see 6.4) |
| **Sub-node** (Chat Model, Memory, Tool, Embeddings, Vector Store, Retriever…) | **Circle** | 92 Ø | **Diamond** handle on top edge. Label + subtitle below |
| **Sticky note** | Rounded rectangle, markdown, 8 preset colors | resizable | none |

- Tile fill `--bg-node`, 1px `--line-subtle`, `--shadow-node`, icon 44–48 px centered, brand icons in full color.
- **Node states** (shown as a corner badge + ring, not by changing layout): `idle`, `running` (animated violet conic ring), `success` (green check badge, edge pulse), `error` (red ring + `!` badge, tooltip with message), `waiting`, `disabled` (50% opacity, strikethrough label), `pinned` (pin badge).
- Double-click a node → **Node Detail View (NDV)**: 3-column modal (Input | Parameters | Output) with schema/JSON/table views and expression editor.

### 6.4 Handles & connections
- **Main handles:** 16–18 px circle, 2px ring in `--edge`, filled `--bg-canvas`; on hover scale 1.15 + `--accent` ring; valid drop targets glow while dragging.
- **AI sub-connection handles:** 12 px **diamonds** (rotated squares). Labels sit under them in `--text-muted` 13 px: `Chat Model` (**required**, marked with red `*`), `Memory`, `Tool`.
- **Add stub:** an unconnected output shows a 40 px line ending in a 24 px rounded `+` button; click opens the node creator filtered to compatible nodes, auto-connecting on selection. The agent's `Tool` handle has the same `+` stub **below** it.
- **Edges:** smooth Bézier, 1.5 px, `--edge` color, small arrowhead at target. Hover → `--text-secondary` and a mid-edge toolbar (`+` insert node, trash). Selected → `--accent`. Running → animated dashed flow in accent→cyan gradient.
- **Sub-connection edges** (agent ↔ chat model/memory/tool) are **dashed**, with a small muted label at the sub-node end (`Model`, `Memory`, `Tool`) and enter the diamond vertically.
- Connection rules are enforced by type compatibility (see §7.2); invalid targets dim and show a tooltip on hover.

### 6.5 Node Creator drawer ("What happens next?")
- Slides in from the right (≈460 px wide, full height) over the canvas with a dimmed/blurred backdrop; canvas stays pannable on the left.
- **Header:** title `What happens next?` (or `Add first step...` / `Select a trigger` depending on context) on `--bg-surface-2`.
- **Search input:** full-width, 40 px, magnifier icon, placeholder `Search nodes...`, **accent-colored focus border** (as in the reference), autofocus, debounced fuzzy search (fuse.js) across name, description, keywords and category.
- **Category list** (each row: left icon, title, one-line muted description, right arrow `→`; hovered/selected row gets a 2px left accent bar):
  1. **AI** — Build autonomous agents, summarize or search documents, etc.
  2. **Action in an app** — Do something in an app or service like Google Sheets, Telegram or Notion
  3. **Data transformation** — Manipulate, filter or convert data
  4. **Flow** — Branch, merge or loop the flow, etc.
  5. **Core** — Run code, make HTTP requests, set webhooks, etc.
  6. **Human review** — Request approval via services like Slack and Telegram before making tool calls
  - *divider*
  7. **Add another trigger** — Triggers start your workflow. Workflows can have multiple triggers.
- Clicking a category pushes a sub-view with a back button, subcategories, and a node list with **Triggers** / **Actions** sections. Show recently used nodes first when the search is empty.
- Keyboard: `↑/↓` navigate, `Enter` select, `→` drill in, `←`/`Esc` back/close.

### 6.6 Example reference workflow (must be seedable as a template)
`Telegram Trigger` → `AI Agent` (Chat Model: **Google Gemini Chat Model**, Memory: **Simple Memory**, Tool: empty `+`) → `If` → **true:** `Send a text message` (Telegram) / **false:** `Reply to a message` (Gmail). A second, disconnected `Gmail Trigger` sits below the first trigger. This exact graph must render pixel-faithfully and is used as the visual regression baseline (Playwright screenshot).

---

## 7. Node System

### 7.1 Categories
- **Triggers:** Manual, Webhook, Schedule/Cron, Telegram Trigger, Gmail Trigger, Chat Trigger, Form Trigger, Error Trigger.
- **AI:** AI Agent, Basic LLM Chain, Retrieval QA, Chat Models (Gemini, OpenAI, Anthropic, Ollama), Memory (Simple/Buffer Window, Postgres, Redis), Tools (HTTP tool, Calculator, Code tool, Workflow-as-tool, Vector Store tool), Embeddings, Vector Store (pgvector), Retriever, Document Loader, Text Splitter, Output Parser, Guardrails.
- **Actions in an app:** Telegram (send message/photo/edit), Gmail (send/reply/label/get), Google Sheets, Notion, Slack, Discord, GitHub, Airtable, Postgres, S3.
- **Data transformation:** Set/Edit Fields, Filter, Sort, Aggregate, Split Out, Summarize, Date & Time, Crypto, JSON/XML/CSV/HTML.
- **Flow:** If, Switch, Merge, Loop Over Items, Wait, Stop & Error, Execute Sub-workflow.
- **Core:** Code (Python + JS), HTTP Request, Webhook Response, Respond to Chat, Read/Write Files.
- **Human review:** Approval via Slack/Telegram/Email before tool calls and sensitive actions.

### 7.2 Connection types
```ts
type ConnectionType =
  | "main"
  | "ai_languageModel" | "ai_memory" | "ai_tool"
  | "ai_embedding" | "ai_vectorStore" | "ai_retriever"
  | "ai_document" | "ai_textSplitter" | "ai_outputParser";
```
`main` renders as circles; every `ai_*` type renders as a diamond. A source sub-node's `ai_*` output may only connect to a parent input of the same type. The Agent requires exactly one `ai_languageModel`, allows ≤ 1 `ai_memory`, and any number of `ai_tool`.

### 7.3 Node definition contract
Every node is declared **once** in a language-neutral definition (`packages/node-schema`) and implemented in Python. The frontend renders the NDV form entirely from this schema.

```ts
interface NodeDefinition {
  type: string;                // "flowpilot.telegramTrigger"
  version: number;
  displayName: string;
  subtitle?: string;           // expression: "={{ $parameter.event }}"
  group: "trigger" | "action" | "flow" | "data" | "ai" | "core" | "human";
  shape: "square" | "wide" | "circle";
  icon: string;                // key in node-icons
  inputs: PortSpec[];          // [{ type: "main" }] or AI sub-inputs w/ label + required
  outputs: PortSpec[];         // [{ type: "main", label: "true" }, { type: "main", label: "false" }]
  credentials?: { name: string; required: boolean }[];
  properties: ParameterSpec[]; // string|number|boolean|options|json|code|expression|collection|resourceLocator
  documentationUrl?: string;
}
```

```python
class BaseNode(ABC):
    definition: ClassVar[NodeDefinition]

    @abstractmethod
    async def execute(self, ctx: ExecutionContext) -> NodeOutput: ...

class TriggerNode(BaseNode):
    async def activate(self, ctx: TriggerContext) -> None: ...    # register webhook / poll / cron
    async def deactivate(self, ctx: TriggerContext) -> None: ...
```
Register with `@register_node` — no manual wiring elsewhere. Adding a node must require touching **only** its own files (+ icon).

### 7.4 Workflow JSON (stored, exported, imported)
```json
{
  "id": "wf_01H...", "name": "My workflow", "active": false, "version": 3,
  "nodes": [
    { "id": "n1", "type": "flowpilot.telegramTrigger", "name": "Telegram Trigger",
      "position": [0, 0], "parameters": { "updates": ["message"] },
      "credentials": { "telegramApi": "cred_01H..." }, "disabled": false }
  ],
  "connections": {
    "Telegram Trigger": { "main": [[{ "node": "AI Agent", "type": "main", "index": 0 }]] },
    "Google Gemini Chat Model": { "ai_languageModel": [[{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]] }
  },
  "settings": { "timezone": "Africa/Casablanca", "timeoutSeconds": 3600, "saveExecutionData": "all" },
  "pinData": {}
}
```
Validated by Pydantic on the backend and Zod on the frontend, both generated from the shared schema. Always migrate old versions through `engine/migrations` — never mutate stored workflows ad hoc.

---

## 8. Backend Architecture

### 8.1 API (`/api/v1`, OpenAPI documented)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `GET /auth/me` |
| Workflows | CRUD `/workflows`, `POST /workflows/{id}/publish`, `/unpublish`, `/duplicate`, `GET /workflows/{id}/versions`, import/export |
| Executions | `POST /workflows/{id}/run`, `POST /executions/{id}/stop`, `/retry`, `GET /executions`, `GET /executions/{id}` |
| Nodes | `GET /nodes` (catalog + categories), `GET /nodes/{type}`, `POST /nodes/{type}/options` (dynamic dropdowns) |
| Credentials | CRUD `/credentials`, `POST /credentials/{id}/test`, OAuth2 `GET /oauth/{provider}/start` + callback |
| Knowledge (RAG) | CRUD `/knowledge/collections`, `POST /…/{id}/documents` (upload/URL), `GET /…/{id}/documents`, `POST /…/{id}/query` (debug retrieval) |
| Dashboard | `GET /stats/overview`, `/stats/executions?range=7d`, `/stats/workflows`, `/stats/ai-usage` |
| Templates | `GET /templates`, `POST /templates/{id}/use` |
| Realtime | `WS /ws/executions/{id}`, `WS /ws/workspace` |
| Webhooks (public) | `ANY /webhook/{path}`, `/webhook-test/{path}` |

All responses typed with Pydantic models; errors follow RFC 7807 problem-details.

### 8.2 Execution engine (`engine/`)
- Resolves the workflow graph into an execution plan (topological order, branch handling, sub-node attachment).
- Items model: each node receives and emits a list of **items** (`{ json, binary, paired_item }`); expressions like `{{ $json.message.text }}` / `{{ $('Node Name').item.json.x }}` are evaluated in a **sandbox** (no `eval`; use a restricted expression evaluator).
- Branching nodes return outputs per port (`If` → `[true_items, false_items]`).
- AI Agent node resolves its attached sub-nodes (model, memory, tools) into LangChain objects at runtime.
- Emits events per node: `node.started`, `node.finished`, `node.failed`, `llm.token`, `tool.called`, `execution.finished` → persisted + pushed over WebSocket.
- Supports: manual / test runs with pinned data, partial runs ("execute from here"), retries with backoff, per-node `continueOnFail`, timeouts, cancellation, sub-workflows, error workflows.
- Code node runs in an isolated subprocess/container with CPU, memory, time, and network limits. **Never `exec` user code in the API process.**

### 8.3 Triggers
- `TriggerManager` activates/deactivates triggers when a workflow is published/unpublished and on startup.
- **Telegram:** register bot webhook (`setWebhook`) with a per-workflow secret token; verify header on each request.
- **Gmail:** Google Pub/Sub push (preferred) with polling fallback; incremental sync via `historyId`.
- **Webhook / Form / Chat:** public routes, optional auth (header/basic/JWT), response modes (immediate, last node, Respond-to-Webhook node).
- **Schedule:** cron / interval via Celery beat with timezone support.
- Deduplicate events (idempotency keys) and rate-limit per workflow.

### 8.4 Credentials
- Stored encrypted at rest (Fernet / KMS-backed key), never returned by the API after creation (only masked metadata).
- OAuth2 refresh handled centrally; nodes request a ready-to-use client from `ctx.get_credentials(name)`.

---

## 9. AI, LangChain & RAG

### 9.1 Provider registry (`ai/providers.py`)
A single registry maps `provider → LangChain chat model/embeddings factory` (Google Gemini, OpenAI, Anthropic, Ollama/local, Azure OpenAI). Nodes never import provider SDKs directly — they ask the registry. API keys come from credentials only.

### 9.2 Agent node
- Built with **LangGraph** (`create_react_agent` or a custom graph) using: attached chat model, optional memory (windowed buffer / Postgres / Redis checkpoints keyed by session ID), and attached tools.
- Options: system prompt, max iterations, `return_intermediate_steps`, structured output parser, streaming on/off, require-approval-for-tools (Human review).
- Every LLM call and tool call is traced into the execution log (prompt, response, token counts, latency, cost estimate).

### 9.3 RAG pipeline (`rag/`)
1. **Ingest:** loaders for PDF, DOCX, MD, TXT, HTML, CSV, URLs, Google Drive, Notion → normalized `Document`s with metadata (source, page, collection, checksum).
2. **Chunk:** `RecursiveCharacterTextSplitter` default (800–1000 tokens, 10–15% overlap); markdown/code-aware splitters selectable per collection.
3. **Embed:** provider-selected embeddings (batching, retries, rate-limit aware). Store `embedding_model` + dimension on the collection; **never mix models in one collection**.
4. **Store:** pgvector table `knowledge_chunks` with HNSW index (cosine), metadata JSONB, `tsvector` column for hybrid search.
5. **Retrieve:** vector search → optional BM25/`tsvector` hybrid (RRF fusion) → optional reranker → MMR for diversity. Returns chunks + scores + citations.
6. **Generate:** Retrieval QA / Agent with a **Vector Store Tool** sub-node; answers must include source citations when `cite_sources` is enabled.
7. **Ingestion is async** (Celery task) with progress events (`queued → parsing → chunking → embedding → indexed | failed`) shown live in the Knowledge UI.

RAG nodes: `Document Loader`, `Text Splitter`, `Embeddings`, `Vector Store (Insert/Retrieve/Update)`, `Retriever`, `Vector Store Tool`, `Retrieval QA Chain`. Collections are managed in the **Knowledge** page and selected in nodes via a resource locator.

### 9.4 Evaluations (tab in the editor)
Datasets of input/expected pairs, run a workflow against them, score with metrics (exact match, LLM-as-judge, retrieval hit-rate/MRR for RAG), compare runs side-by-side.

### 9.5 Safety
- Prompt-injection awareness: treat retrieved/tool content as untrusted data; never let it override system instructions or exfiltrate credentials.
- Redact secrets/PII from logs; configurable data retention per workflow.
- Hard caps on tokens, iterations, tool calls, and spend per execution.

---

## 10. Dashboard & Other Pages

Routes: `/dashboard`, `/workflows`, `/workflows/:id` (Editor | Executions | Evaluations), `/executions`, `/knowledge`, `/credentials`, `/templates`, `/settings`, `/login`.

### 10.1 Dashboard (`/dashboard`)
Same shell as the editor (icon rail + top bar), content on `--bg-app` with `--bg-surface` cards (radius 14, hairline border, subtle gradient highlight on top edge).

- **Header:** greeting, quick actions — `New workflow` (primary, gradient), `Import`, `Browse templates`.
- **KPI row (4 cards, sparkline each):** Total executions, Success rate, Avg. duration, Active workflows. Include delta vs. previous period.
- **Executions over time:** stacked area/bar chart (success / error), range switcher `24h · 7d · 30d`.
- **AI usage:** tokens + estimated cost by provider/model (donut + table).
- **Recent executions:** table with status pill, workflow, trigger icon, started, duration, `Retry` / `View`. Row click opens the execution with the canvas replay.
- **Top workflows / failing workflows** lists.
- **Knowledge health:** collections, document count, last indexed, failed ingestions.
- Skeleton loaders on every card; empty states with an illustration + CTA; auto-refresh via WebSocket.

### 10.2 Workflows list
Grid/list toggle, search, tags, status filter (active/inactive/archived), sort, bulk actions, card shows a **mini canvas thumbnail** rendered from the workflow JSON.

### 10.3 Executions
Filterable table (status, workflow, date, trigger), detail view = read-only canvas with per-node status overlays + item counts on edges + input/output inspector. "Copy to editor" (loads execution data as pinned data).

### 10.4 Knowledge (RAG)
Collections grid; collection detail with drag-and-drop upload, URL ingestion, per-document status, chunk preview, **Retrieval playground** (query → ranked chunks with scores and metadata), re-index and delete.

### 10.5 Credentials, Templates, Settings
Credentials: typed forms with "Test connection". Templates: curated gallery including the reference workflow from §6.6. Settings: profile, API keys, theme (dark/light/system), workspace, usage limits.

---

## 11. Data Model (PostgreSQL)

`users`, `workspaces`, `workspace_members`, `workflows` (JSONB graph, `active`, `version`), `workflow_versions`, `executions` (status, mode, started_at, finished_at, `error`), `execution_node_runs` (node, status, input/output refs, tokens, latency), `credentials` (encrypted blob), `webhooks`, `trigger_state` (cursors like Gmail `historyId`), `knowledge_collections`, `knowledge_documents`, `knowledge_chunks` (`embedding vector(N)`, `tsv tsvector`), `chat_sessions`/`chat_messages` (memory), `evaluation_datasets`, `evaluation_runs`, `templates`, `audit_log`, `api_keys`.

Rules: UUIDv7 primary keys, `created_at/updated_at` everywhere, soft-delete for workflows, every query scoped by `workspace_id`.

---

## 12. Security Checklist
- Validate **all** inputs with Pydantic/Zod; reject unknown fields.
- Per-workspace authorization on every route (no IDOR); write tests for cross-tenant access.
- Secrets only via env/KMS; never commit `.env`; never log credentials, tokens, or full prompts containing secrets.
- Webhook signature/secret verification; CORS allow-list; CSRF-safe cookie settings; rate limiting (Redis).
- SSRF protection on HTTP Request / URL ingestion (block private IP ranges, enforce timeouts and size limits).
- Sandbox all user code; dependency scanning (`pip-audit`, `pnpm audit`) in CI.

---

## 13. Frontend Conventions
- Strict TypeScript: `strict`, `noUncheckedIndexedAccess`; **no `any`** (use `unknown` + Zod narrowing).
- Feature-sliced folders; components ≤ ~200 lines; hooks for logic, components for presentation.
- Canvas performance is critical: memoize custom nodes (`React.memo`), keep selection/hover state out of node data, use `useStore` selectors, virtualize long lists (node creator, executions), debounce autosave (≈800 ms) and show a `Saved` indicator.
- Server state through TanStack Query only; editor graph state lives in a Zustand store with an undo/redo history middleware.
- Accessibility: all controls keyboard reachable, ARIA roles for the creator list/tabs/menus, color contrast ≥ 4.5:1, honor `prefers-reduced-motion`.
- Tailwind: compose with `cva` + `cn()`; no arbitrary inline `style` except dynamic positions/transforms; no magic colors.
- Naming: components `PascalCase.tsx`, hooks `useThing.ts`, stores `thing.store.ts`.

## 14. Backend Conventions
- Fully typed (`mypy --strict` on `flowpilot/`), `ruff` for lint + format, async everywhere in request paths.
- Layering: `api` (thin routers) → `services` (business logic) → `db` (repositories). No DB access in routers.
- Pydantic models for every request/response; no raw dicts crossing layer boundaries.
- Structured JSON logging (`structlog`) with `execution_id`, `workflow_id`, `node_id` correlation fields; OpenTelemetry tracing.
- Config via `pydantic-settings`; 12-factor.
- Every Alembic migration must be reversible.

---

## 15. Testing & Quality Gates
- **Frontend:** Vitest + Testing Library for components/stores; **Playwright** for E2E (create workflow, connect nodes, open node creator, execute) and **screenshot regression** of the §6.6 reference workflow in dark and light.
- **Backend:** Pytest + `pytest-asyncio`; unit tests per node (`execute()` with fake context), engine tests for branching/sub-nodes/failure paths, RAG tests with a small fixture corpus (assert recall@k), API tests with a test Postgres (testcontainers).
- **LLM calls are mocked** in CI using fake chat models/embeddings (`FakeListChatModel`, deterministic embeddings). Live-provider tests are opt-in (`-m live`).
- CI must pass: lint, typecheck, unit, E2E smoke, migration up/down, container build.

---

## 16. Milestones (build in this order)

1. **Foundation:** monorepo, Docker Compose, auth, DB + migrations, design tokens, app shell (sidebar, top bar, theme toggle).
2. **Canvas core:** React Flow canvas with dot grid, custom node shapes (square / wide / circle), main + diamond handles, edges, add-stubs, floating toolbars, canvas controls, undo/redo, autosave, import/export JSON. **Recreate the §6.6 reference workflow visually.**
3. **Node creator + NDV:** right drawer with categories, search, schema-driven parameter forms, expression editor.
4. **Execution engine:** runner, items model, If/Switch/Merge/Set/Code/HTTP, WebSocket events, Logs panel, Executions tab.
5. **Triggers & apps:** Manual, Webhook, Schedule, Telegram, Gmail + Telegram/Gmail actions, credentials + OAuth.
6. **AI:** provider registry, Chat Model/Memory/Tool sub-nodes, AI Agent via LangGraph, streaming tokens in Logs.
7. **RAG:** Knowledge page, ingestion pipeline, pgvector store, retriever + vector-store tool nodes, retrieval playground.
8. **Dashboard:** KPIs, charts, AI usage, recent executions, templates gallery.
9. **Evaluations, Human review, polish:** eval runs, approval nodes, command palette, onboarding, performance pass, a11y pass.

Do one milestone at a time; each ends with a working, tested, demonstrable increment.

---

## 17. Rules for AI Agents

### Always
- Read this file, then the nearest existing code in the area you're changing, and **match its patterns**.
- Plan briefly before large changes; make small, reviewable commits (`feat(editor): …`, `fix(engine): …`, Conventional Commits).
- Use design tokens and existing `components/ui` primitives; reuse before creating.
- Add or update tests with every behavior change; run lint/typecheck/tests before finishing.
- Keep the node definition schema as the single source of truth for node UI and validation.
- Ask for clarification rather than guessing when a requirement conflicts with this file.

### Never
- Hard-code colors, spacing, or fonts outside the token system.
- Copy n8n's source, icons, or trademarks; use our own implementation and neutral/brand-permitted icons.
- Execute untrusted code or evaluate expressions with `eval`/`exec` in the API process.
- Store or log plaintext credentials, or commit secrets.
- Add heavy dependencies without justification; don't swap core libraries (React Flow, FastAPI, LangChain, Tailwind).
- Break the visual contract in §6 (shapes, handle types, label placement, drawer layout) without updating this file first.
- Leave `TODO`/mock data in merged code paths unless clearly feature-flagged.

### Definition of done
- [ ] Matches the §5 design system and §6 editor spec (dark **and** light)
- [ ] Keyboard accessible, focus states visible, reduced motion respected
- [ ] Types strict, no `any`, no lint warnings
- [ ] Tests added/updated and passing; no unmocked live LLM calls in CI
- [ ] Errors handled with user-friendly messages and loading/empty states
- [ ] Docs/`agent.md` updated if conventions or contracts changed

---

*Project: FlowPilot — visual AI workflow automation. Keep this file current; it is the contract between humans and agents.*
