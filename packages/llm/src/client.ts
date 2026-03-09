/**
 * Unified LLM Client — Provider-agnostic interface for LLM calls
 *
 * Supports: OpenAI, Anthropic (extensible to Vertex, Bedrock)
 * Features: streaming, structured output, retries, token tracking, cost estimation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LLMRequest {
    messages: Message[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    /** JSON schema for structured output */
    responseSchema?: Record<string, unknown>;
    /** Stream response chunks */
    stream?: boolean;
    /** Retry configuration */
    retries?: number;
}

export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMResponse {
    content: string;
    model: string;
    usage: TokenUsage;
    finishReason: string;
    latencyMs: number;
    costUsd: number;
    /** Parsed structured output if responseSchema was provided */
    structured?: Record<string, unknown>;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface StreamChunk {
    content: string;
    done: boolean;
    usage?: TokenUsage;
}

export interface LLMProvider {
    name: string;
    complete(request: LLMRequest): Promise<LLMResponse>;
    stream(request: LLMRequest): AsyncIterable<StreamChunk>;
}

// ---------------------------------------------------------------------------
// Cost table (per 1M tokens)
// ---------------------------------------------------------------------------

const MODEL_COSTS: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'claude-3-5-sonnet': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku': { input: 0.80, output: 4.00 },
    'claude-3-opus': { input: 15.00, output: 75.00 },
};

// ---------------------------------------------------------------------------
// OpenAI Provider
// ---------------------------------------------------------------------------

export class OpenAIProvider implements LLMProvider {
    name = 'openai';
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string, baseUrl = 'https://api.openai.com/v1') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    async complete(request: LLMRequest): Promise<LLMResponse> {
        const startTime = Date.now();
        const model = request.model ?? 'gpt-4o';

        const body: Record<string, unknown> = {
            model,
            messages: request.messages,
            temperature: request.temperature ?? 0.3,
            max_tokens: request.maxTokens ?? 4096,
        };

        if (request.responseSchema) {
            body.response_format = {
                type: 'json_schema',
                json_schema: { name: 'response', schema: request.responseSchema, strict: true },
            };
        }

        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`OpenAI API error ${res.status}: ${err}`);
        }

        const data = await res.json() as any;
        const choice = data.choices[0];
        const usage: TokenUsage = {
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
            totalTokens: data.usage?.total_tokens ?? 0,
        };

        const content = choice.message.content ?? '';
        let structured: Record<string, unknown> | undefined;
        if (request.responseSchema) {
            try { structured = JSON.parse(content); } catch { /* noop */ }
        }

        return {
            content,
            model,
            usage,
            finishReason: choice.finish_reason ?? 'stop',
            latencyMs: Date.now() - startTime,
            costUsd: this.estimateCost(model, usage),
            structured,
        };
    }

    async *stream(request: LLMRequest): AsyncIterable<StreamChunk> {
        const model = request.model ?? 'gpt-4o';
        const body: Record<string, unknown> = {
            model,
            messages: request.messages,
            temperature: request.temperature ?? 0.3,
            max_tokens: request.maxTokens ?? 4096,
            stream: true,
            stream_options: { include_usage: true },
        };

        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
            body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`OpenAI stream error ${res.status}`);
        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();
                if (payload === '[DONE]') { yield { content: '', done: true }; return; }

                try {
                    const data = JSON.parse(payload);
                    const delta = data.choices?.[0]?.delta?.content ?? '';
                    const usage = data.usage ? {
                        promptTokens: data.usage.prompt_tokens ?? 0,
                        completionTokens: data.usage.completion_tokens ?? 0,
                        totalTokens: data.usage.total_tokens ?? 0,
                    } : undefined;
                    yield { content: delta, done: false, usage };
                } catch { /* skip malformed chunks */ }
            }
        }
    }

    private estimateCost(model: string, usage: TokenUsage): number {
        const costs = MODEL_COSTS[model] ?? { input: 5, output: 15 };
        return (usage.promptTokens * costs.input + usage.completionTokens * costs.output) / 1_000_000;
    }
}

// ---------------------------------------------------------------------------
// Anthropic Provider
// ---------------------------------------------------------------------------

