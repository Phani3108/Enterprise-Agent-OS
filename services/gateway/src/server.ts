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
import { authenticateRequest } from './auth.js';
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
import http from 'node:http';
import { URL } from 'node:url';

const store = new InMemoryStore();
const sessions = new SessionRepository(store);
const executions = new ExecutionRepository(store);
const promptStore = new PromptStore();
const capabilityGraph = new CapabilityGraph();
const personaSystem = new PersonaSystem();
const licenseStore = new LicenseStore();

// Course engagement tracking
const courseVotes = new Set<string>();
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    try {
        // Health
        if (path === '/api/health' && method === 'GET') {
            sendJSON(res, 200, {
                status: 'healthy',
                version: '0.1.0',
                services: { gateway: 'up', skills: 'up', workers: 'up' },
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Query
        if (path === '/api/query' && method === 'POST') {
            const body = await readBody(req);
            const { query } = body;
            if (!query || typeof query !== 'string') {
                sendJSON(res, 400, { error: 'Missing query field' });
                return;
            }

            const result = await executeQuery(query, userId, sessions, executions);
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
            const intent = classifyIntent(body.query ?? '');
            sendJSON(res, 200, intent);
            return;
        }

        // Skills catalog
        if (path === '/api/skills' && method === 'GET') {
            sendJSON(res, 200, { skills: SKILL_CATALOG, total: SKILL_CATALOG.length });
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
            sendJSON(res, 200, {
                agents: [
                    { id: 'ag1', name: 'Campaign Strategist', persona: 'Marketing',   model: 'claude-opus-4-6',    status: 'active', tokensUsed: 48200, lastAction: 'Generating ICP analysis',       successRate: 0.97, startedAt: new Date(Date.now() - 120000).toISOString() },
                    { id: 'ag2', name: 'Ticket Classifier',   persona: 'Support',     model: 'claude-haiku-4-5',   status: 'active', tokensUsed: 12800, lastAction: 'Classifying support ticket',     successRate: 0.99, startedAt: new Date(Date.now() - 300000).toISOString() },
                    { id: 'ag3', name: 'Contract Analyzer',   persona: 'Legal',       model: 'claude-opus-4-6',    status: 'idle',   tokensUsed: 82400, lastAction: 'Contract risk analysis',         successRate: 0.94, startedAt: new Date(Date.now() - 600000).toISOString() },
                    { id: 'ag4', name: 'Code Reviewer',       persona: 'Engineering', model: 'claude-sonnet-4-6',  status: 'active', tokensUsed: 33600, lastAction: 'PR review: auth module',         successRate: 0.98, startedAt: new Date(Date.now() - 180000).toISOString() },
                    { id: 'ag5', name: 'Intent Router',       persona: 'System',      model: 'claude-sonnet-4-6',  status: 'active', tokensUsed: 8400,  lastAction: 'Routing user query',             successRate: 0.96, startedAt: new Date(Date.now() -  60000).toISOString() },
                ],
                total: 5, active: 4, idle: 1,
            });
            return;
        }

        if (path === '/api/observability/metrics' && method === 'GET') {
            sendJSON(res, 200, {
                gateway: { status: 'healthy', uptime: process.uptime(), memoryMb: process.memoryUsage().heapUsed / 1_000_000 },
                skills: { total: 8, active: 8 },
                scheduler: scheduler.getStats(),
                blog: blogStore.getStats(),
                forum: forumStore.getStats(),
                memory: memoryGraph.getStats(),
            });
            return;
        }

        // -----------------------------------------------------------------------
        // ACP Executions
        // -----------------------------------------------------------------------
        if (path === '/api/acp/executions' && method === 'GET') {
            sendJSON(res, 200, {
                executions: [
                    {
                        id: 'exec-1', name: 'Campaign Launch Flow', persona: 'Marketing',
                        skill: 'Campaign Strategy v2.1', status: 'running',
                        startedAt: new Date(Date.now() - 45000).toISOString(),
                        agents: [
                            { id: 'a1', name: 'Intent Router',      icon: '🎯', model: 'claude-sonnet-4-6', persona: 'System',    x: 80,  y: 160 },
                            { id: 'a2', name: 'Campaign Strategist', icon: '📣', model: 'claude-opus-4-6',   persona: 'Marketing', x: 280, y: 80  },
                            { id: 'a3', name: 'Content Generator',   icon: '✍️', model: 'claude-sonnet-4-6', persona: 'Marketing', x: 480, y: 80  },
                            { id: 'a4', name: 'HubSpot Connector',   icon: '🔌', model: 'tool',              persona: 'Tool',      x: 480, y: 240 },
                            { id: 'a5', name: 'QA Reviewer',         icon: '✅', model: 'claude-haiku-4-5',  persona: 'Marketing', x: 280, y: 240 },
                        ],
                        messages: [
                            { id: 'm1', from: 'a1', to: 'a2', type: 'task_delegation',  label: 'delegate',  payload: '{"intent":"launch_campaign","confidence":0.94}', timestamp: new Date(Date.now() - 44000).toISOString(), status: 'delivered' },
                            { id: 'm2', from: 'a2', to: 'a4', type: 'task_delegation',  label: 'query CRM', payload: '{"tool":"hubspot","action":"get_contacts"}',       timestamp: new Date(Date.now() - 38000).toISOString(), status: 'delivered' },
                            { id: 'm3', from: 'a4', to: 'a2', type: 'result_handoff',   label: 'CRM data',  payload: '{"contacts":847,"segments":["enterprise"]}',       timestamp: new Date(Date.now() - 30000).toISOString(), status: 'delivered' },
                            { id: 'm4', from: 'a2', to: 'a3', type: 'task_delegation',  label: 'generate',  payload: '{"task":"write_campaign_copy","tone":"pro"}',       timestamp: new Date(Date.now() - 22000).toISOString(), status: 'delivered' },
                            { id: 'm5', from: 'a3', to: 'a5', type: 'approval_request', label: 'review',    payload: '{"draft":"Your AI-powered workflow...","wc":142}',  timestamp: new Date(Date.now() - 10000).toISOString(), status: 'in_flight' },
                        ],
                    },
                ],
            });
            return;
        }

        // -----------------------------------------------------------------------
        // Governance — Audit Log
        // -----------------------------------------------------------------------
        if (path === '/api/governance/audit' && method === 'GET') {
            const entries = [
                { id: 'au1', timestamp: new Date(Date.now() - 300000).toISOString(), user: 'admin@corp.com',  action: 'skill.publish',        target: 'Campaign Strategy v2.1', result: 'success' },
                { id: 'au2', timestamp: new Date(Date.now() - 240000).toISOString(), user: 'alice@corp.com',  action: 'tool.connect',         target: 'HubSpot CRM',            result: 'success' },
                { id: 'au3', timestamp: new Date(Date.now() - 180000).toISOString(), user: 'bob@corp.com',    action: 'workflow.execute',     target: 'Lead Nurture v3',        result: 'success' },
                { id: 'au4', timestamp: new Date(Date.now() - 120000).toISOString(), user: 'carol@corp.com',  action: 'prompt.fork',          target: 'Email Generator',        result: 'success' },
                { id: 'au5', timestamp: new Date(Date.now() - 90000).toISOString(),  user: 'admin@corp.com',  action: 'user.role_change',     target: 'dave@corp.com → Admin',  result: 'success' },
                { id: 'au6', timestamp: new Date(Date.now() - 60000).toISOString(),  user: 'eve@corp.com',    action: 'skill.execute',        target: 'Ticket Classifier v1.4', result: 'success' },
                { id: 'au7', timestamp: new Date(Date.now() - 45000).toISOString(),  user: 'frank@corp.com',  action: 'tool.connect',         target: 'Salesforce CRM',         result: 'failed'  },
                { id: 'au8', timestamp: new Date(Date.now() - 30000).toISOString(),  user: 'admin@corp.com',  action: 'governance.review',    target: 'OFAC Compliance Check',  result: 'warning' },
                { id: 'au9', timestamp: new Date(Date.now() - 15000).toISOString(),  user: 'alice@corp.com',  action: 'skill.execute',        target: 'Contract Analyzer v3.0', result: 'success' },
                { id: 'au10',timestamp: new Date(Date.now() - 5000).toISOString(),   user: 'system',          action: 'scheduler.trigger',    target: 'Weekly Report Cron',     result: 'success' },
            ];
            sendJSON(res, 200, { audit: entries, total: entries.length });
            return;
        }

        // -----------------------------------------------------------------------
        // Governance — Cost Attribution
        // -----------------------------------------------------------------------
        if (path === '/api/governance/costs' && method === 'GET') {
            sendJSON(res, 200, {
                period: 'March 2026',
                totalCost: 4218.50,
                breakdown: [
                    { persona: 'Marketing',  skillsUsed: 312, toolCalls: 1847, estimatedCost: 1240.20, budget: 2000, budgetPct: 62 },
                    { persona: 'Engineering',skillsUsed: 284, toolCalls: 2103, estimatedCost: 980.75,  budget: 1500, budgetPct: 65 },
                    { persona: 'Support',    skillsUsed: 198, toolCalls: 943,  estimatedCost: 620.40,  budget: 1000, budgetPct: 62 },
                    { persona: 'Legal',      skillsUsed: 87,  toolCalls: 321,  estimatedCost: 840.15,  budget: 1200, budgetPct: 70 },
                    { persona: 'Finance',    skillsUsed: 64,  toolCalls: 218,  estimatedCost: 537.00,  budget: 800,  budgetPct: 67 },
                ],
            });
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
    console.log(`    POST /api/courses/:id/view         — Track course view\n`);
});

export { server };
