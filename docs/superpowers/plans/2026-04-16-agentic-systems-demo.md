# Agentic Systems Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 14 web app that visually demonstrates 5 agentic orchestration patterns using SSE streaming and React Flow animated diagrams.

**Architecture:** Next.js App Router with a persistent sidebar shell. Each pattern page has a fixed 300px left column (input + output) and a flexible right column (React Flow canvas). API routes stream `AgentEvent` objects via SSE using `fetch + ReadableStream`. All agent behaviour lives in `src/lib/agents/` — swap in real AI by changing only that layer.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, reactflow, framer-motion, pnpm

---

## File Map

```
src/
  app/
    layout.tsx                        # sidebar shell
    page.tsx                          # home/landing
    react-agent/page.tsx
    sequential/page.tsx
    concurrent/page.tsx
    group-chat/page.tsx
    supervisor/page.tsx
    api/agents/
      react/route.ts
      sequential/route.ts
      concurrent/route.ts
      group-chat/route.ts
      supervisor/route.ts
  lib/
    types.ts                          # AgentEvent, AgentStatus, DONE_EVENT
    stream.ts                         # delay(), agentEventsToStream()
    use-agent-stream.ts               # useAgentStream() hook
    agents/
      react-agent.ts
      sequential.ts
      concurrent.ts
      group-chat.ts
      supervisor.ts
    mock-data/
      travel.ts
      news.ts
      market-research.ts
      product-critique.ts
      software-builder.ts
  components/
    sidebar/Sidebar.tsx
    diagram/
      AgentDiagram.tsx
      nodes/AgentNode.tsx
      nodes/OutputNode.tsx
    panels/InputPanel.tsx
    panels/OutputPanel.tsx
    patterns/PatternPage.tsx
.claude/CLAUDE.md
```

---

### Task 1: Initialize project and write CLAUDE.md

**Files:**
- Create: `e:/GitProject/Agentic-systems-demo/` (scaffold)
- Create: `.claude/CLAUDE.md`

- [ ] **Step 1: Scaffold Next.js project**

Run inside `e:/GitProject/Agentic-systems-demo/`:
```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```
When prompted: answer Yes to all defaults.

- [ ] **Step 2: Install additional dependencies**
```bash
pnpm add reactflow framer-motion
```

- [ ] **Step 3: Write CLAUDE.md**

Write `.claude/CLAUDE.md`:
```markdown
# CLAUDE.md

## Project Overview
- Project: Agentic Systems Demo
- Purpose: Visual demo of 5 agentic orchestration patterns (ReAct, Sequential, Concurrent, Group Chat, Supervisor) using mock data
- Primary users: Developers learning agentic system design
- Current status: Prototype / demo
- Key constraints: All agent data is mocked — no external APIs. Mock layer in lib/agents/ is the only thing that changes when swapping in real AI.

## Tech Stack
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS (dark mode, zinc palette)
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

## Safe Change Policy
- Do not add real API keys or external service calls without explicit instruction
- Do not introduce a database or auth layer — this is stateless
- Keep files under ~250 lines
```

- [ ] **Step 4: Commit**
```bash
git add .
git commit -m "feat: init Next.js project with dependencies and CLAUDE.md"
```

---

### Task 2: Shared types and SSE helpers

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/stream.ts`
- Create: `src/lib/use-agent-stream.ts`

- [ ] **Step 1: Write `src/lib/types.ts`**
```typescript
export type AgentStatus = 'idle' | 'thinking' | 'passing' | 'done';

export interface AgentEvent {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  message: string;
  to?: string; // target agentId — triggers edge animation
}

export const DONE_EVENT: AgentEvent = {
  agentId: '__done__',
  agentName: '',
  status: 'done',
  message: '',
};
```

- [ ] **Step 2: Write `src/lib/stream.ts`**
```typescript
import type { AgentEvent } from './types';

export const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export function agentEventsToStream(gen: AsyncGenerator<AgentEvent>): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const event of gen) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });
}
```

- [ ] **Step 3: Write `src/lib/use-agent-stream.ts`**
```typescript
'use client';
import { useState, useCallback } from 'react';
import type { AgentEvent } from './types';

export function useAgentStream(apiPath: string) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(async (input: string) => {
    setEvents([]);
    setIsRunning(true);
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const event: AgentEvent = JSON.parse(part.slice(6));
          if (event.agentId === '__done__') { setIsRunning(false); return; }
          setEvents(prev => [...prev, event]);
        }
      }
    } finally {
      setIsRunning(false);
    }
  }, [apiPath]);

  return { events, isRunning, run };
}
```

- [ ] **Step 4: Commit**
```bash
git add src/lib/
git commit -m "feat: add shared types, SSE stream helper, and useAgentStream hook"
```

---

### Task 3: App shell — layout and sidebar

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/sidebar/Sidebar.tsx`

- [ ] **Step 1: Write `src/components/sidebar/Sidebar.tsx`**
```typescript
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home', icon: '🏠', group: 'none' },
  { href: '/react-agent', label: 'ReAct Agent', icon: '⚡', group: 'Single Agent' },
  { href: '/sequential', label: 'Sequential', icon: '→', group: 'Multi-Agent' },
  { href: '/concurrent', label: 'Concurrent', icon: '⫸', group: 'Multi-Agent' },
  { href: '/group-chat', label: 'Group Chat', icon: '💬', group: 'Multi-Agent' },
  { href: '/supervisor', label: 'Supervisor', icon: '👑', group: 'Multi-Agent' },
];

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

export function Sidebar() {
  const singleAgent = NAV.filter(n => n.group === 'Single Agent');
  const multiAgent = NAV.filter(n => n.group === 'Multi-Agent');
  return (
    <div className="w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen">
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="text-sm font-semibold text-zinc-100">Agentic Demo</div>
        <div className="text-xs text-zinc-500 mt-0.5">Orchestration patterns</div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        <NavItem href="/" label="Home" icon="🏠" />
        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pt-4 pb-1">
          Single Agent
        </div>
        {singleAgent.map(n => <NavItem key={n.href} {...n} />)}
        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pt-4 pb-1">
          Multi-Agent
        </div>
        {multiAgent.map(n => <NavItem key={n.href} {...n} />)}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agentic Systems Demo',
  description: 'Visual demos of agentic orchestration patterns',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 flex h-screen overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Update `src/app/globals.css`** — keep only the Tailwind directives, remove default Next.js styles:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* React Flow overrides */
.react-flow__node { cursor: default !important; }
.react-flow__pane { cursor: default !important; }
```

- [ ] **Step 4: Commit**
```bash
git add src/app/layout.tsx src/app/globals.css src/components/
git commit -m "feat: add app shell with persistent sidebar"
```

---

### Task 4: React Flow diagram components

**Files:**
- Create: `src/components/diagram/nodes/AgentNode.tsx`
- Create: `src/components/diagram/nodes/OutputNode.tsx`
- Create: `src/components/diagram/AgentDiagram.tsx`

- [ ] **Step 1: Write `src/components/diagram/nodes/AgentNode.tsx`**
```typescript
import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import type { AgentStatus } from '@/lib/types';

export interface AgentNodeData {
  label: string;
  icon: string;
  color: string;
  status?: AgentStatus;
  message?: string;
}

export function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const thinking = data.status === 'thinking';
  const done = data.status === 'done';
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#52525b' }} />
      <motion.div
        className="rounded-xl border-2 bg-zinc-900 px-4 py-3 min-w-[110px] max-w-[160px] text-center shadow-xl"
        style={{ borderColor: data.color }}
        animate={thinking ? {
          boxShadow: [
            `0 0 0px 0px ${data.color}00`,
            `0 0 14px 4px ${data.color}55`,
            `0 0 0px 0px ${data.color}00`,
          ],
        } : { boxShadow: 'none' }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="text-2xl mb-1">{data.icon}</div>
        <div className="text-xs font-semibold text-zinc-200 leading-tight">{data.label}</div>
        {thinking && (
          <div className="text-[9px] text-zinc-500 mt-1.5 animate-pulse">thinking…</div>
        )}
        {done && (
          <div className="text-[9px] text-green-400 mt-1.5">✓ done</div>
        )}
        {data.message && (
          <div className="text-[9px] text-zinc-400 mt-1.5 break-words text-left leading-relaxed">
            {data.message.length > 70 ? data.message.slice(0, 70) + '…' : data.message}
          </div>
        )}
      </motion.div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#52525b' }} />
    </>
  );
}
```

- [ ] **Step 2: Write `src/components/diagram/nodes/OutputNode.tsx`**
```typescript
import { Handle, Position, type NodeProps } from 'reactflow';

export interface OutputNodeData {
  label: string;
  icon: string;
  status?: string;
  message?: string;
}

export function OutputNode({ data }: NodeProps<OutputNodeData>) {
  const done = data.status === 'done';
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#52525b' }} />
      <div
        className="rounded-xl border-2 bg-zinc-900 px-4 py-3 min-w-[130px] text-center shadow-xl transition-all duration-500"
        style={{ borderColor: done ? '#22c55e' : '#3f3f46' }}
      >
        <div className="text-2xl mb-1">{data.icon}</div>
        <div className="text-xs font-semibold text-zinc-200">{data.label}</div>
        {done && <div className="text-[9px] text-green-400 mt-1.5">✓ complete</div>}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#52525b' }} />
    </>
  );
}
```

