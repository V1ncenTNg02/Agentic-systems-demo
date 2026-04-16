# Agentic Systems Demo — Design Spec

**Date:** 2026-04-16  
**Status:** Approved  
**Author:** V1ncenTNg02

---

## 1. Project Overview

A web application that visually demonstrates five different agentic system design patterns. Each pattern has its own page with a real-life demo use case. Users type a prompt, watch agents communicate in a live animated diagram, and see the final output — all using mock data with no external API calls required.

**Primary users:** Developers and learners exploring agentic system design.  
**Current status:** Greenfield — to be built from scratch.  
**Key constraint:** All agent data is mocked. No external APIs, no MCP, no real AI calls in v1. The mock layer must be easy to swap out for real AI (Claude API) in a future version.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Diagram | React Flow (`reactflow`) |
| Animation | Framer Motion |
| Streaming | Server-Sent Events (SSE) via `ReadableStream` in Next.js route handlers |
| Package manager | pnpm |
| Deployment target | Vercel (or any Node-capable host) |
| Database | None (v1 is stateless) |

---

## 3. Architecture

### 3.1 Three-layer model

```
Frontend (React / Next.js App Router)
    ↕  SSE via fetch + ReadableStream (POST)
API Routes  (/api/agents/<pattern>)
    ↕  async generators
Agent Simulation Layer  (lib/agents/)  +  Mock Data  (lib/mock-data/)
```

**Upgrade path:** To replace mock data with real AI, only `lib/agents/` and `lib/mock-data/` change. The API routes and frontend remain untouched.

### 3.2 Shared event type

Every agent message, across all five patterns, uses the same TypeScript type:

```ts
// lib/types.ts
export type AgentStatus = 'thinking' | 'done' | 'passing';

export interface AgentEvent {
  agentId: string;       // unique node ID in the React Flow graph
  agentName: string;     // display label on the card
  status: AgentStatus;
  message: string;       // text shown inside the card / output panel
  to?: string;           // target agentId — animates the edge between the two nodes
}
```

### 3.3 SSE streaming contract

Each API route:
1. Accepts a `POST` with `{ input: string }` body.
2. Returns a `text/event-stream` response.
3. Emits one `data: <JSON>\n\n` per `AgentEvent`, with realistic delays between events (300–1200 ms).
4. Ends with a terminal event: `{ agentId: "__done__", status: "done", message: "", agentName: "" }`.

The frontend consumes the stream using `fetch` + `ReadableStream` (not native `EventSource`, which only supports GET). Each chunk is decoded with `TextDecoder`, split on `\n\n`, and parsed as JSON.

---

## 4. Application Shell

### 4.1 Sidebar (persistent across all routes)

- Fixed left sidebar, ~220 px wide, dark background.
- Two labelled groups: **Single Agent** and **Multi-Agent**.
- Each pattern is a navigation item; the active item is highlighted.
- Clicking an item navigates to its route (client-side, no full reload).

```
┌─────────────────────┐
│  Agentic Demo       │
├─────────────────────┤
│  SINGLE AGENT       │
│  ⚡ ReAct Agent     │ ← active
├─────────────────────┤
│  MULTI-AGENT        │
│  → Sequential       │
│  ⫸ Concurrent       │
│  💬 Group Chat      │
│  👑 Supervisor      │
└─────────────────────┘
```

### 4.2 Per-pattern page layout (Layout B)

Two-column split inside the main area:

```
┌──────────────────────────────────────────────────────┐
│  Page header: pattern name + one-line description    │
├───────────────────┬──────────────────────────────────┤
│  INPUT            │                                  │
│  ─────────────── │      AGENT DIAGRAM               │
│  <textarea>       │      (React Flow canvas)         │
│  [Run →] button   │                                  │
│                   │                                  │
│  OUTPUT           │                                  │
│  ─────────────── │                                  │
│  streamed result  │                                  │
│  text             │                                  │
└───────────────────┴──────────────────────────────────┘
```

- Left column: fixed 300 px. Contains **Input** section (textarea + Run button) and **Output** section (streamed text), each with clear section labels and a divider between them.
- Right column: flexible, takes remaining width. Houses the React Flow canvas with pan/zoom disabled (diagram is fully visible without scrolling).
- Labels: "INPUT" and "OUTPUT" rendered as small all-caps section headers (e.g. `text-xs font-semibold uppercase tracking-widest text-muted`).

---

## 5. Pattern Specifications

### 5.1 ReAct / Tool-Calling Agent — Travel Planner

**Route:** `/react-agent`  
**API:** `POST /api/agents/react`

**User input:** Free-text travel request (e.g. "Plan me a 5-day trip to Tokyo in April for 2 people, budget $3000").

**Diagram layout:** Top-to-bottom.

```
        [🧠 ReAct Agent]
         ↓           ↑
[✈ Flights] [🏨 Hotels] [🍜 Food] [🎌 Activities]
         ↓
    [📋 Final Itinerary]
```

