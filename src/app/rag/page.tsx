'use client';
import { useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from 'reactflow';
import { useAgentStream } from '@/lib/use-agent-stream';
import { AgentDiagram } from '@/components/diagram/AgentDiagram';
import { PatternPage } from '@/components/patterns/PatternPage';

const makeNodes = (): Node[] => [
  { id: 'query-parser', type: 'agentNode', position: { x: 0, y: 80 }, data: { label: 'Query Parser', icon: '🔍', color: '#6366f1', status: 'idle' } },
  { id: 'retriever', type: 'agentNode', position: { x: 180, y: 80 }, data: { label: 'Retriever', icon: '📚', color: '#10b981', status: 'idle' } },
  { id: 'reranker', type: 'agentNode', position: { x: 360, y: 80 }, data: { label: 'Reranker', icon: '⚖️', color: '#f59e0b', status: 'idle' } },
  { id: 'generator', type: 'outputNode', position: { x: 540, y: 80 }, data: { label: 'Generator', icon: '🤖', status: 'idle' } },
];

const makeEdges = (): Edge[] => [
  { id: 'e1', source: 'query-parser', target: 'retriever' },
  { id: 'e2', source: 'retriever', target: 'reranker' },
  { id: 'e3', source: 'reranker', target: 'generator' },
];

export default function RagPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(makeEdges());
  const [output, setOutput] = useState('');
  const { events, isRunning, run } = useAgentStream('/api/agents/rag');

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
    if (event.status === 'done' && event.agentId === 'generator') {
      setOutput(event.message);
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
      title="💊 Medicine Checker (RAG)"
      description="Describe your symptoms or ask about a medicine — watch the RAG pipeline retrieve and generate an answer"
      onRun={handleRun}
      isRunning={isRunning}
      output={output}
      placeholder="I have a headache and mild fever — or — what are the side effects of ibuprofen?"
    >
      <AgentDiagram nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} />
    </PatternPage>
  );
}