- [ ] **Step 3: Write `src/components/diagram/AgentDiagram.tsx`**
```typescript
'use client';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AgentNode } from './nodes/AgentNode';
import { OutputNode } from './nodes/OutputNode';

const nodeTypes = { agentNode: AgentNode, outputNode: OutputNode };

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}

export function AgentDiagram({ nodes, edges, onNodesChange, onEdgesChange }: Props) {
  return (
    <ReactFlowProvider>
      <div className="w-full h-full rounded-xl overflow-hidden border border-zinc-800">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          nodesDraggable={false}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          className="bg-zinc-950"
          defaultEdgeOptions={{
            style: { stroke: '#52525b', strokeWidth: 1.5 },
            animated: false,
          }}
        >
          <Background variant={BackgroundVariant.Dots} color="#27272a" gap={24} size={1} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
```

- [ ] **Step 4: Commit**
```bash
git add src/components/diagram/
git commit -m "feat: add AgentNode, OutputNode, and AgentDiagram React Flow components"
```

---

### Task 5: Shared panels and PatternPage wrapper

**Files:**
- Create: `src/components/panels/InputPanel.tsx`
- Create: `src/components/panels/OutputPanel.tsx`
- Create: `src/components/patterns/PatternPage.tsx`

- [ ] **Step 1: Write `src/components/panels/InputPanel.tsx`**
```typescript
'use client';
import { useState } from 'react';

interface Props {
  placeholder: string;
  onRun: (input: string) => void;
  isRunning: boolean;
}

export function InputPanel({ placeholder, onRun, isRunning }: Props) {
  const [value, setValue] = useState('');
  return (
    <div className="p-4 border-b border-zinc-800 flex-shrink-0">
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
        Input
      </div>
      <textarea
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
        rows={5}
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={isRunning}
      />
      <button
        onClick={() => value.trim() && onRun(value.trim())}
        disabled={isRunning || !value.trim()}
        className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
      >
        {isRunning ? '⏳ Running…' : 'Run →'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/panels/OutputPanel.tsx`**
```typescript
interface Props { output: string }

export function OutputPanel({ output }: Props) {
  return (
    <div className="flex-1 flex flex-col p-4 min-h-0">
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
        Output
      </div>
      <div className="flex-1 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-[11px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
        {output || <span className="text-zinc-600">Output will appear here…</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/patterns/PatternPage.tsx`**
```typescript
import type { ReactNode } from 'react';
import { InputPanel } from '../panels/InputPanel';
import { OutputPanel } from '../panels/OutputPanel';

interface Props {
  title: string;
  description: string;
  onRun: (input: string) => void;
  isRunning: boolean;
  output: string;
  placeholder: string;
  children: ReactNode;
}

export function PatternPage({ title, description, onRun, isRunning, output, placeholder, children }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-zinc-800 flex-shrink-0">
        <h1 className="text-base font-semibold text-zinc-100">{title}</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[300px] flex-shrink-0 border-r border-zinc-800 flex flex-col">
          <InputPanel placeholder={placeholder} onRun={onRun} isRunning={isRunning} />
          <OutputPanel output={output} />
        </div>
        <div className="flex-1 p-4 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**
```bash
git add src/components/panels/ src/components/patterns/
git commit -m "feat: add InputPanel, OutputPanel, and PatternPage wrapper"
```

---

### Task 6: ReAct Agent pattern — Travel Planner

**Files:**
- Create: `src/lib/mock-data/travel.ts`
- Create: `src/lib/agents/react-agent.ts`
- Create: `src/app/api/agents/react/route.ts`
- Create: `src/app/react-agent/page.tsx`

- [ ] **Step 1: Write `src/lib/mock-data/travel.ts`**
```typescript
export interface DestinationData {
  city: string;
  flights: { airline: string; route: string; price: number; duration: string }[];
  hotels: { name: string; area: string; pricePerNight: number; stars: number }[];
  restaurants: { name: string; type: string; avgCost: number }[];
  activities: { name: string; area: string; cost: number }[];
}

const DESTINATIONS: Record<string, DestinationData> = {
  tokyo: {
    city: 'Tokyo',
    flights: [
      { airline: 'ANA', route: 'LAX → NRT', price: 1240, duration: '11h 30m' },
      { airline: 'Japan Airlines', route: 'JFK → NRT', price: 1380, duration: '14h 00m' },
    ],
    hotels: [
      { name: 'Shinjuku Granbell Hotel', area: 'Shinjuku', pricePerNight: 136, stars: 4 },
      { name: 'Park Hyatt Tokyo', area: 'Shinjuku', pricePerNight: 520, stars: 5 },
    ],
    restaurants: [
      { name: 'Tsukiji Outer Market', type: 'Seafood breakfast', avgCost: 18 },
      { name: 'Ichiran Ramen', type: 'Solo ramen booths', avgCost: 14 },
      { name: 'Uobei Shibuya', type: 'Conveyor belt sushi', avgCost: 20 },
      { name: 'Gonpachi Nishi-Azabu', type: 'Izakaya', avgCost: 40 },
    ],
    activities: [
      { name: 'Senso-ji Temple', area: 'Asakusa', cost: 0 },
      { name: 'teamLab Borderless', area: 'Odaiba', cost: 32 },
      { name: 'Shibuya Crossing & Sky', area: 'Shibuya', cost: 18 },
      { name: 'Harajuku & Meiji Shrine', area: 'Harajuku', cost: 0 },
      { name: 'Tokyo DisneySea', area: 'Urayasu', cost: 85 },
    ],
  },
  paris: {
    city: 'Paris',
    flights: [
      { airline: 'Air France', route: 'JFK → CDG', price: 980, duration: '7h 20m' },
      { airline: 'Delta', route: 'LAX → CDG', price: 1100, duration: '10h 45m' },
    ],
    hotels: [
      { name: 'Hotel Le Marais', area: 'Le Marais', pricePerNight: 180, stars: 4 },
      { name: 'Le Bristol Paris', area: '8th arr.', pricePerNight: 890, stars: 5 },
    ],
    restaurants: [
      { name: 'Café de Flore', type: 'Classic Parisian café', avgCost: 25 },
      { name: 'L\'As du Fallafel', type: 'Street food falafel', avgCost: 8 },
      { name: 'Septime', type: 'Modern French bistro', avgCost: 95 },
      { name: 'Bouillon Chartier', type: 'Traditional brasserie', avgCost: 20 },
    ],
    activities: [
      { name: 'Eiffel Tower', area: 'Champ de Mars', cost: 29 },
      { name: 'Louvre Museum', area: '1st arr.', cost: 22 },
      { name: 'Montmartre & Sacré-Cœur', area: 'Montmartre', cost: 0 },
      { name: 'Versailles Day Trip', area: 'Versailles', cost: 35 },
      { name: 'Seine River Cruise', area: 'City centre', cost: 18 },
    ],
  },
  bali: {
    city: 'Bali',
    flights: [
      { airline: 'Singapore Airlines', route: 'LAX → DPS (via SIN)', price: 1050, duration: '20h 30m' },
      { airline: 'Cathay Pacific', route: 'JFK → DPS (via HKG)', price: 1180, duration: '24h 00m' },
    ],
    hotels: [
      { name: 'Alaya Resort Ubud', area: 'Ubud', pricePerNight: 95, stars: 4 },
      { name: 'COMO Uma Canggu', area: 'Canggu', pricePerNight: 310, stars: 5 },
    ],
    restaurants: [
      { name: 'Locavore', type: 'Modern Indonesian tasting', avgCost: 65 },
      { name: 'Warung Babi Guling Ibu Oka', type: 'Traditional roast pig', avgCost: 8 },
      { name: 'La Favela', type: 'Eclectic bar-restaurant', avgCost: 30 },
      { name: 'Swept Away', type: 'Riverside fine dining', avgCost: 80 },
    ],
    activities: [
      { name: 'Tegallalang Rice Terraces', area: 'Ubud', cost: 5 },
      { name: 'Mount Batur Sunrise Trek', area: 'Kintamani', cost: 45 },
      { name: 'Uluwatu Temple & Kecak Fire Dance', area: 'Uluwatu', cost: 15 },
      { name: 'Seminyak Beach & Surf Lesson', area: 'Seminyak', cost: 35 },
      { name: 'Tirta Empul Water Temple', area: 'Tampaksiring', cost: 5 },
    ],
  },
};

export function getDestinationData(input: string): DestinationData {
  const lower = input.toLowerCase();
  if (lower.includes('tokyo') || lower.includes('japan')) return DESTINATIONS.tokyo;
  if (lower.includes('paris') || lower.includes('france')) return DESTINATIONS.paris;
  if (lower.includes('bali') || lower.includes('indonesia')) return DESTINATIONS.bali;
  return DESTINATIONS.tokyo;
}

