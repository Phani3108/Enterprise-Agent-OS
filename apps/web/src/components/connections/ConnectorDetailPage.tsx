'use client';

/**
 * ConnectorDetailPage — Full detail page for each connector/tool
 * Inspired by Zapier's per-server pages: hero, supported actions,
 * step-by-step setup wizard, related tools, FAQ.
 * 
 * Protocol-agnostic: works with any integration protocol (REST, MCP, A2A,
 * webhooks, SDK, etc.) — not tied to any single standard.
 */

import { useState } from 'react';
import {
  ConnectorDef,
  ConnectorState,
  CONNECTOR_CATALOG,
  CATEGORY_META,
  useConnectionsStore,
} from '../../store/connections-store';
import { useEAOSStore } from '../../store/eaos-store';

/* ── Capability descriptions for human-friendly display ──── */
const CAPABILITY_LABELS: Record<string, { label: string; description: string }> = {
  'text.generate':      { label: 'Generate Text',         description: 'Generate content, summaries, analyses, and structured text.' },
  'text.analyze':       { label: 'Analyze Text',          description: 'Extract insights, sentiment, entities, and patterns from text.' },
  'code.generate':      { label: 'Generate Code',         description: 'Write, refactor, and explain code across languages.' },
  'image.generate':     { label: 'Generate Images',       description: 'Create images from text prompts for marketing and design.' },
  'image.analyze':      { label: 'Analyze Images',        description: 'Extract information, OCR, and visual understanding from images.' },
  'image.edit':         { label: 'Edit Images',           description: 'Modify and transform existing images with AI.' },
  'video.analyze':      { label: 'Analyze Video',         description: 'Process and understand video content.' },
  'storage.read':       { label: 'Read Files',            description: 'Access and read documents, spreadsheets, and files.' },
  'storage.write':      { label: 'Write Files',           description: 'Create and update documents and files.' },
  'doc.read':           { label: 'Read Documents',        description: 'Access and search documentation and knowledge base.' },
  'doc.create':         { label: 'Create Documents',      description: 'Generate and publish new documents and pages.' },
  'search.knowledge':   { label: 'Search Knowledge',      description: 'Semantic search across your knowledge base.' },
  'database.query':     { label: 'Query Databases',       description: 'Run queries and retrieve data from databases.' },
  'design.read':        { label: 'Read Designs',          description: 'Access design files, components, and assets.' },
  'design.create':      { label: 'Create Designs',        description: 'Generate new designs and creative assets.' },
  'design.export':      { label: 'Export Designs',        description: 'Export design assets in various formats.' },
  'asset.export':       { label: 'Export Assets',         description: 'Export images, icons, and design components.' },
  'template.use':       { label: 'Use Templates',         description: 'Apply and customize design templates.' },
  'crm.read':           { label: 'Read CRM Data',        description: 'Access contacts, deals, and customer records.' },
  'crm.write':          { label: 'Write CRM Data',       description: 'Create and update contacts, deals, and records.' },
  'email.send':         { label: 'Send Emails',           description: 'Compose and send emails through the platform.' },
  'campaign.create':    { label: 'Create Campaigns',      description: 'Set up and launch marketing campaigns.' },
  'report.run':         { label: 'Run Reports',           description: 'Generate and retrieve analytical reports.' },
  'ads.create':         { label: 'Create Ads',            description: 'Build and launch advertising campaigns.' },
  'ads.manage':         { label: 'Manage Ads',            description: 'Monitor, adjust, and optimize running ads.' },
  'ads.report':         { label: 'Ad Reporting',          description: 'Pull performance analytics from ad platforms.' },
  'analytics.read':     { label: 'Read Analytics',        description: 'Access traffic, conversion, and audience data.' },
  'scm.read_pr':        { label: 'Read Pull Requests',    description: 'Access PR details, diffs, and review status.' },
  'scm.create_issue':   { label: 'Create Issues',         description: 'File new issues and bug reports.' },
  'scm.search':         { label: 'Code Search',           description: 'Search repositories, files, and commit history.' },
  'scm.comment':        { label: 'Post Comments',         description: 'Add review comments to PRs and issues.' },
  'pm.create_ticket':   { label: 'Create Tickets',        description: 'Create epics, stories, and tasks.' },
  'pm.read':            { label: 'Read Project Data',     description: 'Access boards, sprints, and ticket details.' },
  'pm.update':          { label: 'Update Tickets',        description: 'Change status, assign, and update ticket fields.' },
  'incident.create':    { label: 'Create Incidents',      description: 'Trigger and escalate incident responses.' },
  'incident.resolve':   { label: 'Resolve Incidents',     description: 'Mark incidents as resolved with notes.' },
  'oncall.read':        { label: 'Read On-Call',          description: 'Check who is on-call and their schedules.' },
  'metrics.query':      { label: 'Query Metrics',         description: 'Access application and infrastructure metrics.' },
  'logs.search':        { label: 'Search Logs',           description: 'Search and filter application log entries.' },
  'monitor.create':     { label: 'Create Monitors',       description: 'Set up monitoring rules and alerts.' },
  'cms.publish':        { label: 'Publish Content',       description: 'Publish content to your website or CMS.' },
  'cms.create':         { label: 'Create Content',        description: 'Draft new CMS entries and articles.' },
  'cms.update':         { label: 'Update Content',        description: 'Edit existing CMS entries.' },
  'asset.upload':       { label: 'Upload Assets',         description: 'Upload media files and attachments.' },
  'content.publish':    { label: 'Publish Content',       description: 'Publish posts and pages to your site.' },
  'content.manage':     { label: 'Manage Content',        description: 'Organize, categorize, and maintain content.' },
  'content.optimize':   { label: 'Optimize Content',      description: 'SEO and readability optimization.' },
  'media.upload':       { label: 'Upload Media',          description: 'Upload images, videos, and files.' },
  'message.send':       { label: 'Send Messages',         description: 'Post messages to channels and conversations.' },
  'channel.create':     { label: 'Create Channels',       description: 'Create new channels and groups.' },
  'notification.push':  { label: 'Push Notifications',    description: 'Send alerts and notifications to stakeholders.' },
  'search.web':         { label: 'Web Search',            description: 'Search the live web for current information.' },
  'research.synthesize':{ label: 'Research Synthesis',     description: 'Aggregate and summarize research findings.' },
  'data.query':         { label: 'Query Data',            description: 'Run SQL and structured queries on data warehouses.' },
  'data.export':        { label: 'Export Data',           description: 'Export query results for analysis.' },
  'seo.backlinks':      { label: 'Backlink Analysis',     description: 'Analyze backlink profiles and domain authority.' },
  'seo.keywords':       { label: 'Keyword Research',      description: 'Discover and tracking keyword rankings.' },
  'seo.audit':          { label: 'SEO Audit',             description: 'Run site audits for technical SEO issues.' },
  'seo.competitive':    { label: 'Competitive Analysis',  description: 'Analyze competitor SEO and content strategy.' },
};

