import { delay } from '../stream';
import { DONE_EVENT, type AgentEvent } from '../types';
import { getArchetype } from '../mock-data/product-critique';

export async function* runGroupChatAgent(input: string): AsyncGenerator<AgentEvent> {
  const arch = getArchetype(input);

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
