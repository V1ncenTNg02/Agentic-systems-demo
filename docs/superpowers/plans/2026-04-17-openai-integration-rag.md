# OpenAI Integration + Medicine Checker RAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded `done` message strings in all 5 agent patterns with real `gpt-4o-mini` output, and add a new Medicine Checker RAG demo page with a 4-node pipeline.

**Architecture:** A shared `src/lib/openai.ts` module provides a single `generateAgentMessage()` helper used by all agents. Each agent keeps its topology and `passing` events hardcoded; only `done` message content is AI-generated, with the LLM call acting as the natural delay. The RAG page adds a new sidebar entry and follows the exact same SSE + async-generator pattern as existing patterns.

**Tech Stack:** Next.js App Router, TypeScript, `openai` npm package (gpt-4o-mini), Tailwind CSS v4, React Flow, existing SSE streaming infrastructure.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/openai.ts` | Lazy OpenAI client init + `generateAgentMessage()` helper |
| Modify | `src/lib/agents/react-agent.ts` | AI-generate `done` messages, remove mock-data import |
| Modify | `src/lib/agents/sequential.ts` | AI-generate `done` messages, remove mock-data import |
| Modify | `src/lib/agents/concurrent.ts` | AI-generate `done` messages, remove mock-data import |
| Modify | `src/lib/agents/supervisor.ts` | AI-generate `done` messages, remove mock-data import |
| Modify | `src/lib/agents/group-chat.ts` | AI-generate turn messages, keep turn structure from mock-data |
| Create | `src/lib/mock-data/rag-corpus.ts` | 20 medicine entries with symptom keywords |
| Create | `src/lib/agents/rag.ts` | 4-node RAG async generator |
| Create | `src/app/api/agents/rag/route.ts` | SSE POST route for RAG |
| Create | `src/app/rag/page.tsx` | RAG demo page with React Flow diagram |
| Modify | `src/components/sidebar/Sidebar.tsx` | Add RAG entry under new "RAG" group |

---

## Task 1: Install OpenAI package and create shared client

**Files:**
- Create: `src/lib/openai.ts`
- Modify: `.env.local` (user creates manually)

- [ ] **Step 1: Install the openai package**

```bash
cd e:/GitProject/Agentic-systems-demo
pnpm add openai
```

Expected output: `+ openai@x.x.x` added to `package.json`.

- [ ] **Step 2: Verify .env.local exists with the API key**

The user must create `e:/GitProject/Agentic-systems-demo/.env.local` with:
```
OPENAI_API_KEY=sk-...your-key-here...
```

Verify `.gitignore` already ignores it:
```bash
grep ".env.local" .gitignore
```
If not present, add `.env.local` to `.gitignore`.

- [ ] **Step 3: Create `src/lib/openai.ts`**

```typescript
import OpenAI from 'openai';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export async function generateAgentMessage(system: string, user: string): Promise<string> {
  try {
    const res = await getClient().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    return res.choices[0]?.message?.content?.trim() ?? 'No response generated.';
  } catch {
    return 'Error generating response.';
  }
}
```

- [ ] **Step 4: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/openai.ts package.json pnpm-lock.yaml
git commit -m "feat: add shared OpenAI client helper (gpt-4o-mini)"
```

---

## Task 2: Update react-agent.ts

**Files:**
- Modify: `src/lib/agents/react-agent.ts`

The current file imports `getDestinationData` and `formatItinerary` from mock-data. We remove that dependency and AI-generate each tool's `done` message. `passing` events (routing arrows) stay hardcoded. `thinking` messages stay hardcoded (they're loading indicators shown while AI generates the `done` content).

- [ ] **Step 1: Replace `src/lib/agents/react-agent.ts` entirely**

