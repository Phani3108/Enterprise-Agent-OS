/**
 * Chat Engine — Orchestrates multi-turn chat conversations.
 *
 * Takes a user message, classifies intent, and routes to one of three paths:
 *   1. Chat reply  — direct LLM call with conversation context
 *   2. Skill invocation — enqueue via task queue, attach execution as tool turn
 *   3. Delegation  — hand off to another agent via A2A
 *
 * Streams tokens back to WebSocket channel `chat:<sessionId>`.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { addMessage, buildConversationContext, getSession } from './chat-store.js';
import { callLLM } from './llm-provider.js';
import { broadcastEvent } from './ws.js';
import { eventBus } from './event-bus.js';
import { createUTCPPacket, storePacket } from './utcp-protocol.js';
import { intentEngine } from './intent-engine.js';
import { skillMarketplace } from './skill-marketplace.js';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface PostMessageResult {
    userMessage: { id: string; content: string; createdAt: string };
    replyPath: 'chat' | 'skill' | 'delegation' | 'error';
    agentMessage?: { id: string; content: string; createdAt: string };
    detectedSkillSlug?: string;
    detectedAgent?: string;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Post a user message to a chat session and generate an agent reply.
 *
 * The reply path is auto-selected:
 *   - If the message contains `/skill-slug`, invoke that skill.
 *   - If the message contains `@agent-name`, delegate to that agent.
 *   - Otherwise, generate a direct chat reply using conversation context.
 */
export async function postMessage(params: {
    sessionId: string;
    userId: string;
    content: string;
}): Promise<PostMessageResult> {
    const session = getSession(params.sessionId);
    if (!session) {
        return {
            userMessage: { id: '', content: params.content, createdAt: new Date().toISOString() },
            replyPath: 'error',
            error: 'Session not found',
        };
    }

    // 1. Record the user message
    const userMsg = addMessage({
        sessionId: params.sessionId,
        role: 'user',
        content: params.content,
    });
    if (!userMsg) {
        return {
            userMessage: { id: '', content: params.content, createdAt: new Date().toISOString() },
            replyPath: 'error',
            error: 'Failed to record user message',
        };
    }

    // Broadcast the user message to the chat channel
    broadcastEvent(`chat:${params.sessionId}`, 'chat.message', {
        role: 'user',
        message: userMsg,
    });

    // 2. Create a UTCP packet for audit uniformity
    try {
        const packet = createUTCPPacket({
            function: (session.persona as any) ?? 'engineering',
            stage: 'chat',
            intent: params.content.slice(0, 240),
            initiator: { user_id: params.userId, role: 'operator' },
            objectives: [params.content.slice(0, 100)],
        });
        storePacket(packet);
    } catch {}

    // 3. Classify intent — look for `/` commands or `@` mentions
    const commandMatch = params.content.match(/^\/([\w-]+)/);
    const mentionMatch = params.content.match(/@([\w-]+)/);

    // Path 1: /skill invocation
    if (commandMatch) {
        const slug = commandMatch[1]!;
        const result: PostMessageResult = {
            userMessage: { id: userMsg.id, content: userMsg.content, createdAt: userMsg.createdAt },
            replyPath: 'skill',
            detectedSkillSlug: slug,
        };

        // For now, add a system message acknowledging the skill was requested.
        // Full skill enqueue path will be wired when chat→queue→skill loop is integrated.
        const ack = addMessage({
            sessionId: params.sessionId,
            role: 'system',
            content: `Skill "${slug}" requested. Enqueueing via task queue...`,
        });
        if (ack) {
            broadcastEvent(`chat:${params.sessionId}`, 'chat.message', { role: 'system', message: ack });
        }

        // Fire an A2A-style event so Protocol Monitor can see it
        eventBus.emit('chat.skill.requested', { sessionId: params.sessionId, slug, userId: params.userId }).catch(() => {});

        return result;
    }

    // Path 2: @agent delegation
    if (mentionMatch) {
        const agentName = mentionMatch[1]!;
        const result: PostMessageResult = {
            userMessage: { id: userMsg.id, content: userMsg.content, createdAt: userMsg.createdAt },
            replyPath: 'delegation',
            detectedAgent: agentName,
        };

        const ack = addMessage({
            sessionId: params.sessionId,
            role: 'system',
            content: `Delegating to @${agentName}...`,
        });
        if (ack) {
            broadcastEvent(`chat:${params.sessionId}`, 'chat.message', { role: 'system', message: ack });
        }
        eventBus.emit('chat.delegation.requested', { sessionId: params.sessionId, agentName, userId: params.userId }).catch(() => {});
        return result;
    }

    // Path 3: direct chat reply via LLM
    const context = buildConversationContext(params.sessionId, { maxMessages: 20 });
    if (!context) {
        return {
            userMessage: { id: userMsg.id, content: userMsg.content, createdAt: userMsg.createdAt },
            replyPath: 'error',
            error: 'Failed to build context',
        };
    }

    // Call LLM with concatenated conversation history as the user prompt
    const conversationText = context.messages
        .map(m => `${m.role === 'assistant' ? 'Assistant' : m.role === 'user' ? 'User' : 'System'}: ${m.content}`)
        .join('\n\n');

    let reply: string;
    try {
        const llmResponse = await callLLM({
            systemPrompt: context.systemPrompt,
            userPrompt: conversationText,
            maxTokens: 1024,
            temperature: 0.7,
        });
        reply = llmResponse.content || '(no response)';

        const agentMsg = addMessage({
            sessionId: params.sessionId,
            role: 'agent',
            agentId: session.agentId,
            content: reply,
            tokenCost: llmResponse.cost,
        });
        if (agentMsg) {
            broadcastEvent(`chat:${params.sessionId}`, 'chat.message', { role: 'agent', message: agentMsg });
        }

        return {
            userMessage: { id: userMsg.id, content: userMsg.content, createdAt: userMsg.createdAt },
            replyPath: 'chat',
            agentMessage: agentMsg ? { id: agentMsg.id, content: agentMsg.content, createdAt: agentMsg.createdAt } : undefined,
        };
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[chat-engine] LLM call failed:', errorMsg);
        const sysMsg = addMessage({
            sessionId: params.sessionId,
            role: 'system',
            content: `Error generating reply: ${errorMsg}`,
        });
        if (sysMsg) {
            broadcastEvent(`chat:${params.sessionId}`, 'chat.message', { role: 'system', message: sysMsg });
        }
        return {
            userMessage: { id: userMsg.id, content: userMsg.content, createdAt: userMsg.createdAt },
            replyPath: 'error',
            error: errorMsg,
        };
    }
}

/** Suggest a skill based on message content (uses existing intent engine). */
export function suggestSkillFromMessage(content: string): string | undefined {
    try {
        const result = intentEngine.routeIntent(content);
        return result?.skill?.slug;
    } catch {
        return undefined;
    }
}
