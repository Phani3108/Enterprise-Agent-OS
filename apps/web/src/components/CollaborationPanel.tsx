'use client';

import { useState } from 'react';

/**
 * Collaboration Panel — Share, export, and act on agent outputs.
 *
 * Users can:
 * - Share results to Slack/Teams channels
 * - Create Jira tickets from action items
 * - Export reports to Confluence/docs
 * - Send summaries to email
 */

interface ShareTarget {
    id: string;
    icon: string;
    label: string;
    type: 'slack' | 'teams' | 'jira' | 'confluence' | 'email' | 'download';
    description: string;
}

const SHARE_TARGETS: ShareTarget[] = [
    { id: 'slack', icon: '💬', label: 'Share to Slack', type: 'slack', description: 'Post formatted summary to a Slack channel' },
    { id: 'teams', icon: '📢', label: 'Share to Teams', type: 'teams', description: 'Post to Microsoft Teams channel' },
    { id: 'jira', icon: '🎫', label: 'Create Jira Tickets', type: 'jira', description: 'Convert action items into Jira issues' },
    { id: 'confluence', icon: '📄', label: 'Export to Confluence', type: 'confluence', description: 'Save as a Confluence page' },
    { id: 'email', icon: '📧', label: 'Send via Email', type: 'email', description: 'Email report to team members' },
    { id: 'download', icon: '⬇️', label: 'Download', type: 'download', description: 'Download as PDF or Markdown' },
];

interface CollaborationPanelProps {
    executionId?: string;
    goal?: string;
}

export function CollaborationPanel({ executionId = 'exec-001', goal = 'Campaign strategy for community banks' }: CollaborationPanelProps) {
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);
    const [shared, setShared] = useState<string[]>([]);

    const handleShare = async (target: ShareTarget) => {
        setSelectedTarget(target.id);
        setSharing(true);

        // Simulate sharing
        await new Promise((r) => setTimeout(r, 1200));

        setSharing(false);
        setShared((prev) => [...prev, target.id]);
        setSelectedTarget(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">📤 Share & Export</h3>
            <p className="text-xs text-slate-400 mb-4">Share this result or convert it into action</p>

            {/* Output preview */}
            <div className="p-3 rounded-lg bg-white border border-slate-200 mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">🎯</span>
                    <span className="text-xs font-medium text-slate-900 truncate">{goal}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{executionId}</span>
            </div>

            {/* Targets */}
            <div className="grid grid-cols-2 gap-2">
                {SHARE_TARGETS.map((target) => {
                    const isShared = shared.includes(target.id);
                    const isSharing = sharing && selectedTarget === target.id;

                    return (
                        <button
                            key={target.id}
                            onClick={() => !isShared && handleShare(target)}
                            disabled={isSharing}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${isShared
                                    ? 'bg-success/5 border-success/20 cursor-default'
                                    : isSharing
                                        ? 'bg-accent/5 border-accent/20 animate-pulse'
                                        : 'bg-white border-slate-200 hover:border-slate-200 hover:bg-slate-50 cursor-pointer'
                                }`}
                        >
                            <span className="text-lg">{isShared ? '✅' : target.icon}</span>
                            <div className="min-w-0">
                                <div className="text-xs font-medium text-slate-900">
                                    {isSharing ? 'Sharing...' : isShared ? 'Shared' : target.label}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">{target.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Quick Jira Creator */}
            <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                    {[
                        { label: 'Create follow-up ticket', icon: '🎫', action: 'Review ICP with sales team' },
                        { label: 'Schedule review meeting', icon: '📅', action: 'Campaign strategy review — Marketing team' },
                        { label: 'Assign to team member', icon: '👤', action: 'Content calendar execution' },
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors text-left"
                        >
                            <span className="text-sm">{item.icon}</span>
                            <div>
                                <div className="text-xs text-slate-700">{item.label}</div>
                                <div className="text-[11px] text-slate-400">{item.action}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