```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { generateAgentMessage } from '../openai';

export async function* runReactAgent(input: string): AsyncGenerator<AgentEvent> {
  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'thinking', message: 'Analysing your travel request…' };
  const planMsg = await generateAgentMessage(
    'You are a travel planning AI. Acknowledge the trip request in one short sentence and mention the destination.',
    input
  );

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Searching flights…', to: 'flights-tool' };
  await delay(300);
  const flightsMsg = await generateAgentMessage(
    'You are a flight search tool. Return exactly 2 flight options with airline, route, price and duration. Format: "AirlineName · Route · $Price · Xh Ym". One option per line. No preamble.',
    `Find flights for: ${input}`
  );
  yield { agentId: 'flights-tool', agentName: '✈ Flights', status: 'done', message: flightsMsg };
  await delay(200);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Searching hotels…', to: 'hotels-tool' };
  await delay(300);
  const hotelsMsg = await generateAgentMessage(
    'You are a hotel search tool. Return exactly 2 hotel options with name, area, and price per night. Format: "HotelName · Area · $X/night". One option per line. No preamble.',
    `Find hotels for: ${input}`
  );
  yield { agentId: 'hotels-tool', agentName: '🏨 Hotels', status: 'done', message: hotelsMsg };
  await delay(200);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Finding restaurants…', to: 'food-tool' };
  await delay(300);
  const foodMsg = await generateAgentMessage(
    'You are a restaurant finder. List 3 restaurants with cuisine type. Format: "Name (Cuisine), Name (Cuisine), Name (Cuisine)". No preamble.',
    `Find restaurants for: ${input}`
  );
  yield { agentId: 'food-tool', agentName: '🍜 Food', status: 'done', message: foodMsg };
  await delay(200);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'passing', message: 'Checking activities…', to: 'activities-tool' };
  await delay(300);
  const activitiesMsg = await generateAgentMessage(
    'You are an activities advisor. List 3 must-do activities with a 3-word description each. Format: "Activity — description". One per line. No preamble.',
    `Find activities for: ${input}`
  );
  yield { agentId: 'activities-tool', agentName: '🎌 Activities', status: 'done', message: activitiesMsg };
  await delay(300);

  yield { agentId: 'react-agent', agentName: '🧠 ReAct Agent', status: 'thinking', message: 'Compiling full itinerary…' };
  const itineraryMsg = await generateAgentMessage(
    'You are a travel planner. Write a concise 5-day itinerary summary in 4-5 sentences. Include highlights from flights, hotels, food, and activities.',
    `Create a complete itinerary for: ${input}`
  );
  yield { agentId: 'final-plan', agentName: '📋 Final Itinerary', status: 'done', message: itineraryMsg };
  await delay(200);

  yield DONE_EVENT;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/react-agent.ts
git commit -m "feat: AI-generate react-agent done messages via gpt-4o-mini"
```

---

## Task 3: Update sequential.ts

**Files:**
- Modify: `src/lib/agents/sequential.ts`

Remove `getNewsTopic`/`formatDigest` imports. AI generates each source's `done` message and the analyzer/writer `done` messages.

- [ ] **Step 1: Replace `src/lib/agents/sequential.ts` entirely**

```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { generateAgentMessage } from '../openai';

export async function* runSequentialAgent(input: string): AsyncGenerator<AgentEvent> {
  yield { agentId: 'bbc-source', agentName: '📰 BBC', status: 'thinking', message: 'Fetching BBC coverage…' };
  const bbcMsg = await generateAgentMessage(
    'You are a BBC journalist. Write a 1-sentence news headline and a 10-word excerpt on the topic. Format: "Headline" — excerpt. No preamble.',
    `BBC coverage of: ${input}`
  );
  yield { agentId: 'bbc-source', agentName: '📰 BBC', status: 'done', message: bbcMsg };
  await delay(300);

  yield { agentId: 'reuters-source', agentName: '📰 Reuters', status: 'thinking', message: 'Fetching Reuters coverage…' };
  const reutersMsg = await generateAgentMessage(
    'You are a Reuters journalist. Write a 1-sentence news headline and a 10-word excerpt on the topic. Format: "Headline" — excerpt. No preamble.',
    `Reuters coverage of: ${input}`
  );
  yield { agentId: 'reuters-source', agentName: '📰 Reuters', status: 'done', message: reutersMsg };
  await delay(300);

  yield { agentId: 'ap-source', agentName: '📰 AP', status: 'thinking', message: 'Fetching AP coverage…' };
  const apMsg = await generateAgentMessage(
    'You are an AP journalist. Write a 1-sentence news headline and a 10-word excerpt on the topic. Format: "Headline" — excerpt. No preamble.',
    `AP coverage of: ${input}`
  );
  yield { agentId: 'ap-source', agentName: '📰 AP', status: 'done', message: apMsg };
  await delay(400);

  yield { agentId: 'analyzer', agentName: '🔍 Analyzer', status: 'thinking', message: 'Cross-referencing three sources…', to: 'bbc-source' };
  const analyzerMsg = await generateAgentMessage(
    'You are a news analyst. Given three source headlines, identify the consensus view and one key point of divergence in 2 sentences. No preamble.',
    `Analyze these sources on "${input}":\nBBC: ${bbcMsg}\nReuters: ${reutersMsg}\nAP: ${apMsg}`
  );
  yield { agentId: 'analyzer', agentName: '🔍 Analyzer', status: 'done', message: analyzerMsg };
  await delay(300);

  yield { agentId: 'writer', agentName: '✍️ Writer', status: 'thinking', message: 'Drafting neutral summary…', to: 'analyzer' };
  const writerMsg = await generateAgentMessage(
    'You are a neutral news writer. Write a 3-sentence digest summarising the topic from multiple perspectives. No preamble.',
    `Write a digest on "${input}" using this analysis: ${analyzerMsg}`
  );
  yield { agentId: 'writer', agentName: '✍️ Writer', status: 'done', message: writerMsg };
  await delay(200);

  yield DONE_EVENT;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/sequential.ts
git commit -m "feat: AI-generate sequential agent done messages via gpt-4o-mini"
```

