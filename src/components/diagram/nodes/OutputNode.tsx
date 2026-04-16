import { Handle, Position, type NodeProps } from 'reactflow';

export interface OutputNodeData {
  label: string;
  icon: string;
  status?: string;
  message?: string;
}

export function OutputNode({ data }: NodeProps<OutputNodeData>) {
  const done = data.status === 'done';
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#52525b' }} />
      <div
        className="rounded-xl border-2 bg-zinc-900 px-4 py-3 min-w-[130px] text-center shadow-xl transition-all duration-500"
        style={{ borderColor: done ? '#22c55e' : '#3f3f46' }}
      >
        <div className="text-2xl mb-1">{data.icon}</div>
        <div className="text-xs font-semibold text-zinc-200">{data.label}</div>
        {done && <div className="text-[9px] text-green-400 mt-1.5">✓ complete</div>}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#52525b' }} />
    </>
  );
}