export function formatItinerary(dest: DestinationData): string {
  const flight = dest.flights[0];
  const hotel = dest.hotels[0];
  const lines = [
    `✈  FLIGHT`,
    `   ${flight.airline} · ${flight.route}`,
    `   Duration: ${flight.duration} · $${flight.price}/person`,
    ``,
    `🏨  HOTEL`,
    `   ${hotel.name} (${hotel.stars}★) · ${hotel.area}`,
    `   $${hotel.pricePerNight}/night`,
    ``,
    `🗓  5-DAY ITINERARY`,
  ];
  dest.activities.slice(0, 5).forEach((act, i) => {
    const rest = dest.restaurants[i % dest.restaurants.length];
    lines.push(`   Day ${i + 1}: ${act.name}`);
    lines.push(`           Dinner: ${rest.name} (~$${rest.avgCost})`);
  });
  const totalFlights = flight.price * 2;
  const totalHotel = hotel.pricePerNight * 5;
  const totalActivities = dest.activities.slice(0, 5).reduce((s, a) => s + a.cost, 0);
  const totalFood = dest.restaurants.slice(0, 5).reduce((s, r) => s + r.avgCost * 2, 0) * 5;
  lines.push(``, `💰  TOTAL ESTIMATE (2 people, 5 days)`);
  lines.push(`   Flights:    $${totalFlights}`);
  lines.push(`   Hotel:      $${totalHotel}`);
  lines.push(`   Activities: $${totalActivities}`);
  lines.push(`   Food:       ~$${totalFood}`);
  lines.push(`   ─────────────────────`);
  lines.push(`   TOTAL:      ~$${totalFlights + totalHotel + totalActivities + totalFood}`);
  return lines.join('\n');
}
```

- [ ] **Step 2: Write `src/lib/agents/react-agent.ts`**
```typescript
import { delay, agentEventsToStream } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { getDestinationData, formatItinerary } from '../mock-data/travel';

export async function* runReactAgent(input: string): AsyncGenerator<AgentEvent> {
  const dest = getDestinationData(input);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'thinking', message: 'Analysing your travel request…' };
  await delay(800);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Searching flights…', to: 'flights-tool' };
  await delay(500);
  yield { agentId: 'flights-tool', agentName: '✈ Flights', status: 'done', message: `${dest.flights[0].airline} · ${dest.flights[0].route} · $${dest.flights[0].price}/person` };
  await delay(400);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Searching hotels…', to: 'hotels-tool' };
  await delay(400);
  yield { agentId: 'hotels-tool', agentName: '🏨 Hotels', status: 'done', message: `${dest.hotels[0].name} · $${dest.hotels[0].pricePerNight}/night` };
  await delay(500);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Finding restaurants…', to: 'food-tool' };
  await delay(400);
  yield { agentId: 'food-tool', agentName: '🍜 Food', status: 'done', message: dest.restaurants.slice(0, 2).map(r => r.name).join(', ') + ' + more' };
  await delay(400);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Checking activities…', to: 'activities-tool' };
  await delay(400);
  yield { agentId: 'activities-tool', agentName: '🎌 Activities', status: 'done', message: dest.activities.slice(0, 3).map(a => a.name).join(', ') };
  await delay(600);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'thinking', message: 'Compiling full itinerary…' };
  await delay(900);
  yield { agentId: 'final-plan', agentName: '📋 Final Itinerary', status: 'done', message: formatItinerary(dest) };
  await delay(200);

  yield DONE_EVENT;
}

export { agentEventsToStream };
```

- [ ] **Step 3: Write `src/app/api/agents/react/route.ts`**
```typescript
import { NextRequest } from 'next/server';
import { runReactAgent } from '@/lib/agents/react-agent';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runReactAgent(input as string)), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 4: Write `src/app/react-agent/page.tsx`**
```typescript
'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'react-agent', type: 'agentNode', position: { x: 200, y: 0 }, data: { label: 'ReAct Agent', icon: '🧠', color: '#6366f1', status: 'idle' } },
  { id: 'flights-tool', type: 'agentNode', position: { x: 0, y: 170 }, data: { label: 'Flights', icon: '✈', color: '#10b981', status: 'idle' } },
  { id: 'hotels-tool', type: 'agentNode', position: { x: 140, y: 170 }, data: { label: 'Hotels', icon: '🏨', color: '#f59e0b', status: 'idle' } },
  { id: 'food-tool', type: 'agentNode', position: { x: 280, y: 170 }, data: { label: 'Food', icon: '🍜', color: '#ec4899', status: 'idle' } },
  { id: 'activities-tool', type: 'agentNode', position: { x: 420, y: 170 }, data: { label: 'Activities', icon: '🎌', color: '#8b5cf6', status: 'idle' } },
  { id: 'final-plan', type: 'outputNode', position: { x: 200, y: 340 }, data: { label: 'Final Itinerary', icon: '📋', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'react-agent', target: 'flights-tool' },
  { id: 'e2', source: 'react-agent', target: 'hotels-tool' },
  { id: 'e3', source: 'react-agent', target: 'food-tool' },
  { id: 'e4', source: 'react-agent', target: 'activities-tool' },
  { id: 'e5', source: 'flights-tool', target: 'final-plan' },
  { id: 'e6', source: 'hotels-tool', target: 'final-plan' },
  { id: 'e7', source: 'food-tool', target: 'final-plan' },
  { id: 'e8', source: 'activities-tool', target: 'final-plan' },
];

export default function ReactAgentPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/react');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e,
        animated: (e.source === event.agentId && e.target === event.to) ||
                  (e.source === event.to && e.target === event.agentId),
        style: { stroke: (e.source === event.agentId && e.target === event.to) ? '#6366f1' : '#52525b', strokeWidth: 1.5 },
      })));
      setTimeout(() => setEdges(eds => eds.map(e => ({ ...e, animated: false, style: { stroke: '#52525b', strokeWidth: 1.5 } }))), 1500);
    }
    if (event.status === 'done' && event.agentId !== '__done__') {
      setOutput(prev => prev + (prev ? '\n\n' : '') + event.message);
    }
  }, [events]);

  function handleRun(input: string) {
    setOutput('');
    setNodes(makeNodes());
    setEdges(makeEdges());
    run(input);
  }

  return (
    <PatternPage
      title="⚡ ReAct / Tool-Calling Agent"
      description="Travel Planner — watch the agent reason, pick tools, and build your itinerary"
      onRun={handleRun}
      isRunning={isRunning}
      output={output}
      placeholder="Plan me a 5-day trip to Tokyo in April for 2 people, budget $3000"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
```

- [ ] **Step 5: Commit**
```bash
git add src/lib/mock-data/travel.ts src/lib/agents/react-agent.ts src/app/api/agents/react/ src/app/react-agent/
git commit -m "feat: add ReAct Agent pattern — Travel Planner"
```

---

### Task 7: Sequential pattern — News Digest

**Files:**
- Create: `src/lib/mock-data/news.ts`
- Create: `src/lib/agents/sequential.ts`
- Create: `src/app/api/agents/sequential/route.ts`
- Create: `src/app/sequential/page.tsx`

