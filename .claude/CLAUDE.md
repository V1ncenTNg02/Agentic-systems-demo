# CLAUDE.md

## Project Overview
- Project: Agentic Systems Demo
- Purpose: Visual demo of 5 agentic orchestration patterns (ReAct, Sequential, Concurrent, Group Chat, Supervisor) using mock data
- Primary users: Developers learning agentic system design
- Current status: Prototype / demo
- Key constraints: All agent data is mocked — no external APIs. Mock layer in lib/agents/ is the only thing that changes when swapping in real AI.

## Tech Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS v4 (dark mode, zinc palette)
- Diagram: reactflow
- Animation: framer-motion
- Package manager: pnpm

## Architecture Rules
- `src/lib/agents/` — agent simulation logic (async generators). THIS is where real AI goes later.
- `src/lib/mock-data/` — hardcoded fixture data
- `src/lib/stream.ts` — SSE helpers (server-side)
- `src/lib/use-agent-stream.ts` — SSE client hook
- SSE uses `fetch + ReadableStream` on the client (NOT native EventSource — it doesn't support POST)
- All React Flow components must have `'use client'` directive
- Pattern pages reset node/edge state on each new run

## Common Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm tsc --noEmit`

## Key File Locations
- Shared types: `src/lib/types.ts`
- Agent logic: `src/lib/agents/<pattern>.ts`
- Mock data: `src/lib/mock-data/<pattern>.ts`
- API routes: `src/app/api/agents/<pattern>/route.ts`
- Pattern pages: `src/app/<pattern>/page.tsx`

## Known Pitfalls
- React Flow requires `ReactFlowProvider` wrapping and `'use client'`
- `fitView` only works after mount — wrap in `ReactFlowProvider` inside the diagram component
- `setNodes(initialNodes)` on re-run: always spread a fresh copy to avoid stale data
- SSE route handlers must return `Response` with `text/event-stream` content-type and `Cache-Control: no-cache`
- Tailwind v4 uses `@import "tailwindcss"` not `@tailwind base/components/utilities`

## Safe Change Policy
- Do not add real API keys or external service calls without explicit instruction
- Do not introduce a database or auth layer — this is stateless
- Keep files under ~250 lines
