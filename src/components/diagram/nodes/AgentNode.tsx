import { Handle, Position, type NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import type { AgentStatus } from '@/lib/types';

export interface AgentNodeData {
  label: string;
  icon: string;
  color: string;
  status?: AgentStatus;
  message?: string;
}

export function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const thinking = data.status === 'thinking';
  const done = data.status === 'done';
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ background: '#52525b' }} />
      <motion.div
        className="rounded-xl border-2 bg-zinc-900 px-4 py-3 min-w-[110px] max-w-[160px] text-center shadow-xl"
        style={{ borderColor: data.color }}
        animate={thinking ? {
          boxShadow: [
            `0 0 0px 0px ${data.color}00`,
            `0 0 14px 4px ${data.color}55`,
            `0 0 0px 0px ${data.color}00`,
          ],
        } : { boxShadow: 'none' }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="text-2xl mb-1">{data.icon}</div>
        <div className="text-xs font-semibold text-zinc-200 leading-tight">{data.label}</div>
        {thinking && (
          <div className="text-[9px] text-zinc-500 mt-1.5 animate-pulse">thinking…</div>
        )}
        {done && (
          <div className="text-[9px] text-green-400 mt-1.5">✓ done</div>
        )}
        {data.message && (
          <div className="text-[9px] text-zinc-400 mt-1.5 break-words text-left leading-relaxed">
            {data.message.length > 70 ? data.message.slice(0, 70) + '…' : data.message}
          </div>
        )}
      </motion.div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#52525b' }} />
    </>
  );
}