export class AnthropicProvider implements LLMProvider {
    name = 'anthropic';
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async complete(request: LLMRequest): Promise<LLMResponse> {
        const startTime = Date.now();
        const model = request.model ?? 'claude-3-5-sonnet-20241022';

        const systemMsg = request.messages.find(m => m.role === 'system')?.content ?? '';
        const userMsgs = request.messages.filter(m => m.role !== 'system');

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: request.maxTokens ?? 4096,
                temperature: request.temperature ?? 0.3,
                system: systemMsg,
                messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
            }),
        });

        if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);

        const data = await res.json() as any;
        const content = data.content?.[0]?.text ?? '';
        const usage: TokenUsage = {
            promptTokens: data.usage?.input_tokens ?? 0,
            completionTokens: data.usage?.output_tokens ?? 0,
            totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
        };

        let structured: Record<string, unknown> | undefined;
        if (request.responseSchema) {
            try { structured = JSON.parse(content); } catch { /* noop */ }
        }

        return {
            content,
            model,
            usage,
            finishReason: data.stop_reason ?? 'end_turn',
            latencyMs: Date.now() - startTime,
            costUsd: this.estimateCost(model, usage),
            structured,
        };
    }

    async *stream(request: LLMRequest): AsyncIterable<StreamChunk> {
        const model = request.model ?? 'claude-3-5-sonnet-20241022';
        const systemMsg = request.messages.find(m => m.role === 'system')?.content ?? '';
        const userMsgs = request.messages.filter(m => m.role !== 'system');

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: request.maxTokens ?? 4096,
                temperature: request.temperature ?? 0.3,
                system: systemMsg,
                messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
                stream: true,
            }),
        });

        if (!res.ok) throw new Error(`Anthropic stream error ${res.status}`);
        if (!res.body) throw new Error('No body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                    const data = JSON.parse(line.slice(6));
                    if (data.type === 'content_block_delta') {
                        yield { content: data.delta?.text ?? '', done: false };
                    } else if (data.type === 'message_stop') {
                        yield { content: '', done: true };
                    }
                } catch { /* skip */ }
            }
        }
    }

    private estimateCost(model: string, usage: TokenUsage): number {
        const key = model.startsWith('claude-3-5-sonnet') ? 'claude-3-5-sonnet' :
            model.startsWith('claude-3-5-haiku') ? 'claude-3-5-haiku' : 'claude-3-opus';
        const costs = MODEL_COSTS[key] ?? { input: 3, output: 15 };
        return (usage.promptTokens * costs.input + usage.completionTokens * costs.output) / 1_000_000;
    }
}

// ---------------------------------------------------------------------------
// Unified Client with retries
// ---------------------------------------------------------------------------

export class LLMClient {
    private providers: Map<string, LLMProvider> = new Map();
    private defaultProvider: string;

    constructor(defaultProvider: string) {
        this.defaultProvider = defaultProvider;
    }

    addProvider(provider: LLMProvider): void {
        this.providers.set(provider.name, provider);
    }

    async complete(request: LLMRequest, providerName?: string): Promise<LLMResponse> {
        const provider = this.providers.get(providerName ?? this.defaultProvider);
        if (!provider) throw new Error(`Provider ${providerName ?? this.defaultProvider} not registered`);

        const maxRetries = request.retries ?? 3;
        let lastError: Error | undefined;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await provider.complete(request);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < maxRetries - 1) {
                    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
                }
            }
        }

        throw lastError ?? new Error('LLM call failed after retries');
    }

    async *stream(request: LLMRequest, providerName?: string): AsyncIterable<StreamChunk> {
        const provider = this.providers.get(providerName ?? this.defaultProvider);
        if (!provider) throw new Error(`Provider not registered`);
        yield* provider.stream(request);
    }

    /**
     * Convenience: complete with structured output schema.
     */
    async structured<T>(request: LLMRequest, providerName?: string): Promise<T> {
        const response = await this.complete(request, providerName);
        if (response.structured) return response.structured as T;
        try { return JSON.parse(response.content) as T; }
        catch { throw new Error('Failed to parse structured response'); }
    }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLLMClient(config: {
    provider: 'openai' | 'anthropic';
    apiKey: string;
    baseUrl?: string;
}): LLMClient {
    const client = new LLMClient(config.provider);

    if (config.provider === 'openai') {
        client.addProvider(new OpenAIProvider(config.apiKey, config.baseUrl));
    } else {
        client.addProvider(new AnthropicProvider(config.apiKey));
    }

    return client;
}