- [ ] **Step 1: Write `src/lib/mock-data/news.ts`**
```typescript
export interface NewsTopic {
  slug: string;
  bbc: { headline: string; excerpt: string };
  reuters: { headline: string; excerpt: string };
  ap: { headline: string; excerpt: string };
  facts: string[];
  consensus: string;
  divergence: string;
  summary: string;
}

const TOPICS: Record<string, NewsTopic> = {
  'ai-regulation': {
    slug: 'ai-regulation',
    bbc: {
      headline: 'EU finalises landmark AI Act with strict rules for high-risk systems',
      excerpt: 'The European Union has passed the world\'s first comprehensive law governing artificial intelligence, placing strict obligations on developers of high-risk AI systems including biometric surveillance and critical infrastructure tools. Companies face fines of up to €35 million or 7% of global turnover for violations.',
    },
    reuters: {
      headline: 'European lawmakers pass sweeping AI regulation amid tech industry pushback',
      excerpt: 'The EU AI Act cleared its final legislative hurdle after months of contentious negotiations, with the text expanded to cover general-purpose AI models like GPT-4. Tech companies lobbied aggressively against the rules, arguing they would stifle innovation and shift AI development outside Europe.',
    },
    ap: {
      headline: 'What the EU\'s new AI law means for companies worldwide',
      excerpt: 'Any company offering AI products or services to EU citizens must comply with the new regulation, regardless of where they are headquartered — giving the rules a global reach similar to GDPR. The law introduces a tiered risk system, with the most stringent rules for AI in areas like medical devices, self-driving vehicles, and law enforcement.',
    },
    facts: [
      'The EU AI Act is the first comprehensive AI law passed by a major jurisdiction.',
      'High-risk AI systems face mandatory transparency, testing, and human oversight requirements.',
      'General-purpose AI models with over 10²⁵ FLOPs of compute face additional systemic risk obligations.',
      'Penalties reach €35M or 7% of global annual turnover for the most serious violations.',
    ],
    consensus: 'All three sources agree the EU AI Act sets a global precedent and will affect companies worldwide regardless of headquarters location.',
    divergence: 'BBC focuses on regulatory obligations; Reuters emphasises industry opposition; AP provides the most neutral technical breakdown of the tiered risk system.',
    summary: 'The EU has enacted the world\'s first comprehensive AI regulation, establishing a tiered risk framework that affects any company serving EU users. High-risk AI applications face mandatory testing and human oversight, while general-purpose models above a compute threshold face additional systemic risk obligations. Penalties of up to 7% of global turnover apply to the most serious violations, giving the rules an effective global reach.',
  },
  climate: {
    slug: 'climate',
    bbc: {
      headline: 'Global temperatures hit record highs for 12th consecutive month',
      excerpt: 'Scientists confirmed that the past 12 months have been the hottest on record globally, with average temperatures 1.5°C above pre-industrial levels for the first time over a sustained period. The Copernicus Climate Change Service attributed the trend to a combination of human-caused warming and the 2023–24 El Niño event.',
    },
    reuters: {
      headline: 'UN warns climate tipping points closer than previously thought',
      excerpt: 'A UN report released ahead of COP30 warned that several climate tipping points — including collapse of the West Antarctic Ice Sheet and dieback of the Amazon rainforest — could be triggered at temperatures lower than previously modelled. The findings increase pressure on governments to accelerate emissions cuts.',
    },
    ap: {
      headline: 'Extreme weather events cost $300bn in 2024, insurance data shows',
      excerpt: 'Global insured losses from extreme weather events reached $300 billion in 2024, the second-highest year on record, according to Munich Re. Floods, wildfires, and storms drove most losses, with developing nations disproportionately affected. Only 40% of total economic losses were covered by insurance.',
    },
    facts: [
      '2024 was the hottest 12-month period on record, with 1.5°C above pre-industrial levels sustained for the first time.',
      'Climate tipping points may be triggered at lower temperature thresholds than previously estimated.',
      'Insured extreme weather losses hit $300bn in 2024, second-highest on record.',
    ],
    consensus: 'All sources confirm accelerating climate impacts and increased urgency for mitigation action ahead of COP30.',
    divergence: 'BBC focuses on temperature records; Reuters on tipping point risk; AP on economic costs and insurance gaps.',
    summary: 'Global temperatures breached 1.5°C above pre-industrial levels for a sustained 12-month period in 2024, while new research suggests climate tipping points may be triggered earlier than projected. Economic losses from extreme weather reached $300bn, with only 40% covered by insurance — highlighting a widening protection gap particularly in developing nations.',
  },
  tech: {
    slug: 'tech',
    bbc: {
      headline: 'Apple unveils Vision Pro successor with lighter design and lower price',
      excerpt: 'Apple announced the second generation of its Vision Pro spatial computing headset at WWDC, featuring a 40% reduction in weight and a starting price of $2,499 — down from $3,499. The device includes a new M4 chip, improved passthrough cameras, and longer battery life, addressing the main criticisms of the original model.',
    },
    reuters: {
      headline: 'Tech giants race to deploy AI agents capable of autonomous multi-step tasks',
      excerpt: 'Google, Microsoft, and Anthropic all announced significant upgrades to their AI agent capabilities, with systems now able to browse the web, write and execute code, manage files, and coordinate with other AI systems to complete complex multi-step tasks with minimal human oversight.',
    },
    ap: {
      headline: 'Smartphone market recovers as AI features drive upgrade cycle',
      excerpt: 'Global smartphone shipments grew 8% year-over-year in Q1 2025, driven by a new AI-driven upgrade cycle. Consumers are replacing handsets to access on-device AI features including real-time translation, AI-powered photography, and voice assistants that can execute tasks across apps.',
    },
    facts: [
      'Apple Vision Pro 2 is 40% lighter and priced at $2,499, down $1,000 from the original.',
      'Major AI labs shipped autonomous agent systems capable of multi-step task execution in 2025.',
      'Smartphone market grew 8% YoY in Q1 2025, led by AI feature demand.',
    ],
    consensus: 'AI integration is driving the next hardware upgrade cycle across both spatial computing and smartphones.',
    divergence: 'Stories cover distinct product categories — AR headsets, AI agents, and smartphones — rather than disagreeing on shared facts.',
    summary: 'The consumer tech sector in 2025 is defined by AI integration: Apple\'s Vision Pro 2 reduces spatial computing barriers with a lighter design and lower price, while smartphone makers report an AI-driven upgrade cycle pushing 8% market growth. In the software layer, leading AI labs have deployed autonomous agent systems capable of multi-step task execution with minimal human oversight.',
  },
};

export function getNewsTopic(input: string): NewsTopic {
  const lower = input.toLowerCase();
  if (lower.includes('ai') || lower.includes('regulation') || lower.includes('eu')) return TOPICS['ai-regulation'];
  if (lower.includes('climate') || lower.includes('weather') || lower.includes('environment')) return TOPICS.climate;
  if (lower.includes('tech') || lower.includes('apple') || lower.includes('google') || lower.includes('smartphone')) return TOPICS.tech;
  return TOPICS['ai-regulation'];
}

export function formatDigest(topic: NewsTopic): string {
  return [
    '📋 NEWS DIGEST',
    '═══════════════════════════════',
    '',
    '📌 SUMMARY',
    topic.summary,
    '',
    '📊 KEY FACTS',
    ...topic.facts.map((f, i) => `   ${i + 1}. ${f}`),
    '',
    '✅ CONSENSUS',
    `   ${topic.consensus}`,
    '',
    '⚡ DIVERGENCE',
    `   ${topic.divergence}`,
    '',
    '📰 SOURCES',
    `   • BBC:     "${topic.bbc.headline}"`,
    `   • Reuters: "${topic.reuters.headline}"`,
    `   • AP:      "${topic.ap.headline}"`,
  ].join('\n');
}
```

- [ ] **Step 2: Write `src/lib/agents/sequential.ts`**
```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { getNewsTopic, formatDigest } from '../mock-data/news';

export async function* runSequentialAgent(input: string): AsyncGenerator<AgentEvent> {
  const topic = getNewsTopic(input);

  yield { agentId: 'bbc-source', agentName: '📰 BBC', status: 'thinking', message: 'Fetching BBC coverage…' };
  await delay(600);
  yield { agentId: 'bbc-source', agentName: '📰 BBC', status: 'done', message: `"${topic.bbc.headline}" — ${topic.bbc.excerpt.slice(0, 80)}…` };
  await delay(300);

  yield { agentId: 'reuters-source', agentName: '📰 Reuters', status: 'thinking', message: 'Fetching Reuters coverage…' };
  await delay(550);
  yield { agentId: 'reuters-source', agentName: '📰 Reuters', status: 'done', message: `"${topic.reuters.headline}" — ${topic.reuters.excerpt.slice(0, 80)}…` };
  await delay(300);

  yield { agentId: 'ap-source', agentName: '📰 AP', status: 'thinking', message: 'Fetching AP coverage…' };
  await delay(500);
  yield { agentId: 'ap-source', agentName: '📰 AP', status: 'done', message: `"${topic.ap.headline}" — ${topic.ap.excerpt.slice(0, 80)}…` };
  await delay(400);

  yield { agentId: 'analyzer', agentName: '🔍 Analyzer', status: 'thinking', message: 'Cross-referencing three sources…', to: 'bbc-source' };
  await delay(900);
  yield { agentId: 'analyzer', agentName: '🔍 Analyzer', status: 'done', message: `${topic.facts.length} key facts extracted. Consensus: ${topic.consensus.slice(0, 60)}…` };
  await delay(400);

  yield { agentId: 'writer', agentName: '✍️ Writer', status: 'thinking', message: 'Drafting neutral summary…', to: 'analyzer' };
  await delay(800);
  yield { agentId: 'writer', agentName: '✍️ Writer', status: 'done', message: formatDigest(topic) };
  await delay(200);

  yield DONE_EVENT;
}
```

- [ ] **Step 3: Write `src/app/api/agents/sequential/route.ts`**
```typescript
import { NextRequest } from 'next/server';
import { runSequentialAgent } from '@/lib/agents/sequential';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runSequentialAgent(input as string)), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
```

- [ ] **Step 4: Write `src/app/sequential/page.tsx`**
```typescript
'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'bbc-source', type: 'agentNode', position: { x: 0, y: 0 }, data: { label: 'BBC', icon: '📰', color: '#6366f1', status: 'idle' } },
  { id: 'reuters-source', type: 'agentNode', position: { x: 0, y: 110 }, data: { label: 'Reuters', icon: '📰', color: '#6366f1', status: 'idle' } },
  { id: 'ap-source', type: 'agentNode', position: { x: 0, y: 220 }, data: { label: 'AP', icon: '📰', color: '#6366f1', status: 'idle' } },
  { id: 'analyzer', type: 'agentNode', position: { x: 240, y: 110 }, data: { label: 'Analyzer', icon: '🔍', color: '#f59e0b', status: 'idle' } },
  { id: 'writer', type: 'outputNode', position: { x: 460, y: 110 }, data: { label: 'Writer', icon: '✍️', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'bbc-source', target: 'analyzer' },
  { id: 'e2', source: 'reuters-source', target: 'analyzer' },
  { id: 'e3', source: 'ap-source', target: 'analyzer' },
  { id: 'e4', source: 'analyzer', target: 'writer' },
];

export default function SequentialPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/sequential');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e, animated: e.source === event.agentId && e.target === event.to,
        style: { stroke: (e.source === event.agentId && e.target === event.to) ? '#f59e0b' : '#52525b', strokeWidth: 1.5 },
      })));
      setTimeout(() => setEdges(eds => eds.map(e => ({ ...e, animated: false, style: { stroke: '#52525b', strokeWidth: 1.5 } }))), 1500);
    }
    if (event.status === 'done' && event.agentId !== '__done__') {
      setOutput(prev => prev + (prev ? '\n\n' : '') + event.message);
    }
  }, [events]);

  return (
    <PatternPage
      title="→ Sequential Pipeline"
      description="News Digest — three sources analyzed and distilled into one neutral summary"
      onRun={input => { setOutput(''); setNodes(makeNodes()); setEdges(makeEdges()); run(input); }}
      isRunning={isRunning}
      output={output}
      placeholder="AI regulation in the EU"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
```

