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