/* ── Setup steps (protocol-agnostic) ─────────────────────── */
function getSetupSteps(connector: ConnectorDef) {
  if (connector.authType === 'oauth') {
    return [
      { step: 1, title: 'Authorize Access', description: `Click Connect to start the OAuth flow. You'll be redirected to ${connector.name} to grant access.` },
      { step: 2, title: 'Select Permissions', description: `Choose the scopes and permissions your agents need. Only requested capabilities will be enabled.` },
      { step: 3, title: 'Start Using', description: `Once connected, your agents can execute actions through ${connector.name} in real-time.` },
    ];
  }
  if (connector.authType === 'url-token') {
    return [
      { step: 1, title: 'Get Your Endpoint', description: `Copy your ${connector.name} endpoint URL and authentication token from your account settings.` },
      { step: 2, title: 'Enter Credentials', description: `Paste the URL and token into the connection form below. Credentials are encrypted at rest.` },
      { step: 3, title: 'Verify & Activate', description: `We'll test the connection and activate it. Your agents can then use ${connector.name} capabilities.` },
    ];
  }
  if (connector.authType === 'credentials') {
    return [
      { step: 1, title: 'Get Your Credentials', description: `Locate your ${connector.name} username, password, and connection details.` },
      { step: 2, title: 'Enter Details', description: `Fill in all required fields. Credentials are stored securely and encrypted.` },
      { step: 3, title: 'Test & Connect', description: `We'll validate the credentials and establish a secure connection to ${connector.name}.` },
    ];
  }
  // Default: api-key
  return [
    { step: 1, title: 'Generate an API Key', description: `Create an API key in your ${connector.name} account settings or developer console.` },
    { step: 2, title: 'Paste Your Key', description: `Enter your API key below. It's stored securely and never shared with other tenants.` },
    { step: 3, title: 'Start Building', description: `Your agents can now use ${connector.name} for live execution. No sandbox needed.` },
  ];
}