- [ ] **Step 5: Commit**
```bash
git add src/lib/mock-data/news.ts src/lib/agents/sequential.ts src/app/api/agents/sequential/ src/app/sequential/
git commit -m "feat: add Sequential Pipeline pattern — News Digest"
```

---

### Task 8: Concurrent pattern — Market Research

**Files:**
- Create: `src/lib/mock-data/market-research.ts`
- Create: `src/lib/agents/concurrent.ts`
- Create: `src/app/api/agents/concurrent/route.ts`
- Create: `src/app/concurrent/page.tsx`

- [ ] **Step 1: Write `src/lib/mock-data/market-research.ts`**
```typescript
export interface CompanyResearch {
  name: string;
  competitor: string;
  financial: string;
  sentiment: string;
  trends: string;
  summary: string;
}

const COMPANIES: Record<string, CompanyResearch> = {
  openai: {
    name: 'OpenAI',
    competitor: 'Primary competitors: Anthropic (Claude), Google DeepMind (Gemini), Meta AI (LLaMA), Mistral AI. OpenAI holds ~60% of the enterprise LLM API market by revenue but faces rapid share erosion from open-source alternatives. Anthropic growing fastest in safety-focused enterprise segments.',
    financial: 'Revenue: ~$3.4B ARR (2024). Valuation: $157B (Oct 2024 funding round). Operating at a loss due to compute costs. ChatGPT Plus subscribers: ~15M. Enterprise contracts growing 300% YoY. Projected $11.6B revenue by 2025.',
    sentiment: 'Developer sentiment: strongly positive for API capabilities, mixed on pricing. Enterprise: cautious optimism around GPT-4o. Public sentiment impacted by leadership turmoil in 2023 but largely recovered. Safety community: divided — some praise RLHF efforts, others criticise pace of deployment.',
    trends: 'Key trends: (1) Shift from chat to agentic AI — GPT agents and Operator product lines. (2) Multimodal expansion — voice, image, video. (3) On-device / edge model push with GPT-4o mini. (4) Enterprise vertical specialisation — legal, medical, coding. (5) OpenAI hardware ambitions (chip development reports).',
    summary: 'OpenAI leads the commercial LLM market with ~$3.4B ARR and dominant API market share, but faces intensifying competition from Anthropic and open-source models. The company is pivoting from a pure model provider to an agentic AI platform, with "Operator" representing its most ambitious product expansion. Financial sustainability remains a challenge at current compute costs.',
  },
  tesla: {
    name: 'Tesla',
    competitor: 'EV competitors: BYD (overtook Tesla in global EV sales in 2023), GM Ultium, Ford Lightning, Rivian, Lucid. In autonomous driving: Waymo (robotaxi ops), Cruise (paused), Mobileye. Chinese market increasingly dominated by domestic brands (BYD, NIO, Li Auto) at lower price points.',
    financial: 'Revenue: $97.7B (2023). Net income: $15B (2023, down 23% YoY). Vehicle deliveries: 1.81M (2023). Gross margin compressed to 17.6% from 25.6% due to price cuts. Energy generation and storage segment grew 54% YoY — increasingly important revenue diversifier. Cybertruck ramp ongoing.',
    sentiment: 'Consumer sentiment: polarised. Brand loyalty among existing owners remains high; new buyer consideration declined as competition intensified. Investor sentiment: cautious — margin pressure and CEO attention split between Tesla and other ventures. Autopilot/FSD perception mixed following NHTSA investigations.',
    trends: '(1) Full Self-Driving v12 end-to-end neural net approach gaining traction in demos. (2) Robotaxi network planned for 2024 launch — potential major revenue shift. (3) Optimus humanoid robot manufacturing expansion. (4) Energy storage (Megapack) becoming standalone business. (5) Price war with BYD forcing margin trade-offs.',
    summary: 'Tesla maintains its position as the Western EV market leader but faces structural margin pressure from an intensifying price war, particularly with BYD in global markets. The company\'s long-term thesis increasingly rests on FSD monetisation and robotaxi deployment rather than vehicle sales alone. The energy segment is emerging as a high-margin growth engine that receives less analyst attention than it deserves.',
  },
  apple: {
    name: 'Apple',
    competitor: 'Smartphone: Samsung (Android flagship), Google Pixel. PC: Microsoft Surface, Dell, HP (Windows), Lenovo ThinkPad. Services: Spotify (music), Netflix (video), Google (search/ads). AI/services: Google Gemini, Microsoft Copilot, OpenAI ChatGPT all competing for on-device AI positioning.',
    financial: 'Revenue: $383B (FY2023). Net income: $97B. Services revenue: $85B (fastest growing, highest margin at ~70%). iPhone revenue: $200B (52% of total). Cash and securities: $167B. R&D: $29.9B. Market cap: ~$3.5T. Dividend growing, buybacks aggressive.',
    sentiment: 'Consumer: extremely loyal install base; brand perception remains premium globally. Developer: frustrated by App Store policies and 30% commission; EU DMA forcing changes. Investor: confidence high — services growth narrative intact. Regulatory: under pressure in EU (DMA), US (DOJ antitrust), China (market share declining).',
    trends: '(1) Apple Intelligence — on-device AI integration across iOS 18/macOS Sequoia. (2) Vision Pro spatial computing ecosystem build-out (slow start, iteration expected). (3) India manufacturing ramp — de-risking China dependency. (4) Services attach rate growth — AppleTV+, Apple Pay, iCloud+. (5) Custom silicon expansion — M4 chips pushing performance-per-watt boundaries.',
    summary: 'Apple\'s financial position is exceptional, with $97B net income and a services segment approaching $85B revenue at ~70% gross margins. The strategic pivot to Apple Intelligence represents its biggest software bet in a decade — positioning the iPhone as the AI interface of choice through on-device processing and privacy differentiation. The Vision Pro remains a developer platform rather than a consumer product at current volumes, with a mass-market successor the key watch item.',
  },
};

export function getCompanyResearch(input: string): CompanyResearch {
  const lower = input.toLowerCase();
  if (lower.includes('openai') || lower.includes('chatgpt') || lower.includes('gpt')) return COMPANIES.openai;
  if (lower.includes('tesla') || lower.includes('musk') || lower.includes('ev')) return COMPANIES.tesla;
  if (lower.includes('apple') || lower.includes('iphone') || lower.includes('tim cook')) return COMPANIES.apple;
  return { ...COMPANIES.openai, name: input || 'Company' };
}

export function formatReport(r: CompanyResearch): string {
  return [
    `📊 MARKET RESEARCH REPORT: ${r.name.toUpperCase()}`,
    '═══════════════════════════════════════',
    '',
    '🏆 COMPETITIVE LANDSCAPE',
    r.competitor,
    '',
    '💰 FINANCIAL SNAPSHOT',
    r.financial,
    '',
    '💬 MARKET SENTIMENT',
    r.sentiment,
    '',
    '📈 KEY TRENDS',
    r.trends,
    '',
    '─────────────────────────────────────',
    '📌 EXECUTIVE SUMMARY',
    r.summary,
  ].join('\n');
}
```

- [ ] **Step 2: Write `src/lib/agents/concurrent.ts`**
```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { getCompanyResearch, formatReport } from '../mock-data/market-research';

export async function* runConcurrentAgent(input: string): AsyncGenerator<AgentEvent> {
  const r = getCompanyResearch(input);

  yield { agentId: 'dispatcher', agentName: '🎯 Dispatcher', status: 'thinking', message: 'Spinning up 4 research agents simultaneously…' };
  await delay(600);

  // Fan-out: all 4 agents start thinking in rapid succession
  yield { agentId: 'competitor-agent', agentName: '🏆 Competitor', status: 'thinking', message: 'Analysing competitive landscape…', to: 'dispatcher' };
  await delay(60);
  yield { agentId: 'financial-agent', agentName: '💰 Financial', status: 'thinking', message: 'Pulling financial data…', to: 'dispatcher' };
  await delay(60);
  yield { agentId: 'sentiment-agent', agentName: '💬 Sentiment', status: 'thinking', message: 'Scanning sentiment signals…', to: 'dispatcher' };
  await delay(60);
  yield { agentId: 'trends-agent', agentName: '📈 Trends', status: 'thinking', message: 'Identifying market trends…', to: 'dispatcher' };

  // Staggered completions to show parallelism
  await delay(800);
  yield { agentId: 'sentiment-agent', agentName: '💬 Sentiment', status: 'done', message: r.sentiment.slice(0, 80) + '…' };
  await delay(300);
  yield { agentId: 'competitor-agent', agentName: '🏆 Competitor', status: 'done', message: r.competitor.slice(0, 80) + '…' };
  await delay(500);
  yield { agentId: 'trends-agent', agentName: '📈 Trends', status: 'done', message: r.trends.slice(0, 80) + '…' };
  await delay(200);
  yield { agentId: 'financial-agent', agentName: '💰 Financial', status: 'done', message: r.financial.slice(0, 80) + '…' };
  await delay(500);

  yield { agentId: 'aggregator', agentName: '📊 Aggregator', status: 'thinking', message: 'Merging all findings into report…' };
  await delay(800);
  yield { agentId: 'aggregator', agentName: '📊 Aggregator', status: 'done', message: formatReport(r) };
  await delay(200);

  yield DONE_EVENT;
}
```

