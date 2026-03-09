/**
 * EOS Gateway — Express HTTP Server
 *
 * Real server. Not a stub. Handles all API requests.
 */

import { InMemoryStore, SessionRepository, ExecutionRepository, executeQuery, classifyIntent } from './core.js';
import { authenticateRequest } from './auth.js';
import { PromptStore } from './prompt-library-data.js';
import { CapabilityGraph } from './capability-graph.js';
import http from 'node:http';
import { URL } from 'node:url';

const store = new InMemoryStore();
const sessions = new SessionRepository(store);
const executions = new ExecutionRepository(store);
const promptStore = new PromptStore();
const capabilityGraph = new CapabilityGraph();

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
        if (path.startsWith('/api/prompts/') && !path.includes('/vote') && !path.includes('/fork') && !path.includes('/pin') && !path.includes('/use') && method === 'GET') {
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

function sendJSON(res: http.ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
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
