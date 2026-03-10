'use client';

import { useState, useEffect } from 'react';
import { useEAOSStore } from '../store/eaos-store';

interface PersonaSummary {
  id: string; name: string; icon: string; color: string; description: string;
  skillCount: number; agentCount: number; toolCount: number;
}

interface Skill {
  id: string; name: string; description: string; agents: string[];
  estimatedTime: string; complexity: 'simple' | 'moderate' | 'complex';
  outputs: string[];
}

interface SkillCategory { name: string; skills: Skill[]; }

interface AgentDef {
  id: string; name: string; description: string; tools: string[];
  status: 'active' | 'beta' | 'coming_soon';
}

interface ToolDef {
  id: string; name: string; icon: string; category: string;
  authType: string; connected: boolean; description: string;
}

interface Course {
  id: string; title: string; provider: string; duration: string;
  level: string; url: string;
}

interface FullPersona {
  id: string; name: string; icon: string; color: string; description: string;
  skillCategories: SkillCategory[]; agents: AgentDef[]; tools: ToolDef[];
  courses: Course[]; promptExamples: string[];
}

interface LicenseRecord {
  toolId: string; toolName: string; icon: string; totalLicenses: number;
  usedLicenses: number; costPerMonth: number; expirationDate: string;
  usageFrequency: number;
  users: { userId: string; name: string; lastUsed: string; role: string }[];
}

interface LicenseSummary {
  totalCost: number; totalUsers: number; unusedLicenses: number; expiringWithin90Days: number;
}

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

