/**
 * Enterprise Agent OS — Gateway API Server
 *
 * @author     Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright  © 2026 Phani Marupaka. All rights reserved.
 * @license    UNLICENSED — Unauthorized use prohibited.
 * @notice     This file contains embedded provenance watermarks protected
 *             under 17 U.S.C. § 1202 (Copyright Management Information).
 *             Removal or alteration constitutes a federal violation.
 *
 * Provenance: 50 68 61 6e 69 20 4d 61 72 75 70 61 6b 61
 */

import { InMemoryStore, SessionRepository, ExecutionRepository, executeQuery, classifyIntent } from './core.js';
import { PersistentStore, PostgresStore } from './db.js';
import { authenticateRequest, requirePersonaAccess, requireRole, generateJWT } from './auth.js';
import type { AuthUser } from './auth.js';
import { PromptStore } from './prompt-library-data.js';
import { CapabilityGraph } from './capability-graph.js';
import { PersonaSystem, LicenseStore } from './persona-system.js';
import { skillMarketplace } from './skill-marketplace.js';
import { intentEngine } from './intent-engine.js';
import { memoryGraph } from './memory-graph.js';
import { simulateSkillExecution } from './simulation.js';
import { toolRegistry } from './tool-registry.js';
import { scheduler } from './scheduler.js';
import { blogStore } from './blog-store.js';
import { forumStore } from './forum-store.js';
import * as marketingApi from './marketing-api.js';
import { getProject, getProjectTasks, getRecentProjects } from './marketing-program.js';
import { getCampaignGraph } from './campaign-graph.js';
import { getMarketingToolConnections, getToolConnectionStatus, connectTool, disconnectTool, testToolConnection, MARKETING_TOOL_CATALOG } from './marketing-tool-connections.js';
import { getToolConnectFlow, shouldRedirectToOAuth } from './tool-connect-flows.js';
import { getNotificationConfig, setNotificationConfig } from './marketing-notifications.js';
import { ENGINEERING_SKILLS, getEngineeringSkill, getEngineeringSkillsByCluster } from './engineering-skills-data.js';
import { PRODUCT_SKILLS, getProductSkill, getProductSkillsByCluster } from './product-skills-data.js';
import { HR_SKILLS, getHRSkill, getHRSkillsByCluster } from './hr-skills-data.js';
import { createPersonaExecution, getPersonaExecution, listPersonaExecutions, approvePersonaStep, getAgentKPIs, getAgentKPI, initPersonaStore, getExecutionStats, getAllExecutions, getAfterActionReport, listAfterActionReports, getRetrainingFlags, getRetrainingFlag, acknowledgeRetrainingFlag, dismissRetrainingFlag } from './persona-api.js';
import type { AfterActionReport, RetrainingFlag } from './persona-api.js';
import { getAvailableProviders, getDefaultProvider } from './llm-provider.js';
import { getFullRegistry, getAgentIdentity, getAgentsByPersona, getCSuiteAgents, getAllCSuiteProfiles, getCSuiteProfile, getChainOfCommand, getOrgTree } from './agent-registry.js';
import { processCognitivePipeline, decompose, reason, reflect, groundCheck, getCognitiveResult, getCognitiveTrace, type CognitiveRequest } from './cognitive-pipeline.js';
import { eventBus } from './event-bus.js';
import { submitGoal, getGoalExecution, listGoalExecutions, cancelGoal } from './gateway-orchestrator.js';
import { PipelineEngine, getPipelineExecution, listPipelineExecutions, cancelPipeline, type GraphConfig, type OrchestratorConfig, type AgentDefinition } from './pipeline-engine.js';
import { pluginRegistry } from './plugin-interfaces.js';
import { createVision, getVision, listVisions, decomposeVision, cascadeToRegiment, createProgram, getProgram, listPrograms, updateProgram, generatePMOStatusReport, getVisionStatus, initVisionStore } from './vision-api.js';
import type { VisionStatement, ProgramRecord } from './vision-api.js';
import { createChannel, getChannel, listChannels, updateChannel, deleteChannel, createRule, getRule, listRules, updateRule, deleteRule, dispatch, dispatchByTrigger, getDeliveryLog, getDelivery, getDeliveryStats, initNotificationStore } from './notification-dispatch.js';
import { createEndpoint, getEndpoint, listEndpoints, deleteEndpoint, createSubscription, getSubscription, listSubscriptions, deleteSubscription, receiveWebhook, getInboundLog, initWebhookStore } from './webhook-connector.js';
import { wireNotificationBridge } from './notification-bridge.js';
import { createExperiment, getExperiment, listExperiments, updateExperiment, transitionExperiment, addExperimentResult, scoreExperiment, deleteExperiment, createHackathon, getHackathon, listHackathons, startHackathon, completeHackathon, addExperimentToHackathon, requestGraduation, reviewGraduation, listGraduations, getInnovationBacklog, initInnovationStore } from './innovation-labs.js';
import { setBudget, getBudget, listBudgets, deleteBudget, recordSpend, getSpendLog, getBurnRate, listAlerts as listCostAlerts, acknowledgeAlert, getCFODashboard, initBudgetStore } from './budget-intelligence.js';
import { createReview, getReview, listReviews, createPlan, getPlan, listPlans, updatePlanStatus, updateObjective, submitFeedback, listFeedback, getFeedbackSummary, addExemplar, listExemplars, deleteExemplar, getAgentHealthReport, initImprovementStore } from './agent-improvement.js';
import { registerStore, initGatewayPersistence, flushGatewayPersistence } from './gateway-persistence.js';
import { getAgentMemory, getAllAgentMemorySnapshots, recordAgentMemory, _exportData as exportAgentMemory, _importData as importAgentMemory } from './agent-memory.js';
// Workflow engine available as library but not exposed as API routes
// (all execution flows use persona-api.ts sequential model)
// import { executeWorkflow, getWorkflowExecution, resumeWorkflow } from './workflow-bridge.js';
import { initOTel, shutdownOTel } from '@agentos/observability';
import { attachWebSocket, broadcastEvent, getWSClientCount } from './ws.js';
import http from 'node:http';
import fs from 'node:fs';
import nodePath from 'node:path';
import { URL } from 'node:url';
import { fileURLToPath } from 'node:url';

// Store selection: DATABASE_URL → Postgres, PERSIST=false → In-memory, default → File-backed
const usePostgres = !!process.env.DATABASE_URL;
const useInMemory = process.env.PERSIST === 'false';
const store = usePostgres ? new PostgresStore() : useInMemory ? new InMemoryStore() : new PersistentStore();
const sessions = new SessionRepository(store);
const executions = new ExecutionRepository(store);
initPersonaStore(store); // Wire persona executions & KPIs to persistent backing store
initVisionStore(store); // Wire vision statements, programs & OKRs to persistent store
initNotificationStore(store); // Wire notification channels, rules & delivery log
initWebhookStore(store); // Wire webhook endpoints & subscriptions (also re-wires outbound subscriptions to event bus)
wireNotificationBridge(); // Wire event bus patterns → notification dispatch
initInnovationStore(store); // Wire innovation labs experiments, hackathons & graduations
initBudgetStore(store); // Wire agent budgets, spend log & cost alerts
initImprovementStore(store); // Wire performance reviews, improvement plans & feedback
const promptStore = new PromptStore();
const capabilityGraph = new CapabilityGraph();
const personaSystem = new PersonaSystem();
const licenseStore = new LicenseStore();

// ---------------------------------------------------------------------------
// Gateway-wide persistence — wire all ephemeral stores to backing store
// ---------------------------------------------------------------------------
registerStore('forum_threads',
  () => [...forumStore._exportData().threads.map(t => ({ ...t, _type: 'thread' as const })), ...forumStore._exportData().comments.map(c => ({ ...c, _type: 'comment' as const }))] as Record<string, unknown>[],
  (rows) => forumStore._importData({
    threads: rows.filter(r => r._type === 'thread') as any[],
    comments: rows.filter(r => r._type === 'comment') as any[],
  })
);
registerStore('blog_posts',
  () => blogStore._exportData() as unknown as Record<string, unknown>[],
  (rows) => blogStore._importData(rows as any[])
);
registerStore('scheduler_data',
  () => {
    const d = scheduler._exportData();
    return [...d.jobs.map(j => ({ ...j, _type: 'job' } as Record<string, unknown>)), ...d.logs.map(l => ({ ...l, _type: 'log' } as Record<string, unknown>))];
  },
  (rows) => scheduler._importData({
    jobs: rows.filter(r => r._type === 'job') as any[],
    logs: rows.filter(r => r._type === 'log') as any[],
  })
);
registerStore('event_log',
  () => eventBus._exportLog() as unknown as Record<string, unknown>[],
  (rows) => eventBus._importLog(rows as any[])
);
registerStore('memory_graph',
  () => {
    const d = memoryGraph._exportData();
    return [
      ...d.executions.map(e => ({ ...e, _type: 'execution' } as Record<string, unknown>)),
      ...d.feedback.map(f => ({ ...f, _type: 'feedback' } as Record<string, unknown>)),
      ...d.comments.map(c => ({ ...c, _type: 'comment' } as Record<string, unknown>)),
    ];
  },
  (rows) => memoryGraph._importData({
    executions: rows.filter(r => r._type === 'execution') as any[],
    feedback: rows.filter(r => r._type === 'feedback') as any[],
    comments: rows.filter(r => r._type === 'comment') as any[],
  })
);
registerStore('agent_memory',
  () => exportAgentMemory(),
  (rows) => importAgentMemory(rows)
);

// Generic connection store for ConnectionsHub
interface ConnectionRecord { connectorId: string; status: string; connectedAt?: string; lastTestedAt?: string; credentials?: Record<string, string>; error?: string; }
const connectionStore = new Map<string, ConnectionRecord>();

// Real audit log — records actual gateway operations
interface AuditEntry { id: string; timestamp: string; user: string; action: string; target: string; result: 'success' | 'failed' | 'warning'; detail?: string; }
const auditLog: AuditEntry[] = [];
function recordAudit(user: string, action: string, target: string, result: AuditEntry['result'] = 'success', detail?: string): void {
    auditLog.push({ id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString(), user, action, target, result, detail });
    if (auditLog.length > 500) auditLog.splice(0, auditLog.length - 500); // keep last 500
}

// Course engagement tracking
const courseVotes = new Set<string>();
registerStore('connections',
  () => Array.from(connectionStore.entries()).map(([id, rec]) => ({ id, ...rec })) as unknown as Record<string, unknown>[],
  (rows) => { connectionStore.clear(); for (const r of rows) { const { id, ...rest } = r as any; connectionStore.set(id, rest); } }
);
registerStore('audit_log',
  () => auditLog.map(e => ({ ...e })) as unknown as Record<string, unknown>[],
  (rows) => { auditLog.length = 0; auditLog.push(...(rows as any[])); }
);

const courseStats = {
    totalCourses: 24,
    totalViews: 38420,
    totalLikes: 4478,
    totalPins: 856,
    courses: Array.from({ length: 24 }, (_, i) => ({
        id: i + 1,
        likes: Math.floor(Math.random() * 200) + 80,
        dislikes: Math.floor(Math.random() * 10),
        pins: Math.floor(Math.random() * 50) + 10,
        views: Math.floor(Math.random() * 2000) + 500,
        isPinned: [4, 7, 17, 21, 23].includes(i + 1),
    })),
};

registerStore('course_stats',
  () => [courseStats as unknown as Record<string, unknown>],
  (rows) => { if (rows[0]) Object.assign(courseStats, rows[0]); }
);

initGatewayPersistence(store); // Restore all ephemeral stores from backing store

const PORT = parseInt(process.env.PORT ?? '3000', 10);

// ---------------------------------------------------------------------------
// Skill catalog (demo data)
// ---------------------------------------------------------------------------

