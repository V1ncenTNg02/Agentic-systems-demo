import type { ReactNode } from 'react';
import { InputPanel } from '../panels/InputPanel';
import { OutputPanel } from '../panels/OutputPanel';

interface Props {
  title: string;
  description: string;
  onRun: (input: string) => void;
  isRunning: boolean;
  output: string;
  placeholder: string;
  children: ReactNode;
}

export function PatternPage({ title, description, onRun, isRunning, output, placeholder, children }: Props) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-zinc-800 flex-shrink-0">
        <h1 className="text-base font-semibold text-zinc-100">{title}</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[300px] flex-shrink-0 border-r border-zinc-800 flex flex-col">
          <InputPanel placeholder={placeholder} onRun={onRun} isRunning={isRunning} />
          <OutputPanel output={output} />
        </div>
        <div className="flex-1 p-4 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
