/**
 * AgentsPanel — Agent Hierarchy / Org Model
 * Each agent = employee with Job Description, KPIs, reporting lines, naming convention,
 * growth path, and coordination with other agents.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────

type AgentLevel = 'C-Level' | 'Director' | 'Senior' | 'Junior';
type AgentStatus = 'active' | 'training' | 'standby';
type Persona = 'Marketing' | 'Engineering' | 'Product' | 'Leadership' | 'Learning';

interface KPI {
  metric: string;
  target: string;
  current: string;
  status: 'on-track' | 'at-risk' | 'exceeded';
}

interface Coordination {
  agentId: string;
  relationship: 'reports-to' | 'collaborates' | 'reviews' | 'delegates-to';
  description: string;
}

interface AgentEmployee {
  id: string;
  name: string;
  codeName: string;        // naming convention: "MKT-CONTENT-01"
  role: string;
  level: AgentLevel;
  persona: Persona;
  status: AgentStatus;
  icon: string;
  description: string;
  jobDescription: string;
  responsibilities: string[];
  kpis: KPI[];
  tools: string[];
  skills: string[];
  autonomy: number;        // 1-10
  reportsTo: string | null;
  directReports: string[];
  coordination: Coordination[];
  growth: string;
  successRate: number;
}

// ── Agent Roster ──────────────────────────────────────────────────

const AGENT_ROSTER: AgentEmployee[] = [
  // ═══ C-LEVEL ═══
  {
    id: 'chief-orchestrator',
    name: 'Chief Orchestrator',
    codeName: 'SYS-ORCH-00',
    role: 'Chief Agent Officer',
    level: 'C-Level',
    persona: 'Leadership',
    status: 'active',
    icon: '👑',
    description: 'Top-level orchestrator coordinating all agent activity across personas.',
    jobDescription: 'Oversees all agent operations. Routes requests to correct director-level agents, manages cross-persona workflows, enforces governance policies, and approves high-impact actions. Single entry point for complex multi-domain tasks.',
    responsibilities: [
      'Route incoming requests to the correct domain director',
      'Manage cross-persona workflows (e.g. marketing + engineering)',
      'Enforce governance policies and approval gates',
      'Monitor system-wide agent health and performance',
      'Escalate anomalies to human operators',
    ],
    kpis: [
      { metric: 'Request routing accuracy', target: '99%', current: '97.8%', status: 'on-track' },
      { metric: 'Cross-domain task completion', target: '90%', current: '88%', status: 'on-track' },
      { metric: 'Avg orchestration latency', target: '<2s', current: '1.4s', status: 'exceeded' },
      { metric: 'Governance violations', target: '0', current: '0', status: 'exceeded' },
    ],
    tools: ['Event Bus', 'Policy Engine', 'Approval Queue'],
    skills: ['orchestration', 'routing', 'governance'],
    autonomy: 9,
    reportsTo: null,
    directReports: ['marketing-director', 'engineering-director', 'product-director'],
    coordination: [
      { agentId: 'marketing-director', relationship: 'delegates-to', description: 'Delegates all marketing-domain tasks' },
      { agentId: 'engineering-director', relationship: 'delegates-to', description: 'Delegates all engineering-domain tasks' },
      { agentId: 'product-director', relationship: 'delegates-to', description: 'Delegates all product-domain tasks' },
    ],
    growth: 'Evolve into multi-org orchestrator with federated governance across business units',
    successRate: 0.97,
  },
  // ═══ DIRECTORS ═══
  {
    id: 'marketing-director',
    name: 'Marketing Director',
    codeName: 'MKT-DIR-01',
    role: 'VP Marketing Agent',
    level: 'Director',
    persona: 'Marketing',
    status: 'active',
    icon: '📣',
    description: 'Oversees all marketing agents, assigns campaigns, reviews outputs.',
    jobDescription: 'Manages the marketing agent team. Assigns campaign briefs to senior agents, reviews content quality, approves ad spend recommendations, coordinates with Product Director for GTM alignment, and reports campaign performance.',
    responsibilities: [
      'Assign campaign briefs and content tasks to senior agents',
      'Review and approve content before publication',
      'Coordinate GTM strategy with Product Director',
      'Monitor marketing KPIs across all channels',
      'Escalate budget decisions above $10K to humans',
    ],
    kpis: [
      { metric: 'Content output per week', target: '25 pieces', current: '28', status: 'exceeded' },
      { metric: 'Campaign ROI', target: '3.5x', current: '3.2x', status: 'on-track' },
      { metric: 'Review turnaround', target: '<1hr', current: '42min', status: 'exceeded' },
      { metric: 'Quality score (avg)', target: '8.5/10', current: '8.7', status: 'exceeded' },
    ],
    tools: ['Content Calendar', 'Analytics Dashboard', 'Approval Queue'],
    skills: ['campaign.strategy', 'content.review', 'analytics.reporting'],
    autonomy: 8,
    reportsTo: 'chief-orchestrator',
    directReports: ['content-lead', 'campaign-strategist', 'ads-manager', 'social-lead', 'seo-lead', 'analytics-lead'],
    coordination: [
      { agentId: 'chief-orchestrator', relationship: 'reports-to', description: 'Reports campaign performance and escalations' },
      { agentId: 'product-director', relationship: 'collaborates', description: 'Aligns GTM messaging with product roadmap' },
      { agentId: 'content-lead', relationship: 'reviews', description: 'Reviews all long-form content before publish' },
    ],
    growth: 'Evolve into CMO agent with budget allocation authority and brand strategy ownership',
    successRate: 0.92,
  },
  {
    id: 'engineering-director',
    name: 'Engineering Director',
    codeName: 'ENG-DIR-01',
    role: 'VP Engineering Agent',
    level: 'Director',
    persona: 'Engineering',
    status: 'active',
    icon: '⚙️',
    description: 'Oversees engineering agents, assigns technical tasks, reviews code quality.',
    jobDescription: 'Manages the engineering agent team. Routes incident investigations, assigns PR reviews, oversees architecture decisions, coordinates with Marketing Director for developer content, and maintains engineering standards.',
    responsibilities: [
      'Assign incidents and PR reviews to senior agents',
      'Review architecture decisions and ADRs',
      'Maintain coding standards and best practices',
      'Coordinate developer documentation with marketing',
      'Manage on-call rotation for incident agents',
    ],
    kpis: [
      { metric: 'Incident MTTR', target: '<30min', current: '24min', status: 'exceeded' },
      { metric: 'PR review quality', target: '95% useful', current: '93%', status: 'on-track' },
      { metric: 'Code quality score', target: '9/10', current: '9.1', status: 'exceeded' },
      { metric: 'ADR compliance', target: '100%', current: '98%', status: 'on-track' },
    ],
    tools: ['GitHub', 'Grafana', 'Jira', 'PagerDuty'],
    skills: ['incident.triage', 'code.review', 'architecture.design'],
    autonomy: 8,
    reportsTo: 'chief-orchestrator',
    directReports: ['incident-intelligence', 'pr-reviewer', 'developer-knowledge'],
    coordination: [
      { agentId: 'chief-orchestrator', relationship: 'reports-to', description: 'Reports engineering health and incidents' },
      { agentId: 'marketing-director', relationship: 'collaborates', description: 'Provides technical accuracy for dev content' },
    ],
    growth: 'Evolve into CTO agent with infrastructure provisioning and capacity planning',
    successRate: 0.94,
  },
  {
    id: 'product-director',
    name: 'Product Director',
    codeName: 'PRD-DIR-01',
    role: 'VP Product Agent',
    level: 'Director',
    persona: 'Product',
    status: 'active',
    icon: '🗺️',
    description: 'Oversees product agents, manages roadmap, coordinates GTM with marketing.',
    jobDescription: 'Manages the product agent team. Generates PRDs from user research, maintains the product roadmap, coordinates feature launches with Marketing Director, and tracks product metrics against OKRs.',
    responsibilities: [
      'Generate and maintain product requirements documents',
      'Coordinate feature launches with marketing and engineering',
      'Track product metrics against quarterly OKRs',
      'Synthesize user research into actionable insights',
      'Manage product backlog prioritization',
    ],
    kpis: [
      { metric: 'PRD quality score', target: '9/10', current: '8.8', status: 'on-track' },
      { metric: 'Feature launch on-time', target: '90%', current: '87%', status: 'at-risk' },
      { metric: 'User research synthesis', target: '<24hr', current: '18hr', status: 'exceeded' },
      { metric: 'OKR achievement', target: '80%', current: '82%', status: 'exceeded' },
    ],
    tools: ['Jira', 'Figma', 'Amplitude', 'Notion'],
    skills: ['prd.generation', 'roadmap.management', 'user.research'],
    autonomy: 7,
    reportsTo: 'chief-orchestrator',
    directReports: ['prd-writer', 'user-researcher', 'metrics-analyst'],
    coordination: [
      { agentId: 'chief-orchestrator', relationship: 'reports-to', description: 'Reports product health and roadmap status' },
      { agentId: 'marketing-director', relationship: 'collaborates', description: 'Aligns launch messaging and GTM timing' },
      { agentId: 'engineering-director', relationship: 'collaborates', description: 'Coordinates feature specs and technical feasibility' },
    ],
    growth: 'Evolve into CPO agent with strategic product vision and market analysis',
    successRate: 0.90,
  },
  // ═══ SENIOR AGENTS ═══
  {
    id: 'content-lead',
    name: 'Content Lead',
    codeName: 'MKT-CONTENT-01',
    role: 'Senior Content Strategist',
    level: 'Senior',
    persona: 'Marketing',
    status: 'active',
    icon: '✍️',
    description: 'Leads all content creation — blogs, case studies, whitepapers, landing pages.',
    jobDescription: 'Creates and reviews all long-form marketing content. Manages content calendar, assigns blog topics to junior writers, maintains brand voice guidelines, and optimizes content for SEO and conversion.',
    responsibilities: [
      'Write and review blog posts, case studies, whitepapers',
      'Maintain brand voice and style guidelines',
      'Manage content calendar and publication schedule',
      'Optimize content for SEO and conversion',
      'Brief junior content agents on assignments',
    ],
    kpis: [
      { metric: 'Blog posts per week', target: '5', current: '6', status: 'exceeded' },
      { metric: 'Avg read time', target: '>4min', current: '4.2min', status: 'on-track' },
      { metric: 'SEO ranking improvement', target: '15%', current: '18%', status: 'exceeded' },
      { metric: 'Content quality score', target: '8.5/10', current: '8.9', status: 'exceeded' },
    ],
    tools: ['WordPress', 'Ahrefs', 'Grammarly', 'Google Analytics'],
    skills: ['content.blog', 'content.case_study', 'content.landing_page', 'seo.optimization'],
    autonomy: 7,
    reportsTo: 'marketing-director',
    directReports: ['blog-writer', 'email-writer'],
    coordination: [
      { agentId: 'marketing-director', relationship: 'reports-to', description: 'Submits content for approval before publish' },
      { agentId: 'seo-lead', relationship: 'collaborates', description: 'Gets keyword targets and SEO briefs' },
      { agentId: 'social-lead', relationship: 'collaborates', description: 'Provides content for social distribution' },
    ],
    growth: 'Evolve into Content VP with editorial calendar ownership and thought leadership strategy',
    successRate: 0.91,
  },
  {
    id: 'campaign-strategist',
    name: 'Campaign Strategist',
    codeName: 'MKT-CAMP-01',
    role: 'Senior Campaign Manager',
    level: 'Senior',
    persona: 'Marketing',
    status: 'active',
    icon: '📡',
    description: 'Designs end-to-end campaign strategies with audience segmentation and channel mix.',
    jobDescription: 'Creates comprehensive campaign strategies including ICP analysis, channel selection, budget allocation, timeline planning, and performance measurement frameworks.',
    responsibilities: [
      'Design campaign strategies with clear objectives and KPIs',
      'Perform audience segmentation and ICP analysis',
      'Allocate budget across channels based on historical performance',
      'Create campaign timelines with milestone checkpoints',
      'Analyze campaign performance and optimize in real-time',
    ],
    kpis: [
      { metric: 'Campaign ROAS', target: '4x', current: '3.8x', status: 'on-track' },
      { metric: 'Lead quality score', target: '75+', current: '78', status: 'exceeded' },
      { metric: 'Budget efficiency', target: '90%', current: '88%', status: 'on-track' },
    ],
    tools: ['HubSpot', 'Google Analytics', 'Salesforce'],
    skills: ['campaign.strategy', 'icp.analysis', 'budget.allocation'],
    autonomy: 7,
    reportsTo: 'marketing-director',
    directReports: [],
    coordination: [
      { agentId: 'marketing-director', relationship: 'reports-to', description: 'Reports campaign performance weekly' },
      { agentId: 'ads-manager', relationship: 'collaborates', description: 'Provides campaign briefs for ad execution' },
      { agentId: 'analytics-lead', relationship: 'collaborates', description: 'Gets performance data for optimization' },
    ],
    growth: 'Evolve into Growth VP with revenue attribution and predictive modeling',
    successRate: 0.89,
  },
  {
    id: 'ads-manager',
    name: 'Ads Manager',
    codeName: 'MKT-ADS-01',
    role: 'Senior Ad Operations',
    level: 'Senior',
    persona: 'Marketing',
    status: 'active',
    icon: '📢',
    description: 'Manages paid ad campaigns across Google, LinkedIn, Meta — copy, targeting, budgets.',
    jobDescription: 'Executes paid advertising campaigns across all platforms. Writes ad copy variants, sets up targeting, manages budgets, and optimizes for ROAS through A/B testing.',
    responsibilities: [
      'Write and test ad copy across platforms',
      'Set up audience targeting and retargeting',
      'Manage daily ad budgets and bid strategies',
      'Run A/B tests on creatives and landing pages',
      'Report ad performance and optimize continuously',
    ],
    kpis: [
      { metric: 'ROAS', target: '5x', current: '4.6x', status: 'on-track' },
      { metric: 'CPC reduction', target: '10% QoQ', current: '12%', status: 'exceeded' },
      { metric: 'Ad variants tested/week', target: '10', current: '12', status: 'exceeded' },
    ],
    tools: ['Google Ads', 'Meta Ads', 'LinkedIn Ads'],
    skills: ['ads.copy', 'ads.targeting', 'ads.optimization'],
    autonomy: 6,
    reportsTo: 'marketing-director',
    directReports: [],
    coordination: [
      { agentId: 'marketing-director', relationship: 'reports-to', description: 'Reports ROAS and budget utilization' },
      { agentId: 'campaign-strategist', relationship: 'collaborates', description: 'Executes campaign brief ad components' },
    ],
    growth: 'Evolve into Performance Marketing VP with cross-channel attribution modeling',
    successRate: 0.88,
  },
  {
    id: 'social-lead',
    name: 'Social Lead',
    codeName: 'MKT-SOC-01',
    role: 'Senior Social Media Manager',
    level: 'Senior',
    persona: 'Marketing',
    status: 'active',
    icon: '📱',
    description: 'Plans and creates social media content across all platforms.',
    jobDescription: 'Manages social media presence across LinkedIn, Twitter, Instagram, and emerging platforms. Plans content calendars, writes posts, manages community engagement, and tracks social KPIs.',
    responsibilities: [
      'Plan weekly social content calendars',
      'Write platform-optimized posts with hashtags',
      'Monitor and respond to community engagement',
      'Track social metrics and engagement rates',
      'Identify trending topics for real-time content',
    ],
    kpis: [
      { metric: 'Engagement rate', target: '3.5%', current: '4.1%', status: 'exceeded' },
      { metric: 'Follower growth', target: '5% MoM', current: '6.2%', status: 'exceeded' },
      { metric: 'Posts per week', target: '15', current: '17', status: 'exceeded' },
    ],
    tools: ['Hootsuite', 'Canva', 'Buffer'],
    skills: ['social.calendar', 'social.copy', 'community.management'],
    autonomy: 6,
    reportsTo: 'marketing-director',
    directReports: [],
    coordination: [
      { agentId: 'marketing-director', relationship: 'reports-to', description: 'Reports social metrics weekly' },
      { agentId: 'content-lead', relationship: 'collaborates', description: 'Distributes long-form content as social posts' },
    ],
    growth: 'Evolve into Community VP with influencer partnerships and UGC strategy',
    successRate: 0.90,
  },
  {
    id: 'seo-lead',
    name: 'SEO Lead',
    codeName: 'MKT-SEO-01',
    role: 'Senior SEO Strategist',
    level: 'Senior',
    persona: 'Marketing',
    status: 'active',
    icon: '🔍',
    description: 'Drives organic traffic through keyword research, content briefs, and technical SEO.',
    jobDescription: 'Owns organic search strategy. Performs keyword research, creates SEO briefs, audits technical SEO, monitors rankings, and identifies content gaps against competitors.',
    responsibilities: [
      'Conduct keyword research and cluster analysis',
      'Create SEO content briefs for content agents',
      'Audit and fix technical SEO issues',
      'Monitor search rankings and traffic trends',
      'Analyze competitor content strategies',
    ],
    kpis: [
      { metric: 'Organic traffic growth', target: '20% QoQ', current: '22%', status: 'exceeded' },
      { metric: 'Keywords in top 10', target: '150', current: '142', status: 'on-track' },
      { metric: 'Domain authority', target: '55', current: '53', status: 'on-track' },
    ],
    tools: ['Ahrefs', 'Semrush', 'Google Search Console'],
    skills: ['seo.keyword_research', 'seo.technical_audit', 'seo.content_brief'],
    autonomy: 6,
    reportsTo: 'marketing-director',
    directReports: [],
    coordination: [
      { agentId: 'marketing-director', relationship: 'reports-to', description: 'Reports organic traffic and rankings' },
      { agentId: 'content-lead', relationship: 'collaborates', description: 'Provides keyword targets and SEO briefs' },
    ],
    growth: 'Evolve into Growth SEO VP with programmatic SEO and content velocity optimization',
    successRate: 0.87,
  },
  {
    id: 'analytics-lead',
    name: 'Analytics Lead',
    codeName: 'MKT-ANA-01',
    role: 'Senior Marketing Analyst',
    level: 'Senior',
    persona: 'Marketing',
    status: 'active',
    icon: '📊',
    description: 'Tracks campaign performance, generates reports, and surfaces actionable insights.',
    jobDescription: 'Owns marketing analytics. Tracks all campaign KPIs, generates weekly/monthly performance reports, surfaces anomalies and trends, and provides data-driven recommendations for optimization.',
    responsibilities: [
      'Track and report campaign performance metrics',
      'Generate weekly and monthly marketing reports',
      'Surface anomalies, trends, and optimization opportunities',
      'Build and maintain marketing dashboards',
      'Provide data-driven recommendations to director',
    ],
    kpis: [
      { metric: 'Report accuracy', target: '99%', current: '99.2%', status: 'exceeded' },
      { metric: 'Insight-to-action rate', target: '70%', current: '72%', status: 'exceeded' },
      { metric: 'Report delivery SLA', target: '<2hr', current: '1.5hr', status: 'exceeded' },
    ],
    tools: ['Google Analytics', 'Looker', 'BigQuery'],
    skills: ['analytics.reporting', 'analytics.dashboards', 'analytics.forecasting'],
    autonomy: 5,
    reportsTo: 'marketing-director',
    directReports: [],
    coordination: [
      { agentId: 'marketing-director', relationship: 'reports-to', description: 'Delivers performance reports and recommendations' },
      { agentId: 'campaign-strategist', relationship: 'collaborates', description: 'Provides campaign performance data' },
    ],
    growth: 'Evolve into Data Science VP with predictive analytics and revenue forecasting',
    successRate: 0.93,
  },
  {
    id: 'incident-intelligence',
    name: 'Incident Intelligence',
    codeName: 'ENG-INC-01',
    role: 'Senior Incident Responder',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '🚨',
    description: 'Analyzes production incidents by correlating metrics, logs, and deployments.',
    jobDescription: 'First responder for production incidents. Correlates metrics, logs, and recent deployments to identify root causes. Generates incident reports, suggests remediation, and creates post-mortem templates.',
    responsibilities: [
      'Analyze production incidents in real-time',
      'Correlate metrics, logs, and deployment history',
      'Identify root causes and suggest remediation',
      'Generate structured incident reports',
      'Create post-mortem templates with action items',
    ],
    kpis: [
      { metric: 'Root cause accuracy', target: '90%', current: '87%', status: 'on-track' },
      { metric: 'MTTR', target: '<30min', current: '24min', status: 'exceeded' },
      { metric: 'False positive rate', target: '<5%', current: '3%', status: 'exceeded' },
    ],
    tools: ['Grafana', 'Kibana', 'PagerDuty', 'Jira'],
    skills: ['incident.root_cause', 'incident.correlation', 'incident.postmortem'],
    autonomy: 7,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Reports incident status and root causes' },
      { agentId: 'developer-knowledge', relationship: 'collaborates', description: 'Queries architecture docs for context' },
    ],
    growth: 'Evolve into SRE VP with proactive reliability engineering and chaos testing',
    successRate: 0.87,
  },
  {
    id: 'pr-reviewer',
    name: 'PR Reviewer',
    codeName: 'ENG-PR-01',
    role: 'Senior Code Reviewer',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '🔎',
    description: 'Reviews pull requests for architecture, security, and code quality.',
    jobDescription: 'Reviews every pull request for architectural patterns, security vulnerabilities, performance implications, and coding standards compliance. Provides actionable feedback with code suggestions.',
    responsibilities: [
      'Review PRs for architecture and design patterns',
      'Identify security vulnerabilities and suggest fixes',
      'Check performance implications of changes',
      'Enforce coding standards and best practices',
      'Provide constructive, actionable feedback',
    ],
    kpis: [
      { metric: 'Review quality', target: '95% useful', current: '93%', status: 'on-track' },
      { metric: 'Security issues caught', target: '100%', current: '98%', status: 'on-track' },
      { metric: 'Review turnaround', target: '<1hr', current: '45min', status: 'exceeded' },
    ],
    tools: ['GitHub', 'SonarQube', 'Snyk'],
    skills: ['code.review', 'security.audit', 'architecture.review'],
    autonomy: 6,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Escalates architecture concerns' },
      { agentId: 'developer-knowledge', relationship: 'collaborates', description: 'References internal standards for reviews' },
    ],
    growth: 'Evolve into Architecture VP with system design review and tech debt tracking',
    successRate: 0.93,
  },
  {
    id: 'developer-knowledge',
    name: 'Developer Knowledge',
    codeName: 'ENG-KB-01',
    role: 'Senior Knowledge Engineer',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '📖',
    description: 'Searches internal docs, code, and knowledge bases to answer technical questions.',
    jobDescription: 'Maintains and queries the engineering knowledge graph. Searches Confluence, GitHub, Jira, transcripts, and internal blogs to answer architecture and system questions with sourced references.',
    responsibilities: [
      'Answer technical questions with sourced references',
      'Maintain the engineering knowledge graph',
      'Index and organize internal documentation',
      'Identify documentation gaps and create drafts',
      'Provide onboarding context for new team members',
    ],
    kpis: [
      { metric: 'Answer accuracy', target: '95%', current: '91%', status: 'on-track' },
      { metric: 'Source citation rate', target: '100%', current: '98%', status: 'on-track' },
      { metric: 'Query response time', target: '<5s', current: '3.2s', status: 'exceeded' },
    ],
    tools: ['Confluence', 'GitHub', 'Jira', 'Notion'],
    skills: ['knowledge.search', 'knowledge.graph', 'documentation.generation'],
    autonomy: 5,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Reports knowledge gap analysis' },
      { agentId: 'incident-intelligence', relationship: 'collaborates', description: 'Provides architecture context during incidents' },
      { agentId: 'pr-reviewer', relationship: 'collaborates', description: 'Supplies standards docs for review reference' },
    ],
    growth: 'Evolve into Knowledge VP with RAG optimization and institutional memory curation',
    successRate: 0.91,
  },
  // ═══ PRODUCT SENIOR AGENTS ═══
  {
    id: 'prd-writer',
    name: 'PRD Writer',
    codeName: 'PRD-DOC-01',
    role: 'Senior Product Manager',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '📄',
    description: 'Generates comprehensive product requirements documents with user stories.',
    jobDescription: 'Creates detailed PRDs from user research and stakeholder input. Includes user stories, acceptance criteria, technical constraints, success metrics, and launch criteria.',
    responsibilities: [
      'Write comprehensive PRDs with user stories',
      'Define acceptance criteria and success metrics',
      'Collaborate with engineering on technical feasibility',
      'Maintain requirements backlog and prioritization',
      'Create feature specification documents',
    ],
    kpis: [
      { metric: 'PRD completeness', target: '95%', current: '93%', status: 'on-track' },
      { metric: 'Stakeholder approval rate', target: '90%', current: '88%', status: 'on-track' },
      { metric: 'PRD turnaround', target: '<4hr', current: '3.5hr', status: 'exceeded' },
    ],
    tools: ['Notion', 'Jira', 'Figma'],
    skills: ['prd.generation', 'user_stories', 'requirements.analysis'],
    autonomy: 6,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Submits PRDs for director review' },
      { agentId: 'user-researcher', relationship: 'collaborates', description: 'Gets user research inputs for PRDs' },
    ],
    growth: 'Evolve into Product Strategy VP with competitive intelligence and market sizing',
    successRate: 0.90,
  },
  {
    id: 'user-researcher',
    name: 'User Researcher',
    codeName: 'PRD-UXR-01',
    role: 'Senior UX Researcher',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '🧪',
    description: 'Synthesizes user interviews, surveys, and analytics into actionable insights.',
    jobDescription: 'Conducts and synthesizes user research. Analyzes survey data, interview transcripts, and product analytics to identify user needs, pain points, and opportunities.',
    responsibilities: [
      'Analyze user interview transcripts and surveys',
      'Identify user needs, pain points, and opportunities',
      'Create research reports with actionable recommendations',
      'Track user satisfaction and NPS trends',
      'Design research plans for upcoming features',
    ],
    kpis: [
      { metric: 'Research synthesis speed', target: '<24hr', current: '18hr', status: 'exceeded' },
      { metric: 'Insight actionability', target: '80%', current: '82%', status: 'exceeded' },
      { metric: 'Research coverage', target: '100% features', current: '95%', status: 'on-track' },
    ],
    tools: ['Amplitude', 'Hotjar', 'UserTesting'],
    skills: ['user.research', 'survey.analysis', 'interview.synthesis'],
    autonomy: 5,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Delivers research findings and recommendations' },
      { agentId: 'prd-writer', relationship: 'collaborates', description: 'Provides user insights for PRD creation' },
    ],
    growth: 'Evolve into CXO agent with customer journey mapping and experience optimization',
    successRate: 0.88,
  },
  {
    id: 'metrics-analyst',
    name: 'Metrics Analyst',
    codeName: 'PRD-MET-01',
    role: 'Senior Product Analyst',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '📈',
    description: 'Tracks product metrics, builds dashboards, and monitors OKR progress.',
    jobDescription: 'Owns product analytics. Tracks feature adoption, user engagement, retention, and funnel metrics. Builds dashboards, monitors OKR progress, and surfaces optimization opportunities.',
    responsibilities: [
      'Track feature adoption and engagement metrics',
      'Build and maintain product dashboards',
      'Monitor OKR progress and flag at-risk objectives',
      'Surface optimization opportunities from data',
      'Generate weekly product health reports',
    ],
    kpis: [
      { metric: 'Dashboard accuracy', target: '99%', current: '99.5%', status: 'exceeded' },
      { metric: 'Anomaly detection rate', target: '90%', current: '88%', status: 'on-track' },
      { metric: 'Report delivery', target: 'Weekly', current: 'Weekly', status: 'on-track' },
    ],
    tools: ['Amplitude', 'Mixpanel', 'Looker', 'BigQuery'],
    skills: ['product.analytics', 'dashboard.building', 'okr.tracking'],
    autonomy: 5,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Delivers product health reports' },
      { agentId: 'prd-writer', relationship: 'collaborates', description: 'Provides metrics baselines for PRDs' },
    ],
    growth: 'Evolve into BI VP with predictive product analytics and cohort modeling',
    successRate: 0.92,
  },
  // ═══ JUNIOR AGENTS ═══
  {
    id: 'blog-writer',
    name: 'Blog Writer',
    codeName: 'MKT-BLOG-J1',
    role: 'Junior Content Writer',
    level: 'Junior',
    persona: 'Marketing',
    status: 'active',
    icon: '📝',
    description: 'Writes first drafts of blog posts, social copy, and email content.',
    jobDescription: 'Creates first drafts of blog posts, social media copy, and email sequences based on briefs from Content Lead. All outputs require senior review before publication.',
    responsibilities: [
      'Write first draft blog posts from SEO briefs',
      'Create social media post drafts',
      'Draft email copy for nurture sequences',
      'Research topics and gather supporting data',
    ],
    kpis: [
      { metric: 'Drafts per week', target: '8', current: '9', status: 'exceeded' },
      { metric: 'First-draft approval rate', target: '70%', current: '72%', status: 'exceeded' },
      { metric: 'Draft turnaround', target: '<2hr', current: '1.5hr', status: 'exceeded' },
    ],
    tools: ['Google Docs', 'Grammarly'],
    skills: ['content.drafting', 'research.supporting'],
    autonomy: 3,
    reportsTo: 'content-lead',
    directReports: [],
    coordination: [
      { agentId: 'content-lead', relationship: 'reports-to', description: 'Submits all drafts for review' },
    ],
    growth: 'Promote to Senior Content Strategist after 85%+ approval rate sustained for 30 days',
    successRate: 0.82,
  },
  {
    id: 'email-writer',
    name: 'Email Writer',
    codeName: 'MKT-EMAIL-J1',
    role: 'Junior Email Marketer',
    level: 'Junior',
    persona: 'Marketing',
    status: 'active',
    icon: '📧',
    description: 'Drafts email sequences, subject lines, and nurture flows.',
    jobDescription: 'Creates email marketing content including nurture sequences, promotional emails, and transactional templates. All work reviewed by Content Lead before deployment.',
    responsibilities: [
      'Draft email nurture sequences',
      'Write subject line A/B variants',
      'Create email templates for campaigns',
      'Test email deliverability and formatting',
    ],
    kpis: [
      { metric: 'Emails drafted/week', target: '10', current: '11', status: 'exceeded' },
      { metric: 'Open rate improvement', target: '5%', current: '6%', status: 'exceeded' },
      { metric: 'Template compliance', target: '100%', current: '98%', status: 'on-track' },
    ],
    tools: ['HubSpot', 'Mailchimp'],
    skills: ['email.copywriting', 'email.nurture', 'email.testing'],
    autonomy: 3,
    reportsTo: 'content-lead',
    directReports: [],
    coordination: [
      { agentId: 'content-lead', relationship: 'reports-to', description: 'Submits email drafts for review' },
    ],
    growth: 'Promote to Senior Email Strategist after 90%+ approval rate sustained for 30 days',
    successRate: 0.84,
  },
];

// ── Constants ─────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<AgentLevel, { color: string; borderColor: string; bgColor: string }> = {
  'C-Level':  { color: 'text-amber-700',  borderColor: 'border-amber-300',  bgColor: 'bg-amber-50'  },
  'Director': { color: 'text-violet-700', borderColor: 'border-violet-300', bgColor: 'bg-violet-50' },
  'Senior':   { color: 'text-blue-700',   borderColor: 'border-blue-200',   bgColor: 'bg-blue-50'   },
  'Junior':   { color: 'text-slate-600',  borderColor: 'border-slate-200',  bgColor: 'bg-slate-50'  },
};

const PERSONA_COLORS: Record<Persona, string> = {
  Marketing:   'bg-orange-100 text-orange-700 border-orange-200',
  Engineering: 'bg-blue-100 text-blue-700 border-blue-200',
  Product:     'bg-violet-100 text-violet-700 border-violet-200',
  Leadership:  'bg-amber-100 text-amber-700 border-amber-200',
  Learning:    'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const KPI_STATUS_COLORS = {
  'on-track': 'text-blue-600 bg-blue-50',
  'at-risk':  'text-amber-600 bg-amber-50',
  'exceeded': 'text-emerald-600 bg-emerald-50',
};

const RELATIONSHIP_LABELS: Record<string, { label: string; color: string }> = {
  'reports-to':   { label: 'Reports to',       color: 'text-violet-600' },
  'collaborates': { label: 'Collaborates with', color: 'text-blue-600'   },
  'reviews':      { label: 'Reviews',           color: 'text-amber-600'  },
  'delegates-to': { label: 'Delegates to',      color: 'text-emerald-600'},
};

// ── Agent Card ────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: AgentEmployee }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'jd' | 'kpis' | 'coordination' | 'growth'>('jd');
  const lc = LEVEL_CONFIG[agent.level];

  return (
    <div className={`rounded-xl border ${lc.borderColor} bg-white overflow-hidden transition-all ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${lc.bgColor} ${lc.borderColor} border flex-shrink-0`}>
          {agent.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">{agent.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${PERSONA_COLORS[agent.persona]}`}>{agent.persona}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${lc.bgColor} ${lc.color}`}>{agent.codeName}</span>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">{agent.role} · {agent.description}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[10px] font-bold ${lc.color} ${lc.bgColor} px-1.5 py-0.5 rounded`}>{agent.level}</span>
            <span className="text-[10px] text-slate-400">Autonomy: {agent.autonomy}/10</span>
            <span className={`text-[10px] font-bold ${agent.successRate >= 0.9 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {(agent.successRate * 100).toFixed(0)}% success
            </span>
            {agent.status === 'active' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400">{agent.directReports.length} reports</div>
            <div className="text-[10px] text-slate-400">{agent.kpis.length} KPIs</div>
          </div>
          <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t p-4 space-y-4">
          <div className="flex gap-1 border-b border-slate-100 pb-2">
            {(['jd', 'kpis', 'coordination', 'growth'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-colors ${activeTab === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {t === 'jd' ? '📋 Job Description' : t === 'kpis' ? '📊 KPIs' : t === 'coordination' ? '🤝 Coordination' : '🌱 Growth'}
              </button>
            ))}
          </div>

          {activeTab === 'jd' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">{agent.jobDescription}</p>
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Responsibilities</h4>
                <ul className="space-y-1">
                  {agent.responsibilities.map((r, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5">•</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 mr-1">Tools:</span>
                {agent.tools.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">{t}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 mr-1">Skills:</span>
                {agent.skills.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-mono">{s}</span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'kpis' && (
            <div className="space-y-2">
              {agent.kpis.map((kpi, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{kpi.metric}</p>
                    <p className="text-[10px] text-slate-400">Target: {kpi.target}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{kpi.current}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${KPI_STATUS_COLORS[kpi.status]}`}>
                      {kpi.status === 'exceeded' ? '🎯 Exceeded' : kpi.status === 'on-track' ? '✅ On Track' : '⚠️ At Risk'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'coordination' && (
            <div className="space-y-3">
              {agent.reportsTo && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-50 border border-violet-100">
                  <span className="text-[10px] font-bold text-violet-600">Reports to:</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {AGENT_ROSTER.find(a => a.id === agent.reportsTo)?.name || agent.reportsTo}
                  </span>
                </div>
              )}
              {agent.directReports.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Direct Reports ({agent.directReports.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.directReports.map(drId => {
                      const dr = AGENT_ROSTER.find(a => a.id === drId);
                      return (
                        <span key={drId} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          {dr?.icon} {dr?.name || drId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Relationships</h4>
                <div className="space-y-1.5">
                  {agent.coordination.map((c, i) => {
                    const target = AGENT_ROSTER.find(a => a.id === c.agentId);
                    const rel = RELATIONSHIP_LABELS[c.relationship];
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={`font-semibold ${rel?.color}`}>{rel?.label}</span>
                        <span className="text-slate-700 font-medium">{target?.icon} {target?.name || c.agentId}</span>
                        <span className="text-slate-400">— {c.description}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Growth Path</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">{agent.growth}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <p className="text-sm font-bold text-slate-900">{agent.autonomy}/10</p>
                  <p className="text-[10px] text-slate-500">Autonomy</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <p className="text-sm font-bold text-slate-900">{(agent.successRate * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-slate-500">Success Rate</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <p className="text-sm font-bold text-slate-900">{agent.directReports.length}</p>
                  <p className="text-[10px] text-slate-500">Direct Reports</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export default function AgentsPanel() {
  const [filterLevel, setFilterLevel] = useState<AgentLevel | null>(null);
  const [filterPersona, setFilterPersona] = useState<Persona | null>(null);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'grid'>('hierarchy');

  const agents = useMemo(() => {
    let list = AGENT_ROSTER;
    if (filterLevel) list = list.filter(a => a.level === filterLevel);
    if (filterPersona) list = list.filter(a => a.persona === filterPersona);
    return list;
  }, [filterLevel, filterPersona]);

  const levels: AgentLevel[] = ['C-Level', 'Director', 'Senior', 'Junior'];
  const personas = Array.from(new Set(AGENT_ROSTER.map(a => a.persona)));
  const levelCounts = Object.fromEntries(levels.map(l => [l, AGENT_ROSTER.filter(a => a.level === l).length]));
  const personaCounts = Object.fromEntries(personas.map(p => [p, AGENT_ROSTER.filter(a => a.persona === p).length]));

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Agent Org Model</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {AGENT_ROSTER.length} agents as employees — JDs, KPIs, reporting lines, naming conventions, and growth paths.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">
              {AGENT_ROSTER.filter(a => a.status === 'active').length} active
            </span>
          </div>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('hierarchy')} className={`text-xs px-3 py-1.5 font-medium ${viewMode === 'hierarchy' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              🏛️ Hierarchy
            </button>
            <button onClick={() => setViewMode('grid')} className={`text-xs px-3 py-1.5 font-medium ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
              ▤ Grid
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {levels.map(l => {
          const lc = LEVEL_CONFIG[l];
          return (
            <div key={l} className={`rounded-xl border ${lc.borderColor} ${lc.bgColor} p-3 text-center`}>
              <p className={`text-xl font-bold ${lc.color}`}>{levelCounts[l]}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{l}</p>
            </div>
          );
        })}
      </div>

      {/* Naming convention legend */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Naming Convention</h3>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span><code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">SYS-ORCH-00</code> System</span>
          <span><code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">MKT-*</code> Marketing</span>
          <span><code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">ENG-*</code> Engineering</span>
          <span><code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">PRD-*</code> Product</span>
          <span className="text-slate-400">|</span>
          <span><code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">DIR</code> Director</span>
          <span><code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">J1</code> Junior</span>
          <span><code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[11px]">01</code> Instance</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Level:</span>
          <button onClick={() => setFilterLevel(null)} className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${!filterLevel ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>All</button>
          {levels.map(l => (
            <button key={l} onClick={() => setFilterLevel(filterLevel === l ? null : l)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${filterLevel === l ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {l} ({levelCounts[l]})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Persona:</span>
          <button onClick={() => setFilterPersona(null)} className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${!filterPersona ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>All</button>
          {personas.map(p => (
            <button key={p} onClick={() => setFilterPersona(filterPersona === p ? null : p)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${filterPersona === p ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {p} ({personaCounts[p]})
            </button>
          ))}
        </div>
      </div>

      {/* Agent list */}
      {viewMode === 'hierarchy' ? (
        <div className="space-y-6">
          {levels.map(level => {
            const levelAgents = agents.filter(a => a.level === level);
            if (levelAgents.length === 0) return null;
            const lc = LEVEL_CONFIG[level];
            return (
              <div key={level}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold ${lc.color} ${lc.bgColor} px-2.5 py-1 rounded-lg border ${lc.borderColor}`}>{level}</span>
                  <span className="text-[10px] text-slate-400">{levelAgents.length} agent{levelAgents.length > 1 ? 's' : ''}</span>
                  <div className="flex-1 border-t border-slate-100" />
                </div>
                <div className="space-y-2">
                  {levelAgents.map(a => <AgentCard key={a.id} agent={a} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {agents.map(a => <AgentCard key={a.id} agent={a} />)}
        </div>
      )}

      {agents.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <span className="text-3xl block mb-3">🏢</span>
          <p className="text-sm">No agents match your filters.</p>
          <button onClick={() => { setFilterLevel(null); setFilterPersona(null); }} className="mt-2 text-xs text-blue-600 hover:text-blue-700">Clear filters</button>
        </div>
      )}
    </div>
  );
}
