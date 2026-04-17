import Link from 'next/link';

const PATTERNS = [
  {
    href: '/react-agent',
    icon: '⚡',
    name: 'ReAct / Tool-Calling Agent',
    category: 'Single Agent',
    useCase: 'Travel Planner',
    description: 'One agent reasons, picks tools, acts, and loops until done.',
    color: 'border-indigo-500/30 hover:border-indigo-500/70',
    badge: 'bg-indigo-500/10 text-indigo-400',
  },
  {
    href: '/sequential',
    icon: '→',
    name: 'Sequential Pipeline',
    category: 'Multi-Agent',
    useCase: 'News Digest',
    description: 'Agents run one after another — each passes its output to the next.',
    color: 'border-amber-500/30 hover:border-amber-500/70',
    badge: 'bg-amber-500/10 text-amber-400',
  },
  {
    href: '/concurrent',
    icon: '⫸',
    name: 'Concurrent Agents',
    category: 'Multi-Agent',
    useCase: 'Market Research',
    description: 'Multiple agents fan out simultaneously, results merged at the end.',
    color: 'border-pink-500/30 hover:border-pink-500/70',
    badge: 'bg-pink-500/10 text-pink-400',
  },
  {
    href: '/group-chat',
    icon: '💬',
    name: 'Group Chat',
    category: 'Multi-Agent',
    useCase: 'Product Critique',
    description: 'Agents talk to each other freely — debate, challenge, converge.',
    color: 'border-green-500/30 hover:border-green-500/70',
    badge: 'bg-green-500/10 text-green-400',
  },
  {
    href: '/supervisor',
    icon: '👑',
    name: 'Supervisor + Sub-agents',
    category: 'Multi-Agent',
    useCase: 'Software Builder',
    description: 'A master agent plans and delegates to specialist sub-agents.',
    color: 'border-yellow-500/30 hover:border-yellow-500/70',
    badge: 'bg-yellow-500/10 text-yellow-400',
  },
];

export default function HomePage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Agentic Systems Demo</h1>
        <p className="text-zinc-400 text-base mb-10">
          Explore 5 orchestration patterns that define how AI agents work together.
          Each demo is interactive — type a prompt and watch agents collaborate in real time.
        </p>
        <div className="grid gap-4">
          {PATTERNS.map(p => (
            <Link
              key={p.href}
              href={p.href}
              className={`group block border rounded-xl p-5 bg-zinc-900 transition-all duration-200 ${p.color}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-zinc-100">{p.name}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${p.badge}`}>
                        {p.category}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">{p.description}</div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Use case</div>
                  <div className="text-xs font-medium text-zinc-300">{p.useCase}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