---

## Task 4: Update concurrent.ts

**Files:**
- Modify: `src/lib/agents/concurrent.ts`

Remove mock-data import. Fan-out 4 AI calls in parallel using `Promise.all` to preserve the concurrent feel, then yield staggered completions.

- [ ] **Step 1: Replace `src/lib/agents/concurrent.ts` entirely**

```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { generateAgentMessage } from '../openai';

export async function* runConcurrentAgent(input: string): AsyncGenerator<AgentEvent> {
  yield { agentId: 'dispatcher', agentName: '🎯 Dispatcher', status: 'thinking', message: 'Spinning up 4 research agents simultaneously…' };
  await delay(400);

  // Fan-out: all 4 agents start thinking in rapid succession
  yield { agentId: 'competitor-agent', agentName: '🏆 Competitor', status: 'thinking', message: 'Analysing competitive landscape…', to: 'dispatcher' };
  await delay(60);
  yield { agentId: 'financial-agent', agentName: '💰 Financial', status: 'thinking', message: 'Pulling financial data…', to: 'dispatcher' };
  await delay(60);
  yield { agentId: 'sentiment-agent', agentName: '💬 Sentiment', status: 'thinking', message: 'Scanning sentiment signals…', to: 'dispatcher' };
  await delay(60);
  yield { agentId: 'trends-agent', agentName: '📈 Trends', status: 'thinking', message: 'Identifying market trends…', to: 'dispatcher' };

  // Fire all 4 AI calls in parallel
  const [competitorMsg, financialMsg, sentimentMsg, trendsMsg] = await Promise.all([
    generateAgentMessage(
      'You are a competitive intelligence analyst. Summarise the competitive landscape in 2 sentences. Be specific with competitor names. No preamble.',
      `Competitive analysis of: ${input}`
    ),
    generateAgentMessage(
      'You are a financial analyst. Summarise key financial metrics (revenue, valuation, growth) in 2 sentences. No preamble.',
      `Financial analysis of: ${input}`
    ),
    generateAgentMessage(
      'You are a sentiment analyst. Summarise developer, investor, and public sentiment in 2 sentences. No preamble.',
      `Sentiment analysis of: ${input}`
    ),
    generateAgentMessage(
      'You are a market trends analyst. List 3 key market trends as a comma-separated line. No preamble.',
      `Market trends for: ${input}`
    ),
  ]);

  // Staggered completions to visualise parallelism
  yield { agentId: 'sentiment-agent', agentName: '💬 Sentiment', status: 'done', message: sentimentMsg };
  await delay(200);
  yield { agentId: 'competitor-agent', agentName: '🏆 Competitor', status: 'done', message: competitorMsg };
  await delay(300);
  yield { agentId: 'trends-agent', agentName: '📈 Trends', status: 'done', message: trendsMsg };
  await delay(200);
  yield { agentId: 'financial-agent', agentName: '💰 Financial', status: 'done', message: financialMsg };
  await delay(400);

  yield { agentId: 'aggregator', agentName: '📊 Aggregator', status: 'thinking', message: 'Merging all findings into report…' };
  const reportMsg = await generateAgentMessage(
    'You are a research aggregator. Write a 3-sentence executive summary combining competitive, financial, sentiment, and trends findings. No preamble.',
    `Aggregate research on "${input}":\nCompetitors: ${competitorMsg}\nFinancials: ${financialMsg}\nSentiment: ${sentimentMsg}\nTrends: ${trendsMsg}`
  );
  yield { agentId: 'aggregator', agentName: '📊 Aggregator', status: 'done', message: reportMsg };
  await delay(200);

  yield DONE_EVENT;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/concurrent.ts
git commit -m "feat: AI-generate concurrent agent done messages, parallel gpt-4o-mini calls"
```

---

## Task 5: Update supervisor.ts

**Files:**
- Modify: `src/lib/agents/supervisor.ts`

Remove mock-data import. AI generates the supervisor plan and each specialist's deliverable.

- [ ] **Step 1: Replace `src/lib/agents/supervisor.ts` entirely**

