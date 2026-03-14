/**
 * Persona API — Shared execution runtime for all personas (Engineering, Product, HR, Marketing)
 * Uses the multi-LLM provider system and agent identity injection.
 * Every step is executed with the assigned agent's system prompt, quality gates,
 * and handoff validation between steps.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import type { PersonaSkillDef, SkillStep } from './engineering-skills-data.js';
import { callLLM as callLLMProvider, type LLMProviderId, type LLMResponse } from './llm-provider.js';
import { getAgentIdentity, getAgentsByPersona, validateHandoff, type AgentIdentity } from './agent-registry.js';
import { buildAgentMemoryContext, extractAndStoreMemory, initAgentMemory } from './agent-memory.js';
import type { Store } from './db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PersonaExecutionRecord {
  id: string;
  persona: 'engineering' | 'product' | 'hr' | 'marketing';
  skillId: string;
  skillName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  provider?: LLMProviderId;
  model?: string;
  steps: Array<{
    stepId: string;
    stepName: string;
    agent: string;
    agentCallSign?: string;
    agentRank?: string;
    tool?: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    outputKey?: string;
    outputPreview?: string;
    error?: string;
    // KPI tracking
    latencyMs?: number;
    tokenCost?: number;
    qualityScore?: number;
    handoffValid?: boolean;
    handoffWarnings?: string[];
  }>;
  outputs: Record<string, string>;
  inputs: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  userId?: string;
  // Aggregate metrics
  totalTokenCost?: number;
  totalLatencyMs?: number;
  avgQualityScore?: number;
}

// ---------------------------------------------------------------------------
// In-memory execution store (with optional persistence backing)
// ---------------------------------------------------------------------------

const executions = new Map<string, PersonaExecutionRecord>();
let backingStore: Store | null = null;
const EXEC_TABLE = 'persona_executions';
const KPI_TABLE = 'agent_kpis';

/** Initialize persistence — call from server.ts with the gateway store */
export function initPersonaStore(store: Store): void {
  backingStore = store;
  // Restore executions from persistent store
  const saved = store.all(EXEC_TABLE);
  for (const row of saved) {
    const rec = row as unknown as PersonaExecutionRecord;
    if (rec.id) executions.set(rec.id, rec);
  }
  // Restore KPIs from persistent store
  const savedKPIs = store.all(KPI_TABLE);
  for (const row of savedKPIs) {
    const kpi = row as unknown as AgentKPI;
    if (kpi.agentId) agentKPIs.set(kpi.agentId, kpi);
  }
  const execCount = executions.size;
  const kpiCount = agentKPIs.size;
  if (execCount > 0 || kpiCount > 0) {
    console.log(`[persona-api] Restored ${execCount} executions and ${kpiCount} agent KPIs from persistent store`);
  }

  // Wire agent memory persistence
  initAgentMemory(store);
}

/** Persist an execution record to backing store */
function persistExec(exec: PersonaExecutionRecord): void {
  executions.set(exec.id, exec);
  if (backingStore) {
    const existing = backingStore.get(EXEC_TABLE, exec.id);
    if (existing) {
      backingStore.update(EXEC_TABLE, exec.id, exec as unknown as Record<string, unknown>);
    } else {
      backingStore.insert(EXEC_TABLE, exec.id, exec as unknown as Record<string, unknown>);
    }
  }
}

/** Persist a KPI record to backing store */
function persistKPI(agentId: string, kpi: AgentKPI): void {
  agentKPIs.set(agentId, kpi);
  if (backingStore) {
    const existing = backingStore.get(KPI_TABLE, agentId);
    if (existing) {
      backingStore.update(KPI_TABLE, agentId, kpi as unknown as Record<string, unknown>);
    } else {
      backingStore.insert(KPI_TABLE, agentId, kpi as unknown as Record<string, unknown>);
    }
  }
}

// ---------------------------------------------------------------------------
// Claude API call
// ---------------------------------------------------------------------------

/** Unified LLM call — routes to the configured provider (Claude, OpenAI, Gemini, Ollama, Azure) */
async function callLLMUnified(
  systemPrompt: string,
  userPrompt: string,
  provider?: LLMProviderId,
  modelId?: string
): Promise<LLMResponse> {
  return callLLMProvider({
    provider,
    model: modelId,
    systemPrompt,
    userPrompt,
    maxTokens: 4096,
  });
}

// ---------------------------------------------------------------------------
// Sandbox Output Generator — produces structured, realistic sample content
// ---------------------------------------------------------------------------

