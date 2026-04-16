'use client';
import { useState, useCallback } from 'react';
import type { AgentEvent } from './types';

export function useAgentStream(apiPath: string) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const run = useCallback(async (input: string) => {
    setEvents([]);
    setIsRunning(true);
    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const event: AgentEvent = JSON.parse(part.slice(6));
          if (event.agentId === '__done__') { setIsRunning(false); return; }
          setEvents(prev => [...prev, event]);
        }
      }
    } finally {
      setIsRunning(false);
    }
  }, [apiPath]);

  return { events, isRunning, run };
}
