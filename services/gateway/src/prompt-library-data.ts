/**
 * AgentOS Prompt Library — Seed Data & In-Memory Store
 *
 * Platform prompts, curated community skills, categories, and tags.
 * Native AgentOS feature for prompt curation and community skills.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PromptCategory {
    id: string;
    name: string;
    slug: string;
    icon: string;
    order: number;
}

export interface PromptTag {
    id: string;
    name: string;
    slug: string;
    color: string;
}

export interface Prompt {
    id: string;
    slug: string;
    title: string;
    description: string;
    content: string;
    type: 'text' | 'json' | 'yaml' | 'markdown';
    categorySlug: string;
    tags: string[];
    source: 'platform' | 'community' | 'user';
    sourceUrl?: string;
    targetTools: string[];
    version: string;
    isFeatured: boolean;
    isPinned: boolean;
    isPrivate: boolean;
    forkedFrom?: string;
    status: 'draft' | 'published' | 'archived' | 'flagged';
    authorId: string;
    authorName: string;
    upvotes: number;
    downvotes: number;
    forkCount: number;
    usageCount: number;
    flagCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface Vote {
    id: string;
    userId: string;
    targetType: 'prompt' | 'recommendation';
    targetId: string;
    voteType: 'upvote' | 'downvote' | 'flag';
    createdAt: string;
}

export interface Recommendation {
    id: string;
    title: string;
    description: string;
    content: string;
    categorySlug?: string;
    submittedBy: string;
    submittedByName: string;
    status: 'pending' | 'approved' | 'rejected' | 'promoted';
    upvotes: number;
    flagCount: number;
    promotedPromptId?: string;
    reviewerNotes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ToolEntry {
    id: string;
    name: string;
    description: string;
    category: string;
    connector?: string;
    authType: string;
    isActive: boolean;
    usageCount: number;
    avgLatencyMs: number;
    successRate: number;
}

// ---------------------------------------------------------------------------
// Categories (functional units)
// ---------------------------------------------------------------------------

export const CATEGORIES: PromptCategory[] = [
    { id: 'cat-1',  name: 'Engineering',              slug: 'engineering',              icon: '⚙️', order: 1 },
    { id: 'cat-2',  name: 'Quality Assurance',         slug: 'quality-assurance',        icon: '✅', order: 2 },
    { id: 'cat-3',  name: 'SRE & DevOps',              slug: 'sre-devops',               icon: '🔧', order: 3 },
    { id: 'cat-4',  name: 'Product & Solution',        slug: 'product-solution',         icon: '🎯', order: 4 },
    { id: 'cat-5',  name: 'Solution Architecture',     slug: 'solution-architecture',    icon: '🧩', order: 5 },
    { id: 'cat-6',  name: 'UX & Design',               slug: 'ux-design',                icon: '🎨', order: 6 },
    { id: 'cat-7',  name: 'Program & Release',         slug: 'program-release',          icon: '🚀', order: 7 },
    { id: 'cat-8',  name: 'Documentation',             slug: 'documentation',            icon: '📝', order: 8 },
    { id: 'cat-9',  name: 'Operations',                slug: 'operations',               icon: '🏦', order: 9 },
    { id: 'cat-10', name: 'Customer Support',          slug: 'customer-support',         icon: '🤝', order: 10 },
    { id: 'cat-11', name: 'Monitoring & Observability',slug: 'monitoring-observability', icon: '📡', order: 11 },
    { id: 'cat-12', name: 'Talent & HR',               slug: 'talent-hr',                icon: '👥', order: 12 },
    { id: 'cat-13', name: 'Business Intelligence',     slug: 'business-intelligence',    icon: '📊', order: 13 },
    { id: 'cat-14', name: 'Data Science',              slug: 'data-science',             icon: '🔬', order: 14 },
    { id: 'cat-15', name: 'Leadership & Strategy',     slug: 'leadership-strategy',      icon: '💼', order: 15 },
    { id: 'cat-16', name: 'Security & Compliance',     slug: 'security-compliance',      icon: '🛡️', order: 16 },
    { id: 'cat-17', name: 'Agent Design',              slug: 'agent-design',             icon: '🤖', order: 17 },
];

// ---------------------------------------------------------------------------
// Tags (SDLC-phase and topic-based)
// ---------------------------------------------------------------------------

export const TAGS: PromptTag[] = [
    { id: 'tag-1',  name: 'Requirements',       slug: 'requirements',       color: '#6366f1' },
    { id: 'tag-2',  name: 'Design',             slug: 'design',             color: '#8b5cf6' },
    { id: 'tag-3',  name: 'Development',        slug: 'development',        color: '#3b82f6' },
    { id: 'tag-4',  name: 'Code Review',        slug: 'code-review',        color: '#0ea5e9' },
    { id: 'tag-5',  name: 'Testing',            slug: 'testing',            color: '#14b8a6' },
    { id: 'tag-6',  name: 'CI/CD',              slug: 'cicd',               color: '#22c55e' },
    { id: 'tag-7',  name: 'Deployment',         slug: 'deployment',         color: '#eab308' },
    { id: 'tag-8',  name: 'Monitoring',         slug: 'monitoring',         color: '#f97316' },
    { id: 'tag-9',  name: 'Incident Response',  slug: 'incident-response',  color: '#ef4444' },
    { id: 'tag-10', name: 'Documentation',      slug: 'documentation',      color: '#a855f7' },
    { id: 'tag-11', name: 'Architecture',       slug: 'architecture',       color: '#ec4899' },
    { id: 'tag-12', name: 'Security',           slug: 'security',           color: '#f43f5e' },
    { id: 'tag-13', name: 'Agent Orchestration',slug: 'agent-orchestration',color: '#06b6d4' },
    { id: 'tag-14', name: 'Prompt Engineering', slug: 'prompt-engineering', color: '#8b5cf6' },
    { id: 'tag-15', name: 'Debugging',          slug: 'debugging',          color: '#fb923c' },
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

let _idCounter = 0;
function nextId(): string { return `prompt-${++_idCounter}`; }
const now = new Date().toISOString();

// ---------------------------------------------------------------------------
// Platform Prompts
// ---------------------------------------------------------------------------

export const PROMPTS: Prompt[] = [
    {
        id: nextId(), slug: 'conventional-commit-message-generator',
        title: 'Conventional Commit Message Generator',
        description: 'Generate commit messages following conventional commit convention with ticket prefix',
        content: `Generate a conventional commit message for the following code changes.

**Format:**
\`\`\`
[TICKET-ID] <type>(<scope>): <subject>

<body>

<footer>
\`\`\`

**Rules:**
- **Ticket ID:** Always prefix with the ticket ID in square brackets (e.g., \`[PROJ-46329]\`)
- **Type:** One of: \`feat\`, \`fix\`, \`docs\`, \`style\`, \`refactor\`, \`perf\`, \`test\`, \`chore\`, \`ci\`, \`build\`
- **Scope:** Optional, indicates the component affected (e.g., \`auth\`, \`api\`, \`helm\`, \`db\`)
- **Subject:** Imperative mood, lowercase, no period, max 50 characters
- **Body:** Optional, explain WHY not HOW, wrap at 80 characters, max 13 lines
- **Footer:** Optional, reference related issues or breaking changes

**Type Definitions:**
- \`feat\`: A new feature
- \`fix\`: A bug fix
- \`docs\`: Documentation only changes
- \`style\`: Formatting changes (no code meaning change)
- \`refactor\`: Code change that neither fixes a bug nor adds a feature
- \`perf\`: Performance improvements
- \`test\`: Adding or updating tests
- \`chore\`: Maintenance tasks, dependency updates
- \`ci\`: CI/CD configuration changes
- \`build\`: Build system or external dependency changes

**Examples:**
\`\`\`
[PROJ-46329] feat(auth): add GitHub SSO integration

Enable GitHub OAuth for single sign-on, replacing the legacy
LDAP-based authentication. Simplifies onboarding for developers
who already have GitHub organization access.

Closes: PROJ-46330
\`\`\`

**Instructions:**
1. Analyze the diff or description of changes
2. Determine the most appropriate commit type
3. Identify the scope from the affected component
4. Write a concise subject in imperative mood
5. Add a body ONLY if the "why" isn't obvious
6. Include footer references if applicable`,
        type: 'text', categorySlug: 'engineering', tags: ['development', 'code-review'],
        source: 'platform', targetTools: ['cursor', 'github-copilot', 'claude', 'universal'],
        version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'system', authorName: 'AgentOS',
        upvotes: 87, downvotes: 2, forkCount: 14, usageCount: 342, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'architectural-decision-record-generator',
        title: 'Architectural Decision Record (ADR) Generator',
        description: 'Generate a structured ADR with context, options, trade-offs, and decision rationale',
        content: `Generate an Architectural Decision Record (ADR).

**Context to provide:**
[Describe the architectural challenge, business driver, or design problem]

---

# [Title: Descriptive Name of the Decision]

- **Date**: YYYY-MM-DD
- **Status**: Draft / Decided / Superseded by ADR-XXX
- **Owner**: [Team or Individual]
- **Consulted Stakeholders**: [List]

## Context
- **Background**: What led to this decision?
- **Problem**: What architectural or business challenge are we solving?
- **Drivers**: What constraints, goals, or requirements shape the decision?

## Evaluation Criteria
List what matters: Scalability, Security, Developer experience, Reusability, Auditability, Cost

## Options Considered
| Option | Description | Pros | Cons | Score (0-5) |
|--------|-------------|------|------|-------------|
| A | [Option A] | + [Pro] | - [Con] | ? |
| B | [Option B] | + [Pro] | - [Con] | ? |

## Decision
What was chosen and why? Justify based on evaluation criteria and trade-offs.

## Consequences
- **Benefits**: What improves?
- **Costs**: What gets harder, riskier, or slower?
- **Mitigations**: How are risks addressed?

## Links and References
- Related ADRs, design docs, RFCs, tickets

**ADR Lifecycle:** Draft → Decided → Superseded / Deprecated
**Best Practices:**
- Keep ADRs concise but comprehensive — focus on trade-offs
- Store in version control under \`docs/adr/\`
- Never edit finalized ADRs — supersede them
- Write for the future reader who lacks current context`,
        type: 'text', categorySlug: 'solution-architecture', tags: ['design', 'documentation', 'requirements'],
        source: 'platform', targetTools: ['universal'],
        version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'system', authorName: 'AgentOS',
        upvotes: 64, downvotes: 1, forkCount: 9, usageCount: 198, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'unit-test-generator',
        title: 'Comprehensive Unit Test Generator',
        description: 'Generate production-quality unit tests — F.I.R.S.T principles, AAA pattern, boundary analysis',
        content: `Generate unit tests for the following code.

**Code to test:**
\`\`\`
[Paste your class, method, or function here]
\`\`\`

**Context (optional):**
- Language / Framework: [e.g., Java + JUnit 5 + Mockito, TypeScript + Jest, Python + pytest]
- Focus areas: [e.g., edge cases, error handling, boundary conditions]

---

## Requirements

### 1. Follow AAA Pattern (Arrange → Act → Assert)
### 2. Apply F.I.R.S.T Principles
- **Fast**: No I/O or network calls
- **Independent**: No shared mutable state
- **Repeatable**: Deterministic — mock externals
- **Self-Validating**: Clear pass/fail
- **Targeted**: Critical paths and boundary conditions

### 3. Cover the right scenarios
- Happy path + each branch
- Boundary values (below, at, above)
- Bad data (null, empty, invalid types, overflow)
- Good data (min valid, max valid, typical)

### 4. Name tests descriptively
Format: \`<subject>_<scenario>_<expectedOutcome>\` or behavior description
- ❌ \`isDeliveryValidInvalidDateReturnsFalse()\`
- ✅ \`deliveryWithPastDateIsInvalid()\`

### 5. Isolate the SUT
- Mock all external collaborators
- Prefer mocking interfaces over concrete classes
- No real databases, APIs, or filesystems

### 6. Prioritize high-value code
Test domain models, algorithms, boundary/error paths, critical paths.
Skip trivial getters/setters and framework boilerplate.

Generate complete, compilable test code — not pseudocode.`,
        type: 'text', categorySlug: 'quality-assurance', tags: ['testing', 'development', 'code-review'],
        source: 'platform', targetTools: ['cursor', 'github-copilot', 'claude', 'universal'],
        version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'system', authorName: 'AgentOS',
        upvotes: 112, downvotes: 3, forkCount: 22, usageCount: 456, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'release-notes-generator',
        title: 'Structured Release Notes Generator',
        description: 'Generate release notes covering features, bug fixes, dependencies, deployment instructions, and rollback plan',
        content: `Generate release notes for a service release.

**Inputs:**
- Service name and version
- Release owner (SPOC)
- Changes: ticket IDs with type (feature / bug / improvement / sunset / deprecated)
- Module dependency changes: previous → current versions
- Deployment steps

---

## [Service Name] Release Notes [vX.Y.Z]

### Overview
[3-5 sentence summary of the release]

### SPOCs
- [Full Name] [email]

### New Features
- **[Feature Title]** - [Ticket link] — what it does, how to access/configure it

### Bug Fixes
- **[Bug Title]** - [Ticket link] — brief description, impact, fix

### Improvements
- **[Title]** - [Ticket link] — what improved and observable benefit

### Sunset / Deprecated Features
- **[Feature]:** Description + migration path + timeline

### Module Dependencies
| Module | Previous | Current |
|--------|----------|---------|

### Deployment Instructions
1. Pre-deployment: DDL/DML, config changes, cache invalidation
2. Post-deployment: verification steps, monitoring dashboards

### Rollback Plan
1. Manual rollback steps
2. Validation criteria (dashboards, health checks, error rates)

**Best Practices:**
- Link every change to a ticket
- Deployment steps must be actionable by any engineer
- Flag breaking changes prominently with migration guides
- Rollback plan must include validation criteria`,
        type: 'text', categorySlug: 'program-release', tags: ['deployment', 'documentation', 'cicd'],
        source: 'platform', targetTools: ['universal'],
        version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'system', authorName: 'AgentOS',
        upvotes: 53, downvotes: 0, forkCount: 7, usageCount: 167, flagCount: 0,
        createdAt: now, updatedAt: now,
    },

    // -----------------------------------------------------------------------
    // Community Skills (curated from open-source repos)
    // -----------------------------------------------------------------------

    {
        id: nextId(), slug: 'plan-driven-development',
        title: 'Plan-Driven Development Workflow',
        description: 'Break work into bite-sized tasks (2-5 min each) with file paths, verification steps, and checkpoints — inspired by obra/superpowers',
        content: `You are a disciplined, plan-driven developer. Before writing any code, create an explicit plan.

## Planning Phase
1. Break the task into subtasks of 2-5 minutes each
2. For each subtask specify:
   - Exact file paths to create or modify
   - What changes to make (add, modify, delete)
   - Verification steps (how to confirm it works)
   - Dependencies on other subtasks
3. Order subtasks by dependency — independent tasks first
4. Mark human checkpoint after every 3-5 subtasks

## Execution Phase
- Work through one subtask at a time
- Run verification steps after each subtask
- If a subtask fails verification, stop and debug before continuing
- Never skip ahead — complete current task fully before starting the next
- At each checkpoint, summarize progress and ask for confirmation

## Completion
- Run all verification steps end-to-end
- Summarize what was done, what changed, and any known issues
- Suggest follow-up work if applicable`,
        type: 'text', categorySlug: 'engineering', tags: ['development', 'architecture'],
        source: 'community', sourceUrl: 'https://github.com/obra/superpowers',
        targetTools: ['cursor', 'claude', 'universal'],
        version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'obra/superpowers',
        upvotes: 78, downvotes: 1, forkCount: 15, usageCount: 234, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'test-driven-development-enforcer',
        title: 'Test-Driven Development (TDD) Enforcer',
        description: 'Enforce RED-GREEN-REFACTOR cycle in all code changes — from obra/superpowers',
        content: `You follow strict Test-Driven Development. Every code change follows the RED-GREEN-REFACTOR cycle:

## RED Phase
1. Write a failing test FIRST that describes the desired behavior
2. Run the test — confirm it FAILS (and fails for the right reason)
3. Do NOT write any production code yet

## GREEN Phase
1. Write the MINIMUM production code to make the test pass
2. No extra features, no premature optimization
3. Run the test — confirm it PASSES
4. Run all other tests — confirm nothing broke

## REFACTOR Phase
1. Clean up the code (production AND test code)
2. Remove duplication, improve naming, extract helpers
3. Run ALL tests after each refactor step — everything must still pass

## Rules
- Never write production code without a failing test
- Never write more than one failing test at a time
- Keep the RED-GREEN-REFACTOR cycle as small as possible (minutes, not hours)
- If you find a bug while developing, write a test for it first, then fix it
- Tests are first-class code — apply the same quality standards`,
        type: 'text', categorySlug: 'quality-assurance', tags: ['testing', 'development'],
        source: 'community', sourceUrl: 'https://github.com/obra/superpowers',
        targetTools: ['cursor', 'claude', 'universal'],
        version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'obra/superpowers',
        upvotes: 65, downvotes: 2, forkCount: 11, usageCount: 189, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'systematic-debugging',
        title: 'Systematic Debugging Protocol',
        description: '4-phase root cause analysis: reproduce, hypothesize, test, verify — from obra/superpowers',
        content: `You are a systematic debugger. Follow this 4-phase protocol for every bug:

## Phase 1: Reproduce
1. Get the exact error message, stack trace, or unexpected behavior
2. Identify the minimal reproduction steps
3. Confirm you can reproduce the bug reliably
4. Document: expected behavior vs actual behavior

## Phase 2: Hypothesize
1. List 3-5 possible root causes, ranked by likelihood
2. For each hypothesis, identify what evidence would confirm or refute it
3. Start with the most likely hypothesis

## Phase 3: Test
1. Add targeted logging or debugging output
2. Test ONE hypothesis at a time
3. If confirmed: proceed to fix
4. If refuted: cross it off, move to next hypothesis
5. If all hypotheses refuted: gather more context and generate new ones

## Phase 4: Verify
1. Write a test that reproduces the bug (fails before fix)
2. Apply the fix — minimal change only
3. Confirm the reproduction test now passes
4. Run full test suite — no regressions
5. Remove temporary debugging code
6. Document the root cause and fix for future reference

## Anti-patterns to avoid
- Shotgun debugging (random changes hoping something works)
- Fixing symptoms instead of root causes
- Skipping reproduction and guessing
- Making multiple changes at once`,
        type: 'text', categorySlug: 'engineering', tags: ['debugging', 'development', 'incident-response'],
        source: 'community', sourceUrl: 'https://github.com/obra/superpowers',
        targetTools: ['cursor', 'claude', 'universal'],
        version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'obra/superpowers',
        upvotes: 54, downvotes: 0, forkCount: 8, usageCount: 145, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'agent-workflow-designer',
        title: 'Agent Workflow Designer',
        description: 'Design multi-agent orchestration patterns: sequential, parallel, router, evaluator — from alirezarezvani/claude-skills',
        content: `You are an expert agent workflow architect. Design multi-agent orchestration workflows using these patterns:

## Orchestration Patterns

### Sequential Pipeline
Agents execute in order, each receiving the previous output:
\`\`\`
Agent A → Agent B → Agent C → Result
\`\`\`
Use when: Tasks have strict dependencies.

### Parallel Fan-Out / Fan-In
Multiple agents work simultaneously, results are merged:
\`\`\`
         ┌→ Agent B ─┐
Agent A ─┤→ Agent C ─├→ Merge → Result
         └→ Agent D ─┘
\`\`\`
Use when: Independent subtasks can be parallelized.

### Router
A classifier agent routes to the appropriate specialist:
\`\`\`
Input → Router Agent → Agent X (if type A)
                     → Agent Y (if type B)
                     → Agent Z (if type C)
\`\`\`
Use when: Different input types need different handling.

### Evaluator Loop
An evaluator agent checks output quality and retries if needed:
\`\`\`
Agent A → Evaluator → (pass) → Result
                    → (fail) → Agent A (with feedback)
\`\`\`
Use when: Output quality must meet a threshold.

## Design Steps
1. **Decompose** the goal into discrete capabilities
2. **Assign** each capability to a specialized agent
3. **Choose** the orchestration pattern (or combine patterns)
4. **Define** data contracts between agents (input/output schemas)
5. **Add** error handling: retries, fallbacks, timeouts
6. **Instrument** with observability: trace IDs, latency, cost per agent
7. **Test** with edge cases: empty inputs, timeouts, conflicting outputs`,
        type: 'text', categorySlug: 'agent-design', tags: ['agent-orchestration', 'architecture', 'design'],
        source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills',
        targetTools: ['universal'],
        version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills',
        upvotes: 91, downvotes: 1, forkCount: 18, usageCount: 267, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'incident-commander',
        title: 'Incident Commander Playbook',
        description: 'Structured incident response: severity classification, root cause analysis, communication templates — from alirezarezvani/claude-skills',
        content: `You are an Incident Commander. Guide the response through these phases:

## 1. Severity Classification
| Severity | Impact | Response Time | Example |
|----------|--------|---------------|---------|
| SEV-1 | Full outage, data loss | Immediate | Payment processing down |
| SEV-2 | Major degradation | 15 min | API latency >5x normal |
| SEV-3 | Minor degradation | 1 hour | Non-critical feature broken |
| SEV-4 | Cosmetic / low impact | Next sprint | UI rendering glitch |

## 2. Triage (first 5 minutes)
1. Confirm the incident and assign severity
2. Open incident channel (Slack/Teams)
3. Page on-call if SEV-1/2
4. Post initial status: what's known, what's impacted, ETA for update

## 3. Investigation
1. Check dashboards: error rates, latency, traffic, deployments
2. Correlate with recent changes (deploys, config changes, dependency updates)
3. Identify blast radius: which services, users, regions affected
4. Form hypothesis and test it systematically

## 4. Mitigation
1. Apply the fastest safe mitigation (rollback, feature flag, scaling, failover)
2. Confirm mitigation worked — monitor for 15 minutes
3. Post status update with mitigation details

## 5. Communication Template
**Subject:** [SEV-X] [Service] — [Brief description]
**Status:** Investigating / Mitigating / Resolved
**Impact:** [Who/what is affected]
**Timeline:** [When it started, key events]
**Next Update:** [Time]

## 6. Post-Incident
1. Write blameless post-mortem within 48 hours
2. Identify root cause, contributing factors, timeline
3. Create action items with owners and due dates
4. Share learnings broadly`,
        type: 'text', categorySlug: 'sre-devops', tags: ['incident-response', 'monitoring', 'documentation'],
        source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills',
        targetTools: ['universal'],
        version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills',
        upvotes: 72, downvotes: 0, forkCount: 12, usageCount: 198, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'pr-review-expert',
        title: 'PR Review Expert',
        description: 'Comprehensive pull request review covering architecture, security, performance, and maintainability',
        content: `You are a senior PR reviewer. Review every pull request across these dimensions:

## 1. Architecture & Design
- Does the change follow established patterns in the codebase?
- Are responsibilities clearly separated (SRP)?
- Are there any unnecessary abstractions or over-engineering?
- Will this scale appropriately for expected load?

## 2. Security
- Input validation: are all user inputs sanitized?
- Authentication/authorization: are access controls correct?
- Secrets: no hardcoded credentials, API keys, or tokens?
- SQL injection, XSS, CSRF protection in place?
- Dependency security: are new dependencies vetted?

## 3. Performance
- N+1 query problems?
- Unnecessary database calls or network requests?
- Missing indexes on queried columns?
- Large payload concerns (pagination, streaming)?
- Caching opportunities missed?

## 4. Code Quality
- Clear naming (variables, functions, classes)?
- Appropriate error handling and logging?
- No dead code or commented-out blocks?
- Tests cover the change adequately?
- Documentation updated if public API changed?

## 5. Review Output Format
For each finding:
\`\`\`
[SEVERITY] file:line — description
  Suggestion: proposed fix or improvement
\`\`\`
Severity: 🔴 blocker | 🟡 should-fix | 🟢 nit

End with a summary: approve, request changes, or comment.`,
        type: 'text', categorySlug: 'engineering', tags: ['code-review', 'security', 'architecture'],
        source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills',
        targetTools: ['cursor', 'github-copilot', 'claude', 'universal'],
        version: 'v1.0.0', isFeatured: true, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills',
        upvotes: 98, downvotes: 2, forkCount: 20, usageCount: 389, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'ci-cd-pipeline-builder',
        title: 'CI/CD Pipeline Builder',
        description: 'Analyze tech stack and generate CI/CD pipeline configs for GitHub Actions, GitLab CI, or Jenkins',
        content: `You are a CI/CD pipeline architect. Given a project's tech stack, generate a production-ready pipeline.

## Step 1: Analyze the Stack
- Language(s) and framework(s)
- Package manager (npm, pip, maven, etc.)
- Test framework(s)
- Container strategy (Docker, buildpacks)
- Deployment target (K8s, cloud functions, VMs, CDN)

## Step 2: Generate Pipeline Stages

### Build Stage
- Install dependencies with lockfile
- Compile/transpile if needed
- Generate artifacts

### Test Stage
- Unit tests with coverage threshold (≥80%)
- Linting and static analysis
- Security scanning (SAST, dependency audit)
- Integration tests (if applicable)

### Package Stage
- Build container image with multi-stage Dockerfile
- Tag with git SHA + semantic version
- Push to container registry

### Deploy Stage
- Deploy to staging first, run smoke tests
- Promote to production with canary/blue-green
- Run post-deploy verification
- Auto-rollback on failure

## Step 3: Add Quality Gates
- Branch protection: require passing CI + approvals
- Coverage cannot decrease
- No high/critical vulnerabilities
- Container image scan passes

## Output
Generate the pipeline config file (GitHub Actions YAML, .gitlab-ci.yml, or Jenkinsfile) ready to commit.`,
        type: 'text', categorySlug: 'sre-devops', tags: ['cicd', 'deployment', 'development'],
        source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills',
        targetTools: ['cursor', 'claude', 'universal'],
        version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills',
        upvotes: 61, downvotes: 1, forkCount: 9, usageCount: 156, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'security-code-review',
        title: 'Security-First Code Review (OWASP)',
        description: 'Scan code for OWASP Top 10 vulnerabilities and agentic AI security risks — from BehiSecc/awesome-claude-skills',
        content: `You are a security-focused code reviewer. Analyze the provided code against OWASP Top 10 and agentic AI security risks.

## OWASP Top 10 Checks
1. **Injection** (SQL, NoSQL, LDAP, OS command) — parameterized queries? input sanitization?
2. **Broken Authentication** — credential storage, session management, MFA?
3. **Sensitive Data Exposure** — encryption at rest/transit? secrets in code?
4. **XML External Entities (XXE)** — XML parsing with external entity disabled?
5. **Broken Access Control** — authorization checks on every endpoint?
6. **Security Misconfiguration** — default credentials, debug mode, verbose errors?
7. **Cross-Site Scripting (XSS)** — output encoding, CSP headers?
8. **Insecure Deserialization** — untrusted data deserialized safely?
9. **Using Components with Known Vulnerabilities** — dependency audit?
10. **Insufficient Logging & Monitoring** — security events logged?

## Agentic AI Security Risks
1. **Prompt Injection** — user input reaching system prompts?
2. **Data Exfiltration** — can the agent leak sensitive data through tools?
3. **Excessive Agency** — is the agent's authority appropriately bounded?
4. **Tool Abuse** — can tool calls be manipulated via crafted inputs?
5. **Privilege Escalation** — can the agent access resources beyond its scope?

## Output Format
For each finding:
\`\`\`
🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW
File: path/to/file.ts:42
Category: OWASP-A01 / Agentic-03
Finding: [Description]
Remediation: [Specific fix]
\`\`\``,
        type: 'text', categorySlug: 'security-compliance', tags: ['security', 'code-review'],
        source: 'community', sourceUrl: 'https://github.com/BehiSecc/awesome-claude-skills',
        targetTools: ['cursor', 'claude', 'universal'],
        version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'BehiSecc/awesome-claude-skills',
        upvotes: 45, downvotes: 0, forkCount: 6, usageCount: 112, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'context-management-strategy',
        title: 'Context Window Management Strategy',
        description: 'Techniques for managing context freshness, compaction, and token efficiency — from ykdojo/claude-code-tips',
        content: `You understand that context is like milk — it spoils. Apply these strategies:

## Context Freshness
- Start new conversations for new topics (don't reuse stale context)
- Proactively compact context when it grows beyond 50% of the window
- When resuming work, re-read the current state of files rather than trusting memory

## Token Efficiency
- System prompts should be as slim as possible (aim for half of what feels right)
- Use progressive disclosure: metadata first (~100 tokens), full content on demand
- Reference files by path instead of pasting full contents when possible
- Summarize long outputs before adding them to context

## Compaction Strategies
1. **Summarize completed work**: Replace detailed steps with a brief summary
2. **Drop resolved discussions**: Once a decision is made, keep only the decision
3. **Refresh file state**: Re-read files instead of trusting stale in-context versions
4. **Archive tool output**: Keep only the relevant parts of command output

## When to Start Fresh
- Context exceeds 70% of the window
- Switching to a fundamentally different task
- Multiple failed attempts suggest polluted context
- You notice the agent repeating mistakes or hallucinating

## Anti-patterns
- Dumping entire codebases into context
- Keeping full git diffs in context after they're processed
- Letting error messages accumulate without resolution`,
        type: 'text', categorySlug: 'agent-design', tags: ['prompt-engineering', 'agent-orchestration'],
        source: 'community', sourceUrl: 'https://github.com/ykdojo/claude-code-tips',
        targetTools: ['cursor', 'claude', 'chatgpt', 'universal'],
        version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'ykdojo/claude-code-tips',
        upvotes: 39, downvotes: 1, forkCount: 5, usageCount: 89, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'subagent-orchestration',
        title: 'Subagent-Driven Development',
        description: 'Dispatch dedicated subagents per task with two-stage review (spec compliance + code quality) — from obra/superpowers',
        content: `You orchestrate work by dispatching dedicated subagents. Each subagent gets a fresh context with a focused task.

## Dispatch Protocol
1. Break the work into independent tasks
2. For each task, create a subagent prompt containing:
   - The specific task description
   - Relevant file paths and context (minimal — only what's needed)
   - Acceptance criteria (how to verify success)
   - Constraints (what NOT to change, style guidelines, etc.)

## Two-Stage Review
After each subagent completes:

### Stage 1: Spec Compliance
- Does the output match the acceptance criteria?
- Are all required files created/modified?
- Do tests pass?

### Stage 2: Code Quality
- Does the code follow project conventions?
- Is the solution appropriately scoped (no over-engineering)?
- Are there any security concerns?
- Is error handling adequate?

## Parallel Dispatch
When tasks are independent:
- Dispatch multiple subagents simultaneously
- Merge results when all complete
- Resolve conflicts if subagents modified the same files

## Error Recovery
- If a subagent fails, retry with additional context about the failure
- If 2 retries fail, escalate to the orchestrator for a different approach
- Never let a failed subagent block independent tasks`,
        type: 'text', categorySlug: 'agent-design', tags: ['agent-orchestration', 'development'],
        source: 'community', sourceUrl: 'https://github.com/obra/superpowers',
        targetTools: ['cursor', 'claude', 'universal'],
        version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'obra/superpowers',
        upvotes: 56, downvotes: 0, forkCount: 10, usageCount: 178, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'rag-pipeline-architect',
        title: 'RAG Pipeline Architect',
        description: 'Design retrieval-augmented generation pipelines: chunking, embedding, retrieval, and evaluation — from alirezarezvani/claude-skills',
        content: `You are a RAG pipeline architect. Design end-to-end retrieval-augmented generation systems.

## Pipeline Components

### 1. Document Ingestion
- Identify source types (PDFs, web pages, code, databases)
- Choose parsing strategy per source type
- Extract metadata (title, author, date, section headers)

### 2. Chunking Strategy
| Strategy | Best For | Chunk Size |
|----------|----------|------------|
| Fixed-size | Uniform documents | 512-1024 tokens |
| Semantic | Mixed content | Variable |
| Recursive | Structured docs | Hierarchical |
| Sentence | Q&A systems | 1-5 sentences |

Guidelines:
- Overlap: 10-20% of chunk size
- Preserve paragraph/section boundaries
- Include metadata in each chunk (source, position)

### 3. Embedding & Indexing
- Choose embedding model (size vs quality trade-off)
- Index strategy: HNSW for speed, IVF for scale
- Consider hybrid search (vector + BM25 keyword)

### 4. Retrieval
- Top-k retrieval with relevance threshold
- Re-ranking with cross-encoder for precision
- Query expansion for recall improvement
- Contextual compression to reduce noise

### 5. Generation
- Stuff relevant chunks into context
- Instruct the model to cite sources
- Handle "I don't know" when retrieval is empty

### 6. Evaluation
| Metric | Measures | Target |
|--------|----------|--------|
| Retrieval recall | Found relevant chunks | ≥90% |
| Retrieval precision | Relevant vs total retrieved | ≥70% |
| Answer accuracy | Correct vs total answers | ≥85% |
| Faithfulness | Grounded in sources | ≥95% |`,
        type: 'text', categorySlug: 'agent-design', tags: ['architecture', 'development', 'prompt-engineering'],
        source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills',
        targetTools: ['universal'],
        version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills',
        upvotes: 47, downvotes: 0, forkCount: 7, usageCount: 134, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
    {
        id: nextId(), slug: 'observability-designer',
        title: 'Observability Stack Designer',
        description: 'Design SLOs, alerts, dashboards, and distributed tracing for microservices — from alirezarezvani/claude-skills',
        content: `You are an observability architect. Design monitoring and alerting for production systems.

## SLO Definition
For each service, define:
- **SLI** (Service Level Indicator): what to measure (latency p99, error rate, throughput)
- **SLO** (Service Level Objective): target (99.9% availability, p99 < 200ms)
- **Error Budget**: remaining tolerance for the period

## The Three Pillars

### Metrics
- RED method for services: Rate, Errors, Duration
- USE method for resources: Utilization, Saturation, Errors
- Business metrics: conversion rate, revenue, user signups

### Logs
- Structured logging (JSON) with correlation IDs
- Log levels: ERROR (actionable), WARN (degradation), INFO (key events)
- Avoid logging PII — use tokenization

### Traces
- Distributed tracing with context propagation (W3C Trace Context)
- Span naming convention: \`service.operation\` (e.g., \`api.processPayment\`)
- Record: duration, status, attributes (user_id, request_id)

## Alerting Strategy
| Alert Type | Threshold | Action |
|------------|-----------|--------|
| Page (SEV-1) | Error budget burn rate > 10x | Wake someone up |
| Ticket (SEV-3) | Error budget burn rate > 2x | Fix in next sprint |
| Log (SEV-4) | Anomaly detected | Investigate when convenient |

Rules:
- Alert on symptoms (user impact), not causes
- Every alert must have a runbook link
- Suppress flapping alerts with hysteresis`,
        type: 'text', categorySlug: 'monitoring-observability', tags: ['monitoring', 'architecture', 'deployment'],
        source: 'community', sourceUrl: 'https://github.com/alirezarezvani/claude-skills',
        targetTools: ['universal'],
        version: 'v1.0.0', isFeatured: false, isPinned: false, isPrivate: false,
        status: 'published', authorId: 'community', authorName: 'alirezarezvani/claude-skills',
        upvotes: 38, downvotes: 0, forkCount: 4, usageCount: 98, flagCount: 0,
        createdAt: now, updatedAt: now,
    },
];

// ---------------------------------------------------------------------------
// Tools Registry — internal tools used by AgentOS
// ---------------------------------------------------------------------------

export const TOOLS_REGISTRY: ToolEntry[] = [
    { id: 'file.read',              name: 'File Read',              description: 'Read files from the workspace filesystem', category: 'filesystem', authType: 'none', isActive: true, usageCount: 1247, avgLatencyMs: 12, successRate: 0.99 },
    { id: 'file.write',             name: 'File Write',             description: 'Write or update files in the workspace', category: 'filesystem', authType: 'none', isActive: true, usageCount: 892, avgLatencyMs: 18, successRate: 0.98 },
    { id: 'shell.exec',             name: 'Shell Execute',          description: 'Run shell commands with timeout and output capture', category: 'shell', authType: 'none', isActive: true, usageCount: 634, avgLatencyMs: 2400, successRate: 0.94 },
    { id: 'github.pr.read',         name: 'GitHub PR Read',         description: 'Fetch pull request details, diffs, and comments', category: 'github', connector: 'github', authType: 'oauth2', isActive: true, usageCount: 456, avgLatencyMs: 340, successRate: 0.97 },
    { id: 'github.pr.comment',      name: 'GitHub PR Comment',      description: 'Post inline or general comments on pull requests', category: 'github', connector: 'github', authType: 'oauth2', isActive: true, usageCount: 312, avgLatencyMs: 280, successRate: 0.96 },
    { id: 'github.issue.create',    name: 'GitHub Issue Create',    description: 'Create GitHub issues with labels and assignees', category: 'github', connector: 'github', authType: 'oauth2', isActive: true, usageCount: 89, avgLatencyMs: 310, successRate: 0.95 },
    { id: 'jira.ticket.read',       name: 'Jira Ticket Read',       description: 'Fetch Jira ticket details, comments, and history', category: 'http', connector: 'jira', authType: 'api_key', isActive: true, usageCount: 234, avgLatencyMs: 450, successRate: 0.93 },
    { id: 'jira.ticket.create',     name: 'Jira Ticket Create',     description: 'Create Jira tickets with fields, labels, and sprint assignment', category: 'http', connector: 'jira', authType: 'api_key', isActive: true, usageCount: 78, avgLatencyMs: 520, successRate: 0.91 },
    { id: 'slack.post',             name: 'Slack Post',             description: 'Post messages to Slack channels with rich formatting', category: 'messaging', connector: 'slack', authType: 'oauth2', isActive: true, usageCount: 567, avgLatencyMs: 190, successRate: 0.98 },
    { id: 'slack.thread.reply',     name: 'Slack Thread Reply',     description: 'Reply to a specific Slack thread', category: 'messaging', connector: 'slack', authType: 'oauth2', isActive: true, usageCount: 234, avgLatencyMs: 200, successRate: 0.97 },
    { id: 'teams.post',             name: 'Teams Post',             description: 'Post messages to Microsoft Teams channels', category: 'messaging', connector: 'teams', authType: 'oauth2', isActive: false, usageCount: 12, avgLatencyMs: 380, successRate: 0.90 },
    { id: 'k8s.apply',              name: 'Kubernetes Apply',       description: 'Apply Kubernetes manifests to target clusters', category: 'deployment', authType: 'jwt', isActive: true, usageCount: 45, avgLatencyMs: 1200, successRate: 0.92 },
    { id: 'k8s.status',             name: 'Kubernetes Status',      description: 'Get pod, deployment, and service status from clusters', category: 'deployment', authType: 'jwt', isActive: true, usageCount: 189, avgLatencyMs: 340, successRate: 0.96 },
    { id: 'http.fetch',             name: 'HTTP Fetch',             description: 'Make HTTP requests to external APIs with auth', category: 'http', authType: 'api_key', isActive: true, usageCount: 345, avgLatencyMs: 620, successRate: 0.93 },
    { id: 'db.query',               name: 'Database Query',         description: 'Execute read-only SQL queries against connected databases', category: 'database', authType: 'basic', isActive: true, usageCount: 156, avgLatencyMs: 85, successRate: 0.97 },
    { id: 'vector.search',          name: 'Vector Search',          description: 'Semantic similarity search across knowledge embeddings', category: 'analytics', authType: 'none', isActive: true, usageCount: 678, avgLatencyMs: 120, successRate: 0.95 },
    { id: 'confluence.read',        name: 'Confluence Read',        description: 'Fetch Confluence pages, spaces, and search results', category: 'http', connector: 'jira', authType: 'api_key', isActive: true, usageCount: 123, avgLatencyMs: 380, successRate: 0.94 },
    { id: 'datadog.query',          name: 'Datadog Query',          description: 'Query Datadog metrics, logs, and APM traces', category: 'analytics', authType: 'api_key', isActive: true, usageCount: 89, avgLatencyMs: 540, successRate: 0.92 },
    { id: 'pagerduty.incident',     name: 'PagerDuty Incident',     description: 'Create, acknowledge, and resolve PagerDuty incidents', category: 'messaging', authType: 'api_key', isActive: true, usageCount: 34, avgLatencyMs: 290, successRate: 0.96 },
];

// ---------------------------------------------------------------------------
// In-Memory Stores
// ---------------------------------------------------------------------------

export class PromptStore {
    private prompts: Map<string, Prompt> = new Map();
    private votes: Map<string, Vote> = new Map();
    private recommendations: Map<string, Recommendation> = new Map();

    constructor() {
        for (const p of PROMPTS) this.prompts.set(p.id, p);
    }

    getAllPrompts(filters?: { category?: string; tag?: string; source?: string; search?: string; featured?: boolean }): Prompt[] {
        let results = Array.from(this.prompts.values()).filter(p => p.status === 'published');

        if (filters?.category) results = results.filter(p => p.categorySlug === filters.category);
        if (filters?.tag) results = results.filter(p => p.tags.includes(filters.tag!));
        if (filters?.source) results = results.filter(p => p.source === filters.source);
        if (filters?.featured) results = results.filter(p => p.isFeatured);
        if (filters?.search) {
            const q = filters.search.toLowerCase();
            results = results.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.tags.some(t => t.includes(q))
            );
        }

        return results.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.upvotes - a.upvotes;
        });
    }

    getPrompt(id: string): Prompt | undefined { return this.prompts.get(id); }
    getPromptBySlug(slug: string): Prompt | undefined {
        return Array.from(this.prompts.values()).find(p => p.slug === slug);
    }

    vote(userId: string, promptId: string, voteType: 'upvote' | 'downvote' | 'flag'): Prompt | undefined {
        const prompt = this.prompts.get(promptId);
        if (!prompt) return undefined;

        const voteKey = `${userId}:prompt:${promptId}:${voteType}`;
        if (this.votes.has(voteKey)) return prompt;

        this.votes.set(voteKey, { id: voteKey, userId, targetType: 'prompt', targetId: promptId, voteType, createdAt: new Date().toISOString() });

        if (voteType === 'upvote') prompt.upvotes++;
        else if (voteType === 'downvote') prompt.downvotes++;
        else if (voteType === 'flag') prompt.flagCount++;

        return prompt;
    }

    forkPrompt(promptId: string, userId: string, userName: string): Prompt | undefined {
        const original = this.prompts.get(promptId);
        if (!original) return undefined;

        original.forkCount++;

        const fork: Prompt = {
            ...original,
            id: `prompt-${Date.now()}`,
            slug: `${original.slug}-fork-${Date.now()}`,
            title: `${original.title} (Fork)`,
            forkedFrom: original.id,
            source: 'user',
            authorId: userId,
            authorName: userName,
            upvotes: 0, downvotes: 0, forkCount: 0, usageCount: 0, flagCount: 0,
            isFeatured: false, isPinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        this.prompts.set(fork.id, fork);
        return fork;
    }

    pinPrompt(promptId: string): Prompt | undefined {
        const prompt = this.prompts.get(promptId);
        if (!prompt) return undefined;
        prompt.isPinned = !prompt.isPinned;
        prompt.updatedAt = new Date().toISOString();
        return prompt;
    }

    usePrompt(promptId: string): Prompt | undefined {
        const prompt = this.prompts.get(promptId);
        if (!prompt) return undefined;
        prompt.usageCount++;
        return prompt;
    }

    addRecommendation(rec: Omit<Recommendation, 'id' | 'status' | 'upvotes' | 'flagCount' | 'createdAt' | 'updatedAt'>): Recommendation {
        const recommendation: Recommendation = {
            ...rec,
            id: `rec-${Date.now()}`,
            status: 'pending',
            upvotes: 0,
            flagCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.recommendations.set(recommendation.id, recommendation);
        return recommendation;
    }

    getAllRecommendations(): Recommendation[] {
        return Array.from(this.recommendations.values()).sort((a, b) => b.upvotes - a.upvotes);
    }

    upvoteRecommendation(userId: string, recId: string): Recommendation | undefined {
        const rec = this.recommendations.get(recId);
        if (!rec) return undefined;

        const voteKey = `${userId}:recommendation:${recId}:upvote`;
        if (this.votes.has(voteKey)) return rec;

        this.votes.set(voteKey, { id: voteKey, userId, targetType: 'recommendation', targetId: recId, voteType: 'upvote', createdAt: new Date().toISOString() });
        rec.upvotes++;
        return rec;
    }

    getCategories(): PromptCategory[] { return CATEGORIES; }
    getTags(): PromptTag[] { return TAGS; }
    getTools(): ToolEntry[] { return TOOLS_REGISTRY; }
}
