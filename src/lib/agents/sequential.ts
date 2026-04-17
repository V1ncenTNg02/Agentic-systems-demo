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
