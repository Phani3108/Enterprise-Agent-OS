/**
 * ChatPanel — Persistent multi-turn chat with AgentOS agents.
 *
 * Features:
 * - Left rail: session list with last-message preview
 * - Center: message feed with role-styled bubbles
 * - Input: text box with /skill and @agent hints
 * - Augments (doesn't replace) the ⌘K command palette
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import DemoPreviewBanner from './shared/DemoPreviewBanner';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

// ── Types ───────────────────────────────────────────────────────
interface ChatSession {
    sessionId: string;
    userId: string;
    title: string;
    agentId?: string;
    persona?: string;
    summary?: string;
    createdAt: string;
    updatedAt: string;
}

interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'agent' | 'system' | 'tool';
    agentId?: string;
    content: string;
    tokenCost?: number;
    createdAt: string;
}

// ── Demo data for offline mode ──────────────────────────────────
const DEMO_SESSIONS: ChatSession[] = [
    {
        sessionId: 'demo-chat-1',
        userId: 'demo',
        title: 'Plan Q3 launch campaign for Card Modernization',
        agentId: 'hyperion',
        persona: 'marketing',
        createdAt: '2026-04-08T14:20:00Z',
        updatedAt: '2026-04-09T10:15:00Z',
    },
    {
        sessionId: 'demo-chat-2',
        userId: 'demo',
        title: 'Review PR #847 for payment gateway',
        agentId: 'prometheus',
        persona: 'engineering',
        createdAt: '2026-04-09T08:30:00Z',
        updatedAt: '2026-04-09T08:45:00Z',
    },
    {
        sessionId: 'demo-chat-3',
        userId: 'demo',
        title: 'Draft JD for Senior Backend Engineer',
        persona: 'ta',
        createdAt: '2026-04-08T11:00:00Z',
        updatedAt: '2026-04-08T11:25:00Z',
    },
];

const DEMO_MESSAGES: Record<string, ChatMessage[]> = {
    'demo-chat-1': [
        { id: 'm1', sessionId: 'demo-chat-1', role: 'user', content: 'Plan a Q3 launch campaign for Card Modernization v2 targeting community banks.', createdAt: '2026-04-08T14:20:00Z' },
        { id: 'm2', sessionId: 'demo-chat-1', role: 'agent', agentId: 'hyperion', content: 'Understood. I\'ll design a 6-week campaign across LinkedIn, email, and a webinar series. First pass: 3 messaging pillars — Security, Scalability, Support. Want me to use `/campaign-strategy` to generate the full plan?', createdAt: '2026-04-08T14:20:30Z' },
        { id: 'm3', sessionId: 'demo-chat-1', role: 'user', content: 'Yes, and @iris should handle the content creation.', createdAt: '2026-04-09T10:14:00Z' },
        { id: 'm4', sessionId: 'demo-chat-1', role: 'system', content: 'Delegating to @iris...', createdAt: '2026-04-09T10:14:05Z' },
        { id: 'm5', sessionId: 'demo-chat-1', role: 'agent', agentId: 'iris', content: 'On it. I\'ll draft the email sequence, LinkedIn posts, and landing page copy. Estimated delivery: 2 hours.', createdAt: '2026-04-09T10:15:00Z' },
    ],
    'demo-chat-2': [
        { id: 'm6', sessionId: 'demo-chat-2', role: 'user', content: '/pr-review-assistant repo=payments-core pr=847', createdAt: '2026-04-09T08:30:00Z' },
        { id: 'm7', sessionId: 'demo-chat-2', role: 'system', content: 'Skill "pr-review-assistant" requested. Enqueueing via task queue...', createdAt: '2026-04-09T08:30:02Z' },
        { id: 'm8', sessionId: 'demo-chat-2', role: 'tool', content: 'PR #847 review complete. Architecture: 94%, Security: 88%, Performance: 91%. 2 blocking issues found — see execution output.', createdAt: '2026-04-09T08:44:30Z' },
        { id: 'm9', sessionId: 'demo-chat-2', role: 'agent', agentId: 'prometheus', content: 'Summary: PR is solid overall. Two blockers: 1) connection pool size hardcoded to 10, should be env-configurable 2) missing unit test for retry path. Recommend rebase + fixes before merge.', createdAt: '2026-04-09T08:45:00Z' },
    ],
    'demo-chat-3': [
        { id: 'm10', sessionId: 'demo-chat-3', role: 'user', content: 'Draft a JD for Senior Backend Engineer on the payments team. Focus on Go, Postgres, Kafka.', createdAt: '2026-04-08T11:00:00Z' },
        { id: 'm11', sessionId: 'demo-chat-3', role: 'agent', content: 'Here\'s a draft JD with required skills, responsibilities, and compensation band. Use `/jd-generator` if you want a full DEI-optimized version with scorecard.', createdAt: '2026-04-08T11:25:00Z' },
    ],
};

// ═══════════════════════════════════════════════════════════════
export default function ChatPanel() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [isDemo, setIsDemo] = useState(false);
    const feedRef = useRef<HTMLDivElement>(null);

    // Load sessions on mount
    useEffect(() => {
        fetch(`${GATEWAY_URL}/api/chat/sessions`)
            .then(r => r.ok ? r.json() : { sessions: [] })
            .then(d => {
                if (Array.isArray(d.sessions) && d.sessions.length > 0) {
                    setSessions(d.sessions);
                    setSelectedSessionId(d.sessions[0].sessionId);
                } else {
                    setSessions(DEMO_SESSIONS);
                    setSelectedSessionId(DEMO_SESSIONS[0]!.sessionId);
                    setIsDemo(true);
                }
            })
            .catch(() => {
                setSessions(DEMO_SESSIONS);
                setSelectedSessionId(DEMO_SESSIONS[0]!.sessionId);
                setIsDemo(true);
            });
    }, []);

    // Load messages when session changes
    useEffect(() => {
        if (!selectedSessionId) return;
        if (isDemo) {
            setMessages(DEMO_MESSAGES[selectedSessionId] ?? []);
            return;
        }
        fetch(`${GATEWAY_URL}/api/chat/sessions/${selectedSessionId}`)
            .then(r => r.ok ? r.json() : { messages: [] })
            .then(d => setMessages(d.messages ?? []))
            .catch(() => setMessages([]));
    }, [selectedSessionId, isDemo]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, [messages]);

    const createNewSession = useCallback(async () => {
        if (isDemo) {
            const newSession: ChatSession = {
                sessionId: `demo-chat-${Date.now()}`,
                userId: 'demo',
                title: 'New conversation',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setSessions(prev => [newSession, ...prev]);
            setSelectedSessionId(newSession.sessionId);
            setMessages([]);
            return;
        }
        try {
            const r = await fetch(`${GATEWAY_URL}/api/chat/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const d = await r.json();
            if (d.session) {
                setSessions(prev => [d.session, ...prev]);
                setSelectedSessionId(d.session.sessionId);
                setMessages([]);
            }
        } catch {}
    }, [isDemo]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || !selectedSessionId || sending) return;
        const content = input.trim();
        setInput('');
        setSending(true);

        // Optimistic update
        const userMsg: ChatMessage = {
            id: `temp-${Date.now()}`,
            sessionId: selectedSessionId,
            role: 'user',
            content,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMsg]);

        if (isDemo) {
            // Simulate a demo reply after a beat
            setTimeout(() => {
                const reply: ChatMessage = {
                    id: `demo-${Date.now()}`,
                    sessionId: selectedSessionId,
                    role: 'agent',
                    content: 'This is a demo reply. Start the gateway to get real LLM responses, skill invocations, and agent delegation.',
                    createdAt: new Date().toISOString(),
                };
                setMessages(prev => [...prev, reply]);
                setSending(false);
            }, 600);
            return;
        }

        try {
            const r = await fetch(`${GATEWAY_URL}/api/chat/sessions/${selectedSessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            const d = await r.json();
            if (d.agentMessage) {
                setMessages(prev => [...prev, {
                    id: d.agentMessage.id,
                    sessionId: selectedSessionId,
                    role: 'agent',
                    content: d.agentMessage.content,
                    createdAt: d.agentMessage.createdAt,
                }]);
            }
        } catch (err) {
            console.error('[chat] send error:', err);
        }
        setSending(false);
    }, [input, selectedSessionId, sending, isDemo]);

    const selectedSession = sessions.find(s => s.sessionId === selectedSessionId);

    return (
        <div className="page-container">
            <div className="page-content h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="page-title">Conversations</h1>
                        <p className="page-subtitle">Multi-turn chat with agents — augments the ⌘K command palette</p>
                    </div>
                    <button onClick={createNewSession} className="btn btn-primary btn-sm">+ New Chat</button>
                </div>

                {isDemo && <DemoPreviewBanner pageName="Conversations" steps={[
                    'Start the gateway to enable persistent chat sessions with agents',
                    'Type a message, use /skill-name to run skills, or @agent-name to delegate',
                    'Conversations persist across sessions with rolling summary + memory graph',
                ]} />}

                <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
                    {/* Left rail: sessions */}
                    <div className="col-span-1 card overflow-hidden flex flex-col">
                        <div className="card-header">
                            <span className="card-title text-xs">Sessions</span>
                            <span className="text-xs text-slate-400">{sessions.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                            {sessions.map(s => (
                                <button
                                    key={s.sessionId}
                                    onClick={() => setSelectedSessionId(s.sessionId)}
                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${selectedSessionId === s.sessionId ? 'bg-blue-50' : ''}`}
                                >
                                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">{s.title}</p>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                        {s.persona && <span className="badge badge-neutral text-[9px]">{s.persona}</span>}
                                        <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </button>
                            ))}
                            {sessions.length === 0 && (
                                <div className="p-4 text-center text-xs text-slate-400">No conversations yet</div>
                            )}
                        </div>
                    </div>

                    {/* Center: message feed */}
                    <div className="col-span-3 card overflow-hidden flex flex-col">
                        {selectedSession ? (
                            <>
                                <div className="card-header">
                                    <div>
                                        <h3 className="card-title text-sm">{selectedSession.title}</h3>
                                        {selectedSession.agentId && (
                                            <p className="text-[10px] text-slate-500">with @{selectedSession.agentId}</p>
                                        )}
                                    </div>
                                </div>

                                <div ref={feedRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                                    {messages.map(m => (
                                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                                m.role === 'user' ? 'bg-blue-600 text-white' :
                                                m.role === 'agent' ? 'bg-slate-100 text-slate-900' :
                                                m.role === 'tool' ? 'bg-amber-50 border border-amber-200 text-amber-900 font-mono text-xs' :
                                                'bg-slate-50 border border-slate-200 text-slate-600 italic text-xs'
                                            }`}>
                                                {m.agentId && m.role === 'agent' && (
                                                    <p className="text-[10px] font-bold text-slate-500 mb-1">@{m.agentId}</p>
                                                )}
                                                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                                                <p className={`text-[9px] mt-1 ${m.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <p className="text-center text-sm text-slate-400 py-12">Start the conversation below</p>
                                    )}
                                </div>

                                <div className="p-4 border-t border-slate-100">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder="Type a message, /skill-name, or @agent-name..."
                                            className="input flex-1"
                                            disabled={sending}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!input.trim() || sending}
                                            className="btn btn-primary"
                                        >
                                            {sending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        Use <kbd className="kbd text-[9px]">/</kbd> to invoke a skill, <kbd className="kbd text-[9px]">@</kbd> to delegate to another agent.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                                Select a session or start a new one
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
