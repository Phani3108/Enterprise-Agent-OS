/**
 * Plugin Interfaces — Extensible Plugin System for AgentOS
 *
 * Defines TypeScript interfaces for swappable components:
 *   - RuntimePlugin:     Agent execution runtime (LangGraph, AutoGen, CrewAI, custom)
 *   - ToolPlugin:        External tool integrations (Slack, Jira, GitHub, etc.)
 *   - LLMPlugin:         LLM provider abstraction (Anthropic, OpenAI, Gemini, Ollama)
 *   - MemoryPlugin:      Memory/state persistence backend
 *   - ObservabilityPlugin: Tracing, metrics, and logging
 *
 * This enables the orchestrator.agent.json's `supported_runtimes` field to
 * actually mean something — each runtime is a plugin that implements the
 * same interface, so agents can run on LangGraph, AutoGen, CrewAI, or a
 * custom runtime without changing the pipeline engine.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Core Plugin Lifecycle
// ═══════════════════════════════════════════════════════════════════════════

export interface PluginManifest {
    /** Unique plugin identifier (e.g., "runtime.langgraph", "tool.slack") */
    id: string;
    /** Human-readable name */
    name: string;
    /** Plugin category */
    type: 'runtime' | 'tool' | 'llm' | 'memory' | 'observability';
    /** SemVer version */
    version: string;
    /** Plugin author */
    author?: string;
    /** Required capabilities from the host */
    requires?: string[];
    /** Capabilities this plugin provides */
    provides: string[];
}

