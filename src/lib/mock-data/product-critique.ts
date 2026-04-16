export interface CritiqueTurn {
  agentId: 'moderator' | 'designer' | 'biz-analyst' | 'devils-advocate';
  agentName: string;
  message: string;
  to?: string;
}

export interface ProductArchetype {
  keyword: string;
  turns: CritiqueTurn[];
  verdict: string;
}

const ARCHETYPES: ProductArchetype[] = [
  {
    keyword: 'default',
    turns: [
      { agentId: 'moderator', agentName: '🤝 Moderator', message: "Let's evaluate this product idea. I'll ask each of you for your honest take. Designer, you're up first." },
      { agentId: 'designer', agentName: '🎨 Designer', message: "The concept has good bones. The core UX is intuitive — users can see value in under 30 seconds. But the onboarding has 6 steps before you reach the 'aha' moment. That's going to hurt activation rates. I'd cut it to 2 steps.", to: 'moderator' },
      { agentId: 'biz-analyst', agentName: '📊 Biz Analyst', message: "Market sizing looks real — I'd put the TAM at $8-12B based on comparable tools. The pricing model works if we target SMBs at $19/seat. But CAC could be brutal without a viral loop or self-serve motion. What's the acquisition strategy?", to: 'moderator' },
      { agentId: 'devils-advocate', agentName: "😈 Devil's Advocate", message: "Here's my challenge: three well-funded competitors already do 80% of this. What's the wedge? 'Better UX' isn't a moat — it's a 6-month head start before they copy it. I need to hear the defensible differentiation.", to: 'designer' },
      { agentId: 'designer', agentName: '🎨 Designer', message: "Fair. The differentiation isn't features, it's workflow integration. If we're embedded in Slack and Notion from day one, switching cost is real. Competitors are standalone apps — that's the gap.", to: 'devils-advocate' },
      { agentId: 'biz-analyst', agentName: '📊 Biz Analyst', message: "Integration strategy changes the acquisition math too — Slack App Directory gets you distribution for free. If 5% of installs convert to paid, that's a viable PLG motion. I'd prioritise the Slack integration over everything else.", to: 'designer' },
      { agentId: 'devils-advocate', agentName: "😈 Devil's Advocate", message: "I'll grant the integration angle. New concern: the AI features depend on OpenAI APIs, which means variable costs that scale with usage. At high volume, margins could compress badly. Have you modelled the unit economics at 10k MAU?", to: 'biz-analyst' },
      { agentId: 'moderator', agentName: '🤝 Moderator', message: "Strong debate. Let me synthesise: there's agreement on market opportunity and the Slack integration as the wedge. Open questions are unit economics at scale and onboarding conversion. Let's reach a verdict." },
      { agentId: 'designer', agentName: '🎨 Designer', message: "Proceed — but fix onboarding to 2 steps, and ship the Slack integration in v1, not later.", to: 'moderator' },
      { agentId: 'biz-analyst', agentName: '📊 Biz Analyst', message: "Agreed. Model the API cost ceiling before Series A — if margins compress below 60% gross, reprice or build your own inference layer.", to: 'moderator' },
      { agentId: 'devils-advocate', agentName: "😈 Devil's Advocate", message: "I'll vote proceed conditionally. The integration moat is real if you execute. But don't launch without a clear answer to the unit economics question — investors will ask.", to: 'moderator' },
    ],
    verdict: "VERDICT: Proceed with refinements. Ship Slack integration in v1 as the primary wedge. Reduce onboarding to 2 steps. Model API unit economics at 10k MAU before pricing v2. The differentiation story is credible if execution is tight.",
  },
];

export function getArchetype(_input: string): ProductArchetype {
  return ARCHETYPES[0];
}
