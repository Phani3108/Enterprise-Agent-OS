/**
 * HR & Talent Acquisition Persona — Skill Catalog
 * 10 seed skills for People's Success & Talent Acquisition teams.
 * All use the same AgentOS execution runtime as Marketing, Engineering, Product.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import type { UnifiedSkillDef } from '@agentos/skills/schema';

export const HR_SKILLS: UnifiedSkillDef[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1) Job Description Generator
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-001',
    slug: 'jd-generator',
    name: 'Job Description Generator',
    description: 'Generate inclusive, compelling, and structured job descriptions from a brief. Covers responsibilities, qualifications, comp range, and DEI language audit.',
    icon: '📝',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'Talent Acquisition',
    complexity: 'moderate',
    estimatedTime: '30–60s',
    inputs: [
      { id: 'role_title', label: 'Role Title', type: 'text', required: true, placeholder: 'e.g. Senior Product Manager', section: 'basic' },
      { id: 'department', label: 'Department / Team', type: 'text', required: true, placeholder: 'e.g. Product, Engineering, Marketing', section: 'basic' },
      { id: 'level', label: 'Level', type: 'select', required: true, options: ['Intern', 'Junior', 'Mid-level', 'Senior', 'Staff', 'Principal', 'Director', 'VP', 'C-Suite'], section: 'basic' },
      { id: 'hiring_manager_notes', label: 'Hiring Manager Brief', type: 'textarea', required: true, placeholder: 'Describe what this person will do, must-have skills, and team context', section: 'basic' },
      { id: 'location_type', label: 'Location Type', type: 'select', options: ['Remote', 'Hybrid', 'On-site'], section: 'basic' },
      { id: 'comp_range', label: 'Compensation Range', type: 'text', placeholder: 'e.g. $150K–$200K + equity', section: 'advanced' },
      { id: 'company_values', label: 'Company Values / Culture Notes', type: 'textarea', placeholder: 'Core values, culture highlights, perks', section: 'advanced' },
      { id: 'dei_audit', label: 'Run DEI Language Audit', type: 'toggle', section: 'advanced', helpText: 'Scan for exclusionary or biased language.' },
      { id: 'file_attachments', label: 'Attach Existing JDs or Templates', type: 'file', multiple: true, accept: '.pdf,.doc,.docx,.txt,.md', section: 'advanced' },
    ],
    steps: [
      { id: 'hr-001-s1', order: 1, name: 'Extract Role Requirements', agent: 'TA Strategist', tool: 'Claude', outputKey: 'role_requirements', capability: 'content.generate_jd' },
      { id: 'hr-001-s2', order: 2, name: 'Generate Responsibilities & Qualifications', agent: 'TA Writer', tool: 'Claude', outputKey: 'responsibilities_qualifications', capability: 'content.generate_jd' },
      { id: 'hr-001-s3', order: 3, name: 'Add Benefits & Culture Section', agent: 'People Ops', tool: 'Claude', outputKey: 'benefits_culture', capability: 'content.generate_jd' },
      { id: 'hr-001-s4', order: 4, name: 'DEI Language Audit', agent: 'DEI Analyst', tool: 'Claude', outputKey: 'dei_audit', capability: 'content.dei_scan' },
      { id: 'hr-001-s5', order: 5, name: 'Compile Final Job Description', agent: 'TA Writer', tool: 'Claude', outputKey: 'job_description', requiresApproval: true, capability: 'content.generate_jd' },
    ],
    outputs: ['role_requirements', 'responsibilities_qualifications', 'benefits_culture', 'dei_audit', 'job_description'],
    requiredTools: ['Claude'],
    optionalTools: ['Greenhouse', 'Lever'],
    tags: ['job-description', 'hiring', 'dei', 'talent-acquisition'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2) Resume Screener & Scorer
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-002',
    slug: 'resume-screener',
    name: 'Resume Screener & Scorer',
    description: 'Screen and score a batch of resumes against a JD. Generates fit scores, highlights, red flags, and a ranked shortlist.',
    icon: '📄',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'Talent Acquisition',
    complexity: 'moderate',
    estimatedTime: '45–90s',
    inputs: [
      { id: 'job_description', label: 'Job Description (paste or attach)', type: 'textarea', required: true, placeholder: 'Paste the JD or attach below', section: 'basic' },
      { id: 'screening_criteria', label: 'Screening Criteria', type: 'tags', required: true, placeholder: 'e.g. 5+ years PM, B2B SaaS, SQL', section: 'basic' },
      { id: 'shortlist_size', label: 'Shortlist Size', type: 'select', required: true, options: ['Top 3', 'Top 5', 'Top 10', 'All Qualified'], section: 'basic' },
      { id: 'resume_files', label: 'Upload Resumes', type: 'file', required: true, multiple: true, accept: '.pdf,.doc,.docx,.txt', section: 'basic' },
      { id: 'bias_mitigation', label: 'Blind Screening (remove names/photos)', type: 'toggle', section: 'advanced', helpText: 'Redacts identifying info before scoring.' },
      { id: 'deal_breakers', label: 'Deal Breakers', type: 'tags', placeholder: 'e.g. No remote, must have visa sponsorship', section: 'advanced' },
    ],
    steps: [
      { id: 'hr-002-s1', order: 1, name: 'Parse & Normalize Resumes', agent: 'Resume Parser', tool: 'Claude', outputKey: 'parsed_resumes', capability: 'content.parse_resume' },
      { id: 'hr-002-s2', order: 2, name: 'Apply Blind Screening (if enabled)', agent: 'DEI Analyst', tool: 'Claude', outputKey: 'anonymized_resumes', capability: 'content.dei_scan' },
      { id: 'hr-002-s3', order: 3, name: 'Score Against JD Criteria', agent: 'TA Strategist', tool: 'Claude', outputKey: 'scoring_results', capability: 'content.score_resume' },
      { id: 'hr-002-s4', order: 4, name: 'Generate Ranked Shortlist', agent: 'TA Strategist', tool: 'Claude', outputKey: 'shortlist', requiresApproval: true, capability: 'content.score_resume' },
    ],
    outputs: ['parsed_resumes', 'anonymized_resumes', 'scoring_results', 'shortlist'],
    requiredTools: ['Claude'],
    optionalTools: ['Greenhouse', 'Lever'],
    tags: ['resume', 'screening', 'shortlist', 'bias-mitigation'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3) Interview Kit Generator
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-003',
    slug: 'interview-kit-generator',
    name: 'Interview Kit Generator',
    description: 'Generate structured interview kits with competency-based questions, scoring rubrics, and interviewer assignments.',
    icon: '🎤',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'Talent Acquisition',
    complexity: 'moderate',
    estimatedTime: '30–60s',
    inputs: [
      { id: 'role_title', label: 'Role', type: 'text', required: true, placeholder: 'e.g. Senior Backend Engineer', section: 'basic' },
      { id: 'competencies', label: 'Key Competencies to Assess', type: 'tags', required: true, placeholder: 'e.g. system design, leadership, communication', section: 'basic' },
      { id: 'interview_rounds', label: 'Interview Rounds', type: 'select', required: true, options: ['Phone Screen Only', 'Phone + Onsite (3 rounds)', 'Phone + Onsite (5 rounds)', 'Full Loop (6+ rounds)'], section: 'basic' },
      { id: 'interview_style', label: 'Interview Style', type: 'multiselect', options: ['Behavioral (STAR)', 'Technical', 'Case Study', 'Live Coding', 'Portfolio Review', 'Culture Fit'], section: 'basic' },
      { id: 'interviewer_panel', label: 'Interviewer Panel', type: 'tags', placeholder: 'Names or roles of interviewers', section: 'advanced' },
      { id: 'level', label: 'Level', type: 'select', options: ['Junior', 'Mid', 'Senior', 'Staff', 'Director+'], section: 'advanced' },
      { id: 'file_attachments', label: 'Attach JD or Resume', type: 'file', multiple: true, accept: '.pdf,.doc,.docx,.txt,.md', section: 'advanced' },
    ],
    steps: [
      { id: 'hr-003-s1', order: 1, name: 'Map Competencies to Interview Rounds', agent: 'TA Strategist', tool: 'Claude', outputKey: 'competency_map', capability: 'content.generate_interview_kit' },
      { id: 'hr-003-s2', order: 2, name: 'Generate Questions & Rubrics per Round', agent: 'TA Writer', tool: 'Claude', outputKey: 'interview_questions', capability: 'content.generate_interview_kit' },
      { id: 'hr-003-s3', order: 3, name: 'Create Interviewer Assignments', agent: 'TA Coordinator', tool: 'Claude', outputKey: 'interviewer_assignments', capability: 'content.generate_interview_kit' },
      { id: 'hr-003-s4', order: 4, name: 'Compile Interview Kit Document', agent: 'TA Writer', tool: 'Claude', outputKey: 'interview_kit', requiresApproval: true, capability: 'content.generate_interview_kit' },
    ],
    outputs: ['competency_map', 'interview_questions', 'interviewer_assignments', 'interview_kit'],
    requiredTools: ['Claude'],
    optionalTools: ['Greenhouse', 'Notion'],
    tags: ['interview', 'hiring', 'competency', 'rubric'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4) Offer Letter Generator
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-004',
    slug: 'offer-letter-generator',
    name: 'Offer Letter Generator',
    description: 'Generate personalized offer letters with compensation details, equity, benefits, and start date. Compliance-checked.',
    icon: '💼',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'Talent Acquisition',
    complexity: 'simple',
    estimatedTime: '15–30s',
    inputs: [
      { id: 'candidate_name', label: 'Candidate Name', type: 'text', required: true, placeholder: 'e.g. Jamie Rodriguez', section: 'basic' },
      { id: 'role_title', label: 'Role Title', type: 'text', required: true, placeholder: 'e.g. Senior Product Manager', section: 'basic' },
      { id: 'compensation', label: 'Base Salary', type: 'text', required: true, placeholder: 'e.g. $175,000', section: 'basic' },
      { id: 'equity', label: 'Equity Grant', type: 'text', placeholder: 'e.g. 10,000 RSUs over 4 years', section: 'basic' },
      { id: 'start_date', label: 'Proposed Start Date', type: 'text', placeholder: 'e.g. April 15, 2026', section: 'basic' },
      { id: 'signing_bonus', label: 'Signing Bonus', type: 'text', placeholder: 'e.g. $20,000', section: 'advanced' },
      { id: 'benefits_summary', label: 'Benefits Highlights', type: 'textarea', placeholder: 'List key benefits to highlight', section: 'advanced' },
      { id: 'special_terms', label: 'Special Terms / Exceptions', type: 'textarea', placeholder: 'Remote work agreement, visa sponsorship, etc.', section: 'advanced' },
    ],
    steps: [
      { id: 'hr-004-s1', order: 1, name: 'Generate Offer Letter Draft', agent: 'HR Ops', tool: 'Claude', outputKey: 'offer_draft', capability: 'content.generate_offer' },
      { id: 'hr-004-s2', order: 2, name: 'Compliance & Legal Check', agent: 'Compliance Analyst', tool: 'Claude', outputKey: 'compliance_check', capability: 'content.compliance_review' },
      { id: 'hr-004-s3', order: 3, name: 'Final Offer Letter', agent: 'HR Ops', tool: 'Claude', outputKey: 'offer_letter', requiresApproval: true, capability: 'content.generate_offer' },
    ],
    outputs: ['offer_draft', 'compliance_check', 'offer_letter'],
    requiredTools: ['Claude'],
    optionalTools: ['Google Drive', 'DocuSign'],
    tags: ['offer-letter', 'compensation', 'hiring', 'compliance'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5) Onboarding Plan Generator
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-005',
    slug: 'onboarding-plan-generator',
    name: 'Onboarding Plan Generator',
    description: 'Create a structured 30-60-90 day onboarding plan with milestones, training schedule, buddy assignments, and check-in cadence.',
    icon: '🎯',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'People Success',
    complexity: 'moderate',
    estimatedTime: '45–90s',
    inputs: [
      { id: 'new_hire_name', label: 'New Hire Name', type: 'text', required: true, placeholder: 'e.g. Alex Kim', section: 'basic' },
      { id: 'role_title', label: 'Role', type: 'text', required: true, placeholder: 'e.g. Senior Data Scientist', section: 'basic' },
      { id: 'department', label: 'Department', type: 'text', required: true, placeholder: 'e.g. Data Engineering', section: 'basic' },
      { id: 'manager_name', label: 'Manager', type: 'text', required: true, placeholder: 'Direct manager name', section: 'basic' },
      { id: 'start_date', label: 'Start Date', type: 'text', placeholder: 'e.g. April 15, 2026', section: 'basic' },
      { id: 'buddy', label: 'Buddy / Mentor', type: 'text', placeholder: 'Assigned buddy name', section: 'advanced' },
      { id: 'tools_access', label: 'Tools & Systems to Provision', type: 'tags', placeholder: 'e.g. Slack, GitHub, Jira, AWS', section: 'advanced' },
      { id: 'location_type', label: 'Work Arrangement', type: 'select', options: ['Remote', 'Hybrid', 'On-site'], section: 'advanced' },
    ],
    steps: [
      { id: 'hr-005-s1', order: 1, name: 'Generate 30-60-90 Day Plan', agent: 'People Ops', tool: 'Claude', outputKey: 'onboarding_plan', capability: 'content.generate_onboarding' },
      { id: 'hr-005-s2', order: 2, name: 'Create Tool Provisioning Checklist', agent: 'IT Coordinator', tool: 'Claude', outputKey: 'provisioning_checklist', capability: 'content.generate_onboarding' },
      { id: 'hr-005-s3', order: 3, name: 'Generate Check-in Schedule', agent: 'People Ops', tool: 'Claude', outputKey: 'checkin_schedule', capability: 'content.generate_onboarding' },
      { id: 'hr-005-s4', order: 4, name: 'Compile Full Onboarding Kit', agent: 'People Ops', tool: 'Claude', outputKey: 'onboarding_kit', requiresApproval: true, capability: 'content.generate_onboarding' },
    ],
    outputs: ['onboarding_plan', 'provisioning_checklist', 'checkin_schedule', 'onboarding_kit'],
    requiredTools: ['Claude'],
    optionalTools: ['Notion', 'Slack', 'Google Drive'],
    tags: ['onboarding', '30-60-90', 'new-hire', 'people-ops'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6) Performance Review Generator
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-006',
    slug: 'performance-review-generator',
    name: 'Performance Review Generator',
    description: 'Generate structured performance reviews from self-assessments, peer feedback, and manager notes. Includes ratings, growth areas, and promotion readiness.',
    icon: '📊',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'People Success',
    complexity: 'moderate',
    estimatedTime: '60–120s',
    inputs: [
      { id: 'employee_name', label: 'Employee Name', type: 'text', required: true, placeholder: 'e.g. Priya Patel', section: 'basic' },
      { id: 'role_title', label: 'Role', type: 'text', required: true, placeholder: 'e.g. Staff Engineer', section: 'basic' },
      { id: 'review_period', label: 'Review Period', type: 'text', required: true, placeholder: 'e.g. H1 2026 or Annual 2025', section: 'basic' },
      { id: 'self_assessment', label: 'Self-Assessment', type: 'textarea', required: true, placeholder: 'Paste the employee self-assessment', section: 'basic' },
      { id: 'peer_feedback', label: 'Peer Feedback', type: 'textarea', placeholder: 'Consolidated peer feedback notes', section: 'advanced' },
      { id: 'manager_notes', label: 'Manager Notes', type: 'textarea', placeholder: 'Manager observations and ratings', section: 'advanced' },
      { id: 'goals_from_last_period', label: 'Prior Goals', type: 'tags', placeholder: 'Goals from last review cycle', section: 'advanced' },
      { id: 'competency_framework', label: 'Competency Framework', type: 'select', options: ['Engineering Ladder', 'Product Ladder', 'General', 'Custom'], section: 'advanced' },
    ],
    steps: [
      { id: 'hr-006-s1', order: 1, name: 'Synthesize Feedback Sources', agent: 'People Analytics', tool: 'Claude', outputKey: 'feedback_synthesis', capability: 'content.generate_review' },
      { id: 'hr-006-s2', order: 2, name: 'Assess Goal Achievement', agent: 'People Analytics', tool: 'Claude', outputKey: 'goal_assessment', capability: 'content.generate_review' },
      { id: 'hr-006-s3', order: 3, name: 'Generate Competency Ratings', agent: 'People Ops', tool: 'Claude', outputKey: 'competency_ratings', capability: 'content.generate_review' },
      { id: 'hr-006-s4', order: 4, name: 'Draft Growth Plan & Promotion Readiness', agent: 'People Ops', tool: 'Claude', outputKey: 'growth_plan', capability: 'content.generate_review' },
      { id: 'hr-006-s5', order: 5, name: 'Compile Full Performance Review', agent: 'HRBP', tool: 'Claude', outputKey: 'performance_review', requiresApproval: true, capability: 'content.generate_review' },
    ],
    outputs: ['feedback_synthesis', 'goal_assessment', 'competency_ratings', 'growth_plan', 'performance_review'],
    requiredTools: ['Claude'],
    optionalTools: ['Lattice', 'Notion'],
    tags: ['performance-review', 'feedback', 'growth-plan', 'rating'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7) Employee Engagement Survey Analyzer
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-007',
    slug: 'engagement-survey-analyzer',
    name: 'Engagement Survey Analyzer',
    description: 'Analyze employee engagement survey results. Extracts themes, sentiment trends, risk areas, and generates action plans by team/department.',
    icon: '📈',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'People Success',
    complexity: 'complex',
    estimatedTime: '90–180s',
    inputs: [
      { id: 'survey_name', label: 'Survey Name', type: 'text', required: true, placeholder: 'e.g. Q1 2026 Pulse Survey', section: 'basic' },
      { id: 'survey_data', label: 'Survey Results', type: 'textarea', required: true, placeholder: 'Paste summary or key metrics from survey', section: 'basic' },
      { id: 'comparison_period', label: 'Compare To', type: 'select', options: ['Previous Quarter', 'Previous Year', 'Industry Benchmark', 'No Comparison'], section: 'basic' },
      { id: 'breakdown_by', label: 'Break Down By', type: 'multiselect', options: ['Department', 'Level', 'Tenure', 'Location', 'Manager', 'Gender', 'Function'], section: 'advanced' },
      { id: 'open_ended_responses', label: 'Open-Ended Responses', type: 'textarea', placeholder: 'Paste free-text responses', section: 'advanced' },
      { id: 'file_attachments', label: 'Attach Survey Export', type: 'file', multiple: true, accept: '.csv,.xlsx,.pdf,.txt', section: 'advanced' },
    ],
    steps: [
      { id: 'hr-007-s1', order: 1, name: 'Parse Survey Data', agent: 'People Analytics', tool: 'Claude', outputKey: 'parsed_data', capability: 'analytics.parse_survey' },
      { id: 'hr-007-s2', order: 2, name: 'Theme & Sentiment Analysis', agent: 'People Analytics', tool: 'Claude', outputKey: 'theme_analysis', capability: 'analytics.sentiment' },
      { id: 'hr-007-s3', order: 3, name: 'Segment Breakdown', agent: 'People Analytics', tool: 'Claude', outputKey: 'segment_breakdown', capability: 'analytics.segment' },
      { id: 'hr-007-s4', order: 4, name: 'Generate Action Plans', agent: 'HRBP', tool: 'Claude', outputKey: 'action_plans', capability: 'analytics.action_plan' },
      { id: 'hr-007-s5', order: 5, name: 'Executive Summary Report', agent: 'People Ops', tool: 'Claude', outputKey: 'engagement_report', requiresApproval: true, capability: 'analytics.report' },
    ],
    outputs: ['parsed_data', 'theme_analysis', 'segment_breakdown', 'action_plans', 'engagement_report'],
    requiredTools: ['Claude'],
    optionalTools: ['Lattice', 'Google Drive'],
    tags: ['engagement', 'survey', 'sentiment', 'culture', 'analytics'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8) Compensation Benchmarker
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-008',
    slug: 'compensation-benchmarker',
    name: 'Compensation Benchmarker',
    description: 'Benchmark compensation for a role against market data. Generates pay bands, equity guidelines, and total comp analysis.',
    icon: '💰',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'Total Rewards',
    complexity: 'moderate',
    estimatedTime: '30–60s',
    inputs: [
      { id: 'role_title', label: 'Role Title', type: 'text', required: true, placeholder: 'e.g. Senior Software Engineer', section: 'basic' },
      { id: 'level', label: 'Level', type: 'select', required: true, options: ['Junior', 'Mid', 'Senior', 'Staff', 'Principal', 'Director', 'VP'], section: 'basic' },
      { id: 'location', label: 'Location / Geo', type: 'text', required: true, placeholder: 'e.g. SF Bay Area, NYC, Remote US', section: 'basic' },
      { id: 'industry', label: 'Industry', type: 'select', options: ['SaaS / Tech', 'Fintech', 'Healthcare', 'E-commerce', 'Enterprise', 'Startup (<50)', 'Scale-up (50-500)', 'Large (500+)'], section: 'basic' },
      { id: 'current_comp', label: 'Current Comp (if retention analysis)', type: 'text', placeholder: 'e.g. $180K base + 5K RSUs', section: 'advanced' },
      { id: 'comp_philosophy', label: 'Comp Philosophy', type: 'select', options: ['25th percentile', '50th percentile (median)', '75th percentile', '90th percentile'], section: 'advanced' },
    ],
    steps: [
      { id: 'hr-008-s1', order: 1, name: 'Research Market Data', agent: 'Comp Analyst', tool: 'Perplexity', outputKey: 'market_data', capability: 'research.compensation' },
      { id: 'hr-008-s2', order: 2, name: 'Generate Pay Bands', agent: 'Comp Analyst', tool: 'Claude', outputKey: 'pay_bands', capability: 'content.comp_analysis' },
      { id: 'hr-008-s3', order: 3, name: 'Total Comp Analysis', agent: 'Comp Analyst', tool: 'Claude', outputKey: 'total_comp', capability: 'content.comp_analysis' },
      { id: 'hr-008-s4', order: 4, name: 'Compensation Report', agent: 'Comp Analyst', tool: 'Claude', outputKey: 'comp_report', requiresApproval: true, capability: 'content.comp_analysis' },
    ],
    outputs: ['market_data', 'pay_bands', 'total_comp', 'comp_report'],
    requiredTools: ['Claude'],
    optionalTools: ['Perplexity'],
    tags: ['compensation', 'benchmarking', 'pay-bands', 'total-rewards'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9) Employee Offboarding Checklist
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-009',
    slug: 'offboarding-checklist',
    name: 'Employee Offboarding Checklist',
    description: 'Generate a comprehensive offboarding checklist covering access revocation, knowledge transfer, exit interview, and final pay processing.',
    icon: '📋',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'People Success',
    complexity: 'simple',
    estimatedTime: '15–30s',
    inputs: [
      { id: 'employee_name', label: 'Employee Name', type: 'text', required: true, placeholder: 'e.g. Jordan Lee', section: 'basic' },
      { id: 'role_title', label: 'Role', type: 'text', required: true, section: 'basic' },
      { id: 'department', label: 'Department', type: 'text', required: true, section: 'basic' },
      { id: 'last_day', label: 'Last Working Day', type: 'text', required: true, placeholder: 'e.g. March 31, 2026', section: 'basic' },
      { id: 'departure_type', label: 'Departure Type', type: 'select', required: true, options: ['Voluntary Resignation', 'Involuntary Termination', 'Layoff / RIF', 'Retirement', 'Contract End'], section: 'basic' },
      { id: 'systems_access', label: 'Systems with Access', type: 'tags', placeholder: 'e.g. GitHub, AWS, Slack, Salesforce', section: 'advanced' },
      { id: 'knowledge_areas', label: 'Critical Knowledge Areas', type: 'tags', placeholder: 'Key projects or institutional knowledge', section: 'advanced' },
    ],
    steps: [
      { id: 'hr-009-s1', order: 1, name: 'Generate Access Revocation List', agent: 'IT Coordinator', tool: 'Claude', outputKey: 'access_revocation', capability: 'content.generate_checklist' },
      { id: 'hr-009-s2', order: 2, name: 'Create Knowledge Transfer Plan', agent: 'People Ops', tool: 'Claude', outputKey: 'knowledge_transfer', capability: 'content.generate_checklist' },
      { id: 'hr-009-s3', order: 3, name: 'Generate Exit Interview Guide', agent: 'HRBP', tool: 'Claude', outputKey: 'exit_interview', capability: 'content.generate_checklist' },
      { id: 'hr-009-s4', order: 4, name: 'Compile Offboarding Checklist', agent: 'People Ops', tool: 'Claude', outputKey: 'offboarding_checklist', requiresApproval: true, capability: 'content.generate_checklist' },
    ],
    outputs: ['access_revocation', 'knowledge_transfer', 'exit_interview', 'offboarding_checklist'],
    requiredTools: ['Claude'],
    optionalTools: ['Slack', 'Jira'],
    tags: ['offboarding', 'exit', 'checklist', 'knowledge-transfer'],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 10) HR Policy Generator
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'hr-010',
    slug: 'hr-policy-generator',
    name: 'HR Policy Generator',
    description: 'Generate or update HR policies — PTO, remote work, code of conduct, etc. Includes compliance checks and multi-jurisdiction support.',
    icon: '⚖️',
    persona: 'hr',
    executableType: 'skill',
    cluster: 'People Success',
    complexity: 'moderate',
    estimatedTime: '60–120s',
    inputs: [
      { id: 'policy_type', label: 'Policy Type', type: 'select', required: true, options: ['PTO / Leave', 'Remote Work / Hybrid', 'Code of Conduct', 'Anti-Harassment', 'Workplace Safety', 'Data Privacy (Employee)', 'Social Media', 'Expense Reimbursement', 'Referral Program', 'Custom'], section: 'basic' },
      { id: 'company_size', label: 'Company Size', type: 'select', required: true, options: ['Startup (<50)', 'Scale-up (50-200)', 'Mid-market (200-1000)', 'Enterprise (1000+)'], section: 'basic' },
      { id: 'jurisdictions', label: 'Jurisdictions', type: 'tags', required: true, placeholder: 'e.g. US-CA, US-NY, UK, EU, India', section: 'basic' },
      { id: 'existing_policy', label: 'Existing Policy (to update)', type: 'textarea', placeholder: 'Paste current policy to update', section: 'advanced' },
      { id: 'tone', label: 'Tone', type: 'select', options: ['Formal / Legal', 'Friendly / Conversational', 'Balanced'], section: 'advanced' },
    ],
    steps: [
      { id: 'hr-010-s1', order: 1, name: 'Research Legal Requirements', agent: 'Compliance Analyst', tool: 'Perplexity', outputKey: 'legal_research', capability: 'research.legal' },
      { id: 'hr-010-s2', order: 2, name: 'Draft Policy Document', agent: 'HR Writer', tool: 'Claude', outputKey: 'policy_draft', capability: 'content.generate_policy' },
      { id: 'hr-010-s3', order: 3, name: 'Compliance Review', agent: 'Compliance Analyst', tool: 'Claude', outputKey: 'compliance_review', capability: 'content.compliance_review' },
      { id: 'hr-010-s4', order: 4, name: 'Final Policy Document', agent: 'HR Writer', tool: 'Claude', outputKey: 'policy_document', requiresApproval: true, capability: 'content.generate_policy' },
    ],
    outputs: ['legal_research', 'policy_draft', 'compliance_review', 'policy_document'],
    requiredTools: ['Claude'],
    optionalTools: ['Perplexity', 'Google Drive'],
    tags: ['policy', 'compliance', 'legal', 'handbook'],
  },
];

// ---------------------------------------------------------------------------
// Helpers (mirror engineering/product pattern)
// ---------------------------------------------------------------------------

export function getHRSkill(idOrSlug: string): UnifiedSkillDef | undefined {
  return HR_SKILLS.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
}

export function getHRSkillsByCluster(): Record<string, UnifiedSkillDef[]> {
  const clusters: Record<string, UnifiedSkillDef[]> = {};
  for (const skill of HR_SKILLS) {
    const c = skill.cluster ?? 'General';
    if (!clusters[c]) clusters[c] = [];
    clusters[c].push(skill);
  }
  return clusters;
}
