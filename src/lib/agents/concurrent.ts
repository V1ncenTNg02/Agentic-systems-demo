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
