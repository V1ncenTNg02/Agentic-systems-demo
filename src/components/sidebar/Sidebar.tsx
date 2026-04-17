'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Home', icon: '🏠', group: 'none' },
  { href: '/react-agent', label: 'ReAct Agent', icon: '⚡', group: 'Single Agent' },
  { href: '/sequential', label: 'Sequential', icon: '→', group: 'Multi-Agent' },
  { href: '/concurrent', label: 'Concurrent', icon: '⫸', group: 'Multi-Agent' },
  { href: '/group-chat', label: 'Group Chat', icon: '💬', group: 'Multi-Agent' },
  { href: '/supervisor', label: 'Supervisor', icon: '👑', group: 'Multi-Agent' },
  { href: '/rag', label: 'Medicine Checker', icon: '💊', group: 'RAG' },
];

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        active ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

export function Sidebar() {
  const singleAgent = NAV.filter(n => n.group === 'Single Agent');
  const multiAgent = NAV.filter(n => n.group === 'Multi-Agent');
  const rag = NAV.filter(n => n.group === 'RAG');
  return (
    <div className="w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-screen">
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="text-sm font-semibold text-zinc-100">Agentic Demo</div>
        <div className="text-xs text-zinc-500 mt-0.5">Orchestration patterns</div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        <NavItem href="/" label="Home" icon="🏠" />
        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pt-4 pb-1">
          Single Agent
        </div>
        {singleAgent.map(n => <NavItem key={n.href} {...n} />)}
        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pt-4 pb-1">
          Multi-Agent
        </div>
        {multiAgent.map(n => <NavItem key={n.href} {...n} />)}
        <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pt-4 pb-1">
          RAG
        </div>
        {rag.map(n => <NavItem key={n.href} {...n} />)}
      </nav>
    </div>
  );
}