const SKILL_CATALOG = [
    { id: 'engineering.knowledge.search', name: 'Developer Knowledge Search', domain: 'Engineering', description: 'Search internal docs, code, and incidents', successRate: 0.91, avgLatency: '8s', qualityTier: 'production' },
    { id: 'engineering.incident.root_cause', name: 'Incident Root Cause Analysis', domain: 'Engineering', description: 'Analyze incidents with metrics, logs, and past data', successRate: 0.87, avgLatency: '12s', qualityTier: 'production' },
    { id: 'engineering.pr.architecture_review', name: 'PR Architecture Review', domain: 'Engineering', description: 'Review PRs for architecture, security, patterns', successRate: 0.93, avgLatency: '8s', qualityTier: 'certified' },
    { id: 'marketing.campaign.strategy', name: 'Campaign Strategy', domain: 'Marketing', description: 'Full campaign with ICP, messaging, calendar', successRate: 0.89, avgLatency: '18s', qualityTier: 'production' },
    { id: 'marketing.icp.analysis', name: 'ICP Analysis', domain: 'Marketing', description: 'Define ideal customer profiles', successRate: 0.86, avgLatency: '14s', qualityTier: 'beta' },
    { id: 'collaboration.transcript_to_actions', name: 'Transcript → Actions', domain: 'Leadership', description: 'Meeting summary, decisions, action items, Jira drafts', successRate: 0.85, avgLatency: '15s', qualityTier: 'production' },
    { id: 'learning.tutorial.rag', name: 'RAG Tutorial', domain: 'Learning', description: 'Build RAG pipelines using internal stack', successRate: 0.94, avgLatency: '10s', qualityTier: 'certified' },
    { id: 'learning.prompt.engineering', name: 'Prompt Engineering', domain: 'Learning', description: 'Comprehensive prompt engineering guide', successRate: 0.96, avgLatency: '8s', qualityTier: 'certified' },
];

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const path = url.pathname;
    const method = req.method ?? 'GET';

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    if (method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    // Auth
    const headers: Record<string, string | undefined> = {};
    for (const [key, val] of Object.entries(req.headers)) {
        headers[key.toLowerCase()] = Array.isArray(val) ? val[0] : val;
    }
    const auth = authenticateRequest(headers);
    if (!auth.authenticated) {
        sendJSON(res, 401, { error: auth.error ?? 'Unauthorized' });
        return;
    }

    const userId = auth.user?.id ?? 'anonymous';
    const authUser = auth.user;

    try {
        // Health — with real system status
        if (path === '/api/health' && method === 'GET') {
            sendJSON(res, 200, {
                status: 'healthy',
                version: '0.2.0',
                services: { gateway: 'up', skills: 'up', workers: 'up', orchestrator: 'up' },
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                llmConfigured: !!process.env.ANTHROPIC_API_KEY,
                githubConfigured: !!process.env.GITHUB_TOKEN,
                persistenceEnabled: usePostgres ? 'postgres' : useInMemory ? 'in-memory' : 'file-backed',
                wsClients: getWSClientCount(),
                storeStats: 'stats' in store ? (store as PersistentStore).stats() : { tables: 0, totalRows: 0 },
            });
            return;
        }

        // -----------------------------------------------------------------
        // Auth routes — token issuance + user info
        // -----------------------------------------------------------------

        // POST /api/auth/token — issue JWT from API key or credentials
        if (path === '/api/auth/token' && method === 'POST') {
            if (!authUser) { sendJSON(res, 401, { error: 'Authentication required to issue token' }); return; }
            try {
                const body = await readBody(req);
                const expiresIn = typeof body.expiresIn === 'number' ? body.expiresIn : 86400;
                const token = generateJWT(authUser, expiresIn);
                sendJSON(res, 200, { token, expiresIn, user: { id: authUser.id, email: authUser.email, name: authUser.name, role: authUser.role, teams: authUser.teams, personaScopes: authUser.personaScopes } });
            } catch (err) {
                sendJSON(res, 500, { error: 'JWT_SECRET not configured — cannot issue tokens' });
            }
            return;
        }

        // GET /api/auth/me — return current user info from token
        if (path === '/api/auth/me' && method === 'GET') {
            if (!authUser) { sendJSON(res, 401, { error: 'Not authenticated' }); return; }
            sendJSON(res, 200, { user: { id: authUser.id, email: authUser.email, name: authUser.name, role: authUser.role, teams: authUser.teams, personaScopes: authUser.personaScopes } });
            return;
        }

        // -----------------------------------------------------------------
        // Unified Execution API — single endpoint for all personas
        // POST /api/execute — unified skill/workflow execution
        // GET  /api/executions — list all executions (filtered)
        // GET  /api/executions/:id — get single execution
        // POST /api/executions/:id/approve/:stepId — approve a step
        // -----------------------------------------------------------------

        if (path === '/api/execute' && method === 'POST') {
            const body = await readBody(req);
            const { persona, skillId, inputs, simulate, customPrompt, provider, modelId } = body as {
                persona?: string; skillId?: string; inputs?: Record<string, unknown>;
                simulate?: boolean; customPrompt?: string; provider?: string; modelId?: string;
            };
            if (!persona || !skillId) { sendJSON(res, 400, { error: 'persona and skillId required' }); return; }

            // Persona access check
            if (authUser && !requirePersonaAccess(authUser, persona)) {
                sendJSON(res, 403, { error: `Access denied for persona: ${persona}` });
                return;
            }

            // Resolve skill from persona catalog
            let skill;
            if (persona === 'engineering') skill = getEngineeringSkill(skillId);
            else if (persona === 'product') skill = getProductSkill(skillId);
            else if (persona === 'hr') skill = getHRSkill(skillId);
            else if (persona === 'marketing') {
                // Marketing uses workflow execution (separate path for now)
                try {
                    const exec = marketingApi.createMarketingExecution(skillId, inputs ?? {}, userId, simulate === true, customPrompt, provider as any, modelId);
                    recordAudit(userId, 'skill.execute', `Marketing / ${exec.workflowName}`);
                    broadcastEvent(exec.id, 'session.started', { persona: 'marketing', skillId, simulate, provider });
                    sendJSON(res, 201, { execution: exec });
                } catch (err) { sendJSON(res, 400, { error: (err as Error).message }); }
                return;
            }

            if (!skill) { sendJSON(res, 404, { error: `Skill not found: ${skillId}` }); return; }

            const exec = createPersonaExecution(persona as any, skill, inputs ?? {}, userId, simulate, customPrompt, provider as any, modelId);
            recordAudit(userId, 'skill.execute', `${persona} / ${skill.name}`);
            broadcastEvent(exec.id, 'session.started', { persona, skillId, simulate, provider });
            sendJSON(res, 201, { execution: exec });
            return;
        }

        if (path === '/api/executions' && method === 'GET') {
            const persona = url.searchParams.get('persona') ?? undefined;
            const status = url.searchParams.get('status') ?? undefined;
            const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);

            // Persona access check
            if (persona && authUser && !requirePersonaAccess(authUser, persona)) {
                sendJSON(res, 403, { error: `Access denied for persona: ${persona}` });
                return;
            }

            let execs;
            if (persona) {
                execs = listPersonaExecutions(persona as any, limit);
            } else {
                execs = getAllExecutions()
                    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                    .slice(0, limit);
            }
            if (status) { execs = execs.filter(e => e.status === status); }
            sendJSON(res, 200, { executions: execs, total: execs.length });
            return;
        }

        if (path.match(/^\/api\/executions\/[^/]+$/) && method === 'GET') {
            const execId = path.split('/').pop()!;
            const exec = getPersonaExecution(execId) ?? marketingApi.getMarketingExecution(execId);
            if (!exec) { sendJSON(res, 404, { error: 'Execution not found' }); return; }
            const aar = getAfterActionReport(execId);
            sendJSON(res, 200, { execution: exec, afterActionReport: aar ?? null });
            return;
        }

        if (path.match(/^\/api\/executions\/[^/]+\/approve\/[^/]+$/) && method === 'POST') {
            const parts = path.split('/');
            const execId = parts[3]!;
            const stepId = parts[5]!;
            const result = approvePersonaStep(execId, stepId);
            sendJSON(res, result.success ? 200 : 400, result);
            return;
        }

        // Query — now with real LLM via core.ts
        if (path === '/api/query' && method === 'POST') {
            const body = await readBody(req);
            const { query } = body;
            if (!query || typeof query !== 'string') {
                sendJSON(res, 400, { error: 'Missing query field' });
                return;
            }

            await eventBus.emit('query.received', { query, userId });
            const result = await executeQuery(query, userId, sessions, executions);
            recordAudit(userId, 'query.execute', String(query).slice(0, 80), 'success');
            await eventBus.emit('query.completed', {
                sessionId: result.sessionId,
                intent: result.intent.type,
                model: result.model,
                tokensUsed: result.tokensUsed,
                costUsd: result.costUsd,
                durationMs: result.durationMs,
            });
            sendJSON(res, 200, result);
            return;
        }

        // Get session
        if (path.startsWith('/api/query/') && method === 'GET') {
            const sessionId = path.split('/').pop();
            if (!sessionId) { sendJSON(res, 400, { error: 'Missing session ID' }); return; }
            const session = sessions.get(sessionId);
            if (!session) { sendJSON(res, 404, { error: 'Session not found' }); return; }
            const execs = executions.getBySession(sessionId);
            sendJSON(res, 200, { session, executions: execs });
            return;
        }

        // Classify intent (useful for frontend suggestions)
        if (path === '/api/classify' && method === 'POST') {
            const body = await readBody(req);
            const intent = classifyIntent((body.query as string) ?? '');
            sendJSON(res, 200, intent);
            return;
        }

        // Skills catalog (legacy)
        if (path === '/api/skills' && method === 'GET') {
            sendJSON(res, 200, { skills: SKILL_CATALOG, total: SKILL_CATALOG.length });
            return;
        }

        // Unified skills & workflows — all personas, filterable by type
        if (path === '/api/skills/unified' && method === 'GET') {
            const typeFilter = url.searchParams.get('type'); // 'skill' | 'workflow' | null
            const personaFilter = url.searchParams.get('persona');
            const all = [
                ...ENGINEERING_SKILLS,
                ...PRODUCT_SKILLS,
                ...HR_SKILLS,
                ...marketingApi.getMarketingSkills(),
            ];
            const filtered = all.filter(s => {
                if (typeFilter && (s as any).executableType !== typeFilter) return false;
                if (personaFilter && (s as any).persona !== personaFilter) return false;
                return true;
            });
            sendJSON(res, 200, {
                skills: filtered,
                total: filtered.length,
                counts: {
                    skills: all.filter((s: any) => s.executableType !== 'workflow').length,
                    workflows: all.filter((s: any) => s.executableType === 'workflow').length,
                },
            });
            return;
        }

        // Activity / recent executions
        if (path === '/api/activity' && method === 'GET') {
            const recent = sessions.getRecent(20);
            sendJSON(res, 200, { sessions: recent, total: recent.length });
            return;
        }

        // Stats
        if (path === '/api/stats' && method === 'GET') {
            const allSessions = sessions.getRecent(1000);
            const complete = allSessions.filter(s => s.status === 'complete');
            sendJSON(res, 200, {
                totalSessions: allSessions.length,
                completedSessions: complete.length,
                avgConfidence: complete.length > 0
                    ? complete.reduce((sum, s) => sum + s.confidence, 0) / complete.length : 0,
                activeSkills: SKILL_CATALOG.length,
                services: { gateway: 'healthy', workers: 'healthy' },
            });
            return;
        }

        // -----------------------------------------------------------------
        // Prompt Library
        // -----------------------------------------------------------------

        // List prompts (with optional filters)
        if (path === '/api/prompts' && method === 'GET') {
            const category = url.searchParams.get('category') ?? undefined;
            const tag = url.searchParams.get('tag') ?? undefined;
            const source = url.searchParams.get('source') ?? undefined;
            const search = url.searchParams.get('q') ?? undefined;
            const featured = url.searchParams.get('featured') === 'true' ? true : undefined;

            const prompts = promptStore.getAllPrompts({ category, tag, source, search, featured });
            sendJSON(res, 200, { prompts, total: prompts.length, categories: promptStore.getCategories(), tags: promptStore.getTags() });
            return;
        }

        // Get single prompt by slug
        if (path.startsWith('/api/prompts/') && !path.includes('/vote') && !path.includes('/fork') && !path.includes('/pin') && !path.includes('/use') && path !== '/api/prompts/meta' && method === 'GET') {
            const slug = path.split('/').pop();
            if (!slug) { sendJSON(res, 400, { error: 'Missing prompt slug' }); return; }
            const prompt = promptStore.getPromptBySlug(slug);
            if (!prompt) { sendJSON(res, 404, { error: 'Prompt not found' }); return; }
            sendJSON(res, 200, { prompt });
            return;
        }

        // Vote on a prompt (upvote / downvote / flag)
        if (path.match(/^\/api\/prompts\/[^/]+\/vote$/) && method === 'POST') {
            const promptId = path.split('/')[3];
            const body = await readBody(req);
            const voteType = body.type as 'upvote' | 'downvote' | 'flag';
            if (!['upvote', 'downvote', 'flag'].includes(voteType)) {
                sendJSON(res, 400, { error: 'Invalid vote type. Use: upvote, downvote, flag' }); return;
            }
            const prompt = promptStore.vote(userId, promptId, voteType);
            if (!prompt) { sendJSON(res, 404, { error: 'Prompt not found' }); return; }
            sendJSON(res, 200, { prompt });
            return;
        }

        // Fork a prompt (duplicate to user's collection)
        if (path.match(/^\/api\/prompts\/[^/]+\/fork$/) && method === 'POST') {
            const promptId = path.split('/')[3];
            const body = await readBody(req);
            const userName = (body.userName as string) || 'anonymous';
            const fork = promptStore.forkPrompt(promptId, userId, userName);
            if (!fork) { sendJSON(res, 404, { error: 'Prompt not found' }); return; }
            sendJSON(res, 201, { prompt: fork });
            return;
        }

        // Pin / unpin a prompt
        if (path.match(/^\/api\/prompts\/[^/]+\/pin$/) && method === 'POST') {
            const promptId = path.split('/')[3];
            const prompt = promptStore.pinPrompt(promptId);
            if (!prompt) { sendJSON(res, 404, { error: 'Prompt not found' }); return; }
            sendJSON(res, 200, { prompt });
            return;
        }

        // Use (copy) a prompt — increments usage counter
        if (path.match(/^\/api\/prompts\/[^/]+\/use$/) && method === 'POST') {
            const promptId = path.split('/')[3];
            const prompt = promptStore.usePrompt(promptId);
            if (!prompt) { sendJSON(res, 404, { error: 'Prompt not found' }); return; }
            sendJSON(res, 200, { prompt });
            return;
        }

        // Prompt categories and tags metadata
        if (path === '/api/prompts/meta' && method === 'GET') {
            sendJSON(res, 200, { categories: promptStore.getCategories(), tags: promptStore.getTags() });
            return;
        }

        // -----------------------------------------------------------------
        // Recommendations (user-submitted prompt suggestions)
        // -----------------------------------------------------------------

        if (path === '/api/recommendations' && method === 'GET') {
            const recs = promptStore.getAllRecommendations();
            sendJSON(res, 200, { recommendations: recs, total: recs.length });
            return;
        }

        if (path === '/api/recommendations' && method === 'POST') {
            const body = await readBody(req);
            const { title, description, content, categorySlug } = body as Record<string, string>;
            if (!title || !content) { sendJSON(res, 400, { error: 'Missing title or content' }); return; }
            const rec = promptStore.addRecommendation({
                title, description: description || '', content,
                categorySlug, submittedBy: userId, submittedByName: (body.userName as string) || 'anonymous',
            });
            sendJSON(res, 201, { recommendation: rec });
            return;
        }

        if (path.match(/^\/api\/recommendations\/[^/]+\/upvote$/) && method === 'POST') {
            const recId = path.split('/')[3];
            const rec = promptStore.upvoteRecommendation(userId, recId);
            if (!rec) { sendJSON(res, 404, { error: 'Recommendation not found' }); return; }
            sendJSON(res, 200, { recommendation: rec });
            return;
        }

        // -----------------------------------------------------------------
        // Tools Registry
        // -----------------------------------------------------------------

        if (path === '/api/tools' && method === 'GET') {
            const tools = promptStore.getTools();
            const category = url.searchParams.get('category');
            const filtered = category ? tools.filter(t => t.category === category) : tools;
            sendJSON(res, 200, { tools: filtered, total: filtered.length });
            return;
        }

        // -----------------------------------------------------------------
        // Courses (Learning Hub engagement tracking)
        // -----------------------------------------------------------------

        if (path === '/api/courses/stats' && method === 'GET') {
            sendJSON(res, 200, courseStats);
            return;
        }

        if (path.match(/^\/api\/courses\/\d+\/like$/) && method === 'POST') {
            const courseId = parseInt(path.split('/')[3]);
            const key = `${userId}:course:${courseId}:like`;
            if (!courseVotes.has(key)) {
                courseVotes.add(key);
                const stat = courseStats.courses.find((c: { id: number }) => c.id === courseId);
                if (stat) { stat.likes++; courseStats.totalLikes++; }
            }
            sendJSON(res, 200, { success: true, course: courseStats.courses.find((c: { id: number }) => c.id === courseId) });
            return;
        }

        if (path.match(/^\/api\/courses\/\d+\/dislike$/) && method === 'POST') {
            const courseId = parseInt(path.split('/')[3]);
            const key = `${userId}:course:${courseId}:dislike`;
            if (!courseVotes.has(key)) {
                courseVotes.add(key);
                const stat = courseStats.courses.find((c: { id: number }) => c.id === courseId);
                if (stat) stat.dislikes++;
            }
            sendJSON(res, 200, { success: true, course: courseStats.courses.find((c: { id: number }) => c.id === courseId) });
            return;
        }

        if (path.match(/^\/api\/courses\/\d+\/pin$/) && method === 'POST') {
            const courseId = parseInt(path.split('/')[3]);
            const stat = courseStats.courses.find((c: { id: number }) => c.id === courseId);
            if (stat) { stat.isPinned = !stat.isPinned; stat.pins += stat.isPinned ? 1 : -1; courseStats.totalPins += stat.isPinned ? 1 : -1; }
            sendJSON(res, 200, { success: true, course: stat });
            return;
        }

        if (path.match(/^\/api\/courses\/\d+\/view$/) && method === 'POST') {
            const courseId = parseInt(path.split('/')[3]);
            const stat = courseStats.courses.find((c: { id: number }) => c.id === courseId);
            if (stat) { stat.views++; courseStats.totalViews++; }
            sendJSON(res, 200, { success: true });
            return;
        }

        // -----------------------------------------------------------------
        // Capability Graph
        // -----------------------------------------------------------------

        if (path === '/api/capability-graph' && method === 'GET') {
            sendJSON(res, 200, { capabilities: capabilityGraph.getAllCapabilities(), tools: capabilityGraph.getAllTools(), taskMappings: capabilityGraph.getAllTaskMappings() });
            return;
        }

        if (path === '/api/capability-graph/tools' && method === 'GET') {
            const capability = url.searchParams.get('capability');
            if (capability) {
                sendJSON(res, 200, { tools: capabilityGraph.getToolsForCapability(capability) });
            } else {
                sendJSON(res, 200, { tools: capabilityGraph.getAllTools() });
            }
            return;
        }

        if (path === '/api/capability-graph/capabilities' && method === 'GET') {
            const tool = url.searchParams.get('tool');
            if (tool) {
                sendJSON(res, 200, { capabilities: capabilityGraph.getCapabilitiesForTool(tool) });
            } else {
                sendJSON(res, 200, { capabilities: capabilityGraph.getAllCapabilities() });
            }
            return;
        }

        if (path === '/api/capability-graph/plan' && method === 'POST') {
            const body = await readBody(req);
            const task = body.task as string;
            if (!task) { sendJSON(res, 400, { error: 'Missing task field' }); return; }
            const plan = capabilityGraph.getExecutionPlan(task);
            sendJSON(res, 200, plan);
            return;
        }

        // -----------------------------------------------------------------
        // Persona Skill System
        // -----------------------------------------------------------------

        if (path === '/api/personas' && method === 'GET') {
            sendJSON(res, 200, { personas: personaSystem.getAllPersonas(), stats: personaSystem.getPersonaStats() });
            return;
        }

        if (path.match(/^\/api\/personas\/[^/]+$/) && method === 'GET') {
            const personaId = path.split('/').pop()!;
            const persona = personaSystem.getPersona(personaId);
            if (!persona) { sendJSON(res, 404, { error: 'Persona not found' }); return; }
            sendJSON(res, 200, { persona });
            return;
        }

        if (path.match(/^\/api\/personas\/[^/]+\/skills$/) && method === 'GET') {
            const personaId = path.split('/')[3];
            sendJSON(res, 200, { skills: personaSystem.getSkillsForPersona(personaId) });
            return;
        }

        if (path.match(/^\/api\/personas\/[^/]+\/agents$/) && method === 'GET') {
            const personaId = path.split('/')[3];
            sendJSON(res, 200, { agents: personaSystem.getAgentsForPersona(personaId) });
            return;
        }

        if (path.match(/^\/api\/personas\/[^/]+\/tools$/) && method === 'GET') {
            const personaId = path.split('/')[3];
            sendJSON(res, 200, { tools: personaSystem.getToolsForPersona(personaId) });
            return;
        }

        if (path.match(/^\/api\/personas\/[^/]+\/courses$/) && method === 'GET') {
            const personaId = path.split('/')[3];
            sendJSON(res, 200, { courses: personaSystem.getCoursesForPersona(personaId) });
            return;
        }

        if (path === '/api/personas/search' && method === 'GET') {
            const q = url.searchParams.get('q') ?? '';
            sendJSON(res, 200, { results: personaSystem.searchSkills(q) });
            return;
        }

        // -----------------------------------------------------------------
        // Corp IT License Governance
        // -----------------------------------------------------------------

        if (path === '/api/licenses' && method === 'GET') {
            sendJSON(res, 200, { licenses: licenseStore.getAllLicenses(), summary: licenseStore.getLicenseSummary() });
            return;
        }

        if (path.match(/^\/api\/licenses\/[^/]+$/) && method === 'GET') {
            const toolId = path.split('/').pop()!;
            const license = licenseStore.getLicenseByTool(toolId);
            if (!license) { sendJSON(res, 404, { error: 'License not found' }); return; }
            sendJSON(res, 200, { license });
            return;
        }

        // -----------------------------------------------------------------
        // Skill Marketplace + Skill Builder
        // -----------------------------------------------------------------

        if (path === '/api/marketplace/skills' && method === 'GET') {
            const personaId = url.searchParams.get('persona') ?? undefined;
            const visibility = url.searchParams.get('visibility') as 'private' | 'team' | 'company' | 'public' | undefined;
            const skills = skillMarketplace.getAllSkills(personaId, visibility);
            sendJSON(res, 200, { skills, total: skills.length });
            return;
        }

        if (path === '/api/marketplace/skills/search' && method === 'GET') {
            const q = url.searchParams.get('q') ?? '';
            const results = skillMarketplace.searchSkills(q);
            sendJSON(res, 200, { skills: results, total: results.length });
            return;
        }

        if (path.match(/^\/api\/marketplace\/skills\/[^/]+$/) && method === 'GET') {
            const skillId = path.split('/').pop()!;
            const skill = skillMarketplace.getSkill(skillId) ?? skillMarketplace.getSkillBySlug(skillId);
            if (!skill) { sendJSON(res, 404, { error: 'Skill not found' }); return; }
            sendJSON(res, 200, { skill });
            return;
        }

        if (path === '/api/marketplace/skills' && method === 'POST') {
            const body = await readBody(req);
            const skill = skillMarketplace.createSkill(body as Parameters<typeof skillMarketplace.createSkill>[0]);
            sendJSON(res, 201, { skill });
            return;
        }

        if (path.match(/^\/api\/marketplace\/skills\/[^/]+$/) && method === 'PATCH') {
            const skillId = path.split('/').pop()!;
            const body = await readBody(req);
            const skill = skillMarketplace.updateSkill(skillId, body);
            if (!skill) { sendJSON(res, 404, { error: 'Skill not found' }); return; }
            sendJSON(res, 200, { skill });
            return;
        }

        if (path.match(/^\/api\/marketplace\/skills\/[^/]+\/run$/) && method === 'POST') {
            const skillId = path.split('/')[4];
            const skill = skillMarketplace.getSkill(skillId);
            if (!skill) { sendJSON(res, 404, { error: 'Skill not found' }); return; }
            const body = await readBody(req);
            const { inputs, simulate } = body as { inputs?: Record<string, unknown>; simulate?: boolean };

            if (simulate) {
                const sim = simulateSkillExecution(skill);
                sendJSON(res, 200, {
                    status: 'complete',
                    mode: 'simulation',
                    skillId,
                    executionId: `sim-${Date.now()}`,
                    runtimeSec: sim.runtimeSec,
                    cost: 0,
                    outputs: sim.outputs,
                    steps: sim.steps,
                });
                return;
            }

            const runtimeSec = 30 + Math.floor(Math.random() * 60);
            const cost = 0.15 + Math.random() * 0.5;
            skillMarketplace.recordExecution(skillId, userId, true, runtimeSec, cost);
            memoryGraph.recordExecution({
                userId,
                skillId,
                skillName: skill.name,
                personaId: skill.personaId,
                success: true,
                runtimeSec,
                cost,
                agentsUsed: skill.agents.map(a => a.name),
                toolsUsed: skill.requiredTools.map(t => t.name),
                outputs: skill.outputs,
            });
            sendJSON(res, 200, {
                status: 'complete',
                skillId,
                executionId: `exec-${Date.now()}`,
                runtimeSec,
                cost,
                outputs: skill.outputs.map(o => ({ name: o, status: 'generated' })),
            });
            return;
        }

        if (path === '/api/marketplace/templates' && method === 'GET') {
            sendJSON(res, 200, { templates: skillMarketplace.getTemplates() });
            return;
        }

        if (path.match(/^\/api\/marketplace\/templates\/[^/]+$/) && method === 'GET') {
            const templateId = path.split('/').pop()!;
            const template = skillMarketplace.getTemplate(templateId);
            if (!template) { sendJSON(res, 404, { error: 'Template not found' }); return; }
            sendJSON(res, 200, { template });
            return;
        }

        if (path === '/api/marketplace/analytics' && method === 'GET') {
            const skillId = url.searchParams.get('skillId') ?? undefined;
            const analytics = skillMarketplace.getAnalytics(skillId);
            sendJSON(res, 200, { analytics });
            return;
        }

        if (path === '/api/marketplace/governance' && method === 'GET') {
            const records = skillMarketplace.getGovernanceView();
            sendJSON(res, 200, { skills: records });
            return;
        }

        if (path.match(/^\/api\/marketplace\/skills\/[^/]+\/enable$/) && method === 'POST') {
            const skillId = path.split('/')[4];
            const body = await readBody(req);
            const enabled = (body.enabled as boolean) ?? true;
            const ok = skillMarketplace.setSkillEnabled(skillId, enabled);
            if (!ok) { sendJSON(res, 404, { error: 'Skill not found' }); return; }
            sendJSON(res, 200, { skillId, enabled });
            return;
        }

        // -----------------------------------------------------------------
        // Universal Intent Engine
        // -----------------------------------------------------------------

        if (path === '/api/intent/route' && method === 'POST') {
            const body = await readBody(req);
            const query = (body.query as string) ?? '';
            const result = intentEngine.routeIntent(query);
            if (!result) { sendJSON(res, 200, { found: false, message: 'No matching skill found' }); return; }
            sendJSON(res, 200, { found: true, result });
            return;
        }

        if (path === '/api/intent/suggestions' && method === 'GET') {
            const personaId = url.searchParams.get('persona') ?? undefined;
            const limit = parseInt(url.searchParams.get('limit') ?? '8', 10);
            const suggestions = intentEngine.getSuggestions(personaId, limit);
            sendJSON(res, 200, { suggestions });
            return;
        }

        // -----------------------------------------------------------------
        // Memory Graph + Community Feedback
        // -----------------------------------------------------------------

        if (path === '/api/memory/recommendations' && method === 'GET') {
            const personaId = url.searchParams.get('persona') ?? undefined;
            const limit = parseInt(url.searchParams.get('limit') ?? '6', 10);
            const recs = memoryGraph.getRecommendations(userId, personaId, limit);
            sendJSON(res, 200, { recommendations: recs });
            return;
        }

        if (path === '/api/memory/executions' && method === 'GET') {
            const skillId = url.searchParams.get('skillId') ?? undefined;
            const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
            const execs = memoryGraph.getExecutions(userId, skillId, limit);
            sendJSON(res, 200, { executions: execs });
            return;
        }

        if (path === '/api/memory/stats' && method === 'GET') {
            sendJSON(res, 200, memoryGraph.getStats());
            return;
        }

        if (path.match(/^\/api\/marketplace\/skills\/[^/]+\/vote$/) && method === 'POST') {
            const skillId = path.split('/')[4];
            const skill = skillMarketplace.getSkill(skillId);
            if (!skill) { sendJSON(res, 404, { error: 'Skill not found' }); return; }
            const body = await readBody(req);
            const vote = (body.vote as 'up' | 'down') ?? 'up';
            const userName = (body.userName as string) ?? 'User';
            const f = memoryGraph.addFeedback(skillId, userId, vote, userName);
            const votes = memoryGraph.getSkillVotes(skillId);
            sendJSON(res, 200, { feedback: f, votes: { up: votes.up, down: votes.down } });
            return;
        }

        if (path.match(/^\/api\/marketplace\/skills\/[^/]+\/votes$/) && method === 'GET') {
            const skillId = path.split('/')[4];
            const votes = memoryGraph.getSkillVotes(skillId);
            sendJSON(res, 200, { votes: { up: votes.up, down: votes.down } });
            return;
        }

        if (path.match(/^\/api\/marketplace\/skills\/[^/]+\/comments$/) && method === 'GET') {
            const skillId = path.split('/')[4];
            const comments = memoryGraph.getComments(skillId);
            sendJSON(res, 200, { comments });
            return;
        }

        if (path.match(/^\/api\/marketplace\/skills\/[^/]+\/comments$/) && method === 'POST') {
            const skillId = path.split('/')[4];
            const skill = skillMarketplace.getSkill(skillId);
            if (!skill) { sendJSON(res, 404, { error: 'Skill not found' }); return; }
            const body = await readBody(req);
            const content = (body.content as string) ?? '';
            if (!content.trim()) { sendJSON(res, 400, { error: 'Comment content required' }); return; }
            const userName = (body.userName as string) ?? 'User';
            const parentId = body.parentId as string | undefined;
            const comment = memoryGraph.addComment(skillId, userId, userName, content.trim(), parentId);
            sendJSON(res, 201, { comment });
            return;
        }

        // -----------------------------------------------------------------
        // Extensible Tool Registry
        // -----------------------------------------------------------------

        if (path === '/api/tools/registry' && method === 'GET') {
            const category = url.searchParams.get('category') ?? undefined;
            const capability = url.searchParams.get('capability') ?? undefined;
            let tools = toolRegistry.getAll();
            if (category) tools = tools.filter(t => t.category === category);
            if (capability) tools = tools.filter(t => t.capabilities.includes(capability));
            sendJSON(res, 200, { tools, total: tools.length });
            return;
        }

        if (path === '/api/tools/registry' && method === 'POST') {
            const body = await readBody(req);
            const { id, name, capabilities, authType, category, description, icon } = body as Record<string, string>;
            if (!id || !name || !capabilities || !authType || !category) {
                sendJSON(res, 400, { error: 'Missing required fields: id, name, capabilities, authType, category' });
                return;
            }
            const tool = toolRegistry.register({
                id,
                name,
                capabilities: Array.isArray(capabilities) ? capabilities : [capabilities],
                authType: authType as 'oauth' | 'api_key' | 'mcp',
                category,
                description,
                icon,
                registeredBy: userId,
            });
            sendJSON(res, 201, { tool });
            return;
        }

        if (path.match(/^\/api\/tools\/registry\/[^/]+$/) && method === 'DELETE') {
            const toolId = path.split('/').pop()!;
            const ok = toolRegistry.unregister(toolId);
            if (!ok) { sendJSON(res, 404, { error: 'Tool not found' }); return; }
            sendJSON(res, 200, { deleted: toolId });
            return;
        }

        // -----------------------------------------------------------------
        // Execution Scheduler
        // -----------------------------------------------------------------

        if (path === '/api/scheduler/jobs' && method === 'GET') {
            const status = url.searchParams.get('status') ?? undefined;
            const persona = url.searchParams.get('persona') ?? undefined;
            const tag = url.searchParams.get('tag') ?? undefined;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const jobs = scheduler.getAllJobs({ status: status as any, persona, tag });
            sendJSON(res, 200, { jobs, total: jobs.length, stats: scheduler.getStats() });
            return;
        }

        if (path === '/api/scheduler/jobs' && method === 'POST') {
            const body = await readBody(req);
            const { name, skillId, skillName, personaId, scheduleType, cronExpression, intervalMs, eventTrigger, oneTimeAt, timeout, retries, tags, inputs } = body as Record<string, unknown>;
            if (!name || !skillId || !scheduleType) {
                sendJSON(res, 400, { error: 'Missing required fields: name, skillId, scheduleType' });
                return;
            }
            const job = scheduler.createJob({
                name: name as string,
                skillId: skillId as string,
                skillName: (skillName as string) || (skillId as string),
                personaId: (personaId as string) || 'general',
                scheduleType: scheduleType as Parameters<typeof scheduler.createJob>[0]['scheduleType'],
                cronExpression: cronExpression as string | undefined,
                intervalMs: intervalMs as number | undefined,
                eventTrigger: eventTrigger as string | undefined,
                oneTimeAt: oneTimeAt as string | undefined,
                timeout: timeout as number | undefined,
                retries: retries as number | undefined,
                tags: (tags as string[]) || [],
                inputs: inputs as Record<string, unknown> | undefined,
                status: 'active',
                createdBy: userId,
            });
            sendJSON(res, 201, { job });
            return;
        }

        if (path.match(/^\/api\/scheduler\/jobs\/[^/]+$/) && method === 'GET') {
            const jobId = path.split('/').pop()!;
            const job = scheduler.getJob(jobId);
            if (!job) { sendJSON(res, 404, { error: 'Job not found' }); return; }
            const logs = scheduler.getJobLogs(jobId);
            sendJSON(res, 200, { job, logs });
            return;
        }

        if (path.match(/^\/api\/scheduler\/jobs\/[^/]+$/) && method === 'PATCH') {
            const jobId = path.split('/').pop()!;
            const body = await readBody(req);
            const job = scheduler.updateJob(jobId, body as Parameters<typeof scheduler.updateJob>[1]);
            if (!job) { sendJSON(res, 404, { error: 'Job not found' }); return; }
            sendJSON(res, 200, { job });
            return;
        }

        if (path.match(/^\/api\/scheduler\/jobs\/[^/]+$/) && method === 'DELETE') {
            const jobId = path.split('/').pop()!;
            const ok = scheduler.deleteJob(jobId);
            if (!ok) { sendJSON(res, 404, { error: 'Job not found' }); return; }
            sendJSON(res, 200, { deleted: jobId });
            return;
        }

        if (path.match(/^\/api\/scheduler\/jobs\/[^/]+\/run$/) && method === 'POST') {
            const jobId = path.split('/')[4];
            const job = scheduler.getJob(jobId);
            if (!job) { sendJSON(res, 404, { error: 'Job not found' }); return; }
            const log = await scheduler.executeJob(jobId, 'manual');
            sendJSON(res, 200, { log, job: scheduler.getJob(jobId) });
            return;
        }

        if (path.match(/^\/api\/scheduler\/jobs\/[^/]+\/toggle$/) && method === 'POST') {
            const jobId = path.split('/')[4];
            const job = scheduler.getJob(jobId);
            if (!job) { sendJSON(res, 404, { error: 'Job not found' }); return; }
            const newStatus = job.status === 'active' ? 'paused' : 'active';
            const updated = scheduler.updateJob(jobId, { status: newStatus });
            sendJSON(res, 200, { job: updated });
            return;
        }

        if (path === '/api/scheduler/events' && method === 'POST') {
            const body = await readBody(req);
            const { trigger, data, source } = body as Record<string, unknown>;
            if (!trigger) { sendJSON(res, 400, { error: 'Missing trigger field' }); return; }
            const triggered = scheduler.dispatchEvent({
                trigger: trigger as string,
                data: (data as Record<string, unknown>) ?? {},
                source: (source as string) || 'api',
                timestamp: new Date().toISOString(),
            });
            sendJSON(res, 200, { triggered, count: triggered.length });
            return;
        }

        if (path === '/api/scheduler/stats' && method === 'GET') {
            sendJSON(res, 200, scheduler.getStats());
            return;
        }

        // -----------------------------------------------------------------
        // Blog API
        // -----------------------------------------------------------------

        if (path === '/api/blog/posts' && method === 'GET') {
            const status = url.searchParams.get('status') ?? undefined;
            const tag = url.searchParams.get('tag') ?? undefined;
            const authorId = url.searchParams.get('authorId') ?? undefined;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const posts = blogStore.getAllPosts({ status: status as any, tag, authorId });
            sendJSON(res, 200, { posts, total: posts.length, stats: blogStore.getStats() });
            return;
        }

        if (path === '/api/blog/posts' && method === 'POST') {
            const body = await readBody(req);
            const { title, content, contentHtml, excerpt, tags } = body as Record<string, unknown>;
            if (!title) { sendJSON(res, 400, { error: 'Missing title' }); return; }
            const post = blogStore.createPost({
                title: title as string,
                content: content as string | undefined,
                contentHtml: contentHtml as string | undefined,
                excerpt: excerpt as string | undefined,
                authorId: userId,
                authorName: (body.authorName as string) || 'User',
                tags: (tags as string[]) || [],
            });
            sendJSON(res, 201, { post });
            return;
        }

        if (path.match(/^\/api\/blog\/posts\/[^/]+$/) && method === 'GET') {
            const idOrSlug = path.split('/').pop()!;
            const found = blogStore.getPost(idOrSlug) ?? blogStore.getPostBySlug(idOrSlug);
            if (!found) { sendJSON(res, 404, { error: 'Post not found' }); return; }
            blogStore.incrementViews(found.id);
            const post = blogStore.getPost(found.id)!;
            sendJSON(res, 200, { post });
            return;
        }

        if (path.match(/^\/api\/blog\/posts\/[^/]+$/) && method === 'PATCH') {
            const id = path.split('/').pop()!;
            const body = await readBody(req);
            const post = blogStore.updatePost(id, body as Parameters<typeof blogStore.updatePost>[1]);
            if (!post) { sendJSON(res, 404, { error: 'Post not found' }); return; }
            sendJSON(res, 200, { post });
            return;
        }

        if (path.match(/^\/api\/blog\/posts\/[^/]+$/) && method === 'DELETE') {
            const id = path.split('/').pop()!;
            const ok = blogStore.deletePost(id);
            if (!ok) { sendJSON(res, 404, { error: 'Post not found' }); return; }
            sendJSON(res, 200, { deleted: id });
            return;
        }

        if (path.match(/^\/api\/blog\/posts\/[^/]+\/publish$/) && method === 'POST') {
            const postId = path.split('/')[4];
            const body = await readBody(req);
            const destinations = (body.destinations as string[]) || ['internal'];
            const result = await blogStore.publishPost({ postId, destinations });
            sendJSON(res, 200, result);
            return;
        }

        if (path.match(/^\/api\/blog\/posts\/[^/]+\/like$/) && method === 'POST') {
            const id = path.split('/')[4];
            const post = blogStore.toggleLike(id);
            if (!post) { sendJSON(res, 404, { error: 'Post not found' }); return; }
            sendJSON(res, 200, { post });
            return;
        }

        if (path === '/api/blog/stats' && method === 'GET') {
            sendJSON(res, 200, blogStore.getStats());
            return;
        }

        // -----------------------------------------------------------------
        // Forum / Discussion API
        // -----------------------------------------------------------------

        if (path === '/api/forum/threads' && method === 'GET') {
            const category = url.searchParams.get('category') ?? undefined;
            const tag = url.searchParams.get('tag') ?? undefined;
            const q = url.searchParams.get('q') ?? undefined;
            const sort = (url.searchParams.get('sort') ?? 'hot') as 'hot' | 'new' | 'top';
            const status = url.searchParams.get('status') ?? undefined;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const threads = forumStore.getAllThreads({ category, tag, q, sort, status: status as any });
            sendJSON(res, 200, { threads, total: threads.length, stats: forumStore.getStats() });
            return;
        }

        if (path === '/api/forum/threads' && method === 'POST') {
            const body = await readBody(req);
            const { title, body: postBody, category, tags } = body as Record<string, unknown>;
            if (!title || !postBody) { sendJSON(res, 400, { error: 'Missing title or body' }); return; }
            const thread = forumStore.createThread({
                title: title as string,
                body: postBody as string,
                category: (category as string) || 'general',
                tags: (tags as string[]) || [],
                authorId: userId,
                authorName: (body.authorName as string) || 'User',
            });
            sendJSON(res, 201, { thread });
            return;
        }

        if (path.match(/^\/api\/forum\/threads\/[^/]+$/) && method === 'GET') {
            const threadId = path.split('/').pop()!;
            if (!forumStore.getThread(threadId)) { sendJSON(res, 404, { error: 'Thread not found' }); return; }
            forumStore.incrementView(threadId);
            const thread = forumStore.getThread(threadId)!;
            const comments = forumStore.getComments(threadId);
            const userVote = forumStore.getUserVoteOnThread(userId, threadId);
            sendJSON(res, 200, { thread, comments, userVote });
            return;
        }

        if (path.match(/^\/api\/forum\/threads\/[^/]+\/vote$/) && method === 'POST') {
            const threadId = path.split('/')[4];
            const body = await readBody(req);
            const vote = (body.vote as 'up' | 'down' | 'none') ?? 'up';
            const thread = forumStore.voteThread(userId, threadId, vote);
            if (!thread) { sendJSON(res, 404, { error: 'Thread not found' }); return; }
            sendJSON(res, 200, { thread });
            return;
        }

        if (path.match(/^\/api\/forum\/threads\/[^/]+\/comments$/) && method === 'GET') {
            const threadId = path.split('/')[4];
            const comments = forumStore.getComments(threadId);
            sendJSON(res, 200, { comments, total: comments.length });
            return;
        }

        if (path.match(/^\/api\/forum\/threads\/[^/]+\/comments$/) && method === 'POST') {
            const threadId = path.split('/')[4];
            const body = await readBody(req);
            const { body: commentBody, parentId } = body as Record<string, unknown>;
            if (!commentBody) { sendJSON(res, 400, { error: 'Missing body' }); return; }
            try {
                const comment = forumStore.addComment({
                    threadId,
                    parentId: parentId as string | undefined,
                    authorId: userId,
                    authorName: (body.authorName as string) || 'User',
                    body: commentBody as string,
                });
                sendJSON(res, 201, { comment });
            } catch (e) {
                sendJSON(res, 404, { error: (e as Error).message });
            }
            return;
        }

        if (path.match(/^\/api\/forum\/comments\/[^/]+\/vote$/) && method === 'POST') {
            const commentId = path.split('/')[4];
            const body = await readBody(req);
            const vote = (body.vote as 'up' | 'none') ?? 'up';
            const comment = forumStore.voteComment(userId, commentId, vote);
            if (!comment) { sendJSON(res, 404, { error: 'Comment not found' }); return; }
            sendJSON(res, 200, { comment });
            return;
        }

        if (path.match(/^\/api\/forum\/threads\/[^/]+\/accept\/[^/]+$/) && method === 'POST') {
            const parts = path.split('/');
            const threadId = parts[4];
            const commentId = parts[6];
            const thread = forumStore.acceptComment(threadId, commentId);
            if (!thread) { sendJSON(res, 404, { error: 'Thread or comment not found' }); return; }
            sendJSON(res, 200, { thread });
            return;
        }

        if (path === '/api/forum/stats' && method === 'GET') {
            sendJSON(res, 200, forumStore.getStats());
            return;
        }

        // -----------------------------------------------------------------
        // Platform Observability
        // -----------------------------------------------------------------

        if (path === '/api/observability/executions' && method === 'GET') {
            const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
            const persona = url.searchParams.get('persona') ?? undefined;
            const executions = memoryGraph.getExecutions(userId, undefined, limit);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const filtered = persona ? executions.filter((e: any) => e.personaId === persona) : executions;
            sendJSON(res, 200, { executions: filtered, total: filtered.length });
            return;
        }

        if (path === '/api/observability/agents' && method === 'GET') {
            // Real agent data from KPI store + registry
            const kpis = getAgentKPIs();
            const stats = getExecutionStats();
            const activeSet = new Set(stats.activeAgents);
            const agents = kpis.map(k => {
                const identity = getAgentIdentity(k.agentId);
                return {
                    id: k.agentId,
                    name: identity?.callSign ?? k.callSign,
                    persona: identity?.persona ?? 'unknown',
                    model: identity?.preferredModel ?? 'claude-sonnet-4-6',
                    status: activeSet.has(k.agentId) ? 'active' : 'idle',
                    tokensUsed: Math.round(k.avgTokenCost * k.totalExecutions * 1_000_000),
                    lastAction: `Last executed: ${k.lastExecutedAt}`,
                    successRate: k.handoffSuccessRate / 100,
                    startedAt: k.lastExecutedAt,
                    totalExecutions: k.totalExecutions,
                    avgQualityScore: Math.round(k.avgQualityScore * 10) / 10,
                    avgLatencyMs: Math.round(k.avgLatencyMs),
                };
            });
            const active = agents.filter(a => a.status === 'active').length;
            sendJSON(res, 200, { agents, total: agents.length, active, idle: agents.length - active });
            return;
        }

        if (path === '/api/observability/metrics' && method === 'GET') {
            const execStats = getExecutionStats();
            const kpis = getAgentKPIs();
            sendJSON(res, 200, {
                gateway: { status: 'healthy', uptime: process.uptime(), memoryMb: Math.round(process.memoryUsage().heapUsed / 1_000_000 * 100) / 100, wsClients: getWSClientCount() },
                executions: { total: execStats.totalExecutions, byPersona: execStats.byPersona, totalCost: Math.round(execStats.totalCost * 10000) / 10000, avgQuality: Math.round(execStats.avgQuality * 10) / 10 },
                agents: { total: kpis.length, active: execStats.activeAgents.length, avgQualityScore: kpis.length ? Math.round(kpis.reduce((s, k) => s + k.avgQualityScore, 0) / kpis.length * 10) / 10 : 0 },
                scheduler: scheduler.getStats(),
                blog: blogStore.getStats(),
                forum: forumStore.getStats(),
                memory: memoryGraph.getStats(),
                llm: { defaultProvider: getDefaultProvider(), availableProviders: getAvailableProviders().filter(p => p.available).map(p => p.id) },
            });
            return;
        }

        // -----------------------------------------------------------------------
        // ACP Executions
        // -----------------------------------------------------------------------
        if (path === '/api/acp/executions' && method === 'GET') {
            // Real execution data — show recent executions with agent flow
            const allExecs = getAllExecutions()
              .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
              .slice(0, 10);

            const executions = allExecs.map(exec => {
              const agentSet = new Map<string, { id: string; name: string; persona: string; model: string }>();
              const messages: Array<{ id: string; from: string; to: string; type: string; label: string; timestamp: string; status: string }> = [];

              for (let i = 0; i < exec.steps.length; i++) {
                const step = exec.steps[i];
                const identity = getAgentIdentity(step.agent);
                agentSet.set(step.agent, {
                  id: step.agent,
                  name: identity?.callSign ?? step.agent,
                  persona: identity?.persona ?? exec.persona,
                  model: identity?.preferredModel ?? 'claude-sonnet-4-6',
                });
                if (i < exec.steps.length - 1) {
                  const next = exec.steps[i + 1];
                  messages.push({
                    id: `m-${exec.id}-${i}`,
                    from: step.agent,
                    to: next.agent,
                    type: step.handoffValid === false ? 'handoff_warning' : 'result_handoff',
                    label: step.stepName,
                    timestamp: step.completedAt ?? step.startedAt ?? exec.startedAt,
                    status: step.status === 'completed' ? 'delivered' : 'in_flight',
                  });
                }
              }

              return {
                id: exec.id,
                name: exec.skillName,
                persona: exec.persona.charAt(0).toUpperCase() + exec.persona.slice(1),
                skill: exec.skillName,
                status: exec.status,
                startedAt: exec.startedAt,
                completedAt: exec.completedAt,
                agents: Array.from(agentSet.values()),
                messages,
              };
            });

            sendJSON(res, 200, { executions });
            return;
        }

        // -----------------------------------------------------------------------
        // Governance — Audit Log
        // -----------------------------------------------------------------------
        if (path === '/api/governance/audit' && method === 'GET') {
            const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
            const entries = auditLog.slice(-limit).reverse();
            sendJSON(res, 200, { audit: entries, total: auditLog.length });
            return;
        }

        // -----------------------------------------------------------------------
        // Governance — Cost Attribution
        // -----------------------------------------------------------------------
        if (path === '/api/governance/costs' && method === 'GET') {
            // Real cost attribution from actual execution data
            const execStats = getExecutionStats();
            const now = new Date();
            const period = `${now.toLocaleString('en', { month: 'long' })} ${now.getFullYear()}`;
            const breakdown = Object.entries(execStats.byPersona).map(([persona, data]) => ({
                persona: persona.charAt(0).toUpperCase() + persona.slice(1),
                skillsUsed: data.count,
                estimatedCost: Math.round(data.totalCost * 10000) / 10000,
                avgQuality: Math.round(data.avgQuality * 10) / 10,
            }));
            sendJSON(res, 200, {
                period,
                totalCost: Math.round(execStats.totalCost * 10000) / 10000,
                totalExecutions: execStats.totalExecutions,
                breakdown,
            });
            return;
        }

        // -----------------------------------------------------------------------
        // Marketing Module API (persona-gated)
        // -----------------------------------------------------------------------

        if (path.startsWith('/api/marketing/') && authUser && !requirePersonaAccess(authUser, 'marketing')) {
            sendJSON(res, 403, { error: 'Access denied for persona: marketing' }); return;
        }

        if (path === '/api/marketing/workflows' && method === 'GET') {
            const workflows = marketingApi.getMarketingWorkflows();
            const clusters = marketingApi.getMarketingWorkflowClusters();
            const byCluster = marketingApi.getMarketingWorkflowsByCluster();
            sendJSON(res, 200, { workflows, clusters, byCluster });
            return;
        }

        // GET /api/marketing/skills — marketing workflows in unified skill format
        if (path === '/api/marketing/skills' && method === 'GET') {
            const skills = marketingApi.getMarketingSkills();
            sendJSON(res, 200, { skills });
            return;
        }

        if (path.match(/^\/api\/marketing\/workflows\/[^/]+$/) && method === 'GET') {
            const idOrSlug = path.split('/').pop()!;
            const workflow = marketingApi.getMarketingWorkflow(idOrSlug);
            if (!workflow) { sendJSON(res, 404, { error: 'Workflow not found' }); return; }
            sendJSON(res, 200, { workflow });
            return;
        }

        if (path === '/api/marketing/execute/precheck' && method === 'POST') {
            const body = await readBody(req);
            const { workflowId, simulate } = body as { workflowId: string; simulate?: boolean };
            if (!workflowId) { sendJSON(res, 400, { error: 'Missing workflowId' }); return; }
            const check = marketingApi.preCheckExecution(workflowId, simulate);
            sendJSON(res, 200, check);
            return;
        }

        if (path === '/api/marketing/execute' && method === 'POST') {
            const body = await readBody(req);
            const { workflowId, inputs, simulate, customPrompt, provider, modelId } = body as { workflowId: string; inputs?: Record<string, unknown>; simulate?: boolean; customPrompt?: string; provider?: string; modelId?: string };
            if (!workflowId) { sendJSON(res, 400, { error: 'Missing workflowId' }); return; }
            try {
                const exec = marketingApi.createMarketingExecution(workflowId, inputs ?? {}, userId, simulate === true, customPrompt, provider as any, modelId);
                sendJSON(res, 201, { execution: exec });
            } catch (err) {
                sendJSON(res, 400, { error: (err as Error).message });
            }
            return;
        }

        if (path.match(/^\/api\/marketing\/executions\/[^/]+$/) && method === 'GET') {
            const execId = path.split('/').pop()!;
            const exec = marketingApi.getMarketingExecution(execId);
            if (!exec) { sendJSON(res, 404, { error: 'Execution not found' }); return; }
            sendJSON(res, 200, { execution: exec });
            return;
        }

        if (path.match(/^\/api\/marketing\/executions\/[^/]+\/complete$/) && method === 'POST') {
            const execId = path.split('/')[4];
            const exec = marketingApi.getMarketingExecution(execId);
            if (!exec) { sendJSON(res, 404, { error: 'Execution not found' }); return; }
            memoryGraph.recordExecution({
                userId: exec.userId ?? 'anonymous',
                skillId: exec.workflowId,
                skillName: exec.workflowName,
                personaId: 'marketing',
                success: exec.status === 'completed',
                runtimeSec: exec.completedAt && exec.startedAt ? Math.round((new Date(exec.completedAt).getTime() - new Date(exec.startedAt).getTime()) / 1000) : 0,
                cost: 0,
                agentsUsed: [...new Set(exec.steps.map((s) => s.agent))],
                toolsUsed: [...new Set(exec.steps.map((s) => s.tool).filter(Boolean))] as string[],
                outputs: Object.keys(exec.outputs),
            });
            const updated = marketingApi.updateMarketingExecution(execId, { status: 'completed', completedAt: new Date().toISOString() });
            sendJSON(res, 200, { execution: updated });
            return;
        }

        if (path === '/api/marketing/executions' && method === 'GET') {
            const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
            const execs = marketingApi.getRecentMarketingExecutions(limit);
            sendJSON(res, 200, { executions: execs, total: execs.length });
            return;
        }

        if (path === '/api/marketing/upload' && method === 'POST') {
            const body = await readBody(req);
            const { fileName, contentBase64, mimeType } = body as { fileName?: string; contentBase64?: string; mimeType?: string };
            if (!fileName || !contentBase64) { sendJSON(res, 400, { error: 'Missing fileName or contentBase64' }); return; }
            const content = typeof contentBase64 === 'string' ? Buffer.from(contentBase64, 'base64').toString('utf-8') : '';
            const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            marketingApi.storeUploadedFile(fileId, fileName, content, mimeType ?? 'application/octet-stream');
            sendJSON(res, 201, { fileId, fileName, message: 'File uploaded for agent context' });
            return;
        }

        if (path === '/api/marketing/roles' && method === 'GET') {
            // Derive roles from agent registry ranks
            const registry = getFullRegistry();
            const roles = Object.entries(registry.byRank).map(([rank, count]) => ({
                id: rank,
                name: rank.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                agentCount: count,
                permissions: rank === 'field-marshal' ? ['*'] : rank === 'colonel' ? ['execute', 'approve', 'manage_skills', 'manage_workflows', 'view_analytics'] : rank === 'captain' ? ['execute', 'approve', 'view_analytics'] : ['execute', 'view_analytics'],
            }));
            sendJSON(res, 200, { roles });
            return;
        }

        if (path === '/api/marketing/projects' && method === 'GET') {
            const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
            const projects = getRecentProjects(limit);
            sendJSON(res, 200, { projects, total: projects.length });
            return;
        }

        if (path.match(/^\/api\/marketing\/projects\/[^/]+$/) && !path.includes('/tasks') && method === 'GET') {
            const projectId = path.split('/').pop()!;
            const project = getProject(projectId);
            if (!project) { sendJSON(res, 404, { error: 'Project not found' }); return; }
            sendJSON(res, 200, { project });
            return;
        }

        if (path.match(/^\/api\/marketing\/projects\/[^/]+\/tasks$/) && method === 'GET') {
            const projectId = path.split('/')[4]!;
            const tasks = getProjectTasks(projectId);
            sendJSON(res, 200, { tasks, total: tasks.length });
            return;
        }

        if (path.match(/^\/api\/marketing\/campaign-graph\/[^/]+$/) && method === 'GET') {
            const graphId = path.split('/').pop()!;
            const graph = getCampaignGraph(graphId);
            if (!graph) { sendJSON(res, 404, { error: 'Campaign graph not found' }); return; }
            sendJSON(res, 200, { graph });
            return;
        }

        if (path === '/api/marketing/tools/connections' && method === 'GET') {
            const connections = getMarketingToolConnections();
            sendJSON(res, 200, { connections });
            return;
        }

        if (path.match(/^\/api\/marketing\/tools\/connections\/[^/]+$/) && method === 'GET') {
            const toolId = path.split('/').pop()!;
            const status = getToolConnectionStatus(toolId);
            sendJSON(res, 200, { connection: status });
            return;
        }

        if (path.match(/^\/api\/tools\/[^/]+\/connect$/) && method === 'GET') {
            const toolId = path.split('/')[3]!;
            const flow = getToolConnectFlow(toolId);
            if (shouldRedirectToOAuth(toolId) && flow.oauthUrl) {
                res.writeHead(302, { Location: flow.oauthUrl });
                res.end();
            } else {
                sendJSON(res, 200, {
                    toolId,
                    authType: flow.authType,
                    oauthUrl: flow.oauthUrl,
                    apiKeyPlaceholder: flow.apiKeyPlaceholder,
                    message: flow.authType === 'api_key' ? 'Configure API key in Settings' : 'Set OAuth client ID in env to enable',
                });
            }
            return;
        }

        if (path === '/api/marketing/notifications/config' && method === 'GET') {
            const config = getNotificationConfig();
            sendJSON(res, 200, { config });
            return;
        }

        if (path === '/api/marketing/notifications/config' && method === 'POST') {
            const body = await readBody(req);
            setNotificationConfig(body as Parameters<typeof setNotificationConfig>[0]);
            sendJSON(res, 200, { config: getNotificationConfig() });
            return;
        }

        // -----------------------------------------------------------------------
        // Notification Dispatch — channels, rules, delivery log

        // Channels CRUD
        if (path === '/api/notifications/channels' && method === 'GET') {
            sendJSON(res, 200, { channels: listChannels() });
            return;
        }
        if (path === '/api/notifications/channels' && method === 'POST') {
            const body = await readBody(req) as { channel: string; name: string; config: unknown };
            const ch = createChannel(body.channel as Parameters<typeof createChannel>[0], body.name, body.config as Parameters<typeof createChannel>[2]);
            recordAudit(userId, 'notification.channel.create', ch.id);
            sendJSON(res, 201, ch);
            return;
        }
        if (path.match(/^\/api\/notifications\/channels\/[^/]+$/) && method === 'GET') {
            const id = path.split('/')[4]!;
            const ch = getChannel(id);
            if (!ch) { sendJSON(res, 404, { error: 'Channel not found' }); return; }
            sendJSON(res, 200, ch);
            return;
        }
        if (path.match(/^\/api\/notifications\/channels\/[^/]+$/) && method === 'PUT') {
            const id = path.split('/')[4]!;
            const body = await readBody(req);
            const ch = updateChannel(id, body as Parameters<typeof updateChannel>[1]);
            if (!ch) { sendJSON(res, 404, { error: 'Channel not found' }); return; }
            recordAudit(userId, 'notification.channel.update', id);
            sendJSON(res, 200, ch);
            return;
        }
        if (path.match(/^\/api\/notifications\/channels\/[^/]+$/) && method === 'DELETE') {
            const id = path.split('/')[4]!;
            const ok = deleteChannel(id);
            if (!ok) { sendJSON(res, 404, { error: 'Channel not found' }); return; }
            recordAudit(userId, 'notification.channel.delete', id);
            sendJSON(res, 204, null);
            return;
        }

        // Rules CRUD
        if (path === '/api/notifications/rules' && method === 'GET') {
            sendJSON(res, 200, { rules: listRules() });
            return;
        }
        if (path === '/api/notifications/rules' && method === 'POST') {
            const body = await readBody(req) as { name: string; trigger: string; channelId: string; eventPattern?: string; template?: string; recipientOverride?: string };
            const rule = createRule(body.name, body.trigger as Parameters<typeof createRule>[1], body.channelId, { eventPattern: body.eventPattern, template: body.template, recipientOverride: body.recipientOverride });
            recordAudit(userId, 'notification.rule.create', rule.id);
            sendJSON(res, 201, rule);
            return;
        }
        if (path.match(/^\/api\/notifications\/rules\/[^/]+$/) && method === 'GET') {
            const id = path.split('/')[4]!;
            const rule = getRule(id);
            if (!rule) { sendJSON(res, 404, { error: 'Rule not found' }); return; }
            sendJSON(res, 200, rule);
            return;
        }
        if (path.match(/^\/api\/notifications\/rules\/[^/]+$/) && method === 'PUT') {
            const id = path.split('/')[4]!;
            const body = await readBody(req);
            const rule = updateRule(id, body as Parameters<typeof updateRule>[1]);
            if (!rule) { sendJSON(res, 404, { error: 'Rule not found' }); return; }
            recordAudit(userId, 'notification.rule.update', id);
            sendJSON(res, 200, rule);
            return;
        }
        if (path.match(/^\/api\/notifications\/rules\/[^/]+$/) && method === 'DELETE') {
            const id = path.split('/')[4]!;
            const ok = deleteRule(id);
            if (!ok) { sendJSON(res, 404, { error: 'Rule not found' }); return; }
            recordAudit(userId, 'notification.rule.delete', id);
            sendJSON(res, 204, null);
            return;
        }

        // Manual dispatch
        if (path === '/api/notifications/dispatch' && method === 'POST') {
            const body = await readBody(req) as { channelId: string; subject: string; body: string; recipient: string; metadata?: Record<string, unknown> };
            const result = await dispatch(body.channelId, body.subject, body.body, body.recipient, { metadata: body.metadata });
            sendJSON(res, 200, result);
            return;
        }

        // Delivery log
        if (path === '/api/notifications/deliveries/stats' && method === 'GET') {
            sendJSON(res, 200, getDeliveryStats());
            return;
        }
        if (path === '/api/notifications/deliveries' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const channelId = u.searchParams.get('channelId') ?? undefined;
            const limit = parseInt(u.searchParams.get('limit') ?? '50', 10);
            sendJSON(res, 200, { deliveries: getDeliveryLog(limit, channelId) });
            return;
        }
        if (path.match(/^\/api\/notifications\/deliveries\/[^/]+$/) && method === 'GET') {
            const id = path.split('/')[4]!;
            const d = getDelivery(id);
            if (!d) { sendJSON(res, 404, { error: 'Delivery not found' }); return; }
            sendJSON(res, 200, d);
            return;
        }

        // -----------------------------------------------------------------------
        // Webhook Connector — endpoints, subscriptions, inbound receiver

        // Endpoints CRUD
        if (path === '/api/webhooks/endpoints' && method === 'GET') {
            sendJSON(res, 200, { endpoints: listEndpoints() });
            return;
        }
        if (path === '/api/webhooks/endpoints' && method === 'POST') {
            const body = await readBody(req) as { name: string; source: string; eventPrefix?: string };
            const ep = createEndpoint(body.name, body.source, body.eventPrefix);
            recordAudit(userId, 'webhook.endpoint.create', ep.id);
            sendJSON(res, 201, ep);
            return;
        }
        if (path.match(/^\/api\/webhooks\/endpoints\/[^/]+$/) && method === 'GET') {
            const id = path.split('/')[4]!;
            const ep = getEndpoint(id);
            if (!ep) { sendJSON(res, 404, { error: 'Endpoint not found' }); return; }
            sendJSON(res, 200, ep);
            return;
        }
        if (path.match(/^\/api\/webhooks\/endpoints\/[^/]+$/) && method === 'DELETE') {
            const id = path.split('/')[4]!;
            const ok = deleteEndpoint(id);
            if (!ok) { sendJSON(res, 404, { error: 'Endpoint not found' }); return; }
            recordAudit(userId, 'webhook.endpoint.delete', id);
            sendJSON(res, 204, null);
            return;
        }

        // Subscriptions CRUD
        if (path === '/api/webhooks/subscriptions' && method === 'GET') {
            sendJSON(res, 200, { subscriptions: listSubscriptions() });
            return;
        }
        if (path === '/api/webhooks/subscriptions' && method === 'POST') {
            const body = await readBody(req) as { name: string; eventPattern: string; targetUrl: string; headers?: Record<string, string> };
            const sub = createSubscription(body.name, body.eventPattern, body.targetUrl, { headers: body.headers });
            recordAudit(userId, 'webhook.subscription.create', sub.id);
            sendJSON(res, 201, sub);
            return;
        }
        if (path.match(/^\/api\/webhooks\/subscriptions\/[^/]+$/) && method === 'GET') {
            const id = path.split('/')[4]!;
            const sub = getSubscription(id);
            if (!sub) { sendJSON(res, 404, { error: 'Subscription not found' }); return; }
            sendJSON(res, 200, sub);
            return;
        }
        if (path.match(/^\/api\/webhooks\/subscriptions\/[^/]+$/) && method === 'DELETE') {
            const id = path.split('/')[4]!;
            const ok = deleteSubscription(id);
            if (!ok) { sendJSON(res, 404, { error: 'Subscription not found' }); return; }
            recordAudit(userId, 'webhook.subscription.delete', id);
            sendJSON(res, 204, null);
            return;
        }

        // Inbound webhook receiver (no auth — uses HMAC signature verification)
        if (path.match(/^\/api\/webhooks\/receive\/[^/]+$/) && method === 'POST') {
            const endpointId = path.split('/')[4]!;
            const rawBody = await readBody(req);
            const signature = (req.headers['x-webhook-signature'] ?? req.headers['x-hub-signature-256'] ?? '') as string;
            const result = await receiveWebhook(endpointId, JSON.stringify(rawBody), signature);
            if (!result.accepted) { sendJSON(res, 401, { error: 'Signature verification failed' }); return; }
            sendJSON(res, 200, { accepted: true, eventId: result.eventId });
            return;
        }

        // Inbound event log
        if (path === '/api/webhooks/events' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const endpointId = u.searchParams.get('endpointId') ?? undefined;
            const limit = parseInt(u.searchParams.get('limit') ?? '50', 10);
            sendJSON(res, 200, { events: getInboundLog(endpointId, limit) });
            return;
        }

        // -----------------------------------------------------------------------
        // Innovation Labs — experiments, hackathons, graduation pipeline

        // Experiments CRUD
        if (path === '/api/innovation/experiments' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const status = u.searchParams.get('status') as Parameters<typeof listExperiments>[0] extends undefined ? never : string | undefined;
            const category = u.searchParams.get('category') ?? undefined;
            const hackathonId = u.searchParams.get('hackathonId') ?? undefined;
            sendJSON(res, 200, { experiments: listExperiments({ status: status as any, category: category as any, hackathonId }) });
            return;
        }
        if (path === '/api/innovation/experiments' && method === 'POST') {
            const body = await readBody(req) as Parameters<typeof createExperiment>[0];
            const exp = createExperiment(body);
            recordAudit(userId, 'innovation.experiment.create', exp.id);
            sendJSON(res, 201, exp);
            return;
        }
        if (path.match(/^\/api\/innovation\/experiments\/[^/]+$/) && method === 'GET') {
            const id = path.split('/')[4]!;
            const exp = getExperiment(id);
            if (!exp) { sendJSON(res, 404, { error: 'Experiment not found' }); return; }
            sendJSON(res, 200, exp);
            return;
        }
        if (path.match(/^\/api\/innovation\/experiments\/[^/]+$/) && method === 'PUT') {
            const id = path.split('/')[4]!;
            const body = await readBody(req);
            try {
                const exp = updateExperiment(id, body as Parameters<typeof updateExperiment>[1]);
                recordAudit(userId, 'innovation.experiment.update', id);
                sendJSON(res, 200, exp);
            } catch (e: any) { sendJSON(res, 404, { error: e.message }); }
            return;
        }
        if (path.match(/^\/api\/innovation\/experiments\/[^/]+$/) && method === 'DELETE') {
            const id = path.split('/')[4]!;
            const ok = deleteExperiment(id);
            if (!ok) { sendJSON(res, 404, { error: 'Experiment not found' }); return; }
            recordAudit(userId, 'innovation.experiment.delete', id);
            sendJSON(res, 204, null);
            return;
        }
        // Transition experiment status
        if (path.match(/^\/api\/innovation\/experiments\/[^/]+\/transition$/) && method === 'POST') {
            const id = path.split('/')[4]!;
            const body = await readBody(req) as { status: string };
            try {
                const exp = transitionExperiment(id, body.status as any);
                recordAudit(userId, 'innovation.experiment.transition', id, 'success', body.status);
                sendJSON(res, 200, exp);
            } catch (e: any) { sendJSON(res, 400, { error: e.message }); }
            return;
        }
        // Add result to experiment
        if (path.match(/^\/api\/innovation\/experiments\/[^/]+\/results$/) && method === 'POST') {
            const id = path.split('/')[4]!;
            const body = await readBody(req) as { metric: string; value: number; unit: string; notes?: string };
            try {
                const exp = addExperimentResult(id, body);
                sendJSON(res, 200, exp);
            } catch (e: any) { sendJSON(res, 404, { error: e.message }); }
            return;
        }
        // Score experiment
        if (path.match(/^\/api\/innovation\/experiments\/[^/]+\/score$/) && method === 'POST') {
            const id = path.split('/')[4]!;
            const body = await readBody(req) as { score: number };
            try {
                const exp = scoreExperiment(id, body.score);
                sendJSON(res, 200, exp);
            } catch (e: any) { sendJSON(res, 404, { error: e.message }); }
            return;
        }

        // Hackathons
        if (path === '/api/innovation/hackathons' && method === 'GET') {
            sendJSON(res, 200, { hackathons: listHackathons() });
            return;
        }
        if (path === '/api/innovation/hackathons' && method === 'POST') {
            const body = await readBody(req) as Parameters<typeof createHackathon>[0];
            const h = createHackathon(body);
            recordAudit(userId, 'innovation.hackathon.create', h.id);
            sendJSON(res, 201, h);
            return;
        }
        if (path.match(/^\/api\/innovation\/hackathons\/[^/]+$/) && method === 'GET') {
            const id = path.split('/')[4]!;
            const h = getHackathon(id);
            if (!h) { sendJSON(res, 404, { error: 'Hackathon not found' }); return; }
            sendJSON(res, 200, h);
            return;
        }
        if (path.match(/^\/api\/innovation\/hackathons\/[^/]+\/start$/) && method === 'POST') {
            const id = path.split('/')[4]!;
            try {
                const h = startHackathon(id);
                recordAudit(userId, 'innovation.hackathon.start', id);
                sendJSON(res, 200, h);
            } catch (e: any) { sendJSON(res, 400, { error: e.message }); }
            return;
        }
        if (path.match(/^\/api\/innovation\/hackathons\/[^/]+\/complete$/) && method === 'POST') {
            const id = path.split('/')[4]!;
            try {
                const h = completeHackathon(id);
                recordAudit(userId, 'innovation.hackathon.complete', id);
                sendJSON(res, 200, h);
            } catch (e: any) { sendJSON(res, 400, { error: e.message }); }
            return;
        }
        if (path.match(/^\/api\/innovation\/hackathons\/[^/]+\/experiments$/) && method === 'POST') {
            const hackId = path.split('/')[4]!;
            const body = await readBody(req) as { experimentId: string };
            try {
                const h = addExperimentToHackathon(hackId, body.experimentId);
                sendJSON(res, 200, h);
            } catch (e: any) { sendJSON(res, 400, { error: e.message }); }
            return;
        }

        // Graduations
        if (path === '/api/innovation/graduations' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const status = u.searchParams.get('status') ?? undefined;
            sendJSON(res, 200, { graduations: listGraduations(status as any) });
            return;
        }
        if (path === '/api/innovation/graduations' && method === 'POST') {
            const body = await readBody(req) as Parameters<typeof requestGraduation>[0];
            const g = requestGraduation(body);
            recordAudit(userId, 'innovation.graduation.request', g.id);
            sendJSON(res, 201, g);
            return;
        }
        if (path.match(/^\/api\/innovation\/graduations\/[^/]+\/review$/) && method === 'POST') {
            const id = path.split('/')[4]!;
            const body = await readBody(req) as { decision: 'approved' | 'rejected'; reviewedBy: string; notes?: string };
            try {
                const g = reviewGraduation(id, body.decision, body.reviewedBy, body.notes);
                recordAudit(userId, 'innovation.graduation.review', id, 'success', body.decision);
                sendJSON(res, 200, g);
            } catch (e: any) { sendJSON(res, 400, { error: e.message }); }
            return;
        }

        // Innovation Backlog (C-Suite overview)
        if (path === '/api/innovation/backlog' && method === 'GET') {
            sendJSON(res, 200, getInnovationBacklog());
            return;
        }

        // -----------------------------------------------------------------------
        // Budget Intelligence — budgets, spend tracking, burn rate, alerts

        if (path === '/api/budget/agents' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const regiment = u.searchParams.get('regiment') ?? undefined;
            sendJSON(res, 200, { budgets: listBudgets(regiment) });
            return;
        }
        if (path === '/api/budget/agents' && method === 'POST') {
            const body = await readBody(req) as Parameters<typeof setBudget>[0];
            const b = setBudget(body);
            recordAudit(userId, 'budget.set', b.agentId);
            sendJSON(res, 200, b);
            return;
        }
        if (path.match(/^\/api\/budget\/agents\/[^/]+$/) && method === 'GET') {
            const agentId = path.split('/')[4]!;
            const b = getBudget(agentId);
            if (!b) { sendJSON(res, 404, { error: 'Budget not found' }); return; }
            sendJSON(res, 200, b);
            return;
        }
        if (path.match(/^\/api\/budget\/agents\/[^/]+$/) && method === 'DELETE') {
            const agentId = path.split('/')[4]!;
            const ok = deleteBudget(agentId);
            if (!ok) { sendJSON(res, 404, { error: 'Budget not found' }); return; }
            recordAudit(userId, 'budget.delete', agentId);
            sendJSON(res, 204, null);
            return;
        }
        if (path.match(/^\/api\/budget\/agents\/[^/]+\/burn-rate$/) && method === 'GET') {
            const agentId = path.split('/')[4]!;
            sendJSON(res, 200, getBurnRate(agentId));
            return;
        }

        // Spend log
        if (path === '/api/budget/spend' && method === 'POST') {
            const body = await readBody(req) as Parameters<typeof recordSpend>[0];
            const entry = recordSpend(body);
            sendJSON(res, 201, entry);
            return;
        }
        if (path === '/api/budget/spend' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const agentId = u.searchParams.get('agentId') ?? undefined;
            const limit = parseInt(u.searchParams.get('limit') ?? '100', 10);
            sendJSON(res, 200, { entries: getSpendLog({ agentId, limit }) });
            return;
        }

        // Cost alerts
        if (path === '/api/budget/alerts' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const agentId = u.searchParams.get('agentId') ?? undefined;
            const severity = u.searchParams.get('severity') ?? undefined;
            const ack = u.searchParams.get('acknowledged');
            sendJSON(res, 200, { alerts: listCostAlerts({ agentId, severity: severity as any, acknowledged: ack === null ? undefined : ack === 'true' }) });
            return;
        }
        if (path.match(/^\/api\/budget\/alerts\/[^/]+\/acknowledge$/) && method === 'POST') {
            const id = path.split('/')[4]!;
            const ok = acknowledgeAlert(id);
            if (!ok) { sendJSON(res, 404, { error: 'Alert not found' }); return; }
            sendJSON(res, 200, { success: true });
            return;
        }

        // CFO Dashboard
        if (path === '/api/budget/dashboard' && method === 'GET') {
            sendJSON(res, 200, getCFODashboard());
            return;
        }

        // -----------------------------------------------------------------------
        // Agent Improvement — reviews, plans, feedback, exemplars

        // Performance Reviews
        if (path === '/api/improvement/reviews' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const agentId = u.searchParams.get('agentId') ?? undefined;
            sendJSON(res, 200, { reviews: listReviews(agentId) });
            return;
        }
        if (path === '/api/improvement/reviews' && method === 'POST') {
            const body = await readBody(req) as Parameters<typeof createReview>[0];
            const rev = createReview(body);
            recordAudit(userId, 'improvement.review.create', rev.id);
            sendJSON(res, 201, rev);
            return;
        }
        if (path.match(/^\/api\/improvement\/reviews\/[^/]+$/) && method === 'GET') {
            const id = path.split('/')[4]!;
            const rev = getReview(id);
            if (!rev) { sendJSON(res, 404, { error: 'Review not found' }); return; }
            sendJSON(res, 200, rev);
            return;
        }

        // Improvement Plans
        if (path === '/api/improvement/plans' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const agentId = u.searchParams.get('agentId') ?? undefined;
            const status = u.searchParams.get('status') ?? undefined;
            sendJSON(res, 200, { plans: listPlans(agentId, status as any) });
            return;
        }
        if (path === '/api/improvement/plans' && method === 'POST') {
            const body = await readBody(req) as Parameters<typeof createPlan>[0];
            const plan = createPlan(body);
            recordAudit(userId, 'improvement.plan.create', plan.id);
            sendJSON(res, 201, plan);
            return;
        }
        if (path.match(/^\/api\/improvement\/plans\/[^/]+$/) && method === 'GET') {
            const id = path.split('/')[4]!;
            const plan = getPlan(id);
            if (!plan) { sendJSON(res, 404, { error: 'Plan not found' }); return; }
            sendJSON(res, 200, plan);
            return;
        }
        if (path.match(/^\/api\/improvement\/plans\/[^/]+\/status$/) && method === 'PUT') {
            const id = path.split('/')[4]!;
            const body = await readBody(req) as { status: string };
            try {
                const plan = updatePlanStatus(id, body.status as any);
                recordAudit(userId, 'improvement.plan.status', id, 'success', body.status);
                sendJSON(res, 200, plan);
            } catch (e: any) { sendJSON(res, 404, { error: e.message }); }
            return;
        }
        if (path.match(/^\/api\/improvement\/plans\/[^/]+\/objectives\/[^/]+$/) && method === 'PUT') {
            const parts = path.split('/');
            const planId = parts[4]!;
            const objectiveId = parts[6]!;
            const body = await readBody(req) as { achieved?: boolean; notes?: string };
            try {
                const plan = updateObjective(planId, objectiveId, body);
                sendJSON(res, 200, plan);
            } catch (e: any) { sendJSON(res, 404, { error: e.message }); }
            return;
        }

        // Feedback
        if (path === '/api/improvement/feedback' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const agentId = u.searchParams.get('agentId') ?? undefined;
            const type = u.searchParams.get('type') ?? undefined;
            const limit = parseInt(u.searchParams.get('limit') ?? '100', 10);
            sendJSON(res, 200, { feedback: listFeedback({ agentId, type: type as any, limit }) });
            return;
        }
        if (path === '/api/improvement/feedback' && method === 'POST') {
            const body = await readBody(req) as Parameters<typeof submitFeedback>[0];
            const fb = submitFeedback(body);
            sendJSON(res, 201, fb);
            return;
        }
        if (path.match(/^\/api\/improvement\/feedback\/summary\/[^/]+$/) && method === 'GET') {
            const agentId = path.split('/')[5]!;
            sendJSON(res, 200, getFeedbackSummary(agentId));
            return;
        }

        // Training Exemplars
        if (path === '/api/improvement/exemplars' && method === 'GET') {
            const u = new URL(req.url!, `http://${req.headers.host}`);
            const agentId = u.searchParams.get('agentId') ?? undefined;
            const rating = u.searchParams.get('rating') ?? undefined;
            sendJSON(res, 200, { exemplars: listExemplars({ agentId, rating: rating as any }) });
            return;
        }
        if (path === '/api/improvement/exemplars' && method === 'POST') {
            const body = await readBody(req) as Parameters<typeof addExemplar>[0];
            const ex = addExemplar(body);
            recordAudit(userId, 'improvement.exemplar.add', ex.id);
            sendJSON(res, 201, ex);
            return;
        }
        if (path.match(/^\/api\/improvement\/exemplars\/[^/]+$/) && method === 'DELETE') {
            const id = path.split('/')[4]!;
            const ok = deleteExemplar(id);
            if (!ok) { sendJSON(res, 404, { error: 'Exemplar not found' }); return; }
            sendJSON(res, 204, null);
            return;
        }

        // Agent Health Report (C-Suite overview)
        if (path === '/api/improvement/health' && method === 'GET') {
            sendJSON(res, 200, getAgentHealthReport());
            return;
        }

        // -----------------------------------------------------------------------
        // Tool Connection Management — connect, disconnect, test, catalog

        // GET /api/tools/catalog — full marketing tool catalog
        if (path === '/api/tools/catalog' && method === 'GET') {
            sendJSON(res, 200, { tools: MARKETING_TOOL_CATALOG });
            return;
        }

        // POST /api/tools/:toolId/connect — save credentials and mark connected
        if (path.match(/^\/api\/tools\/[^/]+\/connect$/) && method === 'POST') {
            const toolId = path.split('/')[3]!;
            const body = await readBody(req);
            const { apiKey, accessToken, accountName } = body as { apiKey?: string; accessToken?: string; accountName?: string };
            const result = connectTool(toolId, { apiKey, accessToken, accountName });
            recordAudit(userId, 'tool.connect', toolId, result.success ? 'success' : 'failed');
            if (result.success) {
                const status = getToolConnectionStatus(toolId);
                sendJSON(res, 200, { success: true, message: result.message, connection: status });
            } else {
                sendJSON(res, 400, { success: false, error: result.message });
            }
            return;
        }

        // POST /api/tools/:toolId/disconnect — clear connection
        if (path.match(/^\/api\/tools\/[^/]+\/disconnect$/) && method === 'POST') {
            const toolId = path.split('/')[3]!;
            const result = disconnectTool(toolId);
            recordAudit(userId, 'tool.disconnect', toolId);
            sendJSON(res, 200, { success: result.success, message: result.message });
            return;
        }

        // POST /api/tools/:toolId/test — validate current connection
        if (path.match(/^\/api\/tools\/[^/]+\/test$/) && method === 'POST') {
            const toolId = path.split('/')[3]!;
            const result = testToolConnection(toolId);
            sendJSON(res, result.success ? 200 : 400, result);
            return;
        }

        // GET /api/tools/:toolId/status — single tool status
        if (path.match(/^\/api\/tools\/[^/]+\/status$/) && method === 'GET') {
            const toolId = path.split('/')[3]!;
            const status = getToolConnectionStatus(toolId);
            sendJSON(res, 200, { connection: status });
            return;
        }

        // -----------------------------------------------------------------------
        // Connections API — generic connector state for ConnectionsHub
        // Uses an in-memory map keyed by connectorId

        // GET /api/connections — list all connection states
        if (path === '/api/connections' && method === 'GET') {
            sendJSON(res, 200, { connections: Object.fromEntries(connectionStore) });
            return;
        }

        // POST /api/connections/:connectorId/connect
        if (path.match(/^\/api\/connections\/[^/]+\/connect$/) && method === 'POST') {
            const connectorId = path.split('/')[3]!;
            const body = await readBody(req);
            const { credentials } = body as { credentials: Record<string, string> };
            // Validate: just check at least one non-empty value is present
            const hasValue = credentials && Object.values(credentials).some(v => v && v.trim().length > 0);
            if (!hasValue) {
                sendJSON(res, 400, { status: 'error', error: 'No credentials provided.' });
                return;
            }
            connectionStore.set(connectorId, {
                connectorId,
                status: 'connected',
                connectedAt: new Date().toISOString(),
                credentials,
            });
            sendJSON(res, 200, { status: 'connected', connectorId });
            return;
        }

        // POST /api/connections/:connectorId/disconnect
        if (path.match(/^\/api\/connections\/[^/]+\/disconnect$/) && method === 'POST') {
            const connectorId = path.split('/')[3]!;
            const existing = connectionStore.get(connectorId);
            if (existing) {
                connectionStore.set(connectorId, { connectorId, status: 'not-connected' });
            }
            sendJSON(res, 200, { status: 'not-connected', connectorId });
            return;
        }

        // POST /api/connections/:connectorId/test
        if (path.match(/^\/api\/connections\/[^/]+\/test$/) && method === 'POST') {
            const connectorId = path.split('/')[3]!;
            const state = connectionStore.get(connectorId);
            if (!state || state.status === 'not-connected') {
                sendJSON(res, 400, { ok: false, error: 'Not connected. Add credentials first.' });
                return;
            }
            // Simulate a lightweight test (real validation would call the provider's health endpoint)
            const simulatedOk = Math.random() > 0.05; // 95% pass rate in sim
            if (simulatedOk) {
                connectionStore.set(connectorId, { ...state, status: 'connected', lastTestedAt: new Date().toISOString() });
                sendJSON(res, 200, { ok: true, message: 'Connection validated successfully.' });
            } else {
                connectionStore.set(connectorId, { ...state, status: 'error', error: 'Credentials rejected by provider.' });
                sendJSON(res, 400, { ok: false, error: 'Test failed — credentials may be expired.' });
            }
            return;
        }

        // GET /api/connections/:connectorId/status
        if (path.match(/^\/api\/connections\/[^/]+\/status$/) && method === 'GET') {
            const connectorId = path.split('/')[3]!;
            const state = connectionStore.get(connectorId) ?? { connectorId, status: 'not-connected' };
            sendJSON(res, 200, { connection: state });
            return;
        }

        // -----------------------------------------------------------------------
        // Engineering Persona API (persona-gated)

        if (path.startsWith('/api/engineering/') && authUser && !requirePersonaAccess(authUser, 'engineering')) {
            sendJSON(res, 403, { error: 'Access denied for persona: engineering' }); return;
        }

        // GET /api/engineering/skills — full skill catalog
        if (path === '/api/engineering/skills' && method === 'GET') {
            sendJSON(res, 200, { skills: ENGINEERING_SKILLS, clusters: getEngineeringSkillsByCluster() });
            return;
        }

        // GET /api/engineering/skills/:idOrSlug — single skill
        if (path.match(/^\/api\/engineering\/skills\/[^/]+$/) && method === 'GET') {
            const idOrSlug = path.split('/')[4]!;
            const skill = getEngineeringSkill(idOrSlug);
            if (!skill) { sendJSON(res, 404, { error: 'Skill not found' }); return; }
            sendJSON(res, 200, { skill });
            return;
        }

        // POST /api/engineering/execute — run a skill
        if (path === '/api/engineering/execute' && method === 'POST') {
            const body = await readBody(req);
            const { skillId, inputs, simulate, customPrompt, provider, modelId } = body as { skillId?: string; inputs?: Record<string, unknown>; simulate?: boolean; customPrompt?: string; provider?: string; modelId?: string };
            if (!skillId) { sendJSON(res, 400, { error: 'skillId required' }); return; }
            const skill = getEngineeringSkill(skillId);
            if (!skill) { sendJSON(res, 404, { error: `Skill not found: ${skillId}` }); return; }
            const exec = createPersonaExecution('engineering', skill, inputs ?? {}, undefined, simulate, customPrompt, provider as any, modelId);
            recordAudit(userId, 'skill.execute', `Engineering / ${skill.name}`);
            broadcastEvent(exec.id, 'session.started', { persona: 'engineering', skillId, simulate, provider });
            sendJSON(res, 200, { execution: exec });
            return;
        }

        // GET /api/engineering/executions — list recent executions
        if (path === '/api/engineering/executions' && method === 'GET') {
            const execs = listPersonaExecutions('engineering');
            sendJSON(res, 200, { executions: execs });
            return;
        }

        // GET /api/engineering/executions/:id — single execution
        if (path.match(/^\/api\/engineering\/executions\/[^/]+$/) && method === 'GET') {
            const execId = path.split('/')[4]!;
            const exec = getPersonaExecution(execId);
            if (!exec || exec.persona !== 'engineering') { sendJSON(res, 404, { error: 'Execution not found' }); return; }
            sendJSON(res, 200, { execution: exec });
            return;
        }

        // POST /api/engineering/executions/:id/approve/:stepId — approve a step
        if (path.match(/^\/api\/engineering\/executions\/[^/]+\/approve\/[^/]+$/) && method === 'POST') {
            const parts = path.split('/');
            const execId = parts[4]!;
            const stepId = parts[6]!;
            const result = approvePersonaStep(execId, stepId);
            sendJSON(res, result.success ? 200 : 400, result);
            return;
        }

        // -----------------------------------------------------------------------
        // Product Persona API (persona-gated)

        if (path.startsWith('/api/product/') && authUser && !requirePersonaAccess(authUser, 'product')) {
            sendJSON(res, 403, { error: 'Access denied for persona: product' }); return;
        }

        // GET /api/product/skills — full skill catalog
        if (path === '/api/product/skills' && method === 'GET') {
            sendJSON(res, 200, { skills: PRODUCT_SKILLS, clusters: getProductSkillsByCluster() });
            return;
        }

        // GET /api/product/skills/:idOrSlug — single skill
        if (path.match(/^\/api\/product\/skills\/[^/]+$/) && method === 'GET') {
            const idOrSlug = path.split('/')[4]!;
            const skill = getProductSkill(idOrSlug);
            if (!skill) { sendJSON(res, 404, { error: 'Skill not found' }); return; }
            sendJSON(res, 200, { skill });
            return;
        }

        // POST /api/product/execute — run a skill
        if (path === '/api/product/execute' && method === 'POST') {
            const body = await readBody(req);
            const { skillId, inputs, simulate, customPrompt, provider, modelId } = body as { skillId?: string; inputs?: Record<string, unknown>; simulate?: boolean; customPrompt?: string; provider?: string; modelId?: string };
            if (!skillId) { sendJSON(res, 400, { error: 'skillId required' }); return; }
            const skill = getProductSkill(skillId);
            if (!skill) { sendJSON(res, 404, { error: `Skill not found: ${skillId}` }); return; }
            const exec = createPersonaExecution('product', skill, inputs ?? {}, undefined, simulate, customPrompt, provider as any, modelId);
            recordAudit(userId, 'skill.execute', `Product / ${skill.name}`);
            broadcastEvent(exec.id, 'session.started', { persona: 'product', skillId, simulate, provider });
            sendJSON(res, 200, { execution: exec });
            return;
        }

        // GET /api/product/executions — list recent executions
        if (path === '/api/product/executions' && method === 'GET') {
            const execs = listPersonaExecutions('product');
            sendJSON(res, 200, { executions: execs });
            return;
        }

        // GET /api/product/executions/:id — single execution
        if (path.match(/^\/api\/product\/executions\/[^/]+$/) && method === 'GET') {
            const execId = path.split('/')[4]!;
            const exec = getPersonaExecution(execId);
            if (!exec || exec.persona !== 'product') { sendJSON(res, 404, { error: 'Execution not found' }); return; }
            sendJSON(res, 200, { execution: exec });
            return;
        }

        // POST /api/product/executions/:id/approve/:stepId — approve a step
        if (path.match(/^\/api\/product\/executions\/[^/]+\/approve\/[^/]+$/) && method === 'POST') {
            const parts = path.split('/');
            const execId = parts[4]!;
            const stepId = parts[6]!;
            const result = approvePersonaStep(execId, stepId);
            sendJSON(res, result.success ? 200 : 400, result);
            return;
        }

        // -----------------------------------------------------------------------
        // HR & Talent Acquisition Persona API (persona-gated)

        if (path.startsWith('/api/hr/') && authUser && !requirePersonaAccess(authUser, 'hr')) {
            sendJSON(res, 403, { error: 'Access denied for persona: hr' }); return;
        }

        // GET /api/hr/skills — full skill catalog
        if (path === '/api/hr/skills' && method === 'GET') {
            sendJSON(res, 200, { skills: HR_SKILLS, clusters: getHRSkillsByCluster() });
            return;
        }

        // GET /api/hr/skills/:idOrSlug — single skill
        if (path.match(/^\/api\/hr\/skills\/[^/]+$/) && method === 'GET') {
            const idOrSlug = path.split('/')[4]!;
            const skill = getHRSkill(idOrSlug);
            if (!skill) { sendJSON(res, 404, { error: 'Skill not found' }); return; }
            sendJSON(res, 200, { skill });
            return;
        }

        // POST /api/hr/execute — run a skill
        if (path === '/api/hr/execute' && method === 'POST') {
            const body = await readBody(req);
            const { skillId, inputs, simulate, customPrompt, provider, modelId } = body as { skillId?: string; inputs?: Record<string, unknown>; simulate?: boolean; customPrompt?: string; provider?: string; modelId?: string };
            if (!skillId) { sendJSON(res, 400, { error: 'skillId required' }); return; }
            const skill = getHRSkill(skillId);
            if (!skill) { sendJSON(res, 404, { error: `Skill not found: ${skillId}` }); return; }
            const exec = createPersonaExecution('hr', skill, inputs ?? {}, undefined, simulate, customPrompt, provider as any, modelId);
            recordAudit(userId, 'skill.execute', `HR / ${skill.name}`);
            broadcastEvent(exec.id, 'session.started', { persona: 'hr', skillId, simulate, provider });
            sendJSON(res, 200, { execution: exec });
            return;
        }

        // GET /api/hr/executions — list recent executions
        if (path === '/api/hr/executions' && method === 'GET') {
            const execs = listPersonaExecutions('hr');
            sendJSON(res, 200, { executions: execs });
            return;
        }

        // GET /api/hr/executions/:id — single execution
        if (path.match(/^\/api\/hr\/executions\/[^/]+$/) && method === 'GET') {
            const execId = path.split('/')[4]!;
            const exec = getPersonaExecution(execId);
            if (!exec || exec.persona !== 'hr') { sendJSON(res, 404, { error: 'Execution not found' }); return; }
            sendJSON(res, 200, { execution: exec });
            return;
        }

        // POST /api/hr/executions/:id/approve/:stepId — approve a step
        if (path.match(/^\/api\/hr\/executions\/[^/]+\/approve\/[^/]+$/) && method === 'POST') {
            const parts = path.split('/');
            const execId = parts[4]!;
            const stepId = parts[6]!;
            const result = approvePersonaStep(execId, stepId);
            sendJSON(res, result.success ? 200 : 400, result);
            return;
        }

        // -----------------------------------------------------------------------
        // Orchestrator API — Goal decomposition & execution
        // -----------------------------------------------------------------------

        if (path === '/api/orchestrator/goal' && method === 'POST') {
            const body = await readBody(req);
            const { description, context, priority } = body as { description?: string; context?: Record<string, unknown>; priority?: string };
            if (!description || typeof description !== 'string') {
                sendJSON(res, 400, { error: 'Missing description field' });
                return;
            }
            const exec = await submitGoal(
                description,
                context as Record<string, unknown>,
                (priority as 'low' | 'normal' | 'high' | 'critical') ?? 'normal',
                userId
            );
            recordAudit(userId, 'goal.submit', String(description).slice(0, 80));
            broadcastEvent(exec.id, 'session.started', { type: 'goal', description, priority });
            sendJSON(res, 200, exec);
            return;
        }

        if (path.startsWith('/api/orchestrator/goal/') && method === 'GET') {
            const goalId = path.replace('/api/orchestrator/goal/', '');
            const exec = getGoalExecution(goalId);
            if (!exec) { sendJSON(res, 404, { error: 'Goal execution not found' }); return; }
            sendJSON(res, 200, exec);
            return;
        }

        if (path.startsWith('/api/orchestrator/goal/') && path.endsWith('/cancel') && method === 'POST') {
            const goalId = path.replace('/api/orchestrator/goal/', '').replace('/cancel', '');
            const cancelled = await cancelGoal(goalId);
            sendJSON(res, 200, { cancelled });
            return;
        }

        if (path === '/api/orchestrator/goals' && method === 'GET') {
            sendJSON(res, 200, listGoalExecutions());
            return;
        }

        // -----------------------------------------------------------------------
        // Pipeline Graph Config API — serve graph.json for each persona
        // -----------------------------------------------------------------------

        const graphRouteMatch = path.match(/^\/api\/(\w+)\/pipeline\/graph$/);
        const graphQueryPersona = path === '/api/pipeline/graph' && method === 'GET' ? url.searchParams.get('persona') : null;

        if ((graphRouteMatch || graphQueryPersona) && method === 'GET') {
            const persona = (graphRouteMatch?.[1] || graphQueryPersona || '').toLowerCase();
            try {
                // Resolve project root relative to this server file
                const thisDir = typeof __dirname !== 'undefined' ? __dirname : nodePath.dirname(fileURLToPath(import.meta.url));
                const projectRoot = nodePath.resolve(thisDir, '..', '..', '..');
                const graphPath = nodePath.join(projectRoot, 'agents', persona, 'graph_runtime', 'graph.json');
                if (fs.existsSync(graphPath)) {
                    const raw = fs.readFileSync(graphPath, 'utf-8');
                    const data = JSON.parse(raw);
                    sendJSON(res, 200, data);
                } else {
                    // Generate a minimal placeholder graph for personas without a graph.json
                    const agentsByPersona = getAgentsByPersona(persona as any);
                    const nodes = agentsByPersona.map((a, i) => ({
                        id: a.id,
                        agent: a.id,
                        depends_on: i > 0 ? [agentsByPersona[i - 1].id] : [],
                        phase: 'default',
                        parallel_group: null,
                    }));
                    sendJSON(res, 200, {
                        graph_id: `${persona}.agent_graph`,
                        name: `${persona.charAt(0).toUpperCase() + persona.slice(1)} Agent Collaboration Graph`,
                        description: `Auto-generated graph for ${persona} agents`,
                        nodes,
                        phases: { default: { label: 'Execution', order: 1, description: 'Sequential agent execution' } },
                        quality_gates: [],
                        checkpoints: [],
                        feedback_loops: [],
                        shared_state: [],
                    });
                }
            } catch (err) {
                sendJSON(res, 500, { error: 'Failed to load graph config' });
            }
            return;
        }

        // -----------------------------------------------------------------------
        // Pipeline Engine API — DAG-based agent pipeline execution
        // -----------------------------------------------------------------------

        if (path === '/api/pipeline/execute' && method === 'POST') {
            const body = await readBody(req);
            const { intent, context, provider, model, graphConfig, orchestratorConfig, agentDefinitions } = body as {
                intent?: string;
                context?: Record<string, unknown>;
                provider?: string;
                model?: string;
                graphConfig?: GraphConfig;
                orchestratorConfig?: OrchestratorConfig;
                agentDefinitions?: AgentDefinition[];
            };
            if (!intent || typeof intent !== 'string') {
                sendJSON(res, 400, { error: 'Missing intent field' });
                return;
            }
            if (!graphConfig || !orchestratorConfig || !agentDefinitions?.length) {
                sendJSON(res, 400, { error: 'Missing graphConfig, orchestratorConfig, or agentDefinitions' });
                return;
            }
            const agentDefs = new Map(agentDefinitions.map(a => [a.agent_id, a]));
            const engine = new PipelineEngine(graphConfig, orchestratorConfig, agentDefs);
            const execution = await engine.execute(intent, context, { provider: provider as any, model });
            recordAudit(userId, 'pipeline.execute', String(intent).slice(0, 80));
            broadcastEvent(execution.id, 'pipeline.started', { intent, nodeCount: execution.nodeStates.size });
            sendJSON(res, 200, {
                id: execution.id,
                status: execution.status,
                intent: execution.intent,
                totalTokensUsed: execution.totalTokensUsed,
                totalCostUsd: execution.totalCostUsd,
                afterActionReport: execution.afterActionReport,
                statusReports: execution.statusReports,
            });
            return;
        }

        if (path.startsWith('/api/pipeline/') && !path.includes('/cancel') && method === 'GET') {
            const pipelineId = path.replace('/api/pipeline/', '');
            const exec = getPipelineExecution(pipelineId);
            if (!exec) { sendJSON(res, 404, { error: 'Pipeline execution not found' }); return; }
            sendJSON(res, 200, {
                id: exec.id,
                status: exec.status,
                intent: exec.intent,
                totalTokensUsed: exec.totalTokensUsed,
                totalCostUsd: exec.totalCostUsd,
                afterActionReport: exec.afterActionReport,
                statusReports: exec.statusReports,
            });
            return;
        }

        if (path.startsWith('/api/pipeline/') && path.endsWith('/cancel') && method === 'POST') {
            const pipelineId = path.replace('/api/pipeline/', '').replace('/cancel', '');
            const cancelled = await cancelPipeline(pipelineId);
            sendJSON(res, 200, { cancelled });
            return;
        }

        if (path === '/api/pipelines' && method === 'GET') {
            const executions = listPipelineExecutions().map(e => ({
                id: e.id,
                status: e.status,
                intent: e.intent,
                startedAt: e.startedAt,
                completedAt: e.completedAt,
                totalTokensUsed: e.totalTokensUsed,
                totalCostUsd: e.totalCostUsd,
            }));
            sendJSON(res, 200, executions);
            return;
        }

        // GET /api/plugins — list registered plugins and their health
        if (path === '/api/plugins' && method === 'GET') {
            const health = await pluginRegistry.healthCheckAll();
            const plugins = [
                ...pluginRegistry.listByType('runtime').map(p => ({ ...p.manifest, healthy: health.get(p.manifest.id)?.healthy })),
                ...pluginRegistry.listByType('tool').map(p => ({ ...p.manifest, healthy: health.get(p.manifest.id)?.healthy })),
                ...pluginRegistry.listByType('llm').map(p => ({ ...p.manifest, healthy: health.get(p.manifest.id)?.healthy })),
                ...pluginRegistry.listByType('memory').map(p => ({ ...p.manifest, healthy: health.get(p.manifest.id)?.healthy })),
                ...pluginRegistry.listByType('observability').map(p => ({ ...p.manifest, healthy: health.get(p.manifest.id)?.healthy })),
            ];
            sendJSON(res, 200, { plugins });
            return;
        }

        // -----------------------------------------------------------------------
        // Event Bus API — Event log & metrics
        // -----------------------------------------------------------------------

        if (path === '/api/events' && method === 'GET') {
            const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
            const pattern = url.searchParams.get('pattern') ?? undefined;
            const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
            sendJSON(res, 200, eventBus.getLog(pattern, limit));
            return;
        }

        if (path === '/api/events/metrics' && method === 'GET') {
            sendJSON(res, 200, eventBus.getMetrics());
            return;
        }

        // -----------------------------------------------------------------------
        // LLM Provider API — Multi-model support
        // -----------------------------------------------------------------------

        if (path === '/api/llm/providers' && method === 'GET') {
            const providers = getAvailableProviders();
            const defaultProvider = getDefaultProvider();
            sendJSON(res, 200, { providers, defaultProvider });
            return;
        }

        // -----------------------------------------------------------------------
        // Agent Registry API — Backend agent identities
        // -----------------------------------------------------------------------

        if (path === '/api/agents/registry' && method === 'GET') {
            sendJSON(res, 200, getFullRegistry());
            return;
        }

        if (path.match(/^\/api\/agents\/registry\/[^/]+$/) && method === 'GET') {
            const agentIdOrCallSign = decodeURIComponent(path.split('/')[4]!);
            const agent = getAgentIdentity(agentIdOrCallSign);
            if (!agent) { sendJSON(res, 404, { error: `Agent not found: ${agentIdOrCallSign}` }); return; }
            sendJSON(res, 200, { agent });
            return;
        }

        if (path.match(/^\/api\/agents\/persona\/[^/]+$/) && method === 'GET') {
            const persona = path.split('/')[4] as any;
            const agents = getAgentsByPersona(persona);
            sendJSON(res, 200, { agents, count: agents.length });
            return;
        }

        // -----------------------------------------------------------------------
        // Agent KPI API — Performance metrics from real executions
        // -----------------------------------------------------------------------

        if (path === '/api/agents/kpis' && method === 'GET') {
            sendJSON(res, 200, { kpis: getAgentKPIs() });
            return;
        }

        if (path.match(/^\/api\/agents\/kpis\/[^/]+$/) && method === 'GET') {
            const agentId = decodeURIComponent(path.split('/')[4]!);
            const kpi = getAgentKPI(agentId);
            if (!kpi) { sendJSON(res, 404, { error: `No KPI data for agent: ${agentId}` }); return; }
            sendJSON(res, 200, { kpi });
            return;
        }

        // Agent Memory — per-agent accumulated context
        if (path === '/api/agents/memory' && method === 'GET') {
            sendJSON(res, 200, { snapshots: getAllAgentMemorySnapshots() });
            return;
        }

        if (path.match(/^\/api\/agents\/memory\/[^/]+$/) && method === 'GET') {
            const agentId = decodeURIComponent(path.split('/')[4]!);
            sendJSON(res, 200, { agentId, entries: getAgentMemory(agentId) });
            return;
        }

        if (path.match(/^\/api\/agents\/memory\/[^/]+$/) && method === 'POST') {
            const agentId = decodeURIComponent(path.split('/')[4]!);
            const body = await readBody(req);
            if (!body.kind || !body.content) { sendJSON(res, 400, { error: 'kind and content required' }); return; }
            const entry = recordAgentMemory(agentId, body.kind as 'learning' | 'correction' | 'pattern' | 'preference', body.content as string, (body.source as string) ?? 'manual');
            sendJSON(res, 201, { entry });
            return;
        }

        // -----------------------------------------------------------------------
        // C-Suite Command Layer & Vision-Down Execution
        // -----------------------------------------------------------------------

        // GET /api/csuite — list all C-Suite officers with profiles
        if (path === '/api/csuite' && method === 'GET') {
            const agents = getCSuiteAgents();
            const profiles = getAllCSuiteProfiles();
            const officers = agents.map(a => ({
                agent: a,
                profile: profiles.find(p => p.agentId === a.id),
                directReports: getChainOfCommand(a.id).length - 1,
            }));
            sendJSON(res, 200, { officers, total: officers.length });
            return;
        }

        // GET /api/csuite/:agentId — get C-Suite officer detail
        if (path.match(/^\/api\/csuite\/[^/]+$/) && method === 'GET') {
            const agentId = decodeURIComponent(path.split('/')[3]!);
            const agent = getAgentIdentity(agentId);
            const profile = getCSuiteProfile(agentId);
            if (!agent || !profile) { sendJSON(res, 404, { error: 'C-Suite officer not found' }); return; }
            const orgTree = getOrgTree(agentId);
            sendJSON(res, 200, { agent, profile, orgTree });
            return;
        }

        // GET /api/csuite/:agentId/chain — get chain of command
        if (path.match(/^\/api\/csuite\/[^/]+\/chain$/) && method === 'GET') {
            const agentId = decodeURIComponent(path.split('/')[3]!);
            const chain = getChainOfCommand(agentId);
            sendJSON(res, 200, { chain });
            return;
        }

        // -----------------------------------------------------------------------
        // Vision Statements — strategic vision management
        // -----------------------------------------------------------------------

        // POST /api/vision — create a new vision statement
        if (path === '/api/vision' && method === 'POST') {
            const body = await readBody(req);
            const { statement } = body as { statement: string };
            if (!statement) { sendJSON(res, 400, { error: 'statement is required' }); return; }
            const vision = await createVision(statement, 'user');
            sendJSON(res, 201, { vision });
            return;
        }

        // GET /api/vision — list all vision statements
        if (path === '/api/vision' && method === 'GET') {
            sendJSON(res, 200, { visions: listVisions() });
            return;
        }

        // GET /api/vision/:id — get vision detail
        if (path.match(/^\/api\/vision\/[^/]+$/) && method === 'GET') {
            const visionId = decodeURIComponent(path.split('/')[3]!);
            const vision = getVision(visionId);
            if (!vision) { sendJSON(res, 404, { error: 'Vision not found' }); return; }
            sendJSON(res, 200, { vision });
            return;
        }

        // POST /api/vision/:id/decompose — CEO decomposes vision into objectives
        if (path.match(/^\/api\/vision\/[^/]+\/decompose$/) && method === 'POST') {
            const visionId = decodeURIComponent(path.split('/')[3]!);
            try {
                const decomposition = await decomposeVision(visionId);
                sendJSON(res, 200, { decomposition });
            } catch (err) {
                sendJSON(res, 400, { error: (err as Error).message });
            }
            return;
        }

        // POST /api/vision/:id/cascade/:objectiveId — cascade objective to regiment
        if (path.match(/^\/api\/vision\/[^/]+\/cascade\/[^/]+$/) && method === 'POST') {
            const parts = path.split('/');
            const visionId = decodeURIComponent(parts[3]!);
            const objectiveId = decodeURIComponent(parts[5]!);
            try {
                const tasks = await cascadeToRegiment(visionId, objectiveId);
                sendJSON(res, 200, { tasks });
            } catch (err) {
                sendJSON(res, 400, { error: (err as Error).message });
            }
            return;
        }

        // GET /api/vision/:id/status — roll-up progress view
        if (path.match(/^\/api\/vision\/[^/]+\/status$/) && method === 'GET') {
            const visionId = decodeURIComponent(path.split('/')[3]!);
            const status = getVisionStatus(visionId);
            if (!status) { sendJSON(res, 404, { error: 'Vision not found' }); return; }
            sendJSON(res, 200, status);
            return;
        }

        // -----------------------------------------------------------------------
        // PMO — Program Management Office
        // -----------------------------------------------------------------------

        // POST /api/pmo/programs — create a program
        if (path === '/api/pmo/programs' && method === 'POST') {
            const body = await readBody(req);
            const { visionId, title, involvedRegiments } = body as { visionId: string; title: string; involvedRegiments: string[] };
            if (!visionId || !title) { sendJSON(res, 400, { error: 'visionId and title are required' }); return; }
            const program = await createProgram(visionId, title, involvedRegiments ?? []);
            sendJSON(res, 201, { program });
            return;
        }

        // GET /api/pmo/programs — list programs
        if (path === '/api/pmo/programs' && method === 'GET') {
            const visionId = url.searchParams.get('visionId') ?? undefined;
            sendJSON(res, 200, { programs: listPrograms(visionId) });
            return;
        }

        // GET /api/pmo/programs/:id — get program detail
        if (path.match(/^\/api\/pmo\/programs\/[^/]+$/) && method === 'GET') {
            const programId = decodeURIComponent(path.split('/')[4]!);
            const program = getProgram(programId);
            if (!program) { sendJSON(res, 404, { error: 'Program not found' }); return; }
            sendJSON(res, 200, { program });
            return;
        }

        // PUT /api/pmo/programs/:id — update program
        if (path.match(/^\/api\/pmo\/programs\/[^/]+$/) && method === 'PUT') {
            const programId = decodeURIComponent(path.split('/')[4]!);
            const body = await readBody(req);
            try {
                const program = await updateProgram(programId, body as any);
                sendJSON(res, 200, { program });
            } catch (err) {
                sendJSON(res, 404, { error: (err as Error).message });
            }
            return;
        }

        // GET /api/pmo/status — PMO status report
        if (path === '/api/pmo/status' && method === 'GET') {
            const visionId = url.searchParams.get('visionId') ?? undefined;
            const report = await generatePMOStatusReport(visionId);
            sendJSON(res, 200, { report });
            return;
        }

        // -----------------------------------------------------------------------
        // After-Action Reports (AAR) — auto-generated per execution
        // -----------------------------------------------------------------------

        // GET /api/aar — list all AARs
        if (path === '/api/aar' && method === 'GET') {
            const persona = url.searchParams.get('persona') ?? undefined;
            const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
            sendJSON(res, 200, { reports: listAfterActionReports(persona, limit) });
            return;
        }

        // GET /api/aar/:executionId — get AAR for a specific execution
        if (path.match(/^\/api\/aar\/[^/]+$/) && method === 'GET') {
            const executionId = decodeURIComponent(path.split('/')[3]!);
            const aar = getAfterActionReport(executionId);
            if (!aar) { sendJSON(res, 404, { error: 'No After-Action Report for this execution' }); return; }
            sendJSON(res, 200, { report: aar });
            return;
        }

        // -----------------------------------------------------------------------
        // Retraining Flags — agent performance alerts
        // -----------------------------------------------------------------------

        // GET /api/retraining — list all retraining flags
        if (path === '/api/retraining' && method === 'GET') {
            sendJSON(res, 200, { flags: getRetrainingFlags() });
            return;
        }

        // GET /api/retraining/:agentId — get flag for specific agent
        if (path.match(/^\/api\/retraining\/[^/]+$/) && method === 'GET') {
            const agentId = decodeURIComponent(path.split('/')[3]!);
            const flag = getRetrainingFlag(agentId);
            if (!flag) { sendJSON(res, 404, { error: 'No retraining flag for this agent' }); return; }
            sendJSON(res, 200, { flag });
            return;
        }

        // POST /api/retraining/:agentId/acknowledge — mark flag as reviewed
        if (path.match(/^\/api\/retraining\/[^/]+\/acknowledge$/) && method === 'POST') {
            const agentId = decodeURIComponent(path.split('/')[3]!);
            const result = acknowledgeRetrainingFlag(agentId);
            sendJSON(res, result.success ? 200 : 404, result);
            return;
        }

        // DELETE /api/retraining/:agentId — dismiss a retraining flag
        if (path.match(/^\/api\/retraining\/[^/]+$/) && method === 'DELETE') {
            const agentId = decodeURIComponent(path.split('/')[3]!);
            const result = dismissRetrainingFlag(agentId);
            sendJSON(res, result.success ? 200 : 404, result);
            return;
        }

        // -----------------------------------------------------------------------
        // Cognitive Pipeline — goal decomposition, reasoning, reflection, grounding
        // -----------------------------------------------------------------------
        if (path === '/api/cognitive/process' && method === 'POST') {
            const body = await readBody(req);
            const { goal, context, options } = body as { goal: string; context?: Record<string, unknown>; options?: CognitiveRequest['options'] };
            if (!goal) { sendJSON(res, 400, { error: 'goal required' }); return; }
            const request: CognitiveRequest = {
                id: `cog-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                goal,
                context: context ?? {},
                options,
            };
            const result = await processCognitivePipeline(request);
            sendJSON(res, 200, { result });
            return;
        }

        if (path === '/api/cognitive/decompose' && method === 'POST') {
            const body = await readBody(req);
            const { goal } = body as { goal: string };
            if (!goal) { sendJSON(res, 400, { error: 'goal required' }); return; }
            const result = await decompose(goal);
            sendJSON(res, 200, result);
            return;
        }

        if (path === '/api/cognitive/reason' && method === 'POST') {
            const body = await readBody(req);
            const { goal, plan } = body as { goal: string; plan: string };
            if (!goal) { sendJSON(res, 400, { error: 'goal required' }); return; }
            const result = await reason(goal, plan ?? '');
            sendJSON(res, 200, result);
            return;
        }

        if (path === '/api/cognitive/reflect' && method === 'POST') {
            const body = await readBody(req);
            const { output, goal } = body as { output: string; goal: string };
            if (!output || !goal) { sendJSON(res, 400, { error: 'output and goal required' }); return; }
            const result = await reflect(output, goal);
            sendJSON(res, 200, result);
            return;
        }

        if (path === '/api/cognitive/ground' && method === 'POST') {
            const body = await readBody(req);
            const { output, context } = body as { output: string; context: Record<string, unknown> };
            if (!output) { sendJSON(res, 400, { error: 'output required' }); return; }
            const result = await groundCheck(output, context ?? {});
            sendJSON(res, 200, result);
            return;
        }

        if (path.match(/^\/api\/cognitive\/status\/[^/]+$/) && method === 'GET') {
            const requestId = path.split('/').pop()!;
            const result = getCognitiveResult(requestId);
            if (!result) { sendJSON(res, 404, { error: 'Not found' }); return; }
            sendJSON(res, 200, { status: 'completed', result });
            return;
        }

        if (path.match(/^\/api\/cognitive\/trace\/[^/]+$/) && method === 'GET') {
            const requestId = path.split('/').pop()!;
            const trace = getCognitiveTrace(requestId);
            if (!trace) { sendJSON(res, 404, { error: 'Not found' }); return; }
            sendJSON(res, 200, { trace });
            return;
        }

        // -----------------------------------------------------------------------
        // 404
        sendJSON(res, 404, { error: 'Not found', path });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error';
        sendJSON(res, 500, { error: message });
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Provenance: 50 68 61 6e 69 20 4d 61 72 75 70 61 6b 61 (hex)
function sendJSON(res: http.ServerResponse, status: number, data: unknown): void {
    if (res.headersSent) return;
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'X-Platform': 'Enterprise-Agent-OS',
        'X-Platform-Author': 'Phani Marupaka',
        'X-Author-URL': 'https://linkedin.com/in/phani-marupaka',
    });
    res.end(JSON.stringify(data));
}

async function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); }
            catch { reject(new Error('Invalid JSON')); }
        });
        req.on('error', reject);
    });
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const server = http.createServer(handleRequest);

// Initialize OpenTelemetry (non-blocking — logs warning if OTel packages missing)
void initOTel('gateway');

// Attach WebSocket handler for live execution streaming
attachWebSocket(server);

server.listen(PORT, () => {
    console.log(`\n  ╔══════════════════════════════════════╗`);
    console.log(`  ║   EOS Gateway — Enterprise OS API    ║`);
    console.log(`  ║   http://localhost:${PORT}              ║`);
    console.log(`  ╚══════════════════════════════════════╝\n`);
    console.log(`  Endpoints:`);
    console.log(`    POST /api/query                    — Natural language query`);
    console.log(`    GET  /api/query/:id                — Get session result`);
    console.log(`    POST /api/classify                 — Classify intent`);
    console.log(`    GET  /api/skills                   — Skill catalog`);
    console.log(`    GET  /api/activity                 — Recent activity`);
    console.log(`    GET  /api/stats                    — System stats`);
    console.log(`    GET  /api/health                   — Health check`);
    console.log(`    GET  /api/prompts                  — Prompt library`);
    console.log(`    GET  /api/prompts/:slug            — Get prompt by slug`);
    console.log(`    POST /api/prompts/:id/vote         — Vote on a prompt`);
    console.log(`    POST /api/prompts/:id/fork         — Fork a prompt`);
    console.log(`    POST /api/prompts/:id/pin          — Pin/unpin a prompt`);
    console.log(`    POST /api/prompts/:id/use          — Mark prompt as used`);
    console.log(`    GET  /api/prompts/meta             — Categories & tags`);
    console.log(`    GET  /api/recommendations          — User suggestions`);
    console.log(`    POST /api/recommendations          — Submit suggestion`);
    console.log(`    POST /api/recommendations/:id/upvote — Upvote suggestion`);
    console.log(`    GET  /api/tools                    — Tools registry`);
    console.log(`    GET  /api/courses/stats            — Course engagement stats`);
    console.log(`    POST /api/courses/:id/like         — Like a course`);
    console.log(`    POST /api/courses/:id/dislike      — Dislike a course`);
    console.log(`    POST /api/courses/:id/pin          — Pin a course`);
    console.log(`    POST /api/courses/:id/view         — Track course view`);
    console.log(`    POST /api/orchestrator/goal        — Submit goal for AI decomposition`);
    console.log(`    GET  /api/orchestrator/goal/:id    — Get goal execution status`);
    console.log(`    GET  /api/orchestrator/goals       — List all goal executions`);
    console.log(`    GET  /api/events                   — Event bus log`);
    console.log(`    GET  /api/events/metrics            — Event bus metrics`);
    console.log(`    WS   /ws                            — Live execution streaming`);
    console.log(`\n  LLM: ${process.env.ANTHROPIC_API_KEY ? '✅ ANTHROPIC_API_KEY configured — real AI calls enabled' : '⚠️  ANTHROPIC_API_KEY not set — using fallback responses'}`);
    console.log(`  GitHub: ${process.env.GITHUB_TOKEN ? '✅ GITHUB_TOKEN configured' : '⚠️  GITHUB_TOKEN not set'}`);
    console.log(`  Persistence: ${usePostgres ? '✅ PostgreSQL (DATABASE_URL)' : useInMemory ? '📝 In-memory store (PERSIST=false)' : '✅ File-backed persistent store (default)'}`);
    console.log(`  OpenTelemetry: ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? '✅ Exporting to ' + process.env.OTEL_EXPORTER_OTLP_ENDPOINT : '📝 Set OTEL_EXPORTER_OTLP_ENDPOINT to enable'}\n`);
});

// Graceful shutdown — flush persistent store
process.on('SIGTERM', () => {
    flushGatewayPersistence();
    if ('flush' in store) (store as PersistentStore).flush();
    if ('close' in store) void (store as PostgresStore).close();
    void shutdownOTel();
    server.close();
});
process.on('SIGINT', () => {
    flushGatewayPersistence();
    if ('flush' in store) (store as PersistentStore).flush();
    if ('close' in store) void (store as PostgresStore).close();
    void shutdownOTel();
    server.close();
});

export { server };
