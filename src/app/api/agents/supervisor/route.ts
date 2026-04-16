import { NextRequest } from 'next/server';
import { runSupervisorAgent } from '@/lib/agents/supervisor';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runSupervisorAgent(input as string)), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
