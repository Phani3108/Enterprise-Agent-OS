'use client';

import { useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { RightPanel } from '../components/RightPanel';
import CommandPalette from '../components/CommandPalette';
import HomeCommandCenter from '../components/HomeCommandCenter';
import IntentRouter from '../components/IntentRouter';

import { ToolsRegistry } from '../components/ToolsRegistry';
import AgentsPanel from '../components/AgentsPanel';
import { MarketingHub } from '../components/MarketingHub';
import { EngineeringHub } from '../components/EngineeringHub';
import { ProductHub } from '../components/ProductHub';
import { HRHub } from '../components/HRHub';
import { OpsExecutionsView } from '../components/OpsExecutionsView';

import { AdminUsageView } from '../components/AdminUsageView';
import GovernanceDashboard from '../components/GovernanceDashboard';
import SettingsPanel from '../components/SettingsPanel';
import TourOverlay from '../components/tour/TourOverlay';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import PlatformFooter from '../components/PlatformFooter';
import { assertProvenance } from '../lib/attribution';
import { useEAOSStore } from '../store/eaos-store';
import { ConnectionsHub } from '../components/connections/ConnectionsHub';
import { ConnectorDetailPage } from '../components/connections/ConnectorDetailPage';
import { ExecutionScreen } from '../components/ExecutionScreen';
import { DiscussionForum } from '../components/DiscussionForum';
import { BlogEditor } from '../components/BlogEditor';
import { AICoursesHub } from '../components/AICoursesHub';
import CSuiteCommandCenter from '../components/CSuiteCommandCenter';
import VisionDashboard from '../components/VisionDashboard';
import NotificationCenter from '../components/NotificationCenter';
import InnovationLabs from '../components/InnovationLabs';
import BudgetIntelligence from '../components/BudgetIntelligence';
import AgentImprovement from '../components/AgentImprovement';

function MainContent({ section }: { section: string }) {
  // Dynamic connector detail pages: connector-detail-{connectorId}
  if (section.startsWith('connector-detail-')) {
    const connectorId = section.replace('connector-detail-', '');
    return <ConnectorDetailPage connectorId={connectorId} />;
  }

  switch (section) {
    // Home
    case 'home':                    return <HomeCommandCenter />;

    // C-Suite
    case 'csuite-command':          return <CSuiteCommandCenter />;
    case 'csuite-vision':           return <VisionDashboard />;

    // Workspaces
    case 'ws-marketing':            return <MarketingHub />;
    case 'ws-engineering':          return <EngineeringHub />;
    case 'ws-product':              return <ProductHub />;
    case 'ws-hr':                   return <HRHub />;

    // Execution Screens (launched from workspace hubs or sidebar)
    case 'exec-marketing':          return <ExecutionScreen persona="marketing" workspace="ws-marketing" />;
    case 'exec-engineering':        return <ExecutionScreen persona="engineering" workspace="ws-engineering" />;
    case 'exec-product':            return <ExecutionScreen persona="product" workspace="ws-product" />;
    case 'exec-hr':                 return <ExecutionScreen persona="hr" workspace="ws-hr" />;

    // Connections (all route to ConnectionsHub — the store tracks active category)
    case 'conn-ai-models':          return <ConnectionsHub />;
    case 'conn-storage':            return <ConnectionsHub />;
    case 'conn-design':             return <ConnectionsHub />;
    case 'conn-crm':                return <ConnectionsHub />;
    case 'conn-devtools':           return <ConnectionsHub />;
    case 'conn-cms':                return <ConnectionsHub />;
    case 'conn-messaging':          return <ConnectionsHub />;
    case 'conn-data':               return <ConnectionsHub />;

    // Platform (cross-persona)
    case 'platform-agents':         return <AgentsPanel />;
    case 'platform-courses':        return <AICoursesHub />;
    case 'platform-innovation':     return <InnovationLabs />;
    case 'platform-budget':         return <BudgetIntelligence />;
    case 'platform-improvement':    return <AgentImprovement />;

    // Operations
    case 'ops-integrations':        return <ToolsRegistry />;
    case 'ops-notifications':       return <NotificationCenter />;
    case 'ops-executions':          return <OpsExecutionsView />;
    case 'ops-discussions':         return <DiscussionForum />;
    case 'ops-blog':                return <BlogEditor />;

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

  // -----------------------------------------------------------------------
  // URL ↔ activeSection sync — enables deep-linking & back/forward nav
  // -----------------------------------------------------------------------

  // On mount: read URL path and navigate to the matching section
  useEffect(() => {
    const path = window.location.pathname.replace(/^\/+/, '') || 'home';
    setActiveSection(path);
    assertProvenance();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When activeSection changes: push to browser history
  useEffect(() => {
    const currentPath = window.location.pathname.replace(/^\/+/, '') || 'home';
    if (activeSection && activeSection !== currentPath) {
      window.history.pushState(null, '', `/${activeSection}`);
    }
  }, [activeSection]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname.replace(/^\/+/, '') || 'home';
      setActiveSection(path);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setActiveSection]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandOpen(!commandOpen); }
      if (e.key === 'Escape' && commandOpen) setCommandOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [commandOpen, setCommandOpen]);

  // Intent Router shown on skills/marketplace section
  const showIntentBar = false; // Intent router disabled — skills are inside persona hubs

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        {showIntentBar && (
          <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
            <IntentRouter />
          </div>
        )}
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-auto bg-slate-50">
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
