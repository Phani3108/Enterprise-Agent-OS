'use client';

import { useState, useEffect, useCallback } from 'react';
import { runMarketplaceSkill, type MarketplaceSkill } from '../lib/api';

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

interface IntentResult {
  query: string;
  personaId: string;
  personaName: string;
  personaIcon: string;
  personaColor: string;
  skill: MarketplaceSkill;
  confidence: number;
  entities: Record<string, string>;
  suggestedAlternatives: MarketplaceSkill[];
}

interface IntentRouterProps {
  onRunSkill?: (skill: MarketplaceSkill) => void;
  onIntentResult?: (result: IntentResult) => void;
  placeholder?: string;
  className?: string;
}

export default function IntentRouter({
  onRunSkill,
  onIntentResult,
  placeholder = 'What do you want to do? (e.g. Create PRD for AI feature, Launch campaign, Review PR)',
  className = '',
}: IntentRouterProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<IntentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [suggestions, setSuggestions] = useState<MarketplaceSkill[]>([]);

  const routeIntent = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${GATEWAY}/api/intent/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      });
      const data = await res.json();
      if (data.found && data.result) {
        setResult(data.result);
        onIntentResult?.(data.result);
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [onIntentResult]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 3) {
        routeIntent(query);
      } else {
        setResult(null);
        if (!query.trim()) {
          fetch(`${GATEWAY}/api/intent/suggestions?limit=6`)
            .then((r) => r.json())
            .then((d) => setSuggestions(d.suggestions || []))
            .catch(() => setSuggestions([]));
        }
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, routeIntent]);

  const handleRun = async (skill: MarketplaceSkill) => {
    setExecuting(true);
    try {
      const res = await runMarketplaceSkill(skill.id);
      onRunSkill?.(skill);
      setResult(null);
      setQuery('');
    } catch {
      // show error in future
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`} data-tour="intent-router">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
        />
        {loading && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">Detecting...</span>
        )}
      </div>

      {result && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: `${result.personaColor}20` }}
            >
              {result.personaIcon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{result.personaName}</span>
                <span className="text-xs text-gray-400">→</span>
                <span className="text-sm font-semibold text-gray-900">{result.skill.name}</span>
                <span className="text-[10px] text-gray-400">{(result.confidence * 100).toFixed(0)}% match</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{result.skill.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleRun(result.skill)}
                  disabled={executing}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {executing ? 'Running...' : 'Run Skill'}
                </button>
                {result.suggestedAlternatives.length > 0 && (
                  <span className="text-[10px] text-gray-400">
                    Or: {result.suggestedAlternatives.map((s) => s.name).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!query.trim() && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-gray-400 self-center">Try:</span>
          {suggestions.slice(0, 5).map((s) => (
            <button
              key={s.id}
              onClick={() => setQuery(s.name)}
              className="px-2 py-1 rounded-lg text-[10px] border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
