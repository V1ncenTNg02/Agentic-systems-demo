import { NextRequest } from 'next/server';
import { runSequentialAgent } from '@/lib/agents/sequential';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runSequentialAgent(input as string)), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
