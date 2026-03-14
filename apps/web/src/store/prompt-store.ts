/**
 * Prompt Store — Deep, cross-persona prompt library with variations, LLM compatibility,
 * and editable state. Each prompt has multiple variations (short/long/specific/LinkedIn/enterprise)
 * and is tuned for different LLMs.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
import { create } from 'zustand';

// --- Types ---

export type Persona = 'marketing' | 'engineering' | 'product';
export type LLMProvider = 'openai' | 'azure' | 'claude' | 'gemini' | 'perplexity';
export type PromptVariation = 'standard' | 'short' | 'long' | 'linkedin' | 'enterprise' | 'email' | 'social' | 'executive-summary';

export interface PromptVariant {
  variation: PromptVariation;
  label: string;
  prompt: string;
  wordTarget?: string;  // e.g. "50-80 words", "500+ words"
}

export interface DeepPrompt {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  icon: string;
  agent: string;
  persona: Persona;
  description: string;
  tags: string[];
  llmCompatibility: LLMProvider[];  // which LLMs this is tuned for
  llmNotes?: Partial<Record<LLMProvider, string>>;  // per-LLM optimization hints
  variables: string[];              // extracted {{variables}}
  variants: PromptVariant[];        // different versions (short/long/linkedin/etc.)
  version: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  isEditable: boolean;
  usageCount: number;
  rating: number;  // 1-5
}

interface PromptStoreState {
  prompts: DeepPrompt[];
  editedPrompts: Record<string, Partial<Record<PromptVariation, string>>>;  // overrides
  updatePromptVariant: (promptId: string, variation: PromptVariation, newText: string, editor: string) => void;
  getEffectivePrompt: (promptId: string, variation: PromptVariation) => string;
  getPromptsByPersona: (persona: Persona) => DeepPrompt[];
  getPromptsByAgent: (agent: string) => DeepPrompt[];
}

// --- LLM compatibility helper ---
const ALL_LLMS: LLMProvider[] = ['openai', 'azure', 'claude', 'gemini', 'perplexity'];

// --- Deep Marketing Prompts ---
const MARKETING_PROMPTS: DeepPrompt[] = [
  // ── CONTENT AGENT ──────────────────────────────────────────────────
  {
    id: 'mkt-content-blog', title: 'Blog Post Writer', category: 'Content', subcategory: 'Long-Form',
    icon: '✍️', agent: 'Content Agent', persona: 'marketing',
    description: 'Write SEO-optimized blog posts with proper structure, headers, and CTAs.',
    tags: ['content', 'seo', 'blog', 'long-form'],
    llmCompatibility: ALL_LLMS,
    llmNotes: {
      openai: 'Works best with GPT-4o. Use temperature 0.7 for creative, 0.3 for technical.',
      claude: 'Claude excels at long-form. Use extended thinking for 2000+ word posts.',
      gemini: 'Set safety settings to moderate for marketing content.',
      perplexity: 'Best for research-backed posts. Will auto-cite sources.',
    },
    variables: ['topic', 'audience', 'wordCount', 'tone', 'keyword', 'brandVoice'],
    version: 'v2.1',
    isEditable: true, usageCount: 342, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Standard Blog Post', wordTarget: '800-1200 words', prompt: `You are an expert content marketer for {{brandVoice}}. Write a {{wordCount}}-word blog post about "{{topic}}" for {{audience}}.

Structure:
1. H1: Engaging, keyword-rich headline
2. Introduction (hook + preview of value)
3. H2/H3 sections covering the topic comprehensively
4. Data points, examples, or case studies where relevant
5. Internal/external link suggestions (marked as [LINK: description])
6. Conclusion with clear CTA

SEO Requirements:
- Target keyword: {{keyword}}
- Include keyword in H1, first paragraph, and 2-3 H2s
- Meta description (155 chars max)
- Meta title (60 chars max)

Tone: {{tone}}. Write in second person ("you/your") unless specified otherwise.` },
      { variation: 'short', label: 'Quick Blog Post', wordTarget: '400-600 words', prompt: `Write a concise {{wordCount}}-word blog post about "{{topic}}" for {{audience}}.

Format: H1 headline → 2-sentence hook → 3 key sections (H2 + 2-3 paragraphs each) → CTA.
Target keyword: {{keyword}}. Tone: {{tone}}.
Include meta description (155 chars). Keep paragraphs under 3 sentences. Scannable.` },
      { variation: 'long', label: 'Comprehensive Pillar Post', wordTarget: '2000-3000 words', prompt: `You are a senior content strategist for {{brandVoice}}. Create a comprehensive pillar post about "{{topic}}" for {{audience}} ({{wordCount}}+ words).

Required Structure:
1. Title & meta (H1, meta title 60 chars, meta description 155 chars)
2. Executive Summary / TL;DR (3-5 bullet points)
3. Table of Contents
4. Introduction — frame the problem and preview the value
5. Core Sections (5-8 H2s, each with):
   - Clear H2 heading with keyword variant
   - 3-5 paragraphs with data, examples, and expert insights
   - At least one visual/infographic suggestion per section
   - Callout boxes for key takeaways
6. Comparison table or framework (if applicable)
7. FAQ section (5-7 questions)
8. Conclusion with primary CTA and secondary CTA
9. Internal linking map: suggest 5+ internal link opportunities

SEO: Target keyword "{{keyword}}" + 10 secondary keywords. Tone: {{tone}}.` },
      { variation: 'linkedin', label: 'LinkedIn Article', wordTarget: '600-900 words', prompt: `Write a LinkedIn article about "{{topic}}" targeting {{audience}} professionals.

LinkedIn-Specific Format:
- Opening: bold statement or question (first 2 lines are preview)
- Use short paragraphs (1-3 sentences max)
- Include line breaks between paragraphs
- Add 2-3 personal insights or "I've seen..." statements
- Use bullet points and numbered lists
- End with a discussion prompt: "What's your experience with...?"
- Include 3-5 relevant hashtags

Tone: professional but conversational, thought-leadership style.
Word count: {{wordCount}} words. NO corporate jargon.` },
      { variation: 'enterprise', label: 'Enterprise-Grade Content', wordTarget: '1500-2000 words', prompt: `You are writing for a Fortune 500 audience. Create enterprise-grade content about "{{topic}}" for {{audience}} at large organizations.

Enterprise Requirements:
- Executive-appropriate language: authoritative, data-driven, no fluff
- Include industry benchmarks and analyst references (e.g., Gartner, Forrester, McKinsey)
- ROI-focused framing: quantify business impact wherever possible
- Compliance-aware: note any regulatory considerations
- Include an executive summary (3-5 sentences) at the top
- Case study reference format: "A Fortune 500 [industry] company achieved..."
- Security and scalability mentions where relevant
- CTA: enterprise-appropriate (contact sales, book a demo, request assessment)

Target keyword: {{keyword}}. Word count: {{wordCount}}. Brand: {{brandVoice}}.` },
    ],
  },
  {
    id: 'mkt-content-email', title: 'Email Sequence Builder', category: 'Content', subcategory: 'Email',
    icon: '📧', agent: 'Content Agent', persona: 'marketing',
    description: 'Design multi-touch email nurture sequences with subject lines and body copy.',
    tags: ['email', 'nurture', 'drip', 'content'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { openai: 'GPT-4o excels at A/B subject line generation.', claude: 'Best for empathetic, narrative-driven sequences.' },
    variables: ['count', 'segment', 'goal', 'product', 'senderName', 'brandVoice'],
    version: 'v2.0', isEditable: true, usageCount: 289, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Nurture Sequence', wordTarget: '3-7 emails', prompt: `Create a {{count}}-email nurture sequence for {{segment}} segment, from {{senderName}}.

For each email provide:
1. Subject line (2 A/B variants)
2. Preview text (50 chars)
3. Body copy with personalization tokens ({{firstName}}, {{company}}, etc.)
4. CTA button text + link placeholder
5. Send timing (days after trigger)

Sequence goal: {{goal}}. Product: {{product}}.
Tone: professional, helpful, not pushy. Each email should build on the previous.` },
      { variation: 'short', label: 'Quick 3-Email Drip', wordTarget: '3 emails', prompt: `Create a 3-email drip sequence for {{segment}} promoting {{product}}.

Email 1 (Day 0): Welcome + value proposition — 100 words max
Email 2 (Day 3): Social proof + case study reference — 120 words max  
Email 3 (Day 7): Urgency + primary CTA — 80 words max

Each: subject line (A/B), preview text, body, CTA. From: {{senderName}}.` },
      { variation: 'enterprise', label: 'Enterprise Nurture (ABM)', wordTarget: '5-10 emails', prompt: `Design an ABM (Account-Based Marketing) email sequence for {{segment}} at enterprise accounts.

{{count}} emails over a 30-day cadence targeting multiple stakeholders:
- Emails 1-2: Executive sponsor (C-level) — ROI and strategic value
- Emails 3-4: Technical evaluator — architecture, integrations, security
- Emails 5-6: End user champion — ease of use, productivity gains
- Email 7+: Multi-threaded follow-up combining all stakeholders

Each email: subject (A/B), body, CTA, stakeholder persona, send day.
Product: {{product}}. Goal: {{goal}}. Include personalization for company name, industry, and company size.` },
      { variation: 'social', label: 'Social-to-Email Bridge', wordTarget: '3 emails', prompt: `Create a 3-email sequence for leads captured from social media ({{segment}}).

Context: these leads engaged with social content, so reference that touchpoint.
Email 1 (immediate): "Thanks for engaging — here's the deeper content"
Email 2 (Day 2): Value-add content related to their social engagement
Email 3 (Day 5): Conversion CTA

Keep each under 100 words. Casual, social-native tone. From: {{senderName}}.` },
    ],
  },
  {
    id: 'mkt-content-landing', title: 'Landing Page Copy', category: 'Content', subcategory: 'Conversion',
    icon: '🔗', agent: 'Content Agent', persona: 'marketing',
    description: 'Conversion-optimized landing page copy with hero, benefits, proof, and CTA.',
    tags: ['conversion', 'copywriting', 'landing-page'],
    llmCompatibility: ALL_LLMS,
    variables: ['offer', 'audience', 'goal', 'brandVoice', 'competitors'],
    version: 'v2.0', isEditable: true, usageCount: 267, rating: 4.7,
    variants: [
      { variation: 'standard', label: 'Full Landing Page', wordTarget: '500-800 words', prompt: `Write conversion-optimized landing page copy for {{offer}} targeting {{audience}}.

Structure:
1. Hero: Headline (8-12 words) + subheadline (max 25 words)
2. Problem statement: 2-3 pain points the audience faces
3. Solution: How {{offer}} solves these problems
4. Benefits: 3-5 benefit blocks (icon + heading + 2-sentence description)
5. Social proof: 2-3 testimonial placeholders with format
6. How it works: 3 numbered steps
7. FAQ: 5 common objections addressed
8. CTA section: Primary button + supporting text

Conversion goal: {{goal}}. Brand: {{brandVoice}}.` },
      { variation: 'short', label: 'Minimal Landing Page', wordTarget: '200-300 words', prompt: `Write a minimal, high-impact landing page for {{offer}} targeting {{audience}}.

Above the fold only: Headline → Subheadline → 3 bullet benefits → CTA button → Trust badge line.
Max 200 words. Every word must earn its place. Conversion goal: {{goal}}.` },
      { variation: 'enterprise', label: 'Enterprise Landing Page', wordTarget: '800-1200 words', prompt: `Write an enterprise landing page for {{offer}} targeting {{audience}} (VP+ decision-makers at large organizations).

Required sections:
1. Hero with ROI-focused headline (include a number: "X% improvement" or "$X saved")
2. Logos bar: "[LOGOS: enterprise customer logos placeholder]"
3. Business case: 3 quantified business outcomes
4. Enterprise features: security, compliance, scalability, SLA
5. Integration ecosystem section
6. Customer case study summary (placeholder with metrics)
7. Analyst recognition: "[ANALYST: Gartner/Forrester mention]"
8. Comparison table: vs. {{competitors}} on 5 criteria
9. Pricing: enterprise tier with "Contact Sales" CTA
10. Trust: SOC 2, GDPR, security certifications

Brand: {{brandVoice}}. No fluff. Data-driven. CTA: "Book a Demo" / "Request Assessment".` },
    ],
  },
  {
    id: 'mkt-content-casestudy', title: 'Case Study Generator', category: 'Content', subcategory: 'Sales Enablement',
    icon: '📋', agent: 'Content Agent', persona: 'marketing',
    description: 'Customer case study following the challenge-solution-results framework.',
    tags: ['content', 'sales-enablement', 'case-study'],
    llmCompatibility: ALL_LLMS,
    variables: ['customer', 'ourProduct', 'metrics', 'industry', 'companySize'],
    version: 'v1.5', isEditable: true, usageCount: 198, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Case Study', wordTarget: '800-1200 words', prompt: `Write a customer case study for {{customer}} ({{industry}}, {{companySize}}) using {{ourProduct}}.

Framework:
1. Customer overview: industry, size, challenge context
2. The Challenge: specific pain points with quantified business impact
3. Why they chose us: decision criteria, alternatives considered
4. The Solution: implementation details, timeline, team involved
5. Results: quantified metrics — {{metrics}}
6. Customer quote: draft a natural-sounding pull quote
7. Looking ahead: future plans with our product

Tone: professional, results-focused. Use numbers everywhere possible.` },
      { variation: 'short', label: 'One-Pager Case Study', wordTarget: '250-400 words', prompt: `Write a one-page case study for {{customer}} ({{industry}}).

Format: Challenge (3 sentences) → Solution (3 sentences) → Results (3 bullet metrics: {{metrics}}) → Quote (1 sentence).
Max 300 words. Include a bold headline: "[Customer] achieves [key result] with [product]".` },
      { variation: 'linkedin', label: 'LinkedIn Case Study Post', wordTarget: '150-250 words', prompt: `Write a LinkedIn post sharing the {{customer}} case study.

Format:
🎯 Hook: "How [customer] achieved [key result]..."
📊 3 key metrics: {{metrics}}
💡 The approach (2-3 sentences)
🔗 CTA: "Read the full case study [link]"

Include 3-5 hashtags. Results-focused, not salesy. Tag {{customer}} if appropriate.` },
      { variation: 'executive-summary', label: 'Executive Summary', wordTarget: '100-150 words', prompt: `Write an executive summary of the {{customer}} case study for use in board presentations and sales decks.

Format: 3-sentence summary → 3 key metrics on one line → ROI statement.
Max 100 words. Suitable for a PowerPoint slide. Industry: {{industry}}.` },
    ],
  },
  {
    id: 'mkt-content-newsletter', title: 'Newsletter Composer', category: 'Content', subcategory: 'Newsletter',
    icon: '📰', agent: 'Content Agent', persona: 'marketing',
    description: 'Weekly/monthly newsletter with curated content, insights, and CTAs.',
    tags: ['content', 'newsletter', 'email'],
    llmCompatibility: ALL_LLMS,
    variables: ['frequency', 'audience', 'brandVoice', 'topics', 'productUpdates'],
    version: 'v1.0', isEditable: true, usageCount: 145, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Standard Newsletter', wordTarget: '400-600 words', prompt: `Create a {{frequency}} newsletter for {{audience}}.

Sections:
1. Opening: personal note from the editor (3-4 sentences)
2. Featured Article: hero content with image placeholder + 3-sentence summary
3. Quick Reads: 3-4 curated links with 1-sentence descriptions
4. Product Update: {{productUpdates}} (if any)
5. Industry Insight: 1 data point or trend worth noting
6. CTA: drive to one key action
7. Footer: social links, unsubscribe

Topics to cover: {{topics}}. Brand voice: {{brandVoice}}.` },
      { variation: 'short', label: 'Micro Newsletter', wordTarget: '150-250 words', prompt: `Create a micro-newsletter for {{audience}} — 5 bullet points max.

Format: Subject line → 1-sentence intro → 5 bullets (each: emoji + heading + 1 sentence) → CTA.
Topics: {{topics}}. Max 200 words. Scannable in 30 seconds.` },
    ],
  },

  // ── CAMPAIGN AGENT ─────────────────────────────────────────────────
  {
    id: 'mkt-campaign-strategy', title: 'Campaign Strategy Brief', category: 'Strategy', subcategory: 'Planning',
    icon: '📡', agent: 'Campaign Agent', persona: 'marketing',
    description: 'Full campaign strategy brief: audience, channels, budget, timeline, KPIs.',
    tags: ['strategy', 'planning', 'campaign'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { claude: 'Use extended thinking for complex multi-channel strategies.', perplexity: 'Will add current market data to strategy recommendations.' },
    variables: ['product', 'audience', 'budget', 'duration', 'goal', 'market'],
    version: 'v2.0', isEditable: true, usageCount: 312, rating: 4.7,
    variants: [
      { variation: 'standard', label: 'Full Campaign Brief', wordTarget: '1000-1500 words', prompt: `You are a senior marketing strategist. Create a comprehensive campaign strategy brief.

Product: {{product}}
Target Audience: {{audience}}
Budget: {{budget}}
Duration: {{duration}}
Market: {{market}}
Goal: {{goal}}

Deliverables:
1. Campaign Objectives — primary and 3 secondary goals with measurable KPIs
2. Audience Segmentation — 3 audience segments with personas
3. Channel Mix — recommend channels with rationale and budget allocation %
4. Content Strategy — content types and themes per channel
5. Timeline — weekly milestones over {{duration}}
6. Budget Breakdown — by channel, creative, tools, contingency (10%)
7. Success Metrics — lead, lag, and vanity metrics with benchmarks
8. Risk Assessment — 3 risks with mitigation strategies
9. Team & Roles — who owns what` },
      { variation: 'short', label: 'One-Page Brief', wordTarget: '300-500 words', prompt: `Create a one-page campaign brief for {{product}} targeting {{audience}}.

Format: Objective → Audience → Channels (3 max) → Key Messages (3) → Timeline → Budget split → KPIs (3).
Max 400 words. Decision-ready for exec approval. Budget: {{budget}}. Duration: {{duration}}.` },
      { variation: 'executive-summary', label: 'Board-Ready Summary', wordTarget: '150-200 words', prompt: `Write a board-ready executive summary for the {{product}} campaign.

Format: 3 sentences on strategy → table: channel | budget | expected ROI → 3 KPIs with targets.
Max 150 words. Suitable for a board deck slide. Goal: {{goal}}.` },
    ],
  },

  // ── ADS AGENT ──────────────────────────────────────────────────────
  {
    id: 'mkt-ads-copy', title: 'Ad Copy Generator', category: 'Ads', subcategory: 'Copywriting',
    icon: '📢', agent: 'Ads Agent', persona: 'marketing',
    description: 'High-converting ad copy for LinkedIn, Google, Meta with CTA variants.',
    tags: ['ads', 'copywriting', 'performance'],
    llmCompatibility: ALL_LLMS,
    variables: ['platform', 'offer', 'audience', 'headlineChars', 'bodyChars', 'count'],
    version: 'v2.0', isEditable: true, usageCount: 276, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Multi-Platform Ad Copy', prompt: `Generate {{count}} ad copy variants for {{platform}} promoting {{offer}}.

For each variant:
1. Headline (max {{headlineChars}} chars)
2. Body copy (max {{bodyChars}} chars)
3. CTA button text
4. Target audience description

Include 3 angles per variant: benefit-led, problem-led, social-proof-led.
A/B testing strategy included.` },
      { variation: 'linkedin', label: 'LinkedIn Sponsored Content', prompt: `Generate {{count}} LinkedIn Sponsored Content ads for {{offer}} targeting {{audience}}.

LinkedIn ad specs:
- Intro text: max 600 chars (first 150 visible without "see more")
- Headline: max 200 chars
- Description: max 300 chars
- CTA: select from LinkedIn's options (Learn More, Sign Up, Download, etc.)

Include: professional tone, industry-specific language, thought-leadership positioning.
3 variants: executive-focused, practitioner-focused, data-driven.` },
      { variation: 'social', label: 'Meta/Instagram Ads', prompt: `Generate {{count}} Meta/Instagram ad copy variants for {{offer}}.

Meta ad specs:
- Primary text: 125 chars (recommended), 2200 max
- Headline: 27 chars (recommended), 255 max
- Description: 27 chars (recommended)

Include: scroll-stopping hooks, emoji usage (1-2 per ad), urgency triggers, social proof elements.
3 formats: feed ad, story ad, reel overlay text.
Audience: {{audience}}.` },
      { variation: 'short', label: 'Quick Ad Variants', prompt: `Generate 5 headline + CTA pairs for {{offer}} on {{platform}}. One per line. Max 10 words per headline. Target: {{audience}}.` },
      { variation: 'enterprise', label: 'Enterprise B2B Ads', prompt: `Generate {{count}} enterprise B2B ad variants for {{offer}} targeting {{audience}} (VP+ at companies with 1000+ employees).

Each ad must:
- Lead with business outcomes (revenue, efficiency, risk reduction)
- Include a credibility signal (analyst mention, customer count, certification)
- Use enterprise language: "transform", "at scale", "mission-critical"
- CTA: "Request a Demo" or "Talk to an Expert"

Platforms: LinkedIn, Google Search (RSA format). Compliance: avoid superlatives and unverified claims.` },
    ],
  },

  // ── SOCIAL AGENT ───────────────────────────────────────────────────
  {
    id: 'mkt-social-calendar', title: 'Social Media Calendar', category: 'Social', subcategory: 'Planning',
    icon: '📱', agent: 'Social Agent', persona: 'marketing',
    description: 'Full social content calendar with platform-specific posts and hashtags.',
    tags: ['social', 'planning', 'calendar'],
    llmCompatibility: ALL_LLMS,
    variables: ['brand', 'platforms', 'duration', 'themes', 'frequency'],
    version: 'v1.5', isEditable: true, usageCount: 234, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Weekly Calendar', wordTarget: '14-21 posts', prompt: `Create a {{duration}} social media content calendar for {{brand}} across {{platforms}}.

For each post:
- Platform, Date, Time (optimal for engagement)
- Post type: text, carousel, video, poll, infographic
- Copy (platform-native length and style)
- Hashtags (5-10, mix of branded + industry)
- Visual direction (1 sentence)

Content mix: educational (40%), engagement (30%), promotional (20%), cultural (10%).
Themes: {{themes}}. Posting frequency: {{frequency}}.` },
      { variation: 'linkedin', label: 'LinkedIn-Only Calendar', prompt: `Create a {{duration}} LinkedIn content calendar for {{brand}}.

Post types mix: text-only thought leadership (40%), carousel/document (30%), video/live (20%), polls (10%).
Post frequency: {{frequency}}. Each post includes: copy (use line breaks every 1-2 sentences), hashtags (3-5, professional), engagement hook at the end ("What's your take?", "Agree or disagree?").
Themes: {{themes}}.

Include 2 "personal story" posts and 1 "hot take" per week.` },
      { variation: 'short', label: 'Quick-Plan (5 Posts)', prompt: `Generate 5 social posts for {{brand}} on {{platforms}} this week.

Each: 1-line copy + 3 hashtags + post type. Mix: 2 educational, 2 engagement, 1 promotional.
Theme: {{themes}}. Keep it punchy — scrolling audience.` },
    ],
  },

  // ── SEO AGENT ──────────────────────────────────────────────────────
  {
    id: 'mkt-seo-brief', title: 'SEO Content Brief', category: 'SEO', subcategory: 'Content Strategy',
    icon: '🔗', agent: 'SEO Agent', persona: 'marketing',
    description: 'Detailed SEO content brief with keyword clusters, structure, and intent mapping.',
    tags: ['seo', 'content', 'keywords'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { perplexity: 'Will provide real-time SERP data and competitor analysis.' },
    variables: ['keyword', 'volume', 'difficulty', 'domain', 'competitorUrls'],
    version: 'v2.0', isEditable: true, usageCount: 198, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Full SEO Brief', prompt: `Create an SEO content brief for target keyword "{{keyword}}" (volume: {{volume}}, difficulty: {{difficulty}}).

1. Search Intent Analysis: informational/navigational/transactional/commercial
2. Primary + 10 secondary keywords with search volumes
3. Content Structure: recommended H1, H2s, H3s with keyword placement
4. Word count recommendation (based on SERP analysis)
5. Internal linking targets (5+ pages on {{domain}})
6. External authority link suggestions
7. Competitor content gaps: what top 3 results miss
8. Featured snippet opportunity: format + content
9. E-E-A-T requirements: expertise signals to include
10. Content angle: unique perspective vs. existing content

Competitors to analyze: {{competitorUrls}}` },
      { variation: 'short', label: 'Quick Keyword Brief', prompt: `SEO brief for "{{keyword}}" ({{volume}} vol, {{difficulty}} diff):
Target intent → Recommended word count → H1 → 5 H2s → 5 secondary keywords → 1 featured snippet opportunity.
Max 200 words.` },
    ],
  },

  // ── RESEARCH AGENT ─────────────────────────────────────────────────
  {
    id: 'mkt-research-competitive', title: 'Competitive Analysis', category: 'Research', subcategory: 'Market Intelligence',
    icon: '🔍', agent: 'Research Agent', persona: 'marketing',
    description: 'Deep competitive analysis with positioning, SWOT, and opportunity mapping.',
    tags: ['research', 'strategy', 'competitive'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { perplexity: 'Will auto-include live market data and recent mentions.' },
    variables: ['competitor', 'ourProduct', 'market', 'industry'],
    version: 'v2.0', isEditable: true, usageCount: 223, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full Competitive Report', wordTarget: '1500-2000 words', prompt: `Analyze {{competitor}} as a competitor to {{ourProduct}} in the {{market}} market.

Deliver a structured competitive intelligence report:
1. Company Overview: founding, funding, headcount, revenue estimates
2. Product Positioning: messaging, value proposition, tagline analysis
3. Pricing Model: tiers, packaging strategy, pricing psychology
4. Target Audience: ICP overlap with us (high/medium/low)
5. Strengths (5): what they do well
6. Weaknesses (5): where they fall short
7. Content Strategy: blog frequency, topics, SEO footprint
8. Channel Presence: social, paid, events, partnerships
9. Key Differentiators: what makes them unique
10. SWOT Matrix: formatted as a 2x2
11. Battle Card: 3 "when they say X, we say Y" responses
12. Opportunities: 3 actionable opportunities for us` },
      { variation: 'short', label: 'Quick Battle Card', wordTarget: '200-300 words', prompt: `Create a 1-page battle card for {{competitor}} vs {{ourProduct}}.

Format: 5 key differences → 3 "When they say X, we say Y" → Win themes (3) → Landmines to avoid (2).
Max 250 words. Sales-team ready.` },
      { variation: 'executive-summary', label: 'Exec Competitive Brief', wordTarget: '150 words', prompt: `50-word competitive summary of {{competitor}} for the leadership team: Market position → our advantage → recommended action. One paragraph.` },
    ],
  },

  // ── ANALYTICS AGENT ────────────────────────────────────────────────
  {
    id: 'mkt-analytics-report', title: 'Performance Report', category: 'Analytics', subcategory: 'Reporting',
    icon: '📊', agent: 'Analytics Agent', persona: 'marketing',
    description: 'Campaign performance report with insights, recommendations, and next steps.',
    tags: ['analytics', 'reporting', 'performance'],
    llmCompatibility: ALL_LLMS,
    variables: ['period', 'campaign', 'channels', 'budget', 'kpis'],
    version: 'v1.5', isEditable: true, usageCount: 187, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Full Performance Report', prompt: `Create a {{period}} performance report for the "{{campaign}}" campaign.

Structure:
1. Executive Summary (3 sentences)
2. KPI Dashboard: {{kpis}} — actual vs. target with RAG status
3. Channel Performance: each channel's contribution ({{channels}})
4. Budget Utilization: spent vs. planned by channel
5. Audience Insights: top-performing segments
6. Top Content/Creatives: what worked and why
7. Key Learnings (5 bullet points)
8. Recommendations: 3 tactical, 2 strategic
9. Next Period Plan: adjusted targets and priorities` },
      { variation: 'executive-summary', label: 'Exec Dashboard Summary', prompt: `{{period}} report for "{{campaign}}": 3-line summary → RAG status on {{kpis}} → top win → biggest concern → 1 recommendation. Max 100 words.` },
      { variation: 'short', label: 'Quick Metrics Snapshot', prompt: `"{{campaign}}" {{period}} snapshot: show {{kpis}} as actual/target/% with ↑↓ trend arrows. 3 bullet insights. 50 words.` },
    ],
  },

  // ── EVENT AGENT ────────────────────────────────────────────────────
  {
    id: 'mkt-event-webinar', title: 'Webinar Promotion Kit', category: 'Events', subcategory: 'Webinars',
    icon: '🎪', agent: 'Event Agent', persona: 'marketing',
    description: 'Full webinar promotion kit: emails, social posts, and landing page.',
    tags: ['events', 'promotion', 'webinar'],
    llmCompatibility: ALL_LLMS,
    variables: ['title', 'speakers', 'date', 'audience', 'topic'],
    version: 'v1.5', isEditable: true, usageCount: 156, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Promo Kit', prompt: `Create a promotion kit for webinar "{{title}}" featuring {{speakers}} on {{date}}.

Deliver:
1. 3 promotional emails: save-the-date, reminder (3 days before), last-chance (day of)
2. 5 social posts: 3 LinkedIn + 2 Twitter/X, spaced across 2 weeks
3. Landing page: headline + 4 benefit bullets + speaker bios format + CTA
4. Registration confirmation email
5. Post-webinar follow-up email (with recording link placeholder)

Target audience: {{audience}}. Topic: {{topic}}.` },
      { variation: 'linkedin', label: 'LinkedIn Event Promotion', prompt: `Create 5 LinkedIn posts promoting "{{title}}" webinar on {{date}} with {{speakers}}.

Post 1 (2 weeks out): Announce + tease key insights
Post 2 (1 week): Speaker spotlight + what they'll cover
Post 3 (3 days): "Seats filling up" + agenda preview
Post 4 (day of): "Starting in X hours" + link
Post 5 (day after): Key takeaway + recording link

Each: professional tone, 100-150 words, 3-5 hashtags, CTA to register.` },
      { variation: 'short', label: 'Quick Promo (3 Assets)', prompt: `For webinar "{{title}}" on {{date}}: Subject line + 50-word email → 1 LinkedIn post (100 words) → 1 headline for landing page. That's it. Audience: {{audience}}.` },
    ],
  },

  // ── OPTIMIZATION AGENT ─────────────────────────────────────────────
  {
    id: 'mkt-opt-abtest', title: 'A/B Test Hypothesis', category: 'Optimization', subcategory: 'Testing',
    icon: '📈', agent: 'Optimization Agent', persona: 'marketing',
    description: 'Structured A/B test hypotheses with expected impact and measurement plans.',
    tags: ['testing', 'optimization', 'cro'],
    llmCompatibility: ALL_LLMS,
    variables: ['page_or_campaign', 'count', 'conversionGoal', 'currentRate'],
    version: 'v1.5', isEditable: true, usageCount: 134, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Full Test Plan', prompt: `Generate {{count}} A/B test hypotheses for {{page_or_campaign}} (current conversion: {{currentRate}}).

For each hypothesis:
1. Statement: "If we [change X], then [Y] will improve, because [Z]"
2. Variable to test (isolated)
3. Control vs. variant description
4. Primary metric: {{conversionGoal}}
5. Expected lift %
6. Sample size needed (95% confidence, 80% power)
7. Test duration estimate
8. Risk if hypothesis is wrong
9. ICE score (Impact × Confidence × Ease, each 1-10)

Prioritize by ICE score descending.` },
      { variation: 'short', label: 'Quick Test Ideas', prompt: `5 A/B test ideas for {{page_or_campaign}}: each as "Change [X] → Expect [Y]% lift on {{conversionGoal}}". One line each. Ranked by expected impact.` },
    ],
  },
];

// --- Deep Engineering Prompts ---
const ENGINEERING_PROMPTS: DeepPrompt[] = [
  {
    id: 'eng-code-review', title: 'PR Code Review', category: 'Code Quality', subcategory: 'Review',
    icon: '🔍', agent: 'Code Review Agent', persona: 'engineering',
    description: 'Comprehensive PR review covering architecture, security, performance, and maintainability.',
    tags: ['code-review', 'architecture', 'security'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { claude: 'Best for nuanced code analysis. Use extended thinking for complex PRs.', openai: 'GPT-4o good for quick reviews. o1 for architectural reasoning.' },
    variables: ['language', 'framework', 'prContext', 'codeSnippet'],
    version: 'v2.0', isEditable: true, usageCount: 389, rating: 4.8,
    variants: [
      { variation: 'standard', label: 'Full PR Review', prompt: `Review the following {{language}} / {{framework}} code changes.

Context: {{prContext}}

Review across these dimensions:
1. **Correctness**: Logic errors, edge cases, off-by-one errors
2. **Security**: OWASP Top 10, injection, auth, data exposure
3. **Performance**: N+1 queries, unnecessary allocations, caching opportunities
4. **Architecture**: SOLID principles, coupling, cohesion, layer violations
5. **Maintainability**: naming, complexity, test coverage, documentation
6. **Accessibility**: if frontend, WCAG compliance
7. **API Design**: if API changes, backward compatibility

For each issue: severity (critical/major/minor/nit), file:line, suggested fix.
End with a SHIP / REVISE / BLOCK recommendation.

Code:
\`\`\`{{language}}
{{codeSnippet}}
\`\`\`` },
      { variation: 'short', label: 'Quick Review', prompt: `Quick review of this {{language}} code. Flag only critical/major issues. Max 5 items, each as: location → issue → fix.

\`\`\`{{language}}
{{codeSnippet}}
\`\`\`` },
      { variation: 'enterprise', label: 'Enterprise Compliance Review', prompt: `Enterprise compliance review of {{language}} code changes. {{prContext}}

Check against:
- SOC 2 Type II controls
- OWASP ASVS Level 2
- PCI DSS (if payment-related)
- GDPR / data privacy requirements
- Logging and audit trail completeness
- Error handling and graceful degradation
- Rate limiting and DDoS considerations

\`\`\`{{language}}
{{codeSnippet}}
\`\`\`` },
    ],
  },
  {
    id: 'eng-test-gen', title: 'Test Suite Generator', category: 'Testing', subcategory: 'Unit Tests',
    icon: '✅', agent: 'QA Agent', persona: 'engineering',
    description: 'Production-quality unit tests with F.I.R.S.T principles and boundary analysis.',
    tags: ['testing', 'unit-tests', 'quality'],
    llmCompatibility: ALL_LLMS,
    variables: ['language', 'framework', 'testFramework', 'codeToTest', 'functionName'],
    version: 'v2.0', isEditable: true, usageCount: 456, rating: 4.7,
    variants: [
      { variation: 'standard', label: 'Full Test Suite', prompt: `Generate comprehensive unit tests for the following {{language}} code using {{testFramework}}.

Code under test:
\`\`\`{{language}}
{{codeToTest}}
\`\`\`

Requirements:
- Follow F.I.R.S.T principles (Fast, Isolated, Repeatable, Self-validating, Timely)
- Use AAA pattern (Arrange, Act, Assert)
- Cover: happy path, edge cases, boundary values, error conditions, null/undefined inputs
- Include setup/teardown if needed
- Mock external dependencies
- Descriptive test names: "should [expected behavior] when [condition]"
- Aim for >90% branch coverage` },
      { variation: 'short', label: 'Quick Tests (Happy + Edge)', prompt: `Generate 5 tests for \`{{functionName}}\` in {{testFramework}}: 2 happy path, 2 edge cases, 1 error case.

\`\`\`{{language}}
{{codeToTest}}
\`\`\`` },
    ],
  },
  {
    id: 'eng-arch-decision', title: 'Architecture Decision Record', category: 'Architecture', subcategory: 'Design Decisions',
    icon: '🏗️', agent: 'Architect Agent', persona: 'engineering',
    description: 'Generate structured ADR with context, options, trade-offs, and rationale.',
    tags: ['architecture', 'design', 'documentation'],
    llmCompatibility: ALL_LLMS,
    variables: ['title', 'context', 'constraints', 'options'],
    version: 'v1.5', isEditable: true, usageCount: 198, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full ADR', prompt: `Create an Architecture Decision Record (ADR).

# ADR: {{title}}

Context: {{context}}
Constraints: {{constraints}}

For each option ({{options}}), evaluate:
1. Description
2. Pros (3+)
3. Cons (3+)
4. Cost estimate (relative: low/medium/high)
5. Risk assessment
6. Reversibility

Recommend one option with clear rationale. Include:
- Impact on existing architecture
- Migration plan if applicable
- Monitoring/validation criteria for the decision
- Review date (when to re-evaluate)` },
      { variation: 'short', label: 'Lightweight Decision', prompt: `ADR for "{{title}}": Context (2 sentences) → Options table (option | pro | con) → Decision (1 sentence) → Consequence (1 sentence). Max 200 words.` },
    ],
  },
  {
    id: 'eng-incident', title: 'Incident Response Playbook', category: 'SRE', subcategory: 'Incident Management',
    icon: '🚨', agent: 'SRE Agent', persona: 'engineering',
    description: 'Structured incident response with severity classification and post-mortem.',
    tags: ['incident-response', 'sre', 'operations'],
    llmCompatibility: ALL_LLMS,
    variables: ['service', 'symptoms', 'severity', 'impactedUsers'],
    version: 'v1.5', isEditable: true, usageCount: 167, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Full Incident Response', prompt: `Incident response playbook for {{service}} experiencing {{symptoms}}.

Severity: {{severity}}. Impacted users: {{impactedUsers}}.

1. **Triage** (first 5 min): classify, page on-call, open war room
2. **Diagnosis**: top 5 likely root causes ranked by probability
3. **Mitigation**: immediate actions to reduce blast radius
4. **Resolution**: step-by-step fix for each likely root cause
5. **Communication**: status page update template, stakeholder email
6. **Post-Mortem** template: timeline, root cause, contributing factors, action items (each with owner and due date)
7. **Prevention**: 3 systemic improvements to prevent recurrence` },
      { variation: 'short', label: 'Quick Triage Guide', prompt: `{{service}} alert: {{symptoms}}. Quick triage: 3 most likely causes → 1 immediate mitigation → escalation path. Max 100 words.` },
    ],
  },
  {
    id: 'eng-api-design', title: 'API Design Specification', category: 'Architecture', subcategory: 'API Design',
    icon: '🔌', agent: 'Architect Agent', persona: 'engineering',
    description: 'RESTful API specification with endpoints, schemas, auth, and error handling.',
    tags: ['api', 'architecture', 'design'],
    llmCompatibility: ALL_LLMS,
    variables: ['resourceName', 'operations', 'authMethod', 'domain'],
    version: 'v1.0', isEditable: true, usageCount: 145, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full API Spec', prompt: `Design a RESTful API for {{resourceName}} in the {{domain}} domain.

Operations needed: {{operations}}.
Authentication: {{authMethod}}.

For each endpoint:
- Method + path (RESTful conventions)
- Request: headers, query params, body schema (TypeScript interface)
- Response: status codes (200, 201, 400, 401, 403, 404, 500), response schema
- Pagination: cursor-based for list endpoints
- Rate limiting: headers and limits
- Error format: { code, message, details[] }
- Example request and response

Include: OpenAPI 3.1 snippet for the main endpoint.` },
      { variation: 'short', label: 'Quick Endpoint List', prompt: `List REST endpoints for {{resourceName}}: method, path, purpose. Include CRUD + search. One line each.` },
    ],
  },
  {
    id: 'eng-debug', title: 'Systematic Debugging Protocol', category: 'Development', subcategory: 'Debugging',
    icon: '🐛', agent: 'Debug Agent', persona: 'engineering',
    description: '4-phase root cause analysis: reproduce, hypothesize, test, verify.',
    tags: ['debugging', 'development', 'troubleshooting'],
    llmCompatibility: ALL_LLMS,
    variables: ['bugDescription', 'stackTrace', 'language', 'environment'],
    version: 'v1.0', isEditable: true, usageCount: 234, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Debug Protocol', prompt: `Systematic debugging for: {{bugDescription}}

Environment: {{environment}} | Language: {{language}}

Stack trace:
\`\`\`
{{stackTrace}}
\`\`\`

Phase 1 — REPRODUCE: steps to reliably reproduce
Phase 2 — HYPOTHESIZE: top 5 root causes ranked by probability
Phase 3 — TEST: diagnostic steps for each hypothesis (logs, breakpoints, test cases)
Phase 4 — FIX: solution for most likely cause + regression test` },
      { variation: 'short', label: 'Quick Root Cause', prompt: `Bug: {{bugDescription}}. Stack: {{stackTrace}}. Top 3 likely causes. Most likely fix. Max 5 lines.` },
    ],
  },
];

// --- Deep Product Prompts ---
const PRODUCT_PROMPTS: DeepPrompt[] = [
  {
    id: 'prod-prd', title: 'Product Requirements Document', category: 'Planning', subcategory: 'Requirements',
    icon: '📝', agent: 'Product Strategist Agent', persona: 'product',
    description: 'Full PRD with problem, solution, user stories, acceptance criteria, and scope.',
    tags: ['prd', 'requirements', 'planning'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { claude: 'Best for detailed, nuanced PRDs.', gemini: 'Good for competitive context.' },
    variables: ['feature', 'problem', 'users', 'successMetrics', 'constraints'],
    version: 'v2.0', isEditable: true, usageCount: 312, rating: 4.7,
    variants: [
      { variation: 'standard', label: 'Full PRD', wordTarget: '1500-2500 words', prompt: `Create a Product Requirements Document for "{{feature}}".

1. **Problem Statement**: {{problem}} — who is affected, quantified impact
2. **Target Users**: {{users}} — personas with goals, pain points, JTBD
3. **Solution Overview**: proposed approach (2-3 paragraphs)
4. **User Stories**: 5-8 stories in "As a [user], I want [action], so that [benefit]" format
5. **Acceptance Criteria**: for each user story, Given/When/Then format
6. **Functional Requirements**: detailed feature list with priority (P0/P1/P2)
7. **Non-Functional Requirements**: performance, scalability, security, accessibility
8. **Out of Scope**: explicitly excluded items
9. **Success Metrics**: {{successMetrics}} with baseline and target
10. **Dependencies**: technical, team, and external
11. **Risks & Mitigations**: 3+ risks
12. **Timeline**: rough phases
13. **Constraints**: {{constraints}}

Audience: engineering + design teams.` },
      { variation: 'short', label: 'One-Page PRD', wordTarget: '400-600 words', prompt: `One-page PRD for "{{feature}}": Problem (3 sentences) → Users → 5 user stories → 3 success metrics → Scope (in/out). Max 500 words. Decision-ready.` },
      { variation: 'executive-summary', label: 'Exec Feature Brief', wordTarget: '100-150 words', prompt: `Executive brief for "{{feature}}": Problem → Proposed solution → Expected impact ({{successMetrics}}) → Ask/decision needed. Max 100 words. Board-slide ready.` },
    ],
  },
  {
    id: 'prod-roadmap', title: 'Roadmap Planning', category: 'Strategy', subcategory: 'Roadmap',
    icon: '🗺️', agent: 'Product Strategist Agent', persona: 'product',
    description: 'Quarterly roadmap with themes, initiatives, dependencies, and trade-offs.',
    tags: ['roadmap', 'strategy', 'planning'],
    llmCompatibility: ALL_LLMS,
    variables: ['quarter', 'objectives', 'themes', 'teamSize', 'constraints'],
    version: 'v1.5', isEditable: true, usageCount: 234, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Quarterly Roadmap', prompt: `Create a {{quarter}} product roadmap.

Objectives: {{objectives}}
Themes: {{themes}}
Team size: {{teamSize}}
Constraints: {{constraints}}

Deliverables:
1. Theme-based roadmap (not feature-based) with 3-4 themes
2. Initiatives per theme (3-5 each) with effort estimates (S/M/L/XL)
3. Dependency map: which initiatives block others
4. Capacity allocation: % of team per theme + tech debt allocation
5. Key milestones: month-by-month
6. Trade-offs: what we're NOT doing and why
7. Success criteria per theme with measurable outcomes
8. Stakeholder communication plan` },
      { variation: 'executive-summary', label: 'Board Roadmap', prompt: `{{quarter}} roadmap for the board: 3 themes → 1 sentence each → key metric per theme → what's new vs. what's continuing. Max 150 words.` },
    ],
  },
  {
    id: 'prod-user-research', title: 'User Research Plan', category: 'Research', subcategory: 'User Research',
    icon: '🔬', agent: 'Research Agent', persona: 'product',
    description: 'Research plan with methodology, interview guides, and synthesis framework.',
    tags: ['research', 'user-research', 'discovery'],
    llmCompatibility: ALL_LLMS,
    variables: ['researchQuestion', 'targetUsers', 'method', 'timeline'],
    version: 'v1.0', isEditable: true, usageCount: 167, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Full Research Plan', prompt: `Design a user research plan.

Research question: {{researchQuestion}}
Target users: {{targetUsers}}
Method: {{method}}
Timeline: {{timeline}}

Deliver:
1. Research objectives (3-5)
2. Methodology: {{method}} with justification
3. Participant criteria: screening questions (5)
4. Discussion guide / interview script (15-20 questions, grouped by theme)
5. Synthesis framework: how findings will be organized (affinity diagram, themes)
6. Deliverables: research report outline
7. Stakeholder share-out plan` },
      { variation: 'short', label: 'Lean Research Brief', prompt: `Lean research plan for "{{researchQuestion}}": 5 interview questions → target users → method → timeline. Max 200 words.` },
    ],
  },
  {
    id: 'prod-metrics', title: 'Product Metrics Framework', category: 'Analytics', subcategory: 'Metrics',
    icon: '📊', agent: 'Analytics Agent', persona: 'product',
    description: 'North star metric, HEART framework, and instrumentation plan.',
    tags: ['metrics', 'analytics', 'measurement'],
    llmCompatibility: ALL_LLMS,
    variables: ['product', 'stage', 'currentMetrics', 'goals'],
    version: 'v1.0', isEditable: true, usageCount: 145, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Metrics Framework', prompt: `Design a product metrics framework for {{product}} (stage: {{stage}}).

1. **North Star Metric**: one metric that captures core value delivery
2. **HEART Framework**: Happiness, Engagement, Adoption, Retention, Task Success — each with metric, signal, and measurement method
3. **Input Metrics**: leading indicators (acquisition, activation, engagement)
4. **Output Metrics**: lagging indicators (revenue, retention, NPS)
5. **Counter Metrics**: metrics to watch for negative side effects
6. **Instrumentation Plan**: what to track, event schema, tools needed
7. **Dashboard Design**: 5-7 key metrics for a weekly review dashboard
8. **Alert Thresholds**: when to investigate drops

Current metrics: {{currentMetrics}}. Goals: {{goals}}.` },
      { variation: 'short', label: 'Quick Metrics Stack', prompt: `Metrics for {{product}}: North star → 3 input metrics → 3 output metrics → 1 counter metric. One line each.` },
    ],
  },
  {
    id: 'prod-release-notes', title: 'Release Notes Generator', category: 'Communication', subcategory: 'Release',
    icon: '🚀', agent: 'Product Comms Agent', persona: 'product',
    description: 'Release notes with features, fixes, deployment steps, and customer communication.',
    tags: ['release', 'communication', 'changelog'],
    llmCompatibility: ALL_LLMS,
    variables: ['version', 'features', 'fixes', 'breakingChanges', 'audience'],
    version: 'v1.5', isEditable: true, usageCount: 198, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Full Release Notes', prompt: `Generate release notes for version {{version}}.

New features: {{features}}
Bug fixes: {{fixes}}
Breaking changes: {{breakingChanges}}
Audience: {{audience}}

Format:
## What's New
- Feature name: 2-sentence benefit-focused description

## Improvements
- Fix name: what was wrong → now works correctly

## Breaking Changes ⚠️
- What changed → migration steps

## Getting Started
- How to upgrade / enable new features` },
      { variation: 'email', label: 'Customer Email', prompt: `Write a customer-facing email for {{version}} release. Subject line → 3 highlights (benefit-focused, not technical) → CTA to learn more. 150 words max. Audience: {{audience}}.` },
      { variation: 'short', label: 'Changelog Entry', prompt: `Changelog for {{version}}: list features and fixes, one line each, with category tags [feature], [fix], [breaking].` },
      { variation: 'social', label: 'Launch Social Post', prompt: `LinkedIn + Twitter/X announcement for {{version}}: 3 highlights → enthusiasm → link. LinkedIn: 150 words. Twitter: 250 chars. Include 3 hashtags.` },
    ],
  },
  {
    id: 'prod-competitive', title: 'Feature Comparison Matrix', category: 'Strategy', subcategory: 'Competitive',
    icon: '⚔️', agent: 'Product Strategist Agent', persona: 'product',
    description: 'Feature comparison matrix across competitors with gap analysis.',
    tags: ['competitive', 'strategy', 'analysis'],
    llmCompatibility: ALL_LLMS,
    variables: ['ourProduct', 'competitors', 'featureAreas', 'targetMarket'],
    version: 'v1.0', isEditable: true, usageCount: 156, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Comparison Matrix', prompt: `Create a feature comparison matrix: {{ourProduct}} vs {{competitors}} for {{targetMarket}}.

Feature areas: {{featureAreas}}

Deliver:
1. Feature matrix table: ✅ full, ⚠️ partial, ❌ missing  — for each product
2. Scoring: rate each product 1-5 per area with justification
3. Gap analysis: where we trail, where we lead
4. Unique differentiators per product
5. Recommended focus areas for us (top 3)
6. Market positioning map: 2×2 quadrant` },
      { variation: 'short', label: 'Quick Feature Grid', prompt: `{{ourProduct}} vs {{competitors}}: table with {{featureAreas}} rows. ✅/⚠️/❌ per cell. One-line gap summary at bottom.` },
    ],
  },
];

// --- All prompts combined ---
const ALL_PROMPTS: DeepPrompt[] = [...MARKETING_PROMPTS, ...ENGINEERING_PROMPTS, ...PRODUCT_PROMPTS];

// --- Store ---
export const usePromptStore = create<PromptStoreState>((set, get) => ({
  prompts: ALL_PROMPTS,
  editedPrompts: {},

  updatePromptVariant: (promptId, variation, newText, editor) => {
    set((state) => ({
      editedPrompts: {
        ...state.editedPrompts,
        [promptId]: { ...state.editedPrompts[promptId], [variation]: newText },
      },
      prompts: state.prompts.map(p =>
        p.id === promptId ? { ...p, lastEditedBy: editor, lastEditedAt: new Date().toISOString() } : p
      ),
    }));
  },

  getEffectivePrompt: (promptId, variation) => {
    const state = get();
    const edited = state.editedPrompts[promptId]?.[variation];
    if (edited) return edited;
    const prompt = state.prompts.find(p => p.id === promptId);
    return prompt?.variants.find(v => v.variation === variation)?.prompt ?? '';
  },

  getPromptsByPersona: (persona) => get().prompts.filter(p => p.persona === persona),
  getPromptsByAgent: (agent) => get().prompts.filter(p => p.agent === agent),
}));
