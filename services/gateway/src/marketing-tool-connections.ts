/**
 * Marketing Tool Connections — Real connection state engine
 * Mutable store: connect, disconnect, test per tool.
 * Check before execution, block if required tool not connected.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { CapabilityGraph } from './capability-graph.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionStatus = 'connected' | 'not_connected' | 'expired' | 'credentials_missing' | 'permission_insufficient';

export interface ToolConnectionResult {
  toolId: string;
  toolName: string;
  connected: boolean;
  authType: 'oauth' | 'api_key' | 'mcp' | 'none';
  connectUrl?: string;
  status: ConnectionStatus;
  connectedAt?: string;
  accountName?: string;
  description?: string;
  category?: string;
  icon?: string;
  capabilities?: string[];
}

interface StoredConnection {
  connected: boolean;
  authType: 'oauth' | 'api_key';
  apiKey?: string;
  accessToken?: string;
  accountName?: string;
  connectedAt?: string;
  status: ConnectionStatus;
}

// ---------------------------------------------------------------------------
// Tool Catalog — full definitions for the marketing integration set
// ---------------------------------------------------------------------------

export interface MarketingToolCatalog {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  authType: 'oauth' | 'api_key';
  capabilities: string[];
  apiKeyLabel?: string;
  apiKeyHelpText?: string;
  apiKeyPlaceholder?: string;
  oauthNote?: string;
  websiteUrl?: string;
}

export const MARKETING_TOOL_CATALOG: MarketingToolCatalog[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM, email sequences, campaign tracking, deal pipeline',
    category: 'CRM',
    icon: '🟠',
    authType: 'oauth',
    capabilities: ['crm.create_campaign', 'crm.manage_contacts', 'email.send_sequence', 'analytics.track_performance'],
    oauthNote: 'Enter your HubSpot private app access token (Settings → Integrations → Private Apps).',
    apiKeyLabel: 'HubSpot Access Token',
    apiKeyPlaceholder: 'pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    websiteUrl: 'https://app.hubspot.com',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM, lead scoring, opportunity tracking, marketing cloud',
    category: 'CRM',
    icon: '☁️',
    authType: 'oauth',
    capabilities: ['crm.manage_contacts', 'crm.track_opportunities', 'analytics.attribution'],
    oauthNote: 'Enter your Salesforce connected app access token.',
    apiKeyLabel: 'Salesforce Access Token',
    apiKeyPlaceholder: '00D...',
    websiteUrl: 'https://login.salesforce.com',
  },
  {
    id: 'linkedin-ads',
    name: 'LinkedIn Ads',
    description: 'B2B ad campaigns, audience targeting, sponsored content',
    category: 'Ads',
    icon: '💼',
    authType: 'oauth',
    capabilities: ['ads.create_campaign', 'ads.manage_budget', 'ads.track_performance'],
    oauthNote: 'Enter your LinkedIn Marketing API access token.',
    apiKeyLabel: 'LinkedIn Access Token',
    apiKeyPlaceholder: 'AQV...',
    websiteUrl: 'https://www.linkedin.com/campaignmanager',
  },
  {
    id: 'canva',
    name: 'Canva',
    description: 'Design templates, brand assets, creative production',
    category: 'Design',
    icon: '🎨',
    authType: 'oauth',
    capabilities: ['design.create_brief', 'design.export_asset', 'design.manage_templates'],
    oauthNote: 'Enter your Canva API access token from the Canva Developer Portal.',
    apiKeyLabel: 'Canva Access Token',
    apiKeyPlaceholder: 'OAut...',
    websiteUrl: 'https://www.canva.com/settings/integrations',
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'CMS publishing, blog posts, landing pages',
    category: 'CMS',
    icon: '🔗',
    authType: 'api_key',
    capabilities: ['cms.publish_post', 'cms.create_page', 'cms.manage_drafts'],
    apiKeyLabel: 'WordPress Application Password',
    apiKeyHelpText: 'Generate in WordPress Admin → Users → Profile → Application Passwords',
    apiKeyPlaceholder: 'username:xxxx xxxx xxxx xxxx xxxx xxxx',
    websiteUrl: 'https://wordpress.org',
  },
  {
    id: 'blogin',
    name: 'Blogin',
    description: 'Employee advocacy, internal blogging, content amplification',
    category: 'CMS',
    icon: '📝',
    authType: 'api_key',
    capabilities: ['cms.publish_post', 'cms.create_draft', 'advocacy.amplify'],
    apiKeyLabel: 'Blogin API Key',
    apiKeyHelpText: 'Find in Blogin Admin → Settings → API',
    apiKeyPlaceholder: 'blgn_xxxxxxxxxxxxxxxxxxxx',
    websiteUrl: 'https://blogin.co',
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    description: 'File storage, asset library, output delivery',
    category: 'Storage',
    icon: '📁',
    authType: 'oauth',
    capabilities: ['storage.save_file', 'storage.share_file', 'storage.organize_assets'],
    oauthNote: 'Enter your Google Drive API access token.',
    apiKeyLabel: 'Google Access Token',
    apiKeyPlaceholder: 'ya29.xxx',
    websiteUrl: 'https://drive.google.com',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Real-time web research, competitor analysis, trend monitoring',
    category: 'Research',
    icon: '🧭',
    authType: 'api_key',
    capabilities: ['research.web_search', 'research.competitor_analysis', 'research.trend_monitor'],
    apiKeyLabel: 'Perplexity API Key',
    apiKeyHelpText: 'Get from Perplexity API settings (api.perplexity.ai)',
    apiKeyPlaceholder: 'pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    websiteUrl: 'https://api.perplexity.ai',
  },
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    description: 'Website analytics, campaign performance, funnel analysis',
    category: 'Analytics',
    icon: '📊',
    authType: 'oauth',
    capabilities: ['analytics.track_performance', 'analytics.funnel_analysis', 'analytics.attribution'],
    oauthNote: 'Enter your GA4 API access token.',
    apiKeyLabel: 'GA4 Access Token',
    apiKeyPlaceholder: 'ya29.xxx',
    websiteUrl: 'https://analytics.google.com',
  },
  {
    id: 'google-ads',
    name: 'Google Ads',
    description: 'Search, display and shopping ad campaigns',
    category: 'Ads',
    icon: '🔎',
    authType: 'oauth',
    capabilities: ['ads.create_campaign', 'ads.manage_budget', 'ads.track_performance'],
    oauthNote: 'Enter your Google Ads API access token.',
    apiKeyLabel: 'Google Ads Access Token',
    apiKeyPlaceholder: 'ya29.xxx',
    websiteUrl: 'https://ads.google.com',
  },
];

// ---------------------------------------------------------------------------
// Name → ID mapping
// ---------------------------------------------------------------------------

const TOOL_NAME_TO_ID: Record<string, string> = {
  'HubSpot': 'hubspot',
  'Salesforce': 'salesforce',
  'LinkedIn Ads': 'linkedin-ads',
  'Google Ads': 'google-ads',
  'Meta Ads': 'meta-ads',
  'Canva': 'canva',
  'WordPress': 'wordpress',
  'Blogin': 'blogin',
  'Google Drive': 'gdrive',
  'Claude': 'claude',
  'Perplexity': 'perplexity',
  'GA4': 'ga4',
  'Figma': 'figma',
  'Lovable': 'lovable',
  'Framer': 'framer',
  'Nano Banana': 'nano-banana',
  'DALL-E': 'dalle',
  'Ahrefs': 'ahrefs',
  'Semrush': 'semrush',
};

// ---------------------------------------------------------------------------
// Mutable connection store
// ---------------------------------------------------------------------------

const connectionStore = new Map<string, StoredConnection>();

// Tools that are always connected when the platform is running
const ALWAYS_CONNECTED = new Set(['claude', 'gpt', 'nano-banana', 'dalle']);

const capabilityGraph = new CapabilityGraph();

// ---------------------------------------------------------------------------
// Connection state reads
// ---------------------------------------------------------------------------

export function getToolConnectionStatus(toolNameOrId: string): ToolConnectionResult {
  const toolId = TOOL_NAME_TO_ID[toolNameOrId] ?? toolNameOrId.toLowerCase().replace(/\s+/g, '-');
  const catalog = MARKETING_TOOL_CATALOG.find((t) => t.id === toolId);

  // Check mutable store first — user-set connections take priority
  const stored = connectionStore.get(toolId);
  if (stored) {
    return {
      toolId,
      toolName: catalog?.name ?? toolNameOrId,
      connected: stored.connected,
      authType: stored.authType,
      status: stored.status,
      connectedAt: stored.connectedAt,
      accountName: stored.accountName,
      connectUrl: `/api/tools/${toolId}/connect`,
      description: catalog?.description,
      category: catalog?.category,
      icon: catalog?.icon,
      capabilities: catalog?.capabilities,
    };
  }

  // Always-connected platform tools
  if (ALWAYS_CONNECTED.has(toolId)) {
    return {
      toolId,
      toolName: toolId === 'claude' ? 'Claude' : toolId === 'gpt' ? 'GPT' : toolId,
      connected: true,
      authType: 'api_key',
      status: 'connected',
      connectUrl: `/api/tools/${toolId}/connect`,
      description: 'Platform AI — always available',
      category: 'AI',
      icon: '🤖',
    };
  }

  // Fall back to capability graph (maintains existing behavior for non-marketing tools)
  const graphTools = capabilityGraph.getAllTools();
  const graphTool = graphTools.find((t) => t.id === toolId);
  if (graphTool) {
    return {
      toolId: graphTool.id,
      toolName: catalog?.name ?? graphTool.name,
      connected: graphTool.connected,
      authType: graphTool.authType as 'oauth' | 'api_key',
      status: graphTool.connected ? 'connected' : 'not_connected',
      connectUrl: `/api/tools/${graphTool.id}/connect`,
      description: catalog?.description,
      category: catalog?.category,
      icon: catalog?.icon,
      capabilities: catalog?.capabilities,
    };
  }

  // Unknown tool — default not connected
  return {
    toolId,
    toolName: catalog?.name ?? toolNameOrId,
    connected: false,
    authType: catalog?.authType ?? 'oauth',
    status: 'not_connected',
    connectUrl: `/api/tools/${toolId}/connect`,
    description: catalog?.description,
    category: catalog?.category,
    icon: catalog?.icon,
    capabilities: catalog?.capabilities,
  };
}

export function getMarketingToolConnections(): ToolConnectionResult[] {
  return MARKETING_TOOL_CATALOG.map((t) => getToolConnectionStatus(t.id));
}

export function checkWorkflowToolsRequired(
  toolNames: string[]
): { allConnected: boolean; missing: ToolConnectionResult[]; connected: ToolConnectionResult[] } {
  const results = toolNames.map((name) => getToolConnectionStatus(name));
  const missing = results.filter((r) => !r.connected);
  const connected = results.filter((r) => r.connected);
  return {
    allConnected: missing.length === 0,
    missing,
    connected,
  };
}

export function canExecuteWorkflow(
  requiredTools: string[],
  simulate?: boolean
): { canExecute: boolean; reason?: string; missingTools?: string[] } {
  if (simulate) {
    return { canExecute: true };
  }
  const { allConnected, missing } = checkWorkflowToolsRequired(requiredTools);
  if (allConnected) {
    return { canExecute: true };
  }
  return {
    canExecute: false,
    reason: `Required tools not connected: ${missing.map((m) => m.toolName).join(', ')}. Connect them in Integrations or enable Simulation mode.`,
    missingTools: missing.map((m) => m.toolName),
  };
}

// ---------------------------------------------------------------------------
// Connection mutations
// ---------------------------------------------------------------------------

export function connectTool(
  toolId: string,
  credentials: { apiKey?: string; accessToken?: string; accountName?: string }
): { success: boolean; message: string } {
  const catalog = MARKETING_TOOL_CATALOG.find((t) => t.id === toolId);

  if (!catalog) {
    // Still allow connecting unknown tools
    const authType = credentials.apiKey ? 'api_key' : 'oauth';
    const cred = credentials.apiKey ?? credentials.accessToken;
    if (!cred || cred.length < 8) {
      return { success: false, message: 'Credential must be at least 8 characters' };
    }
    connectionStore.set(toolId, {
      connected: true,
      authType,
      apiKey: credentials.apiKey,
      accessToken: credentials.accessToken,
      accountName: credentials.accountName,
      connectedAt: new Date().toISOString(),
      status: 'connected',
    });
    return { success: true, message: `Tool connected successfully` };
  }

  const cred = catalog.authType === 'api_key' ? credentials.apiKey : credentials.accessToken ?? credentials.apiKey;
  if (!cred || cred.trim().length < 8) {
    return {
      success: false,
      message: `${catalog.name} requires a valid ${catalog.authType === 'api_key' ? 'API key' : 'access token'} (minimum 8 characters)`,
    };
  }

  connectionStore.set(toolId, {
    connected: true,
    authType: catalog.authType,
    apiKey: catalog.authType === 'api_key' ? cred : undefined,
    accessToken: catalog.authType === 'oauth' ? cred : undefined,
    accountName: credentials.accountName,
    connectedAt: new Date().toISOString(),
    status: 'connected',
  });

  return { success: true, message: `${catalog.name} connected successfully` };
}

export function disconnectTool(toolId: string): { success: boolean; message: string } {
  const catalog = MARKETING_TOOL_CATALOG.find((t) => t.id === toolId);
  const name = catalog?.name ?? toolId;

  if (ALWAYS_CONNECTED.has(toolId)) {
    return { success: false, message: `${name} is a platform tool and cannot be disconnected` };
  }

  connectionStore.set(toolId, {
    connected: false,
    authType: catalog?.authType ?? 'oauth',
    status: 'not_connected',
  });

  return { success: true, message: `${name} disconnected` };
}

/**
 * Test a tool connection by calling a cheap, idempotent vendor endpoint when
 * possible. Falls back to a credential-shape check for vendors we haven't
 * wired yet. All network calls are wrapped in a 5s timeout.
 */
