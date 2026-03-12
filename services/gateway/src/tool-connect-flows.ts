/**
 * Tool Connection Flows — OAuth / API key for HubSpot, Salesforce, LinkedIn Ads, Canva, WordPress, Blogin, Google Drive
 * Real connection flows; env vars required for production.
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

export interface ToolConnectFlow {
  toolId: string;
  authType: 'oauth' | 'api_key';
  oauthUrl?: string;
  redirectUri?: string;
  apiKeyPlaceholder?: string;
}

const BASE_URL = process.env.GATEWAY_URL ?? 'http://localhost:3000';

// OAuth URLs — configure via env: HUBSPOT_CLIENT_ID, SALESFORCE_CLIENT_ID, etc.
function getOAuthUrl(toolId: string): string {
  const redirectUri = `${BASE_URL}/api/tools/${toolId}/callback`;
  switch (toolId) {
    case 'hubspot':
      return `https://app.hubspot.com/oauth/authorize?client_id=${process.env.HUBSPOT_CLIENT_ID ?? 'demo'}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=contacts%20content%20automation`;
    case 'salesforce':
      return `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${process.env.SALESFORCE_CLIENT_ID ?? 'demo'}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    case 'linkedin-ads':
      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID ?? 'demo'}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=r_ads`;
    case 'canva':
      return `https://www.canva.com/oauth/authorize?client_id=${process.env.CANVA_CLIENT_ID ?? 'demo'}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    case 'wordpress':
      return `https://public-api.wordpress.com/oauth2/authorize?client_id=${process.env.WORDPRESS_CLIENT_ID ?? 'demo'}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    case 'gdrive':
      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID ?? 'demo'}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/drive.file`;
    default:
      return `${BASE_URL}/api/tools/${toolId}/connect?status=configure`;
  }
}

export function getToolConnectFlow(toolId: string): ToolConnectFlow {
  const flows: Record<string, ToolConnectFlow> = {
    hubspot: { toolId: 'hubspot', authType: 'oauth', oauthUrl: getOAuthUrl('hubspot'), redirectUri: `${BASE_URL}/api/tools/hubspot/callback` },
    salesforce: { toolId: 'salesforce', authType: 'oauth', oauthUrl: getOAuthUrl('salesforce'), redirectUri: `${BASE_URL}/api/tools/salesforce/callback` },
    'linkedin-ads': { toolId: 'linkedin-ads', authType: 'oauth', oauthUrl: getOAuthUrl('linkedin-ads'), redirectUri: `${BASE_URL}/api/tools/linkedin-ads/callback` },
    canva: { toolId: 'canva', authType: 'oauth', oauthUrl: getOAuthUrl('canva'), redirectUri: `${BASE_URL}/api/tools/canva/callback` },
    wordpress: { toolId: 'wordpress', authType: 'oauth', oauthUrl: getOAuthUrl('wordpress'), redirectUri: `${BASE_URL}/api/tools/wordpress/callback` },
    gdrive: { toolId: 'gdrive', authType: 'oauth', oauthUrl: getOAuthUrl('gdrive'), redirectUri: `${BASE_URL}/api/tools/gdrive/callback` },
    blogin: { toolId: 'blogin', authType: 'api_key', apiKeyPlaceholder: 'Enter Blogin API key' },
    perplexity: { toolId: 'perplexity', authType: 'api_key', apiKeyPlaceholder: 'Enter Perplexity API key' },
  };
  return flows[toolId] ?? { toolId, authType: 'oauth', oauthUrl: getOAuthUrl(toolId) };
}

export function shouldRedirectToOAuth(toolId: string): boolean {
  const flow = getToolConnectFlow(toolId);
  if (flow.authType !== 'oauth' || !flow.oauthUrl || flow.oauthUrl.includes('status=configure')) return false;
  const hasRealClientId = !flow.oauthUrl.includes('client_id=demo');
  return hasRealClientId;
}
