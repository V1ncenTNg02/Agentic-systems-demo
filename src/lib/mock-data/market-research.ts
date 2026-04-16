export interface CompanyResearch {
  name: string;
  competitor: string;
  financial: string;
  sentiment: string;
  trends: string;
  summary: string;
}

const COMPANIES: Record<string, CompanyResearch> = {
  openai: {
    name: 'OpenAI',
    competitor: 'Primary competitors: Anthropic (Claude), Google DeepMind (Gemini), Meta AI (LLaMA), Mistral AI. OpenAI holds ~60% of the enterprise LLM API market by revenue but faces rapid share erosion from open-source alternatives. Anthropic growing fastest in safety-focused enterprise segments.',
    financial: 'Revenue: ~$3.4B ARR (2024). Valuation: $157B (Oct 2024 funding round). Operating at a loss due to compute costs. ChatGPT Plus subscribers: ~15M. Enterprise contracts growing 300% YoY. Projected $11.6B revenue by 2025.',
    sentiment: 'Developer sentiment: strongly positive for API capabilities, mixed on pricing. Enterprise: cautious optimism around GPT-4o. Public sentiment impacted by leadership turmoil in 2023 but largely recovered. Safety community: divided — some praise RLHF efforts, others criticise pace of deployment.',
    trends: 'Key trends: (1) Shift from chat to agentic AI — GPT agents and Operator product lines. (2) Multimodal expansion — voice, image, video. (3) On-device / edge model push with GPT-4o mini. (4) Enterprise vertical specialisation — legal, medical, coding. (5) OpenAI hardware ambitions (chip development reports).',
    summary: 'OpenAI leads the commercial LLM market with ~$3.4B ARR and dominant API market share, but faces intensifying competition from Anthropic and open-source models. The company is pivoting from a pure model provider to an agentic AI platform, with "Operator" representing its most ambitious product expansion. Financial sustainability remains a challenge at current compute costs.',
  },
  tesla: {
    name: 'Tesla',
    competitor: 'EV competitors: BYD (overtook Tesla in global EV sales in 2023), GM Ultium, Ford Lightning, Rivian, Lucid. In autonomous driving: Waymo (robotaxi ops), Cruise (paused), Mobileye. Chinese market increasingly dominated by domestic brands (BYD, NIO, Li Auto) at lower price points.',
    financial: 'Revenue: $97.7B (2023). Net income: $15B (2023, down 23% YoY). Vehicle deliveries: 1.81M (2023). Gross margin compressed to 17.6% from 25.6% due to price cuts. Energy generation and storage segment grew 54% YoY — increasingly important revenue diversifier. Cybertruck ramp ongoing.',
    sentiment: 'Consumer sentiment: polarised. Brand loyalty among existing owners remains high; new buyer consideration declined as competition intensified. Investor sentiment: cautious — margin pressure and CEO attention split between Tesla and other ventures. Autopilot/FSD perception mixed following NHTSA investigations.',
    trends: '(1) Full Self-Driving v12 end-to-end neural net approach gaining traction in demos. (2) Robotaxi network planned for 2024 launch — potential major revenue shift. (3) Optimus humanoid robot manufacturing expansion. (4) Energy storage (Megapack) becoming standalone business. (5) Price war with BYD forcing margin trade-offs.',
    summary: 'Tesla maintains its position as the Western EV market leader but faces structural margin pressure from an intensifying price war, particularly with BYD in global markets. The company\'s long-term thesis increasingly rests on FSD monetisation and robotaxi deployment rather than vehicle sales alone. The energy segment is emerging as a high-margin growth engine that receives less analyst attention than it deserves.',
  },
  apple: {
    name: 'Apple',
    competitor: 'Smartphone: Samsung (Android flagship), Google Pixel. PC: Microsoft Surface, Dell, HP (Windows), Lenovo ThinkPad. Services: Spotify (music), Netflix (video), Google (search/ads). AI/services: Google Gemini, Microsoft Copilot, OpenAI ChatGPT all competing for on-device AI positioning.',
    financial: 'Revenue: $383B (FY2023). Net income: $97B. Services revenue: $85B (fastest growing, highest margin at ~70%). iPhone revenue: $200B (52% of total). Cash and securities: $167B. R&D: $29.9B. Market cap: ~$3.5T. Dividend growing, buybacks aggressive.',
    sentiment: 'Consumer: extremely loyal install base; brand perception remains premium globally. Developer: frustrated by App Store policies and 30% commission; EU DMA forcing changes. Investor: confidence high — services growth narrative intact. Regulatory: under pressure in EU (DMA), US (DOJ antitrust), China (market share declining).',
    trends: '(1) Apple Intelligence — on-device AI integration across iOS 18/macOS Sequoia. (2) Vision Pro spatial computing ecosystem build-out (slow start, iteration expected). (3) India manufacturing ramp — de-risking China dependency. (4) Services attach rate growth — AppleTV+, Apple Pay, iCloud+. (5) Custom silicon expansion — M4 chips pushing performance-per-watt boundaries.',
    summary: 'Apple\'s financial position is exceptional, with $97B net income and a services segment approaching $85B revenue at ~70% gross margins. The strategic pivot to Apple Intelligence represents its biggest software bet in a decade — positioning the iPhone as the AI interface of choice through on-device processing and privacy differentiation. The Vision Pro remains a developer platform rather than a consumer product at current volumes, with a mass-market successor the key watch item.',
  },
};

export function getCompanyResearch(input: string): CompanyResearch {
  const lower = input.toLowerCase();
  if (lower.includes('openai') || lower.includes('chatgpt') || lower.includes('gpt')) return COMPANIES.openai;
  if (lower.includes('tesla') || lower.includes('musk') || lower.includes('ev')) return COMPANIES.tesla;
  if (lower.includes('apple') || lower.includes('iphone') || lower.includes('tim cook')) return COMPANIES.apple;
  return { ...COMPANIES.openai, name: input || 'Company' };
}

export function formatReport(r: CompanyResearch): string {
  return [
    `📊 MARKET RESEARCH REPORT: ${r.name.toUpperCase()}`,
    '═══════════════════════════════════════',
    '',
    '🏆 COMPETITIVE LANDSCAPE',
    r.competitor,
    '',
    '💰 FINANCIAL SNAPSHOT',
    r.financial,
    '',
    '💬 MARKET SENTIMENT',
    r.sentiment,
    '',
    '📈 KEY TRENDS',
    r.trends,
    '',
    '─────────────────────────────────────',
    '📌 EXECUTIVE SUMMARY',
    r.summary,
  ].join('\n');
}