```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { generateAgentMessage } from '../openai';

export async function* runSupervisorAgent(input: string): AsyncGenerator<AgentEvent> {
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'thinking', message: 'Analysing requirements…' };
  const planMsg = await generateAgentMessage(
    'You are a software architect supervisor. Write a 2-sentence plan describing how you will delegate this app to frontend, backend, database, and infra specialists. No preamble.',
    `App requirements: ${input}`
  );
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'done', message: planMsg };
  await delay(400);

  // Frontend
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Frontend agent…', to: 'frontend-agent' };
  await delay(300);
  yield { agentId: 'frontend-agent', agentName: '🖥️ Frontend', status: 'thinking', message: 'Building frontend…' };
  const frontendMsg = await generateAgentMessage(
    'You are a frontend engineer. Describe your deliverable for this app in 2 sentences: key screens, framework choice, and UI approach. No preamble.',
    `Frontend for: ${input}`
  );
  yield { agentId: 'frontend-agent', agentName: '🖥️ Frontend', status: 'done', message: frontendMsg };
  await delay(300);

  // Backend
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Backend agent…', to: 'backend-agent' };
  await delay(300);
  yield { agentId: 'backend-agent', agentName: '⚙️ Backend', status: 'thinking', message: 'Building backend…' };
  const backendMsg = await generateAgentMessage(
    'You are a backend engineer. Describe your deliverable in 2 sentences: API design, key endpoints, and tech stack. No preamble.',
    `Backend for: ${input}`
  );
  yield { agentId: 'backend-agent', agentName: '⚙️ Backend', status: 'done', message: backendMsg };
  await delay(300);

  // Database
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Database agent…', to: 'database-agent' };
  await delay(300);
  yield { agentId: 'database-agent', agentName: '🗄️ Database', status: 'thinking', message: 'Designing schema…' };
  const databaseMsg = await generateAgentMessage(
    'You are a database engineer. Describe your deliverable in 2 sentences: key tables/collections, relationships, and DB choice. No preamble.',
    `Database design for: ${input}`
  );
  yield { agentId: 'database-agent', agentName: '🗄️ Database', status: 'done', message: databaseMsg };
  await delay(300);

  // Infra
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'passing', message: 'Delegating to Infra agent…', to: 'infra-agent' };
  await delay(300);
  yield { agentId: 'infra-agent', agentName: '☁️ Infra', status: 'thinking', message: 'Setting up infrastructure…' };
  const infraMsg = await generateAgentMessage(
    'You are a DevOps engineer. Describe your deliverable in 2 sentences: hosting platform, CI/CD, and deployment strategy. No preamble.',
    `Infrastructure for: ${input}`
  );
  yield { agentId: 'infra-agent', agentName: '☁️ Infra', status: 'done', message: infraMsg };
  await delay(400);

  // Final summary
  yield { agentId: 'supervisor', agentName: '👑 Supervisor', status: 'thinking', message: 'Reviewing all outputs…' };
  const summaryMsg = await generateAgentMessage(
    'You are a software architect. Write a 3-sentence project summary combining all specialist outputs. Mention timeline estimate and key risks. No preamble.',
    `Summarise build of "${input}":\nFrontend: ${frontendMsg}\nBackend: ${backendMsg}\nDatabase: ${databaseMsg}\nInfra: ${infraMsg}`
  );
  yield { agentId: 'build-summary', agentName: '✅ Build Summary', status: 'done', message: summaryMsg };
  await delay(200);

  yield DONE_EVENT;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/supervisor.ts
git commit -m "feat: AI-generate supervisor agent done messages via gpt-4o-mini"
```

---

## Task 6: Update group-chat.ts

**Files:**
- Modify: `src/lib/agents/group-chat.ts`

Keep `getArchetype()` call to preserve turn structure (agent IDs, names, `to` fields). Replace `turn.message` with AI-generated content per speaker role.

- [ ] **Step 1: Replace `src/lib/agents/group-chat.ts` entirely**

```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { generateAgentMessage } from '../openai';
import { getArchetype } from '../mock-data/product-critique';

const ROLE_PROMPTS: Record<string, string> = {
  moderator: 'You are a product critique moderator. Open the discussion or summarise a point in 2 sentences. Stay neutral. No preamble.',
  designer: 'You are a UX designer in a product critique. Give a 2-sentence design opinion on the product. Be specific. No preamble.',
  'biz-analyst': 'You are a business analyst in a product critique. Give a 2-sentence business or market opinion. Be specific. No preamble.',
  'devil-advocate': 'You are a devil\'s advocate in a product critique. Challenge the previous point with a 2-sentence counter-argument. No preamble.',
};

export async function* runGroupChatAgent(input: string): AsyncGenerator<AgentEvent> {
  const arch = getArchetype(input);

  for (const turn of arch.turns) {
    const systemPrompt = ROLE_PROMPTS[turn.agentId] ?? 'You are a product critique participant. Give a 2-sentence opinion. No preamble.';

    yield { agentId: turn.agentId, agentName: turn.agentName, status: 'thinking', message: '…', to: turn.to };
    const message = await generateAgentMessage(systemPrompt, `Product being discussed: ${input}`);
    yield { agentId: turn.agentId, agentName: turn.agentName, status: 'done', message, to: turn.to };

    const readMs = Math.min(Math.max(message.split(' ').length * 40, 600), 1400);
    await delay(readMs);
  }

  const verdictMsg = await generateAgentMessage(
    'You are a product critique moderator. Write a 2-sentence final verdict on the product discussed. Be balanced. No preamble.',
    `Final verdict on: ${input}`
  );
  yield { agentId: 'moderator', agentName: '🤝 Moderator', status: 'done', message: verdictMsg };
  await delay(200);
  yield DONE_EVENT;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/group-chat.ts
git commit -m "feat: AI-generate group-chat turn messages via gpt-4o-mini"
```

