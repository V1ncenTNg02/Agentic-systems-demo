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
