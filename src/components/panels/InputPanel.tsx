'use client';
import { useState } from 'react';

interface Props {
  placeholder: string;
  onRun: (input: string) => void;
  isRunning: boolean;
}

export function InputPanel({ placeholder, onRun, isRunning }: Props) {
  const [value, setValue] = useState('');
  return (
    <div className="p-4 border-b border-zinc-800 flex-shrink-0">
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
        Input
      </div>
      <textarea
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
        rows={5}
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={isRunning}
      />
      <button
        onClick={() => value.trim() && onRun(value.trim())}
        disabled={isRunning || !value.trim()}
        className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
      >
        {isRunning ? '⏳ Running…' : 'Run →'}
      </button>
    </div>
  );
}
