'use client';

/**
 * ConnectionsHub — top-level integrations management view
 * Browse all connectors by category, connect/disconnect/test each one.
 */

import { useState, useEffect } from 'react';
import {
  CONNECTOR_CATALOG,
  CATEGORY_META,
  ConnectorDef,
  ConnectorCategory,
  useConnectionsStore,
} from '../../store/connections-store';
import { ConnectorCard } from './ConnectorCard';
import { ConnectorModal } from './ConnectorModal';
import { useEAOSStore } from '../../store/eaos-store';

const SECTION_TO_CATEGORY: Record<string, ConnectorCategory | 'all'> = {
  'conn-ai-models': 'ai-models',
  'conn-storage':   'storage',
  'conn-design':    'design',
  'conn-crm':       'crm-ads',
  'conn-devtools':  'dev-tools',
  'conn-cms':       'cms',
  'conn-messaging': 'messaging',
  'conn-data':      'data',
};

const CATEGORIES: Array<ConnectorCategory | 'all'> = [
  'all', 'ai-models', 'storage', 'design', 'crm-ads', 'dev-tools', 'cms', 'messaging', 'data',
];

export function ConnectionsHub() {
  const { connections, activeCategory, setActiveCategory, getConnectedCount } = useConnectionsStore();
  const activeSection = useEAOSStore(s => s.activeSection);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorDef | null>(null);
  const [search, setSearch] = useState('');

  // Sync sidebar nav item → category filter
  useEffect(() => {
    const cat = SECTION_TO_CATEGORY[activeSection];
    if (cat) setActiveCategory(cat);
  }, [activeSection, setActiveCategory]);

  const connectedCount = getConnectedCount();
  const totalCount = CONNECTOR_CATALOG.length;
  const coveragePct = Math.round((connectedCount / totalCount) * 100);

  const filtered = CONNECTOR_CATALOG.filter(c => {
    if (activeCategory !== 'all' && c.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.capabilities.some(cap => cap.includes(q));
    }
    return true;
  });

  // Group by category for "all" view
  const grouped: Partial<Record<ConnectorCategory, ConnectorDef[]>> = {};
  for (const c of filtered) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category]!.push(c);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Connections</h1>
            <p className="text-xs text-gray-500 mt-0.5">Connect tools to unlock live execution across all skills and workflows.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-gray-900">{connectedCount} / {totalCount} connected</div>
              <div className="text-[10px] text-gray-400">{coveragePct}% coverage</div>
            </div>
            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${coveragePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search connectors by name or capability…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Category sidebar */}
        <div className="flex-shrink-0 w-48 bg-white border-r border-gray-200 overflow-y-auto py-3">
          {CATEGORIES.map(cat => {
            const meta = cat === 'all' ? null : CATEGORY_META[cat];
            const count = cat === 'all'
              ? CONNECTOR_CATALOG.length
              : CONNECTOR_CATALOG.filter(c => c.category === cat).length;
            const connCount = cat === 'all'
              ? connectedCount
              : CONNECTOR_CATALOG.filter(c => c.category === cat && (connections[c.id]?.status === 'connected' || connections[c.id]?.status === 'sandbox')).length;

            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  activeCategory === cat
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base leading-none">{meta?.icon ?? '🔌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{meta?.label ?? 'All Connectors'}</div>
                  <div className="text-[10px] text-gray-400">{connCount}/{count} connected</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm">No connectors match your search</div>
            </div>
          ) : activeCategory === 'all' ? (
            // Grouped view for "all"
            <div className="space-y-8">
              {(Object.keys(grouped) as ConnectorCategory[]).map(cat => {
                const items = grouped[cat] ?? [];
                if (items.length === 0) return null;
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">{meta.icon}</span>
                      <h2 className="text-xs font-semibold text-gray-700">{meta.label}</h2>
                      <span className="text-[10px] text-gray-400">— {meta.description}</span>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      {items.map(conn => (
                        <ConnectorCard
                          key={conn.id}
                          connector={conn}
                          state={connections[conn.id] ?? { connectorId: conn.id, status: 'not-connected' }}
                          onClick={() => setSelectedConnector(conn)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Single category view
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{CATEGORY_META[activeCategory as ConnectorCategory]?.icon}</span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{CATEGORY_META[activeCategory as ConnectorCategory]?.label}</h2>
                  <p className="text-xs text-gray-500">{CATEGORY_META[activeCategory as ConnectorCategory]?.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {filtered.map(conn => (
                  <ConnectorCard
                    key={conn.id}
                    connector={conn}
                    state={connections[conn.id] ?? { connectorId: conn.id, status: 'not-connected' }}
                    onClick={() => setSelectedConnector(conn)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Setup prompt if few connections */}
          {connectedCount <= 1 && (
            <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-6 text-center">
              <div className="text-2xl mb-2">🔌</div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Connect your tools to unlock live execution</h3>
              <p className="text-xs text-gray-500 mb-3 max-w-sm mx-auto">
                Skills and workflows run in Sandbox mode until you connect real tools. Connect your AI model, version control, and CRM to start executing live.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveCategory('ai-models')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                >
                  Start with AI Models
                </button>
                <button
                  onClick={() => setActiveCategory('dev-tools')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Connect Dev Tools
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connector modal */}
      {selectedConnector && (
        <ConnectorModal
          connector={selectedConnector}
          currentState={connections[selectedConnector.id] ?? { connectorId: selectedConnector.id, status: 'not-connected' }}
          onClose={() => setSelectedConnector(null)}
        />
      )}
    </div>
  );
}