**Agent flow (SSE sequence):**
1. ReAct Agent — `thinking` — "Analysing your request…"
2. ReAct Agent — `passing` to Flights Tool — "Looking up flights…"
3. Flights Tool — `done` — returns mock flight data
4. ReAct Agent — `passing` to Hotels Tool — "Searching hotels…"
5. Hotels Tool — `done` — returns mock hotel data
6. ReAct Agent — `passing` to Food Tool — "Finding restaurants…"
7. Food Tool — `done` — returns mock restaurant picks
8. ReAct Agent — `passing` to Activities Tool — "Checking activities…"
9. Activities Tool — `done` — returns mock activity list
10. ReAct Agent — `thinking` — "Compiling your full plan…"
11. Final Itinerary node — `done` — full structured plan

**Output panel content:** Full itinerary — flights (airline, dates, price), hotel (name, nights, price), daily schedule, restaurants, activities, total cost.

**Mock data fixtures:** `lib/mock-data/travel.ts` — hardcoded flight options, hotels, restaurants, and activities for ~5 popular destinations (Tokyo, Paris, NYC, Bali, London). Matched via simple `input.toLowerCase().includes(keyword)` check; falls back to Tokyo fixtures if no match.

---

### 5.2 Sequential Pipeline — News Digest

**Route:** `/sequential`  
**API:** `POST /api/agents/sequential`

**User input:** Topic or headline (e.g. "AI regulation in the EU").

**Diagram layout:** Left-to-right linear chain.

```
[📰 BBC] ─┐
[📰 Reuters] ─┼─→ [🔍 Analyzer] → [✍️ Writer]
[📰 AP] ──┘
```

**Agent flow (SSE sequence):**
1. BBC Source — `thinking` → `done` — emits mock article excerpt
2. Reuters Source — `thinking` → `done` — emits mock article excerpt
3. AP Source — `thinking` → `done` — emits mock article excerpt
4. Analyzer — `thinking` — "Cross-referencing three sources…" → `done` — key facts extracted
5. Writer — `thinking` — "Drafting neutral summary…" → `done` — structured digest

**Output panel content:** Structured digest with sections: **Summary**, **Key Facts**, **Points of Consensus**, **Points of Divergence**, **Sources**.

**Mock data fixtures:** `lib/mock-data/news.ts` — 3–5 topic slugs (AI regulation, climate, economy, geopolitics, tech) each with three mock article excerpts (one per source).

---

### 5.3 Concurrent Agents — Market Research Report

**Route:** `/concurrent`  
**API:** `POST /api/agents/concurrent`

**User input:** Company name (e.g. "OpenAI", "Tesla", "Apple").

**Diagram layout:** Fan-out / fan-in.

```
           [🎯 Dispatcher]
    ┌──────┬────────┬────────┐
[🏆 Comp.] [💰 Fin.] [💬 Sent.] [📈 Trends]
    └──────┴────────┴────────┘
           [📊 Aggregator]
```

**Agent flow (SSE sequence):**
1. Dispatcher — `thinking` — "Spinning up 4 research agents…"
2. All 4 agents emit `thinking` simultaneously (SSE sends all 4 in rapid succession, <100 ms apart, creating a "fan-out" visual effect)
3. Each agent emits `done` at staggered intervals (300–900 ms apart)
4. Aggregator — `thinking` — "Merging findings…" → `done` — full report

**Output panel content:** Report with four labelled sections matching the four agents, plus an **Executive Summary** at the top.

**Mock data fixtures:** `lib/mock-data/market-research.ts` — 3–5 company slugs with pre-written research blurbs per section. Falls back to a generic "ACME Corp" dataset for unrecognised inputs.

---

### 5.4 Group Chat — Product Design Critique

**Route:** `/group-chat`  
**API:** `POST /api/agents/group-chat`

**User input:** Product idea description (e.g. "An AI-powered meal planner that generates weekly grocery lists").

**Diagram layout:** Diamond/triangle arrangement — 4 nodes with edges connecting all pairs.

```
           [🎨 Designer]
          /              \
[📊 Biz Analyst]    [😈 Devil's Advocate]
          \              /
           [🤝 Moderator]
```

**Agent flow (SSE sequence):**  
Agents speak in turns; the active edge animates when one agent addresses another:
1. Moderator — opens discussion, restates the brief
2. Designer — praises aesthetics, raises UX concern
3. Biz Analyst — evaluates market size, questions monetisation
4. Devil's Advocate — challenges core assumption
5. Designer — responds to challenge
6. Biz Analyst — finds middle ground with Designer
7. Devil's Advocate — concedes one point, raises another
8. Moderator — synthesises and calls for consensus
9. All three — short `done` messages agreeing on recommendation
10. Moderator — final verdict / recommendation

**Output panel content:** Conversation transcript with agent name labels, followed by a **Consensus Verdict** block at the end.

**Mock data fixtures:** `lib/mock-data/product-critique.ts` — 3–4 product archetypes (SaaS tool, consumer app, hardware device, marketplace) with scripted debate exchanges. Matched via `input.toLowerCase().includes(keyword)`; falls back to "SaaS tool" archetype.

---

### 5.5 Supervisor + Sub-agents — Software Builder

**Route:** `/supervisor`  
**API:** `POST /api/agents/supervisor`

