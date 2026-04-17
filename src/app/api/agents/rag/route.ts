import { NextRequest } from 'next/server';
import { runRagAgent } from '@/lib/agents/rag';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  if (typeof input !== 'string' || !input.trim()) {
    return new Response('Bad Request', { status: 400 });
  }
  return new Response(agentEventsToStream(runRagAgent(input as string)), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