export async function testToolConnection(toolId: string): Promise<{ success: boolean; message: string; latencyMs?: number; account?: string }> {
  const start = Date.now();
  const stored = connectionStore.get(toolId);
  const graphTools = capabilityGraph.getAllTools();
  const graphTool = graphTools.find((t) => t.id === toolId);

  const isConnected = stored?.connected ?? graphTool?.connected ?? ALWAYS_CONNECTED.has(toolId);

  if (!isConnected) {
    return { success: false, message: 'Tool is not connected. Connect it first.' };
  }

  const token = stored?.accessToken ?? stored?.apiKey ?? '';
  const apiKey = stored?.apiKey ?? '';

  // Per-vendor live probe. On failure, return the vendor's error message so
  // users know exactly what to fix.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      switch (toolId) {
        case 'hubspot': {
          if (!token) return { success: false, message: 'No access token stored' };
          const res = await fetch('https://api.hubapi.com/account-info/v3/details', {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (!res.ok) return { success: false, message: `HubSpot returned ${res.status}: ${await res.text().then(t => t.slice(0, 200))}` };
          const data = await res.json() as { portalId?: number };
          return { success: true, message: 'HubSpot connection valid', latencyMs: Date.now() - start, account: data.portalId ? `Portal ${data.portalId}` : undefined };
        }
        case 'salesforce': {
          if (!token) return { success: false, message: 'No access token stored' };
          const instance = stored?.accountName ?? 'login.salesforce.com';
          const res = await fetch(`https://${instance}/services/oauth2/userinfo`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (!res.ok) return { success: false, message: `Salesforce returned ${res.status}` };
          const data = await res.json() as { email?: string };
          return { success: true, message: 'Salesforce connection valid', latencyMs: Date.now() - start, account: data.email };
        }
        case 'linkedin-ads': {
          if (!token) return { success: false, message: 'No access token stored' };
          const res = await fetch('https://api.linkedin.com/v2/me', {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (!res.ok) return { success: false, message: `LinkedIn returned ${res.status}` };
          const data = await res.json() as { localizedFirstName?: string };
          return { success: true, message: 'LinkedIn Ads connection valid', latencyMs: Date.now() - start, account: data.localizedFirstName };
        }
        case 'wordpress': {
          if (!apiKey) return { success: false, message: 'No application password stored' };
          // Expect format "username:password". Try /wp-json/wp/v2/users/me on
          // the site URL stored in accountName.
          const siteUrl = stored?.accountName;
          if (!siteUrl) return { success: false, message: 'Provide the WordPress site URL in accountName' };
          const [user, pwd] = apiKey.split(':');
          if (!user || !pwd) return { success: false, message: 'API key must be "username:password" format' };
          const auth = Buffer.from(`${user}:${pwd}`).toString('base64');
          const res = await fetch(`${siteUrl.replace(/\/+$/, '')}/wp-json/wp/v2/users/me`, {
            headers: { Authorization: `Basic ${auth}` },
            signal: controller.signal,
          });
          if (!res.ok) return { success: false, message: `WordPress returned ${res.status}` };
          const data = await res.json() as { name?: string };
          return { success: true, message: 'WordPress connection valid', latencyMs: Date.now() - start, account: data.name };
        }
        case 'gdrive': {
          if (!token) return { success: false, message: 'No access token stored' };
          const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)', {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (!res.ok) return { success: false, message: `Google Drive returned ${res.status}` };
          const data = await res.json() as { user?: { emailAddress?: string } };
          return { success: true, message: 'Google Drive connection valid', latencyMs: Date.now() - start, account: data.user?.emailAddress };
        }
        case 'perplexity': {
          if (!apiKey) return { success: false, message: 'No API key stored' };
          // Perplexity doesn't expose /me; do a minimal echo-style chat
          // completion with max_tokens=1 as a cheap probe.
          const res = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'sonar-small-chat',
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 1,
            }),
            signal: controller.signal,
          });
          if (!res.ok) return { success: false, message: `Perplexity returned ${res.status}` };
          return { success: true, message: 'Perplexity connection valid', latencyMs: Date.now() - start };
        }
        case 'ga4': {
          if (!token) return { success: false, message: 'No access token stored' };
          const res = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts', {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (!res.ok) return { success: false, message: `GA4 returned ${res.status}` };
          return { success: true, message: 'GA4 connection valid', latencyMs: Date.now() - start };
        }
        default: {
          // Vendor not yet wired for live probe — do a minimal credential-shape sanity check.
          if (stored?.apiKey && stored.apiKey.length < 8) {
            return { success: false, message: 'Stored API key appears invalid (too short)' };
          }
          if (stored?.accessToken && stored.accessToken.length < 8) {
            return { success: false, message: 'Stored access token appears invalid (too short)' };
          }
          return {
            success: true,
            message: 'Credentials stored. Live probe not yet available for this vendor — try running a skill to verify end-to-end.',
            latencyMs: Date.now() - start,
          };
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    const e = err as Error;
    if (e.name === 'AbortError') {
      return { success: false, message: `Vendor endpoint timed out after 5s`, latencyMs: Date.now() - start };
    }
    return { success: false, message: `Probe failed: ${e.message}`, latencyMs: Date.now() - start };
  }
}

/**
 * Store a bearer token after a successful OAuth callback exchange.
 * Called by the gateway's /api/tools/:id/oauth/callback route.
 */
export function storeOAuthToken(
  toolId: string,
  accessToken: string,
  accountName?: string,
  refreshToken?: string,
): void {
  const catalog = MARKETING_TOOL_CATALOG.find((t) => t.id === toolId);
  const existing = connectionStore.get(toolId);
  connectionStore.set(toolId, {
    ...existing,
    connected: true,
    authType: 'oauth',
    accessToken,
    accountName: accountName ?? existing?.accountName,
    connectedAt: new Date().toISOString(),
    status: 'connected',
    apiKey: refreshToken, // store refresh token in apiKey slot for later rotation
    ...(catalog ? {} : {}),
  });
}

/** Get the stored credential for use during workflow execution */
export function getToolCredential(toolId: string): { apiKey?: string; accessToken?: string } | undefined {
  const stored = connectionStore.get(toolId);
  if (!stored?.connected) return undefined;
  return { apiKey: stored.apiKey, accessToken: stored.accessToken };
}
