/**
 * Product Persona — Skill Catalog
 * 10 seed skills for product management teams.
 * All use the same AgentOS execution runtime as Marketing and Engineering.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import type { PersonaSkillDef } from './engineering-skills-data.js';

export const PRODUCT_SKILLS: PersonaSkillDef[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1) PRD Generator
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'prd-001',
    slug: 'prd-generator',
    name: 'PRD Generator',
    description: 'Generate a structured PRD from a feature brief, notes, or source documents. Covers problem, goals, user stories, success metrics, scope, and constraints.',
    icon: '📋',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Requirements',
    complexity: 'moderate',
    estimatedTime: '60–120s',
    inputs: [
      // Basic
      { id: 'feature_name', label: 'Feature Name', type: 'text', required: true, placeholder: 'e.g. Multi-tenant Dashboard', section: 'basic' },
      { id: 'problem_statement', label: 'Problem Statement', type: 'textarea', required: true, placeholder: 'What problem does this solve? Who is affected and how?', section: 'basic' },
      { id: 'target_user', label: 'Target User', type: 'text', required: true, placeholder: 'e.g. Enterprise admins, SMB owners', section: 'basic' },
      { id: 'goal', label: 'Goal', type: 'textarea', required: true, placeholder: 'What outcome do we want? e.g. Reduce time-to-value by 40% for new users', section: 'basic' },
      // Advanced
      { id: 'background', label: 'Background', type: 'textarea', placeholder: 'Prior research, business context, customer quotes', section: 'advanced' },
      { id: 'success_metrics', label: 'Success Metrics', type: 'tags', placeholder: 'e.g. 30% activation rate, NPS > 40', section: 'advanced' },
      { id: 'constraints', label: 'Constraints', type: 'tags', placeholder: 'Technical, legal, resource constraints', section: 'advanced' },
      { id: 'stakeholders', label: 'Stakeholders', type: 'tags', placeholder: 'e.g. CTO, Sales Lead, Legal', section: 'advanced' },
      { id: 'out_of_scope', label: 'Out of Scope', type: 'textarea', placeholder: 'List explicitly what this does NOT include', section: 'advanced' },
      { id: 'release_timeline', label: 'Release Timeline', type: 'text', placeholder: 'e.g. Q3 2026 GA', section: 'advanced' },
      { id: 'create_confluence_draft', label: 'Create Confluence Draft', type: 'toggle', section: 'advanced', helpText: 'Requires Confluence connected in Integrations.' },
      // Files
      { id: 'file_attachments', label: 'Attach Brief, Notes, Research Docs', type: 'file', multiple: true, accept: '.pdf,.doc,.docx,.txt,.md,.png,.jpg', section: 'advanced' },
    ],
    steps: [
      { id: 'prd-001-s1', order: 1, name: 'Ingest Source Documents & Extract Context', agent: 'Research', tool: 'Claude', outputKey: 'extracted_context', capability: 'content.generate_prd' },
      { id: 'prd-001-s2', order: 2, name: 'Generate Goals & Success Metrics', agent: 'Strategy', tool: 'Claude', outputKey: 'goals_metrics', capability: 'content.generate_prd' },
      { id: 'prd-001-s3', order: 3, name: 'Generate User Stories', agent: 'Product', tool: 'Claude', outputKey: 'user_stories', capability: 'content.generate_prd' },
      { id: 'prd-001-s4', order: 4, name: 'Define Scope & Out-of-Scope', agent: 'Product', tool: 'Claude', outputKey: 'scope_definition', capability: 'content.generate_prd' },
      { id: 'prd-001-s5', order: 5, name: 'Compile Full PRD Document', agent: 'Writer', tool: 'Claude', outputKey: 'prd_document', requiresApproval: true, capability: 'content.generate_prd' },
      { id: 'prd-001-s6', order: 6, name: 'Create Confluence Draft', agent: 'Writer', tool: 'Confluence', outputKey: 'confluence_ref', capability: 'docs.create_doc_draft' },
    ],
    outputs: ['extracted_context', 'goals_metrics', 'user_stories', 'scope_definition', 'prd_document', 'confluence_ref'],
    requiredTools: ['Claude'],
    optionalTools: ['Confluence', 'Google Drive'],
    tags: ['prd', 'requirements', 'planning', 'documentation'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2) BRD Generator (retained, no spec update needed)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'prd-002',
    slug: 'brd-generator',
    name: 'BRD Generator',
    description: 'Create a Business Requirements Document covering stakeholder needs, business rules, process flows, and compliance requirements.',
    icon: '📊',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Requirements',
    complexity: 'moderate',
    estimatedTime: '60–120s',
    inputs: [
      { id: 'initiative_name', label: 'Initiative Name', type: 'text', required: true, placeholder: 'e.g. Self-serve Onboarding Redesign', section: 'basic' },
      { id: 'business_context', label: 'Business Context', type: 'textarea', required: true, placeholder: 'Why this initiative? What business need drives it?', section: 'basic' },
      { id: 'stakeholders', label: 'Key Stakeholders', type: 'tags', required: true, placeholder: 'e.g. CFO, Sales VP, Legal', section: 'basic' },
      { id: 'success_criteria', label: 'Success Criteria', type: 'textarea', placeholder: 'How will you measure success?', section: 'advanced' },
      { id: 'compliance_requirements', label: 'Compliance / Regulatory Notes', type: 'textarea', placeholder: 'GDPR, SOC 2, HIPAA, etc.', section: 'advanced' },
      { id: 'file_attachments', label: 'Attach Supporting Docs', type: 'file', multiple: true, section: 'advanced' },
    ],
    steps: [
      { id: 'prd-002-s1', order: 1, name: 'Stakeholder Analysis', agent: 'Research', tool: 'Claude', outputKey: 'stakeholder_analysis', capability: 'content.generate_prd' },
      { id: 'prd-002-s2', order: 2, name: 'Business Rules Extraction', agent: 'Strategy', tool: 'Claude', outputKey: 'business_rules', capability: 'content.generate_prd' },
      { id: 'prd-002-s3', order: 3, name: 'Process Flow Mapping', agent: 'Product', tool: 'Claude', outputKey: 'process_flows', capability: 'content.generate_prd' },
      { id: 'prd-002-s4', order: 4, name: 'Compile BRD Document', agent: 'Writer', tool: 'Claude', outputKey: 'brd_document', requiresApproval: true, capability: 'content.generate_prd' },
    ],
    outputs: ['stakeholder_analysis', 'business_rules', 'process_flows', 'brd_document'],
    requiredTools: ['Claude'],
    optionalTools: ['Jira', 'Google Drive'],
    tags: ['brd', 'requirements', 'business', 'documentation'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3) Jira Epic Generator
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'prd-003',
    slug: 'jira-epic-generator',
    name: 'Jira Epic Generator',
    description: 'Convert a PRD or feature brief into structured Jira epics and optionally child stories. Pushes directly to Jira when connected.',
    icon: '🗂️',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Planning',
    complexity: 'simple',
    estimatedTime: '30–60s',
    inputs: [
      // Basic
      { id: 'source_context', label: 'Source PRD / Feature Context', type: 'textarea', required: true, placeholder: 'Paste PRD text, feature brief, or source doc URL', section: 'basic' },
      { id: 'feature_name', label: 'Feature Name', type: 'text', required: true, placeholder: 'e.g. User Profile Overhaul', section: 'basic' },
      { id: 'project_key', label: 'Jira Project Key', type: 'text', required: false, placeholder: 'e.g. PLAT or ENG', section: 'basic', helpText: 'Required to push epics directly to Jira.' },
      { id: 'include_stories', label: 'Include Child Stories', type: 'toggle', section: 'basic' },
      // Advanced
      { id: 'epic_count_preference', label: 'Epic Count Preference', type: 'select', options: ['Auto', '3–5', '5–8', 'Detailed breakdown'], section: 'advanced' },
      { id: 'release_target', label: 'Release Target', type: 'text', placeholder: 'e.g. Q3 2026 / Sprint 42', section: 'advanced' },
      { id: 'owner', label: 'Owner', type: 'text', placeholder: 'Team or person', section: 'advanced' },
      { id: 'push_to_jira', label: 'Push to Jira', type: 'toggle', section: 'advanced', helpText: 'Requires Jira connected with write scope.', dependsOn: 'project_key' },
      // Files
      { id: 'file_attachments', label: 'Attach PRD or Roadmap Docs', type: 'file', multiple: true, accept: '.pdf,.doc,.docx,.txt,.md', section: 'advanced' },
    ],
    steps: [
      { id: 'prd-003-s1', order: 1, name: 'Ingest PRD & Identify Workstreams', agent: 'Research', tool: 'Claude', outputKey: 'workstreams', capability: 'content.generate_epics' },
      { id: 'prd-003-s2', order: 2, name: 'Generate Epic Set & Descriptions', agent: 'Product', tool: 'Claude', outputKey: 'epic_set', capability: 'content.generate_epics' },
      { id: 'prd-003-s3', order: 3, name: 'Generate Acceptance Criteria Summaries', agent: 'Product', tool: 'Claude', outputKey: 'epic_ac', capability: 'content.generate_epics' },
      { id: 'prd-003-s4', order: 4, name: 'Generate Child Story Suggestions', agent: 'Product', tool: 'Claude', outputKey: 'story_suggestions', capability: 'content.generate_epics' },
      { id: 'prd-003-s5', order: 5, name: 'Create Jira Epics', agent: 'Product', tool: 'Jira', outputKey: 'jira_issue_refs', requiresApproval: true, capability: 'ticket.create_epic' },
    ],
    outputs: ['workstreams', 'epic_set', 'epic_ac', 'story_suggestions', 'jira_issue_refs'],
    requiredTools: ['Claude'],
    optionalTools: ['Jira', 'Google Drive'],
    tags: ['jira', 'epic', 'planning', 'agile'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4) User Story Generator
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'prd-004',
    slug: 'user-story-generator',
    name: 'User Story Generator',
    description: 'Generate sprint-ready user stories from PRD or feature context. Includes acceptance criteria, edge cases, and optional Jira story creation.',
    icon: '👤',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Planning',
    complexity: 'simple',
    estimatedTime: '30–60s',
    inputs: [
      // Basic
      { id: 'feature_name', label: 'Feature Name', type: 'text', required: true, placeholder: 'e.g. OAuth2 Login', section: 'basic' },
      { id: 'source_context', label: 'Feature Description / PRD Context', type: 'textarea', required: true, placeholder: 'Paste feature brief, PRD excerpt, or epic summary', section: 'basic' },
      { id: 'persona', label: 'User Persona', type: 'text', placeholder: 'e.g. Admin, End User, Guest', section: 'basic' },
      { id: 'include_acceptance_criteria', label: 'Include Acceptance Criteria', type: 'toggle', section: 'basic' },
      // Advanced
      { id: 'story_format', label: 'Story Format', type: 'select', options: ['Standard user story', 'Job story', 'Technical task', 'Mixed'], section: 'advanced' },
      { id: 'include_edge_cases', label: 'Include Edge Cases', type: 'toggle', section: 'advanced' },
      { id: 'project_key', label: 'Jira Project Key', type: 'text', placeholder: 'e.g. PLAT', section: 'advanced' },
      { id: 'push_to_jira', label: 'Push Stories to Jira', type: 'toggle', section: 'advanced', helpText: 'Requires Jira connected.', dependsOn: 'project_key' },
      // Files
      { id: 'file_attachments', label: 'Attach PRD, Flow Diagrams, Notes', type: 'file', multiple: true, accept: '.pdf,.doc,.docx,.txt,.md,.png,.jpg', section: 'advanced' },
    ],
    steps: [
      { id: 'prd-004-s1', order: 1, name: 'Identify User Journeys', agent: 'Research', tool: 'Claude', outputKey: 'user_journeys', capability: 'content.generate_user_stories' },
      { id: 'prd-004-s2', order: 2, name: 'Draft User Stories', agent: 'Product', tool: 'Claude', outputKey: 'user_stories', capability: 'content.generate_user_stories' },
      { id: 'prd-004-s3', order: 3, name: 'Write Acceptance Criteria', agent: 'Product', tool: 'Claude', outputKey: 'acceptance_criteria', capability: 'content.generate_user_stories' },
      { id: 'prd-004-s4', order: 4, name: 'Write Edge Cases', agent: 'Product', tool: 'Claude', outputKey: 'edge_cases', capability: 'content.generate_user_stories' },
      { id: 'prd-004-s5', order: 5, name: 'Create Jira Stories', agent: 'Product', tool: 'Jira', outputKey: 'jira_story_refs', requiresApproval: true, capability: 'ticket.create_story' },
    ],
    outputs: ['user_journeys', 'user_stories', 'acceptance_criteria', 'edge_cases', 'jira_story_refs'],
    requiredTools: ['Claude'],
    optionalTools: ['Jira'],
    tags: ['user-stories', 'agile', 'planning', 'requirements'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5) Acceptance Criteria Generator (retained)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'prd-005',
    slug: 'acceptance-criteria-generator',
    name: 'Acceptance Criteria Generator',
    description: 'Write precise, testable acceptance criteria for any user story, covering happy paths, edge cases, and error states.',
    icon: '✅',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Requirements',
    complexity: 'simple',
    estimatedTime: '20–45s',
    inputs: [
      { id: 'user_story', label: 'User Story', type: 'textarea', required: true, placeholder: 'Paste the user story text here', section: 'basic' },
      { id: 'context', label: 'Additional Context', type: 'textarea', placeholder: 'Business rules, edge cases, known constraints', section: 'advanced' },
      { id: 'format', label: 'AC Format', type: 'select', options: ['Given/When/Then', 'Checklist', 'Structured Paragraphs'], section: 'advanced' },
    ],
    steps: [
      { id: 'prd-005-s1', order: 1, name: 'Analyze Story & Extract Requirements', agent: 'Research', tool: 'Claude', outputKey: 'requirements_analysis', capability: 'content.generate_user_stories' },
      { id: 'prd-005-s2', order: 2, name: 'Write Happy Path Criteria', agent: 'Product', tool: 'Claude', outputKey: 'happy_path_ac', capability: 'content.generate_user_stories' },
      { id: 'prd-005-s3', order: 3, name: 'Write Edge Cases & Error States', agent: 'Product', tool: 'Claude', outputKey: 'edge_case_ac', capability: 'content.generate_user_stories' },
      { id: 'prd-005-s4', order: 4, name: 'Compile Final AC Document', agent: 'Writer', tool: 'Claude', outputKey: 'acceptance_criteria', capability: 'content.generate_user_stories' },
    ],
    outputs: ['requirements_analysis', 'happy_path_ac', 'edge_case_ac', 'acceptance_criteria'],
    requiredTools: ['Claude'],
    optionalTools: ['Jira'],
    tags: ['acceptance-criteria', 'testing', 'quality', 'agile'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6) Roadmap Builder
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'prd-006',
    slug: 'roadmap-builder',
    name: 'Roadmap Builder',
    description: 'Generate a roadmap draft from strategy themes, initiatives, and timelines. Creates milestone view and optionally pushes a Confluence draft.',
    icon: '🗺️',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Strategy',
    complexity: 'moderate',
    estimatedTime: '60–120s',
    inputs: [
      // Basic
      { id: 'roadmap_name', label: 'Roadmap Name', type: 'text', required: true, placeholder: 'e.g. Product Roadmap H2 2026', section: 'basic' },
      { id: 'time_horizon', label: 'Time Horizon', type: 'select', required: true, options: ['1 quarter', '2 quarters', '6 months', '12 months', 'Custom'], section: 'basic' },
      { id: 'initiatives', label: 'Initiatives / Features', type: 'textarea', required: true, placeholder: 'List initiatives (one per line)', section: 'basic' },
      // Advanced
      { id: 'business_goals', label: 'Business Goals', type: 'tags', placeholder: 'e.g. Increase ARR, reduce churn, expand APAC', section: 'advanced' },
      { id: 'dependencies', label: 'Dependencies', type: 'textarea', placeholder: 'Cross-team or external dependencies', section: 'advanced' },
      { id: 'team_constraints', label: 'Team Constraints', type: 'textarea', placeholder: 'e.g. 2 squads, ~20 eng-weeks per quarter', section: 'advanced' },
      { id: 'quarters', label: 'Quarter Labels', type: 'tags', placeholder: 'e.g. Q1 2026, Q2 2026', section: 'advanced' },
      { id: 'create_confluence_draft', label: 'Create Confluence Draft', type: 'toggle', section: 'advanced', helpText: 'Requires Confluence connected.' },
      // Files
      { id: 'file_attachments', label: 'Attach Strategy Doc, Prior Roadmap, Spreadsheet', type: 'file', multiple: true, accept: '.pdf,.doc,.docx,.txt,.md,.xlsx,.csv', section: 'advanced' },
    ],
    steps: [
      { id: 'prd-006-s1', order: 1, name: 'Ingest Planning Materials', agent: 'Research', tool: 'Claude', outputKey: 'parsed_initiatives', capability: 'strategy.generate_roadmap' },
      { id: 'prd-006-s2', order: 2, name: 'Cluster Initiatives into Themes', agent: 'Strategy', tool: 'Claude', outputKey: 'themed_clusters', capability: 'strategy.generate_roadmap' },
      { id: 'prd-006-s3', order: 3, name: 'Sequence by Time Horizon & Priority', agent: 'Strategy', tool: 'Claude', outputKey: 'sequenced_roadmap', capability: 'strategy.generate_roadmap' },
      { id: 'prd-006-s4', order: 4, name: 'Generate Milestone View', agent: 'Product', tool: 'Claude', outputKey: 'milestone_view', capability: 'strategy.generate_roadmap' },
      { id: 'prd-006-s5', order: 5, name: 'Compile Roadmap Document', agent: 'Writer', tool: 'Claude', outputKey: 'roadmap_document', requiresApproval: true, capability: 'strategy.generate_roadmap' },
      { id: 'prd-006-s6', order: 6, name: 'Create Confluence Draft', agent: 'Writer', tool: 'Confluence', outputKey: 'confluence_ref', capability: 'docs.create_doc_draft' },
    ],
    outputs: ['parsed_initiatives', 'themed_clusters', 'sequenced_roadmap', 'milestone_view', 'roadmap_document', 'confluence_ref'],
    requiredTools: ['Claude'],
    optionalTools: ['Confluence', 'Google Drive'],
    tags: ['roadmap', 'strategy', 'planning', 'prioritization'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7) Competitor Analysis Brief
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'prd-007',
    slug: 'competitor-analysis-brief',
    name: 'Competitor Analysis Brief',
    description: 'Generate a structured competitor analysis covering positioning, feature gaps, strengths, weaknesses, and opportunity spaces. Optionally creates a Confluence draft.',
    icon: '🔬',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Strategy',
    complexity: 'moderate',
    estimatedTime: '60–120s',
    inputs: [
      // Basic
      { id: 'competitor_name', label: 'Competitor Name', type: 'text', required: true, placeholder: 'e.g. Salesforce, Monday.com', section: 'basic' },
      { id: 'topic_or_product_area', label: 'Topic / Product Area', type: 'text', required: true, placeholder: 'e.g. AI automation, onboarding UX, pricing', section: 'basic' },
      { id: 'comparison_dimensions', label: 'Comparison Dimensions', type: 'multiselect', options: ['Features', 'UX', 'Pricing', 'Positioning', 'Technical capabilities', 'Audience fit', 'GTM'], section: 'basic' },
      // Advanced
      { id: 'target_audience', label: 'Target Audience', type: 'text', placeholder: 'e.g. Series B SaaS, 50–200 employees', section: 'advanced' },
      { id: 'geography', label: 'Geography', type: 'text', placeholder: 'e.g. North America, EMEA', section: 'advanced' },
      { id: 'use_case', label: 'Use Case', type: 'textarea', placeholder: 'Specific use case you are competing in', section: 'advanced' },
      { id: 'internal_positioning_notes', label: 'Internal Positioning Notes', type: 'textarea', placeholder: 'Your current positioning, differentiation thesis', section: 'advanced' },
      { id: 'create_confluence_draft', label: 'Create Confluence Draft', type: 'toggle', section: 'advanced', helpText: 'Requires Confluence connected.' },
      // Files
      { id: 'file_attachments', label: 'Attach Screenshots, Analyst Notes, Competitor Docs', type: 'file', multiple: true, accept: '.pdf,.doc,.docx,.txt,.md,.png,.jpg', section: 'advanced' },
    ],
    steps: [
      { id: 'prd-007-s1', order: 1, name: 'Ingest Source Inputs & Context', agent: 'Research', tool: 'Claude', outputKey: 'ingested_context', capability: 'research.collect_competitor_context' },
      { id: 'prd-007-s2', order: 2, name: 'Research Competitor via Web', agent: 'Research', tool: 'Perplexity', outputKey: 'web_research', capability: 'research.web_search' },
      { id: 'prd-007-s3', order: 3, name: 'Build Feature & Positioning Matrix', agent: 'Strategy', tool: 'Claude', outputKey: 'comparison_matrix', capability: 'content.generate_comparison_brief' },
      { id: 'prd-007-s4', order: 4, name: 'Generate Gap Analysis & Opportunities', agent: 'Strategy', tool: 'Claude', outputKey: 'gap_analysis', capability: 'content.generate_comparison_brief' },
      { id: 'prd-007-s5', order: 5, name: 'Compile Competitor Brief', agent: 'Writer', tool: 'Claude', outputKey: 'competitor_brief', requiresApproval: true, capability: 'content.generate_comparison_brief' },
      { id: 'prd-007-s6', order: 6, name: 'Create Confluence Draft', agent: 'Writer', tool: 'Confluence', outputKey: 'confluence_ref', capability: 'docs.create_doc_draft' },
    ],
    outputs: ['ingested_context', 'web_research', 'comparison_matrix', 'gap_analysis', 'competitor_brief', 'confluence_ref'],
    requiredTools: ['Claude'],
    optionalTools: ['Perplexity', 'Confluence', 'Google Drive'],
    tags: ['competitive', 'research', 'strategy', 'market-analysis'],
  },

  {
    id: 'prd-008',
    slug: 'release-notes-generator',
    name: 'Release Notes Generator',
    description: 'Transform a list of changes, bug fixes, and improvements into polished, user-facing release notes in multiple formats (developer, marketing, changelog).',
    icon: '📣',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Communication',
    complexity: 'simple',
    estimatedTime: '30–60s',
    inputs: [
      { id: 'version', label: 'Version / Release Name', type: 'text', required: true, placeholder: 'e.g. v2.4.0 — Spring Release', section: 'basic' },
      { id: 'changes', label: 'Changes & Fixes', type: 'textarea', required: true, placeholder: 'List features added, bugs fixed, improvements made (one per line)', section: 'basic' },
      { id: 'audience', label: 'Primary Audience', type: 'select', required: false, options: ['Developers', 'End Users', 'Enterprise Admins', 'All'], section: 'advanced' },
      { id: 'tone', label: 'Tone', type: 'select', required: false, options: ['Professional', 'Friendly & Casual', 'Technical', 'Marketing-focused'], section: 'advanced' },
      { id: 'known_issues', label: 'Known Issues', type: 'textarea', required: false, placeholder: 'Any known bugs or limitations in this release?', section: 'advanced' },
    ],
    steps: [
      { id: 'prd-008-s1', order: 1, name: 'Categorize & Prioritize Changes', agent: 'Product', tool: 'Claude', outputKey: 'categorized_changes', capability: 'product.write_stories' },
      { id: 'prd-008-s2', order: 2, name: 'Write User-Facing Highlights', agent: 'Writer', tool: 'Claude', outputKey: 'highlights', capability: 'writing.compile_document' },
      { id: 'prd-008-s3', order: 3, name: 'Generate Technical Changelog', agent: 'Writer', tool: 'Claude', outputKey: 'technical_changelog', capability: 'writing.compile_document' },
      { id: 'prd-008-s4', order: 4, name: 'Compile Full Release Notes', agent: 'Writer', tool: 'Claude', outputKey: 'release_notes', capability: 'writing.compile_document' },
    ],
    outputs: ['categorized_changes', 'highlights', 'technical_changelog', 'release_notes'],
    requiredTools: ['Claude'],
    optionalTools: ['GitHub', 'Jira'],
    tags: ['release-notes', 'changelog', 'communication', 'launches'],
  },

  {
    id: 'prd-009',
    slug: 'stakeholder-update-generator',
    name: 'Stakeholder Update Generator',
    description: 'Create a structured stakeholder update (weekly, monthly, or milestone-based) covering progress, blockers, next steps, and KPIs.',
    icon: '📢',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Communication',
    complexity: 'simple',
    estimatedTime: '30–60s',
    inputs: [
      { id: 'initiative_name', label: 'Initiative / Project Name', type: 'text', required: true, placeholder: 'e.g. Platform Migration Q1', section: 'basic' },
      { id: 'update_period', label: 'Update Period', type: 'text', required: true, placeholder: 'e.g. Week 12, Feb 24–28 2026', section: 'basic' },
      { id: 'progress', label: 'Progress This Period', type: 'textarea', required: true, placeholder: 'What was completed? Key milestones hit?', section: 'basic' },
      { id: 'blockers', label: 'Blockers & Risks', type: 'textarea', required: false, placeholder: 'What is slowing things down?', section: 'advanced' },
      { id: 'next_steps', label: 'Next Steps', type: 'textarea', required: false, placeholder: 'What is planned for the next period?', section: 'advanced' },
      { id: 'kpis', label: 'Key Metrics / KPIs', type: 'textarea', required: false, placeholder: 'e.g. 94% uptime, 2 features shipped, 3 bugs fixed', section: 'advanced' },
      { id: 'audience', label: 'Audience', type: 'select', required: false, options: ['Executive / C-Suite', 'Engineering Leadership', 'Cross-functional Team', 'Board'], section: 'advanced' },
    ],
    steps: [
      { id: 'prd-009-s1', order: 1, name: 'Structure Update Content', agent: 'Product', tool: 'Claude', outputKey: 'structured_content', capability: 'product.write_stories' },
      { id: 'prd-009-s2', order: 2, name: 'Write Executive Summary', agent: 'Writer', tool: 'Claude', outputKey: 'executive_summary', capability: 'writing.compile_document' },
      { id: 'prd-009-s3', order: 3, name: 'Format Full Stakeholder Update', agent: 'Writer', tool: 'Claude', outputKey: 'stakeholder_update', capability: 'writing.compile_document' },
    ],
    outputs: ['structured_content', 'executive_summary', 'stakeholder_update'],
    requiredTools: ['Claude'],
    optionalTools: ['Google Drive'],
    tags: ['stakeholder', 'communication', 'updates', 'reporting'],
  },

  {
    id: 'prd-010',
    slug: 'customer-feedback-synthesizer',
    name: 'Customer Feedback Synthesizer',
    description: 'Synthesize raw customer feedback into structured insights: top themes, pain points, feature requests, sentiment distribution, and recommended actions.',
    icon: '💬',
    persona: 'product',
    executableType: 'skill',
    cluster: 'Research',
    complexity: 'moderate',
    estimatedTime: '60–120s',
    inputs: [
      { id: 'feedback_text', label: 'Raw Customer Feedback', type: 'textarea', required: true, placeholder: 'Paste verbatim customer feedback, support tickets, survey responses, or NPS comments', section: 'basic' },
      { id: 'source', label: 'Feedback Source', type: 'select', required: false, options: ['NPS Survey', 'Support Tickets', 'User Interviews', 'App Store Reviews', 'Sales Calls', 'Mixed'], section: 'basic' },
      { id: 'product_area', label: 'Product Area Focus', type: 'text', required: false, placeholder: 'e.g. Onboarding, Billing, Reporting', section: 'advanced' },
      { id: 'time_period', label: 'Time Period', type: 'text', required: false, placeholder: 'e.g. Q1 2026', section: 'advanced' },
      { id: 'customer_segment', label: 'Customer Segment', type: 'text', required: false, placeholder: 'e.g. Enterprise, SMB, Free tier', section: 'advanced' },
    ],
    steps: [
      { id: 'prd-010-s1', order: 1, name: 'Cluster Feedback by Theme', agent: 'Research', tool: 'Claude', outputKey: 'theme_clusters', capability: 'research.synthesize' },
      { id: 'prd-010-s2', order: 2, name: 'Sentiment & Frequency Analysis', agent: 'Research', tool: 'Claude', outputKey: 'sentiment_analysis', capability: 'research.synthesize' },
      { id: 'prd-010-s3', order: 3, name: 'Extract Feature Requests & Pain Points', agent: 'Product', tool: 'Claude', outputKey: 'feature_requests_pain_points', capability: 'product.write_stories' },
      { id: 'prd-010-s4', order: 4, name: 'Generate Recommended Actions', agent: 'Strategy', tool: 'Claude', outputKey: 'recommendations', capability: 'strategy.define_metrics' },
      { id: 'prd-010-s5', order: 5, name: 'Compile Insights Report', agent: 'Writer', tool: 'Claude', outputKey: 'insights_report', requiresApproval: true, capability: 'writing.compile_document' },
    ],
    outputs: ['theme_clusters', 'sentiment_analysis', 'feature_requests_pain_points', 'recommendations', 'insights_report'],
    requiredTools: ['Claude'],
    optionalTools: ['Perplexity'],
    tags: ['feedback', 'research', 'customer-insights', 'analysis'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getProductSkill(idOrSlug: string): PersonaSkillDef | undefined {
  return PRODUCT_SKILLS.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
}

export function getProductSkillsByCluster(): Record<string, PersonaSkillDef[]> {
  const result: Record<string, PersonaSkillDef[]> = {};
  for (const skill of PRODUCT_SKILLS) {
    if (!result[skill.cluster]) result[skill.cluster] = [];
    result[skill.cluster].push(skill);
  }
  return result;
}
