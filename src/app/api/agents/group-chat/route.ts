import { NextRequest } from 'next/server';
import { runGroupChatAgent } from '@/lib/agents/group-chat';
import { agentEventsToStream } from '@/lib/stream';

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  return new Response(agentEventsToStream(runGroupChatAgent(input as string)), {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
