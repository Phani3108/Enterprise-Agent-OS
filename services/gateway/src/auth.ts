// Re-export auth for gateway
export { authenticateRequest, requireRole, requirePersonaAccess, generateJWT } from '@agentos/auth';
export type { AuthUser, AuthResult, UserRole, PersonaScope } from '@agentos/auth';
