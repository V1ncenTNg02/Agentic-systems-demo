import { NextRequest } from 'next/server';
import { runConcurrentAgent } from '@/lib/agents/concurrent';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runConcurrentAgent(input as string)), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