function generateSandboxOutput(
  persona: 'engineering' | 'product',
  skillName: string,
  step: SkillStep,
  inputs: Record<string, unknown>,
  previousOutputs: Record<string, string>
): string {
  const key = step.outputKey.toLowerCase();
  const name = step.name;
  const inputSummary = Object.entries(inputs)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `- **${k.replace(/_/g, ' ')}**: ${Array.isArray(v) ? v.join(', ') : String(v).slice(0, 120)}`)
    .join('\n');

  // Pick a generator based on the output key / step name patterns
  if (key.includes('review') || key.includes('correctness'))
    return sandboxReview(name, inputSummary);
  if (key.includes('security'))
    return sandboxSecurity(name, inputSummary);
  if (key.includes('performance'))
    return sandboxPerformance(name, inputSummary);
  if (key.includes('test') || key.includes('unit_test') || key.includes('integration'))
    return sandboxTests(name, inputSummary, inputs);
  if (key.includes('summary') || key.includes('checklist'))
    return sandboxSummary(name, skillName, inputSummary);
  if (key.includes('analysis') || key.includes('logic') || key.includes('detection'))
    return sandboxAnalysis(name, inputSummary);
  if (key.includes('diff') || key.includes('metadata') || key.includes('context') || key.includes('source'))
    return sandboxMetadata(name, inputSummary);
  if (key.includes('suggestion') || key.includes('inline') || key.includes('patch'))
    return sandboxSuggestions(name, inputSummary);
  if (key.includes('architecture') || key.includes('design') || key.includes('diagram'))
    return sandboxArchitecture(name, inputSummary);
  if (key.includes('roadmap') || key.includes('plan') || key.includes('timeline'))
    return sandboxPlan(name, inputSummary);
  if (key.includes('doc') || key.includes('readme') || key.includes('guide'))
    return sandboxDocumentation(name, inputSummary);
  if (key.includes('requirement') || key.includes('spec') || key.includes('story') || key.includes('prd'))
    return sandboxRequirements(name, inputSummary);
  if (key.includes('deploy') || key.includes('ci') || key.includes('pipeline'))
    return sandboxPipeline(name, inputSummary);

  // Fallback: generic structured output
  return sandboxGeneric(name, skillName, persona, inputSummary);
}

function sandboxReview(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Code Review Findings

### Critical Issues (2)
| # | File | Line | Finding | Severity |
|---|------|------|---------|----------|
| 1 | \`src/api/handler.ts\` | 42 | Missing input validation on user-supplied \`id\` parameter — potential injection vector | 🔴 Critical |
| 2 | \`src/db/queries.ts\` | 118 | Unbounded query without \`LIMIT\` — could return entire table on edge cases | 🟠 High |

### Warnings (3)
- **Dead code**: \`calculateLegacyDiscount()\` in \`pricing.ts:67\` is never called
- **Inconsistent error handling**: Some controllers return \`{ error }\`, others throw — standardize pattern
- **Missing null check**: \`user.profile.avatar\` accessed without optional chaining at \`profile.ts:23\`

### Positive Observations
- Clean separation of concerns between service and controller layers
- Good use of TypeScript discriminated unions for API responses
- Test coverage for happy paths is solid

${inputSummary ? `## Review Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run in Live mode with API key for AI-generated analysis of your actual code.*`;
}

function sandboxSecurity(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Security Scan Results

### Vulnerabilities Found
| Severity | Category | Location | Description |
|----------|----------|----------|-------------|
| 🔴 Critical | SQL Injection | \`db/queries.ts:45\` | String concatenation in query builder — use parameterized queries |
| 🟠 High | XSS | \`components/Comment.tsx:12\` | \`dangerouslySetInnerHTML\` with unsanitized user content |
| 🟡 Medium | Secrets | \`.env.example\` | Contains placeholder that resembles actual API key format |
| 🟢 Low | CORS | \`server.ts:8\` | Wildcard CORS origin in non-development config |

### Recommendations
1. Replace string concatenation with parameterized queries or ORM methods
2. Sanitize HTML content through DOMPurify before rendering
3. Rotate any credentials matching the exposed pattern
4. Restrict CORS to specific allowed origins in production config

${inputSummary ? `## Scan Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — connect security tools and run Live for real vulnerability scanning.*`;
}

function sandboxPerformance(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Performance Analysis

### Hot Spots Identified
| Area | Impact | Issue | Recommendation |
|------|--------|-------|----------------|
| Database | High | N+1 query in user list endpoint | Use \`JOIN\` or batch loader pattern |
| Rendering | Medium | Large list without virtualization (2000+ items) | Implement windowing with \`react-window\` |
| Bundle | Medium | Importing entire \`lodash\` (72KB gzipped) | Switch to \`lodash-es\` with tree-shaking |
| API | Low | No response caching for static catalog data | Add \`Cache-Control\` headers, consider Redis |

### Metrics Estimate
- **Current P95 latency**: ~420ms (list endpoint)
- **After fixes**: ~85ms (projected)
- **Bundle reduction**: ~45KB gzipped savings

${inputSummary ? `## Analysis Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for AI-powered analysis of your actual codebase.*`;
}