**User input:** App description (e.g. "Build a task management app with user auth, team collaboration, and real-time updates").

**Diagram layout:** Hub-and-spoke.

```
          [👑 Supervisor / Planner]
    ┌──────┬────────┬────────┐
[🖥️ Frontend] [⚙️ Backend] [🗄️ Database] [☁️ Infra]
    └──────┴────────┴────────┘
          [✅ Build Summary]
```

**Agent flow (SSE sequence):**
1. Supervisor — `thinking` — "Analysing requirements…" → `done` — produces a plan
2. Supervisor — `passing` to Frontend — task spec
3. Frontend Agent — `thinking` → `done` — frontend deliverable summary
4. Supervisor — `passing` to Backend
5. Backend Agent — `thinking` → `done` — backend deliverable summary
6. Supervisor — `passing` to Database
7. Database Agent — `thinking` → `done` — schema and storage summary
8. Supervisor — `passing` to Infra
9. Infra Agent — `thinking` → `done` — infrastructure summary
10. Supervisor — `thinking` — "Reviewing all outputs…" → `done` — final integration notes
11. Build Summary node — `done` — consolidated build report

**Output panel content:** Structured build report with sections per sub-agent plus a **Project Overview** intro from the Supervisor.

**Mock data fixtures:** `lib/mock-data/software-builder.ts` — 3–5 app archetypes (task manager, e-commerce, social app, dashboard, API service) with scripted sub-agent responses.

---

## 6. React Flow Diagram Behaviour

### 6.1 Node types

| Type | Visual | Used for |
|------|--------|---------|
| `agentNode` | Rounded card, coloured border, avatar icon + name | All agents / tools |
| `outputNode` | Rounded card, green border | Final output nodes |

### 6.2 Edge animation

- Default state: thin grey edge.
- When an `AgentEvent` with `to` arrives: the edge between `agentId` and `to` pulses with an animated travelling dot (React Flow `AnimatedSVGEdge` or custom SVG stroke-dashoffset animation).
- When `status === 'done'`: the source node border transitions from its colour to a brighter/solid state (Framer Motion `animate`).
- When `status === 'thinking'`: the node shows a subtle pulsing ring (CSS `animate-ping`).

### 6.3 Canvas settings

- Pan: disabled.
- Zoom: disabled.
- Node drag: disabled.
- `fitView` on mount so the diagram fills the canvas without scrollbars.

---

## 7. Folder Structure

```
e:/GitProject/Agentic-systems-demo/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout — sidebar + main shell
│   │   ├── page.tsx                    # Home — pattern overview/landing
│   │   ├── react-agent/page.tsx
│   │   ├── sequential/page.tsx
│   │   ├── concurrent/page.tsx
│   │   ├── group-chat/page.tsx
│   │   ├── supervisor/page.tsx
│   │   └── api/agents/
│   │       ├── react/route.ts
│   │       ├── sequential/route.ts
│   │       ├── concurrent/route.ts
│   │       ├── group-chat/route.ts
│   │       └── supervisor/route.ts
│   ├── lib/
│   │   ├── types.ts                    # AgentEvent, AgentStatus
│   │   ├── agents/
│   │   │   ├── react-agent.ts
│   │   │   ├── sequential.ts
│   │   │   ├── concurrent.ts
│   │   │   ├── group-chat.ts
│   │   │   └── supervisor.ts
│   │   └── mock-data/
│   │       ├── travel.ts
│   │       ├── news.ts
│   │       ├── market-research.ts
│   │       ├── product-critique.ts
│   │       └── software-builder.ts
│   └── components/
│       ├── sidebar/
│       │   └── Sidebar.tsx
│       ├── diagram/
│       │   ├── AgentDiagram.tsx        # React Flow wrapper (per-pattern)
│       │   ├── nodes/
│       │   │   ├── AgentNode.tsx
│       │   │   └── OutputNode.tsx
│       │   └── edges/
│       │       └── AnimatedEdge.tsx
│       └── panels/
│           ├── InputPanel.tsx
│           └── OutputPanel.tsx
├── docs/superpowers/specs/
│   └── 2026-04-16-agentic-systems-demo-design.md
├── public/
├── .gitignore                          # includes .superpowers/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 8. CLAUDE.md Summary (for agent context)

- Project: Agentic Systems Demo
- Purpose: Visual demo of 5 agentic orchestration patterns using mock data
- Primary users: Developers learning agentic system design
- Status: Greenfield
- Framework: Next.js 14+ App Router, TypeScript, Tailwind, React Flow, Framer Motion
- Package manager: pnpm
- No database in v1
- All agent behaviour lives in `lib/agents/` — this is the only layer that changes when real AI is added
- Mock data lives in `lib/mock-data/`
- SSE streaming: API routes emit `AgentEvent` objects one at a time
- Do not add real API keys or external service calls without explicit instruction
- Keep files under ~300 lines

---

## 9. Out of Scope (v1)

- Real AI / Claude API calls (mock only)
- User authentication
- Persistence / history
- Mobile layout (desktop-first)
- Internationalisation
- Dark/light mode toggle (dark mode by default)
