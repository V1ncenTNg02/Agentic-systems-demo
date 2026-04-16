export interface NewsTopic {
  slug: string;
  bbc: { headline: string; excerpt: string };
  reuters: { headline: string; excerpt: string };
  ap: { headline: string; excerpt: string };
  facts: string[];
  consensus: string;
  divergence: string;
  summary: string;
}

const TOPICS: Record<string, NewsTopic> = {
  'ai-regulation': {
    slug: 'ai-regulation',
    bbc: {
      headline: 'EU finalises landmark AI Act with strict rules for high-risk systems',
      excerpt: 'The European Union has passed the world\'s first comprehensive law governing artificial intelligence, placing strict obligations on developers of high-risk AI systems including biometric surveillance and critical infrastructure tools. Companies face fines of up to €35 million or 7% of global turnover for violations.',
    },
    reuters: {
      headline: 'European lawmakers pass sweeping AI regulation amid tech industry pushback',
      excerpt: 'The EU AI Act cleared its final legislative hurdle after months of contentious negotiations, with the text expanded to cover general-purpose AI models like GPT-4. Tech companies lobbied aggressively against the rules, arguing they would stifle innovation and shift AI development outside Europe.',
    },
    ap: {
      headline: 'What the EU\'s new AI law means for companies worldwide',
      excerpt: 'Any company offering AI products or services to EU citizens must comply with the new regulation, regardless of where they are headquartered — giving the rules a global reach similar to GDPR. The law introduces a tiered risk system, with the most stringent rules for AI in areas like medical devices, self-driving vehicles, and law enforcement.',
    },
    facts: [
      'The EU AI Act is the first comprehensive AI law passed by a major jurisdiction.',
      'High-risk AI systems face mandatory transparency, testing, and human oversight requirements.',
      'General-purpose AI models with over 10²⁵ FLOPs of compute face additional systemic risk obligations.',
      'Penalties reach €35M or 7% of global annual turnover for the most serious violations.',
    ],
    consensus: 'All three sources agree the EU AI Act sets a global precedent and will affect companies worldwide regardless of headquarters location.',
    divergence: 'BBC focuses on regulatory obligations; Reuters emphasises industry opposition; AP provides the most neutral technical breakdown of the tiered risk system.',
    summary: 'The EU has enacted the world\'s first comprehensive AI regulation, establishing a tiered risk framework that affects any company serving EU users. High-risk AI applications face mandatory testing and human oversight, while general-purpose models above a compute threshold face additional systemic risk obligations. Penalties of up to 7% of global turnover apply to the most serious violations, giving the rules an effective global reach.',
  },
  climate: {
    slug: 'climate',
    bbc: {
      headline: 'Global temperatures hit record highs for 12th consecutive month',
      excerpt: 'Scientists confirmed that the past 12 months have been the hottest on record globally, with average temperatures 1.5°C above pre-industrial levels for the first time over a sustained period. The Copernicus Climate Change Service attributed the trend to a combination of human-caused warming and the 2023–24 El Niño event.',
    },
    reuters: {
      headline: 'UN warns climate tipping points closer than previously thought',
      excerpt: 'A UN report released ahead of COP30 warned that several climate tipping points — including collapse of the West Antarctic Ice Sheet and dieback of the Amazon rainforest — could be triggered at temperatures lower than previously modelled. The findings increase pressure on governments to accelerate emissions cuts.',
    },
    ap: {
      headline: 'Extreme weather events cost $300bn in 2024, insurance data shows',
      excerpt: 'Global insured losses from extreme weather events reached $300 billion in 2024, the second-highest year on record, according to Munich Re. Floods, wildfires, and storms drove most losses, with developing nations disproportionately affected. Only 40% of total economic losses were covered by insurance.',
    },
    facts: [
      '2024 was the hottest 12-month period on record, with 1.5°C above pre-industrial levels sustained for the first time.',
      'Climate tipping points may be triggered at lower temperature thresholds than previously estimated.',
      'Insured extreme weather losses hit $300bn in 2024, second-highest on record.',
    ],
    consensus: 'All sources confirm accelerating climate impacts and increased urgency for mitigation action ahead of COP30.',
    divergence: 'BBC focuses on temperature records; Reuters on tipping point risk; AP on economic costs and insurance gaps.',
    summary: 'Global temperatures breached 1.5°C above pre-industrial levels for a sustained 12-month period in 2024, while new research suggests climate tipping points may be triggered earlier than projected. Economic losses from extreme weather reached $300bn, with only 40% covered by insurance — highlighting a widening protection gap particularly in developing nations.',
  },
  tech: {
    slug: 'tech',
    bbc: {
      headline: 'Apple unveils Vision Pro successor with lighter design and lower price',
      excerpt: 'Apple announced the second generation of its Vision Pro spatial computing headset at WWDC, featuring a 40% reduction in weight and a starting price of $2,499 — down from $3,499. The device includes a new M4 chip, improved passthrough cameras, and longer battery life, addressing the main criticisms of the original model.',
    },
    reuters: {
      headline: 'Tech giants race to deploy AI agents capable of autonomous multi-step tasks',
      excerpt: 'Google, Microsoft, and Anthropic all announced significant upgrades to their AI agent capabilities, with systems now able to browse the web, write and execute code, manage files, and coordinate with other AI systems to complete complex multi-step tasks with minimal human oversight.',
    },
    ap: {
      headline: 'Smartphone market recovers as AI features drive upgrade cycle',
      excerpt: 'Global smartphone shipments grew 8% year-over-year in Q1 2025, driven by a new AI-driven upgrade cycle. Consumers are replacing handsets to access on-device AI features including real-time translation, AI-powered photography, and voice assistants that can execute tasks across apps.',
    },
    facts: [
      'Apple Vision Pro 2 is 40% lighter and priced at $2,499, down $1,000 from the original.',
      'Major AI labs shipped autonomous agent systems capable of multi-step task execution in 2025.',
      'Smartphone market grew 8% YoY in Q1 2025, led by AI feature demand.',
    ],
    consensus: 'AI integration is driving the next hardware upgrade cycle across both spatial computing and smartphones.',
    divergence: 'Stories cover distinct product categories — AR headsets, AI agents, and smartphones — rather than disagreeing on shared facts.',
    summary: 'The consumer tech sector in 2025 is defined by AI integration: Apple\'s Vision Pro 2 reduces spatial computing barriers with a lighter design and lower price, while smartphone makers report an AI-driven upgrade cycle pushing 8% market growth. In the software layer, leading AI labs have deployed autonomous agent systems capable of multi-step task execution with minimal human oversight.',
  },
};

export function getNewsTopic(input: string): NewsTopic {
  const lower = input.toLowerCase();
  if (lower.includes('ai') || lower.includes('regulation') || lower.includes('eu')) return TOPICS['ai-regulation'];
  if (lower.includes('climate') || lower.includes('weather') || lower.includes('environment')) return TOPICS.climate;
  if (lower.includes('tech') || lower.includes('apple') || lower.includes('google') || lower.includes('smartphone')) return TOPICS.tech;
  return TOPICS['ai-regulation'];
}

export function formatDigest(topic: NewsTopic): string {
  return [
    '📋 NEWS DIGEST',
    '═══════════════════════════════',
    '',
    '📌 SUMMARY',
    topic.summary,
    '',
    '📊 KEY FACTS',
    ...topic.facts.map((f, i) => `   ${i + 1}. ${f}`),
    '',
    '✅ CONSENSUS',
    `   ${topic.consensus}`,
    '',
    '⚡ DIVERGENCE',
    `   ${topic.divergence}`,
    '',
    '📰 SOURCES',
    `   • BBC:     "${topic.bbc.headline}"`,
    `   • Reuters: "${topic.reuters.headline}"`,
    `   • AP:      "${topic.ap.headline}"`,
  ].join('\n');
}
