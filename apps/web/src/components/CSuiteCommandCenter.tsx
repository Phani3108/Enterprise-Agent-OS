'use client';
/**
 * CSuiteCommandCenter — C-Suite officer overview with OKRs, chain of command,
 * and vision-down execution status.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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

  useEffect(() => {
    fetch(`${API}/api/csuite`)
      .then(r => r.json())
      .then(data => { setOfficers(data.officers ?? []); setLoading(false); })
      .catch(() => setLoading(false));
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
