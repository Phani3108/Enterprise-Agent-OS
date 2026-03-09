'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import CommandBar from '../components/CommandBar';
import Workspace from '../components/Workspace';
import ActivityTimeline from '../components/ActivityTimeline';
import { KnowledgeExplorer } from '../components/KnowledgeExplorer';
import { SkillLibrary } from '../components/SkillLibrary';
import { WorkflowBuilder } from '../components/WorkflowBuilder';
import { LearningMode } from '../components/LearningMode';
import { AICoursesHub } from '../components/AICoursesHub';
import { ObservabilityPanel } from '../components/ObservabilityPanel';
import { PromptLibrary } from '../components/PromptLibrary';
import { ToolsRegistry } from '../components/ToolsRegistry';
import { MarketingHub } from '../components/MarketingHub';
import AboutPage from '../components/AboutPage';
import AgentsPanel from '../components/AgentsPanel';
import SettingsPanel from '../components/SettingsPanel';
import HelpMenu from '../components/HelpMenu';
import TourOverlay from '../components/tour/TourOverlay';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { useEAOSStore } from '../store/eaos-store';

// Map section IDs to the component that renders in the main panel
function MainContent({ section }: { section: string }) {
    switch (section) {
        case 'knowledge': return <KnowledgeExplorer />;
        case 'skills': return <SkillLibrary />;
        case 'workflows': return <WorkflowBuilder />;
        case 'learning': return <AICoursesHub />;
        case 'observability': return <ObservabilityPanel />;
        case 'prompts': return <PromptLibrary />;
        case 'tools': return <ToolsRegistry />;
        case 'about': return <AboutPage />;
        case 'agents': return <AgentsPanel />;
        case 'settings': return <SettingsPanel />;
        case 'engineering': return (
            <div className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-white">🔧 Engineering</h2>
                <p className="text-sm text-neutral-400 mb-4">Engineering-specific tools and recent activity.</p>
                <KnowledgeExplorer />
            </div>
        );
        case 'marketing': return <MarketingHub />;
        case 'projects': return (
            <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-2">📋 Projects</h2>
                <p className="text-sm text-neutral-400 mb-6">Organize related queries, executions, and workflows into projects.</p>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                    <span className="text-4xl mb-4 block">📋</span>
                    <h3 className="text-sm font-medium text-white mb-2">No projects yet</h3>
                    <p className="text-xs text-neutral-500 mb-4">Create a project to organize your work across queries, workflows, and team members.</p>
                    <button className="px-4 py-2 rounded-lg bg-accent/20 text-accent text-sm hover:bg-accent/30 transition-colors">
                        + New Project
                    </button>
                </div>
            </div>
        );
        case 'activity': return (
            <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-2">📊 Activity History</h2>
                <p className="text-sm text-neutral-400 mb-6">Full audit trail of every query and execution.</p>
                <ActivityTimeline />
            </div>
        );
        case 'home':
        default:
            return <Workspace />;
    }
}

// Whether the right panel should be visible
function showRightPanel(section: string): boolean {
    return ['home', 'agents', 'engineering', 'marketing'].includes(section);
}

export default function Home() {
    const [gatewayStatus, setGatewayStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const activeSection = useEAOSStore(s => s.activeSection);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/health');
                if (res.ok) setGatewayStatus('connected');
                else setGatewayStatus('offline');
            } catch {
                setGatewayStatus('offline');
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex h-screen bg-surface-base text-white overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between px-6 py-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-semibold tracking-tight">EOS Mission Control</h1>
                        <span
                            data-tour="gateway-status"
                            className={`text-xs px-2 py-0.5 rounded-full ${gatewayStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' :
                                gatewayStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-red-500/20 text-red-400'
                                }`}
                        >
                            Gateway: {gatewayStatus}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                        <HelpMenu onRestartOnboarding={() => setShowOnboarding(true)} />
                        <span>v0.1.0</span>
                        <span>⌘K to query</span>
                    </div>
                </header>
                <div data-tour="command-bar">
                    <CommandBar />
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <MainContent section={activeSection} />
                    </div>
                    {showRightPanel(activeSection) && (
                        <div className="w-80 border-l border-white/5 overflow-y-auto" data-tour="activity-stream">
                            <ActivityTimeline />
                        </div>
                    )}
                </div>
            </div>

            {/* Tour overlay */}
            <TourOverlay />

            {/* Onboarding modal */}
            <OnboardingModal
                forceOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
            />
        </div>
    );
}
