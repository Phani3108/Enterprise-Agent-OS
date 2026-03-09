/**
 * @agentos/secrets — Enterprise Secrets Vault Abstraction
 *
 * Unified interface for secret management across providers.
 * Supports HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager,
 * Azure Key Vault, and environment variables.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SecretProvider = 'vault' | 'aws' | 'gcp' | 'azure' | 'env' | 'memory';

export interface SecretReference {
    provider: SecretProvider;
    path: string;
    key?: string;
    version?: string;
}

export interface SecretValue {
    ref: SecretReference;
    value: string;
    expiresAt?: Date;
    rotatedAt?: Date;
    version: string;
}

export interface SecretAuditEntry {
    action: 'read' | 'write' | 'rotate' | 'delete';
    path: string;
    actor: string;
    timestamp: Date;
    success: boolean;
    details?: string;
}

// ---------------------------------------------------------------------------
// Vault Interface
// ---------------------------------------------------------------------------

export interface SecretVault {
    /**
     * Retrieve a secret value.
     */
    get(ref: SecretReference): Promise<SecretValue>;

    /**
     * Store or update a secret.
     */
    set(ref: SecretReference, value: string): Promise<void>;

    /**
     * Rotate a secret — generates a new value.
     */
    rotate(ref: SecretReference, newValue: string): Promise<void>;

    /**
     * Delete a secret.
     */
    delete(ref: SecretReference): Promise<void>;

    /**
     * List secrets at a path (names only, not values).
     */
    list(path: string): Promise<string[]>;

    /**
     * Check vault health.
     */
    health(): Promise<{ connected: boolean; provider: SecretProvider }>;
}

// ---------------------------------------------------------------------------
// Secret URI Parser
// ---------------------------------------------------------------------------

/**
 * Parse a secret URI into a SecretReference.
 *
 * Format: `vault://path/to/secret#key`
 *         `aws://secret-name#key`
 *         `env://ENV_VAR_NAME`
 */
export function parseSecretUri(uri: string): SecretReference {
    const match = uri.match(/^(\w+):\/\/([^#]+)(?:#(.+))?$/);
    if (!match) {
        throw new Error(`Invalid secret URI: ${uri}`);
    }

    const [, provider, path, key] = match;

    const validProviders: SecretProvider[] = ['vault', 'aws', 'gcp', 'azure', 'env', 'memory'];
    if (!validProviders.includes(provider as SecretProvider)) {
        throw new Error(`Unknown secret provider: ${provider}`);
    }

    return {
        provider: provider as SecretProvider,
        path,
        key: key ?? undefined,
    };
}

// ---------------------------------------------------------------------------
// In-Memory Vault (Development)
// ---------------------------------------------------------------------------

export class InMemoryVault implements SecretVault {
    private store = new Map<string, { value: string; version: number; rotatedAt: Date }>();
    private auditLog: SecretAuditEntry[] = [];

    async get(ref: SecretReference): Promise<SecretValue> {
        const fullPath = this.getFullPath(ref);
        const entry = this.store.get(fullPath);

        this.audit('read', ref.path, !!entry);

        if (!entry) {
            throw new Error(`Secret not found: ${fullPath}`);
        }

        return {
            ref,
            value: entry.value,
            rotatedAt: entry.rotatedAt,
            version: String(entry.version),
        };
    }

    async set(ref: SecretReference, value: string): Promise<void> {
        const fullPath = this.getFullPath(ref);
        const existing = this.store.get(fullPath);

        this.store.set(fullPath, {
            value,
            version: (existing?.version ?? 0) + 1,
            rotatedAt: new Date(),
        });

        this.audit('write', ref.path, true);
    }

    async rotate(ref: SecretReference, newValue: string): Promise<void> {
        await this.set(ref, newValue);
        this.audit('rotate', ref.path, true);
    }

    async delete(ref: SecretReference): Promise<void> {
        const fullPath = this.getFullPath(ref);
        this.store.delete(fullPath);
        this.audit('delete', ref.path, true);
    }

    async list(path: string): Promise<string[]> {
        const prefix = `${path}/`;
        return Array.from(this.store.keys())
            .filter((k) => k.startsWith(prefix))
            .map((k) => k.slice(prefix.length));
    }

    async health(): Promise<{ connected: boolean; provider: SecretProvider }> {
        return { connected: true, provider: 'memory' };
    }

    getAuditLog(): SecretAuditEntry[] {
        return [...this.auditLog];
    }

    private getFullPath(ref: SecretReference): string {
        return ref.key ? `${ref.path}/${ref.key}` : ref.path;
    }

    private audit(action: SecretAuditEntry['action'], path: string, success: boolean): void {
        this.auditLog.push({
            action,
            path,
            actor: 'system',
            timestamp: new Date(),
            success,
        });
    }
}