---

## Task 7: Create medicine corpus

**Files:**
- Create: `src/lib/mock-data/rag-corpus.ts`

- [ ] **Step 1: Create `src/lib/mock-data/rag-corpus.ts`**

```typescript
export interface MedicineEntry {
  id: string;
  name: string;
  treats: string[];
  sideEffects: string;
  efficacy: string;
  dosage: string;
  gpFlag: boolean;
}

export const MEDICINE_CORPUS: MedicineEntry[] = [
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    treats: ['headache', 'fever', 'pain', 'cold', 'flu', 'sore throat', 'temperature', 'aches'],
    sideEffects: 'Rarely causes side effects at normal doses. Overdose can cause serious liver damage.',
    efficacy: 'Highly effective for mild to moderate pain and fever reduction. Works within 30-60 minutes.',
    dosage: '500mg–1000mg every 4–6 hours. Max 4000mg per day. Do not exceed 8 tablets (500mg) in 24 hours.',
    gpFlag: false,
  },
  {
    id: 'ibuprofen',
    name: 'Ibuprofen',
    treats: ['headache', 'fever', 'inflammation', 'muscle pain', 'period pain', 'toothache', 'back pain', 'arthritis', 'swelling'],
    sideEffects: 'Can cause stomach upset, nausea, or heartburn. Avoid on an empty stomach. Not suitable for people with kidney problems.',
    efficacy: 'Effective anti-inflammatory. Better than paracetamol for conditions with inflammation.',
    dosage: '200–400mg every 4–6 hours with food. Max 1200mg per day for self-treatment.',
    gpFlag: false,
  },
  {
    id: 'aspirin',
    name: 'Aspirin',
    treats: ['headache', 'fever', 'pain', 'cold', 'muscle aches'],
    sideEffects: 'Can irritate the stomach lining. Do not give to children under 16. Increases bleeding risk.',
    efficacy: 'Effective for pain and fever. Also has blood-thinning properties used in heart disease prevention.',
    dosage: '300–600mg every 4 hours. Max 3600mg per day. Always take with food.',
    gpFlag: false,
  },
  {
    id: 'loratadine',
    name: 'Loratadine',
    treats: ['hay fever', 'allergies', 'runny nose', 'sneezing', 'itchy eyes', 'hives', 'allergic rhinitis', 'watery eyes'],
    sideEffects: 'Non-drowsy formula. Rarely causes drowsiness, headache, or dry mouth.',
    efficacy: 'Effective 24-hour allergy relief. Non-sedating antihistamine.',
    dosage: '10mg once daily. One tablet per day is usually sufficient.',
    gpFlag: false,
  },
  {
    id: 'cetirizine',
    name: 'Cetirizine',
    treats: ['allergies', 'hay fever', 'itching', 'hives', 'urticaria', 'allergic rhinitis', 'sneezing', 'runny nose'],
    sideEffects: 'May cause drowsiness in some people. Avoid driving if affected. Also dry mouth.',
    efficacy: 'Fast-acting antihistamine. Effective within 1 hour, lasting 24 hours.',
    dosage: '10mg once daily, preferably in the evening due to possible drowsiness.',
    gpFlag: false,
  },
  {
    id: 'omeprazole',
    name: 'Omeprazole',
    treats: ['heartburn', 'acid reflux', 'indigestion', 'stomach ulcer', 'GERD', 'burning chest', 'acid regurgitation'],
    sideEffects: 'Generally well tolerated. Long-term use may affect magnesium levels and increase infection risk.',
    efficacy: 'Proton pump inhibitor. Very effective at reducing stomach acid production.',
    dosage: '20mg once daily before a meal. Can take up to 4 weeks for full effect.',
    gpFlag: false,
  },
  {
    id: 'pseudoephedrine',
    name: 'Pseudoephedrine',
    treats: ['nasal congestion', 'blocked nose', 'sinusitis', 'sinus pressure', 'stuffy nose', 'cold', 'flu'],
    sideEffects: 'Can raise blood pressure and heart rate. May cause insomnia, anxiety, or restlessness.',
    efficacy: 'Effective decongestant. Reduces nasal swelling within 30 minutes.',
    dosage: '60mg every 4–6 hours. Max 240mg per day. Do not use for more than 7 days.',
    gpFlag: false,
  },
  {
    id: 'loperamide',
    name: 'Loperamide',
    treats: ['diarrhoea', 'loose stools', 'stomach upset', 'travellers diarrhoea', 'IBS diarrhoea'],
    sideEffects: 'Can cause constipation, bloating, or abdominal cramps.',
    efficacy: 'Fast-acting anti-diarrhoeal. Slows gut movement to reduce stool frequency.',
    dosage: '4mg initially, then 2mg after each loose stool. Max 16mg per day. Do not use more than 2 days without GP advice.',
    gpFlag: false,
  },
  {
    id: 'dextromethorphan',
    name: 'Dextromethorphan',
    treats: ['dry cough', 'tickly cough', 'persistent cough', 'cough'],
    sideEffects: 'May cause dizziness, drowsiness, or nausea at high doses.',
    efficacy: 'Suppresses the cough reflex in the brain. Effective for dry, unproductive coughs.',
    dosage: '15–30mg every 4–8 hours. Max 120mg per day.',
    gpFlag: false,
  },
  {
    id: 'guaifenesin',
    name: 'Guaifenesin',
    treats: ['chest congestion', 'productive cough', 'phlegm', 'mucus', 'wet cough', 'chesty cough'],
    sideEffects: 'May cause nausea or vomiting. Drink plenty of water to help loosen mucus.',
    efficacy: 'Expectorant that thins mucus making it easier to cough up.',
    dosage: '200–400mg every 4 hours. Max 2400mg per day. Drink extra fluids.',
    gpFlag: false,
  },
  {
    id: 'hydrocortisone-cream',
    name: 'Hydrocortisone Cream (1%)',
    treats: ['skin rash', 'eczema', 'itching', 'dermatitis', 'insect bites', 'mild allergic skin reaction'],
    sideEffects: 'Thinning of skin with prolonged use. Do not apply to face or broken skin without GP advice.',
    efficacy: 'Mild topical corticosteroid. Reduces inflammation, redness, and itching effectively.',
    dosage: 'Apply thinly to affected area 1–2 times daily. Do not use for more than 7 days on the face or 1 month elsewhere.',
    gpFlag: false,
  },
  {
    id: 'clotrimazole',
    name: 'Clotrimazole',
    treats: ['thrush', 'vaginal thrush', 'fungal infection', 'athletes foot', 'ringworm', 'jock itch'],
    sideEffects: 'May cause mild burning or irritation on application. Rarely causes allergic reactions.',
    efficacy: 'Antifungal that kills fungi and yeasts. Highly effective for localised infections.',
    dosage: 'Apply cream 2–3 times daily. Continue for 2–4 weeks after symptoms clear.',
    gpFlag: false,
  },
  {
    id: 'melatonin',
    name: 'Melatonin',
    treats: ['insomnia', 'sleep problems', 'jet lag', 'difficulty sleeping', 'sleep disorder', 'cant sleep'],
    sideEffects: 'May cause drowsiness, dizziness, or headaches. Only take at bedtime.',
    efficacy: 'Helps regulate sleep-wake cycle. Most effective for jet lag and delayed sleep phase.',
    dosage: '1–3mg taken 30–60 minutes before bedtime. Start with the lowest dose.',
    gpFlag: false,
  },
  {
    id: 'chest-pain-gp',
    name: 'Chest Pain — See GP',
    treats: ['chest pain', 'chest tightness', 'chest pressure', 'heart pain', 'left arm pain with chest'],
    sideEffects: 'N/A — this is a GP escalation entry.',
    efficacy: 'N/A — chest pain requires professional assessment.',
    dosage: 'N/A',
    gpFlag: true,
  },
  {
    id: 'breathing-difficulty-gp',
    name: 'Breathing Difficulty — See GP',
    treats: ['difficulty breathing', 'shortness of breath', 'cant breathe', 'breathless', 'wheezing', 'tight chest'],
    sideEffects: 'N/A',
    efficacy: 'N/A',
    dosage: 'N/A',
    gpFlag: true,
  },
  {
    id: 'high-fever-gp',
    name: 'High Fever — See GP',
    treats: ['high fever', 'temperature above 39', 'fever in child', 'fever with rash', 'febrile convulsion', 'fever wont go down'],
    sideEffects: 'N/A',
    efficacy: 'N/A',
    dosage: 'N/A',
    gpFlag: true,
  },
  {
    id: 'severe-abdominal-gp',
    name: 'Severe Abdominal Pain — See GP',
    treats: ['severe stomach pain', 'severe abdominal pain', 'appendix', 'sudden stomach pain', 'abdominal cramps severe'],
    sideEffects: 'N/A',
    efficacy: 'N/A',
    dosage: 'N/A',
    gpFlag: true,
  },
  {
    id: 'blood-gp',
    name: 'Blood in Stool/Urine — See GP',
    treats: ['blood in stool', 'rectal bleeding', 'blood in urine', 'coughing blood', 'bleeding'],
    sideEffects: 'N/A',
    efficacy: 'N/A',
    dosage: 'N/A',
    gpFlag: true,
  },
];

export function retrieveMedicines(query: string, topK = 3): MedicineEntry[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const scored = MEDICINE_CORPUS.map(entry => {
    let score = 0;
    const nameLower = entry.name.toLowerCase();
    for (const token of tokens) {
      if (nameLower.includes(token)) score += 3;
      if (entry.treats.some(t => t.includes(token))) score += 1;
    }
    return { entry, score };
  });
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(s => s.entry);
}

export function detectMode(query: string): 'medicine' | 'symptom' {
  const medicineModeKeywords = ['what is', 'side effect', 'dosage', 'how many', 'efficacy', 'how does', 'what does', 'dose', 'pills', 'tablets', 'milligram', 'mg'];
  const lower = query.toLowerCase();
  return medicineModeKeywords.some(k => lower.includes(k)) ? 'medicine' : 'symptom';
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mock-data/rag-corpus.ts
git commit -m "feat: add medicine corpus with 18 entries and keyword retrieval helpers"
```

