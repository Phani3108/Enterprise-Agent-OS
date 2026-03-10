'use client';

import { useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { RightPanel } from '../components/RightPanel';
import CommandPalette from '../components/CommandPalette';
import HomeCommandCenter from '../components/HomeCommandCenter';
import PersonaSkillsView from '../components/PersonaSkillsView';
import SkillMarketplace from '../components/SkillMarketplace';
import IntentRouter from '../components/IntentRouter';
import SkillBuilder from '../components/SkillBuilder';
import { KnowledgeExplorer } from '../components/KnowledgeExplorer';
import { WorkflowBuilder } from '../components/WorkflowBuilder';
import { AICoursesHub } from '../components/AICoursesHub';
import { ObservabilityPanel } from '../components/ObservabilityPanel';
import { PromptLibrary } from '../components/PromptLibrary';
import { ToolsRegistry } from '../components/ToolsRegistry';
import { MarketingHub } from '../components/MarketingHub';
import AboutPage from '../components/AboutPage';
import AgentsPanel from '../components/AgentsPanel';
import SettingsPanel from '../components/SettingsPanel';
import { BlogEditor } from '../components/BlogEditor';
import { DiscussionForum } from '../components/DiscussionForum';
import { ExecutionScheduler } from '../components/ExecutionScheduler';
import ControlPlane from '../components/ControlPlane';
import MemoryGraphExplorer from '../components/MemoryGraphExplorer';
import AgentCollaboration from '../components/AgentCollaboration';
import GovernanceDashboard from '../components/GovernanceDashboard';
import TourOverlay from '../components/tour/TourOverlay';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { useEAOSStore } from '../store/eaos-store';

function MainContent({ section }: { section: string }) {
  switch (section) {
    case 'home':         return <HomeCommandCenter />;
    case 'personas':     return <PersonaSkillsView />;
    case 'marketplace':  return <SkillMarketplace />;
    case 'builder':      return <SkillBuilder />;
    case 'agents':       return <AgentsPanel />;
    case 'workflows':    return <WorkflowBuilder />;
    case 'tools':        return <ToolsRegistry />;
    case 'prompts':      return <PromptLibrary />;
    case 'knowledge':    return <KnowledgeExplorer />;
    case 'learning':     return <AICoursesHub />;
    case 'marketing':    return <MarketingHub />;
    case 'blog':         return <BlogEditor />;
    case 'forum':        return <DiscussionForum />;
    case 'scheduler':    return <ExecutionScheduler />;
    case 'observability':return <ObservabilityPanel />;
    case 'control':      return <ControlPlane />;
    case 'memory':       return <MemoryGraphExplorer />;
    case 'acp':          return <AgentCollaboration />;
    case 'governance':   return <GovernanceDashboard />;
    case 'settings':     return <SettingsPanel />;
    case 'about':        return <AboutPage />;
    default:             return <HomeCommandCenter />;
  }
}

export default function Home() {
  const activeSection = useEAOSStore(s => s.activeSection);
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const setCommandOpen = useEAOSStore(s => s.setCommandOpen);
  const commandOpen = useEAOSStore(s => s.commandOpen);

  // Default to home on mount
  useEffect(() => {
    setActiveSection('home');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global CMD+K handler
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (e.key === 'Escape' && commandOpen) {
        setCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [commandOpen, setCommandOpen]);

  // Show IntentRouter bar for certain sections
  const showIntentBar = activeSection === 'personas' || activeSection === 'marketplace';

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Intent router strip (only on personas/marketplace) */}
        {showIntentBar && (
          <div className="px-6 py-2.5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            <IntentRouter />
          </div>
        )}

        {/* Main workspace */}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-auto">
            <MainContent section={activeSection} />
          </main>

          {/* Right execution panel */}
          <RightPanel />
        </div>
      </div>

      {/* Global overlays */}
      <CommandPalette />
      <TourOverlay />
      <OnboardingModal forceOpen={false} onClose={() => {}} />

      {/* Footer (reduced to attribution only, visible via About) */}
    </div>
  );
}
