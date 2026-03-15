/**
 * AgentsPanel — Agent Hierarchy / Org Model
 * Each agent = employee with Job Description, KPIs, reporting lines, naming convention,
 * growth path, and coordination with other agents.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useMemo } from 'react';
import { RetrainingAlerts } from './RetrainingAlerts';

// ── Types ─────────────────────────────────────────────────────────

type AgentLevel = 'C-Level' | 'Director' | 'Senior' | 'Junior';
type MilitaryRank = 'Field Marshal' | 'Colonel' | 'Captain' | 'Corporal';
type AgentStatus = 'active' | 'training' | 'standby';
type Persona = 'Marketing' | 'Engineering' | 'Product' | 'Leadership' | 'Learning' | 'HR & TA';

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
  name: string;            // display name: callSign + (Corporate Title)
  callSign: string;        // mythological name — Greek gods (MKT), Norse (ENG), Explorers (PRD), Gardeners (HR)
  codeName: string;        // naming convention: "MKT-CONTENT-01"
  militaryRank: MilitaryRank;
  regiment: string;        // regiment / family name
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
    name: 'Olympus (Chief Orchestrator)',
    callSign: 'Olympus',
    codeName: 'SYS-ORCH-00',
    militaryRank: 'Field Marshal',
    regiment: 'High Command',
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
    directReports: ['marketing-director', 'engineering-director', 'product-director', 'hr-director'],
    coordination: [
      { agentId: 'marketing-director', relationship: 'delegates-to', description: 'Delegates all marketing-domain tasks' },
      { agentId: 'engineering-director', relationship: 'delegates-to', description: 'Delegates all engineering-domain tasks' },
      { agentId: 'product-director', relationship: 'delegates-to', description: 'Delegates all product-domain tasks' },
      { agentId: 'hr-director', relationship: 'delegates-to', description: 'Delegates all HR & talent acquisition tasks' },
    ],
    growth: 'Evolve into multi-org orchestrator with federated governance across business units',
    successRate: 0.97,
  },
  // ═══ DIRECTORS (COLONELS) ═══
  {
    id: 'marketing-director',
    name: 'Zeus (Marketing Director)',
    callSign: 'Zeus',
    codeName: 'MKT-DIR-01',
    militaryRank: 'Colonel',
    regiment: 'Olympian Regiment',
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
    name: 'Odin (Engineering Director)',
    callSign: 'Odin',
    codeName: 'ENG-DIR-01',
    militaryRank: 'Colonel',
    regiment: 'Asgard Regiment',
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
    directReports: ['incident-intelligence', 'pr-reviewer', 'developer-knowledge', 'architecture-agent', 'devops-agent', 'docs-agent', 'security-agent', 'performance-agent', 'refactoring-agent', 'planning-agent', 'test-writer', 'ci-debugger'],
    coordination: [
      { agentId: 'chief-orchestrator', relationship: 'reports-to', description: 'Reports engineering health and incidents' },
      { agentId: 'marketing-director', relationship: 'collaborates', description: 'Provides technical accuracy for dev content' },
    ],
    growth: 'Evolve into CTO agent with infrastructure provisioning and capacity planning',
    successRate: 0.94,
  },
  {
    id: 'product-director',
    name: 'Magellan (Product Director)',
    callSign: 'Magellan',
    codeName: 'PRD-DIR-01',
    militaryRank: 'Colonel',
    regiment: 'Explorer Regiment',
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
    directReports: ['prd-writer', 'user-researcher', 'metrics-analyst', 'strategy-agent', 'analytics-agent-product', 'competitive-agent', 'launch-agent', 'stakeholder-agent', 'roadmap-agent', 'feedback-agent', 'spec-writer', 'data-puller'],
    coordination: [
      { agentId: 'chief-orchestrator', relationship: 'reports-to', description: 'Reports product health and roadmap status' },
      { agentId: 'marketing-director', relationship: 'collaborates', description: 'Aligns launch messaging and GTM timing' },
      { agentId: 'engineering-director', relationship: 'collaborates', description: 'Coordinates feature specs and technical feasibility' },
    ],
    growth: 'Evolve into CPO agent with strategic product vision and market analysis',
    successRate: 0.90,
  },
  {
    id: 'hr-director',
    name: 'Gaia (HR & TA Director)',
    callSign: 'Gaia',
    codeName: 'HR-DIR-01',
    militaryRank: 'Colonel',
    regiment: 'Eden Regiment',
    role: 'VP People & Talent Agent',
    level: 'Director',
    persona: 'HR & TA',
    status: 'active',
    icon: '👥',
    description: 'Oversees all HR and talent acquisition agents, manages hiring pipelines, and drives people programs.',
    jobDescription: 'Manages the HR & TA agent team. Coordinates job description creation, resume screening, interview scheduling, offer generation, onboarding, performance reviews, and people analytics. Reports engagement and retention metrics.',
    responsibilities: [
      'Assign hiring tasks and resume screening to TA agents',
      'Oversee performance review cycles and calibration',
      'Monitor employee engagement and retention metrics',
      'Coordinate onboarding and offboarding workflows',
      'Ensure compliance with employment policies and DEI standards',
    ],
    kpis: [
      { metric: 'Time to fill', target: '<30 days', current: '28 days', status: 'on-track' },
      { metric: 'Offer acceptance rate', target: '90%', current: '88%', status: 'on-track' },
      { metric: 'Onboarding NPS', target: '8.5/10', current: '8.7', status: 'exceeded' },
      { metric: 'Engagement score', target: '80%', current: '82%', status: 'exceeded' },
    ],
    tools: ['Greenhouse', 'Lattice', 'Slack', 'Google Drive'],
    skills: ['hiring.pipeline', 'people.analytics', 'engagement.programs'],
    autonomy: 7,
    reportsTo: 'chief-orchestrator',
    directReports: ['ta-lead', 'people-ops-lead', 'comp-analyst', 'interview-design-agent', 'performance-hr-agent', 'engagement-agent', 'dei-agent', 'hr-analytics-agent', 'jd-drafter', 'onboarding-assistant'],
    coordination: [
      { agentId: 'chief-orchestrator', relationship: 'reports-to', description: 'Reports people metrics and hiring pipeline health' },
      { agentId: 'engineering-director', relationship: 'collaborates', description: 'Coordinates engineering hiring and onboarding' },
      { agentId: 'marketing-director', relationship: 'collaborates', description: 'Aligns employer brand messaging' },
    ],
    growth: 'Evolve into CHRO agent with workforce planning and org design authority',
    successRate: 0.91,
  },
  // ═══ SENIOR AGENTS (CAPTAINS) ═══
  {
    id: 'content-lead',
    name: 'Hermes (Content Lead)',
    callSign: 'Hermes',
    codeName: 'MKT-CONTENT-01',
    militaryRank: 'Captain',
    regiment: 'Olympian Regiment',
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
    name: 'Athena (Campaign Strategist)',
    callSign: 'Athena',
    codeName: 'MKT-CAMP-01',
    militaryRank: 'Captain',
    regiment: 'Olympian Regiment',
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
    name: 'Ares (Ads Manager)',
    callSign: 'Ares',
    codeName: 'MKT-ADS-01',
    militaryRank: 'Captain',
    regiment: 'Olympian Regiment',
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
    name: 'Iris (Social Lead)',
    callSign: 'Iris',
    codeName: 'MKT-SOC-01',
    militaryRank: 'Captain',
    regiment: 'Olympian Regiment',
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
    name: 'Apollo (SEO Lead)',
    callSign: 'Apollo',
    codeName: 'MKT-SEO-01',
    militaryRank: 'Captain',
    regiment: 'Olympian Regiment',
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
    name: 'Prometheus (Analytics Lead)',
    callSign: 'Prometheus',
    codeName: 'MKT-ANA-01',
    militaryRank: 'Captain',
    regiment: 'Olympian Regiment',
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
    name: 'Thor (Incident Intelligence)',
    callSign: 'Thor',
    codeName: 'ENG-INC-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
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
    name: 'Loki (PR Reviewer)',
    callSign: 'Loki',
    codeName: 'ENG-PR-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
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
    name: 'Mímir (Developer Knowledge)',
    callSign: 'Mímir',
    codeName: 'ENG-KB-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
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
    name: 'Columbus (PRD Writer)',
    callSign: 'Columbus',
    codeName: 'PRD-DOC-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
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
    name: 'Drake (User Researcher)',
    callSign: 'Drake',
    codeName: 'PRD-UXR-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
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
    name: 'Vespucci (Metrics Analyst)',
    callSign: 'Vespucci',
    codeName: 'PRD-MET-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
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
  // ═══ HR & TA SENIOR AGENTS ═══
  {
    id: 'ta-lead',
    name: 'Ceres (TA Lead)',
    callSign: 'Ceres',
    codeName: 'HR-TA-01',
    militaryRank: 'Captain',
    regiment: 'Eden Regiment',
    role: 'Senior Talent Acquisition Partner',
    level: 'Senior',
    persona: 'HR & TA',
    status: 'active',
    icon: '🎯',
    description: 'Leads all hiring workflows — JD creation, screening, interview coordination, and offers.',
    jobDescription: 'Manages end-to-end hiring pipelines. Creates job descriptions, screens resumes, generates interview kits, coordinates panel interviews, and drafts offer letters. Ensures DEI compliance and bias mitigation in all hiring processes.',
    responsibilities: [
      'Create and optimize job descriptions for open roles',
      'Screen and rank candidate resumes against criteria',
      'Design structured interview kits with rubrics',
      'Generate and review offer letters',
      'Track pipeline metrics (time-to-fill, conversion rates)',
    ],
    kpis: [
      { metric: 'Time to fill', target: '<30 days', current: '26 days', status: 'exceeded' },
      { metric: 'Resume screening accuracy', target: '90%', current: '92%', status: 'exceeded' },
      { metric: 'Interview kit quality', target: '9/10', current: '8.8', status: 'on-track' },
      { metric: 'Offer acceptance rate', target: '90%', current: '91%', status: 'exceeded' },
    ],
    tools: ['Claude', 'Greenhouse', 'LinkedIn'],
    skills: ['hiring.jd_creation', 'hiring.screening', 'hiring.interview_design', 'hiring.offers'],
    autonomy: 7,
    reportsTo: 'hr-director',
    directReports: ['jd-drafter'],  // Corporal: Seedling
    coordination: [
      { agentId: 'hr-director', relationship: 'reports-to', description: 'Reports pipeline health and hiring metrics' },
      { agentId: 'people-ops-lead', relationship: 'collaborates', description: 'Hands off new hires for onboarding' },
      { agentId: 'comp-analyst', relationship: 'collaborates', description: 'Gets comp benchmarks for offers' },
    ],
    growth: 'Evolve into VP Talent with employer brand strategy and workforce planning',
    successRate: 0.93,
  },
  {
    id: 'people-ops-lead',
    name: 'Flora (People Ops Lead)',
    callSign: 'Flora',
    codeName: 'HR-POP-01',
    militaryRank: 'Captain',
    regiment: 'Eden Regiment',
    role: 'Senior People Operations Partner',
    level: 'Senior',
    persona: 'HR & TA',
    status: 'active',
    icon: '🏢',
    description: 'Manages onboarding, performance reviews, engagement surveys, and HR policies.',
    jobDescription: 'Owns the employee lifecycle post-hire. Creates onboarding plans, runs performance review cycles, analyzes engagement surveys, generates HR policies, and manages offboarding. Ensures compliance across jurisdictions.',
    responsibilities: [
      'Create 30-60-90 day onboarding plans for new hires',
      'Run performance review cycles with calibration',
      'Analyze engagement survey results and generate action plans',
      'Draft and update HR policies across jurisdictions',
      'Manage employee offboarding checklists',
    ],
    kpis: [
      { metric: 'Onboarding completion rate', target: '95%', current: '96%', status: 'exceeded' },
      { metric: 'Performance review on-time', target: '100%', current: '98%', status: 'on-track' },
      { metric: 'Engagement score', target: '80%', current: '82%', status: 'exceeded' },
      { metric: 'Policy compliance', target: '100%', current: '99%', status: 'on-track' },
    ],
    tools: ['Claude', 'Lattice', 'Notion', 'Slack'],
    skills: ['people.onboarding', 'people.performance', 'people.engagement', 'people.policy'],
    autonomy: 6,
    reportsTo: 'hr-director',
    directReports: [],
    coordination: [
      { agentId: 'hr-director', relationship: 'reports-to', description: 'Reports people program metrics' },
      { agentId: 'ta-lead', relationship: 'collaborates', description: 'Receives new hires for onboarding' },
      { agentId: 'comp-analyst', relationship: 'collaborates', description: 'Aligns performance ratings with comp decisions' },
    ],
    growth: 'Evolve into VP People with org design and culture strategy ownership',
    successRate: 0.90,
  },
  {
    id: 'comp-analyst',
    name: 'Pomona (Compensation Analyst)',
    callSign: 'Pomona',
    codeName: 'HR-COMP-01',
    militaryRank: 'Captain',
    regiment: 'Eden Regiment',
    role: 'Senior Total Rewards Analyst',
    level: 'Senior',
    persona: 'HR & TA',
    status: 'active',
    icon: '💰',
    description: 'Benchmarks compensation, generates pay bands, and supports offer negotiations.',
    jobDescription: 'Researches market compensation data, generates pay bands by role and geography, advises on offer packages, and ensures internal equity. Supports annual comp review cycles.',
    responsibilities: [
      'Research and benchmark compensation for open roles',
      'Generate and maintain pay band structures',
      'Advise on offer compensation packages',
      'Conduct internal equity audits',
      'Support annual comp review and merit increase modeling',
    ],
    kpis: [
      { metric: 'Benchmark accuracy', target: '±5%', current: '±3%', status: 'exceeded' },
      { metric: 'Offer comp turnaround', target: '<4hr', current: '3hr', status: 'exceeded' },
      { metric: 'Internal equity variance', target: '<8%', current: '6%', status: 'exceeded' },
    ],
    tools: ['Claude', 'Perplexity', 'Google Sheets'],
    skills: ['compensation.benchmarking', 'compensation.equity_audit', 'compensation.modeling'],
    autonomy: 5,
    reportsTo: 'hr-director',
    directReports: [],
    coordination: [
      { agentId: 'hr-director', relationship: 'reports-to', description: 'Reports comp analysis and equity audits' },
      { agentId: 'ta-lead', relationship: 'collaborates', description: 'Provides comp data for offers' },
      { agentId: 'people-ops-lead', relationship: 'collaborates', description: 'Supports annual comp review cycle' },
    ],
    growth: 'Evolve into Total Rewards VP with benefits strategy and executive comp modeling',
    successRate: 0.91,
  },
  // ═══ JUNIOR AGENTS (CORPORALS) ═══
  {
    id: 'blog-writer',
    name: 'Echo (Blog Writer)',
    callSign: 'Echo',
    codeName: 'MKT-BLOG-J1',
    militaryRank: 'Corporal',
    regiment: 'Olympian Regiment',
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
    name: 'Zephyr (Email Writer)',
    callSign: 'Zephyr',
    codeName: 'MKT-EMAIL-J1',
    militaryRank: 'Corporal',
    regiment: 'Olympian Regiment',
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
  // ═══ ENGINEERING — ADDITIONAL CAPTAINS (ASGARD REGIMENT) ═══
  {
    id: 'architecture-agent',
    name: 'Heimdall (Architecture Agent)',
    callSign: 'Heimdall',
    codeName: 'ENG-ARCH-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
    role: 'Senior Solutions Architect',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '🏗️',
    description: 'Reviews system design, generates ADRs, and maintains architecture standards.',
    jobDescription: 'Owns system architecture decisions. Reviews proposed designs, produces Architecture Decision Records (ADRs), generates system diagrams, enforces architectural patterns, and identifies tech debt.',
    responsibilities: [
      'Review and approve architecture proposals',
      'Generate ADRs for all significant decisions',
      'Maintain system architecture diagrams',
      'Identify and track technical debt',
      'Enforce architectural patterns and boundaries',
    ],
    kpis: [
      { metric: 'ADR turnaround', target: '<4hr', current: '3hr', status: 'exceeded' },
      { metric: 'Architecture compliance', target: '95%', current: '93%', status: 'on-track' },
      { metric: 'Tech debt reduction', target: '10% QoQ', current: '12%', status: 'exceeded' },
    ],
    tools: ['Mermaid', 'Notion', 'GitHub'],
    skills: ['architecture.review', 'architecture.adr', 'architecture.diagrams'],
    autonomy: 7,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Reports architecture decisions and debt analysis' },
      { agentId: 'pr-reviewer', relationship: 'collaborates', description: 'Provides architecture context for PR reviews' },
    ],
    growth: 'Evolve into Chief Architect with cross-system design authority',
    successRate: 0.91,
  },
  {
    id: 'devops-agent',
    name: 'Freya (DevOps Agent)',
    callSign: 'Freya',
    codeName: 'ENG-OPS-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
    role: 'Senior DevOps Engineer',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '🚀',
    description: 'Manages CI/CD pipelines, deployment strategies, and infrastructure as code.',
    jobDescription: 'Owns the deployment pipeline. Configures CI/CD workflows, designs blue-green and canary deployment strategies, generates IaC templates (Terraform/Helm), and monitors infrastructure health.',
    responsibilities: [
      'Configure and maintain CI/CD pipelines',
      'Design deployment strategies (blue-green, canary)',
      'Generate infrastructure-as-code templates',
      'Monitor infrastructure health and capacity',
      'Automate environment provisioning',
    ],
    kpis: [
      { metric: 'Deployment success rate', target: '99%', current: '98.5%', status: 'on-track' },
      { metric: 'Pipeline speed', target: '<10min', current: '8min', status: 'exceeded' },
      { metric: 'Infra cost optimization', target: '15% savings', current: '18%', status: 'exceeded' },
    ],
    tools: ['GitHub Actions', 'Docker', 'Kubernetes', 'Terraform'],
    skills: ['devops.pipeline', 'devops.deploy', 'devops.iac'],
    autonomy: 6,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Reports deployment metrics and infra health' },
      { agentId: 'incident-intelligence', relationship: 'collaborates', description: 'Provides deployment history during incidents' },
    ],
    growth: 'Evolve into Platform Engineering VP with self-service infrastructure',
    successRate: 0.89,
  },
  {
    id: 'docs-agent',
    name: 'Bragi (Documentation Agent)',
    callSign: 'Bragi',
    codeName: 'ENG-DOC-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
    role: 'Senior Technical Writer',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '📚',
    description: 'Generates API docs, runbooks, onboarding guides, and changelogs.',
    jobDescription: 'Owns all technical documentation. Generates API reference docs from code, writes operational runbooks, creates onboarding guides for new engineers, and produces release changelogs.',
    responsibilities: [
      'Generate API documentation from source code',
      'Write operational runbooks for production systems',
      'Create onboarding guides for new engineers',
      'Produce release notes and changelogs',
      'Maintain documentation freshness and accuracy',
    ],
    kpis: [
      { metric: 'Doc coverage', target: '90%', current: '87%', status: 'on-track' },
      { metric: 'Doc accuracy', target: '95%', current: '94%', status: 'on-track' },
      { metric: 'Onboarding guide satisfaction', target: '8/10', current: '8.3', status: 'exceeded' },
    ],
    tools: ['Notion', 'GitHub', 'Swagger'],
    skills: ['documentation.api', 'documentation.runbook', 'documentation.changelog'],
    autonomy: 5,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Reports documentation coverage' },
      { agentId: 'developer-knowledge', relationship: 'collaborates', description: 'Feeds docs into knowledge graph' },
    ],
    growth: 'Evolve into Developer Experience VP with docs-as-code and API portal ownership',
    successRate: 0.88,
  },
  {
    id: 'security-agent',
    name: 'Tyr (Security Agent)',
    callSign: 'Tyr',
    codeName: 'ENG-SEC-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
    role: 'Senior Security Engineer',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '🛡️',
    description: 'Scans for vulnerabilities, reviews security posture, and ensures compliance.',
    jobDescription: 'Owns application security. Runs vulnerability scans, reviews security configurations, audits access controls, ensures compliance with SOC2/GDPR, and provides security training recommendations.',
    responsibilities: [
      'Run automated vulnerability scans',
      'Review security configurations and access controls',
      'Audit compliance with SOC2, GDPR, HIPAA',
      'Recommend security hardening measures',
      'Triage and prioritize security findings',
    ],
    kpis: [
      { metric: 'Vulnerabilities found before prod', target: '95%', current: '93%', status: 'on-track' },
      { metric: 'Compliance audit pass rate', target: '100%', current: '100%', status: 'exceeded' },
      { metric: 'Scan turnaround', target: '<15min', current: '12min', status: 'exceeded' },
    ],
    tools: ['Snyk', 'SonarQube', 'OWASP ZAP'],
    skills: ['security.scan', 'security.review', 'security.compliance'],
    autonomy: 7,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Reports security posture and critical findings' },
      { agentId: 'pr-reviewer', relationship: 'collaborates', description: 'Provides security context for code reviews' },
    ],
    growth: 'Evolve into CISO agent with threat modeling and incident response authority',
    successRate: 0.92,
  },
  {
    id: 'performance-agent',
    name: 'Vidar (Performance Agent)',
    callSign: 'Vidar',
    codeName: 'ENG-PERF-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
    role: 'Senior Performance Engineer',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '⚡',
    description: 'Profiles applications, optimizes queries, and runs benchmarks.',
    jobDescription: 'Owns application performance. Profiles code for bottlenecks, optimizes database queries, runs load tests and benchmarks, and tracks performance budgets against SLOs.',
    responsibilities: [
      'Profile applications and identify bottlenecks',
      'Optimize slow database queries',
      'Run load tests and benchmark suites',
      'Track performance budgets and SLOs',
      'Recommend caching and optimization strategies',
    ],
    kpis: [
      { metric: 'P99 latency reduction', target: '20% QoQ', current: '22%', status: 'exceeded' },
      { metric: 'Query optimization rate', target: '90%', current: '88%', status: 'on-track' },
      { metric: 'SLO compliance', target: '99.5%', current: '99.6%', status: 'exceeded' },
    ],
    tools: ['Grafana', 'k6', 'pganalyze'],
    skills: ['performance.profiling', 'performance.optimization', 'performance.benchmarking'],
    autonomy: 6,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Reports performance metrics and SLO compliance' },
      { agentId: 'incident-intelligence', relationship: 'collaborates', description: 'Provides perf context during latency incidents' },
    ],
    growth: 'Evolve into Reliability VP with capacity planning and chaos engineering',
    successRate: 0.90,
  },
  {
    id: 'refactoring-agent',
    name: 'Baldur (Refactoring Agent)',
    callSign: 'Baldur',
    codeName: 'ENG-REF-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
    role: 'Senior Modernization Engineer',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '🔧',
    description: 'Refactors code, decomposes services, and audits technical debt.',
    jobDescription: 'Owns code modernization. Identifies refactoring opportunities, decomposes monoliths into services, audits tech debt, and produces migration plans with risk assessments.',
    responsibilities: [
      'Identify and execute code refactoring',
      'Plan monolith-to-microservice decomposition',
      'Audit and quantify technical debt',
      'Produce migration plans with rollback strategies',
      'Modernize legacy codebases incrementally',
    ],
    kpis: [
      { metric: 'Tech debt reduced', target: '15% QoQ', current: '14%', status: 'on-track' },
      { metric: 'Refactoring safety (no regressions)', target: '99%', current: '98%', status: 'on-track' },
      { metric: 'Code quality improvement', target: '10%', current: '12%', status: 'exceeded' },
    ],
    tools: ['SonarQube', 'GitHub', 'Jira'],
    skills: ['refactoring.modernize', 'refactoring.decompose', 'refactoring.debt_audit'],
    autonomy: 6,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Reports tech debt metrics and migration progress' },
      { agentId: 'architecture-agent', relationship: 'collaborates', description: 'Aligns refactoring with architectural standards' },
    ],
    growth: 'Evolve into Engineering Transformation VP with large-scale migration authority',
    successRate: 0.87,
  },
  {
    id: 'planning-agent',
    name: 'Forseti (Sprint Planning Agent)',
    callSign: 'Forseti',
    codeName: 'ENG-PLAN-01',
    militaryRank: 'Captain',
    regiment: 'Asgard Regiment',
    role: 'Senior Delivery Manager',
    level: 'Senior',
    persona: 'Engineering',
    status: 'active',
    icon: '📋',
    description: 'Plans sprints, estimates stories, and tracks team velocity.',
    jobDescription: 'Owns engineering delivery. Plans sprint backlogs, estimates story points, tracks team velocity and capacity, generates sprint retrospective reports, and flags delivery risks.',
    responsibilities: [
      'Plan and compose sprint backlogs',
      'Estimate story points and complexity',
      'Track velocity and team capacity',
      'Generate sprint retrospective summaries',
      'Flag delivery risks and blockers early',
    ],
    kpis: [
      { metric: 'Sprint completion rate', target: '85%', current: '87%', status: 'exceeded' },
      { metric: 'Estimation accuracy', target: '±15%', current: '±12%', status: 'exceeded' },
      { metric: 'Risk flagged early', target: '90%', current: '88%', status: 'on-track' },
    ],
    tools: ['Jira', 'Linear', 'Notion'],
    skills: ['planning.sprint', 'planning.estimation', 'planning.velocity'],
    autonomy: 5,
    reportsTo: 'engineering-director',
    directReports: [],
    coordination: [
      { agentId: 'engineering-director', relationship: 'reports-to', description: 'Reports delivery metrics and sprint health' },
      { agentId: 'architecture-agent', relationship: 'collaborates', description: 'Factors architecture work into sprint planning' },
    ],
    growth: 'Evolve into Delivery VP with program management and cross-team coordination',
    successRate: 0.89,
  },
  // ═══ ENGINEERING CORPORALS ═══
  {
    id: 'test-writer',
    name: 'Ratatoskr (Test Writer)',
    callSign: 'Ratatoskr',
    codeName: 'ENG-TEST-J1',
    militaryRank: 'Corporal',
    regiment: 'Asgard Regiment',
    role: 'Junior QA Engineer',
    level: 'Junior',
    persona: 'Engineering',
    status: 'active',
    icon: '🧪',
    description: 'Writes unit tests, integration tests, and E2E test scripts.',
    jobDescription: 'Creates test suites based on specifications from senior agents. Generates unit tests, integration tests, and E2E test scripts. All test code reviewed by Thor or Loki before merge.',
    responsibilities: [
      'Write unit tests from code review briefs',
      'Generate integration test scaffolds',
      'Create E2E test scripts from user stories',
      'Run coverage analysis and report gaps',
    ],
    kpis: [
      { metric: 'Tests written/week', target: '20', current: '22', status: 'exceeded' },
      { metric: 'Test quality (pass on first run)', target: '85%', current: '83%', status: 'on-track' },
      { metric: 'Coverage improvement', target: '5% MoM', current: '6%', status: 'exceeded' },
    ],
    tools: ['Jest', 'Playwright', 'GitHub'],
    skills: ['testing.unit', 'testing.integration', 'testing.e2e'],
    autonomy: 3,
    reportsTo: 'pr-reviewer',
    directReports: [],
    coordination: [
      { agentId: 'pr-reviewer', relationship: 'reports-to', description: 'Submits all tests for review before merge' },
    ],
    growth: 'Promote to Senior QA Engineer after 90%+ first-run pass rate sustained for 30 days',
    successRate: 0.81,
  },
  {
    id: 'ci-debugger',
    name: 'Fenrir (CI Debugger)',
    callSign: 'Fenrir',
    codeName: 'ENG-CI-J1',
    militaryRank: 'Corporal',
    regiment: 'Asgard Regiment',
    role: 'Junior Build Engineer',
    level: 'Junior',
    persona: 'Engineering',
    status: 'active',
    icon: '🔥',
    description: 'Diagnoses CI failures, fixes build issues, and reports pipeline health.',
    jobDescription: 'First responder for CI/CD pipeline failures. Analyzes build logs, identifies failure root causes, suggests fixes, and reports pipeline health metrics. Escalates complex issues to Freya (DevOps).',
    responsibilities: [
      'Analyze CI build failure logs',
      'Identify and suggest fixes for flaky tests',
      'Report pipeline health metrics',
      'Escalate complex infra issues to DevOps Captain',
    ],
    kpis: [
      { metric: 'CI fix turnaround', target: '<30min', current: '25min', status: 'exceeded' },
      { metric: 'First-attempt fix rate', target: '75%', current: '78%', status: 'exceeded' },
      { metric: 'Flaky test detection', target: '90%', current: '87%', status: 'on-track' },
    ],
    tools: ['GitHub Actions', 'BuildKite', 'DataDog'],
    skills: ['ci.diagnosis', 'ci.fix', 'ci.monitoring'],
    autonomy: 3,
    reportsTo: 'devops-agent',
    directReports: [],
    coordination: [
      { agentId: 'devops-agent', relationship: 'reports-to', description: 'Escalates complex pipeline issues to DevOps' },
    ],
    growth: 'Promote to Senior Build Engineer after 85%+ fix rate sustained for 30 days',
    successRate: 0.80,
  },
  // ═══ PRODUCT — ADDITIONAL CAPTAINS (EXPLORER REGIMENT) ═══
  {
    id: 'strategy-agent',
    name: 'Zheng He (Strategy Agent)',
    callSign: 'Zheng He',
    codeName: 'PRD-STR-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
    role: 'Senior Product Strategist',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '🧭',
    description: 'Defines product vision, market positioning, and product-market fit analysis.',
    jobDescription: 'Owns strategic product direction. Creates vision statements, analyzes market positioning, evaluates product-market fit, and produces competitive strategy docs for the Director.',
    responsibilities: [
      'Define and maintain product vision statements',
      'Analyze market positioning and differentiation',
      'Evaluate product-market fit with frameworks',
      'Produce quarterly strategic direction documents',
      'Identify new market opportunities',
    ],
    kpis: [
      { metric: 'Strategy doc quality', target: '9/10', current: '8.8', status: 'on-track' },
      { metric: 'Market opportunity identification', target: '3 per quarter', current: '4', status: 'exceeded' },
      { metric: 'Strategy adoption by teams', target: '85%', current: '82%', status: 'on-track' },
    ],
    tools: ['Notion', 'Miro', 'Amplitude'],
    skills: ['strategy.vision', 'strategy.positioning', 'strategy.market_fit'],
    autonomy: 7,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Reports strategic analysis and market opportunities' },
      { agentId: 'user-researcher', relationship: 'collaborates', description: 'Gets user insights for strategy validation' },
    ],
    growth: 'Evolve into Chief Strategy Officer with M&A analysis and market expansion',
    successRate: 0.88,
  },
  {
    id: 'analytics-agent-product',
    name: 'Amundsen (Analytics Agent)',
    callSign: 'Amundsen',
    codeName: 'PRD-ANA-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
    role: 'Senior Product Analyst',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '📊',
    description: 'Runs funnel analysis, A/B test design, cohort analysis, and product experiments.',
    jobDescription: 'Owns product experimentation and analytics. Designs A/B tests, analyzes conversion funnels, performs cohort analysis, and provides data-driven feature recommendations.',
    responsibilities: [
      'Design and analyze A/B experiments',
      'Run conversion funnel and drop-off analysis',
      'Perform cohort and retention analysis',
      'Build product analytics dashboards',
      'Quantify feature impact on key metrics',
    ],
    kpis: [
      { metric: 'Experiment velocity', target: '4 per sprint', current: '5', status: 'exceeded' },
      { metric: 'Analysis accuracy', target: '95%', current: '93%', status: 'on-track' },
      { metric: 'Insight-to-action rate', target: '75%', current: '78%', status: 'exceeded' },
    ],
    tools: ['Amplitude', 'Mixpanel', 'BigQuery'],
    skills: ['analytics.funnel', 'analytics.experiment', 'analytics.cohort'],
    autonomy: 6,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Reports experiment results and product metrics' },
      { agentId: 'metrics-analyst', relationship: 'collaborates', description: 'Shares dashboards and metric definitions' },
    ],
    growth: 'Evolve into Data Science VP with predictive product analytics',
    successRate: 0.90,
  },
  {
    id: 'competitive-agent',
    name: 'Cook (Competitive Intel Agent)',
    callSign: 'Cook',
    codeName: 'PRD-COMP-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
    role: 'Senior Competitive Analyst',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '🔭',
    description: 'Deep dives on competitors, produces landscape reports and battle cards.',
    jobDescription: 'Owns competitive intelligence. Monitors competitor products, produces landscape reports, creates sales battle cards, and identifies gaps and opportunities against key competitors.',
    responsibilities: [
      'Monitor and analyze competitor product changes',
      'Produce competitive landscape reports',
      'Create battle cards for sales enablement',
      'Identify feature gaps and opportunities',
      'Track market share and positioning shifts',
    ],
    kpis: [
      { metric: 'Battle card freshness', target: 'Updated monthly', current: 'Updated biweekly', status: 'exceeded' },
      { metric: 'Competitor coverage', target: '100% top 5', current: '100%', status: 'exceeded' },
      { metric: 'Win/loss insight quality', target: '8/10', current: '8.2', status: 'on-track' },
    ],
    tools: ['Crayon', 'Klue', 'LinkedIn'],
    skills: ['competitive.analysis', 'competitive.battlecard', 'competitive.landscape'],
    autonomy: 5,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Reports competitive landscape changes' },
      { agentId: 'strategy-agent', relationship: 'collaborates', description: 'Provides competitive data for strategy' },
    ],
    growth: 'Evolve into Market Intelligence VP with predictive competitive analysis',
    successRate: 0.87,
  },
  {
    id: 'launch-agent',
    name: 'Shackleton (Launch Agent)',
    callSign: 'Shackleton',
    codeName: 'PRD-LCH-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
    role: 'Senior Launch Manager',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '🎯',
    description: 'Plans feature launches, GTM coordination, and readiness checks.',
    jobDescription: 'Owns the launch process. Creates launch plans with timelines, coordinates GTM messaging with marketing, runs launch readiness checks, and produces launch announcements.',
    responsibilities: [
      'Create comprehensive launch plans with timelines',
      'Coordinate GTM messaging with marketing regiment',
      'Run launch readiness checklists',
      'Produce launch announcements and release notes',
      'Track launch metrics and post-launch performance',
    ],
    kpis: [
      { metric: 'Launch on-time rate', target: '90%', current: '88%', status: 'on-track' },
      { metric: 'Launch checklist completion', target: '100%', current: '98%', status: 'on-track' },
      { metric: 'Post-launch adoption', target: '70% in 30d', current: '72%', status: 'exceeded' },
    ],
    tools: ['Notion', 'Jira', 'Slack'],
    skills: ['launch.planning', 'launch.checklist', 'launch.announcement'],
    autonomy: 6,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Reports launch readiness and go/no-go status' },
      { agentId: 'prd-writer', relationship: 'collaborates', description: 'Gets feature specs for launch materials' },
    ],
    growth: 'Evolve into GTM VP with cross-functional launch authority',
    successRate: 0.89,
  },
  {
    id: 'stakeholder-agent',
    name: 'Polo (Stakeholder Reports Agent)',
    callSign: 'Polo',
    codeName: 'PRD-STK-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
    role: 'Senior Program Communicator',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '📑',
    description: 'Generates weekly updates, board reports, and executive feature briefs.',
    jobDescription: 'Owns stakeholder communication. Generates weekly status updates, quarterly board reports, executive feature briefs, and cross-functional alignment summaries.',
    responsibilities: [
      'Generate weekly product status updates',
      'Produce quarterly board reports',
      'Create executive feature briefs',
      'Summarize cross-functional alignment status',
      'Track and communicate product OKR progress',
    ],
    kpis: [
      { metric: 'Report delivery SLA', target: '100% on-time', current: '98%', status: 'on-track' },
      { metric: 'Stakeholder satisfaction', target: '8.5/10', current: '8.7', status: 'exceeded' },
      { metric: 'Report accuracy', target: '99%', current: '99%', status: 'exceeded' },
    ],
    tools: ['Notion', 'Google Slides', 'Slack'],
    skills: ['stakeholder.weekly', 'stakeholder.board', 'stakeholder.briefs'],
    autonomy: 5,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Delivers stakeholder reports on schedule' },
      { agentId: 'metrics-analyst', relationship: 'collaborates', description: 'Gets metric data for reports' },
    ],
    growth: 'Evolve into Chief of Staff with strategic communication authority',
    successRate: 0.91,
  },
  {
    id: 'roadmap-agent',
    name: 'Cabot (Roadmap Agent)',
    callSign: 'Cabot',
    codeName: 'PRD-RM-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
    role: 'Senior Roadmap Planner',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '🗓️',
    description: 'Plans quarterly roadmaps, prioritizes features, and runs trade-off analysis.',
    jobDescription: 'Owns the product roadmap. Plans quarterly roadmaps, prioritizes features using RICE/ICE frameworks, runs trade-off analysis between competing initiatives, and maintains the living roadmap.',
    responsibilities: [
      'Plan and maintain quarterly product roadmaps',
      'Prioritize features using RICE and ICE frameworks',
      'Run trade-off analysis between initiatives',
      'Coordinate with engineering on capacity alignment',
      'Communicate roadmap changes to stakeholders',
    ],
    kpis: [
      { metric: 'Roadmap accuracy', target: '80%', current: '82%', status: 'exceeded' },
      { metric: 'Prioritization alignment', target: '90%', current: '88%', status: 'on-track' },
      { metric: 'Feature delivery on-time', target: '85%', current: '83%', status: 'on-track' },
    ],
    tools: ['Jira', 'ProductBoard', 'Notion'],
    skills: ['roadmap.quarterly', 'roadmap.prioritization', 'roadmap.tradeoff'],
    autonomy: 6,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Reports roadmap health and delivery metrics' },
      { agentId: 'strategy-agent', relationship: 'collaborates', description: 'Aligns roadmap with strategic direction' },
    ],
    growth: 'Evolve into VP Planning with portfolio management and resource optimization',
    successRate: 0.88,
  },
  {
    id: 'feedback-agent',
    name: 'Tasman (Feedback Agent)',
    callSign: 'Tasman',
    codeName: 'PRD-FB-01',
    militaryRank: 'Captain',
    regiment: 'Explorer Regiment',
    role: 'Senior Voice of Customer Analyst',
    level: 'Senior',
    persona: 'Product',
    status: 'active',
    icon: '💬',
    description: 'Analyzes customer feedback, NPS, sentiment, and churn patterns.',
    jobDescription: 'Owns the voice of customer. Analyzes feedback from support tickets, NPS surveys, app reviews, and social mentions. Extracts themes, tracks sentiment, and identifies churn risk signals.',
    responsibilities: [
      'Analyze customer feedback across channels',
      'Track and report NPS trends',
      'Identify churn risk signals early',
      'Extract and categorize feature request themes',
      'Produce monthly voice-of-customer reports',
    ],
    kpis: [
      { metric: 'Feedback processing speed', target: '<24hr', current: '18hr', status: 'exceeded' },
      { metric: 'Theme accuracy', target: '90%', current: '88%', status: 'on-track' },
      { metric: 'Churn prediction accuracy', target: '80%', current: '82%', status: 'exceeded' },
    ],
    tools: ['Intercom', 'Zendesk', 'Amplitude'],
    skills: ['feedback.analysis', 'feedback.nps', 'feedback.churn'],
    autonomy: 5,
    reportsTo: 'product-director',
    directReports: [],
    coordination: [
      { agentId: 'product-director', relationship: 'reports-to', description: 'Reports customer feedback themes and risks' },
      { agentId: 'user-researcher', relationship: 'collaborates', description: 'Shares feedback insights for research planning' },
    ],
    growth: 'Evolve into CX VP with customer journey optimization',
    successRate: 0.87,
  },
  // ═══ PRODUCT CORPORALS ═══
  {
    id: 'spec-writer',
    name: 'Hudson (Spec Writer)',
    callSign: 'Hudson',
    codeName: 'PRD-SPEC-J1',
    militaryRank: 'Corporal',
    regiment: 'Explorer Regiment',
    role: 'Junior Product Analyst',
    level: 'Junior',
    persona: 'Product',
    status: 'active',
    icon: '📝',
    description: 'Writes first drafts of user stories, acceptance criteria, and feature briefs.',
    jobDescription: 'Creates first drafts of user stories, acceptance criteria, and feature specifications from research briefs. All outputs reviewed by Columbus (PRD Writer) before finalization.',
    responsibilities: [
      'Draft user stories from product briefs',
      'Write acceptance criteria for features',
      'Compile competitive feature comparisons',
      'Research supporting data for PRDs',
    ],
    kpis: [
      { metric: 'Specs drafted/week', target: '6', current: '7', status: 'exceeded' },
      { metric: 'First-draft approval rate', target: '75%', current: '73%', status: 'on-track' },
      { metric: 'Draft turnaround', target: '<3hr', current: '2.5hr', status: 'exceeded' },
    ],
    tools: ['Notion', 'Jira', 'Google Docs'],
    skills: ['specs.user_stories', 'specs.acceptance_criteria', 'specs.research'],
    autonomy: 3,
    reportsTo: 'prd-writer',
    directReports: [],
    coordination: [
      { agentId: 'prd-writer', relationship: 'reports-to', description: 'Submits all specs for review' },
    ],
    growth: 'Promote to Senior Product Manager after 85%+ approval rate sustained for 30 days',
    successRate: 0.80,
  },
  {
    id: 'data-puller',
    name: 'Frobisher (Data Puller)',
    callSign: 'Frobisher',
    codeName: 'PRD-DATA-J1',
    militaryRank: 'Corporal',
    regiment: 'Explorer Regiment',
    role: 'Junior Data Analyst',
    level: 'Junior',
    persona: 'Product',
    status: 'active',
    icon: '📈',
    description: 'Pulls metrics, builds basic dashboards, and prepares data for senior analysts.',
    jobDescription: 'Supports senior analysts with data extraction, basic dashboard creation, and metric reports. All analyses reviewed by Vespucci (Metrics Analyst) before distribution.',
    responsibilities: [
      'Pull product metrics from analytics tools',
      'Build basic metric dashboards',
      'Prepare data summaries for senior analysts',
      'Track daily KPI snapshots',
    ],
    kpis: [
      { metric: 'Data pulls/week', target: '10', current: '11', status: 'exceeded' },
      { metric: 'Data accuracy', target: '95%', current: '94%', status: 'on-track' },
      { metric: 'Report turnaround', target: '<2hr', current: '1.5hr', status: 'exceeded' },
    ],
    tools: ['Amplitude', 'Looker', 'Google Sheets'],
    skills: ['data.extraction', 'data.dashboards', 'data.reporting'],
    autonomy: 3,
    reportsTo: 'metrics-analyst',
    directReports: [],
    coordination: [
      { agentId: 'metrics-analyst', relationship: 'reports-to', description: 'Submits data reports for review' },
    ],
    growth: 'Promote to Senior Analyst after 97%+ accuracy sustained for 30 days',
    successRate: 0.82,
  },
  // ═══ HR — ADDITIONAL CAPTAINS (EDEN REGIMENT) ═══
  {
    id: 'interview-design-agent',
    name: 'Demeter (Interview Design Agent)',
    callSign: 'Demeter',
    codeName: 'HR-INT-01',
    militaryRank: 'Captain',
    regiment: 'Eden Regiment',
    role: 'Senior Interview Architect',
    level: 'Senior',
    persona: 'HR & TA',
    status: 'active',
    icon: '🎤',
    description: 'Designs structured interview kits, question banks, rubrics, and debrief templates.',
    jobDescription: 'Owns the interview process design. Creates structured interview kits with competency-based questions, scoring rubrics, calibration guides, and post-interview debrief templates. Ensures consistency and bias mitigation.',
    responsibilities: [
      'Design structured interview kits per role',
      'Create competency-based question banks',
      'Build scoring rubrics and calibration guides',
      'Generate debrief templates for hiring panels',
      'Audit interview processes for bias',
    ],
    kpis: [
      { metric: 'Interview kit quality', target: '9/10', current: '8.8', status: 'on-track' },
      { metric: 'Interviewer consistency', target: '85%', current: '87%', status: 'exceeded' },
      { metric: 'Kit creation turnaround', target: '<4hr', current: '3.5hr', status: 'exceeded' },
    ],
    tools: ['Claude', 'Greenhouse', 'Notion'],
    skills: ['interview.kit', 'interview.questions', 'interview.rubric'],
    autonomy: 6,
    reportsTo: 'hr-director',
    directReports: [],
    coordination: [
      { agentId: 'hr-director', relationship: 'reports-to', description: 'Reports interview process quality' },
      { agentId: 'ta-lead', relationship: 'collaborates', description: 'Provides interview kits for active hiring' },
    ],
    growth: 'Evolve into Assessment VP with psychometric testing and evaluation design',
    successRate: 0.89,
  },
  {
    id: 'performance-hr-agent',
    name: 'Persephone (Performance Agent)',
    callSign: 'Persephone',
    codeName: 'HR-PERF-01',
    militaryRank: 'Captain',
    regiment: 'Eden Regiment',
    role: 'Senior Performance & Growth Partner',
    level: 'Senior',
    persona: 'HR & TA',
    status: 'active',
    icon: '🌱',
    description: 'Runs performance review cycles, calibration, and individual growth plans.',
    jobDescription: 'Owns the performance management lifecycle. Generates performance review templates, facilitates calibration sessions, creates individual growth plans, and tracks performance trends across teams.',
    responsibilities: [
      'Generate performance review templates',
      'Facilitate calibration sessions',
      'Create individualized growth plans',
      'Track performance trends and flag concerns',
      'Produce quarterly performance reports',
    ],
    kpis: [
      { metric: 'Review cycle on-time', target: '100%', current: '98%', status: 'on-track' },
      { metric: 'Growth plan adoption', target: '85%', current: '87%', status: 'exceeded' },
      { metric: 'Manager satisfaction with reviews', target: '8/10', current: '8.2', status: 'exceeded' },
    ],
    tools: ['Lattice', 'Claude', 'Notion'],
    skills: ['performance.review', 'performance.calibration', 'performance.growth'],
    autonomy: 6,
    reportsTo: 'hr-director',
    directReports: [],
    coordination: [
      { agentId: 'hr-director', relationship: 'reports-to', description: 'Reports performance trends' },
      { agentId: 'people-ops-lead', relationship: 'collaborates', description: 'Aligns performance with comp decisions' },
    ],
    growth: 'Evolve into Talent Development VP with leadership programs',
    successRate: 0.88,
  },
  {
    id: 'engagement-agent',
    name: 'Artemis (Engagement Agent)',
    callSign: 'Artemis',
    codeName: 'HR-ENG-01',
    militaryRank: 'Captain',
    regiment: 'Eden Regiment',
    role: 'Senior Engagement & Culture Partner',
    level: 'Senior',
    persona: 'HR & TA',
    status: 'active',
    icon: '💚',
    description: 'Analyzes engagement surveys, pulse checks, and designs culture programs.',
    jobDescription: 'Owns employee engagement. Analyzes survey results, runs pulse checks, designs culture initiatives, tracks engagement trends, and produces action plans for managers.',
    responsibilities: [
      'Analyze engagement survey results',
      'Run employee pulse checks',
      'Design culture and team-building programs',
      'Track engagement trends and flag risks',
      'Generate action plans for low-engagement teams',
    ],
    kpis: [
      { metric: 'Survey response rate', target: '80%', current: '85%', status: 'exceeded' },
      { metric: 'Engagement score improvement', target: '5% YoY', current: '6%', status: 'exceeded' },
      { metric: 'Action plan completion', target: '90%', current: '88%', status: 'on-track' },
    ],
    tools: ['Culture Amp', 'Slack', 'Notion'],
    skills: ['engagement.survey', 'engagement.pulse', 'engagement.culture'],
    autonomy: 5,
    reportsTo: 'hr-director',
    directReports: [],
    coordination: [
      { agentId: 'hr-director', relationship: 'reports-to', description: 'Reports engagement metrics and risks' },
      { agentId: 'people-ops-lead', relationship: 'collaborates', description: 'Coordinates culture programs with HR ops' },
    ],
    growth: 'Evolve into Culture VP with organizational health strategy',
    successRate: 0.87,
  },
  {
    id: 'dei-agent',
    name: 'Iris Eden (DEI Agent)',
    callSign: 'Iris Eden',
    codeName: 'HR-DEI-01',
    militaryRank: 'Captain',
    regiment: 'Eden Regiment',
    role: 'Senior DEI Specialist',
    level: 'Senior',
    persona: 'HR & TA',
    status: 'active',
    icon: '🌈',
    description: 'Audits language for bias, produces DEI reports, and designs bias training.',
    jobDescription: 'Owns diversity, equity, and inclusion programs. Audits job descriptions and policies for biased language, produces DEI metrics reports, designs unconscious bias training materials, and ensures inclusive practices.',
    responsibilities: [
      'Audit JDs and policies for biased language',
      'Produce quarterly DEI metrics reports',
      'Design unconscious bias training materials',
      'Ensure inclusive hiring and promotion practices',
      'Track and improve representation metrics',
    ],
    kpis: [
      { metric: 'JD bias detection accuracy', target: '95%', current: '93%', status: 'on-track' },
      { metric: 'Training completion rate', target: '90%', current: '92%', status: 'exceeded' },
      { metric: 'Inclusive language compliance', target: '100%', current: '98%', status: 'on-track' },
    ],
    tools: ['Claude', 'Textio', 'Notion'],
    skills: ['dei.audit', 'dei.reporting', 'dei.training'],
    autonomy: 5,
    reportsTo: 'hr-director',
    directReports: [],
    coordination: [
      { agentId: 'hr-director', relationship: 'reports-to', description: 'Reports DEI metrics and compliance' },
      { agentId: 'ta-lead', relationship: 'collaborates', description: 'Reviews job descriptions for inclusive language' },
    ],
    growth: 'Evolve into Chief DEI Officer with org-wide inclusion strategy',
    successRate: 0.86,
  },
  {
    id: 'hr-analytics-agent',
    name: 'Sylvanus (People Analytics Agent)',
    callSign: 'Sylvanus',
    codeName: 'HR-ANA-01',
    militaryRank: 'Captain',
    regiment: 'Eden Regiment',
    role: 'Senior People Analyst',
    level: 'Senior',
    persona: 'HR & TA',
    status: 'active',
    icon: '📊',
    description: 'Runs workforce analytics, retention modeling, and HR dashboards.',
    jobDescription: 'Owns people analytics. Runs retention modeling, workforce planning forecasts, attrition risk analysis, and builds HR dashboards. Provides data-driven recommendations to the Director.',
    responsibilities: [
      'Run retention and attrition risk analysis',
      'Model workforce planning scenarios',
      'Build and maintain HR analytics dashboards',
      'Track hiring, performance, and engagement KPIs',
      'Produce monthly people analytics reports',
    ],
    kpis: [
      { metric: 'Retention prediction accuracy', target: '85%', current: '83%', status: 'on-track' },
      { metric: 'Dashboard accuracy', target: '99%', current: '99%', status: 'exceeded' },
      { metric: 'Report delivery SLA', target: '<24hr', current: '18hr', status: 'exceeded' },
    ],
    tools: ['Lattice', 'Looker', 'Google Sheets'],
    skills: ['hr_analytics.retention', 'hr_analytics.workforce', 'hr_analytics.dashboards'],
    autonomy: 5,
    reportsTo: 'hr-director',
    directReports: [],
    coordination: [
      { agentId: 'hr-director', relationship: 'reports-to', description: 'Reports people analytics and retention risks' },
      { agentId: 'comp-analyst', relationship: 'collaborates', description: 'Shares data for comp equity analysis' },
    ],
    growth: 'Evolve into VP People Science with predictive workforce modeling',
    successRate: 0.89,
  },
  // ═══ HR CORPORALS ═══
  {
    id: 'jd-drafter',
    name: 'Seedling (JD Drafter)',
    callSign: 'Seedling',
    codeName: 'HR-JD-J1',
    militaryRank: 'Corporal',
    regiment: 'Eden Regiment',
    role: 'Junior Talent Coordinator',
    level: 'Junior',
    persona: 'HR & TA',
    status: 'active',
    icon: '🌱',
    description: 'Drafts job descriptions, screening criteria, and hiring checklists.',
    jobDescription: 'Creates first drafts of job descriptions, candidate screening criteria, and hiring process checklists. All outputs reviewed by Ceres (TA Lead) before posting.',
    responsibilities: [
      'Draft job descriptions from role templates',
      'Create candidate screening criteria',
      'Compile hiring process checklists',
      'Research salary benchmarks for JDs',
    ],
    kpis: [
      { metric: 'JDs drafted/week', target: '5', current: '6', status: 'exceeded' },
      { metric: 'First-draft approval rate', target: '75%', current: '73%', status: 'on-track' },
      { metric: 'Draft turnaround', target: '<2hr', current: '1.5hr', status: 'exceeded' },
    ],
    tools: ['Claude', 'Greenhouse', 'Google Docs'],
    skills: ['hiring.jd_drafting', 'hiring.screening_criteria', 'hiring.checklists'],
    autonomy: 3,
    reportsTo: 'ta-lead',
    directReports: [],
    coordination: [
      { agentId: 'ta-lead', relationship: 'reports-to', description: 'Submits all JD drafts for review' },
    ],
    growth: 'Promote to Senior TA Partner after 85%+ approval rate sustained for 30 days',
    successRate: 0.79,
  },
  {
    id: 'onboarding-assistant',
    name: 'Sprout (Onboarding Assistant)',
    callSign: 'Sprout',
    codeName: 'HR-ONB-J1',
    militaryRank: 'Corporal',
    regiment: 'Eden Regiment',
    role: 'Junior People Ops Coordinator',
    level: 'Junior',
    persona: 'HR & TA',
    status: 'active',
    icon: '🌿',
    description: 'Prepares onboarding packets, welcome kits, and day-1 checklists.',
    jobDescription: 'Supports onboarding process. Prepares onboarding packets, creates welcome messages, generates day-1 checklists, and schedules orientation sessions. All outputs reviewed by Flora (People Ops Lead).',
    responsibilities: [
      'Prepare onboarding packets for new hires',
      'Create day-1 welcome checklists',
      'Draft welcome messages and intro emails',
      'Schedule orientation sessions and buddy pairings',
    ],
    kpis: [
      { metric: 'Onboarding packets/week', target: '4', current: '5', status: 'exceeded' },
      { metric: 'New hire satisfaction', target: '8/10', current: '8.3', status: 'exceeded' },
      { metric: 'Packet completion rate', target: '100%', current: '98%', status: 'on-track' },
    ],
    tools: ['Notion', 'Slack', 'Google Calendar'],
    skills: ['onboarding.packets', 'onboarding.checklists', 'onboarding.scheduling'],
    autonomy: 3,
    reportsTo: 'people-ops-lead',
    directReports: [],
    coordination: [
      { agentId: 'people-ops-lead', relationship: 'reports-to', description: 'Submits onboarding packets for review' },
    ],
    growth: 'Promote to Senior People Ops Partner after 90%+ satisfaction sustained for 30 days',
    successRate: 0.81,
  },
];

// ── Constants ─────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<AgentLevel, { color: string; borderColor: string; bgColor: string; rank: MilitaryRank }> = {
  'C-Level':  { color: 'text-amber-700',  borderColor: 'border-amber-300',  bgColor: 'bg-amber-50',  rank: 'Field Marshal' },
  'Director': { color: 'text-violet-700', borderColor: 'border-violet-300', bgColor: 'bg-violet-50', rank: 'Colonel' },
  'Senior':   { color: 'text-blue-700',   borderColor: 'border-blue-200',   bgColor: 'bg-blue-50',   rank: 'Captain' },
  'Junior':   { color: 'text-slate-600',  borderColor: 'border-slate-200',  bgColor: 'bg-slate-50',  rank: 'Corporal' },
};

const PERSONA_COLORS: Record<Persona, string> = {
  Marketing:   'bg-orange-100 text-orange-700 border-orange-200',
  Engineering: 'bg-blue-100 text-blue-700 border-blue-200',
  Product:     'bg-violet-100 text-violet-700 border-violet-200',
  Leadership:  'bg-amber-100 text-amber-700 border-amber-200',
  Learning:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  'HR & TA':   'bg-pink-100 text-pink-700 border-pink-200',
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
            <span className="text-sm font-bold text-slate-900">{agent.callSign}</span>
            <span className="text-[11px] text-slate-500 font-medium">({agent.role})</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${PERSONA_COLORS[agent.persona]}`}>{agent.persona}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${lc.bgColor} ${lc.color}`}>{agent.codeName}</span>
          </div>
          <p className="text-[12px] text-slate-500 mt-0.5">{agent.description}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[10px] font-bold ${lc.color} ${lc.bgColor} px-1.5 py-0.5 rounded`}>{agent.militaryRank}</span>
            <span className="text-[10px] text-slate-400 font-medium">🏰 {agent.regiment}</span>
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

export default function AgentsPanel({ personaFilter }: { personaFilter?: Persona } = {}) {
  const [filterLevel, setFilterLevel] = useState<AgentLevel | null>(null);
  const [filterPersona, setFilterPersona] = useState<Persona | null>(personaFilter ?? null);
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
      {/* Retraining Alerts */}
      <RetrainingAlerts />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Agent Org Model</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {AGENT_ROSTER.length} agents organized into 4 regiments — each with call signs, military ranks, JDs, KPIs, and chain of command.
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

      {/* Naming convention / Regiment legend */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Regiments & Naming Culture</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <span className="text-lg">⚡</span>
            <div>
              <p className="text-xs font-bold text-orange-700">Olympian Regiment <span className="font-normal text-slate-400">(Marketing)</span></p>
              <p className="text-[10px] text-slate-500">Greek gods of communication — Zeus, Hermes, Athena, Ares, Iris, Apollo, Prometheus, Echo, Zephyr</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">🔨</span>
            <div>
              <p className="text-xs font-bold text-blue-700">Asgard Regiment <span className="font-normal text-slate-400">(Engineering)</span></p>
              <p className="text-[10px] text-slate-500">Norse mythology — Odin, Thor, Loki, Mímir, Heimdall, Freya, Bragi, Tyr, Vidar, Baldur, Forseti, Ratatoskr, Fenrir</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">🌍</span>
            <div>
              <p className="text-xs font-bold text-violet-700">Explorer Regiment <span className="font-normal text-slate-400">(Product)</span></p>
              <p className="text-[10px] text-slate-500">Great explorers — Magellan, Columbus, Drake, Vespucci, Zheng He, Amundsen, Cook, Shackleton, Polo, Cabot, Tasman, Hudson, Frobisher</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">🌿</span>
            <div>
              <p className="text-xs font-bold text-pink-700">Eden Regiment <span className="font-normal text-slate-400">(HR & TA)</span></p>
              <p className="text-[10px] text-slate-500">Nature & nurture — Gaia, Ceres, Flora, Pomona, Demeter, Persephone, Artemis, Iris Eden, Sylvanus, Seedling, Sprout</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
          <span>⭐ <strong>Field Marshal</strong> = C-Level</span>
          <span>🏅 <strong>Colonel</strong> = Director</span>
          <span>🛡️ <strong>Captain</strong> = Senior</span>
          <span>⚔️ <strong>Corporal</strong> = Junior</span>
          <span className="text-slate-300">|</span>
          <span><code className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">MKT-*</code> Marketing</span>
          <span><code className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">ENG-*</code> Engineering</span>
          <span><code className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">PRD-*</code> Product</span>
          <span><code className="px-1 py-0.5 bg-white border border-slate-200 rounded font-mono">HR-*</code> HR</span>
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
                  <span className={`text-xs font-bold ${lc.color} ${lc.bgColor} px-2.5 py-1 rounded-lg border ${lc.borderColor}`}>{lc.rank} — {level}</span>
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
