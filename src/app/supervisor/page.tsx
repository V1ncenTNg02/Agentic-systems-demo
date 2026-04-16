'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'supervisor', type: 'agentNode', position: { x: 210, y: 0 }, data: { label: 'Supervisor', icon: '👑', color: '#f59e0b', status: 'idle' } },
  { id: 'frontend-agent', type: 'agentNode', position: { x: 0, y: 170 }, data: { label: 'Frontend', icon: '🖥️', color: '#6366f1', status: 'idle' } },
  { id: 'backend-agent', type: 'agentNode', position: { x: 140, y: 170 }, data: { label: 'Backend', icon: '⚙️', color: '#10b981', status: 'idle' } },
  { id: 'database-agent', type: 'agentNode', position: { x: 280, y: 170 }, data: { label: 'Database', icon: '🗄️', color: '#f59e0b', status: 'idle' } },
  { id: 'infra-agent', type: 'agentNode', position: { x: 420, y: 170 }, data: { label: 'Infra', icon: '☁️', color: '#ec4899', status: 'idle' } },
  { id: 'build-summary', type: 'outputNode', position: { x: 210, y: 340 }, data: { label: 'Build Summary', icon: '✅', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'supervisor', target: 'frontend-agent' },
  { id: 'e2', source: 'supervisor', target: 'backend-agent' },
  { id: 'e3', source: 'supervisor', target: 'database-agent' },
  { id: 'e4', source: 'supervisor', target: 'infra-agent' },
  { id: 'e5', source: 'frontend-agent', target: 'build-summary' },
  { id: 'e6', source: 'backend-agent', target: 'build-summary' },
  { id: 'e7', source: 'database-agent', target: 'build-summary' },
  { id: 'e8', source: 'infra-agent', target: 'build-summary' },
];

export default function SupervisorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/supervisor');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e,
        animated: e.source === event.agentId && e.target === event.to,
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
      title="👑 Supervisor + Sub-agents"
      description="Software Builder — describe an app and watch the supervisor coordinate specialist agents"
      onRun={input => { setOutput(''); setNodes(makeNodes()); setEdges(makeEdges()); run(input); }}
      isRunning={isRunning}
      output={output}
      placeholder="Build a task management app with user auth, team collaboration, and real-time updates"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