- [ ] **Step 3: Write `src/app/api/agents/concurrent/route.ts`**
```typescript
import { NextRequest } from 'next/server';
import { runConcurrentAgent } from '@/lib/agents/concurrent';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runConcurrentAgent(input as string)), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
```

- [ ] **Step 4: Write `src/app/concurrent/page.tsx`**
```typescript
'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'dispatcher', type: 'agentNode', position: { x: 200, y: 0 }, data: { label: 'Dispatcher', icon: '🎯', color: '#6366f1', status: 'idle' } },
  { id: 'competitor-agent', type: 'agentNode', position: { x: 0, y: 160 }, data: { label: 'Competitor', icon: '🏆', color: '#6366f1', status: 'idle' } },
  { id: 'financial-agent', type: 'agentNode', position: { x: 140, y: 160 }, data: { label: 'Financial', icon: '💰', color: '#10b981', status: 'idle' } },
  { id: 'sentiment-agent', type: 'agentNode', position: { x: 280, y: 160 }, data: { label: 'Sentiment', icon: '💬', color: '#f59e0b', status: 'idle' } },
  { id: 'trends-agent', type: 'agentNode', position: { x: 420, y: 160 }, data: { label: 'Trends', icon: '📈', color: '#ec4899', status: 'idle' } },
  { id: 'aggregator', type: 'outputNode', position: { x: 200, y: 320 }, data: { label: 'Aggregator', icon: '📊', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'dispatcher', target: 'competitor-agent' },
  { id: 'e2', source: 'dispatcher', target: 'financial-agent' },
  { id: 'e3', source: 'dispatcher', target: 'sentiment-agent' },
  { id: 'e4', source: 'dispatcher', target: 'trends-agent' },
  { id: 'e5', source: 'competitor-agent', target: 'aggregator' },
  { id: 'e6', source: 'financial-agent', target: 'aggregator' },
  { id: 'e7', source: 'sentiment-agent', target: 'aggregator' },
  { id: 'e8', source: 'trends-agent', target: 'aggregator' },
];

export default function ConcurrentPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/concurrent');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e, animated: e.source === event.agentId && e.target === event.to,
      })));
      setTimeout(() => setEdges(eds => eds.map(e => ({ ...e, animated: false }))), 1200);
    }
    if (event.status === 'done' && event.agentId !== '__done__') {
      setOutput(prev => prev + (prev ? '\n\n' : '') + event.message);
    }
  }, [events]);

  return (
    <PatternPage
      title="⫸ Concurrent Agents"
      description="Market Research — 4 agents run simultaneously, results merged into one report"
      onRun={input => { setOutput(''); setNodes(makeNodes()); setEdges(makeEdges()); run(input); }}
      isRunning={isRunning}
      output={output}
      placeholder="OpenAI"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
```

- [ ] **Step 5: Commit**
```bash
git add src/lib/mock-data/market-research.ts src/lib/agents/concurrent.ts src/app/api/agents/concurrent/ src/app/concurrent/
git commit -m "feat: add Concurrent Agents pattern — Market Research"
```

---

### Task 9: Group Chat pattern — Product Design Critique

**Files:**
- Create: `src/lib/mock-data/product-critique.ts`
- Create: `src/lib/agents/group-chat.ts`
- Create: `src/app/api/agents/group-chat/route.ts`
- Create: `src/app/group-chat/page.tsx`

- [ ] **Step 1: Write `src/lib/mock-data/product-critique.ts`**
```typescript
export interface CritiqueTurn {
  agentId: 'moderator' | 'designer' | 'biz-analyst' | 'devils-advocate';
  agentName: string;
  message: string;
  to?: string;
}

export interface ProductArchetype {
  keyword: string;
  turns: CritiqueTurn[];
  verdict: string;
}

const ARCHETYPES: ProductArchetype[] = [
  {
    keyword: 'default',
    turns: [
      { agentId: 'moderator', agentName: '🤝 Moderator', message: "Let's evaluate this product idea. I'll ask each of you for your honest take. Designer, you're up first." },
      { agentId: 'designer', agentName: '🎨 Designer', message: "The concept has good bones. The core UX is intuitive — users can see value in under 30 seconds. But the onboarding has 6 steps before you reach the 'aha' moment. That's going to hurt activation rates. I'd cut it to 2 steps.", to: 'moderator' },
      { agentId: 'biz-analyst', agentName: '📊 Biz Analyst', message: "Market sizing looks real — I'd put the TAM at $8-12B based on comparable tools. The pricing model works if we target SMBs at $19/seat. But CAC could be brutal without a viral loop or self-serve motion. What's the acquisition strategy?", to: 'moderator' },
      { agentId: 'devils-advocate', agentName: '😈 Devil\'s Advocate', message: "Here's my challenge: three well-funded competitors already do 80% of this. What's the wedge? 'Better UX' isn't a moat — it's a 6-month head start before they copy it. I need to hear the defensible differentiation.", to: 'designer' },
      { agentId: 'designer', agentName: '🎨 Designer', message: "Fair. The differentiation isn't features, it's workflow integration. If we're embedded in Slack and Notion from day one, switching cost is real. Competitors are standalone apps — that's the gap.", to: 'devils-advocate' },
      { agentId: 'biz-analyst', agentName: '📊 Biz Analyst', message: "Integration strategy changes the acquisition math too — Slack App Directory gets you distribution for free. If 5% of installs convert to paid, that's a viable PLG motion. I'd prioritise the Slack integration over everything else.", to: 'designer' },
      { agentId: 'devils-advocate', agentName: '😈 Devil\'s Advocate', message: "I'll grant the integration angle. New concern: the AI features depend on OpenAI APIs, which means variable costs that scale with usage. At high volume, margins could compress badly. Have you modelled the unit economics at 10k MAU?", to: 'biz-analyst' },
      { agentId: 'moderator', agentName: '🤝 Moderator', message: "Strong debate. Let me synthesise: there's agreement on market opportunity and the Slack integration as the wedge. Open questions are unit economics at scale and onboarding conversion. Let's reach a verdict." },
      { agentId: 'designer', agentName: '🎨 Designer', message: "Proceed — but fix onboarding to 2 steps, and ship the Slack integration in v1, not later.", to: 'moderator' },
      { agentId: 'biz-analyst', agentName: '📊 Biz Analyst', message: "Agreed. Model the API cost ceiling before Series A — if margins compress below 60% gross, reprice or build your own inference layer.", to: 'moderator' },
      { agentId: 'devils-advocate', agentName: '😈 Devil\'s Advocate', message: "I'll vote proceed conditionally. The integration moat is real if you execute. But don't launch without a clear answer to the unit economics question — investors will ask.", to: 'moderator' },
    ],
    verdict: "VERDICT: Proceed with refinements. Ship Slack integration in v1 as the primary wedge. Reduce onboarding to 2 steps. Model API unit economics at 10k MAU before pricing v2. The differentiation story is credible if execution is tight.",
  },
];

export function getArchetype(input: string): ProductArchetype {
  return ARCHETYPES[0];
}
```

- [ ] **Step 2: Write `src/lib/agents/group-chat.ts`**
```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { getArchetype } from '../mock-data/product-critique';

export async function* runGroupChatAgent(input: string): AsyncGenerator<AgentEvent> {
  const arch = getArchetype(input);
  const colors: Record<string, string> = {
    moderator: '#10b981',
    designer: '#6366f1',
    'biz-analyst': '#f59e0b',
    'devils-advocate': '#ec4899',
  };

  for (const turn of arch.turns) {
    const wordCount = turn.message.split(' ').length;
    const thinkMs = Math.min(Math.max(wordCount * 20, 300), 700);
    const readMs = Math.min(Math.max(wordCount * 40, 600), 1400);

    yield { agentId: turn.agentId, agentName: turn.agentName, status: 'thinking', message: '…', to: turn.to };
    await delay(thinkMs);
    yield { agentId: turn.agentId, agentName: turn.agentName, status: 'done', message: turn.message, to: turn.to };
    await delay(readMs);
  }

  yield { agentId: 'moderator', agentName: '🤝 Moderator', status: 'done', message: arch.verdict };
  await delay(200);
  yield DONE_EVENT;
}
```

