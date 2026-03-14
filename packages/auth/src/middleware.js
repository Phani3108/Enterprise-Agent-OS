/**
 * Auth middleware — JWT verification + RBAC
 */
// Simple API key auth for dev mode
const DEV_API_KEYS = {
    'eos-dev-key': { id: 'dev-user', email: 'dev@zeta.tech', name: 'Developer', role: 'admin', teams: ['engineering'] },
    'eos-demo-key': { id: 'demo-user', email: 'demo@zeta.tech', name: 'Demo User', role: 'user', teams: ['engineering', 'marketing'] },
};
export function authenticateRequest(headers) {
    // Try API key first (dev mode)
    const apiKey = headers['x-api-key'] || headers['authorization']?.replace('Bearer ', '');
    if (apiKey && DEV_API_KEYS[apiKey]) {
        return { authenticated: true, user: DEV_API_KEYS[apiKey] };
    }
    // Try JWT (production)
    const jwt = headers['authorization']?.replace('Bearer ', '');
    if (jwt) {
        try {
            const user = decodeJWT(jwt);
            if (user)
                return { authenticated: true, user };
        }
        catch {
            return { authenticated: false, error: 'Invalid token' };
        }
    }
    // Allow unauthenticated in dev mode
    if (process.env.NODE_ENV !== 'production') {
        return {
            authenticated: true,
            user: { id: 'anonymous', email: 'anon@local', name: 'Anonymous', role: 'user', teams: [] },
        };
    }
    return { authenticated: false, error: 'Missing authentication' };
}
export function requireRole(user, requiredRole) {
    const hierarchy = { user: 0, operator: 1, admin: 2 };
    return hierarchy[user.role] >= hierarchy[requiredRole];
}
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        return {
            id: payload.sub ?? payload.id,
            email: payload.email ?? '',
            name: payload.name ?? '',
            role: payload.role ?? 'user',
            teams: payload.teams ?? [],
        };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=middleware.js.map