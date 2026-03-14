/**
 * Prompt Store — Deep, cross-persona prompt library with variations, LLM compatibility,
 * and editable state. Each prompt has multiple variations (short/long/specific/LinkedIn/enterprise)
 * and is tuned for different LLMs.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---

export type Persona = 'marketing' | 'engineering' | 'product' | 'hr';
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
  /** Skill/workflow IDs this prompt is useful for */
  linkedSkillIds?: string[];
  /** Where this prompt originated: 'built-in' | 'community' | 'custom' */
  source?: 'built-in' | 'community' | 'custom';
}

interface PromptStoreState {
  prompts: DeepPrompt[];
  editedPrompts: Record<string, Partial<Record<PromptVariation, string>>>;  // overrides
  updatePromptVariant: (promptId: string, variation: PromptVariation, newText: string, editor: string) => void;
  getEffectivePrompt: (promptId: string, variation: PromptVariation) => string;
  getPromptsByPersona: (persona: Persona) => DeepPrompt[];
  getPromptsByAgent: (agent: string) => DeepPrompt[];
  /** Get prompts linked to a specific skill or workflow */
  getPromptsForSkill: (skillId: string) => DeepPrompt[];
}

// --- LLM compatibility helper ---
const ALL_LLMS: LLMProvider[] = ['openai', 'azure', 'claude', 'gemini', 'perplexity'];

