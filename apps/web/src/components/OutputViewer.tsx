/**
 * OutputViewer — Renders structured execution output with export actions.
 * Supports: Copy to clipboard, Download as text, Share link.
 * Shows per-step output tabs + aggregated view.
 */
'use client';

import { useState, useRef, useCallback } from 'react';
import type { Execution } from '../store/execution-store';

interface Props {
  execution: Execution;
  isRunning: boolean;
}

export function OutputViewer({ execution, isRunning }: Props) {
  const outputs = execution.outputs ?? {};
  const outputKeys = Object.keys(outputs);
  const [activeKey, setActiveKey] = useState<string | null>(
    outputKeys.length > 0 ? outputKeys[0] : null
  );
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Copy ──────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    const text = activeKey && outputs[activeKey]
      ? String(outputs[activeKey])
      : getAllOutputText(outputs);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard API blocked */ }
  }, [activeKey, outputs]);

  // ── Download ──────────────────────────────────────────────────────────
  const handleDownload = useCallback((format: 'txt' | 'md' | 'csv') => {
    const text = format === 'csv'
      ? toCSV(outputs)
      : getAllOutputText(outputs);
    const mime = format === 'csv' ? 'text/csv' : 'text/plain';
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${execution.skillName.replace(/\s+/g, '-').toLowerCase()}-output.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [outputs, execution.skillName]);

  // ── No output yet ─────────────────────────────────────────────────────
  if (outputKeys.length === 0) {
    return (
      <div className="card p-8 text-center">
        {isRunning ? (
          <>
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[14px] text-slate-600">Generating output…</p>
            <p className="text-[12px] text-slate-400 mt-1">Results will appear here as each step completes.</p>
          </>
        ) : (
          <>
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[14px] text-slate-500">No output generated.</p>
          </>
        )}
      </div>
    );
  }

  // ── Has output ────────────────────────────────────────────────────────
  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {outputKeys.length > 1 && (
            <>
              <button
                onClick={() => setActiveKey(null)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors ${
                  activeKey === null ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {outputKeys.map(key => (
                <button
                  key={key}
                  onClick={() => setActiveKey(key)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition-colors ${
                    activeKey === key ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {formatKey(key)}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="btn btn-secondary text-[12px] py-1.5 px-3 flex items-center gap-1.5">
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>

          <div className="relative group">
            <button className="btn btn-secondary text-[12px] py-1.5 px-3 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => handleDownload('md')} className="w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50">
                Markdown (.md)
              </button>
              <button onClick={() => handleDownload('txt')} className="w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50">
                Plain text (.txt)
              </button>
              <button onClick={() => handleDownload('csv')} className="w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50">
                CSV (.csv)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Output content */}
      <div ref={contentRef} className="card p-5">
        {activeKey && outputs[activeKey] ? (
          <OutputBlock label={formatKey(activeKey)} content={String(outputs[activeKey])} />
        ) : (
          <div className="space-y-6">
            {outputKeys.map(key => (
              <OutputBlock key={key} label={formatKey(key)} content={String(outputs[key])} />
            ))}
          </div>
        )}
      </div>

      {/* Metadata footer */}
      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
        <span>
          {execution.persona} · {execution.skillName}
          {execution.simulate && ' · Simulation'}
        </span>
        <span>
          {new Date(execution.startedAt).toLocaleString()}
          {execution.completedAt && (
            <> · {((new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000).toFixed(1)}s</>
          )}
        </span>
      </div>
    </div>
  );
}

// ── Output block renderer ──────────────────────────────────────────────────

function OutputBlock({ label, content }: { label: string; content: string }) {
  const [expanded, setExpanded] = useState(true);
  const isLong = content.length > 500;

  return (
    <div>
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 hover:text-slate-900 transition-colors mb-2"
      >
        <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {label}
      </button>
      {expanded && (
        <div className="pl-5.5">
          <div className={`text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap ${isLong ? '' : ''}`}>
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function getAllOutputText(outputs: Record<string, unknown>): string {
  return Object.entries(outputs)
    .map(([key, val]) => `## ${formatKey(key)}\n\n${String(val)}`)
    .join('\n\n---\n\n');
}

function toCSV(outputs: Record<string, unknown>): string {
  const rows: string[][] = [['Key', 'Output']];
  for (const [key, val] of Object.entries(outputs)) {
    const text = String(val).replace(/"/g, '""');
    rows.push([formatKey(key), `"${text}"`]);
  }
  return rows.map(r => r.join(',')).join('\n');
}
