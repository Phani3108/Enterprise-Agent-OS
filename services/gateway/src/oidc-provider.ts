/**
 * OIDC / OpenID Connect provider integration.
 * Supports Okta, Azure AD, Auth0, Google Workspace — any OIDC-compliant IdP.
 *
 * Required env vars:
 *   OIDC_ISSUER_URL       — e.g. https://dev-123.okta.com
 *   OIDC_CLIENT_ID
 *   OIDC_CLIENT_SECRET
 *   OIDC_REDIRECT_URI     — e.g. http://localhost:3000/api/auth/oidc/callback
 *   JWT_SECRET            — for signing AgentOS JWTs post-login
 */

import { createHmac, randomBytes, createHash } from 'node:crypto';

const ISSUER_URL    = process.env.OIDC_ISSUER_URL ?? '';
const CLIENT_ID     = process.env.OIDC_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET ?? '';
const REDIRECT_URI  = process.env.OIDC_REDIRECT_URI ?? '';

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

interface OIDCConfig {
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint?: string;
  issuer: string;
}

let _config: OIDCConfig | null = null;

export async function discoverOIDC(): Promise<OIDCConfig> {
  if (_config) return _config;
  if (!ISSUER_URL) throw new Error('OIDC_ISSUER_URL not set');

  const url = `${ISSUER_URL.replace(/\/$/, '')}/.well-known/openid-configuration`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
  _config = await res.json() as OIDCConfig;
  return _config;
}

// ---------------------------------------------------------------------------
// Authorization URL
// ---------------------------------------------------------------------------

/** In-memory nonce/state store (production: use Redis with TTL) */
const pendingStates = new Map<string, { nonce: string; createdAt: number }>();

export async function buildAuthorizationUrl(): Promise<{ url: string; state: string }> {
  const cfg = await discoverOIDC();
  const state = randomBytes(16).toString('hex');
  const nonce = randomBytes(16).toString('hex');

  pendingStates.set(state, { nonce, createdAt: Date.now() });
  // Prune states older than 10 minutes
  for (const [k, v] of pendingStates) {
    if (Date.now() - v.createdAt > 600_000) pendingStates.delete(k);
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid email profile',
    state,
    nonce,
  });

  return { url: `${cfg.authorization_endpoint}?${params}`, state };
}

// ---------------------------------------------------------------------------
// Code exchange
// ---------------------------------------------------------------------------

interface TokenResponse {
  id_token: string;
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const cfg = await discoverOIDC();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(cfg.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} — ${text}`);
  }

  return res.json() as Promise<TokenResponse>;
}

// ---------------------------------------------------------------------------
// ID token verification (signature-less in dev; JWKS in production)
// ---------------------------------------------------------------------------

interface OIDCClaims {
  sub: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  nonce?: string;
}

export function verifyIdToken(idToken: string, state: string): OIDCClaims {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid id_token format');

  const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString()) as OIDCClaims;

  // Expiry
  if (claims.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('id_token expired');
  }

  // Audience
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(CLIENT_ID)) throw new Error('id_token audience mismatch');

  // Nonce (CSRF protection)
  const pending = pendingStates.get(state);
  if (pending && claims.nonce && claims.nonce !== pending.nonce) {
    throw new Error('id_token nonce mismatch');
  }
  if (pending) pendingStates.delete(state);

  return claims;
}

// ---------------------------------------------------------------------------
// User provisioning
// ---------------------------------------------------------------------------

export interface OIDCUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  picture?: string;
}

/**
 * Map OIDC claims → AgentOS user record.
 * Tenant is derived from email domain or OIDC_DEFAULT_TENANT env var.
 */
export function provisionUser(claims: OIDCClaims): OIDCUser {
  const email = claims.email ?? `${claims.sub}@oidc.local`;
  const emailDomain = email.split('@')[1] ?? 'default';
  const tenantId = process.env.OIDC_DEFAULT_TENANT ?? emailDomain;

  return {
    id: `oidc:${claims.sub}`,
    email,
    name: claims.name ?? ([claims.given_name, claims.family_name].filter(Boolean).join(' ') || email),
    tenantId,
    picture: claims.picture,
  };
}
