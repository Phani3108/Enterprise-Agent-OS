/**
 * Tool Connect Modal — Credential form for connecting marketing tools
 * Supports: API Key, OAuth access token entry, disconnect, test connection
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

import { useState, useEffect } from 'react';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

export interface ToolInfo {
  toolId: string;
  toolName: string;
  description?: string;
  icon?: string;
  category?: string;
  authType: 'oauth' | 'api_key';
  apiKeyLabel?: string;
  apiKeyHelpText?: string;
  apiKeyPlaceholder?: string;
  oauthNote?: string;
  websiteUrl?: string;
  connected: boolean;
  connectedAt?: string;
  accountName?: string;
}

interface ToolConnectModalProps {
  tool: ToolInfo;
  onClose: () => void;
  onConnected: (toolId: string, connected: boolean) => void;
}

type Phase = 'idle' | 'connecting' | 'testing' | 'disconnecting' | 'oauth';
type TestResult = { success: boolean; message: string } | null;

/** Vendors that support the gateway-side OAuth callback exchange. */
const OAUTH_CAPABLE = new Set(['slack', 'gdrive', 'hubspot', 'linkedin-ads', 'salesforce']);

export function ToolConnectModal({ tool, onClose, onConnected }: ToolConnectModalProps) {
  const [credentialValue, setCredentialValue] = useState('');
  const [accountName, setAccountName] = useState(tool.accountName ?? '');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Close on Escape
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleConnect = async () => {
    setError(null);
    setSuccessMsg(null);
    setTestResult(null);

    if (!credentialValue.trim() || credentialValue.trim().length < 8) {
      setError(`Please enter a valid ${tool.authType === 'api_key' ? 'API key' : 'access token'} (at least 8 characters).`);
      return;
    }

    setPhase('connecting');
    try {
      const payload: Record<string, string> = {};
      if (tool.authType === 'api_key') {
        payload.apiKey = credentialValue.trim();
      } else {
        payload.accessToken = credentialValue.trim();
      }
      if (accountName.trim()) payload.accountName = accountName.trim();

      const res = await fetch(`${GATEWAY_URL}/api/tools/${tool.toolId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Connection failed');
      }

      setSuccessMsg(data.message ?? `${tool.toolName} connected successfully`);
      onConnected(tool.toolId, true);
      setCredentialValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setPhase('idle');
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    setSuccessMsg(null);
    setPhase('disconnecting');
    try {
      const res = await fetch(`${GATEWAY_URL}/api/tools/${tool.toolId}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Disconnect failed');
      setSuccessMsg(`${tool.toolName} disconnected`);
      onConnected(tool.toolId, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    } finally {
      setPhase('idle');
    }
  };

  /**
   * Launch the vendor OAuth flow in a popup. The gateway's
   * /api/tools/:id/oauth/callback route handles the code exchange and posts a
   * result message back to window.opener, which we listen for here.
   */
  const handleOAuthConnect = () => {
    setError(null);
    setSuccessMsg(null);
    setTestResult(null);
    setPhase('oauth');

    const authorizeUrl = `${GATEWAY_URL}/api/tools/${tool.toolId}/connect`;
    const popup = window.open(authorizeUrl, 'agentos-oauth', 'width=600,height=720');
    if (!popup) {
      setError('Popup blocked — please allow popups for this site.');
      setPhase('idle');
      return;
    }

    const onMessage = (evt: MessageEvent) => {
      const d = evt.data as { type?: string; toolId?: string; success?: boolean; message?: string };
      if (d?.type !== 'oauth-result' || d.toolId !== tool.toolId) return;
      window.removeEventListener('message', onMessage);
      setPhase('idle');
      if (d.success) {
        setSuccessMsg(d.message || `${tool.toolName} connected via OAuth`);
        onConnected(tool.toolId, true);
      } else {
        setError(d.message || 'OAuth connection failed');
      }
    };
    window.addEventListener('message', onMessage);

    // Safety net: if the popup is closed manually without completion, reset.
    const watchdog = setInterval(() => {
      if (popup.closed) {
        clearInterval(watchdog);
        window.removeEventListener('message', onMessage);
        setPhase((p) => (p === 'oauth' ? 'idle' : p));
      }
    }, 1000);
  };

  const handleTest = async () => {
    setError(null);
    setTestResult(null);
    setPhase('testing');
    try {
      const res = await fetch(`${GATEWAY_URL}/api/tools/${tool.toolId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message });
    } catch {
      setTestResult({ success: false, message: 'Test request failed' });
    } finally {
      setPhase('idle');
    }
  };

  const isLoading = phase !== 'idle';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{tool.icon ?? '🔌'}</span>
            <div>
              <h2 className="text-base font-bold text-slate-900">{tool.toolName}</h2>
              {tool.category && <p className="text-xs text-slate-400">{tool.category}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Connection status badge */}
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${tool.connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className={`text-xs font-semibold ${tool.connected ? 'text-emerald-700' : 'text-slate-500'}`}>
              {tool.connected ? 'Connected' : 'Not Connected'}
            </span>
            {tool.connectedAt && (
              <span className="text-[11px] text-slate-400 ml-auto">
                Connected {new Date(tool.connectedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Description */}
          {tool.description && (
            <p className="text-sm text-slate-600">{tool.description}</p>
          )}

          {/* Credential input */}
          {!tool.connected && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {tool.apiKeyLabel ?? (tool.authType === 'api_key' ? 'API Key' : 'Access Token')}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={credentialValue}
                    onChange={(e) => setCredentialValue(e.target.value)}
                    placeholder={tool.apiKeyPlaceholder ?? (tool.authType === 'api_key' ? 'Enter API key…' : 'Enter access token…')}
                    className="w-full px-3 py-2 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleConnect(); }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                {tool.apiKeyHelpText && (
                  <p className="text-[11px] text-slate-500 mt-1">{tool.apiKeyHelpText}</p>
                )}
                {tool.oauthNote && tool.authType === 'oauth' && (
                  <p className="text-[11px] text-slate-500 mt-1">{tool.oauthNote}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Name (optional)</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Acme Corp HubSpot"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Already connected state */}
          {tool.connected && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-1">
              <p className="text-sm font-semibold text-emerald-800">Tool is connected</p>
              {tool.accountName && (
                <p className="text-xs text-emerald-700">Account: {tool.accountName}</p>
              )}
              <p className="text-xs text-emerald-600">
                Credentials are stored securely and will be used when this tool is invoked in a workflow.
              </p>
            </div>
          )}

          {/* Success/Error messages */}
          {successMsg && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-sm text-emerald-800 font-medium">✓ {successMsg}</p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800 font-medium">Error: {error}</p>
            </div>
          )}
          {testResult && (
            <div className={`rounded-lg border p-3 ${testResult.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-sm font-medium ${testResult.success ? 'text-emerald-800' : 'text-red-800'}`}>
                {testResult.success ? '✓' : '✗'} {testResult.message}
              </p>
            </div>
          )}

          {/* Website link */}
          {tool.websiteUrl && (
            <p className="text-[11px] text-slate-400">
              Get credentials at{' '}
              <span className="text-blue-500">{tool.websiteUrl}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center gap-2">
          {!tool.connected ? (
            <>
              {tool.authType === 'oauth' && OAUTH_CAPABLE.has(tool.toolId) && (
                <button
                  onClick={handleOAuthConnect}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {phase === 'oauth' ? 'Opening…' : `Sign in with ${tool.toolName}`}
                </button>
              )}
              <button
                onClick={handleConnect}
                disabled={isLoading || !credentialValue.trim()}
                className="flex-1 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {phase === 'connecting' ? 'Connecting…' : 'Paste Token'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleTest}
                disabled={isLoading}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {phase === 'testing' ? 'Testing…' : 'Test Connection'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="px-4 py-2.5 border border-red-200 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {phase === 'disconnecting' ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-slate-500 text-sm hover:text-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
