'use client';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AgentNode } from './nodes/AgentNode';
import { OutputNode } from './nodes/OutputNode';

const nodeTypes = { agentNode: AgentNode, outputNode: OutputNode };

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}

export function AgentDiagram({ nodes, edges, onNodesChange, onEdgesChange }: Props) {
  return (
    <ReactFlowProvider>
      <div className="w-full h-full rounded-xl overflow-hidden border border-zinc-800">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          nodesDraggable={false}
          fitView
          fitViewOptions={{ padding: 0.35 }}
          className="bg-zinc-950"
          defaultEdgeOptions={{
            style: { stroke: '#52525b', strokeWidth: 1.5 },
            animated: false,
          }}
        >
          <Background variant={BackgroundVariant.Dots} color="#27272a" gap={24} size={1} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