---

## Task 8: Create RAG agent

**Files:**
- Create: `src/lib/agents/rag.ts`

- [ ] **Step 1: Create `src/lib/agents/rag.ts`**

```typescript
import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { generateAgentMessage } from '../openai';
import { retrieveMedicines, detectMode, type MedicineEntry } from '../mock-data/rag-corpus';

export async function* runRagAgent(input: string): AsyncGenerator<AgentEvent> {
  // 1. Query Parser
  yield { agentId: 'query-parser', agentName: '🔍 Query Parser', status: 'thinking', message: 'Classifying query and extracting keywords…' };
  await delay(200);
  const mode = detectMode(input);
  const modeLabel = mode === 'medicine' ? 'medicine lookup' : 'symptom check';
  yield {
    agentId: 'query-parser',
    agentName: '🔍 Query Parser',
    status: 'done',
    message: `Mode: ${modeLabel} | Query: "${input.slice(0, 60)}${input.length > 60 ? '…' : ''}"`,
    to: 'retriever',
  };
  await delay(200);

  // 2. Retriever
  yield { agentId: 'retriever', agentName: '📚 Retriever', status: 'thinking', message: 'Searching medicine database…', to: 'query-parser' };
  const results: MedicineEntry[] = retrieveMedicines(input);
  await delay(300);

  if (results.length === 0) {
    yield {
      agentId: 'retriever',
      agentName: '📚 Retriever',
      status: 'done',
      message: 'No matching medicines found in database.',
    };
    yield { agentId: 'generator', agentName: '🤖 Generator', status: 'done', message: 'I could not find relevant information in the medicine database. Please consult a pharmacist or GP.' };
    yield DONE_EVENT;
    return;
  }

  const resultNames = results.map(r => r.name).join(', ');
  yield {
    agentId: 'retriever',
    agentName: '📚 Retriever',
    status: 'done',
    message: `Retrieved ${results.length} result(s): ${resultNames}`,
    to: 'reranker',
  };
  await delay(200);

  // 3. Reranker
  yield { agentId: 'reranker', agentName: '⚖️ Reranker', status: 'thinking', message: 'Scoring and selecting best matches…', to: 'retriever' };
  await delay(300);
  const hasGpFlag = results.some(r => r.gpFlag);
  const topResults = results.slice(0, 2);
  yield {
    agentId: 'reranker',
    agentName: '⚖️ Reranker',
    status: 'done',
    message: `Selected: ${topResults.map(r => r.name).join(', ')}${hasGpFlag ? ' ⚠️ GP escalation flagged' : ''}`,
    to: 'generator',
  };
  await delay(200);

  // 4. Generator
  yield { agentId: 'generator', agentName: '🤖 Generator', status: 'thinking', message: 'Generating answer from retrieved context…', to: 'reranker' };

  const context = topResults.map(r =>
    `Medicine: ${r.name}\nTreats: ${r.treats.join(', ')}\nEfficacy: ${r.efficacy}\nSide Effects: ${r.sideEffects}\nDosage: ${r.dosage}\ngpFlag: ${r.gpFlag}`
  ).join('\n\n');

  const systemPrompt = hasGpFlag
    ? 'You are a cautious pharmacy assistant. The user has symptoms that require medical attention. Strongly recommend they see a GP immediately. Do not recommend self-medication. End with: "Please see a GP or call 111 immediately."'
    : mode === 'medicine'
    ? 'You are a pharmacy assistant. Answer the user\'s question about the medicine using ONLY the provided data. Include efficacy, side effects, and dosage. Be concise (3–4 sentences). End with: "Consult a GP if symptoms persist or worsen."'
    : 'You are a pharmacy assistant. Based on the retrieved medicines, recommend the most suitable option for the user\'s symptoms. Mention dosage briefly. Be concise (3–4 sentences). End with: "Consult a GP if symptoms persist or worsen."';

  const answer = await generateAgentMessage(systemPrompt, `User query: ${input}\n\nMedicine data:\n${context}`);

  yield { agentId: 'generator', agentName: '🤖 Generator', status: 'done', message: answer };
  await delay(200);

  yield DONE_EVENT;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/agents/rag.ts
git commit -m "feat: add RAG medicine checker agent with 4-node pipeline"
```

