import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { generateAgentMessage } from '../openai';
import { getArchetype } from '../mock-data/product-critique';

const ROLE_PROMPTS: Record<string, string> = {
  moderator: 'You are a product critique moderator. Open the discussion or summarise a point in 2 sentences. Stay neutral. No preamble.',
  designer: 'You are a UX designer in a product critique. Give a 2-sentence design opinion on the product. Be specific. No preamble.',
  'biz-analyst': 'You are a business analyst in a product critique. Give a 2-sentence business or market opinion. Be specific. No preamble.',
  'devils-advocate': 'You are a devil\'s advocate in a product critique. Challenge the previous point with a 2-sentence counter-argument. No preamble.',
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
