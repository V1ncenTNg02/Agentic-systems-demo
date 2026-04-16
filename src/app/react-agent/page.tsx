'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'react-agent', type: 'agentNode', position: { x: 200, y: 0 }, data: { label: 'ReAct Agent', icon: '🧠', color: '#6366f1', status: 'idle' } },
  { id: 'flights-tool', type: 'agentNode', position: { x: 0, y: 170 }, data: { label: 'Flights', icon: '✈', color: '#10b981', status: 'idle' } },
  { id: 'hotels-tool', type: 'agentNode', position: { x: 140, y: 170 }, data: { label: 'Hotels', icon: '🏨', color: '#f59e0b', status: 'idle' } },
  { id: 'food-tool', type: 'agentNode', position: { x: 280, y: 170 }, data: { label: 'Food', icon: '🍜', color: '#ec4899', status: 'idle' } },
  { id: 'activities-tool', type: 'agentNode', position: { x: 420, y: 170 }, data: { label: 'Activities', icon: '🎌', color: '#8b5cf6', status: 'idle' } },
  { id: 'final-plan', type: 'outputNode', position: { x: 200, y: 340 }, data: { label: 'Final Itinerary', icon: '📋', status: 'idle' } },
];
const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'react-agent', target: 'flights-tool' },
  { id: 'e2', source: 'react-agent', target: 'hotels-tool' },
  { id: 'e3', source: 'react-agent', target: 'food-tool' },
  { id: 'e4', source: 'react-agent', target: 'activities-tool' },
  { id: 'e5', source: 'flights-tool', target: 'final-plan' },
  { id: 'e6', source: 'hotels-tool', target: 'final-plan' },
  { id: 'e7', source: 'food-tool', target: 'final-plan' },
  { id: 'e8', source: 'activities-tool', target: 'final-plan' },
];

export default function ReactAgentPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/react');

  useEffect(() => {
    const event = events[events.length - 1];
    if (!event) return;
    setNodes(nds => nds.map(n =>
      n.id === event.agentId ? { ...n, data: { ...n.data, status: event.status, message: event.message } } : n
    ));
    if (event.to) {
      setEdges(eds => eds.map(e => ({
        ...e,
        animated: (e.source === event.agentId && e.target === event.to) ||
                  (e.source === event.to && e.target === event.agentId),
        style: { stroke: (e.source === event.agentId && e.target === event.to) ? '#6366f1' : '#52525b', strokeWidth: 1.5 },
      })));
      setTimeout(() => setEdges(eds => eds.map(e => ({ ...e, animated: false, style: { stroke: '#52525b', strokeWidth: 1.5 } }))), 1500);
    }
    if (event.status === 'done' && event.agentId !== '__done__') {
      setOutput(prev => prev + (prev ? '\n\n' : '') + event.message);
    }
  }, [events]);

  function handleRun(input: string) {
    setOutput('');
    setNodes(makeNodes());
    setEdges(makeEdges());
    run(input);
  }

  return (
    <PatternPage
      title="⚡ ReAct / Tool-Calling Agent"
      description="Travel Planner — watch the agent reason, pick tools, and build your itinerary"
      onRun={handleRun}
      isRunning={isRunning}
      output={output}
      placeholder="Plan me a 5-day trip to Tokyo in April for 2 people, budget $3000"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