function sandboxTests(stepName: string, inputSummary: string, inputs: Record<string, unknown>): string {
  const lang = (inputs.language as string) || 'TypeScript';
  const framework = (inputs.test_framework as string) || 'Jest';
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Generated Tests — ${lang} / ${framework}

\`\`\`typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../src/services/user-service';
import { mockDb } from './helpers/mock-db';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(mockDb());
  });

  describe('createUser', () => {
    it('should create a user with valid input', async () => {
      const result = await service.createUser({
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result.id).toBeDefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should reject duplicate email addresses', async () => {
      await service.createUser({ email: 'dup@example.com', name: 'First' });
      await expect(
        service.createUser({ email: 'dup@example.com', name: 'Second' })
      ).rejects.toThrow('Email already exists');
    });

    it('should trim and lowercase email', async () => {
      const result = await service.createUser({
        email: '  Test@Example.COM  ',
        name: 'User',
      });
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('getUser', () => {
    it('should return null for non-existent user', async () => {
      const result = await service.getUser('nonexistent-id');
      expect(result).toBeNull();
    });
  });
});
\`\`\`

### Coverage Summary
| Category | Tests | Scenarios |
|----------|-------|-----------|
| Happy path | 3 | Create, read, update |
| Edge cases | 2 | Duplicate email, empty name |
| Error handling | 2 | Not found, invalid input |
| **Total** | **7** | |

${inputSummary ? `## Test Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for AI-generated tests against your actual source code.*`;
}

function sandboxSummary(stepName: string, skillName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Summary — ${skillName}

### Overview
This analysis covers the submitted changes across 12 files (8 modified, 3 added, 1 deleted). The changes primarily affect the authentication module and user management service.

### Key Changes
1. **Authentication flow refactored** to support OAuth 2.0 PKCE alongside existing session-based auth
2. **New middleware** added for rate limiting on public API endpoints
3. **Database migration** adds \`refresh_token\` column to users table
4. **Deprecated endpoint** \`/api/v1/login\` marked for removal in next major version

### Risk Assessment
- **Breaking change risk**: Low — new auth flow is additive, old sessions still honored
- **Data migration risk**: Medium — \`refresh_token\` column requires backfill for existing users
- **Rollback plan**: Feature-flagged behind \`ENABLE_OAUTH_PKCE\`

### Reviewer Checklist
- [ ] Verify migration is reversible
- [ ] Check rate limit thresholds match production traffic patterns
- [ ] Confirm OAuth callback URLs are allowlisted
- [ ] Validate refresh token rotation logic

${inputSummary ? `## Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for AI-generated analysis of your actual changes.*`;
}

function sandboxAnalysis(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Analysis Results

### Code Structure
- **Entry points**: 3 public functions, 2 exported classes
- **Complexity**: Cyclomatic complexity 14 (moderate — consider extracting helper functions above 10)
- **Dependencies**: 6 external imports, 4 internal modules

### Logic Branches Identified
| Branch | Condition | Test Coverage |
|--------|-----------|---------------|
| Auth check | \`user.isAuthenticated\` | ✅ Covered |
| Admin override | \`user.role === 'admin'\` | ✅ Covered |
| Rate limit bypass | \`config.skipRateLimit\` | ⚠️ Missing |
| Fallback handler | \`catch (err)\` | ⚠️ Partial |
| Edge: empty input | \`items.length === 0\` | ❌ Not covered |

### Recommendations
1. Add guard clause for empty array input
2. Extract the nested conditional in \`processOrder()\` into a strategy pattern
3. The fallback handler swallows errors silently — log or re-throw

${inputSummary ? `## Analysis Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for actual code analysis.*`;
}

function sandboxMetadata(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Metadata Retrieved

| Field | Value |
|-------|-------|
| **Title** | feat: Add OAuth 2.0 PKCE authentication flow |
| **Author** | developer@example.com |
| **Branch** | feature/oauth-pkce → main |
| **Files Changed** | 12 (8 modified, 3 added, 1 deleted) |
| **Lines** | +342 / -89 |
| **Labels** | \`feature\`, \`auth\`, \`needs-review\` |
| **CI Status** | ✅ All checks passed |
| **Created** | 2 hours ago |

### Changed File Categories
- **Auth module** (5 files): Core flow changes
- **Middleware** (2 files): Rate limiting
- **Database** (2 files): Migration + model update
- **Tests** (2 files): New test coverage
- **Config** (1 file): Environment variables

${inputSummary ? `## Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — connect GitHub and run Live to fetch real PR data.*`;
}