// --- Deep Marketing Prompts ---
const MARKETING_PROMPTS: DeepPrompt[] = [
  // ── CONTENT AGENT ──────────────────────────────────────────────────
  {
    id: 'mkt-content-blog', title: 'Blog Post Writer', category: 'Content', subcategory: 'Long-Form',
    icon: '✍️', agent: 'Content Agent', persona: 'marketing',
    linkedSkillIds: ['wf-007', 'wf-008', 'wf-009'], source: 'built-in',
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
    linkedSkillIds: ['wf-006'], source: 'built-in',
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
    linkedSkillIds: ['wf-001', 'wf-002'], source: 'built-in',
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
    linkedSkillIds: ['wf-010'], source: 'built-in',
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
    linkedSkillIds: ['wf-011'], source: 'built-in',
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
    linkedSkillIds: ['wf-001', 'wf-002', 'wf-003', 'wf-005'], source: 'built-in',
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
    linkedSkillIds: ['wf-004', 'wf-015'], source: 'built-in',
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
    linkedSkillIds: ['wf-013'], source: 'built-in',
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
    linkedSkillIds: ['wf-007', 'wf-008'], source: 'built-in',
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
    linkedSkillIds: ['wf-021', 'wf-023'], source: 'built-in',
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
    linkedSkillIds: ['wf-025', 'wf-026', 'wf-027'], source: 'built-in',
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
    icon: '🎪', agent: 'Event Agent', persona: 'marketing',    linkedSkillIds: ['wf-001', 'wf-017', 'wf-020'], source: 'built-in',    description: 'Full webinar promotion kit: emails, social posts, and landing page.',
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
    linkedSkillIds: ['wf-025', 'wf-026'], source: 'built-in',
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

  // ── PRODUCT LAUNCH AGENT ───────────────────────────────────────────
  {
    id: 'mkt-product-launch', title: 'Product Launch Messaging Framework', category: 'Strategy', subcategory: 'Launch',
    icon: '🚀', agent: 'Campaign Agent', persona: 'marketing',
    linkedSkillIds: ['wf-002'], source: 'built-in',
    description: 'Complete launch messaging framework: positioning, value props, objection handling, and channel-specific copy.',
    tags: ['launch', 'messaging', 'positioning', 'go-to-market'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { claude: 'Best for nuanced positioning work. Use extended thinking.', perplexity: 'Will pull current market context.' },
    variables: ['product', 'targetAudience', 'competitors', 'launchDate', 'keyBenefits', 'pricingModel'],
    version: 'v2.0', isEditable: true, usageCount: 276, rating: 4.7,
    variants: [
      { variation: 'standard', label: 'Full Messaging Framework', wordTarget: '1500-2000 words', prompt: `Create a comprehensive product launch messaging framework for {{product}}.

Launch date: {{launchDate}}
Target audience: {{targetAudience}}
Key competitors: {{competitors}}
Key benefits: {{keyBenefits}}
Pricing: {{pricingModel}}

Deliverables:
1. **Positioning Statement**: "For [target] who [need], [product] is a [category] that [key benefit]. Unlike [competitors], we [differentiator]."
2. **Value Proposition Hierarchy**: Primary (1), Secondary (3), Tertiary (5)
3. **Messaging Pillars**: 3 pillars, each with headline + proof points + supporting data
4. **Objection Handling Matrix**: 10 common objections → response → proof point
5. **Elevator Pitch**: 30-second, 60-second, 2-minute versions
6. **Tone & Voice Guide**: dos/don'ts, word choices, banned phrases
7. **Channel-Specific Adaptation**:
   - Website hero copy
   - Sales deck talking points (5 slides)
   - Email announcement (subject + body)
   - LinkedIn post (150 words)
   - Press release headline + first paragraph
8. **Internal Launch Brief**: what every employee should know (5 bullet points)
9. **FAQ**: 15 questions across buyers, users, press, and internal` },
      { variation: 'short', label: 'Quick Messaging Kit', wordTarget: '400-600 words', prompt: `Launch messaging kit for {{product}}: Positioning statement → 3 value props → 5 objection responses → elevator pitch (30s) → LinkedIn post. Max 500 words. Ready to share with team by EOD.` },
      { variation: 'enterprise', label: 'Enterprise Launch Messaging', wordTarget: '2000-3000 words', prompt: `Enterprise-grade launch messaging for {{product}} targeting {{targetAudience}} at Fortune 1000 companies.

Include everything from the standard framework PLUS:
- C-suite value narrative (board-level language)
- Economic buyer vs. technical buyer separate messaging tracks
- Champion enablement kit (internal pitch deck talking points)
- ROI calculator inputs (what numbers to gather)
- Security & compliance positioning
- Migration/switching cost narrative
- Reference architecture messaging
- Partner co-marketing messaging framework

Competitors: {{competitors}}. Pricing: {{pricingModel}}.` },
      { variation: 'social', label: 'Social Launch Toolkit', wordTarget: '500-800 words', prompt: `Social media launch toolkit for {{product}} on LinkedIn, Twitter/X, and Instagram.

Week -1 (tease): 3 posts hinting at launch
Day 0 (launch): 1 hero post per platform + founder post + employee advocacy template
Week 1 (amplify): 5 posts covering different features/benefits
Week 2 (proof): 3 posts with early results/testimonials

Each post: platform-native copy + hashtags + engagement hook. Include employee advocacy copy (share-ready).
Audience: {{targetAudience}}.` },
      { variation: 'email', label: 'Launch Email Series', wordTarget: '600-900 words', prompt: `Create a 5-email launch sequence for {{product}}:

Email 1 (Day -7): Teaser — "Something big is coming"
Email 2 (Day -1): VIP early access offer
Email 3 (Day 0): Launch announcement — hero email
Email 4 (Day +3): Feature deep-dive + social proof
Email 5 (Day +7): FOMO closer — limited-time launch offer

Each: subject (2 A/B variants), preview text, body (150 words max), CTA.
Audience: {{targetAudience}}. Product: {{product}}.` },
    ],
  },

  // ── ABM AGENT ──────────────────────────────────────────────────────
  {
    id: 'mkt-abm-outreach', title: 'ABM Personalized Outreach', category: 'ABM', subcategory: 'Outreach',
    icon: '🎯', agent: 'ABM Agent', persona: 'marketing',
    linkedSkillIds: ['wf-003', 'wf-019', 'wf-024'], source: 'built-in',
    description: 'Hyper-personalized ABM outreach sequences with account-level research and multi-stakeholder messaging.',
    tags: ['abm', 'outreach', 'personalization', 'enterprise'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { perplexity: 'Excels at real-time account research.', claude: 'Best for empathetic, nuanced messaging.' },
    variables: ['targetCompany', 'industry', 'stakeholders', 'painPoints', 'ourProduct', 'trigger'],
    version: 'v2.0', isEditable: true, usageCount: 198, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Full ABM Sequence', wordTarget: '1000-1500 words', prompt: `Create a personalized ABM outreach campaign for {{targetCompany}} ({{industry}}).

Trigger event: {{trigger}}
Our product: {{ourProduct}}
Known pain points: {{painPoints}}
Stakeholders: {{stakeholders}}

Deliver:
1. **Account Research Brief** (200 words): company overview, recent news, tech stack signals, growth indicators
2. **Stakeholder Map**: for each stakeholder — role, priorities, messaging angle, objection
3. **Multi-Thread Outreach**:
   - Executive track (2 emails): strategic, ROI-focused, peer references
   - Technical track (2 emails): architecture fit, integration ease, security
   - Champion track (3 emails): day-to-day value, ease of adoption, career impact
4. **LinkedIn Touchpoints**: connection request note + 2 InMails per stakeholder
5. **Gift/Experience Strategy**: personalized touch suggestion based on account intel
6. **Meeting Agenda**: if they accept, prepared agenda with discovery questions` },
      { variation: 'short', label: 'Quick Personalized Email', wordTarget: '200-300 words', prompt: `One hyper-personalized outreach email for {{targetCompany}} executive about {{ourProduct}}.

Research: mention their recent {{trigger}}. Connect to {{painPoints}}.
Format: personalized opening (shows research) → insight they haven't considered → soft CTA.
Max 120 words. No "I hope this email finds you well."` },
      { variation: 'linkedin', label: 'LinkedIn ABM Sequence', wordTarget: '300-500 words', prompt: `LinkedIn ABM sequence for {{targetCompany}} stakeholders:

1. Connection request (300 chars): reference {{trigger}}, no pitch
2. Day 3 — Value comment: engage with their recent post (draft a thoughtful reply)
3. Day 7 — InMail #1: share relevant insight about {{industry}} + {{painPoints}}
4. Day 14 — InMail #2: case study from peer company + soft meeting ask
5. Day 21 — Voice note script (30 seconds): personal, specific, low-pressure

Each: LinkedIn-native tone, research-backed, not salesy.` },
      { variation: 'enterprise', label: 'Enterprise ABM Program', wordTarget: '2000+ words', prompt: `Design a full-quarter ABM program for {{targetCompany}} (1:1 tier).

Phase 1 (Weeks 1-2): Research & mapping — account intel, org chart, buying committee, tech stack
Phase 2 (Weeks 3-6): Multi-channel warm-up — social engagement, content sharing, event invites
Phase 3 (Weeks 7-10): Direct outreach — personalized emails, LinkedIn, gifting, direct mail
Phase 4 (Weeks 11-13): Acceleration — executive sponsorship, on-site meeting, POC proposal

For each phase: activities, owners, channels, content needed, success metrics.
Include: budget estimate, timeline, risk mitigation. Product: {{ourProduct}}.` },
    ],
  },

  // ── DESIGN AGENT ──────────────────────────────────────────────────
  {
    id: 'mkt-design-brief', title: 'Creative Design Brief', category: 'Creative', subcategory: 'Design',
    icon: '🎨', agent: 'Design Agent', persona: 'marketing',
    linkedSkillIds: ['wf-013', 'wf-014', 'wf-015', 'wf-016'], source: 'built-in',
    description: 'Creative briefs for designers covering visual direction, asset specs, and brand guidelines.',
    tags: ['design', 'creative', 'branding', 'visual'],
    llmCompatibility: ALL_LLMS,
    variables: ['asset', 'purpose', 'platform', 'brandGuidelines', 'audience', 'dimensions'],
    version: 'v1.5', isEditable: true, usageCount: 167, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Creative Brief', wordTarget: '600-900 words', prompt: `Create a creative design brief for {{asset}} ({{platform}}).

Purpose: {{purpose}}
Target audience: {{audience}}
Dimensions: {{dimensions}}
Brand guidelines: {{brandGuidelines}}

Brief structure:
1. **Objective**: what this asset should achieve (awareness, click, download)
2. **Key Message**: single message the viewer should take away
3. **Visual Direction**: mood, style, color palette, typography preferences
4. **Must-Have Elements**: logo placement, CTA button, legal disclaimers
5. **Copy Specifications**: headline (max chars), body (max chars), CTA text
6. **Do / Don't**: visual dos and donts for the brand
7. **Reference Examples**: describe 3 inspirational references
8. **Variations Needed**: sizes, formats, A/B variants
9. **Deliverable Format**: file types, resolution, color space` },
      { variation: 'short', label: 'Quick Design Request', wordTarget: '150-250 words', prompt: `Design request for {{asset}} on {{platform}}: Objective → Key message → Dimensions → Must-haves → Copy (headline + CTA) → Deadline.
Max 200 words. Ready to hand to a designer or Canva.` },
      { variation: 'social', label: 'Social Media Creative Brief', wordTarget: '300-400 words', prompt: `Creative brief for social media assets for {{platform}}:

Deliver specs for:
- Feed post (1080×1080): headline overlay + supporting image direction
- Story (1080×1920): swipe-up CTA + animated elements
- Carousel (5 slides): narrative arc with copy per slide
- Reel thumbnail: attention-grabbing still frame

Each: copy, visual direction, CTA. Brand: {{brandGuidelines}}. Purpose: {{purpose}}.` },
    ],
  },

  // ── SALES ENABLEMENT AGENT ─────────────────────────────────────────
  {
    id: 'mkt-sales-enablement', title: 'Sales Enablement Kit', category: 'Sales', subcategory: 'Enablement',
    icon: '💼', agent: 'Strategy Agent', persona: 'marketing',
    linkedSkillIds: ['wf-028', 'wf-029', 'wf-030'], source: 'built-in',
    description: 'Complete sales enablement materials: one-pagers, battlecards, meeting briefs, and objection handlers.',
    tags: ['sales', 'enablement', 'battlecard', 'one-pager'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { claude: 'Best for nuanced competitive positioning.', openai: 'GPT-4o good for concise, punchy copy.' },
    variables: ['product', 'competitor', 'targetBuyer', 'dealStage', 'industry', 'avgDealSize'],
    version: 'v2.0', isEditable: true, usageCount: 234, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Full Enablement Kit', wordTarget: '2000-3000 words', prompt: `Create a sales enablement kit for {{product}} targeting {{targetBuyer}} in {{industry}}.

1. **One-Pager** (front/back):
   Front: hero headline + 3 value props + key stat + CTA
   Back: how it works (3 steps) + customer quote + pricing overview
   
2. **Competitive Battlecard** vs {{competitor}}:
   Quick facts comparison → Our strengths (5) → Their weaknesses (5)
   → "When they say X, we say Y" (8 scenarios)
   → Landmine questions to ask prospect → Win/loss pattern insights
   
3. **Meeting Brief Template**:
   Pre-meeting research checklist → agenda template → discovery questions (10)
   → Demo talking points → Next steps closer
   
4. **Objection Handler** (15 objections):
   "Too expensive" → "We already use [competitor]" → "Not a priority"
   → "Need to talk to [stakeholder]" → etc.
   Each: empathize → reframe → proof point → bridge to next step
   
5. **Email Templates** by deal stage:
   Post-discovery → Post-demo → Proposal follow-up → Stalled deal re-engagement

Avg deal size: {{avgDealSize}}. Deal stage: {{dealStage}}.` },
      { variation: 'short', label: 'Quick Battlecard', wordTarget: '300-500 words', prompt: `1-page battlecard: {{product}} vs {{competitor}} for {{targetBuyer}}.

Format: 5 key differences → 3 "when they say/we say" → 3 win themes → 2 landmines → 1 killer question.
Max 400 words. Print-ready for sales team.` },
      { variation: 'executive-summary', label: 'Deal Strategy Brief', wordTarget: '200-300 words', prompt: `Deal strategy brief for selling {{product}} to {{targetBuyer}} in {{industry}}:

Win theme (1 sentence) → 3 value props ranked by buyer priority → top objection + response → recommended demo flow (3 steps) → close strategy.
Max 250 words. Manager-ready for deal review.` },
      { variation: 'email', label: 'Sales Email Templates', wordTarget: '400-600 words', prompt: `5 sales email templates for {{product}} at different deal stages:

1. Cold outreach: 80 words, research-based hook, insight CTA
2. Post-discovery follow-up: summarize pain points, preview solution
3. Post-demo: recap value shown, social proof, next steps
4. Proposal follow-up: urgency without desperation, ROI reminder
5. Re-engagement (stalled): new trigger/content, peer pressure

Each: subject (2 variants), body, CTA. Buyer: {{targetBuyer}}. Industry: {{industry}}.` },
    ],
  },

  // ── BRAND VOICE AGENT ──────────────────────────────────────────────
  {
    id: 'mkt-brand-voice', title: 'Brand Voice & Tone Guide', category: 'Brand', subcategory: 'Voice',
    icon: '🗣️', agent: 'Content Agent', persona: 'marketing',
    linkedSkillIds: ['wf-012'], source: 'built-in',
    description: 'Comprehensive brand voice guide with personality, tone spectrum, do/don\'t examples, and channel adaptation.',
    tags: ['brand', 'voice', 'tone', 'guidelines', 'content-strategy'],
    llmCompatibility: ALL_LLMS,
    variables: ['brandName', 'industry', 'targetAudience', 'competitors', 'existingVoice'],
    version: 'v1.5', isEditable: true, usageCount: 145, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full Voice Guide', wordTarget: '1500-2000 words', prompt: `Create a comprehensive brand voice and tone guide for {{brandName}} ({{industry}}).

1. **Brand Personality** (5 traits): human characteristics — e.g., confident, warm, witty, direct, curious
2. **Voice Principles** (3): each with rationale, example, and counter-example
3. **Tone Spectrum**: how voice adapts across contexts:
   - Celebrating a win vs. addressing a crisis
   - Talking to prospects vs. existing customers
   - Social media vs. legal/compliance content
4. **Writing Rules**:
   - Sentence length, paragraph length, reading level
   - Active vs. passive voice ratio
   - Contraction policy, jargon policy
   - Pronoun usage (we/you/they)
5. **Word Bank**: preferred words (20) and banned words (15)
6. **Channel Guidelines**: email vs. social vs. blog vs. support — tone knobs per channel
7. **Before/After Examples**: 5 paragraphs rewritten from generic to on-brand
8. **Global/Cultural Considerations**: regionalization notes

Current voice description: {{existingVoice}}. Target audience: {{targetAudience}}.` },
      { variation: 'short', label: 'Quick Voice Card', wordTarget: '200-300 words', prompt: `Brand voice card for {{brandName}}: 5 personality traits → 3 "We are X, not Y" statements → 10 power words → 5 banned words → 1 example paragraph.
Max 250 words. Pin-to-desk ready.` },
    ],
  },

  // ── THOUGHT LEADERSHIP AGENT ───────────────────────────────────────
  {
    id: 'mkt-thought-leadership', title: 'Thought Leadership Strategy', category: 'Content', subcategory: 'Thought Leadership',
    icon: '💡', agent: 'Content Agent', persona: 'marketing',
    linkedSkillIds: ['wf-007', 'wf-008', 'wf-009', 'wf-013'], source: 'built-in',
    description: 'Thought leadership content strategy with topics, angles, author positioning, and distribution.',
    tags: ['thought-leadership', 'content-strategy', 'authority', 'linkedin'],
    llmCompatibility: ALL_LLMS,
    variables: ['author', 'authorTitle', 'industry', 'expertise', 'audience', 'frequency'],
    version: 'v1.0', isEditable: true, usageCount: 123, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Full TL Strategy', wordTarget: '1200-1800 words', prompt: `Create a thought leadership content strategy for {{author}} ({{authorTitle}}) in {{industry}}.

1. **Author Positioning**: unique angle — what makes {{author}}'s perspective different
2. **Content Pillars** (3-4): recurring themes that build authority
3. **Topic Calendar** (12 weeks at {{frequency}}):
   Each: topic title, angle, content type (article/post/video/podcast), platform
4. **Hot Takes Repository**: 10 contrarian or bold opinions in the space (with nuance)
5. **Personal Story Bank**: 5 professional experiences to weave into content
6. **Data & Research**: 10 industry stats to reference, with source
7. **Engagement Strategy**: how to build conversation (commenting cadence, response templates)
8. **Measurement**: followers, engagement rate, inbound leads, speaking invitations
9. **Distribution**: primary + amplification channels

Expertise: {{expertise}}. Target audience: {{audience}}.` },
      { variation: 'linkedin', label: 'LinkedIn TL Posts (10)', wordTarget: '1500-2000 words', prompt: `Write 10 LinkedIn thought leadership posts for {{author}} ({{authorTitle}}).

Mix:
- 3 opinion/hot take posts (bold claim → reasoning → ask for debate)
- 3 storytelling posts (personal experience → lesson → call to action)
- 2 data/insight posts (surprising stat → analysis → so-what)
- 2 framework/how-to posts (problem → your method → steps)

Each post: 100-200 words, line breaks every 1-2 sentences, engagement hook at end.
Industry: {{industry}}. Expertise: {{expertise}}.` },
      { variation: 'short', label: 'Quick Topic Ideas', wordTarget: '200-300 words', prompt: `10 thought leadership topic ideas for {{author}} in {{industry}}: each as a LinkedIn post title + 1-sentence angle. Include 3 contrarian takes.` },
    ],
  },

  // ── CONTENT REPURPOSING AGENT ──────────────────────────────────────
  {
    id: 'mkt-content-repurpose', title: 'Content Repurposing Engine', category: 'Content', subcategory: 'Repurposing',
    icon: '🔄', agent: 'Content Agent', persona: 'marketing',
    linkedSkillIds: ['wf-007', 'wf-009', 'wf-011', 'wf-013'], source: 'built-in',
    description: 'Transform one piece of content into 10+ formats across channels — maximum content ROI.',
    tags: ['repurposing', 'content', 'distribution', 'efficiency'],
    llmCompatibility: ALL_LLMS,
    variables: ['sourceContent', 'sourceType', 'brand', 'audience'],
    version: 'v1.5', isEditable: true, usageCount: 189, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full Repurposing Plan', wordTarget: '1500-2000 words', prompt: `Repurpose the following {{sourceType}} into 12+ content pieces.

Source content: {{sourceContent}}

Deliver (write the actual content, not just descriptions):
1. **LinkedIn Post** (150 words): key insight + personal angle
2. **Twitter/X Thread** (8 tweets): numbered, each self-contained
3. **Email Newsletter Segment** (200 words): for {{audience}}
4. **Blog Post Intro** (300 words): expand the core idea
5. **Instagram Carousel** (8 slides): headline + 2-3 bullet points per slide
6. **YouTube/Podcast Script Opening** (2 minutes): hook + preview
7. **Infographic Copy**: headline + 5 data points or steps
8. **Webinar Slide Deck** (5 slides): title + bullet points per slide
9. **Sales Email Insert** (100 words): proof point for outreach
10. **FAQ Entry**: question + 3-paragraph answer
11. **Pull Quotes** (5): shareable one-liners
12. **Internal Slack/Teams Message**: share with team (3 sentences)

Brand: {{brand}}. Maintain consistent voice across all formats.` },
      { variation: 'short', label: 'Quick Repurpose (5 Formats)', wordTarget: '400-600 words', prompt: `Repurpose this {{sourceType}} into 5 quick assets: LinkedIn post → tweet → email snippet → slide headline → pull quote.
Source: {{sourceContent}}. Write the actual copy for each. Brand: {{brand}}.` },
    ],
  },

  // ── CUSTOMER MARKETING AGENT ───────────────────────────────────────
  {
    id: 'mkt-customer-advocacy', title: 'Customer Advocacy Program', category: 'Customer Marketing', subcategory: 'Advocacy',
    icon: '🤝', agent: 'Strategy Agent', persona: 'marketing',
    linkedSkillIds: ['wf-010', 'wf-020', 'wf-024'], source: 'built-in',
    description: 'Customer advocacy program: testimonials, references, community, and review campaigns.',
    tags: ['customer-marketing', 'advocacy', 'testimonials', 'reviews'],
    llmCompatibility: ALL_LLMS,
    variables: ['product', 'customerSegments', 'reviewPlatforms', 'communitySize'],
    version: 'v1.0', isEditable: true, usageCount: 98, rating: 4.2,
    variants: [
      { variation: 'standard', label: 'Full Advocacy Program', wordTarget: '1200-1800 words', prompt: `Design a customer advocacy program for {{product}}.

1. **Testimonial Program**: ask framework (when/how to ask), question templates (10 questions), video testimonial script outline
2. **Review Campaign**: {{reviewPlatforms}} — email templates (ask, reminder, thank-you), incentive structure, response templates (positive + negative)
3. **Reference Program**: tier system (Silver/Gold/Platinum), benefits per tier, reference request workflow
4. **Community Building**: community platform recommendation, content calendar (weekly), engagement mechanics, ambassador program
5. **Case Study Pipeline**: identification criteria, outreach template, interview guide, content template
6. **NPS-to-Advocacy Funnel**: promoter follow-up sequence, detractor recovery, passive nurture
7. **Metrics**: advocacy score, referral rate, review velocity, community engagement

Customer segments: {{customerSegments}}. Community size: {{communitySize}}.` },
      { variation: 'email', label: 'Review Ask Emails', wordTarget: '300-400 words', prompt: `3 emails to ask customers for reviews on {{reviewPlatforms}}:

Email 1 (after positive CSAT/NPS): warm ask + direct link
Email 2 (7 days later): reminder with social proof ("join 200+ reviewers")
Email 3 (14 days later): incentive offer + final ask

Each: subject (2 variants), body (80 words max), CTA. Product: {{product}}.` },
    ],
  },

  // ── PARTNER MARKETING AGENT ────────────────────────────────────────
  {
    id: 'mkt-partner-comarket', title: 'Partner Co-Marketing Kit', category: 'Partnerships', subcategory: 'Co-Marketing',
    icon: '🤲', agent: 'Campaign Agent', persona: 'marketing',
    linkedSkillIds: ['wf-005', 'wf-017'], source: 'built-in',
    description: 'Co-marketing campaign kits with partner alignment, joint content, and shared promotion.',
    tags: ['partnerships', 'co-marketing', 'channel', 'alliance'],
    llmCompatibility: ALL_LLMS,
    variables: ['ourProduct', 'partnerProduct', 'partnerName', 'sharedAudience', 'campaignGoal'],
    version: 'v1.0', isEditable: true, usageCount: 87, rating: 4.1,
    variants: [
      { variation: 'standard', label: 'Full Co-Marketing Kit', wordTarget: '1000-1500 words', prompt: `Create a co-marketing campaign kit for {{ourProduct}} × {{partnerName}} ({{partnerProduct}}).

1. **Joint Value Proposition**: how the products work better together
2. **Co-Branded Content**:
   - Joint blog post outline (1500 words)
   - Co-authored LinkedIn post (each CEO/leader)
   - Joint webinar concept: title, agenda, speakers
   - Solution brief (1-pager): combined value
3. **Promotion Plan**: who promotes what, when, on which channels
4. **Lead Sharing Agreement**: template for lead routing rules
5. **Success Metrics**: shared KPIs and reporting cadence
6. **Legal Checklist**: brand usage, approval process, disclaimers

Shared audience: {{sharedAudience}}. Goal: {{campaignGoal}}.` },
      { variation: 'short', label: 'Quick Partner Brief', wordTarget: '300-400 words', prompt: `Partner co-marketing brief: {{ourProduct}} × {{partnerName}}: joint value prop → 3 campaign ideas → lead sharing model → 3 KPIs. Max 350 words.` },
    ],
  },
];

// --- Deep Engineering Prompts ---
const ENGINEERING_PROMPTS: DeepPrompt[] = [
  {
    id: 'eng-code-review', title: 'PR Code Review', category: 'Code Quality', subcategory: 'Review',
    icon: '🔍', agent: 'Code Review Agent', persona: 'engineering',
    linkedSkillIds: ['eng-001', 'eng-002'], source: 'built-in',
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
    linkedSkillIds: ['eng-003', 'eng-004'], source: 'built-in',
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
    linkedSkillIds: ['eng-008'], source: 'built-in',
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
    linkedSkillIds: ['eng-006'], source: 'built-in',
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
    linkedSkillIds: ['eng-008', 'eng-009'], source: 'built-in',
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
    linkedSkillIds: ['eng-005', 'eng-006'], source: 'built-in',
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
    linkedSkillIds: ['prd-001', 'prd-002'], source: 'built-in',
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
    linkedSkillIds: ['prd-006'], source: 'built-in',
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
    linkedSkillIds: ['prd-010'], source: 'built-in',
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
    linkedSkillIds: ['prd-005'], source: 'built-in',
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
    linkedSkillIds: ['prd-008'], source: 'built-in',
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
    linkedSkillIds: ['prd-007'], source: 'built-in',
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

  // ── USER STORY AGENT ───────────────────────────────────────────────
  {
    id: 'prod-user-stories', title: 'User Story & Acceptance Criteria Generator', category: 'Planning', subcategory: 'Stories',
    icon: '📋', agent: 'Product Strategist Agent', persona: 'product',
    linkedSkillIds: ['prd-004', 'prd-005'], source: 'built-in',
    description: 'Generate detailed user stories with acceptance criteria, edge cases, and technical notes.',
    tags: ['user-stories', 'acceptance-criteria', 'agile', 'scrum'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { claude: 'Best for edge case discovery and thorough AC.', openai: 'GPT-4o good for quick story generation.' },
    variables: ['feature', 'personas', 'context', 'existingBehavior', 'count'],
    version: 'v2.0', isEditable: true, usageCount: 345, rating: 4.7,
    variants: [
      { variation: 'standard', label: 'Full Story Set', wordTarget: '1200-1800 words', prompt: `Generate {{count}} user stories for "{{feature}}".

Context: {{context}}
User personas: {{personas}}
Existing behavior: {{existingBehavior}}

For each story:
1. **Story**: "As a [persona], I want [action], so that [benefit]"
2. **Priority**: P0 (must-have) / P1 (should-have) / P2 (nice-to-have)
3. **Acceptance Criteria** (Given/When/Then):
   - Happy path (2-3 scenarios)
   - Edge cases (2-3 scenarios)
   - Error states (1-2 scenarios)
4. **Technical Notes**: implementation hints, API changes, data model impact
5. **Design Notes**: UI/UX considerations, accessibility requirements
6. **Dependencies**: other stories this depends on or enables
7. **Test Scenarios**: automated test case titles (3-5)
8. **Story Points Estimate**: XS/S/M/L/XL with justification

Group stories into: Core Flow, Edge Cases, Admin/Config. Include a dependency graph.` },
      { variation: 'short', label: 'Quick Stories (5)', wordTarget: '300-500 words', prompt: `5 user stories for "{{feature}}": each as story + 3 acceptance criteria (Given/When/Then) + priority. Max 400 words. Sprint-planning ready.` },
      { variation: 'enterprise', label: 'Enterprise Stories with Compliance', wordTarget: '2000+ words', prompt: `Generate {{count}} user stories for "{{feature}}" with enterprise compliance requirements.

Include standard story format PLUS:
- RBAC/permission requirements for each story
- Audit logging requirements
- Data classification (PII, sensitive, public) for each field
- Multi-tenant considerations
- Accessibility (WCAG 2.1 AA) acceptance criteria
- Internationalization/localization notes
- Performance benchmarks (response time, throughput)
- Security review checklist per story

Personas: {{personas}}. Context: {{context}}.` },
    ],
  },

  // ── JIRA AGENT ─────────────────────────────────────────────────────
  {
    id: 'prod-jira-breakdown', title: 'Epic & Jira Ticket Breakdown', category: 'Planning', subcategory: 'Tickets',
    icon: '🎫', agent: 'Product Strategist Agent', persona: 'product',
    linkedSkillIds: ['prd-003', 'prd-004'], source: 'built-in',
    description: 'Break down features into Jira-ready epics, stories, tasks, and subtasks with estimates.',
    tags: ['jira', 'tickets', 'epic', 'sprint-planning', 'backlog'],
    llmCompatibility: ALL_LLMS,
    variables: ['feature', 'teamComposition', 'sprintDuration', 'techStack', 'constraints'],
    version: 'v2.0', isEditable: true, usageCount: 278, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Full Epic Breakdown', wordTarget: '1500-2000 words', prompt: `Break down "{{feature}}" into Jira-ready tickets.

Team: {{teamComposition}}
Sprint duration: {{sprintDuration}}
Tech stack: {{techStack}}
Constraints: {{constraints}}

Deliver:
1. **Epic**: title, description, labels, components
2. **Stories** (8-12): For each:
   - Title (imperative: "Add X" / "Enable Y")
   - Description: user story format + technical context
   - Acceptance criteria (3-5 bullet points)
   - Story points: 1/2/3/5/8/13
   - Labels: frontend/backend/fullstack/infra/design
   - Subtasks (2-4): concrete implementation tasks
3. **Technical Spikes** (if needed): research questions, time-boxed
4. **Sprint Allocation**: which stories fit in Sprint 1 vs. 2 vs. 3
5. **Definition of Done**: checklist applicable to all stories
6. **Risk Stories**: contingency tickets for known risks

Order by dependency chain. Flag any cross-team dependencies.` },
      { variation: 'short', label: 'Quick Ticket List', wordTarget: '300-500 words', prompt: `Quick Jira breakdown for "{{feature}}": Epic title → 6-8 story titles with points → 2 spikes → sprint allocation. One line per ticket.` },
      { variation: 'enterprise', label: 'Enterprise Feature Decomposition', wordTarget: '2500+ words', prompt: `Enterprise-scale feature decomposition for "{{feature}}".

Include standard breakdown PLUS:
- Security review story (with checklist)
- Performance testing story (with SLOs)
- Documentation stories (API docs, user docs, runbooks)
- Feature flag strategy (rollout plan, kill switch)
- Monitoring & alerting stories (dashboards, alerts)
- Data migration story (if applicable)
- Rollback plan story
- Compliance verification story (SOC2, GDPR)
- Accessibility audit story (WCAG 2.1 AA)

Team: {{teamComposition}}. Tech: {{techStack}}. Constraints: {{constraints}}.` },
    ],
  },

  // ── STAKEHOLDER COMMS AGENT ────────────────────────────────────────
  {
    id: 'prod-stakeholder-update', title: 'Stakeholder Update Generator', category: 'Communication', subcategory: 'Updates',
    icon: '📢', agent: 'Product Comms Agent', persona: 'product',
    linkedSkillIds: ['prd-009'], source: 'built-in',
    description: 'Generate stakeholder updates, status reports, and executive summaries for different audiences.',
    tags: ['stakeholder', 'communication', 'status-report', 'executive'],
    llmCompatibility: ALL_LLMS,
    variables: ['period', 'achievements', 'blockers', 'upcoming', 'metrics', 'audience'],
    version: 'v2.0', isEditable: true, usageCount: 256, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full Status Report', wordTarget: '600-900 words', prompt: `Create a {{period}} product status report for {{audience}}.

Achievements: {{achievements}}
Blockers: {{blockers}}
Upcoming: {{upcoming}}
Metrics: {{metrics}}

Format:
1. **TL;DR** (3 bullet points): top takeaway, biggest risk, key ask
2. **What We Shipped**: feature list with customer impact statement per item
3. **Key Metrics**: {{metrics}} — actual vs. target with trend (↑↓→)
4. **What's Blocked**: each blocker with owner, impact, and resolution plan
5. **What's Next**: priorities for next {{period}} with confidence level (🟢🟡🔴)
6. **Resource Asks**: any additional resources or decisions needed
7. **Customer Signals**: top 3 customer feedback themes
8. **Risks**: RAG status on top 3 risks` },
      { variation: 'executive-summary', label: 'Exec Summary (Board-Ready)', wordTarget: '150-200 words', prompt: `Board-ready product update for {{period}}:

3-sentence summary → Top metric (actual vs. target) → Biggest win → Biggest risk → One ask.
Max 150 words. One slide worth.` },
      { variation: 'email', label: 'Email Update', wordTarget: '200-300 words', prompt: `Email product update for {{audience}} covering {{period}}:

Subject: "[Product] {{period}} Update: [one-line summary]"
Body: Hi team → 3 highlights → 1 concern → what's next → thanks.
Max 200 words. Reply-friendly tone.` },
      { variation: 'short', label: 'Slack/Teams Update', wordTarget: '80-120 words', prompt: `Quick {{period}} product update for Slack/Teams:

📊 Metrics: {{metrics}} (actual vs target)
✅ Shipped: top 3 items
🚧 Blocked: top blocker
📅 Next: top 3 priorities
❓ Need: one ask

Max 100 words. Emoji-formatted, scannable in 10 seconds.` },
    ],
  },

  // ── DISCOVERY AGENT ────────────────────────────────────────────────
  {
    id: 'prod-discovery', title: 'Product Discovery Framework', category: 'Research', subcategory: 'Discovery',
    icon: '🔎', agent: 'Research Agent', persona: 'product',
    linkedSkillIds: ['prd-010'], source: 'built-in',
    description: 'Structured product discovery with opportunity assessment, assumption mapping, and experiment design.',
    tags: ['discovery', 'research', 'opportunity', 'experiments', 'lean'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { claude: 'Best for nuanced opportunity analysis.', perplexity: 'Will enrich with market data.' },
    variables: ['opportunity', 'targetUsers', 'currentSolution', 'constraints', 'hypotheses'],
    version: 'v1.5', isEditable: true, usageCount: 178, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full Discovery Framework', wordTarget: '1500-2000 words', prompt: `Run a structured product discovery for "{{opportunity}}".

Current solution: {{currentSolution}}
Target users: {{targetUsers}}
Known constraints: {{constraints}}
Initial hypotheses: {{hypotheses}}

Deliver:
1. **Opportunity Assessment**:
   - Problem severity (1-10) × frequency (daily/weekly/monthly) × willingness to pay
   - JTBD: 3 jobs-to-be-done in "When [situation], I want to [action], so I can [outcome]" format
   - Opportunity Score (reach × impact × confidence × effort)
2. **Assumption Map**: 4 quadrants — high risk/high confidence → low risk/low confidence
   - List 10 critical assumptions
   - Rank by "most dangerous if wrong"
3. **Experiment Design** (3 experiments):
   For each: hypothesis → experiment type (prototype/concierge/survey/A-B) → success criteria → timeline → cost
4. **Interview Guide**: 15 discovery questions, grouped by theme
5. **Competitive Landscape**: how 3 competitors address this opportunity
6. **Risk Assessment**: desirability × viability × feasibility × usability
7. **Decision Framework**: go/no-go criteria after discovery sprint` },
      { variation: 'short', label: 'Lean Discovery Canvas', wordTarget: '300-500 words', prompt: `Lean discovery canvas for "{{opportunity}}":

Problem (3 sentences) → 3 JTBD → Top 3 assumptions to test → 1 experiment (hypothesis + method + success criteria) → Go/no-go criteria.
Max 400 words. Discovery sprint kickoff ready.` },
      { variation: 'enterprise', label: 'Enterprise Discovery', wordTarget: '2000+ words', prompt: `Enterprise product discovery for "{{opportunity}}" with stakeholder management.

Include standard discovery PLUS:
- Stakeholder alignment matrix: who cares, why, what they need to see
- Buying committee mapping: economic buyer, technical buyer, champion, blocker
- Business case draft: revenue impact, cost savings, strategic value
- Compliance pre-check: regulatory requirements to investigate
- Integration requirements: what systems need to connect
- Change management assessment: organizational readiness
- Pilot program design: 3-month POC structure with success criteria

Target users: {{targetUsers}}. Constraints: {{constraints}}.` },
    ],
  },

  // ── PRIORITIZATION AGENT ───────────────────────────────────────────
  {
    id: 'prod-prioritization', title: 'Feature Prioritization Framework', category: 'Strategy', subcategory: 'Prioritization',
    icon: '⚖️', agent: 'Product Strategist Agent', persona: 'product',
    linkedSkillIds: ['prd-006', 'prd-003'], source: 'built-in',
    description: 'Multi-framework prioritization with RICE, MoSCoW, Kano, and opportunity scoring.',
    tags: ['prioritization', 'rice', 'moscow', 'kano', 'strategy'],
    llmCompatibility: ALL_LLMS,
    variables: ['features', 'teamCapacity', 'quarter', 'objectives', 'constraints'],
    version: 'v1.5', isEditable: true, usageCount: 198, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full Prioritization Analysis', wordTarget: '1200-1800 words', prompt: `Prioritize the following features for {{quarter}}: {{features}}

Team capacity: {{teamCapacity}}
Objectives: {{objectives}}
Constraints: {{constraints}}

Apply multiple frameworks:
1. **RICE Scoring**: Reach × Impact × Confidence ÷ Effort — table with justification per score
2. **MoSCoW**: Must-have / Should-have / Could-have / Won't-have — with rationale
3. **Kano Model**: Must-be / One-dimensional / Attractive / Indifferent / Reverse
4. **Opportunity Score**: Importance vs. Satisfaction gap analysis
5. **Value vs. Effort Matrix**: 2×2 quadrant plot
6. **Final Stack Rank**: combined recommendation with reasoning
7. **What We're Saying No To**: explicit trade-offs and communication plan
8. **Sequencing**: recommended build order considering dependencies
9. **Stakeholder Communication**: how to frame priorities for leadership` },
      { variation: 'short', label: 'Quick RICE Table', wordTarget: '200-300 words', prompt: `RICE score table for: {{features}}. Columns: Feature | Reach | Impact | Confidence | Effort | Score. Sort descending. Add 1-line justification per score. Top 3 = do, bottom 3 = defer.` },
      { variation: 'executive-summary', label: 'Priority Slide', wordTarget: '100-150 words', prompt: `{{quarter}} priorities for exec review: Top 3 features (1 sentence each: what + why + expected impact) → What we're NOT doing (3 items) → Big bet. Max 100 words. One slide.` },
    ],
  },

  // ── CUSTOMER FEEDBACK AGENT ────────────────────────────────────────
  {
    id: 'prod-feedback-synthesis', title: 'Customer Feedback Synthesizer', category: 'Research', subcategory: 'Feedback',
    icon: '🎧', agent: 'Research Agent', persona: 'product',
    linkedSkillIds: ['prd-010'], source: 'built-in',
    description: 'Synthesize customer feedback from multiple sources into actionable themes and recommendations.',
    tags: ['feedback', 'synthesis', 'voice-of-customer', 'insights'],
    llmCompatibility: ALL_LLMS,
    variables: ['feedbackData', 'sources', 'product', 'period', 'segmentation'],
    version: 'v1.5', isEditable: true, usageCount: 167, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Feedback Synthesis', wordTarget: '1200-1600 words', prompt: `Synthesize customer feedback for {{product}} from {{period}}.

Sources: {{sources}}
Segmentation: {{segmentation}}
Feedback data: {{feedbackData}}

Deliver:
1. **Executive Summary**: 3-sentence overview of customer sentiment
2. **Theme Analysis** (top 5 themes):
   For each: theme name → frequency (%) → sentiment (positive/negative/mixed) → representative quotes (3) → severity → recommended action
3. **Segment Breakdown**: how feedback differs by {{segmentation}}
4. **NPS/CSAT Drivers**: top 3 promoter reasons, top 3 detractor reasons
5. **Feature Requests Heat Map**: ranked by frequency × urgency
6. **Churn Risk Signals**: patterns that correlate with churn
7. **Quick Wins**: 5 low-effort improvements with high customer impact
8. **Strategic Issues**: 3 deep problems requiring product strategy changes
9. **Competitive Mentions**: what customers say about alternatives
10. **Action Plan**: prioritized recommendations with owner suggestions` },
      { variation: 'short', label: 'Quick Insight Summary', wordTarget: '200-300 words', prompt: `Customer feedback summary for {{product}} ({{period}}): Top 3 themes (each: theme + frequency + recommended action) → 3 quick wins → 1 strategic concern. Max 250 words.` },
      { variation: 'executive-summary', label: 'Board Feedback Summary', wordTarget: '100-150 words', prompt: `Board-ready customer feedback for {{product}} ({{period}}): Overall sentiment → Net promoter driver → Biggest risk → One action to take. Max 100 words.` },
    ],
  },

  // ── LAUNCH CHECKLIST AGENT ─────────────────────────────────────────
  {
    id: 'prod-launch-checklist', title: 'Product Launch Checklist', category: 'Launch', subcategory: 'Execution',
    icon: '✈️', agent: 'Product Comms Agent', persona: 'product',
    linkedSkillIds: ['prd-008', 'prd-009'], source: 'built-in',
    description: 'Comprehensive pre-launch, launch-day, and post-launch checklists with owners and timelines.',
    tags: ['launch', 'checklist', 'execution', 'go-to-market'],
    llmCompatibility: ALL_LLMS,
    variables: ['feature', 'launchDate', 'teamMembers', 'launchType', 'channels'],
    version: 'v1.5', isEditable: true, usageCount: 212, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Full Launch Checklist', wordTarget: '1000-1500 words', prompt: `Create a product launch checklist for "{{feature}}" launching {{launchDate}}.

Launch type: {{launchType}} (major/minor/beta/GA)
Channels: {{channels}}
Team: {{teamMembers}}

**T-14 Days (Pre-Launch)**:
□ Product: feature complete, QA passed, performance tested
□ Docs: help center articles, API docs, changelog draft
□ Marketing: blog post, email, social posts drafted
□ Sales: enablement deck, talk track, FAQ
□ Support: runbook, escalation path, known issues list
□ Legal: ToS update review, privacy impact assessment
□ Comms: press release (if applicable), analyst briefing

**T-1 Day (Final Check)**:
□ Feature flag: verified in staging
□ Monitoring: dashboards + alerts configured
□ Rollback: plan tested
□ Status page: ready to update
□ Support: team briefed, shifts covered

**Launch Day (T-0)**:
□ Feature flag: flip (% rollout plan)
□ Publish: blog, email, social, in-app announcement
□ Monitor: error rates, latency, support tickets
□ Respond: social mentions, community posts
□ Internal: Slack announcement, celebrate 🎉

**T+7 Days (Post-Launch)**:
□ Metrics review: adoption, engagement, feedback
□ Bug triage: critical → fixed, non-critical → backlog
□ Customer outreach: early adopter check-ins
□ Retrospective: what went well, what didn't, action items
□ Documentation: update based on early questions

Each item: owner → due date → status (done/in-progress/blocked).` },
      { variation: 'short', label: 'Quick Launch Checklist', wordTarget: '200-300 words', prompt: `Quick launch checklist for "{{feature}}" on {{launchDate}}: 5 pre-launch items → 3 launch-day items → 3 post-launch items. Checkbox format with owner. Max 200 words.` },
    ],
  },

  // ── PRICING AGENT ──────────────────────────────────────────────────
  {
    id: 'prod-pricing', title: 'Pricing Strategy Analysis', category: 'Strategy', subcategory: 'Pricing',
    icon: '💰', agent: 'Product Strategist Agent', persona: 'product',
    linkedSkillIds: ['prd-007', 'prd-002'], source: 'built-in',
    description: 'Pricing strategy analysis with models, packaging, competitive benchmarking, and willingness-to-pay.',
    tags: ['pricing', 'strategy', 'packaging', 'monetization'],
    llmCompatibility: ALL_LLMS,
    variables: ['product', 'currentPricing', 'competitors', 'targetSegments', 'costStructure'],
    version: 'v1.0', isEditable: true, usageCount: 134, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Pricing Analysis', wordTarget: '1500-2000 words', prompt: `Perform a pricing strategy analysis for {{product}}.

Current pricing: {{currentPricing}}
Competitors: {{competitors}}
Target segments: {{targetSegments}}
Cost structure: {{costStructure}}

Deliver:
1. **Pricing Model Options**: per-seat vs. usage-based vs. flat-rate vs. hybrid — pros/cons for each
2. **Competitive Benchmark**: pricing comparison table (feature tier × competitor)
3. **Value Metric Analysis**: what is the unit of value you're pricing on? Is it correlated with customer value?
4. **Packaging Recommendation**: Free / Starter / Pro / Enterprise tiers with feature distribution
5. **Willingness-to-Pay Research Design**: Van Westendorp or Gabor-Granger survey questions
6. **Price Sensitivity**: elastic vs. inelastic features
7. **Expansion Revenue Strategy**: upgrade triggers, add-on opportunities
8. **Discount Policy**: when discounts are allowed, max thresholds, approval matrix
9. **Pricing Communication**: how to explain pricing changes to customers
10. **Financial Impact Model**: revenue projection at 3 price points` },
      { variation: 'short', label: 'Quick Pricing Rec', wordTarget: '300-500 words', prompt: `Pricing recommendation for {{product}}: Recommended model → 3 tiers (name, price, key features) → competitive position → one risk. Max 400 words.` },
      { variation: 'executive-summary', label: 'Board Pricing Proposal', wordTarget: '150-200 words', prompt: `Pricing proposal for board: Current situation → Recommended change → Expected revenue impact → Risk → Timeline. Max 150 words.` },
    ],
  },

  // ── A/B EXPERIMENT AGENT ───────────────────────────────────────────
  {
    id: 'prod-experiment', title: 'Product Experiment Design', category: 'Growth', subcategory: 'Experimentation',
    icon: '🧪', agent: 'Analytics Agent', persona: 'product',
    linkedSkillIds: ['prd-005'], source: 'built-in',
    description: 'Design product experiments with hypothesis, metrics, sample size, and analysis plan.',
    tags: ['experiment', 'ab-test', 'growth', 'data-driven', 'hypothesis'],
    llmCompatibility: ALL_LLMS,
    variables: ['area', 'hypothesis', 'primaryMetric', 'currentValue', 'minDetectable', 'segmentation'],
    version: 'v1.5', isEditable: true, usageCount: 156, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Experiment Brief', wordTarget: '800-1200 words', prompt: `Design a product experiment for {{area}}.

Hypothesis: {{hypothesis}}
Primary metric: {{primaryMetric}} (current: {{currentValue}})
Minimum detectable effect: {{minDetectable}}
Segmentation: {{segmentation}}

Deliver:
1. **Hypothesis Statement**: "If we [change], then [metric] will [direction] by [amount], because [reasoning]"
2. **Experiment Type**: A/B test / multivariate / feature flag / holdout
3. **Variants**: control vs. treatment(s) — detailed description of each
4. **Sample Size Calculation**: based on {{currentValue}}, {{minDetectable}}, 95% confidence, 80% power
5. **Duration Estimate**: based on traffic and sample size
6. **Guardrail Metrics**: what MUST NOT degrade (list 3-5)
7. **Segmentation Plan**: how to analyze by {{segmentation}}
8. **Instrumentation**: events to track, event schema
9. **Analysis Plan**: statistical test, pre/post, novelty effect check
10. **Decision Framework**: ship / iterate / kill criteria
11. **Risks**: sample ratio mismatch, novelty bias, interaction effects
12. **Communication**: how to share results (regardless of outcome)` },
      { variation: 'short', label: 'Quick Experiment Card', wordTarget: '200-300 words', prompt: `Experiment card for {{area}}: Hypothesis (1 sentence) → Metric + baseline + target → Duration → Ship/kill criteria. Max 200 words. Standup-ready.` },
    ],
  },

  // ── ONBOARDING AGENT ───────────────────────────────────────────────
  {
    id: 'prod-onboarding', title: 'User Onboarding Flow Design', category: 'Growth', subcategory: 'Onboarding',
    icon: '🚪', agent: 'Product Strategist Agent', persona: 'product',
    linkedSkillIds: ['prd-001', 'prd-004'], source: 'built-in',
    description: 'Design user onboarding flows with activation metrics, tooltips, checklists, and email triggers.',
    tags: ['onboarding', 'activation', 'ux', 'growth', 'retention'],
    llmCompatibility: ALL_LLMS,
    variables: ['product', 'userType', 'activationMetric', 'currentActivation', 'timeToValue'],
    version: 'v1.0', isEditable: true, usageCount: 145, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Full Onboarding Design', wordTarget: '1200-1600 words', prompt: `Design a user onboarding flow for {{product}} ({{userType}}).

Activation metric: {{activationMetric}} (current rate: {{currentActivation}})
Target time-to-value: {{timeToValue}}

Deliver:
1. **Aha Moment Definition**: what is the moment the user "gets it"?
2. **Activation Funnel**: signup → step 1 → step 2 → ... → aha moment (with expected drop-off %)
3. **In-App Flow** (step by step):
   For each step: action, UI element (tooltip/modal/checklist/empty state), copy (heading + body), CTA
4. **Onboarding Checklist**: 5-7 items, ordered by value delivered
5. **Email Triggers** (5 emails):
   - Welcome (immediate)
   - Incomplete onboarding (24h)
   - First value moment celebration (event-triggered)
   - Feature discovery (Day 3)
   - Re-engagement (Day 7 if inactive)
6. **Progressive Disclosure**: what to show now vs. later vs. on-demand
7. **Personalization**: how to adapt onboarding by role/use-case
8. **Metrics**: activation rate, time-to-value, onboarding completion, Day 1/7/30 retention
9. **Experiments**: 3 onboarding experiments to run` },
      { variation: 'short', label: 'Quick Onboarding Checklist', wordTarget: '200-300 words', prompt: `Onboarding checklist design for {{product}}: 6 checklist items (action + why it matters) → activation metric → 3 triggered emails (trigger + subject). Max 250 words.` },
    ],
  },

  // ── BRD AGENT ──────────────────────────────────────────────────────
  {
    id: 'prod-brd', title: 'Business Requirements Document', category: 'Planning', subcategory: 'Business Requirements',
    icon: '📑', agent: 'Product Strategist Agent', persona: 'product',
    linkedSkillIds: ['prd-002'], source: 'built-in',
    description: 'Enterprise BRD with business case, stakeholder analysis, ROI projections, and compliance requirements.',
    tags: ['brd', 'business-requirements', 'enterprise', 'planning'],
    llmCompatibility: ALL_LLMS,
    variables: ['initiative', 'businessProblem', 'stakeholders', 'budget', 'timeline', 'successCriteria'],
    version: 'v1.5', isEditable: true, usageCount: 189, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full BRD', wordTarget: '2000-3000 words', prompt: `Create a Business Requirements Document for "{{initiative}}".

Business problem: {{businessProblem}}
Stakeholders: {{stakeholders}}
Budget: {{budget}}
Timeline: {{timeline}}
Success criteria: {{successCriteria}}

BRD Structure:
1. **Executive Summary**: problem, proposed solution, expected ROI
2. **Business Case**: current state, desired state, gap analysis, cost of inaction
3. **Stakeholder Analysis**: RACI matrix, decision authority, communication needs
4. **Scope**: in-scope, out-of-scope, future phases
5. **Business Requirements** (15-20): each with ID, description, priority (M/S/C/W), source, acceptance criteria
6. **Process Flows**: current vs. proposed (describe as flowchart steps)
7. **Data Requirements**: data sources, transformations, quality requirements
8. **Integration Requirements**: systems to integrate, API needs
9. **Non-Functional Requirements**: security, performance, compliance, availability
10. **ROI Analysis**: 3-year TCO, revenue/savings projections, payback period
11. **Risk Register**: 5+ risks with probability × impact → mitigation
12. **Implementation Phases**: phased rollout with milestones
13. **Change Management**: training needs, communication plan, go-live support
14. **Glossary**: business terms defined` },
      { variation: 'short', label: 'Lean BRD', wordTarget: '500-700 words', prompt: `Lean BRD for "{{initiative}}": Problem (3 sentences) → Solution → 8 business requirements (ID + description + priority) → ROI summary → Timeline → Top 3 risks. Max 600 words.` },
      { variation: 'executive-summary', label: 'BRD Exec Summary', wordTarget: '150 words', prompt: `BRD executive summary for "{{initiative}}": Business need → Proposed approach → Expected ROI → Investment required → Decision needed. Max 150 words. Board-slide ready.` },
    ],
  },
];

// --- Deep HR & TA Prompts ---
const HR_PROMPTS: DeepPrompt[] = [
  // ── JOB DESCRIPTION ────────────────────────────────────────────────
  {
    id: 'hr-jd-generator', title: 'Job Description Generator', category: 'Talent Acquisition', subcategory: 'Job Descriptions',
    icon: '📝', agent: 'TA Strategist Agent', persona: 'hr',
    linkedSkillIds: ['hr-001'], source: 'built-in',
    description: 'Generate inclusive, structured, and compelling job descriptions from a hiring manager brief.',
    tags: ['job-description', 'hiring', 'dei', 'talent-acquisition'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { claude: 'Best for nuanced DEI language audits.', perplexity: 'Good for comp range research.' },
    variables: ['roleTitle', 'department', 'level', 'hiringManagerBrief', 'locationType', 'compRange', 'companyValues'],
    version: 'v2.0', isEditable: true, usageCount: 312, rating: 4.7,
    variants: [
      { variation: 'standard', label: 'Full JD with DEI Audit', wordTarget: '800-1200 words', prompt: `Create a job description for "{{roleTitle}}" in {{department}} ({{level}}).

Hiring manager brief: {{hiringManagerBrief}}
Location: {{locationType}}
Comp range: {{compRange}}
Company values: {{companyValues}}

Generate:
1. **Role Summary** (3-4 sentences): what this role does, why it matters, who they report to
2. **What You'll Do** (8-10 bullets): specific responsibilities, not generic fluff
3. **What You Bring** (split):
   - Must-haves (5-6): non-negotiable skills/experience
   - Nice-to-haves (3-4): bonus qualifications
4. **Why Join Us**: culture highlights, mission, growth opportunities
5. **Compensation & Benefits**: salary range, equity, benefits highlights
6. **DEI Audit Report**:
   - Flagged terms (gendered/exclusionary language)
   - Suggested alternatives
   - Inclusion score (1-10)
   - Recommendations for broader candidate pool

Use active voice, "you" language, no jargon. Keep requirements realistic — no unicorn asks.` },
      { variation: 'short', label: 'Quick JD', wordTarget: '200-300 words', prompt: `Quick job description for "{{roleTitle}}" ({{level}}, {{locationType}}): Role summary (2 sentences) → 6 responsibilities → 4 must-haves → 2 nice-to-haves → comp range. Max 250 words. Job board ready.` },
      { variation: 'linkedin', label: 'LinkedIn Job Post', wordTarget: '150-200 words', prompt: `LinkedIn job post for "{{roleTitle}}": Hook line → 3-sentence role pitch → 5 key requirements → 1 culture highlight → apply CTA. Max 150 words. Engaging, scroll-stopping tone.` },
      { variation: 'enterprise', label: 'Enterprise JD with Compliance', wordTarget: '1200+ words', prompt: `Enterprise-grade job description for "{{roleTitle}}" in {{department}}.

Include standard JD PLUS:
- Legal compliance statements (EEO, ADA, E-Verify)
- Security clearance requirements (if applicable)
- Physical requirements disclosure
- Background check notice
- Internal job grade and career ladder mapping
- Competency framework alignment
- Interview process overview (what to expect)

Hiring brief: {{hiringManagerBrief}}. Comp: {{compRange}}. Location: {{locationType}}.` },
    ],
  },

  // ── RESUME SCREENING ───────────────────────────────────────────────
  {
    id: 'hr-resume-screening', title: 'Resume Screening & Shortlisting', category: 'Talent Acquisition', subcategory: 'Screening',
    icon: '📄', agent: 'TA Strategist Agent', persona: 'hr',
    linkedSkillIds: ['hr-002'], source: 'built-in',
    description: 'Screen candidates, generate fit scores, and produce a ranked shortlist with bias mitigation.',
    tags: ['resume', 'screening', 'shortlist', 'bias-mitigation'],
    llmCompatibility: ALL_LLMS,
    variables: ['jobDescription', 'screeningCriteria', 'shortlistSize', 'dealBreakers'],
    version: 'v2.0', isEditable: true, usageCount: 278, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Full Screening Report', wordTarget: '1000-1500 words', prompt: `Screen candidates against this JD: {{jobDescription}}

Screening criteria: {{screeningCriteria}}
Shortlist: {{shortlistSize}}
Deal breakers: {{dealBreakers}}

For each candidate:
1. **Fit Score** (0-100): weighted against criteria
2. **Strengths**: top 3 qualifications that match
3. **Gaps**: areas that don't meet requirements
4. **Red Flags**: employment gaps, inconsistencies, deal breaker matches
5. **Notes**: interesting signals, career trajectory, culture fit indicators

Deliverables:
- Ranked shortlist table: Name | Score | Top Strength | Biggest Gap | Recommendation
- Screening methodology: how weights were applied
- Diversity note: ensure no bias in ranking rationale
- Next steps: recommended interview tracks per candidate` },
      { variation: 'short', label: 'Quick Shortlist', wordTarget: '200-300 words', prompt: `Quick screening for {{shortlistSize}}: Rank candidates by fit score → 1-line justification each → top 3 to interview → 1 borderline. Table format. Max 200 words.` },
    ],
  },

  // ── INTERVIEW KIT ──────────────────────────────────────────────────
  {
    id: 'hr-interview-kit', title: 'Interview Kit & Question Bank', category: 'Talent Acquisition', subcategory: 'Interviews',
    icon: '🎤', agent: 'Interview Design Agent', persona: 'hr',
    linkedSkillIds: ['hr-003'], source: 'built-in',
    description: 'Generate structured interview kits with competency-based questions, STAR prompts, and scoring rubrics.',
    tags: ['interview', 'hiring', 'competency', 'rubric'],
    llmCompatibility: ALL_LLMS,
    variables: ['roleTitle', 'competencies', 'interviewRounds', 'interviewStyle', 'level'],
    version: 'v2.0', isEditable: true, usageCount: 245, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Full Interview Kit', wordTarget: '1500-2000 words', prompt: `Create an interview kit for "{{roleTitle}}" ({{level}}).

Competencies to assess: {{competencies}}
Interview rounds: {{interviewRounds}}
Interview style: {{interviewStyle}}

For each round:
1. **Round Name** & duration & interviewer role
2. **Competencies Covered**: which 2-3 competencies this round assesses
3. **Questions** (4-6 per round):
   - Question text
   - What it tests
   - STAR follow-up probes (Situation, Task, Action, Result)
   - Scoring rubric: 1 (poor) → 5 (exceptional) with behavioral anchors
4. **Red Flags**: what to watch for
5. **Green Flags**: standout answers

Also include:
- Opening script (warm-up, set expectations)
- Closing script (candidate questions, next steps)
- Anti-bias reminders for each round
- Composite scorecard template
- Debrief guide: how to run the hiring committee meeting` },
      { variation: 'short', label: 'Quick Question Bank', wordTarget: '300-500 words', prompt: `10 interview questions for "{{roleTitle}}" covering {{competencies}}: Each with question → what it tests → 1 STAR follow-up → red flag answer vs green flag. Max 400 words.` },
      { variation: 'enterprise', label: 'Enterprise Interview Process', wordTarget: '2000+ words', prompt: `Enterprise interview process design for "{{roleTitle}}" ({{level}}).

Include standard kit PLUS:
- Panel diversity requirements per round
- Accessibility accommodations checklist
- Remote interview logistics and tech setup
- Legal do's and don'ts for interviewers
- Candidate experience survey (post-interview)
- Structured scoring calibration protocol
- Decision framework: hire/strong hire/no hire criteria
- Background/reference check questions (5)

Competencies: {{competencies}}. Rounds: {{interviewRounds}}.` },
    ],
  },

  // ── ONBOARDING ─────────────────────────────────────────────────────
  {
    id: 'hr-onboarding', title: '30-60-90 Onboarding Plan', category: 'People Success', subcategory: 'Onboarding',
    icon: '🎯', agent: 'People Ops Agent', persona: 'hr',
    linkedSkillIds: ['hr-005'], source: 'built-in',
    description: 'Create tailored onboarding plans with milestones, buddy systems, and check-in cadence.',
    tags: ['onboarding', '30-60-90', 'new-hire', 'people-ops'],
    llmCompatibility: ALL_LLMS,
    variables: ['newHireName', 'roleTitle', 'department', 'managerName', 'startDate', 'buddy', 'workArrangement'],
    version: 'v2.0', isEditable: true, usageCount: 198, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full 30-60-90 Plan', wordTarget: '1200-1600 words', prompt: `Create a 30-60-90 day onboarding plan for {{newHireName}} ({{roleTitle}}, {{department}}).

Manager: {{managerName}}
Start date: {{startDate}}
Buddy: {{buddy}}
Work arrangement: {{workArrangement}}

**Pre-Day 1** (1 week before):
- IT provisioning: laptop, accounts, tool access
- Welcome email from manager (draft included)
- Buddy introduction email (draft included)
- First week calendar pre-populated

**Day 1-30 (Learn)**:
- Week 1: orientation, meet the team, tool setup, culture immersion
- Week 2-3: shadow key meetings, read core docs, 1:1 with stakeholders
- Week 4: first small deliverable, 30-day check-in with manager
- Milestone: can explain team mission and their role in it

**Day 31-60 (Contribute)**:
- Owns first project or workstream
- Presents at team meeting
- 60-day check-in: feedback exchange
- Milestone: independently handles routine work

**Day 61-90 (Own)**:
- Leads a project or initiative
- Mentors or documents a process
- 90-day review: goal setting for next quarter
- Milestone: fully productive, positive team impact

Each milestone: objective → activities → success criteria → resources.
Include check-in schedule: weekly 1:1s, bi-weekly buddy syncs, 30/60/90 reviews.` },
      { variation: 'short', label: 'Quick Onboarding Checklist', wordTarget: '200-300 words', prompt: `Onboarding checklist for {{newHireName}} ({{roleTitle}}): Pre-Day 1 (5 items) → Week 1 (5 items) → Month 1 goal → Month 2 goal → Month 3 goal. Checkbox format. Max 250 words.` },
      { variation: 'email', label: 'Manager Welcome Email', wordTarget: '150-200 words', prompt: `Write a warm welcome email from {{managerName}} to {{newHireName}} starting as {{roleTitle}} on {{startDate}}.

Include: excitement, what first week looks like, buddy name ({{buddy}}), one fun team fact, practical logistics. Max 150 words. Authentic, not corporate.` },
    ],
  },

  // ── PERFORMANCE REVIEW ─────────────────────────────────────────────
  {
    id: 'hr-performance-review', title: 'Performance Review Generator', category: 'People Success', subcategory: 'Performance',
    icon: '📊', agent: 'Performance & Growth Agent', persona: 'hr',
    linkedSkillIds: ['hr-006'], source: 'built-in',
    description: 'Generate structured performance reviews from self-assessments, peer feedback, and manager notes.',
    tags: ['performance-review', 'feedback', 'growth-plan', 'rating'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { claude: 'Best for nuanced feedback synthesis and growth recommendations.' },
    variables: ['employeeName', 'roleTitle', 'reviewPeriod', 'selfAssessment', 'peerFeedback', 'managerNotes', 'priorGoals', 'competencyFramework'],
    version: 'v2.0', isEditable: true, usageCount: 267, rating: 4.6,
    variants: [
      { variation: 'standard', label: 'Full Performance Review', wordTarget: '1200-1800 words', prompt: `Generate a performance review for {{employeeName}} ({{roleTitle}}) for {{reviewPeriod}}.

Self-assessment: {{selfAssessment}}
Peer feedback: {{peerFeedback}}
Manager notes: {{managerNotes}}
Prior goals: {{priorGoals}}
Framework: {{competencyFramework}}

Deliver:
1. **Overall Summary** (3-4 sentences): performance snapshot, trajectory, sentiment
2. **Goal Achievement** (per prior goal):
   - Goal → Outcome → Rating (Exceeded / Met / Partially Met / Not Met)
   - Evidence from self-assessment + manager observations
3. **Competency Ratings** (per framework dimension):
   - Dimension → Rating (1-5) → Evidence → Growth area
4. **Strengths** (top 3): what they do exceptionally well, with examples
5. **Development Areas** (2-3): honest, actionable, specific growth opportunities
6. **Overall Rating**: Exceptional / Exceeds / Meets / Below / Needs Improvement
7. **Growth Plan** (next quarter):
   - 3 specific goals (SMART format)
   - Skill development recommendations
   - Stretch assignment suggestion
8. **Promotion Readiness**: Ready Now / 6 months / 12 months / Not yet — with explanation
9. **Manager Talking Points**: key messages for the review conversation` },
      { variation: 'short', label: 'Quick Review Summary', wordTarget: '200-300 words', prompt: `Performance summary for {{employeeName}} ({{reviewPeriod}}): Overall rating → 3 strengths → 2 growth areas → 3 next-quarter goals. Max 250 words. Conversation-ready.` },
      { variation: 'executive-summary', label: 'Calibration Doc', wordTarget: '100-150 words', prompt: `Calibration summary for {{employeeName}} ({{roleTitle}}, {{reviewPeriod}}): Rating → 1-line justification → Promotion readiness → Comp recommendation. Max 100 words. Calibration meeting ready.` },
    ],
  },

  // ── ENGAGEMENT SURVEY ──────────────────────────────────────────────
  {
    id: 'hr-engagement-survey', title: 'Engagement Survey Analysis', category: 'People Success', subcategory: 'Engagement',
    icon: '📈', agent: 'Engagement & Culture Agent', persona: 'hr',
    linkedSkillIds: ['hr-007'], source: 'built-in',
    description: 'Analyze engagement survey results with theme extraction, sentiment trends, and action plans.',
    tags: ['engagement', 'survey', 'sentiment', 'culture', 'analytics'],
    llmCompatibility: ALL_LLMS,
    variables: ['surveyName', 'surveyData', 'comparisonPeriod', 'breakdownDimensions', 'openEndedResponses'],
    version: 'v1.5', isEditable: true, usageCount: 156, rating: 4.4,
    variants: [
      { variation: 'standard', label: 'Full Survey Analysis', wordTarget: '1500-2000 words', prompt: `Analyze engagement survey "{{surveyName}}".

Data: {{surveyData}}
Compare to: {{comparisonPeriod}}
Break down by: {{breakdownDimensions}}
Open-ended: {{openEndedResponses}}

Deliver:
1. **Executive Summary**: 3-sentence overview, overall score, trend direction
2. **Score Breakdown**: category scores (scale 1-5 or %) with trend vs. {{comparisonPeriod}}
3. **Top 3 Strengths**: what employees love, with representative quotes
4. **Top 3 Concerns**: where satisfaction is lowest, with context
5. **Segment Analysis** by {{breakdownDimensions}}:
   - Which segments are happiest vs. most at-risk
   - Statistically significant differences
6. **Theme Analysis** (from open-ended):
   - Top 5 themes by frequency
   - Sentiment per theme (positive/negative/mixed)
   - Representative quotes (anonymized)
7. **Flight Risk Signals**: patterns correlating with attrition
8. **Action Plan** (prioritized):
   - 5 recommendations: what to do → expected impact → owner → timeline
   - 3 quick wins (< 2 weeks)
   - 2 strategic initiatives (quarter-long)
9. **Manager Toolkit**: talking points for managers discussing results with teams` },
      { variation: 'short', label: 'Quick Pulse Summary', wordTarget: '200-300 words', prompt: `Engagement pulse summary for "{{surveyName}}": Overall score → Top 3 strengths → Top 3 concerns → 3 recommended actions. Max 250 words. Leadership briefing ready.` },
      { variation: 'executive-summary', label: 'Board Engagement Update', wordTarget: '100-150 words', prompt: `Board-ready engagement update: Overall score + trend → Biggest win → Biggest risk → One action underway. Max 100 words.` },
    ],
  },

  // ── COMPENSATION BENCHMARK ─────────────────────────────────────────
  {
    id: 'hr-comp-benchmark', title: 'Compensation Benchmarking Report', category: 'Total Rewards', subcategory: 'Compensation',
    icon: '💰', agent: 'Total Rewards Agent', persona: 'hr',
    linkedSkillIds: ['hr-008'], source: 'built-in',
    description: 'Benchmark compensation against market data with pay bands, equity guidelines, and total comp analysis.',
    tags: ['compensation', 'benchmarking', 'pay-bands', 'total-rewards'],
    llmCompatibility: ALL_LLMS,
    llmNotes: { perplexity: 'Best for real-time market data research.' },
    variables: ['roleTitle', 'level', 'location', 'industry', 'currentComp', 'compPhilosophy'],
    version: 'v1.5', isEditable: true, usageCount: 189, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full Comp Report', wordTarget: '800-1200 words', prompt: `Benchmark compensation for "{{roleTitle}}" ({{level}}) in {{location}}.

Industry: {{industry}}
Current comp: {{currentComp}}
Comp philosophy: {{compPhilosophy}}

Deliver:
1. **Market Data Summary**: sources, methodology, data recency
2. **Base Salary Bands**: P25 / P50 / P75 / P90 for this role + level + location
3. **Total Comp Breakdown**: base + bonus + equity + benefits value
4. **Comparison Table**: our offer vs. market percentiles
5. **Geographic Adjustments**: how location impacts comp (cost-of-labor index)
6. **Equity Benchmarks**: typical grant size, vesting schedule, refresh grants
7. **Internal Equity Check**: how this compares to similar roles internally
8. **Recommendation**: suggested comp range based on {{compPhilosophy}}
9. **Negotiation Guidance**: walkaway point, flex components, non-cash alternatives` },
      { variation: 'short', label: 'Quick Comp Check', wordTarget: '200-300 words', prompt: `Quick comp benchmark for "{{roleTitle}}" ({{level}}, {{location}}): P25/P50/P75 base → total comp range → our position → recommendation. Max 200 words. Decision-ready.` },
    ],
  },

  // ── OFFER LETTER ───────────────────────────────────────────────────
  {
    id: 'hr-offer-letter', title: 'Offer Letter Generator', category: 'Talent Acquisition', subcategory: 'Offers',
    icon: '💼', agent: 'TA Strategist Agent', persona: 'hr',
    linkedSkillIds: ['hr-004'], source: 'built-in',
    description: 'Generate personalized offer letters with compensation, equity, benefits, and compliance checks.',
    tags: ['offer-letter', 'compensation', 'hiring', 'compliance'],
    llmCompatibility: ALL_LLMS,
    variables: ['candidateName', 'roleTitle', 'compensation', 'equity', 'startDate', 'signingBonus', 'specialTerms'],
    version: 'v1.5', isEditable: true, usageCount: 234, rating: 4.5,
    variants: [
      { variation: 'standard', label: 'Full Offer Letter', wordTarget: '600-900 words', prompt: `Generate an offer letter for {{candidateName}} for the role of {{roleTitle}}.

Compensation: {{compensation}}
Equity: {{equity}}
Start date: {{startDate}}
Signing bonus: {{signingBonus}}
Special terms: {{specialTerms}}

Include:
1. **Opening**: warm congratulations, role confirmation
2. **Compensation**: base salary, pay frequency, bonus structure
3. **Equity**: grant details, vesting schedule, cliff
4. **Benefits**: health, dental, vision, 401(k), PTO, parental leave
5. **Signing Bonus**: amount, clawback terms
6. **Start Details**: date, location, first-day logistics
7. **Special Terms**: {{specialTerms}}
8. **At-Will Statement**: employment relationship disclaimer
9. **Acceptance**: signature block, deadline (5 business days)
10. **Compliance**: EEO statement, background check consent

Tone: warm but professional. Make the candidate feel wanted.` },
      { variation: 'short', label: 'Quick Offer Summary', wordTarget: '150-200 words', prompt: `Offer summary email for {{candidateName}} ({{roleTitle}}): Congratulations → base + equity + bonus → start date → accept by when → excitement. Max 150 words. Pre-formal-letter teaser.` },
    ],
  },

  // ── HR POLICY ──────────────────────────────────────────────────────
  {
    id: 'hr-policy-gen', title: 'HR Policy Generator', category: 'People Success', subcategory: 'Policies',
    icon: '⚖️', agent: 'People Ops Agent', persona: 'hr',
    linkedSkillIds: ['hr-010'], source: 'built-in',
    description: 'Generate or update HR policies with compliance checks and multi-jurisdiction support.',
    tags: ['policy', 'compliance', 'legal', 'handbook'],
    llmCompatibility: ALL_LLMS,
    variables: ['policyType', 'companySize', 'jurisdictions', 'existingPolicy', 'tone'],
    version: 'v1.5', isEditable: true, usageCount: 145, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Full Policy Document', wordTarget: '1200-1800 words', prompt: `Generate an HR policy for "{{policyType}}".

Company size: {{companySize}}
Jurisdictions: {{jurisdictions}}
Existing policy: {{existingPolicy}}
Tone: {{tone}}

Structure:
1. **Policy Title & Version**: clear naming convention
2. **Purpose**: why this policy exists (2-3 sentences)
3. **Scope**: who it applies to, exceptions
4. **Definitions**: key terms defined
5. **Policy Details**: the actual rules and guidelines (10-15 sections)
6. **Procedures**: step-by-step for common scenarios
7. **Responsibilities**: who handles what (employee, manager, HR, legal)
8. **Compliance Notes** per jurisdiction:
   - Federal requirements
   - State/regional requirements for {{jurisdictions}}
   - Differences across jurisdictions highlighted
9. **Violations & Consequences**: progressive discipline framework
10. **FAQ**: 5-8 common questions employees ask
11. **Revision History**: version, date, author, changes
12. **Acknowledgment**: employee signature/acknowledgment template` },
      { variation: 'short', label: 'Quick Policy Summary', wordTarget: '300-500 words', prompt: `Summary version of "{{policyType}}" policy for {{companySize}} company: Key rules (10 bullets) → Who it applies to → How to request exceptions → FAQ (5 questions). Max 400 words. Employee handbook ready.` },
    ],
  },

  // ── OFFBOARDING ────────────────────────────────────────────────────
  {
    id: 'hr-offboarding', title: 'Employee Offboarding Checklist', category: 'People Success', subcategory: 'Offboarding',
    icon: '📋', agent: 'People Ops Agent', persona: 'hr',
    linkedSkillIds: ['hr-009'], source: 'built-in',
    description: 'Comprehensive offboarding with access revocation, knowledge transfer, and exit interview guides.',
    tags: ['offboarding', 'exit', 'checklist', 'knowledge-transfer'],
    llmCompatibility: ALL_LLMS,
    variables: ['employeeName', 'roleTitle', 'department', 'lastDay', 'departureType', 'systemsAccess', 'knowledgeAreas'],
    version: 'v1.5', isEditable: true, usageCount: 134, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Full Offboarding Checklist', wordTarget: '800-1200 words', prompt: `Create an offboarding checklist for {{employeeName}} ({{roleTitle}}, {{department}}).

Last day: {{lastDay}}
Departure type: {{departureType}}
Systems: {{systemsAccess}}
Knowledge areas: {{knowledgeAreas}}

**Pre-Departure (2 weeks before)**:
□ Knowledge transfer plan: document key processes for {{knowledgeAreas}}
□ Transition meetings: identify successors and hand off projects
□ Documentation: update all owned docs, wikis, runbooks
□ Communication: draft internal announcement (manager-approved)

**Last Week**:
□ IT: schedule access revocation for {{systemsAccess}} (effective {{lastDay}} EOD)
□ Equipment: laptop return, badge collection, parking pass
□ Finance: final paycheck, PTO payout, expense reimbursements
□ Benefits: COBRA info, 401(k) rollover guidance
□ Exit interview: schedule with HRBP (guide included below)

**Exit Interview Guide** (30 min):
- Why are you leaving? What could have changed your mind?
- What did you enjoy most? Least?
- How was your manager relationship?
- Would you recommend us as an employer?
- What should we improve?

**Post-Departure**:
□ Verify all access revoked within 24 hours
□ Update org chart and team pages
□ Alumni network invite
□ 30-day check-in (optional, for voluntary departures)

Each item: owner → due date → status.` },
      { variation: 'short', label: 'Quick Offboarding List', wordTarget: '150-200 words', prompt: `Quick offboarding checklist for {{employeeName}} ({{departureType}}, last day {{lastDay}}): 5 pre-departure items → 5 last-day items → 3 post-departure items. Checkbox format. Max 150 words.` },
    ],
  },

  // ── EMPLOYER BRAND ─────────────────────────────────────────────────
  {
    id: 'hr-employer-brand', title: 'Employer Brand Content Kit', category: 'Talent Acquisition', subcategory: 'Employer Brand',
    icon: '⭐', agent: 'TA Strategist Agent', persona: 'hr',
    linkedSkillIds: ['hr-001'], source: 'built-in',
    description: 'Generate employer brand content — careers page copy, Glassdoor responses, social media, and recruitment marketing.',
    tags: ['employer-brand', 'careers', 'recruitment-marketing', 'culture'],
    llmCompatibility: ALL_LLMS,
    variables: ['companyName', 'companyValues', 'targetRoles', 'evp', 'tone'],
    version: 'v1.0', isEditable: true, usageCount: 112, rating: 4.3,
    variants: [
      { variation: 'standard', label: 'Full Brand Kit', wordTarget: '1000-1500 words', prompt: `Create an employer brand content kit for {{companyName}}.

Values: {{companyValues}}
Target roles: {{targetRoles}}
EVP: {{evp}}
Tone: {{tone}}

Generate:
1. **Careers Page Hero Copy**: headline + 3-sentence pitch
2. **"Why Join Us" Section**: 6 bullet points with icons
3. **Employee Value Proposition Messaging**: 3 pillars with supporting proof points
4. **Team Spotlight Template**: structure for employee stories (name, role, journey, quote, day-in-the-life)
5. **Social Media Posts** (5 posts):
   - Hiring announcement template
   - Day-in-the-life template
   - Values spotlight template
   - Team achievement template
   - Behind-the-scenes template
6. **Glassdoor Response Templates**: positive review response, negative review response (empathetic)
7. **Recruitment Email Outreach**: cold outreach template for passive candidates` },
      { variation: 'linkedin', label: 'LinkedIn Careers Content', wordTarget: '150-200 words', prompt: `3 LinkedIn posts for {{companyName}} employer brand: 1 hiring post, 1 culture spotlight, 1 team achievement. Each max 50 words. Hashtag sets included. {{tone}} tone.` },
      { variation: 'social', label: 'Social Media Pack', wordTarget: '300-500 words', prompt: `Social media employer brand pack for {{companyName}}: 5 posts across LinkedIn, Twitter, Instagram — each with copy + visual suggestion + CTA + hashtags. Target audience: {{targetRoles}}. Tone: {{tone}}.` },
    ],
  },
];

// --- All prompts combined ---
const ALL_PROMPTS: DeepPrompt[] = [...MARKETING_PROMPTS, ...ENGINEERING_PROMPTS, ...PRODUCT_PROMPTS, ...HR_PROMPTS];

// --- Store ---
export const usePromptStore = create<PromptStoreState>()(persist((set, get) => ({
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
  getPromptsForSkill: (skillId) => get().prompts.filter(p => p.linkedSkillIds?.includes(skillId)),
}), {
  name: 'prompt-store',
  partialize: (state) => ({
    editedPrompts: state.editedPrompts,
  }),
}));
