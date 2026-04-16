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