---

## Task 9: Create RAG API route

**Files:**
- Create: `src/app/api/agents/rag/route.ts`

- [ ] **Step 1: Create `src/app/api/agents/rag/route.ts`**

```typescript
import { NextRequest } from 'next/server';
import { runRagAgent } from '@/lib/agents/rag';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runRagAgent(input as string)), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/agents/rag/route.ts
git commit -m "feat: add SSE API route for RAG medicine checker"
```

---

## Task 10: Create RAG page

**Files:**
- Create: `src/app/rag/page.tsx`

The layout follows the exact same pattern as `src/app/react-agent/page.tsx`: `PatternPage` wrapper, `useNodesState`/`useEdgesState`, `useAgentStream`, node status updates via `useEffect`.

- [ ] **Step 1: Create `src/app/rag/page.tsx`**

```typescript
'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'query-parser', type: 'agentNode', position: { x: 0, y: 80 }, data: { label: 'Query Parser', icon: '🔍', color: '#6366f1', status: 'idle' } },
  { id: 'retriever', type: 'agentNode', position: { x: 180, y: 80 }, data: { label: 'Retriever', icon: '📚', color: '#10b981', status: 'idle' } },
  { id: 'reranker', type: 'agentNode', position: { x: 360, y: 80 }, data: { label: 'Reranker', icon: '⚖️', color: '#f59e0b', status: 'idle' } },
  { id: 'generator', type: 'outputNode', position: { x: 540, y: 80 }, data: { label: 'Generator', icon: '🤖', status: 'idle' } },
];

const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'query-parser', target: 'retriever' },
  { id: 'e2', source: 'retriever', target: 'reranker' },
  { id: 'e3', source: 'reranker', target: 'generator' },
];

export default function RagPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/rag');

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
    if (event.status === 'done' && event.agentId === 'generator') {
      setOutput(event.message);
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
      title="💊 Medicine Checker (RAG)"
      description="Describe your symptoms or ask about a medicine — watch the RAG pipeline retrieve and generate an answer"
      onRun={handleRun}
      isRunning={isRunning}
      output={output}
      placeholder="I have a headache and mild fever — or — what are the side effects of ibuprofen?"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/rag/page.tsx
git commit -m "feat: add RAG medicine checker page with React Flow diagram"
```

