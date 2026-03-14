/**
 * Auth middleware — JWT verification + RBAC
 */
export type UserRole = 'user' | 'operator' | 'admin';
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    teams: string[];
}
export declare function authenticateRequest(headers: Record<string, string | undefined>): AuthResult;
export declare function requireRole(user: AuthUser, requiredRole: UserRole): boolean;
export interface AuthResult {
    authenticated: boolean;
    user?: AuthUser;
    error?: string;
}
//# sourceMappingURL=middleware.d.ts.map