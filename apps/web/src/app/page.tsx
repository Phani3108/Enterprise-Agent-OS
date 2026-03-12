'use client';

import { useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { RightPanel } from '../components/RightPanel';
import CommandPalette from '../components/CommandPalette';
import HomeCommandCenter from '../components/HomeCommandCenter';
import IntentRouter from '../components/IntentRouter';
import { LibrarySkillsView } from '../components/LibrarySkillsView';
import { WorkflowBuilder } from '../components/WorkflowBuilder';
import { AICoursesHub } from '../components/AICoursesHub';
import { PromptLibrary } from '../components/PromptLibrary';
import { KnowledgeExplorer } from '../components/KnowledgeExplorer';
import { ToolsRegistry } from '../components/ToolsRegistry';
import AgentsPanel from '../components/AgentsPanel';
import { MarketingHub } from '../components/MarketingHub';
import { EngineeringHub } from '../components/EngineeringHub';
import { ProductHub } from '../components/ProductHub';
import { OpsExecutionsView } from '../components/OpsExecutionsView';
import AgentCollaboration from '../components/AgentCollaboration';
import { AdminUsageView } from '../components/AdminUsageView';
import GovernanceDashboard from '../components/GovernanceDashboard';
import SettingsPanel from '../components/SettingsPanel';
import { DiscussionForum } from '../components/DiscussionForum';
import { BlogEditor } from '../components/BlogEditor';
import TourOverlay from '../components/tour/TourOverlay';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import PlatformFooter from '../components/PlatformFooter';
import { assertProvenance } from '../lib/attribution';
import { useEAOSStore } from '../store/eaos-store';

function MainContent({ section }: { section: string }) {
  switch (section) {
    // Home
    case 'home':                    return <HomeCommandCenter />;

    // Workspaces
    case 'ws-marketing':            return <MarketingHub />;
    case 'ws-engineering':          return <EngineeringHub />;
    case 'ws-product':              return <ProductHub />;

    // Library
    case 'library-skills':          return <LibrarySkillsView />;
    case 'library-workflows':       return <WorkflowBuilder />;
    case 'library-prompts':         return <PromptLibrary />;
    case 'library-templates':       return <KnowledgeExplorer />;
    case 'library-agents':          return <AgentsPanel />;

    // Operations
    case 'ops-integrations':        return <ToolsRegistry />;
    case 'ops-executions':          return <OpsExecutionsView />;
    case 'ops-projects':            return <AgentCollaboration />;

    // Learning
    case 'learning-courses':        return <AICoursesHub />;
    case 'learning-playbooks':      return <PromptLibrary />;

    // Community
    case 'community-discussions':   return <DiscussionForum />;
    case 'community-blogs':         return <BlogEditor />;

    // Admin
    case 'admin-governance':        return <GovernanceDashboard />;
    case 'admin-usage':             return <AdminUsageView />;
    case 'admin-settings':          return <SettingsPanel />;

    default:                        return <HomeCommandCenter />;
  }
}

export default function Home() {
  const activeSection    = useEAOSStore(s => s.activeSection);
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const setCommandOpen   = useEAOSStore(s => s.setCommandOpen);
  const commandOpen      = useEAOSStore(s => s.commandOpen);

  useEffect(() => {
    setActiveSection('home');
    assertProvenance();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandOpen(!commandOpen); }
      if (e.key === 'Escape' && commandOpen) setCommandOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [commandOpen, setCommandOpen]);

  // Intent Router shown on skills/marketplace section
  const showIntentBar = activeSection === 'library-skills';

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        {showIntentBar && (
          <div className="px-6 py-2.5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            <IntentRouter />
          </div>
        )}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-auto">
            <MainContent section={activeSection} />
          </main>
          <RightPanel />
        </div>
        <PlatformFooter />
      </div>
      <CommandPalette />
      <TourOverlay />
      <OnboardingModal forceOpen={false} onClose={() => {}} />
    </div>
  );
}
