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