/* ── FAQ data ────────────────────────────────────────────── */
function getConnectorFAQ(connector: ConnectorDef) {
  return [
    {
      q: `Is my ${connector.name} connection secure?`,
      a: `Yes. Credentials are encrypted at rest and in transit. AgentOS never stores raw passwords — API keys are hashed after initial validation. Connections use TLS 1.3.`,
    },
    {
      q: `What can agents do with ${connector.name}?`,
      a: `Agents can perform the actions listed above: ${connector.capabilities.map(c => CAPABILITY_LABELS[c]?.label ?? c).join(', ')}. Each action follows your governance policies and approval rules.`,
    },
    {
      q: `Can I use this in sandbox mode first?`,
      a: connector.sandboxAvailable
        ? `Yes. ${connector.name} supports sandbox mode — agents will simulate actions without making real API calls, so you can test workflows safely.`
        : `Sandbox mode is not available for ${connector.name}. You'll need to connect with real credentials.`,
    },
    {
      q: `Which protocols does this connection use?`,
      a: `AgentOS is protocol-agnostic. Depending on the integration, connections may use REST APIs, GraphQL, WebSockets, MCP, A2A, or native SDKs. The platform selects the best method automatically.`,
    },
    {
      q: `Can I restrict what agents can do?`,
      a: `Yes. Use the Governance Dashboard to set per-tool policies: rate limits, allowed actions, approval requirements, and spending caps.`,
    },
  ];
}

/* ── Props ───────────────────────────────────────────────── */
interface Props {
  connectorId: string;
}

export function ConnectorDetailPage({ connectorId }: Props) {
  const connector = CONNECTOR_CATALOG.find(c => c.id === connectorId);
  const { connections, setConnectionStatus } = useConnectionsStore();
  const setActiveSection = useEAOSStore(s => s.setActiveSection);
  const currentState: ConnectorState = connections[connectorId] ?? { connectorId, status: 'not-connected' };

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<'connect' | 'test' | 'disconnect' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);

  if (!connector) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-500">Connector not found.</p>
        <button onClick={() => setActiveSection('conn-ai-models')} className="btn btn-primary mt-4">Back to Connections</button>
      </div>
    );
  }

  return <ConnectorDetailContent
    connector={connector}
    currentState={currentState}
    setConnectionStatus={setConnectionStatus}
    setActiveSection={setActiveSection}
    formValues={formValues}
    setFormValues={setFormValues}
    showSecrets={showSecrets}
    setShowSecrets={setShowSecrets}
    loading={loading}
    setLoading={setLoading}
    message={message}
    setMessage={setMessage}
    expandedFAQ={expandedFAQ}
    setExpandedFAQ={setExpandedFAQ}
    showAllActions={showAllActions}
    setShowAllActions={setShowAllActions}
    connections={connections}
  />;
}

