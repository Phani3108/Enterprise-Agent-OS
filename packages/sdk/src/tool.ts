/**
 * @agentos/sdk — Tool Invocation Helpers
 *
 * Provides type-safe tool invocation with validation, auth injection,
 * retry logic, and observability.
 */

import type {
    ToolDefinition,
    ToolInvocation,
    ToolResult,
    ToolAuth,
} from './types.js';

/**
 * Registry of available tools. Workers use this to discover and invoke tools.
 */
export class ToolRegistry {
    private tools = new Map<string, ToolDefinition>();
    private implementations = new Map<string, ToolImplementation>();

    /**
     * Register a tool definition and its implementation.
     */
    register(definition: ToolDefinition, implementation: ToolImplementation): void {
        this.tools.set(definition.name, definition);
        this.implementations.set(definition.name, implementation);
    }

    /**
     * Get a tool definition by name.
     */
    getDefinition(name: string): ToolDefinition | undefined {
        return this.tools.get(name);
    }

    /**
     * List all registered tools.
     */
    listTools(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    /**
     * Check if a tool is registered.
     */
    has(name: string): boolean {
        return this.tools.has(name);
    }

    /**
     * Get the implementation for a tool.
     */
    getImplementation(name: string): ToolImplementation | undefined {
        return this.implementations.get(name);
    }
}

/**
 * Function type for tool implementations.
 */
export type ToolImplementation = (
    args: Record<string, unknown>,
    context: ToolContext
) => Promise<unknown>;

/**
 * Context passed to tool implementations.
 */
export interface ToolContext {
    traceId: string;
    tenantId: string;
    workerId: string;
    auth: ResolvedAuth;
    signal: AbortSignal;
}

/**
 * Resolved authentication credentials for a tool call.
 */
export interface ResolvedAuth {
    type: ToolAuth['type'];
    token?: string;
    apiKey?: string;
    username?: string;
    password?: string;
}

/**
 * Invoke a tool with full validation, auth, retry, and tracing pipeline.
 */
export async function invokeTool(
    registry: ToolRegistry,
    invocation: ToolInvocation,
    context: ToolContext
): Promise<ToolResult> {
    const startTime = Date.now();
    const definition = registry.getDefinition(invocation.toolName);

    if (!definition) {
        return {
            toolName: invocation.toolName,
            status: 'failure',
            error: `Tool '${invocation.toolName}' is not registered`,
            durationMs: Date.now() - startTime,
        };
    }

    // Step 1: Validate input args against tool schema
    const validationError = validateToolArgs(definition, invocation.args);
    if (validationError) {
        return {
            toolName: invocation.toolName,
            status: 'failure',
            error: `Validation failed: ${validationError}`,
            durationMs: Date.now() - startTime,
        };
    }

    // Step 2: Get implementation
    const implementation = registry.getImplementation(invocation.toolName);
    if (!implementation) {
        return {
            toolName: invocation.toolName,
            status: 'failure',
            error: `No implementation found for tool '${invocation.toolName}'`,
            durationMs: Date.now() - startTime,
        };
    }

    // Step 3: Set up timeout
    const timeoutMs = invocation.timeout ?? definition.timeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // Step 4: Execute with context
        const result = await implementation(invocation.args, {
            ...context,
            signal: controller.signal,
        });

        return {
            toolName: invocation.toolName,
            status: 'success',
            data: result,
            durationMs: Date.now() - startTime,
        };
    } catch (err) {
        return {
            toolName: invocation.toolName,
            status: 'failure',
            error: (err as Error).message,
            durationMs: Date.now() - startTime,
        };
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Validate tool invocation arguments against the tool definition.
 */
function validateToolArgs(
    definition: ToolDefinition,
    args: Record<string, unknown>
): string | null {
    // Check required parameters
    for (const [name, param] of Object.entries(definition.input)) {
        if (param.required && !(name in args)) {
            return `Missing required parameter: '${name}'`;
        }
        if (name in args && param.enum && !param.enum.includes(args[name])) {
            return `Invalid value for '${name}': expected one of [${param.enum.join(', ')}]`;
        }
    }

    return null; // valid
}

/**
 * Retry a tool invocation with configurable backoff.
 */
export async function invokeToolWithRetry(
    registry: ToolRegistry,
    invocation: ToolInvocation,
    context: ToolContext,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
): Promise<ToolResult> {
    let lastResult: ToolResult | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        lastResult = await invokeTool(registry, invocation, context);

        if (lastResult.status === 'success') {
            return lastResult;
        }

        if (attempt < maxRetries) {
            const delay = initialDelayMs * Math.pow(2, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }

    return lastResult!;
}