function sandboxSuggestions(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Inline Suggestions

### Suggestion 1 — \`src/auth/oauth.ts:42\`
\`\`\`diff
- const token = jwt.sign(payload, SECRET);
+ const token = jwt.sign(payload, SECRET, { expiresIn: '15m', algorithm: 'RS256' });
\`\`\`
**Reason:** Token has no expiration — set a reasonable TTL and use asymmetric signing.

### Suggestion 2 — \`src/middleware/rate-limit.ts:18\`
\`\`\`diff
- const limit = 100;
+ const limit = parseInt(process.env.RATE_LIMIT ?? '100', 10);
\`\`\`
**Reason:** Make rate limit configurable via environment for different deployment tiers.

### Suggestion 3 — \`src/db/queries.ts:67\`
\`\`\`diff
- const users = await db.query(\`SELECT * FROM users WHERE org = '\${orgId}'\`);
+ const users = await db.query('SELECT * FROM users WHERE org = $1', [orgId]);
\`\`\`
**Reason:** SQL injection vulnerability — use parameterized query.

${inputSummary ? `## Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for suggestions based on your actual diff.*`;
}

function sandboxArchitecture(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Architecture Analysis

### System Components
\`\`\`
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Frontend   │────▶│  API Gateway  │────▶│  Auth Service│
│  (React SPA) │     │  (Express)    │     │  (OAuth 2.0) │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                    ┌──────┴───────┐
                    │              │
              ┌─────▼────┐  ┌─────▼────┐
              │  User     │  │  Order    │
              │  Service  │  │  Service  │
              └─────┬────┘  └─────┬────┘
                    │              │
              ┌─────▼──────────────▼────┐
              │     PostgreSQL DB        │
              └─────────────────────────┘
\`\`\`

### Design Patterns Identified
- **API Gateway pattern** for request routing and auth
- **Service layer** with domain separation (users, orders)
- **Repository pattern** for data access abstraction

### Recommendations
1. Consider event-driven communication between User and Order services
2. Add a caching layer (Redis) for frequently-accessed catalog data
3. Introduce circuit breaker for external service calls

${inputSummary ? `## Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for analysis of your actual architecture.*`;
}

function sandboxPlan(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Roadmap & Timeline

### Phase 1 — Foundation (Weeks 1–2)
- [ ] Set up project scaffolding and CI/CD pipeline
- [ ] Define API contracts and data models
- [ ] Implement core authentication flow
- [ ] Set up monitoring and alerting baseline

### Phase 2 — Core Features (Weeks 3–5)
- [ ] Build primary user-facing workflows
- [ ] Implement data access layer with migrations
- [ ] Add integration tests for critical paths
- [ ] Performance baseline and load testing

### Phase 3 — Polish & Launch (Weeks 6–7)
- [ ] UI/UX refinements based on internal testing
- [ ] Security audit and penetration testing
- [ ] Documentation for API consumers
- [ ] Staged rollout plan with feature flags

### Milestones
| Milestone | Target | Status |
|-----------|--------|--------|
| Alpha | Week 3 | ⬜ Not started |
| Beta | Week 5 | ⬜ Not started |
| GA | Week 7 | ⬜ Not started |

${inputSummary ? `## Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for AI-generated planning tailored to your project.*`;
}

function sandboxDocumentation(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Generated Documentation

### API Reference

#### \`POST /api/v2/users\`
Creates a new user account.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "member"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "member",
  "createdAt": "2025-01-15T10:30:00Z"
}
\`\`\`

**Error Responses:**
| Code | Description |
|------|-------------|
| 400 | Invalid email format or missing required fields |
| 409 | Email already registered |
| 429 | Rate limit exceeded |

### Quick Start
\`\`\`bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run migrations
npm run db:migrate

# Start development server
npm run dev
\`\`\`

${inputSummary ? `## Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for documentation generated from your actual code.*`;
}