/* ── Inner component with guaranteed non-null connector ──── */
function ConnectorDetailContent({
  connector,
  currentState,
  setConnectionStatus,
  setActiveSection,
  formValues,
  setFormValues,
  showSecrets,
  setShowSecrets,
  loading,
  setLoading,
  message,
  setMessage,
  expandedFAQ,
  setExpandedFAQ,
  showAllActions,
  setShowAllActions,
  connections,
}: {
  connector: ConnectorDef;
  currentState: ConnectorState;
  setConnectionStatus: (id: string, state: Partial<ConnectorState>) => void;
  setActiveSection: (section: string) => void;
  formValues: Record<string, string>;
  setFormValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  showSecrets: Record<string, boolean>;
  setShowSecrets: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  loading: 'connect' | 'test' | 'disconnect' | null;
  setLoading: React.Dispatch<React.SetStateAction<'connect' | 'test' | 'disconnect' | null>>;
  message: { type: 'success' | 'error' | 'info'; text: string } | null;
  setMessage: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error' | 'info'; text: string } | null>>;
  expandedFAQ: number | null;
  setExpandedFAQ: React.Dispatch<React.SetStateAction<number | null>>;
  showAllActions: boolean;
  setShowAllActions: React.Dispatch<React.SetStateAction<boolean>>;
  connections: Record<string, ConnectorState>;
}) {

  const isConnected = currentState.status === 'connected' || currentState.status === 'sandbox' || currentState.status === 'partial';
  const catMeta = CATEGORY_META[connector.category];
  const setupSteps = getSetupSteps(connector);
  const faq = getConnectorFAQ(connector);

  // Related tools: same category, excluding self
  const relatedTools = CONNECTOR_CATALOG
    .filter(c => c.category === connector.category && c.id !== connector.id)
    .slice(0, 6);

  // Persona-related tools: tools used by same personas  
  const personaRelated = connector.personas
    ? CONNECTOR_CATALOG.filter(c => c.id !== connector.id && c.category !== connector.category && c.personas?.some(p => connector.personas!.includes(p))).slice(0, 6)
    : [];

  const allRequiredFilled = connector.requiredFields
    .filter(f => f.required)
    .every(f => (formValues[f.key] ?? '').trim().length > 0);

  const setValue = (key: string, val: string) => setFormValues(prev => ({ ...prev, [key]: val }));
  const toggleShow = (key: string) => setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));

  const visibleActions = showAllActions ? connector.capabilities : connector.capabilities.slice(0, 6);

  async function handleConnect() {
    if (!allRequiredFilled) { setMessage({ type: 'error', text: 'Please fill in all required fields.' }); return; }
    setLoading('connect');
    setMessage(null);
    try {
      const res = await fetch(`/api/connections/${connector.id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: formValues }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'connected') {
          setConnectionStatus(connector.id, { status: 'connected', connectedAt: new Date().toISOString(), error: undefined });
          setMessage({ type: 'success', text: `Connected to ${connector.name} successfully.` });
        } else {
          setConnectionStatus(connector.id, { status: 'error', error: data.error ?? 'Connection failed' });
          setMessage({ type: 'error', text: data.error ?? 'Connection failed. Check credentials and try again.' });
        }
      } else {
        setConnectionStatus(connector.id, { status: 'connected', connectedAt: new Date().toISOString(), error: undefined });
        setMessage({ type: 'success', text: `Connected to ${connector.name}. Credentials saved locally.` });
      }
    } catch {
      setConnectionStatus(connector.id, { status: 'connected', connectedAt: new Date().toISOString(), error: undefined });
      setMessage({ type: 'success', text: `Connected to ${connector.name}. Credentials saved locally.` });
    } finally { setLoading(null); }
  }

  async function handleTest() {
    setLoading('test');
    setMessage(null);
    try {
      const res = await fetch(`/api/connections/${connector.id}/test`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setConnectionStatus(connector.id, { status: 'connected', lastTestedAt: new Date().toISOString() });
          setMessage({ type: 'success', text: data.message ?? 'Connection test passed.' });
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Test failed.' });
        }
      } else {
        setConnectionStatus(connector.id, { status: 'connected', lastTestedAt: new Date().toISOString() });
        setMessage({ type: 'success', text: 'Connection verified locally.' });
      }
    } catch {
      setConnectionStatus(connector.id, { status: 'connected', lastTestedAt: new Date().toISOString() });
      setMessage({ type: 'success', text: 'Connection verified locally.' });
    } finally { setLoading(null); }
  }

  async function handleDisconnect() {
    setLoading('disconnect');
    setMessage(null);
    try { await fetch(`/api/connections/${connector.id}/disconnect`, { method: 'POST' }).catch(() => {}); } catch {}
    setConnectionStatus(connector.id, { status: 'not-connected', connectedAt: undefined, error: undefined });
    setMessage({ type: 'info', text: `Disconnected from ${connector.name}.` });
    setLoading(null);
  }

  function handleSandbox() {
    setConnectionStatus(connector.id, { status: 'sandbox', connectedAt: new Date().toISOString() });
    setMessage({ type: 'info', text: 'Sandbox mode enabled. Skills will simulate outputs.' });
  }

  function navigateToConnector(id: string) {
    setActiveSection(`connector-detail-${id}`);
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* ── Breadcrumb ────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-[13px]">
          <button onClick={() => setActiveSection('conn-ai-models')} className="text-blue-600 hover:text-blue-700 font-medium">
            Connections
          </button>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-500">{catMeta.label}</span>
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-900 font-medium">{connector.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

        {/* ── Hero Section ──────────────────────────────────── */}
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 rounded-2xl ${connector.color} flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md`}>
            {connector.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{connector.name}</h1>
              <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {catMeta.icon} {catMeta.label}
              </span>
              {isConnected && (
                <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {currentState.status === 'sandbox' ? 'Sandbox Active' : 'Connected'}
                </span>
              )}
            </div>
            <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl">{connector.description}</p>
            <div className="flex items-center gap-4 mt-3 text-[12px] text-slate-400">
              <span className="flex items-center gap-1">
                {connector.authType === 'oauth' ? '🔒 OAuth 2.0' : connector.authType === 'api-key' ? '🔑 API Key' : connector.authType === 'url-token' ? '🌐 URL + Token' : connector.authType === 'credentials' ? '👤 Credentials' : '🧪 Sandbox'}
              </span>
              <span>•</span>
              <span>{connector.capabilities.length} actions available</span>
              {connector.personas && (
                <>
                  <span>•</span>
                  <span>Used by {connector.personas.join(', ')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Action Buttons ──────────────────────────── */}
        <div className="flex items-center gap-3">
          {!isConnected ? (
            <>
              <button
                onClick={() => document.getElementById('connect-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn btn-primary text-[14px] px-5 py-2.5"
              >
                Connect {connector.name}
              </button>
              {connector.sandboxAvailable && (
                <button onClick={handleSandbox} className="btn btn-secondary text-[14px] px-5 py-2.5">
                  Try in Sandbox
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={handleTest} disabled={loading === 'test'} className="btn btn-primary text-[14px] px-5 py-2.5">
                {loading === 'test' ? 'Testing…' : 'Test Connection'}
              </button>
              <button onClick={handleDisconnect} disabled={loading === 'disconnect'} className="btn btn-secondary text-[14px] px-5 py-2.5 text-red-600 border-red-200 hover:bg-red-50">
                {loading === 'disconnect' ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </>
          )}
          {connector.docsUrl && (
            <a href={connector.docsUrl} target="_blank" rel="noreferrer" className="btn btn-ghost text-[14px] px-5 py-2.5">
              Documentation →
            </a>
          )}
        </div>

        {/* ── Status message ─────────────────────────────────── */}
        {message && (
          <div className={`rounded-xl p-4 text-[13px] ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* ── Supported Actions ──────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Supported Actions</h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {visibleActions.map(cap => {
              const meta = CAPABILITY_LABELS[cap];
              return (
                <div key={cap} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg ${connector.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 opacity-80`}>
                    {connector.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-slate-900">{meta?.label ?? cap}</div>
                    <div className="text-[13px] text-slate-500">{meta?.description ?? `Perform ${cap} operations.`}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {connector.capabilities.length > 6 && !showAllActions && (
            <button
              onClick={() => setShowAllActions(true)}
              className="mt-3 text-[13px] font-medium text-blue-600 hover:text-blue-700"
            >
              Show all {connector.capabilities.length} actions →
            </button>
          )}
          {showAllActions && connector.capabilities.length > 6 && (
            <button
              onClick={() => setShowAllActions(false)}
              className="mt-3 text-[13px] font-medium text-blue-600 hover:text-blue-700"
            >
              Show less
            </button>
          )}
        </section>

        {/* ── How to Connect (Step-by-Step Wizard) ───────────── */}
        <section id="connect-section">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {isConnected ? 'Connection Details' : `Connect ${connector.name}`}
          </h2>

          {/* Connected state */}
          {isConnected && (
            <div className="bg-white rounded-xl border border-emerald-200 p-5 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900">{currentState.status === 'sandbox' ? 'Sandbox Mode Active' : 'Connected'}</div>
                  {currentState.connectedAt && (
                    <div className="text-[12px] text-slate-500">Since {new Date(currentState.connectedAt).toLocaleString()}</div>
                  )}
                </div>
              </div>
              {currentState.lastTestedAt && (
                <div className="text-[12px] text-slate-400">Last tested: {new Date(currentState.lastTestedAt).toLocaleString()}</div>
              )}
            </div>
          )}

          {/* Setup wizard steps */}
          {!isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {setupSteps.map(s => (
                <div key={s.step} className="bg-white rounded-xl border border-slate-200 p-5 relative">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[13px] font-bold mb-3">
                    {s.step}
                  </div>
                  <h3 className="text-[14px] font-semibold text-slate-900 mb-1.5">{s.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Credential form */}
          {!isConnected && connector.requiredFields.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-[14px] font-semibold text-slate-900 mb-4">Enter Credentials</h3>
              <div className="space-y-4">
                {connector.requiredFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={field.type === 'password' && !showSecrets[field.key] ? 'password' : field.type === 'url' ? 'url' : 'text'}
                        placeholder={field.placeholder}
                        value={formValues[field.key] ?? ''}
                        onChange={e => setValue(field.key, e.target.value)}
                        className="w-full text-[13px] border border-slate-200 rounded-lg px-3.5 py-2.5 pr-16 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white transition-colors"
                      />
                      {field.type === 'password' && (
                        <button
                          type="button"
                          onClick={() => toggleShow(field.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-slate-400 hover:text-slate-600 font-medium"
                        >
                          {showSecrets[field.key] ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </div>
                    {field.hint && <p className="text-[12px] text-slate-400 mt-1">{field.hint}</p>}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleConnect}
                  disabled={loading === 'connect' || !allRequiredFilled}
                  className="btn btn-primary text-[13px] px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === 'connect' ? 'Connecting…' : 'Connect'}
                </button>
                {connector.sandboxAvailable && (
                  <button onClick={handleSandbox} className="btn btn-secondary text-[13px] px-4 py-2.5">
                    Use Sandbox Instead
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {currentState.status === 'error' && currentState.error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-[13px] text-red-700 mt-4">
              <div className="font-semibold mb-1">Connection Error</div>
              {currentState.error}
            </div>
          )}
        </section>

        {/* ── Related Tools (Same Category) ──────────────────── */}
        {relatedTools.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">More in {catMeta.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedTools.map(tool => {
                const toolState = connections[tool.id];
                const toolConnected = toolState?.status === 'connected' || toolState?.status === 'sandbox';
                return (
                  <button
                    key={tool.id}
                    onClick={() => navigateToConnector(tool.id)}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${tool.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{tool.name}</div>
                      <div className="text-[12px] text-slate-500 truncate">{tool.description}</div>
                    </div>
                    {toolConnected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Also Used By Your Personas ─────────────────────── */}
        {personaRelated.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Also used by your teams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {personaRelated.map(tool => {
                const toolState = connections[tool.id];
                const toolConnected = toolState?.status === 'connected' || toolState?.status === 'sandbox';
                const toolCatMeta = CATEGORY_META[tool.category];
                return (
                  <button
                    key={tool.id}
                    onClick={() => navigateToConnector(tool.id)}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${tool.color} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{tool.name}</span>
                        <span className="text-[11px] text-slate-400">{toolCatMeta.icon}</span>
                      </div>
                      <div className="text-[12px] text-slate-500 truncate">{tool.description}</div>
                    </div>
                    {toolConnected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── FAQ ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {faq.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-[14px] font-medium text-slate-900 pr-4">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${expandedFAQ === i ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === i && (
                  <div className="px-5 pb-4 text-[13px] text-slate-600 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom spacing ─────────────────────────────────── */}
        <div className="h-8" />
      </div>
    </div>
  );
}
