# Design: OpenAI Integration + Medicine Checker RAG Demo

**Date:** 2026-04-17  
**Status:** Approved

---

## Overview

Two features:

1. **OpenAI Integration (Plan C)** — Replace hardcoded message strings in all 5 existing agent patterns with real `gpt-4o-mini` responses. Agent topology, routing, status transitions, and SSE event format are unchanged.
2. **Medicine Checker RAG Demo** — New sidebar section visualizing a 5-node RAG pipeline for medicine/symptom queries, backed by a hardcoded medicine corpus and `gpt-4o-mini` generation.

**Secret required:** `OPENAI_API_KEY` in `.env.local`

---

## Part 1 — OpenAI Integration

### Shared Client

**New file:** `src/lib/openai.ts`

- Lazy-initializes `OpenAI` client from `process.env.OPENAI_API_KEY`
- Exports one helper:
  ```ts
  generateAgentMessage(system: string, user: string): Promise<string>
  ```
- Uses model `gpt-4o-mini`
- Max tokens: 150 (keeps output short and demo-friendly)

### Changes to Agent Files

All 5 agent files (`react-agent.ts`, `sequential.ts`, `concurrent.ts`, `supervisor.ts`, `group-chat.ts`) are updated:

- Import `generateAgentMessage` from `@/lib/openai`
- Replace hardcoded `message` string literals in `thinking` and `done` yield events with `await generateAgentMessage(systemPrompt, contextPrompt)`
- `passing` events (routing/delegation) keep hardcoded messages — they describe topology, not content
- `DONE_EVENT` sentinel unchanged
- `await delay(...)` calls removed where they preceded a `thinking` event (LLM latency replaces the fake delay); kept on `passing` events for visual clarity

### Per-Agent System Prompts

Each agent gets a terse role-scoped system prompt. Examples:

| Agent | System Prompt |
|---|---|
| ReAct main | "You are a travel planner. Given a destination, produce a 2-sentence itinerary plan." |
| ReAct flight tool | "You are a flight search tool. Return 2 flight options with airline, price and duration in 2 sentences." |
| Sequential BBC source | "You are a BBC news analyst. Summarize the given topic in 2 sentences from BBC's perspective." |
| Concurrent sentiment | "You are a market sentiment analyst. Rate sentiment and give 1 key insight in 2 sentences." |
| Supervisor main | "You are a software architect. Given an app idea, write a 2-sentence delegation plan." |
| Group Chat designer | "You are a UX designer in a product critique. Give your 2-sentence critique of the product." |

All prompts enforce: max 2-3 sentences, no preamble, direct output only.

### Input Passing

Each agent's existing `input` string (the user's query) is passed as the `user` argument to `generateAgentMessage`. The tool/role context is encoded in `system`.

### Error Handling

If the OpenAI call fails, yield a fallback event with `message: "Error generating response"` and continue the stream. Do not crash the SSE route.

---

## Part 2 — Medicine Checker RAG Demo

### Corpus

**New file:** `src/lib/mock-data/rag-corpus.ts`

~20 hardcoded medicine entries:

```ts
interface MedicineEntry {
  id: string;
  name: string;          // "Ibuprofen"
  treats: string[];      // ["headache", "fever", "inflammation", "pain"]
  sideEffects: string;   // prose description
  efficacy: string;      // prose description  
  dosage: string;        // "200-400mg every 4-6 hours, max 1200mg/day"
  gpFlag: boolean;       // true = these symptoms need a doctor
}
```

Medicines covered: Paracetamol, Ibuprofen, Aspirin, Loratadine (antihistamine), Cetirizine, Omeprazole (antacid), Ranitidine, Pseudoephedrine (decongestant), Loperamide (diarrhoea), Bismuth subsalicylate, Hydrocortisone cream, Clotrimazole (antifungal), Dextromethorphan (cough), Guaifenesin (expectorant), Melatonin (sleep).

`gpFlag: true` entries for: chest pain, difficulty breathing, severe abdominal pain, persistent high fever, blood in stool/urine.

### Retrieval Strategy

Keyword overlap scoring — no embeddings API, zero extra cost:

1. Lowercase and tokenize query
2. For each `MedicineEntry`, score = count of query tokens found in `name` + `treats[]`
3. Sort descending, return top 3

### Agent Pipeline

**New file:** `src/lib/agents/rag.ts`  
Async generator, same `AgentEvent` interface as other patterns.

**5 nodes:**

| Node | agentId | Role |
|---|---|---|
| Query Parser | `query-parser` | Classifies query mode, extracts keywords |
| Retriever | `retriever` | Keyword match, returns top-3 entries |
| Reranker | `reranker` | Scores and selects best 1-3 results |
| Generator | `generator` | OpenAI call with retrieved context |
| Answer | `answer` | Displays final response |

**Two query modes (auto-detected by Query Parser via OpenAI):**

- **Symptom mode** — "I have a headache and sore throat" → retrieve medicines that treat those symptoms → Generator recommends top options or escalates to GP
- **Medicine mode** — "what are the side effects of ibuprofen" → retrieve that medicine's entry → Generator returns efficacy/side effects/dosage

**Generator system prompt:**
```
You are a pharmacy assistant. Answer using ONLY the provided medicine data.
Be concise (3-5 sentences). Always end with: "Consult a GP if symptoms persist or worsen."
Never diagnose. Never recommend prescription medicines.
```

**GP escalation:** If any retrieved entry has `gpFlag: true` matching the symptoms, Generator is instructed to recommend seeing a GP instead of self-medicating.

### New Files

| File | Purpose |
|---|---|
| `src/lib/mock-data/rag-corpus.ts` | 20 medicine entries |
| `src/lib/agents/rag.ts` | 5-node async generator |
| `src/app/api/agents/rag/route.ts` | SSE route (POST) |
| `src/app/rag/page.tsx` | Page with React Flow diagram + chat input |

### UI

- Sidebar entry: "RAG System" linking to `/rag`
- Input: free-text query box (describe symptoms or ask about a medicine)
- Diagram: 5 nodes left-to-right, edges animate on `passing` events
- Retrieved chunks displayed as small cards between Retriever and Generator nodes
- Final answer rendered below the diagram

---

## Data Flow Summary

```
POST /api/agents/rag { input: "I have a headache and fever" }
  → rag.ts async generator
    → yield: query-parser thinking → done (mode: symptom, keywords: ["headache","fever"])
    → yield: retriever thinking → done (top 3 matches: paracetamol, ibuprofen, aspirin)
    → yield: reranker thinking → done (selected: paracetamol, ibuprofen)
    → yield: generator thinking → [OpenAI call with context] → done (answer text)
  → agentEventsToStream() → SSE
  → useAgentStream() on client → React state → diagram + answer
```

---

## Constraints

- No real database, no vector store, no uploads — all data is hardcoded
- No prescription medicines recommended
- All files kept under ~250 lines per project convention
- Model: `gpt-4o-mini` throughout
- `.env.local` not committed to git (add to `.gitignore` if not already present)