- [ ] **Step 3: Write `src/app/api/agents/group-chat/route.ts`**
```typescript
import { NextRequest } from 'next/server';
import { runGroupChatAgent } from '@/lib/agents/group-chat';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runGroupChatAgent(input as string)), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
```

- [ ] **Step 4: Write `src/app/group-chat/page.tsx`**
```typescript
'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'moderator', type: 'agentNode', position: { x: 180, y: 0 }, data: { label: 'Moderator', icon: '🤝', color: '#10b981', status: 'idle' } },
  { id: 'designer', type: 'agentNode', position: { x: 0, y: 170 }, data: { label: 'Designer', icon: '🎨', color: '#6366f1', status: 'idle' } },
  { id: 'biz-analyst', type: 'agentNode', position: { x: 360, y: 170 }, data: { label: 'Biz Analyst', icon: '📊', color: '#f59e0b', status: 'idle' } },
  { id: 'devils-advocate', type: 'agentNode', position: { x: 180, y: 340 }, data: { label: "Devil's Advocate", icon: '😈', color: '#ec4899', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'moderator', target: 'designer' },
  { id: 'e2', source: 'moderator', target: 'biz-analyst' },
  { id: 'e3', source: 'moderator', target: 'devils-advocate' },
  { id: 'e4', source: 'designer', target: 'biz-analyst' },
  { id: 'e5', source: 'designer', target: 'devils-advocate' },
  { id: 'e6', source: 'biz-analyst', target: 'devils-advocate' },
];

export default function GroupChatPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/group-chat');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    // Animate the edge between speaker and addressee
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e,
        animated: (e.source === event.agentId && e.target === event.to) || (e.source === event.to && e.target === event.agentId),
      })));
      setTimeout(() => setEdges(eds => eds.map(e => ({ ...e, animated: false }))), 1800);
    }
    // Append all done messages to output as a conversation transcript
    if (event.status === 'done' && event.agentId !== '__done__') {
      setOutput(prev => prev + (prev ? '\n\n' : '') + `[${event.agentName}]\n${event.message}`);
    }
  }, [events]);

  return (
    <PatternPage
      title="💬 Group Chat"
      description="Product Design Critique — agents debate your idea and converge on a recommendation"
      onRun={input => { setOutput(''); setNodes(makeNodes()); setEdges(makeEdges()); run(input); }}
      isRunning={isRunning}
      output={output}
      placeholder="An AI-powered meal planner that generates weekly grocery lists"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
```

- [ ] **Step 5: Commit**
```bash
git add src/lib/mock-data/product-critique.ts src/lib/agents/group-chat.ts src/app/api/agents/group-chat/ src/app/group-chat/
git commit -m "feat: add Group Chat pattern — Product Design Critique"
```

---

### Task 10: Supervisor pattern — Software Builder

**Files:**
- Create: `src/lib/mock-data/software-builder.ts`
- Create: `src/lib/agents/supervisor.ts`
- Create: `src/app/api/agents/supervisor/route.ts`
- Create: `src/app/supervisor/page.tsx`

- [ ] **Step 1: Write `src/lib/mock-data/software-builder.ts`**
```typescript
export interface AppArchetype {
  name: string;
  supervisorPlan: string;
  frontend: { deliverable: string };
  backend: { deliverable: string };
  database: { deliverable: string };
  infra: { deliverable: string };
  summary: string;
}

const ARCHETYPES: Record<string, AppArchetype> = {
  'task-manager': {
    name: 'Task Management App',
    supervisorPlan: `Requirements analysis complete. Breaking into 4 workstreams:

1. FRONTEND — React SPA with auth flows, task board (drag-and-drop), real-time sync, team panel
2. BACKEND — REST API + WebSocket server, JWT auth, task/user/team endpoints
3. DATABASE — PostgreSQL schema (users, tasks, teams, memberships), Redis session cache
4. INFRA — Docker + AWS ECS, RDS, ElastiCache, GitHub Actions CI/CD

Assigning to specialist agents now…`,
    frontend: { deliverable: `✅ FRONTEND COMPLETE
Stack: React 18 + TypeScript + Zustand + TanStack Query
Components: AuthProvider, TaskBoard (drag via @dnd-kit), WebSocketProvider, TeamPanel, NotificationBadge
Pages: Login, Register, Dashboard, Board, Team, Settings (6 pages)
Real-time: WebSocket client with optimistic updates and reconnect logic
Bundle: 148KB gzipped` },
    backend: { deliverable: `✅ BACKEND COMPLETE
Stack: Node.js + Express + TypeScript + Zod
Endpoints: 24 REST routes (tasks CRUD, users, teams, invitations, notifications)
Auth: JWT + refresh tokens, bcrypt password hashing, rate limiting (100 req/min)
WebSocket: Socket.io rooms per workspace, presence tracking
Test coverage: 87%` },
    database: { deliverable: `✅ DATABASE COMPLETE
Tables: users, tasks, teams, memberships, task_assignments, audit_log (6 tables)
Indexes: 16 indexes optimised for dashboard query patterns
Views: team_task_summary, user_workload_report (2 materialised views)
Cache: Redis session store (24h TTL), task list cache (5min TTL)
Migrations: 8 migration files, rollback scripts included` },
    infra: { deliverable: `✅ INFRASTRUCTURE COMPLETE
Containerisation: Multi-stage Dockerfile, images <180MB
Orchestration: AWS ECS Fargate with auto-scaling (2–10 tasks)
Database: RDS PostgreSQL Multi-AZ (db.t3.medium)
Cache: ElastiCache Redis cluster (cache.t3.micro)
CI/CD: GitHub Actions — lint → test → build → deploy to ECS
Estimated monthly cost: ~$285` },
    summary: `🚀 TASK MANAGEMENT APP — BUILD COMPLETE

Frontend:  React 18 SPA · 6 pages · real-time WebSocket · 148KB bundle
Backend:   24 REST endpoints · JWT auth · Socket.io · 87% test coverage
Database:  6 tables · 16 indexes · Redis cache · 8 migrations
Infra:     ECS Fargate · RDS Multi-AZ · ElastiCache · GitHub Actions CI/CD

Estimated timeline: 6 weeks (4 engineers)
Monthly infra cost: ~$285
Recommended next step: User acceptance testing with 5 pilot teams`,
  },
  'ecommerce': {
    name: 'E-Commerce Platform',
    supervisorPlan: `Requirements analysis complete. Breaking into 4 workstreams:

1. FRONTEND — Next.js storefront, product catalogue, cart, checkout, order tracking
2. BACKEND — Product/order/payment APIs, Stripe integration, inventory management
3. DATABASE — PostgreSQL (products, orders, customers, inventory), Elasticsearch for search
4. INFRA — Vercel (frontend), Railway (backend), managed Postgres, CDN for assets

Assigning to specialist agents now…`,
    frontend: { deliverable: `✅ FRONTEND COMPLETE
Stack: Next.js 14 + TypeScript + Tailwind + Zustand (cart state)
Pages: Home, Catalogue, Product Detail, Cart, Checkout, Order Confirmation, Account (7 pages)
Features: Server-side rendering for SEO, image optimisation, mobile-responsive
Payment UI: Stripe Elements integrated, 3D Secure supported
Performance: LCP < 2.1s, CLS < 0.1` },
    backend: { deliverable: `✅ BACKEND COMPLETE
Stack: Node.js + Fastify + TypeScript
Endpoints: 31 routes (products, orders, payments, customers, inventory, webhooks)
Payments: Stripe integration with webhook verification, refund handling
Inventory: Real-time stock tracking with optimistic locking to prevent oversell
Email: Transactional emails via Resend (order confirmation, shipping updates)` },
    database: { deliverable: `✅ DATABASE COMPLETE
Tables: products, product_variants, orders, order_items, customers, inventory, reviews (7 tables)
Search: Elasticsearch index for full-text product search with faceted filtering
Cache: Redis for session cart, product catalogue (10min TTL)
Analytics: Read replica for reporting queries` },
    infra: { deliverable: `✅ INFRASTRUCTURE COMPLETE
Frontend: Vercel deployment with edge caching
Backend: Railway (auto-scaling containers)
Database: Railway managed Postgres + Redis
Assets: Cloudflare CDN for product images
Monitoring: Sentry for errors, Vercel Analytics for Web Vitals
Estimated monthly cost: ~$190` },
    summary: `🚀 E-COMMERCE PLATFORM — BUILD COMPLETE

Frontend:  Next.js 14 SSR · 7 pages · Stripe Elements · LCP < 2.1s
Backend:   31 endpoints · Stripe payments · inventory lock · email notifications
Database:  7 tables · Elasticsearch search · Redis cart cache · read replica
Infra:     Vercel + Railway + Cloudflare CDN · monitoring via Sentry

Estimated timeline: 8 weeks (4 engineers)
Monthly infra cost: ~$190`,
  },
};

export function getAppArchetype(input: string): AppArchetype {
  const lower = input.toLowerCase();
  if (lower.includes('task') || lower.includes('todo') || lower.includes('project management')) return ARCHETYPES['task-manager'];
  if (lower.includes('ecommerce') || lower.includes('shop') || lower.includes('store') || lower.includes('product')) return ARCHETYPES['ecommerce'];
  return ARCHETYPES['task-manager'];
}
```