---

## Task 11: Add RAG to sidebar navigation

**Files:**
- Modify: `src/components/sidebar/Sidebar.tsx`

Add `{ href: '/rag', label: 'Medicine Checker', icon: '💊', group: 'RAG' }` to the `NAV` array and render a new "RAG" group section.

- [ ] **Step 1: Update `src/components/sidebar/Sidebar.tsx`**

Replace the entire file:

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
  { href: '/rag', label: 'Medicine Checker', icon: '💊', group: 'RAG' },
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
  const rag = NAV.filter(n => n.group === 'RAG');
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
        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pt-4 pb-1">
          RAG
        </div>
        {rag.map(n => <NavItem key={n.href} {...n} />)}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and build**

```bash
pnpm tsc --noEmit && pnpm build
```

Expected: no TypeScript errors, successful build.

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/Sidebar.tsx
git commit -m "feat: add RAG / Medicine Checker entry to sidebar navigation"
```

---

## Final Verification

- [ ] **Run dev server and smoke test all 6 pages**

```bash
pnpm dev
```

Visit in browser:
1. `http://localhost:3000/react-agent` — type "5 day trip to Tokyo" — verify AI responses in each tool node
2. `http://localhost:3000/sequential` — type "AI regulation" — verify AI headlines from BBC/Reuters/AP
3. `http://localhost:3000/concurrent` — type "OpenAI" — verify parallel AI research nodes
4. `http://localhost:3000/supervisor` — type "task manager app" — verify AI specialist deliverables
5. `http://localhost:3000/group-chat` — type "new social media app" — verify AI turn messages
6. `http://localhost:3000/rag` — type "I have a headache and fever" — verify 4-node pipeline and AI answer
7. `http://localhost:3000/rag` — type "what are the side effects of ibuprofen" — verify medicine-mode answer