export interface PluginLifecycle {
    /** Called once when plugin is loaded. Return false to abort. */
    initialize(config: Record<string, unknown>): Promise<boolean>;
    /** Called when plugin is being unloaded. Clean up resources. */
    shutdown(): Promise<void>;
    /** Health check — called periodically */
    healthCheck(): Promise<{ healthy: boolean; details?: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Runtime Plugin — Agent Execution Runtime
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RuntimePlugin defines how agents actually execute.
 * Each runtime (LangGraph, AutoGen, CrewAI, custom) implements this interface.
 * The pipeline engine calls `executeAgent()` — the runtime handles the rest.
 */
export interface RuntimePlugin extends PluginLifecycle {
    manifest: PluginManifest & { type: 'runtime' };

    /**
     * Execute a single agent with the given prompt and context.
     * Returns the agent's output and execution metadata.
     */
    executeAgent(request: RuntimeExecutionRequest): Promise<RuntimeExecutionResult>;

    /**
     * Execute a group of agents as a parallel batch.
     * Some runtimes (e.g., LangGraph) have native parallel execution.
     */
    executeBatch?(requests: RuntimeExecutionRequest[]): Promise<RuntimeExecutionResult[]>;

    /**
     * Whether this runtime supports streaming output.
     */
    supportsStreaming: boolean;

    /**
     * Stream agent output token-by-token (if supported).
     */
    streamAgent?(request: RuntimeExecutionRequest, onChunk: (chunk: string) => void): Promise<RuntimeExecutionResult>;
}

export interface RuntimeExecutionRequest {
    /** Unique execution ID for tracing */
    executionId: string;
    /** Agent identifier */
    agentId: string;
    /** Assembled system prompt */
    systemPrompt: string;
    /** Assembled user prompt */
    userPrompt: string;
    /** Available tools for this agent */
    tools?: ToolDescriptor[];
    /** LLM configuration */
    llmConfig: {
        provider: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
    /** Timeout in milliseconds */
    timeoutMs: number;
    /** Shared state accessible to the agent */
    sharedState?: Record<string, unknown>;
}

export interface RuntimeExecutionResult {
    executionId: string;
    agentId: string;
    output: string;
    /** Structured output if the agent returned JSON */
    structuredOutput?: Record<string, unknown>;
    /** Tools that were called during execution */
    toolCalls?: ToolCallRecord[];
    /** Token usage */
    tokens: { input: number; output: number; total: number };
    /** Cost in USD */
    cost: number;
    /** Duration in milliseconds */
    durationMs: number;
    /** Whether execution completed successfully */
    success: boolean;
    /** Error details if failed */
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Tool Plugin — External Tool Integration
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ToolPlugin defines an external tool that agents can invoke.
 * Maps to the connector definitions in connectors/ (GitHub, Jira, Slack, Teams).
 */
export interface ToolPlugin extends PluginLifecycle {
    manifest: PluginManifest & { type: 'tool' };

    /** Describe what this tool does (for LLM function calling) */
    describe(): ToolDescriptor;

    /** Execute the tool with given parameters */
    execute(params: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;

    /** Validate parameters before execution */
    validate?(params: Record<string, unknown>): { valid: boolean; errors?: string[] };

    /** Authentication type required */
    authType: 'oauth' | 'api_key' | 'mcp' | 'none';

    /** Whether this tool has side effects (writes data, sends messages, etc.) */
    hasSideEffects: boolean;
}

export interface ToolDescriptor {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            required?: boolean;
            enum?: string[];
        }>;
        required: string[];
    };
}

export interface ToolContext {
    /** The agent invoking this tool */
    agentId: string;
    /** The pipeline this tool call is part of */
    pipelineId?: string;
    /** User credentials/tokens for authenticated tools */
    credentials?: Record<string, string>;
    /** Rate limit remaining */
    rateLimitRemaining?: number;
}

export interface ToolResult {
    success: boolean;
    data: unknown;
    error?: string;
    /** Duration in milliseconds */
    durationMs: number;
    /** Whether a side effect occurred */
    sideEffectOccurred?: boolean;
}

export interface ToolCallRecord {
    toolName: string;
    params: Record<string, unknown>;
    result: ToolResult;
    timestamp: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// LLM Plugin — Language Model Provider
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LLMPlugin wraps a language model provider.
 * Extends beyond the existing llm-provider.ts to be plugin-based,
 * enabling per-agent model selection and custom model endpoints.
 */
export interface LLMPlugin extends PluginLifecycle {
    manifest: PluginManifest & { type: 'llm' };

    /** List available models from this provider */
    listModels(): LLMModelInfo[];

    /** Execute a completion */
    complete(request: LLMCompletionRequest): Promise<LLMCompletionResult>;

    /** Stream a completion token-by-token */
    stream?(request: LLMCompletionRequest, onChunk: (chunk: string) => void): Promise<LLMCompletionResult>;

    /** Check if a specific model is available */
    isModelAvailable(modelId: string): Promise<boolean>;

    /** Estimate cost before execution */
    estimateCost(inputTokens: number, outputTokens: number, modelId: string): number;
}

export interface LLMModelInfo {
    id: string;
    name: string;
    contextWindow: number;
    maxOutputTokens: number;
    costPer1MInput: number;
    costPer1MOutput: number;
    capabilities: ('chat' | 'function_calling' | 'vision' | 'code')[];
}

export interface LLMCompletionRequest {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
    temperature: number;
    /** Function/tool definitions for function calling */
    tools?: ToolDescriptor[];
    /** Stop sequences */
    stopSequences?: string[];
}

export interface LLMCompletionResult {
    content: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    latencyMs: number;
    /** If the model made tool calls */
    toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
    /** Finish reason */
    finishReason: 'stop' | 'max_tokens' | 'tool_call' | 'error';
}

// ═══════════════════════════════════════════════════════════════════════════
// Memory Plugin — State Persistence
// ═══════════════════════════════════════════════════════════════════════════

/**
 * MemoryPlugin handles persistence of agent memory, pipeline state,
 * and shared context. Maps to memory/schema.json collections.
 */
export interface MemoryPlugin extends PluginLifecycle {
    manifest: PluginManifest & { type: 'memory' };

    /** Store a value in a collection */
    store(collection: string, key: string, value: unknown, metadata?: Record<string, unknown>): Promise<void>;

    /** Retrieve a value from a collection */
    retrieve(collection: string, key: string): Promise<unknown | null>;

    /** Query a collection with filters */
    query(collection: string, filter: MemoryFilter): Promise<MemoryEntry[]>;

    /** Delete an entry */
    delete(collection: string, key: string): Promise<boolean>;

    /** Semantic search across a collection (if supported) */
    semanticSearch?(collection: string, query: string, topK?: number): Promise<MemoryEntry[]>;
}

export interface MemoryFilter {
    /** Field-level filters */
    where?: Record<string, unknown>;
    /** Maximum results */
    limit?: number;
    /** Sort field and direction */
    orderBy?: { field: string; direction: 'asc' | 'desc' };
    /** Pagination offset */
    offset?: number;
}

export interface MemoryEntry {
    key: string;
    value: unknown;
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Observability Plugin — Tracing, Metrics, Logging
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ObservabilityPlugin provides tracing, metrics, and structured logging
 * for pipeline execution. Integrates with the existing observability package
 * and deploy/otel-config.yaml.
 */
export interface ObservabilityPlugin extends PluginLifecycle {
    manifest: PluginManifest & { type: 'observability' };

    /** Start a trace span */
    startSpan(name: string, attributes?: Record<string, string | number | boolean>): SpanHandle;

    /** Record a metric */
    recordMetric(name: string, value: number, labels?: Record<string, string>): void;

    /** Structured log entry */
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void;
}

export interface SpanHandle {
    /** Add attributes to the span */
    setAttribute(key: string, value: string | number | boolean): void;
    /** Record an event within the span */
    addEvent(name: string, attributes?: Record<string, unknown>): void;
    /** End the span */
    end(status?: 'ok' | 'error'): void;
}

// ═══════════════════════════════════════════════════════════════════════════
// Plugin Registry
// ═══════════════════════════════════════════════════════════════════════════

type AnyPlugin = RuntimePlugin | ToolPlugin | LLMPlugin | MemoryPlugin | ObservabilityPlugin;

/**
 * Plugin Registry — discovers, loads, and manages plugin lifecycle.
 */
export class PluginRegistry {
    private plugins = new Map<string, AnyPlugin>();
    private initialized = new Set<string>();

    /** Register a plugin */
    register(plugin: AnyPlugin): void {
        if (this.plugins.has(plugin.manifest.id)) {
            throw new Error(`Plugin already registered: ${plugin.manifest.id}`);
        }
        this.plugins.set(plugin.manifest.id, plugin);
    }

    /** Initialize a plugin with configuration */
    async initializePlugin(pluginId: string, config: Record<string, unknown> = {}): Promise<boolean> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);
        if (this.initialized.has(pluginId)) return true;

        const success = await plugin.initialize(config);
        if (success) this.initialized.add(pluginId);
        return success;
    }

    /** Get a plugin by ID (typed) */
    getRuntime(id: string): RuntimePlugin | undefined {
        const plugin = this.plugins.get(id);
        return plugin?.manifest.type === 'runtime' ? plugin as RuntimePlugin : undefined;
    }

    getTool(id: string): ToolPlugin | undefined {
        const plugin = this.plugins.get(id);
        return plugin?.manifest.type === 'tool' ? plugin as ToolPlugin : undefined;
    }

    getLLM(id: string): LLMPlugin | undefined {
        const plugin = this.plugins.get(id);
        return plugin?.manifest.type === 'llm' ? plugin as LLMPlugin : undefined;
    }

    getMemory(id: string): MemoryPlugin | undefined {
        const plugin = this.plugins.get(id);
        return plugin?.manifest.type === 'memory' ? plugin as MemoryPlugin : undefined;
    }

    getObservability(id: string): ObservabilityPlugin | undefined {
        const plugin = this.plugins.get(id);
        return plugin?.manifest.type === 'observability' ? plugin as ObservabilityPlugin : undefined;
    }

    /** List all plugins of a given type */
    listByType(type: AnyPlugin['manifest']['type']): AnyPlugin[] {
        return [...this.plugins.values()].filter(p => p.manifest.type === type);
    }

    /** Health check all initialized plugins */
    async healthCheckAll(): Promise<Map<string, { healthy: boolean; details?: string }>> {
        const results = new Map<string, { healthy: boolean; details?: string }>();
        for (const id of this.initialized) {
            const plugin = this.plugins.get(id);
            if (plugin) {
                try {
                    results.set(id, await plugin.healthCheck());
                } catch (err) {
                    results.set(id, { healthy: false, details: err instanceof Error ? err.message : String(err) });
                }
            }
        }
        return results;
    }

    /** Shutdown all initialized plugins */
    async shutdownAll(): Promise<void> {
        for (const id of this.initialized) {
            const plugin = this.plugins.get(id);
            if (plugin) {
                try {
                    await plugin.shutdown();
                } catch (err) {
                    console.error(`[plugin-registry] Error shutting down ${id}:`, err);
                }
            }
        }
        this.initialized.clear();
    }
}

/** Singleton registry */
export const pluginRegistry = new PluginRegistry();
