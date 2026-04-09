'use client';
/**
 * CSuiteCommandCenter — C-Suite officer overview with OKRs, chain of command,
 * and vision-down execution status.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { useState, useEffect } from 'react';
import DemoPreviewBanner from './shared/DemoPreviewBanner';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

// ── SevenLabs Demo C-Suite Officers ─────────────────────────
const DEMO_OFFICERS: CSuiteOfficer[] = [
  { agent: { id: 'hyperion', callSign: 'Hyperion', rank: 'Colonel', regiment: 'Titan', role: 'CMO' }, directReports: 4,
    profile: { missionStatement: 'Drive SevenLabs market presence and pipeline through AI-orchestrated campaigns.', commandsRegiment: 'Titan Regiment', budgetAuthority: '$1.2M/quarter', headcount: 12, quarterlyTargets: ['$2.4M pipeline', 'CAC < $180', '3 campaigns launched'],
      okrs: [{ id: 'okr-1', objective: 'Generate $2.4M marketing-sourced pipeline', owner: 'Hyperion', quarter: 'Q3 2026', status: 'on-track', keyResults: [
        { id: 'kr-1', description: 'Launch 3 integrated campaigns', target: '3', current: '2', progress: 67 },
        { id: 'kr-2', description: 'Achieve <$180 CAC', target: '$180', current: '$165', progress: 85 },
        { id: 'kr-3', description: 'Generate 500 MQLs', target: '500', current: '340', progress: 68 },
      ]}] } },
  { agent: { id: 'atlas', callSign: 'Atlas', rank: 'Colonel', regiment: 'Olympian', role: 'CTO' }, directReports: 6,
    profile: { missionStatement: 'Ship reliable, scalable fintech infrastructure with AI-assisted development.', commandsRegiment: 'Olympian Regiment', budgetAuthority: '$2.5M/quarter', headcount: 28, quarterlyTargets: ['99.9% uptime', 'MTTR < 2hr', 'Ship 5 features'],
      okrs: [{ id: 'okr-2', objective: 'Achieve 99.9% platform uptime', owner: 'Atlas', quarter: 'Q3 2026', status: 'at-risk', keyResults: [
        { id: 'kr-4', description: 'Zero P1 incidents lasting >30min', target: '0', current: '1', progress: 50 },
        { id: 'kr-5', description: 'Ship card modernization v2', target: 'Shipped', current: 'In Progress', progress: 65 },
        { id: 'kr-6', description: 'Reduce MTTR to <2 hours', target: '2hr', current: '1.8hr', progress: 90 },
      ]}] } },
  { agent: { id: 'themis', callSign: 'Themis', rank: 'Colonel', regiment: 'Asgard', role: 'CPO' }, directReports: 3,
    profile: { missionStatement: 'Define and deliver products that community banks love.', commandsRegiment: 'Asgard Regiment', budgetAuthority: '$800K/quarter', headcount: 8, quarterlyTargets: ['NPS > 60', '3 PRDs shipped', '2 competitive wins'],
      okrs: [{ id: 'okr-3', objective: 'Ship 3 product specs for Card Modernization', owner: 'Themis', quarter: 'Q3 2026', status: 'on-track', keyResults: [
        { id: 'kr-7', description: 'Complete Card Mod v2 PRD', target: 'Done', current: 'Done', progress: 100 },
        { id: 'kr-8', description: 'Achieve NPS > 60 for pilot banks', target: '60', current: '58', progress: 90 },
      ]}] } },
  { agent: { id: 'rhea', callSign: 'Rhea', rank: 'Colonel', regiment: 'Explorer', role: 'CHRO' }, directReports: 4,
    profile: { missionStatement: 'Build a world-class team while maintaining governance and compliance.', commandsRegiment: 'Explorer Regiment', budgetAuthority: '$600K/quarter', headcount: 6, quarterlyTargets: ['15 hires closed', 'Time-to-hire < 45d', '92% retention'],
      okrs: [{ id: 'okr-4', objective: 'Close 15 engineering hires for payments team', owner: 'Rhea', quarter: 'Q3 2026', status: 'on-track', keyResults: [
        { id: 'kr-9', description: 'Hire 3 senior engineers', target: '3', current: '1', progress: 33 },
        { id: 'kr-10', description: 'Time-to-hire < 45 days', target: '45d', current: '38d', progress: 80 },
      ]}] } },
  { agent: { id: 'chronos', callSign: 'Chronos', rank: 'Colonel', regiment: 'Vanguard', role: 'PMO Director' }, directReports: 2,
    profile: { missionStatement: 'Coordinate cross-functional execution with predictable delivery.', commandsRegiment: 'Vanguard Regiment', budgetAuthority: '$400K/quarter', headcount: 4, quarterlyTargets: ['4 launches on-time', 'Plan variance < 5%', 'RAID coverage 100%'],
      okrs: [{ id: 'okr-5', objective: 'Deliver Card Mod v2 launch on schedule', owner: 'Chronos', quarter: 'Q3 2026', status: 'on-track', keyResults: [
        { id: 'kr-11', description: 'All 5 workstreams on track', target: '5', current: '4', progress: 80 },
        { id: 'kr-12', description: 'Plan variance < 5%', target: '5%', current: '3.2%', progress: 90 },
      ]}] } },
];

interface OKRKeyResult {
  id: string;
  description: string;
  target: string;
  current: string;
  progress: number;
}

interface OKR {
  id: string;
  objective: string;
  owner: string;
  quarter: string;
  status: 'on-track' | 'at-risk' | 'behind' | 'completed';
  keyResults: OKRKeyResult[];
}

interface CSuiteProfile {
  missionStatement: string;
  commandsRegiment: string;
  okrs: OKR[];
  quarterlyTargets: string[];
  budgetAuthority: string;
  headcount: number;
}

interface AgentIdentity {
  id: string;
  callSign: string;
  rank: string;
  regiment: string;
  role: string;
}

interface CSuiteOfficer {
  agent: AgentIdentity;
  profile: CSuiteProfile;
  directReports: number;
}

const OFFICER_ICONS: Record<string, string> = {
  ceo: '👑', cmo: '📢', cto: '⚙️', cpo: '🧭', chro: '🌱', 'pmo-director': '📋',
};

const STATUS_COLORS: Record<string, string> = {
  'on-track': 'bg-emerald-100 text-emerald-700',
  'at-risk': 'bg-amber-100 text-amber-700',
  'behind': 'bg-red-100 text-red-700',
  'completed': 'bg-blue-100 text-blue-700',
};

export default function CSuiteCommandCenter() {
  const [officers, setOfficers] = useState<CSuiteOfficer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/csuite`)
      .then(r => r.json())
      .then(data => {
        if (data.officers?.length) { setOfficers(data.officers); }
        else { setOfficers(DEMO_OFFICERS); setIsDemo(true); }
        setLoading(false);
      })
      .catch(() => { setOfficers(DEMO_OFFICERS); setIsDemo(true); setLoading(false); });
  }, []);

  const selectedOfficer = officers.find(o => o.agent.id === selected);

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">🏛️</div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">C-Suite Command Center</h1>
              <p className="text-slate-300 text-sm mt-0.5">Titan Regiment — Executive Leadership Layer</p>
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-3 max-w-2xl">
            Strategic command layer where vision flows down through the chain of command.
            Each officer owns a regiment, sets OKRs, and holds their chain accountable for results.
          </p>
          {/* Summary stats */}
          <div className="flex gap-6 mt-6">
            <div className="bg-white/5 rounded-lg px-4 py-2">
              <div className="text-2xl font-bold">{officers.length}</div>
              <div className="text-xs text-slate-400">Officers</div>
            </div>
            <div className="bg-white/5 rounded-lg px-4 py-2">
              <div className="text-2xl font-bold">{officers.reduce((s, o) => s + (o.profile?.okrs?.length ?? 0), 0)}</div>
              <div className="text-xs text-slate-400">Active OKRs</div>
            </div>
            <div className="bg-white/5 rounded-lg px-4 py-2">
              <div className="text-2xl font-bold">{officers.reduce((s, o) => s + (o.profile?.headcount ?? 0), 0)}</div>
              <div className="text-xs text-slate-400">Total Headcount</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        {isDemo && <DemoPreviewBanner pageName="C-Suite Command" steps={[
          'Start the gateway — officers auto-load from the Agent Registry',
          'Each officer commands a regiment with OKRs and quarterly targets',
          'Click an officer to view their mission, budget, headcount, and key results',
        ]} />}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading C-Suite officers...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Officer Cards */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Executive Officers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {officers.map(officer => (
                  <button
                    key={officer.agent.id}
                    onClick={() => setSelected(officer.agent.id === selected ? null : officer.agent.id)}
                    className={`text-left rounded-xl border p-5 transition-all hover:shadow-md ${
                      officer.agent.id === selected
                        ? 'border-indigo-300 bg-indigo-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{OFFICER_ICONS[officer.agent.id] ?? '⭐'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900">{officer.agent.callSign}</div>
                        <div className="text-xs text-slate-500">{officer.agent.role}</div>
                        <div className="text-xs text-indigo-600 font-medium mt-1">
                          {officer.profile?.commandsRegiment ?? 'Cross-functional'} Regiment
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Headcount</div>
                        <div className="text-lg font-bold text-slate-700">{officer.profile?.headcount ?? 0}</div>
                      </div>
                    </div>

                    {/* Mission Statement */}
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2">{officer.profile?.missionStatement}</p>

                    {/* OKR Status Pills */}
                    {officer.profile?.okrs && officer.profile.okrs.length > 0 && (
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {officer.profile.okrs.map(okr => (
                          <span key={okr.id} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[okr.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {okr.status.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quarterly Targets */}
                    {officer.profile?.quarterlyTargets && officer.profile.quarterlyTargets.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {officer.profile.quarterlyTargets.slice(0, 2).map((t, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-[10px] text-slate-300 mt-0.5">▸</span>
                            <span className="text-[11px] text-slate-500">{t}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Officer Detail</h2>
              {selectedOfficer ? (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{OFFICER_ICONS[selectedOfficer.agent.id] ?? '⭐'}</span>
                    <div>
                      <div className="font-bold text-lg text-slate-900">{selectedOfficer.agent.callSign}</div>
                      <div className="text-sm text-slate-500">{selectedOfficer.agent.role}</div>
                    </div>
                  </div>

                  {/* Mission */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Mission</div>
                    <p className="text-sm text-slate-700">{selectedOfficer.profile?.missionStatement}</p>
                  </div>

                  {/* Budget & Regiment */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <div className="text-[10px] text-slate-400 uppercase">Budget</div>
                      <div className="text-sm font-semibold text-slate-700">{selectedOfficer.profile?.budgetAuthority}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg px-3 py-2">
                      <div className="text-[10px] text-slate-400 uppercase">Commands</div>
                      <div className="text-sm font-semibold text-slate-700">{selectedOfficer.profile?.commandsRegiment}</div>
                    </div>
                  </div>

                  {/* OKRs */}
                  {selectedOfficer.profile?.okrs && selectedOfficer.profile.okrs.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-2">OKRs</div>
                      {selectedOfficer.profile.okrs.map(okr => (
                        <div key={okr.id} className="mb-3 bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-800">{okr.objective}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[okr.status]}`}>
                              {okr.status.replace('-', ' ')}
                            </span>
                          </div>
                          {okr.keyResults.map(kr => (
                            <div key={kr.id} className="mb-1.5 last:mb-0">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-600">{kr.description}</span>
                                <span className="text-slate-400 ml-2 flex-shrink-0">{kr.current} / {kr.target}</span>
                              </div>
                              <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full transition-all"
                                  style={{ width: `${Math.min(kr.progress, 100)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quarterly Targets */}
                  {selectedOfficer.profile?.quarterlyTargets && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-slate-400 uppercase mb-2">Quarterly Targets</div>
                      <ul className="space-y-1.5">
                        {selectedOfficer.profile.quarterlyTargets.map((t, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="text-indigo-400 mt-0.5">◆</span>
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <div className="text-3xl mb-2">👈</div>
                  <p className="text-sm text-slate-400">Select an officer to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
