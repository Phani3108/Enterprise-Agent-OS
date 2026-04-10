/**
 * Chat Store — Persistent multi-turn chat sessions with agents.
 *
 * A chat session groups messages between a user and one or more agents.
 * Each session maintains a rolling summary (refreshed periodically) and can
 * attach executions as "tool turns" for audit.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { randomUUID } from 'node:crypto';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type PersonaId = 'engineering' | 'product' | 'hr' | 'marketing' | 'ta' | 'program';

export type ChatRole = 'user' | 'agent' | 'system' | 'tool';

export interface ChatAttachment {
    type: 'execution' | 'skill' | 'file' | 'image' | 'link';
    ref: string;     // execution id, skill id, file path, url
    title?: string;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: ChatRole;
    agentId?: string;
    content: string;
    attachments?: ChatAttachment[];
    tokenCost?: number;
    createdAt: string;
}

export interface ChatSession {
    sessionId: string;
    userId: string;
    title: string;
    agentId?: string;         // optional: pinned primary agent
    persona?: PersonaId;       // scopes available skills
    summary?: string;          // rolling summary built by periodic summarizer
    pinnedContextIds: string[];  // memory graph refs
    createdAt: string;
    updatedAt: string;
    archivedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// In-memory state (registered with gateway-persistence for durability)
// ═══════════════════════════════════════════════════════════════

const sessions = new Map<string, ChatSession>();
const messagesBySession = new Map<string, ChatMessage[]>();

// ═══════════════════════════════════════════════════════════════
// Sessions
// ═══════════════════════════════════════════════════════════════

export function createSession(params: {
    userId: string;
    title?: string;
    agentId?: string;
    persona?: PersonaId;
}): ChatSession {
    const now = new Date().toISOString();
    const session: ChatSession = {
        sessionId: `chat-${randomUUID().slice(0, 8)}`,
        userId: params.userId,
        title: params.title ?? 'New conversation',
        agentId: params.agentId,
        persona: params.persona,
        pinnedContextIds: [],
        createdAt: now,
        updatedAt: now,
    };
    sessions.set(session.sessionId, session);
    messagesBySession.set(session.sessionId, []);
    return session;
}

export function getSession(sessionId: string): ChatSession | undefined {
    return sessions.get(sessionId);
}

export function listSessions(userId: string): ChatSession[] {
    return Array.from(sessions.values())
        .filter(s => s.userId === userId && !s.archivedAt)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function updateSession(sessionId: string, updates: Partial<ChatSession>): ChatSession | undefined {
    const existing = sessions.get(sessionId);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    sessions.set(sessionId, updated);
    return updated;
}

export function archiveSession(sessionId: string): boolean {
    const existing = sessions.get(sessionId);
    if (!existing) return false;
    existing.archivedAt = new Date().toISOString();
    existing.updatedAt = existing.archivedAt;
    sessions.set(sessionId, existing);
    return true;
}

// ═══════════════════════════════════════════════════════════════
// Messages
// ═══════════════════════════════════════════════════════════════

export function addMessage(params: {
    sessionId: string;
    role: ChatRole;
    content: string;
    agentId?: string;
    attachments?: ChatAttachment[];
    tokenCost?: number;
}): ChatMessage | undefined {
    const session = sessions.get(params.sessionId);
    if (!session) return undefined;

    const message: ChatMessage = {
        id: `msg-${randomUUID().slice(0, 8)}`,
        sessionId: params.sessionId,
        role: params.role,
        agentId: params.agentId,
        content: params.content,
        attachments: params.attachments,
        tokenCost: params.tokenCost,
        createdAt: new Date().toISOString(),
    };

    const list = messagesBySession.get(params.sessionId) ?? [];
    list.push(message);
    messagesBySession.set(params.sessionId, list);

    // Update session timestamp
    session.updatedAt = message.createdAt;
    // Auto-title: if still default and this is the first user message, use first 60 chars
    if (session.title === 'New conversation' && params.role === 'user' && list.length === 1) {
        session.title = params.content.slice(0, 60).trim() || 'New conversation';
    }
    sessions.set(session.sessionId, session);

    return message;
}

export function listMessages(sessionId: string, limit = 100): ChatMessage[] {
    const list = messagesBySession.get(sessionId) ?? [];
    return list.slice(-limit);
}

export function getMessageCount(sessionId: string): number {
    return (messagesBySession.get(sessionId) ?? []).length;
}

// ═══════════════════════════════════════════════════════════════
// Context building (for LLM calls)
// ═══════════════════════════════════════════════════════════════

export interface ConversationContext {
    systemPrompt: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export function buildConversationContext(sessionId: string, opts: {
    maxMessages?: number;
    systemPrompt?: string;
} = {}): ConversationContext | undefined {
    const session = sessions.get(sessionId);
    if (!session) return undefined;

    const maxMessages = opts.maxMessages ?? 20;
    const recent = (messagesBySession.get(sessionId) ?? []).slice(-maxMessages);

    // System prompt = rolling summary + optional override
    const parts: string[] = [];
    if (opts.systemPrompt) parts.push(opts.systemPrompt);
    else {
        parts.push(
            `You are an AI agent in AgentOS having a multi-turn conversation with a human user.`,
            session.agentId ? `You are the agent "${session.agentId}".` : '',
            session.persona ? `Persona: ${session.persona}.` : '',
            `Be concise, cite sources when you reference memories, and ask clarifying questions when intent is unclear.`,
        );
    }
    if (session.summary) {
        parts.push(`\nPrevious conversation summary:\n${session.summary}`);
    }

    const messages = recent.map(m => ({
        role: (m.role === 'user' ? 'user' : m.role === 'system' ? 'system' : 'assistant') as 'user' | 'assistant' | 'system',
        content: m.role === 'tool'
            ? `[Tool output: ${m.content}]`
            : m.content,
    }));

    return {
        systemPrompt: parts.filter(Boolean).join('\n'),
        messages,
    };
}

// ═══════════════════════════════════════════════════════════════
// Persistence hooks
// ═══════════════════════════════════════════════════════════════

export function _exportSessions(): { sessions: ChatSession[] } {
    return { sessions: Array.from(sessions.values()) };
}

export function _importSessions(data: { sessions?: ChatSession[] }): void {
    if (!data.sessions) return;
    sessions.clear();
    for (const s of data.sessions) sessions.set(s.sessionId, s);
}

export function _exportMessages(): { messages: ChatMessage[] } {
    const all: ChatMessage[] = [];
    for (const list of messagesBySession.values()) all.push(...list);
    return { messages: all };
}

export function _importMessages(data: { messages?: ChatMessage[] }): void {
    if (!data.messages) return;
    messagesBySession.clear();
    for (const m of data.messages) {
        const list = messagesBySession.get(m.sessionId) ?? [];
        list.push(m);
        messagesBySession.set(m.sessionId, list);
    }
    // Sort each session's messages by createdAt
    for (const [sessionId, list] of messagesBySession) {
        list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        messagesBySession.set(sessionId, list);
    }
}
