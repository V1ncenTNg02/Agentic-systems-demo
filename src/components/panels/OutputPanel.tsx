interface Props { output: string }

export function OutputPanel({ output }: Props) {
  return (
    <div className="flex-1 flex flex-col p-4 min-h-0">
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
        Output
      </div>
      <div className="flex-1 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-[11px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
        {output || <span className="text-zinc-600">Output will appear here…</span>}
      </div>
    </div>
  );
}
