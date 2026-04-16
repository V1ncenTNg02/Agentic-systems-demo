'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'moderator', type: 'agentNode', position: { x: 180, y: 0 }, data: { label: 'Moderator', icon: '🤝', color: '#10b981', status: 'idle' } },
  { id: 'designer', type: 'agentNode', position: { x: 0, y: 170 }, data: { label: 'Designer', icon: '🎨', color: '#6366f1', status: 'idle' } },
  { id: 'biz-analyst', type: 'agentNode', position: { x: 360, y: 170 }, data: { label: 'Biz Analyst', icon: '📊', color: '#f59e0b', status: 'idle' } },
  { id: 'devils-advocate', type: 'agentNode', position: { x: 180, y: 340 }, data: { label: "Devil's Advocate", icon: '😈', color: '#ec4899', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'moderator', target: 'designer' },
  { id: 'e2', source: 'moderator', target: 'biz-analyst' },
  { id: 'e3', source: 'moderator', target: 'devils-advocate' },
  { id: 'e4', source: 'designer', target: 'biz-analyst' },
  { id: 'e5', source: 'designer', target: 'devils-advocate' },
  { id: 'e6', source: 'biz-analyst', target: 'devils-advocate' },
];

export default function GroupChatPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/group-chat');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    // Animate the edge between speaker and addressee
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e,
        animated: (e.source === event.agentId && e.target === event.to) || (e.source === event.to && e.target === event.agentId),
      })));
      setTimeout(() => setEdges(eds => eds.map(e => ({ ...e, animated: false }))), 1800);
    }
    // Append all done messages to output as a conversation transcript
    if (event.status === 'done' && event.agentId !== '__done__') {
      setOutput(prev => prev + (prev ? '\n\n' : '') + `[${event.agentName}]\n${event.message}`);
    }
  }, [events]);

  return (
    <PatternPage
      title="💬 Group Chat"
      description="Product Design Critique — agents debate your idea and converge on a recommendation"
      onRun={input => { setOutput(''); setNodes(makeNodes()); setEdges(makeEdges()); run(input); }}
      isRunning={isRunning}
      output={output}
      placeholder="An AI-powered meal planner that generates weekly grocery lists"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
