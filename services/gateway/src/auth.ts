// Re-export auth for gateway
export { authenticateRequest, requireRole, requirePersonaAccess, generateJWT } from '../../../packages/auth/src/middleware.js';
export type { AuthUser, AuthResult, UserRole, PersonaScope } from '../../../packages/auth/src/middleware.js';
