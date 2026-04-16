'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'dispatcher', type: 'agentNode', position: { x: 200, y: 0 }, data: { label: 'Dispatcher', icon: '🎯', color: '#6366f1', status: 'idle' } },
  { id: 'competitor-agent', type: 'agentNode', position: { x: 0, y: 160 }, data: { label: 'Competitor', icon: '🏆', color: '#6366f1', status: 'idle' } },
  { id: 'financial-agent', type: 'agentNode', position: { x: 140, y: 160 }, data: { label: 'Financial', icon: '💰', color: '#10b981', status: 'idle' } },
  { id: 'sentiment-agent', type: 'agentNode', position: { x: 280, y: 160 }, data: { label: 'Sentiment', icon: '💬', color: '#f59e0b', status: 'idle' } },
  { id: 'trends-agent', type: 'agentNode', position: { x: 420, y: 160 }, data: { label: 'Trends', icon: '📈', color: '#ec4899', status: 'idle' } },
  { id: 'aggregator', type: 'outputNode', position: { x: 200, y: 320 }, data: { label: 'Aggregator', icon: '📊', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'dispatcher', target: 'competitor-agent' },
  { id: 'e2', source: 'dispatcher', target: 'financial-agent' },
  { id: 'e3', source: 'dispatcher', target: 'sentiment-agent' },
  { id: 'e4', source: 'dispatcher', target: 'trends-agent' },
  { id: 'e5', source: 'competitor-agent', target: 'aggregator' },
  { id: 'e6', source: 'financial-agent', target: 'aggregator' },
  { id: 'e7', source: 'sentiment-agent', target: 'aggregator' },
  { id: 'e8', source: 'trends-agent', target: 'aggregator' },
];

export default function ConcurrentPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/concurrent');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e, animated: e.source === event.agentId && e.target === event.to,
      })));
      setTimeout(() => setEdges(eds => eds.map(e => ({ ...e, animated: false }))), 1200);
    }
    if (event.status === 'done' && event.agentId !== '__done__') {
      setOutput(prev => prev + (prev ? '\n\n' : '') + event.message);
    }
  }, [events]);

  return (
    <PatternPage
      title="⫸ Concurrent Agents"
      description="Market Research — 4 agents run simultaneously, results merged into one report"
      onRun={input => { setOutput(''); setNodes(makeNodes()); setEdges(makeEdges()); run(input); }}
      isRunning={isRunning}
      output={output}
      placeholder="OpenAI"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