- [ ] **Step 2: Write `src/lib/agents/supervisor.ts`**
```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { getAppArchetype } from '../mock-data/software-builder';

export async function* runSupervisorAgent(input: string): AsyncGenerator<AgentEvent> {
  const arch = getAppArchetype(input);

  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'thinking', message: 'Analysing requirements…' };
  await delay(1000);
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'done', message: arch.supervisorPlan };
  await delay(500);

  // Frontend
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Frontend agent…', to: 'frontend-agent' };
  await delay(400);
  yield { agentId: 'frontend-agent', agentName: '🖥️ Frontend', status: 'thinking', message: 'Building frontend…' };
  await delay(1000);
  yield { agentId: 'frontend-agent', agentName: '🖥️ Frontend', status: 'done', message: arch.frontend.deliverable };
  await delay(400);

  // Backend
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Backend agent…', to: 'backend-agent' };
  await delay(400);
  yield { agentId: 'backend-agent', agentName: '⚙️ Backend', status: 'thinking', message: 'Building backend…' };
  await delay(1100);
  yield { agentId: 'backend-agent', agentName: '⚙️ Backend', status: 'done', message: arch.backend.deliverable };
  await delay(400);

  // Database
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Database agent…', to: 'database-agent' };
  await delay(400);
  yield { agentId: 'database-agent', agentName: '🗄️ Database', status: 'thinking', message: 'Designing schema…' };
  await delay(900);
  yield { agentId: 'database-agent', agentName: '🗄️ Database', status: 'done', message: arch.database.deliverable };
  await delay(400);

  // Infra
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Infra agent…', to: 'infra-agent' };
  await delay(400);
  yield { agentId: 'infra-agent', agentName: '☁️ Infra', status: 'thinking', message: 'Setting up infrastructure…' };
  await delay(1000);
  yield { agentId: 'infra-agent', agentName: '☁️ Infra', status: 'done', message: arch.infra.deliverable };
  await delay(500);

  // Final summary
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'thinking', message: 'Reviewing all outputs…' };
  await delay(700);
  yield { agentId: 'build-summary', agentName: '✅ Build Summary', status: 'done', message: arch.summary };
  await delay(200);

  yield DONE_EVENT;
}
```

- [ ] **Step 3: Write `src/app/api/agents/supervisor/route.ts`**
```typescript
import { NextRequest } from 'next/server';
import { runSupervisorAgent } from '@/lib/agents/supervisor';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runSupervisorAgent(input as string)), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
```

- [ ] **Step 4: Write `src/app/supervisor/page.tsx`**
```typescript
'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'supervisor', type: 'agentNode', position: { x: 210, y: 0 }, data: { label: 'Supervisor', icon: '👑', color: '#f59e0b', status: 'idle' } },
  { id: 'frontend-agent', type: 'agentNode', position: { x: 0, y: 170 }, data: { label: 'Frontend', icon: '🖥️', color: '#6366f1', status: 'idle' } },
  { id: 'backend-agent', type: 'agentNode', position: { x: 140, y: 170 }, data: { label: 'Backend', icon: '⚙️', color: '#10b981', status: 'idle' } },
  { id: 'database-agent', type: 'agentNode', position: { x: 280, y: 170 }, data: { label: 'Database', icon: '🗄️', color: '#f59e0b', status: 'idle' } },
  { id: 'infra-agent', type: 'agentNode', position: { x: 420, y: 170 }, data: { label: 'Infra', icon: '☁️', color: '#ec4899', status: 'idle' } },
  { id: 'build-summary', type: 'outputNode', position: { x: 210, y: 340 }, data: { label: 'Build Summary', icon: '✅', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'supervisor', target: 'frontend-agent' },
  { id: 'e2', source: 'supervisor', target: 'backend-agent' },
  { id: 'e3', source: 'supervisor', target: 'database-agent' },
  { id: 'e4', source: 'supervisor', target: 'infra-agent' },
  { id: 'e5', source: 'frontend-agent', target: 'build-summary' },
  { id: 'e6', source: 'backend-agent', target: 'build-summary' },
  { id: 'e7', source: 'database-agent', target: 'build-summary' },
  { id: 'e8', source: 'infra-agent', target: 'build-summary' },
];

export default function SupervisorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/supervisor');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e,
        animated: e.source === event.agentId && e.target === event.to,
        style: { stroke: (e.source === event.agentId && e.target === event.to) ? '#f59e0b' : '#52525b', strokeWidth: 1.5 },
      })));
      setTimeout(() => setEdges(eds => eds.map(e => ({ ...e, animated: false, style: { stroke: '#52525b', strokeWidth: 1.5 } }))), 1500);
    }
    if (event.status === 'done' && event.agentId !== '__done__') {
      setOutput(prev => prev + (prev ? '\n\n' : '') + event.message);
    }
  }, [events]);

  return (
    <PatternPage
      title="👑 Supervisor + Sub-agents"
      description="Software Builder — describe an app and watch the supervisor coordinate specialist agents"
      onRun={input => { setOutput(''); setNodes(makeNodes()); setEdges(makeEdges()); run(input); }}
      isRunning={isRunning}
      output={output}
      placeholder="Build a task management app with user auth, team collaboration, and real-time updates"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
```

- [ ] **Step 5: Commit**
```bash
git add src/lib/mock-data/software-builder.ts src/lib/agents/supervisor.ts src/app/api/agents/supervisor/ src/app/supervisor/
git commit -m "feat: add Supervisor pattern — Software Builder"
```

---

### Task 11: Home page and final check

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write `src/app/page.tsx`**
```typescript
import Link from 'next/link';

const PATTERNS = [
  {
    href: '/react-agent',
    icon: '⚡',
    name: 'ReAct / Tool-Calling Agent',
    category: 'Single Agent',
    useCase: 'Travel Planner',
    description: 'One agent reasons, picks tools, acts, and loops until done.',
    color: 'border-indigo-500/30 hover:border-indigo-500/70',
    badge: 'bg-indigo-500/10 text-indigo-400',
  },
  {
    href: '/sequential',
    icon: '→',
    name: 'Sequential Pipeline',
    category: 'Multi-Agent',
    useCase: 'News Digest',
    description: 'Agents run one after another — each passes its output to the next.',
    color: 'border-amber-500/30 hover:border-amber-500/70',
    badge: 'bg-amber-500/10 text-amber-400',
  },
  {
    href: '/concurrent',
    icon: '⫸',
    name: 'Concurrent Agents',
    category: 'Multi-Agent',
    useCase: 'Market Research',
    description: 'Multiple agents fan out simultaneously, results merged at the end.',
    color: 'border-pink-500/30 hover:border-pink-500/70',
    badge: 'bg-pink-500/10 text-pink-400',
  },
  {
    href: '/group-chat',
    icon: '💬',
    name: 'Group Chat',
    category: 'Multi-Agent',
    useCase: 'Product Critique',
    description: 'Agents talk to each other freely — debate, challenge, converge.',
    color: 'border-green-500/30 hover:border-green-500/70',
    badge: 'bg-green-500/10 text-green-400',
  },
  {
    href: '/supervisor',
    icon: '👑',
    name: 'Supervisor + Sub-agents',
    category: 'Multi-Agent',
    useCase: 'Software Builder',
    description: 'A master agent plans and delegates to specialist sub-agents.',
    color: 'border-yellow-500/30 hover:border-yellow-500/70',
    badge: 'bg-yellow-500/10 text-yellow-400',
  },
];

export default function HomePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Agentic Systems Demo</h1>
        <p className="text-zinc-400 text-base mb-10">
          Explore 5 orchestration patterns that define how AI agents work together.
          Each demo is interactive — type a prompt and watch agents collaborate in real time.
        </p>
        <div className="grid gap-4">
          {PATTERNS.map(p => (
            <Link
              key={p.href}
              href={p.href}
              className={`group block border rounded-xl p-5 bg-zinc-900 transition-all duration-200 ${p.color}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-zinc-100">{p.name}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.badge}`}>
                        {p.category}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">{p.description}</div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Use case</div>
                  <div className="text-xs font-medium text-zinc-300">{p.useCase}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**
```bash
pnpm tsc --noEmit
```
Expected: no errors. If errors appear, fix them before continuing.

- [ ] **Step 3: Build check**
```bash
pnpm build
```
Expected: `✓ Compiled successfully`. Fix any errors that appear.

- [ ] **Step 4: Smoke test in browser**
```bash
pnpm dev
```
Open http://localhost:3000. Verify:
- Sidebar visible, all 5 links work
- Home page shows all 5 pattern cards
- ReAct Agent page loads, type "Tokyo trip", click Run → nodes animate, output appears
- Sequential page loads, type "AI regulation", click Run → nodes light up left to right

- [ ] **Step 5: Final commit**
```bash
git add src/app/page.tsx
git commit -m "feat: add home page and complete all 5 orchestration patterns"
```

---

## Execution Options

Plan complete and saved to `docs/superpowers/plans/2026-04-16-agentic-systems-demo.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration. Use `superpowers:subagent-driven-development`.

**2. Inline Execution** — Execute tasks in this session using `superpowers:executing-plans`, with checkpoints for review.

Which approach?
