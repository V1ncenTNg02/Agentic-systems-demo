'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'bbc-source', type: 'agentNode', position: { x: 0, y: 0 }, data: { label: 'BBC', icon: '📰', color: '#6366f1', status: 'idle' } },
  { id: 'reuters-source', type: 'agentNode', position: { x: 0, y: 110 }, data: { label: 'Reuters', icon: '📰', color: '#6366f1', status: 'idle' } },
  { id: 'ap-source', type: 'agentNode', position: { x: 0, y: 220 }, data: { label: 'AP', icon: '📰', color: '#6366f1', status: 'idle' } },
  { id: 'analyzer', type: 'agentNode', position: { x: 240, y: 110 }, data: { label: 'Analyzer', icon: '🔍', color: '#f59e0b', status: 'idle' } },
  { id: 'writer', type: 'outputNode', position: { x: 460, y: 110 }, data: { label: 'Writer', icon: '✍️', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'bbc-source', target: 'analyzer' },
  { id: 'e2', source: 'reuters-source', target: 'analyzer' },
  { id: 'e3', source: 'ap-source', target: 'analyzer' },
  { id: 'e4', source: 'analyzer', target: 'writer' },
];

export default function SequentialPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/sequential');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e, animated: e.source === event.agentId && e.target === event.to,
        style: { stroke: (e.source === event.agentId && e.target === event.to) ? '#f59e0b' : '#52525b', strokeWidth: 1.5 },
      })));
      setTimeout(() => setEdges(eds => eds.map(e => ({ ...e, animated: false, style: { stroke: '#52525b', strokeWidth: 1.5 } }))), 1500);
    }
    if (event.status === 'done' && event.agentId !== '__done__') {
      setOutput(prev => prev + (prev ? '\n\n' : '') + event.message);
    }
  }, [events]);

  return (
    <PatternPage
      title="→ Sequential Pipeline"
      description="News Digest — three sources analyzed and distilled into one neutral summary"
      onRun={input => { setOutput(''); setNodes(makeNodes()); setEdges(makeEdges()); run(input); }}
      isRunning={isRunning}
      output={output}
      placeholder="AI regulation in the EU"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
