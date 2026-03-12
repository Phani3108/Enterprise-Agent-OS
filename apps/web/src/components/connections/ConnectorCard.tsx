'use client';

import { ConnectorDef, ConnectorState, ConnectionStatus } from '../../store/connections-store';

interface Props {
  connector: ConnectorDef;
  state: ConnectorState;
  onClick: () => void;
}

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; dot: string; badge: string }> = {
  'connected':       { label: 'Connected',        dot: 'bg-emerald-500', badge: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  'not-connected':   { label: 'Not Connected',    dot: 'bg-gray-300',    badge: 'text-gray-500 bg-gray-50 border-gray-200' },
  'expired':         { label: 'Expired',          dot: 'bg-amber-400',   badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  'reauth-required': { label: 'Re-auth Required', dot: 'bg-amber-400',   badge: 'text-amber-700 bg-amber-50 border-amber-200' },
  'partial':         { label: 'Partial',          dot: 'bg-yellow-400',  badge: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  'error':           { label: 'Error',            dot: 'bg-red-500',     badge: 'text-red-700 bg-red-50 border-red-200' },
  'testing':         { label: 'Testing…',         dot: 'bg-blue-400',    badge: 'text-blue-700 bg-blue-50 border-blue-200' },
  'sandbox':         { label: 'Sandbox',          dot: 'bg-purple-400',  badge: 'text-purple-700 bg-purple-50 border-purple-200' },
};

export function ConnectorCard({ connector, state, onClick }: Props) {
  const cfg = STATUS_CONFIG[state.status] ?? STATUS_CONFIG['not-connected'];
  const isConnected = state.status === 'connected' || state.status === 'sandbox' || state.status === 'partial';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all group hover:shadow-md ${
        isConnected
          ? 'border-gray-200 bg-white hover:border-gray-300'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-lg ${connector.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
          {connector.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-xs font-semibold text-gray-900 truncate">{connector.name}</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border flex items-center gap-1 ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{connector.description}</p>

          {/* Capability chips — show first 2 */}
          <div className="flex flex-wrap gap-1 mt-2">
            {connector.capabilities.slice(0, 3).map(cap => (
              <span key={cap} className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">{cap}</span>
            ))}
            {connector.capabilities.length > 3 && (
              <span className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded">+{connector.capabilities.length - 3}</span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <span className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 text-xs mt-1">›</span>
      </div>

      {/* Auth type */}
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">
          {connector.authType === 'oauth' ? 'OAuth 2.0' :
           connector.authType === 'api-key' ? 'API Key' :
           connector.authType === 'url-token' ? 'URL + Token' :
           connector.authType === 'credentials' ? 'Credentials' : 'Sandbox'}
        </span>
        {connector.sandboxAvailable && state.status === 'not-connected' && (
          <span className="text-[9px] text-purple-500 font-medium">Sandbox available</span>
        )}
        {state.lastTestedAt && (
          <span className="text-[9px] text-gray-400">
            Tested {new Date(state.lastTestedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </button>
  );
}