const COMPLEXITY_BADGE: Record<string, { label: string; className: string }> = {
  simple: { label: 'Simple', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  moderate: { label: 'Moderate', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  complex: { label: 'Complex', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

type Tab = 'skills' | 'agents' | 'tools' | 'courses';

export default function PersonaSkillsView() {
  const [personas, setPersonas] = useState<PersonaSummary[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<string>('product');
  const [persona, setPersona] = useState<FullPersona | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('skills');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [executingSkill, setExecutingSkill] = useState<Skill | null>(null);
  const [executionSteps, setExecutionSteps] = useState<{ agent: string; status: string; output?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<{ totalPersonas: number; totalSkills: number; totalAgents: number; totalTools: number; totalCourses: number } | null>(null);

  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [licenseSummary, setLicenseSummary] = useState<LicenseSummary | null>(null);

  useEffect(() => {
    fetch(`${GATEWAY}/api/personas`).then(r => r.json()).then(d => {
      setPersonas(d.personas || []);
      setStats(d.stats || null);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPersona) return;
    fetch(`${GATEWAY}/api/personas/${selectedPersona}`).then(r => r.json()).then(d => {
      setPersona(d.persona || null);
      setActiveTab('skills');
      setExpandedCategory(d.persona?.skillCategories?.[0]?.name || null);
    }).catch(() => {});
  }, [selectedPersona]);

  useEffect(() => {
    if (selectedPersona === 'corpit') {
      fetch(`${GATEWAY}/api/licenses`).then(r => r.json()).then(d => {
        setLicenses(d.licenses || []);
        setLicenseSummary(d.summary || null);
      }).catch(() => {});
    }
  }, [selectedPersona]);

  const simulateExecution = (skill: Skill) => {
    setExecutingSkill(skill);
    setExecutionSteps([]);
    const agents = skill.agents;
    agents.forEach((agentId, i) => {
      setTimeout(() => {
        setExecutionSteps(prev => [...prev, { agent: agentId, status: 'running' }]);
        setTimeout(() => {
          setExecutionSteps(prev => prev.map((s, idx) =>
            idx === i ? { ...s, status: 'complete', output: `${skill.outputs[i % skill.outputs.length]} generated` } : s
          ));
        }, 1500 + Math.random() * 1000);
      }, i * 2000);
    });
  };

  const filteredCategories = persona?.skillCategories?.map(cat => ({
    ...cat,
    skills: searchQuery
      ? cat.skills.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : cat.skills,
  })).filter(cat => cat.skills.length > 0);

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'skills', label: 'Skills', count: persona?.skillCategories?.reduce((s, c) => s + c.skills.length, 0) },
    { key: 'agents', label: 'Agents', count: persona?.agents?.length },
    { key: 'tools', label: 'Tools', count: persona?.tools?.length },
    { key: 'courses', label: 'Courses', count: persona?.courses?.length },
  ];

  return (
    <div className="flex h-full" data-tour="persona-skills-view">
      {/* Left — Persona Selector */}
      <div className="w-56 border-r border-gray-200 bg-gray-50/50 overflow-y-auto flex-shrink-0" data-tour="persona-selector">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Personas</h2>
          {stats && (
            <p className="text-[10px] text-gray-400 mt-1">{stats.totalPersonas} personas · {stats.totalSkills} skills</p>
          )}
        </div>
        <div className="py-1">
          {personas.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPersona(p.id)}
              className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-left transition-all text-sm ${
                selectedPersona === p.id
                  ? 'bg-white text-gray-900 font-medium shadow-sm border-r-2'
                  : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
              }`}
              style={selectedPersona === p.id ? { borderRightColor: p.color } : {}}
            >
              <span className="text-lg">{p.icon}</span>
              <div className="min-w-0">
                <div className="truncate">{p.name}</div>
                <div className="text-[10px] text-gray-400">{p.skillCount} skills</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center — Skills / Agents / Tools / Courses */}
      <div className="flex-1 overflow-y-auto" data-tour="skills-dashboard">
        {persona && (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${persona.color}15` }}>
                  {persona.icon}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{persona.name}</h1>
                  <p className="text-sm text-gray-500">{persona.description}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-2">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      activeTab === tab.key
                        ? 'bg-gray-900 text-white font-medium'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-gray-300' : 'text-gray-400'}`}>{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'skills' && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {/* ── Skills tab ── */}
              {activeTab === 'skills' && (
                <div className="space-y-4">
                  {filteredCategories?.map(cat => (
                    <div key={cat.name} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{cat.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{cat.skills.length}</span>
                        </div>
                        <span className="text-gray-400 text-xs">{expandedCategory === cat.name ? '▾' : '▸'}</span>
                      </button>
                      {expandedCategory === cat.name && (
                        <div className="border-t border-gray-100">
                          {cat.skills.map(skill => (
                            <div
                              key={skill.id}
                              className="flex items-start justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors group"
                            >
                              <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${COMPLEXITY_BADGE[skill.complexity].className}`}>
                                    {COMPLEXITY_BADGE[skill.complexity].label}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{skill.description}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                                  <span>⏱ {skill.estimatedTime}</span>
                                  <span>→ {skill.outputs.join(', ')}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => simulateExecution(skill)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                              >
                                Run
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Prompt examples */}
                  {persona.promptExamples.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Example prompts</h3>
                      <div className="flex flex-wrap gap-2">
                        {persona.promptExamples.map((p, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                            &ldquo;{p}&rdquo;
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Agents tab ── */}
              {activeTab === 'agents' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {persona.agents.map(agent => (
                    <div key={agent.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${persona.color}15` }}>
                          🤖
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">{agent.name}</span>
                          <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full border ${
                            agent.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            agent.status === 'beta' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {agent.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{agent.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Tools tab ── */}
              {activeTab === 'tools' && (
                <div className="space-y-3">
                  {persona.tools.map(tool => (
                    <div key={tool.id} className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-white hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{tool.icon}</span>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                          <span className="text-xs text-gray-400 ml-2">{tool.category}</span>
                          <p className="text-xs text-gray-500">{tool.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{tool.authType}</span>
                        {tool.connected ? (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-medium">Connected</span>
                        ) : (
                          <button className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Courses tab ── */}
              {activeTab === 'courses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {persona.courses.map(course => (
                    <a
                      key={course.id}
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow block"
                    >
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{course.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{course.provider}</span>
                        <span>·</span>
                        <span>{course.duration}</span>
                        <span>·</span>
                        <span className={`px-1.5 py-0.5 rounded border ${
                          course.level === 'beginner' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          course.level === 'intermediate' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-rose-50 text-rose-600 border-rose-200'
                        }`}>
                          {course.level}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* ── Corp IT License Governance (only for corpit persona) ── */}
              {selectedPersona === 'corpit' && activeTab === 'skills' && licenseSummary && (
                <div className="mt-8 border-t border-gray-200 pt-6" data-tour="license-governance">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">License Governance Dashboard</h3>

                  {/* Summary cards */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Monthly Cost', value: `$${licenseSummary.totalCost.toLocaleString()}`, color: '#3b82f6' },
                      { label: 'Active Users', value: licenseSummary.totalUsers.toLocaleString(), color: '#10b981' },
                      { label: 'Unused Licenses', value: licenseSummary.unusedLicenses.toString(), color: '#f59e0b' },
                      { label: 'Expiring Soon', value: licenseSummary.expiringWithin90Days.toString(), color: '#ef4444' },
                    ].map(card => (
                      <div key={card.label} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <p className="text-xs text-gray-500">{card.label}</p>
                        <p className="text-2xl font-semibold mt-1" style={{ color: card.color }}>{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* License table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Tool</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Users</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Cost/mo</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Usage</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Expiration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {licenses.map(lic => (
                          <tr key={lic.toolId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span>{lic.icon}</span>
                                <span className="font-medium text-gray-900">{lic.toolName}</span>
                              </div>
                            </td>
                            <td className="text-right px-4 py-3 text-gray-600">{lic.usedLicenses}/{lic.totalLicenses}</td>
                            <td className="text-right px-4 py-3 text-gray-600">${lic.costPerMonth.toLocaleString()}</td>
                            <td className="text-right px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${lic.usageFrequency}%`,
                                      backgroundColor: lic.usageFrequency > 80 ? '#10b981' : lic.usageFrequency > 50 ? '#f59e0b' : '#ef4444',
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{lic.usageFrequency}%</span>
                              </div>
                            </td>
                            <td className="text-right px-4 py-3 text-xs text-gray-500">{lic.expirationDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right — Execution Panel */}
      {executingSkill && (
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0" data-tour="skill-execution">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Execution</h3>
              <button onClick={() => { setExecutingSkill(null); setExecutionSteps([]); }} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="text-xs text-gray-500 mt-1">{executingSkill.name}</p>
          </div>

          <div className="p-4">
            {/* Agent timeline */}
            <div className="space-y-3">
              {executingSkill.agents.map((agentId, i) => {
                const step = executionSteps[i];
                return (
                  <div key={agentId} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {!step ? (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                      ) : step.status === 'running' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">✓</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{agentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                      {step?.status === 'running' && <p className="text-xs text-blue-600 mt-0.5">Running...</p>}
                      {step?.status === 'complete' && <p className="text-xs text-emerald-600 mt-0.5">{step.output}</p>}
                      {!step && <p className="text-xs text-gray-400 mt-0.5">Queued</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Outputs */}
            {executionSteps.length > 0 && executionSteps.every(s => s.status === 'complete') && (
              <div className="mt-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-semibold text-emerald-800 mb-1">Outputs ready</p>
                <ul className="space-y-1">
                  {executingSkill.outputs.map((o, i) => (
                    <li key={i} className="text-xs text-emerald-700 flex items-center gap-1.5">
                      <span className="text-emerald-500">✓</span> {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
