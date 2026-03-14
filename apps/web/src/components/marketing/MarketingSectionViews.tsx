/**
 * Marketing Section Views — Campaigns, Content Studio, etc.
 * Each section routes to relevant workflows or placeholder content.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { getWorkflowsByCluster, WORKFLOW_CLUSTERS, type WorkflowDef, type WorkflowCluster } from '../../lib/marketing-workflows';
import { useMarketingStore } from '../../store/marketing-store';

const byCluster = getWorkflowsByCluster();

function WorkflowGrid({ workflows, onSelect }: { workflows: WorkflowDef[]; onSelect: (wf: WorkflowDef) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {workflows.map((wf) => (
        <button
          key={wf.id}
          onClick={() => onSelect(wf)}
          className="flex flex-col gap-1.5 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-left transition-colors"
        >
          <span className="text-xl">{wf.icon}</span>
          <span className="text-sm font-semibold text-slate-900">{wf.name}</span>
          <span className="text-xs text-slate-500 line-clamp-2">{wf.description}</span>
        </button>
      ))}
    </div>
  );
}

export function MarketingCampaignsView() {
  const setActiveSection = useMarketingStore((s) => s.setActiveSection);
  const setSelectedWorkflowId = useMarketingStore((s) => s.setSelectedWorkflowId);
  const workflows = byCluster.Campaign ?? [];
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Campaign Orchestration</h2>
      <p className="text-sm text-slate-600">Webinars, product launches, ABM, paid media, nurture sequences.</p>
      <WorkflowGrid workflows={workflows} onSelect={(wf) => { setSelectedWorkflowId(wf.id); setActiveSection('skills'); }} />
    </div>
  );
}

export function MarketingContentStudioView() {
  const setActiveSection = useMarketingStore((s) => s.setActiveSection);
  const setSelectedWorkflowId = useMarketingStore((s) => s.setSelectedWorkflowId);
  const workflows = byCluster.Content ?? [];
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Content Studio</h2>
      <p className="text-sm text-slate-600">Blogs, newsletters, case studies, executive rewrites.</p>
      <WorkflowGrid workflows={workflows} onSelect={(wf) => { setSelectedWorkflowId(wf.id); setActiveSection('skills'); }} />
    </div>
  );
}

export function MarketingCreativeStudioView() {
  const setActiveSection = useMarketingStore((s) => s.setActiveSection);
  const setSelectedWorkflowId = useMarketingStore((s) => s.setSelectedWorkflowId);
  const workflows = byCluster.Creative ?? [];
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Creative Studio</h2>
      <p className="text-sm text-slate-600">LinkedIn creatives, standees, banners, ebook covers.</p>
      <WorkflowGrid workflows={workflows} onSelect={(wf) => { setSelectedWorkflowId(wf.id); setActiveSection('skills'); }} />
    </div>
  );
}

export function MarketingResearchHubView() {
  const setActiveSection = useMarketingStore((s) => s.setActiveSection);
  const setSelectedWorkflowId = useMarketingStore((s) => s.setSelectedWorkflowId);
  const workflows = byCluster.Research ?? [];
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Research Hub</h2>
      <p className="text-sm text-slate-600">Competitive intel, trends, messaging gaps, account research.</p>
      <WorkflowGrid workflows={workflows} onSelect={(wf) => { setSelectedWorkflowId(wf.id); setActiveSection('skills'); }} />
    </div>
  );
}

export function MarketingAnalyticsHubView() {
  const setActiveSection = useMarketingStore((s) => s.setActiveSection);
  const setSelectedWorkflowId = useMarketingStore((s) => s.setSelectedWorkflowId);
  const workflows = byCluster.Analytics ?? [];
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Analytics Hub</h2>
      <p className="text-sm text-slate-600">Campaign performance, funnel diagnosis, channel comparison.</p>
      <WorkflowGrid workflows={workflows} onSelect={(wf) => { setSelectedWorkflowId(wf.id); setActiveSection('skills'); }} />
    </div>
  );
}

export function MarketingEventsView() {
  const setActiveSection = useMarketingStore((s) => s.setActiveSection);
  const setSelectedWorkflowId = useMarketingStore((s) => s.setSelectedWorkflowId);
  const workflows = byCluster.Event ?? [];
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Event Marketing</h2>
      <p className="text-sm text-slate-600">Promo kits, booth messaging, account outreach, follow-ups.</p>
      <WorkflowGrid workflows={workflows} onSelect={(wf) => { setSelectedWorkflowId(wf.id); setActiveSection('skills'); }} />
    </div>
  );
}

export function MarketingSalesEnableView() {
  const setActiveSection = useMarketingStore((s) => s.setActiveSection);
  const setSelectedWorkflowId = useMarketingStore((s) => s.setSelectedWorkflowId);
  const workflows = byCluster.Sales ?? [];
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Sales Enablement</h2>
      <p className="text-sm text-slate-600">One-pagers, battlecards, meeting briefs.</p>
      <WorkflowGrid workflows={workflows} onSelect={(wf) => { setSelectedWorkflowId(wf.id); setActiveSection('skills'); }} />
    </div>
  );
}

export function MarketingWebsiteSEOView() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Website / SEO</h2>
      <p className="text-sm text-slate-600">SEO workflows and website optimization. Coming soon.</p>
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
        SEO workflows will be available in a future release.
      </div>
    </div>
  );
}