function sandboxRequirements(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## Requirements Specification

### User Stories

**US-001: User Registration**
> As a new user, I want to create an account with my email so that I can access the platform.

**Acceptance Criteria:**
- [ ] User can register with email and password
- [ ] Email validation prevents invalid formats
- [ ] Duplicate emails show clear error message
- [ ] Welcome email sent on successful registration
- [ ] Account is created in "pending" state until email verified

**US-002: Dashboard Overview**
> As a logged-in user, I want to see a dashboard with my key metrics so that I can quickly understand my status.

**Acceptance Criteria:**
- [ ] Dashboard loads within 2 seconds
- [ ] Shows 4 KPI cards with real-time data
- [ ] Supports date range filtering (7d, 30d, 90d)
- [ ] Data refreshes automatically every 60 seconds

### Non-Functional Requirements
| Category | Requirement |
|----------|-------------|
| Performance | P95 API latency < 200ms |
| Availability | 99.9% uptime SLA |
| Security | SOC 2 Type II compliance |
| Scale | Support 10K concurrent users |

${inputSummary ? `## Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for requirements generated from your actual inputs.*`;
}

function sandboxPipeline(stepName: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation

## CI/CD Pipeline Configuration

\`\`\`yaml
name: Deploy Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:$GITHUB_SHA .
      - run: docker push registry.example.com/app:$GITHUB_SHA

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: kubectl set image deployment/app app=registry.example.com/app:$GITHUB_SHA
\`\`\`

### Pipeline Stages
| Stage | Duration | Gate |
|-------|----------|------|
| Lint + Test | ~2min | Auto |
| Build + Push | ~3min | Auto |
| Deploy Staging | ~1min | Auto |
| Deploy Production | ~1min | Manual approval |

${inputSummary ? `## Context\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run Live for pipeline config tailored to your stack.*`;
}

function sandboxGeneric(stepName: string, skillName: string, persona: string, inputSummary: string): string {
  return `# ${stepName}
**Mode:** 🧪 Sandbox Simulation
**Skill:** ${skillName} | **Persona:** ${persona}

## Output

### Analysis
This step analyzed the provided inputs and produced the following structured output:

**Key Findings:**
1. The primary objective has been identified and decomposed into 4 actionable work items
2. Dependencies mapped across 3 related systems
3. Risk factors assessed with mitigation strategies for each

**Recommendations:**
- Start with the highest-impact, lowest-risk item to build momentum
- Schedule a review checkpoint after the first deliverable
- Document assumptions explicitly to reduce rework

### Next Steps
| Priority | Action | Owner | ETA |
|----------|--------|-------|-----|
| P0 | Validate core assumptions with stakeholders | Lead | Day 1 |
| P1 | Prototype the primary workflow | Engineering | Week 1 |
| P2 | Set up monitoring for success metrics | DevOps | Week 1 |
| P3 | Draft rollback plan | Lead | Week 2 |

${inputSummary ? `## Inputs Received\n${inputSummary}` : ''}

> 🧪 *Sandbox output — run with Live mode for AI-generated content specific to your inputs.*`;
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildStepPrompt(
  persona: 'engineering' | 'product' | 'hr' | 'marketing',
  skillName: string,
  step: SkillStep,
  inputs: Record<string, unknown>,
  previousOutputs: Record<string, string>,
  customPrompt?: string,
  agentIdentity?: AgentIdentity
): { system: string; user: string } {
  const inputLines = Object.entries(inputs)
    .filter(([k, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ');
      const val = Array.isArray(v) ? v.join(', ') : String(v);
      return `**${label}**: ${val}`;
    })
    .join('\n');

  const prevContext =
    Object.keys(previousOutputs).length > 0
      ? '\n\n## Context from Previous Steps\n\n' +
        Object.entries(previousOutputs)
          .map(([k, v]) => `### ${k.replace(/_/g, ' ')}\n${v.slice(0, 800)}${v.length > 800 ? '\n...[truncated]' : ''}`)
          .join('\n\n')
      : '';

  // Agent identity injection — if we have a registered agent, use their system prompt
  let system: string;
  if (agentIdentity) {
    const qualitySection = agentIdentity.qualityGates.length > 0
      ? `\n\nQuality Gates (you MUST verify before delivering output):\n${agentIdentity.qualityGates.map(g => `- ${g}`).join('\n')}`
      : '';
    const outputSection = agentIdentity.handoffOutputSchema.length > 0
      ? `\n\nExpected Output Sections:\n${agentIdentity.handoffOutputSchema.map(s => `- ${s}`).join('\n')}`
      : '';
    const memoryContext = buildAgentMemoryContext(agentIdentity.id);

    system = `${agentIdentity.systemPrompt}

You are executing the "${skillName}" skill, step: "${step.name}".

Your rank: ${agentIdentity.rank.replace('-', ' ').toUpperCase()}
Your regiment: ${agentIdentity.regiment}
You report to: ${agentIdentity.escalatesTo}${qualitySection}${outputSection}${memoryContext}

Guidelines:
- Be concrete and specific — no generic filler
- Your output must meet ALL quality gates listed above
- Include the expected output sections in your response
- Output should be ready for review by your commanding officer
- Include actionable recommendations backed by evidence`;
  } else {
    const personaDescriptions: Record<string, string> = {
      engineering: 'expert software engineer and technical lead',
      product: 'expert product manager and strategist',
      hr: 'expert HR professional and people operations leader',
      marketing: 'expert marketing strategist and campaign manager',
    };
    const desc = personaDescriptions[persona] ?? 'expert professional';
    system = `You are an ${desc} working inside AgentOS, an AI operating system.

You are executing the "${skillName}" skill. Produce high-quality, specific, immediately usable output.

Guidelines:
- Be concrete and specific — no generic filler
- Format output with clear sections, headers, and bullet points where appropriate
- Write in a professional, technical tone appropriate for your audience
- Output should be ready to review and use with minimal editing
- Include actionable recommendations and specific details`;
  }

  const customSection = customPrompt
    ? `\n\n## Additional Instructions (from selected prompt)\n${customPrompt}`
    : '';

  const user = `## Skill Step: ${step.name}

## User Inputs
${inputLines || 'No structured inputs provided.'}${prevContext}${customSection}

Please execute this step now. Produce specific, high-quality output for: "${step.name}".`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// Execution Runtime
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Adaptive Agent Routing — select best-performing agent for a role
// ---------------------------------------------------------------------------

/**
 * Find the best available agent for a given role within the same persona.
 * If the assigned agent has a quality score below the threshold AND alternative
 * agents in the same persona have higher scores, swap to the better agent.
 */
function selectBestAgent(defaultAgentId: string, persona: string): string {
  const kpi = agentKPIs.get(defaultAgentId);
  // Need at least 3 executions to have meaningful KPI data
  if (!kpi || kpi.totalExecutions < 3) return defaultAgentId;

  const QUALITY_THRESHOLD = 6.0; // Below this, look for alternatives
  if (kpi.avgQualityScore >= QUALITY_THRESHOLD) return defaultAgentId;

  // Find alternative agents in the same persona with better scores
  const defaultAgent = getAgentIdentity(defaultAgentId);
  if (!defaultAgent) return defaultAgentId;

  const candidates = getAgentsByPersona(defaultAgent.persona)
    .filter(a => a.id !== defaultAgentId && a.rank === defaultAgent.rank)
    .map(a => ({ agent: a, kpi: agentKPIs.get(a.id) }))
    .filter(c => c.kpi && c.kpi.totalExecutions >= 3 && c.kpi.avgQualityScore > kpi.avgQualityScore)
    .sort((a, b) => (b.kpi!.avgQualityScore - a.kpi!.avgQualityScore));

  if (candidates.length > 0) {
    const best = candidates[0]!;
    console.log(`[adaptive-routing] Swapping ${defaultAgentId} (quality: ${kpi.avgQualityScore.toFixed(1)}) → ${best.agent.id} (quality: ${best.kpi!.avgQualityScore.toFixed(1)})`);
    return best.agent.id;
  }

  return defaultAgentId;
}

async function processSkillSteps(
  execId: string,
  persona: 'engineering' | 'product' | 'hr' | 'marketing',
  skill: PersonaSkillDef,
  inputs: Record<string, unknown>,
  simulate: boolean,
  customPrompt?: string,
  provider?: LLMProviderId,
  modelId?: string
): Promise<void> {
  const exec = executions.get(execId);
  if (!exec) return;

  exec.status = 'running';
  persistExec(exec);

  const previousOutputs: Record<string, string> = {};
  let totalTokenCost = 0;
  let totalLatencyMs = 0;
  let qualityScores: number[] = [];

  for (let i = 0; i < skill.steps.length; i++) {
    const skillStep = skill.steps[i];
    const stepRecord = exec.steps[i];

    if (!skillStep || !stepRecord) continue;

    // Adaptive agent routing — select best performer for this role
    const resolvedAgentId = selectBestAgent(skillStep.agent, persona);
    const agentIdentity = getAgentIdentity(resolvedAgentId);
    if (agentIdentity) {
      stepRecord.agent = resolvedAgentId;
      stepRecord.agentCallSign = agentIdentity.callSign;
      stepRecord.agentRank = agentIdentity.rank;
    }

    // Mark step as running
    stepRecord.status = 'running';
    stepRecord.startedAt = new Date().toISOString();
    persistExec(exec);

    const stepStart = Date.now();

    try {
      let output: string;
      let llmResponse: LLMResponse | undefined;

      if (simulate) {
        await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
        output = generateSandboxOutput(persona, skill.name, skillStep, inputs, previousOutputs);
      } else {
        const { system, user } = buildStepPrompt(persona, skill.name, skillStep, inputs, previousOutputs, customPrompt, agentIdentity);
        llmResponse = await callLLMUnified(system, user, provider, modelId);
        output = llmResponse.content;
      }

      // Handoff validation — check if output meets contract with next agent
      if (i < skill.steps.length - 1) {
        const nextStep = skill.steps[i + 1];
        if (nextStep) {
          const handoffResult = validateHandoff(skillStep.agent, nextStep.agent, output);
          stepRecord.handoffValid = handoffResult.valid;
          stepRecord.handoffWarnings = handoffResult.warnings;
          if (!handoffResult.valid) {
            console.warn(`[persona-api] Handoff warning: ${skillStep.agent} → ${nextStep.agent} missing fields: ${handoffResult.missingFields.join(', ')}`);
          }
        }
      }

      previousOutputs[skillStep.outputKey] = output;
      exec.outputs[skillStep.outputKey] = output;

      // KPI tracking
      const latencyMs = Date.now() - stepStart;
      stepRecord.latencyMs = latencyMs;
      totalLatencyMs += latencyMs;

      if (llmResponse) {
        stepRecord.tokenCost = llmResponse.cost;
        totalTokenCost += llmResponse.cost;
        exec.provider = llmResponse.provider;
        exec.model = llmResponse.model;
      }

      // Quality heuristic: based on output length, section coverage, and completeness
      const qualityScore = computeQualityScore(output, agentIdentity);
      stepRecord.qualityScore = qualityScore;
      qualityScores.push(qualityScore);

      // Agent memory — extract and store learnings from this execution
      if (agentIdentity) {
        extractAndStoreMemory(agentIdentity.id, exec.id, skillStep.name, output);
      }

      stepRecord.status = skillStep.requiresApproval ? 'approval_required' : 'completed';
      stepRecord.completedAt = new Date().toISOString();
      stepRecord.outputKey = skillStep.outputKey;
      stepRecord.outputPreview = output.slice(0, 300);

    } catch (err) {
      stepRecord.status = 'failed';
      stepRecord.completedAt = new Date().toISOString();
      stepRecord.latencyMs = Date.now() - stepStart;
      stepRecord.error = err instanceof Error ? err.message : 'Step failed';
      console.error(`[persona-api] Step ${skillStep.id} failed:`, err);
    }

    persistExec(exec);
  }

  // Aggregate metrics
  exec.totalTokenCost = totalTokenCost;
  exec.totalLatencyMs = totalLatencyMs;
  exec.avgQualityScore = qualityScores.length > 0
    ? Math.round((qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) * 10) / 10
    : undefined;

  const anyFailed = exec.steps.some((s) => s.status === 'failed');
  exec.status = anyFailed ? 'failed' : 'completed';
  exec.completedAt = new Date().toISOString();
  persistExec(exec);

  // Record to KPI store
  recordExecutionMetrics(exec);
}

/** Compute a quality score (0-10) for agent output based on heuristics */
function computeQualityScore(output: string, agent?: AgentIdentity): number {
  let score = 5; // baseline

  // Length check — very short output is likely low quality
  if (output.length > 500) score += 1;
  if (output.length > 1500) score += 1;
  if (output.length > 3000) score += 0.5;
  if (output.length < 100) score -= 2;

  // Structure check — has markdown headers
  const headerCount = (output.match(/^#{1,3} /gm) || []).length;
  if (headerCount >= 2) score += 1;
  if (headerCount >= 4) score += 0.5;

  // Quality gate check — if agent has expected output sections, verify presence
  if (agent?.handoffOutputSchema) {
    const outputLower = output.toLowerCase();
    const covered = agent.handoffOutputSchema.filter(s => outputLower.includes(s.toLowerCase())).length;
    const coverage = covered / agent.handoffOutputSchema.length;
    score += coverage * 2; // up to +2 for full schema coverage
  }

  // Actionability check — has specific items
  if (output.includes('- [') || output.includes('| ')) score += 0.5; // checklists or tables
  if (output.match(/```/g)?.length) score += 0.5; // code blocks

  return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
}

// ---------------------------------------------------------------------------
// KPI Store — tracks agent performance across executions
// ---------------------------------------------------------------------------

interface AgentKPI {
  agentId: string;
  callSign: string;
  totalExecutions: number;
  avgLatencyMs: number;
  avgQualityScore: number;
  avgTokenCost: number;
  handoffSuccessRate: number;
  lastExecutedAt: string;
}

const agentKPIs = new Map<string, AgentKPI>();

function recordExecutionMetrics(exec: PersonaExecutionRecord): void {
  for (const step of exec.steps) {
    if (step.status !== 'completed' && step.status !== 'approval_required') continue;

    const agentId = step.agent;
    const existing = agentKPIs.get(agentId);
    const callSign = step.agentCallSign ?? agentId;

    if (!existing) {
      const kpi: AgentKPI = {
        agentId,
        callSign,
        totalExecutions: 1,
        avgLatencyMs: step.latencyMs ?? 0,
        avgQualityScore: step.qualityScore ?? 5,
        avgTokenCost: step.tokenCost ?? 0,
        handoffSuccessRate: step.handoffValid !== false ? 100 : 0,
        lastExecutedAt: step.completedAt ?? new Date().toISOString(),
      };
      persistKPI(agentId, kpi);
    } else {
      const n = existing.totalExecutions;
      existing.totalExecutions = n + 1;
      existing.avgLatencyMs = (existing.avgLatencyMs * n + (step.latencyMs ?? 0)) / (n + 1);
      existing.avgQualityScore = (existing.avgQualityScore * n + (step.qualityScore ?? 5)) / (n + 1);
      existing.avgTokenCost = (existing.avgTokenCost * n + (step.tokenCost ?? 0)) / (n + 1);
      existing.handoffSuccessRate = (existing.handoffSuccessRate * n + (step.handoffValid !== false ? 100 : 0)) / (n + 1);
      existing.lastExecutedAt = step.completedAt ?? new Date().toISOString();
      persistKPI(agentId, existing);
    }
  }
}

/** Get KPI metrics for all agents */
export function getAgentKPIs(): AgentKPI[] {
  return Array.from(agentKPIs.values()).sort((a, b) => b.totalExecutions - a.totalExecutions);
}

/** Get KPI for a specific agent */
export function getAgentKPI(agentId: string): AgentKPI | undefined {
  return agentKPIs.get(agentId);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createPersonaExecution(
  persona: 'engineering' | 'product' | 'hr' | 'marketing',
  skill: PersonaSkillDef,
  inputs: Record<string, unknown>,
  userId?: string,
  simulate?: boolean,
  customPrompt?: string,
  provider?: LLMProviderId,
  modelId?: string
): PersonaExecutionRecord {
  const id = `${persona}-exec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const steps = skill.steps.map((s) => {
    const identity = getAgentIdentity(s.agent);
    return {
      stepId: s.id,
      stepName: s.name,
      agent: s.agent,
      agentCallSign: identity?.callSign,
      agentRank: identity?.rank,
      tool: s.tool,
      status: 'pending' as const,
      outputKey: s.outputKey,
    };
  });

  const exec: PersonaExecutionRecord = {
    id,
    persona,
    skillId: skill.id,
    skillName: skill.name,
    status: 'queued',
    provider,
    steps,
    outputs: {},
    inputs,
    startedAt: new Date().toISOString(),
    userId,
  };

  persistExec(exec);

  // Fire execution asynchronously
  processSkillSteps(id, persona, skill, inputs, simulate ?? false, customPrompt, provider, modelId).catch((err) => {
    console.error(`[persona-api] processSkillSteps error for ${id}:`, err);
    const e = executions.get(id);
    if (e) { e.status = 'failed'; persistExec(e); }
  });

  return exec;
}

export function getPersonaExecution(execId: string): PersonaExecutionRecord | undefined {
  return executions.get(execId);
}

export function listPersonaExecutions(persona: 'engineering' | 'product' | 'hr' | 'marketing', limit = 20): PersonaExecutionRecord[] {
  const all = Array.from(executions.values())
    .filter((e) => e.persona === persona)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit);
  return all;
}

/** Get all executions across all personas (for real metrics) */
export function getAllExecutions(): PersonaExecutionRecord[] {
  return Array.from(executions.values());
}

/** Computed stats from actual execution data */
export function getExecutionStats(): {
  totalExecutions: number;
  byPersona: Record<string, { count: number; totalCost: number; avgQuality: number }>;
  totalCost: number;
  avgQuality: number;
  activeAgents: string[];
} {
  const execs = Array.from(executions.values());
  const byPersona: Record<string, { count: number; totalCost: number; qualitySum: number; qualityCount: number }> = {};

  let totalCost = 0;
  let qualitySum = 0;
  let qualityCount = 0;
  const activeAgentSet = new Set<string>();

  for (const exec of execs) {
    const pc = byPersona[exec.persona] ?? { count: 0, totalCost: 0, qualitySum: 0, qualityCount: 0 };
    pc.count++;
    if (exec.totalTokenCost) { pc.totalCost += exec.totalTokenCost; totalCost += exec.totalTokenCost; }
    if (exec.avgQualityScore) { pc.qualitySum += exec.avgQualityScore; pc.qualityCount++; qualitySum += exec.avgQualityScore; qualityCount++; }
    byPersona[exec.persona] = pc;

    for (const step of exec.steps) {
      if (step.status === 'running') activeAgentSet.add(step.agent);
    }
  }

  const result: Record<string, { count: number; totalCost: number; avgQuality: number }> = {};
  for (const [p, v] of Object.entries(byPersona)) {
    result[p] = { count: v.count, totalCost: v.totalCost, avgQuality: v.qualityCount ? v.qualitySum / v.qualityCount : 0 };
  }

  return {
    totalExecutions: execs.length,
    byPersona: result,
    totalCost,
    avgQuality: qualityCount ? qualitySum / qualityCount : 0,
    activeAgents: Array.from(activeAgentSet),
  };
}

export function approvePersonaStep(execId: string, stepId: string): { success: boolean; message: string } {
  const exec = executions.get(execId);
  if (!exec) return { success: false, message: 'Execution not found' };
  const step = exec.steps.find((s) => s.stepId === stepId);
  if (!step) return { success: false, message: 'Step not found' };
  if (step.status !== 'approval_required') return { success: false, message: 'Step is not awaiting approval' };
  step.status = 'completed';
  persistExec(exec);
  return { success: true, message: 'Step approved' };
}
