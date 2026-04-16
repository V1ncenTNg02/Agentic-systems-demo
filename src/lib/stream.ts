import type { AgentEvent } from './types';

export const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export function agentEventsToStream(gen: AsyncGenerator<AgentEvent>): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for await (const event of gen) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.close();
    },
  });
}
