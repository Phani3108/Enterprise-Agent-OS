/**
 * Flagship Workflows — Cross-functional workflow templates that demonstrate
 * Enterprise AgentOS's orchestration capabilities.
 *
 * These are the "wow + real value" starting points:
 * 1. PRD → Jira Decomposition (Product + Engineering)
 * 2. Incident RCA Swarm (Engineering + Program)
 * 3. Campaign Launch Pod (Marketing + Product)
 * 4. Hiring Pipeline (TA + Engineering + HR)
 * 5. Launch Readiness Board (Program + All)
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  agentPersona: string;
  tool?: string;
  outputKey: string;
  description: string;
  requiresApproval?: boolean;
  dependsOn?: string[];
}

export interface WorkflowTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  type: 'cross-functional' | 'single-persona';
  personas: string[];
  complexity: 'moderate' | 'complex' | 'critical';
  estimatedTime: string;
  inputs: { id: string; label: string; type: string; required?: boolean; placeholder?: string }[];
  steps: WorkflowStep[];
  outputs: string[];
  tools: string[];
  tags: string[];
}

// ═══════════════════════════════════════════════════════════════
// Flagship Workflows
// ═══════════════════════════════════════════════════════════════

export const FLAGSHIP_WORKFLOWS: WorkflowTemplate[] = [
  // ── 1. PRD → Jira Decomposition ──────────────────────────────
  {
    id: 'fw-001',
    slug: 'prd-to-jira',
    name: 'PRD → Jira Decomposition',
    description: 'Take a product brief, generate a full PRD, decompose into epics and stories, and create them in Jira — all orchestrated across Product and Engineering agents.',
    icon: '📦',
    type: 'cross-functional',
    personas: ['product', 'engineering'],
    complexity: 'complex',
    estimatedTime: '3–5 min',
    inputs: [
      { id: 'product_brief', label: 'Product Brief', type: 'textarea', required: true, placeholder: 'Describe the feature, user problem, and business goal...' },
      { id: 'target_quarter', label: 'Target Quarter', type: 'text', placeholder: 'e.g. Q3 2026' },
      { id: 'jira_project', label: 'Jira Project Key', type: 'text', placeholder: 'e.g. PLAT' },
      { id: 'constraints', label: 'Constraints', type: 'textarea', placeholder: 'Technical, timeline, or resource constraints...' },
    ],
    steps: [
      { id: 'fw-001-s1', name: 'Analyze Product Brief', agent: 'Captain Odin', agentPersona: 'Product', tool: 'Claude', outputKey: 'brief_analysis', description: 'Parse the brief, identify user problems, business goals, and success metrics' },
      { id: 'fw-001-s2', name: 'Generate PRD', agent: 'Captain Odin', agentPersona: 'Product', tool: 'Claude', outputKey: 'prd_draft', description: 'Create a full PRD with goals, non-goals, requirements, edge cases, and metrics', dependsOn: ['fw-001-s1'] },
      { id: 'fw-001-s3', name: 'Technical Feasibility Review', agent: 'Captain Prometheus', agentPersona: 'Engineering', tool: 'Claude', outputKey: 'tech_review', description: 'Review PRD for technical feasibility, identify risks, and estimate complexity', dependsOn: ['fw-001-s2'] },
      { id: 'fw-001-s4', name: 'Decompose into Epics', agent: 'Corporal Freya', agentPersona: 'Product', tool: 'Claude', outputKey: 'epics', description: 'Break PRD into 3-5 epics with scope and acceptance criteria', dependsOn: ['fw-001-s2', 'fw-001-s3'] },
      { id: 'fw-001-s5', name: 'Generate User Stories', agent: 'Corporal Freya', agentPersona: 'Product', tool: 'Claude', outputKey: 'stories', description: 'Create user stories with acceptance criteria for each epic', dependsOn: ['fw-001-s4'] },
      { id: 'fw-001-s6', name: 'Estimate & Prioritize', agent: 'Captain Prometheus', agentPersona: 'Engineering', tool: 'Claude', outputKey: 'estimates', description: 'Add story point estimates and priority ranking', dependsOn: ['fw-001-s5'] },
      { id: 'fw-001-s7', name: 'Create Jira Tickets', agent: 'Corporal Mercury', agentPersona: 'Engineering', tool: 'Jira', outputKey: 'jira_tickets', description: 'Create epics and stories in Jira with proper hierarchy', requiresApproval: true, dependsOn: ['fw-001-s6'] },
    ],
    outputs: ['brief_analysis', 'prd_draft', 'tech_review', 'epics', 'stories', 'estimates', 'jira_tickets'],
    tools: ['Claude', 'Jira', 'Confluence'],
    tags: ['prd', 'jira', 'cross-functional', 'product', 'engineering'],
  },

  // ── 2. Incident RCA Swarm ────────────────────────────────────
  {
    id: 'fw-002',
    slug: 'incident-rca-swarm',
    name: 'Incident RCA Swarm',
    description: 'Assemble a cross-functional incident response: triage, investigate, remediate, communicate, and produce a root cause analysis — all in real-time.',
    icon: '🚨',
    type: 'cross-functional',
    personas: ['engineering', 'program'],
    complexity: 'critical',
    estimatedTime: '5–10 min',
    inputs: [
      { id: 'incident_id', label: 'Incident ID', type: 'text', required: true, placeholder: 'e.g. INC-3421' },
      { id: 'description', label: 'Incident Description', type: 'textarea', required: true, placeholder: 'What happened? When? What is the user impact?' },
      { id: 'severity', label: 'Severity', type: 'text', placeholder: 'P1/P2/P3' },
      { id: 'affected_services', label: 'Affected Services', type: 'textarea', placeholder: 'List affected services and components' },
    ],
    steps: [
      { id: 'fw-002-s1', name: 'Triage & Impact Assessment', agent: 'Colonel Atlas', agentPersona: 'Engineering', tool: 'Claude', outputKey: 'triage', description: 'Classify severity, assess blast radius, identify affected users' },
      { id: 'fw-002-s2', name: 'Log & Metric Analysis', agent: 'Sergeant Vulcan', agentPersona: 'Engineering', tool: 'DataDog', outputKey: 'log_analysis', description: 'Pull relevant logs, metrics, and trace data from observability stack', dependsOn: ['fw-002-s1'] },
      { id: 'fw-002-s3', name: 'Dependency Mapping', agent: 'Captain Prometheus', agentPersona: 'Engineering', tool: 'Claude', outputKey: 'dependency_map', description: 'Map upstream/downstream service dependencies and recent deployments', dependsOn: ['fw-002-s1'] },
      { id: 'fw-002-s4', name: 'Hypothesis Generation', agent: 'Colonel Atlas', agentPersona: 'Engineering', tool: 'Claude', outputKey: 'hypotheses', description: 'Generate ranked hypotheses for root cause based on evidence', dependsOn: ['fw-002-s2', 'fw-002-s3'] },
      { id: 'fw-002-s5', name: 'Remediation Plan', agent: 'Captain Prometheus', agentPersona: 'Engineering', tool: 'Claude', outputKey: 'remediation', description: 'Propose remediation actions with rollback plan', requiresApproval: true, dependsOn: ['fw-002-s4'] },
      { id: 'fw-002-s6', name: 'Stakeholder Communication', agent: 'Captain Hermes', agentPersona: 'Program', tool: 'Slack', outputKey: 'comms_draft', description: 'Draft incident communication for stakeholders and customers', dependsOn: ['fw-002-s4'] },
      { id: 'fw-002-s7', name: 'RCA Document', agent: 'Colonel Atlas', agentPersona: 'Engineering', tool: 'Confluence', outputKey: 'rca_doc', description: 'Produce full root cause analysis with timeline, evidence, and prevention actions', dependsOn: ['fw-002-s5'] },
    ],
    outputs: ['triage', 'log_analysis', 'dependency_map', 'hypotheses', 'remediation', 'comms_draft', 'rca_doc'],
    tools: ['Claude', 'DataDog', 'Slack', 'Confluence', 'Jira'],
    tags: ['incident', 'rca', 'cross-functional', 'critical'],
  },

  // ── 3. Campaign Launch Pod ───────────────────────────────────
  {
    id: 'fw-003',
    slug: 'campaign-launch-pod',
    name: 'Campaign Launch Pod',
    description: 'Full-cycle campaign from strategy through execution: audience definition, messaging, content creation, channel setup, and performance tracking.',
    icon: '📣',
    type: 'cross-functional',
    personas: ['marketing', 'product'],
    complexity: 'complex',
    estimatedTime: '5–8 min',
    inputs: [
      { id: 'campaign_goal', label: 'Campaign Goal', type: 'textarea', required: true, placeholder: 'What are you trying to achieve? (awareness, leads, adoption...)' },
      { id: 'target_audience', label: 'Target Audience', type: 'textarea', required: true, placeholder: 'Who is the target? (ICP, segment, persona...)' },
      { id: 'budget', label: 'Budget', type: 'text', placeholder: 'e.g. $5,000' },
      { id: 'channels', label: 'Channels', type: 'textarea', placeholder: 'e.g. LinkedIn, Email, Blog, Webinar' },
      { id: 'launch_date', label: 'Launch Date', type: 'text', placeholder: 'YYYY-MM-DD' },
    ],
    steps: [
      { id: 'fw-003-s1', name: 'Campaign Strategy', agent: 'Colonel Hyperion', agentPersona: 'Marketing', tool: 'Claude', outputKey: 'strategy', description: 'Define campaign objectives, KPIs, and channel strategy' },
      { id: 'fw-003-s2', name: 'Audience & Positioning', agent: 'Captain Iris', agentPersona: 'Marketing', tool: 'Claude', outputKey: 'positioning', description: 'Define ICP segments, messaging pillars, and competitive positioning', dependsOn: ['fw-003-s1'] },
      { id: 'fw-003-s3', name: 'Product Positioning Input', agent: 'Captain Odin', agentPersona: 'Product', tool: 'Claude', outputKey: 'product_input', description: 'Provide product context, feature highlights, and value propositions', dependsOn: ['fw-003-s1'] },
      { id: 'fw-003-s4', name: 'Content Creation', agent: 'Captain Apollo', agentPersona: 'Marketing', tool: 'Claude', outputKey: 'content_pack', description: 'Create email sequences, ad copy, landing page copy, and social posts', dependsOn: ['fw-003-s2', 'fw-003-s3'] },
      { id: 'fw-003-s5', name: 'Channel Setup Plan', agent: 'Corporal Nova', agentPersona: 'Marketing', tool: 'HubSpot', outputKey: 'channel_setup', description: 'Configure campaign in HubSpot, set up ads, schedule emails', requiresApproval: true, dependsOn: ['fw-003-s4'] },
      { id: 'fw-003-s6', name: 'KPI & Tracking Setup', agent: 'Captain Iris', agentPersona: 'Marketing', tool: 'GA4', outputKey: 'tracking', description: 'Set up tracking, attribution, and dashboard for campaign performance', dependsOn: ['fw-003-s5'] },
    ],
    outputs: ['strategy', 'positioning', 'product_input', 'content_pack', 'channel_setup', 'tracking'],
    tools: ['Claude', 'HubSpot', 'GA4', 'LinkedIn Ads'],
    tags: ['campaign', 'marketing', 'cross-functional', 'launch'],
  },

  // ── 4. Hiring Pipeline ───────────────────────────────────────
  {
    id: 'fw-004',
    slug: 'hiring-pipeline',
    name: 'Hiring Pipeline Accelerator',
    description: 'End-to-end hiring from brief to offer: JD generation, scorecard, resume screening, interview kits, debrief synthesis, and recommendation.',
    icon: '👥',
    type: 'cross-functional',
    personas: ['ta', 'engineering', 'hr'],
    complexity: 'complex',
    estimatedTime: '5–8 min',
    inputs: [
      { id: 'role_title', label: 'Role Title', type: 'text', required: true, placeholder: 'e.g. Senior Backend Engineer' },
      { id: 'hiring_brief', label: 'Hiring Brief', type: 'textarea', required: true, placeholder: 'Describe the role, key projects, team context...' },
      { id: 'department', label: 'Department', type: 'text', required: true, placeholder: 'e.g. Engineering' },
      { id: 'level', label: 'Seniority', type: 'text', placeholder: 'e.g. Senior, Staff' },
      { id: 'urgency', label: 'Urgency', type: 'text', placeholder: 'Standard / Urgent / Critical' },
    ],
    steps: [
      { id: 'fw-004-s1', name: 'Generate Job Description', agent: 'JD Specialist', agentPersona: 'TA', tool: 'Claude', outputKey: 'jd', description: 'Create comprehensive, DEI-optimized job description from hiring brief' },
      { id: 'fw-004-s2', name: 'Build Hiring Scorecard', agent: 'Scorecard Analyst', agentPersona: 'TA', tool: 'Claude', outputKey: 'scorecard', description: 'Generate structured scorecard with competencies and behavioral indicators', dependsOn: ['fw-004-s1'] },
      { id: 'fw-004-s3', name: 'Design Interview Panel', agent: 'Panel Designer', agentPersona: 'TA', tool: 'Claude', outputKey: 'panel_plan', description: 'Propose interview rounds, panelists, and competency coverage', dependsOn: ['fw-004-s2'] },
      { id: 'fw-004-s4', name: 'Generate Interview Kits', agent: 'Interview Designer', agentPersona: 'TA', tool: 'Claude', outputKey: 'interview_kits', description: 'Create question sets and evaluation rubrics for each round', dependsOn: ['fw-004-s3'] },
      { id: 'fw-004-s5', name: 'Technical Assessment Design', agent: 'Captain Prometheus', agentPersona: 'Engineering', tool: 'Claude', outputKey: 'tech_assessment', description: 'Design technical assessment aligned to role requirements', dependsOn: ['fw-004-s2'] },
      { id: 'fw-004-s6', name: 'Sourcing Strategy', agent: 'Market Analyst', agentPersona: 'TA', tool: 'Claude', outputKey: 'sourcing_strategy', description: 'Analyze talent market and recommend sourcing channels', dependsOn: ['fw-004-s1'] },
      { id: 'fw-004-s7', name: 'Compliance Check', agent: 'Colonel Rhea', agentPersona: 'HR', tool: 'Claude', outputKey: 'compliance', description: 'Verify JD and process comply with HR policies and labor regulations', requiresApproval: true, dependsOn: ['fw-004-s1'] },
    ],
    outputs: ['jd', 'scorecard', 'panel_plan', 'interview_kits', 'tech_assessment', 'sourcing_strategy', 'compliance'],
    tools: ['Claude', 'LinkedIn', 'ATS'],
    tags: ['hiring', 'ta', 'cross-functional', 'recruitment'],
  },

  // ── 5. Launch Readiness Board ────────────────────────────────
  {
    id: 'fw-005',
    slug: 'launch-readiness-board',
    name: 'Launch Readiness Board',
    description: 'Multi-function go/no-go assessment: Engineering, Product, Marketing, Support, and Program each assess readiness for a product launch.',
    icon: '🚀',
    type: 'cross-functional',
    personas: ['program', 'engineering', 'product', 'marketing'],
    complexity: 'complex',
    estimatedTime: '5–10 min',
    inputs: [
      { id: 'launch_name', label: 'Launch Name', type: 'text', required: true, placeholder: 'e.g. Credit Card Modernization v2' },
      { id: 'launch_date', label: 'Target Date', type: 'text', required: true, placeholder: 'YYYY-MM-DD' },
      { id: 'scope', label: 'Launch Scope', type: 'textarea', required: true, placeholder: 'What is being launched? Features, services, changes...' },
      { id: 'risks', label: 'Known Risks', type: 'textarea', placeholder: 'List any pre-identified risks' },
    ],
    steps: [
      { id: 'fw-005-s1', name: 'Engineering Readiness', agent: 'Colonel Atlas', agentPersona: 'Engineering', tool: 'Claude', outputKey: 'eng_ready', description: 'Assess code freeze, test coverage, deployment plan, rollback strategy' },
      { id: 'fw-005-s2', name: 'Product Readiness', agent: 'Colonel Themis', agentPersona: 'Product', tool: 'Claude', outputKey: 'prod_ready', description: 'Verify feature completeness, documentation, and user flows' },
      { id: 'fw-005-s3', name: 'Marketing Readiness', agent: 'Colonel Hyperion', agentPersona: 'Marketing', tool: 'Claude', outputKey: 'mkt_ready', description: 'Confirm campaign assets, messaging, and enablement materials' },
      { id: 'fw-005-s4', name: 'RAID Assessment', agent: 'Colonel Chronos', agentPersona: 'Program', tool: 'Claude', outputKey: 'raid', description: 'Consolidate risks, assumptions, issues, and dependencies across all functions', dependsOn: ['fw-005-s1', 'fw-005-s2', 'fw-005-s3'] },
      { id: 'fw-005-s5', name: 'Go/No-Go Decision', agent: 'Colonel Chronos', agentPersona: 'Program', tool: 'Claude', outputKey: 'go_nogo', description: 'Calculate launch confidence score and produce go/no-go recommendation', requiresApproval: true, dependsOn: ['fw-005-s4'] },
      { id: 'fw-005-s6', name: 'Launch Communication', agent: 'Captain Hermes', agentPersona: 'Program', tool: 'Slack', outputKey: 'launch_comms', description: 'Draft internal and external launch communications', dependsOn: ['fw-005-s5'] },
    ],
    outputs: ['eng_ready', 'prod_ready', 'mkt_ready', 'raid', 'go_nogo', 'launch_comms'],
    tools: ['Claude', 'Jira', 'Confluence', 'Slack'],
    tags: ['launch', 'readiness', 'cross-functional', 'program'],
  },
];

// ═══════════════════════════════════════════════════════════════
// Query Functions
// ═══════════════════════════════════════════════════════════════

export function getFlagshipWorkflow(idOrSlug: string): WorkflowTemplate | undefined {
  return FLAGSHIP_WORKFLOWS.find(w => w.id === idOrSlug || w.slug === idOrSlug);
}

export function getFlagshipWorkflows(type?: string): WorkflowTemplate[] {
  return type ? FLAGSHIP_WORKFLOWS.filter(w => w.type === type) : FLAGSHIP_WORKFLOWS;
}

export function getFlagshipWorkflowsByPersona(persona: string): WorkflowTemplate[] {
  return FLAGSHIP_WORKFLOWS.filter(w => w.personas.includes(persona));
}
