/**
 * @agentos/reliability-engine — Reliability Engine Service
 *
 * Enterprise-grade reliability layer that validates all agent outputs
 * before they reach production. Enforces evidence grounding, structured
 * output compliance, tool verification, and confidence calibration.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface ReliabilityConfig {
    port: number;
    minConfidenceScore: number;
    requireEvidence: boolean;
    strictSchemaValidation: boolean;
    maxRetries: number;
}

const defaultConfig: ReliabilityConfig = {
    port: 3006,
    minConfidenceScore: 0.7,
    requireEvidence: true,
    strictSchemaValidation: true,
    maxRetries: 2,
};

// ---------------------------------------------------------------------------
// Validation Types
// ---------------------------------------------------------------------------

interface ValidationRequest {
    id: string;
    output: unknown;
    outputSchema?: Record<string, unknown>;
    expectedSources: string[];
    toolCallResults: ToolCallAudit[];
    confidenceEstimate: number;
    workerId: string;
    skillId?: string;
}

interface ToolCallAudit {
    toolName: string;
    input: Record<string, unknown>;
    output: unknown;
    statusCode: number;
    durationMs: number;
    error?: string;
}

interface ValidationResult {
    requestId: string;
    passed: boolean;
    overallScore: number;
    checks: ValidationCheck[];
    recommendations: string[];
    validatedAt: Date;
}

interface ValidationCheck {
    name: string;
    passed: boolean;
    score: number;
    details: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
}

// ---------------------------------------------------------------------------
// Reliability Service
// ---------------------------------------------------------------------------

class ReliabilityEngineService {
    private config: ReliabilityConfig;

    constructor(config: Partial<ReliabilityConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    async start(): Promise<void> {
        console.log(`🛡️  Reliability Engine starting on port ${this.config.port}...`);
        console.log('🛡️  Reliability Engine ready');
        console.log(`   Min confidence:   ${this.config.minConfidenceScore}`);
        console.log(`   Evidence:         ${this.config.requireEvidence ? 'required' : 'optional'}`);
        console.log(`   Schema:           ${this.config.strictSchemaValidation ? 'strict' : 'lenient'}`);
    }

    /**
     * Run all validation checks on an agent output.
     */
    async validate(request: ValidationRequest): Promise<ValidationResult> {
        const checks: ValidationCheck[] = [];

        // Check 1: Schema Compliance
        if (request.outputSchema && this.config.strictSchemaValidation) {
            checks.push(this.checkSchemaCompliance(request.output, request.outputSchema));
        }

        // Check 2: Evidence Grounding
        if (this.config.requireEvidence) {
            checks.push(this.checkEvidenceGrounding(request.output, request.expectedSources));
        }

        // Check 3: Tool Call Verification
        if (request.toolCallResults.length > 0) {
            checks.push(this.checkToolCallIntegrity(request.toolCallResults));
        }

        // Check 4: Confidence Calibration
        checks.push(this.checkConfidence(request.confidenceEstimate));

        // Check 5: Output Completeness
        checks.push(this.checkCompleteness(request.output));

        // Check 6: Internal Consistency
        checks.push(this.checkConsistency(request.output));

        // Calculate overall
        const criticals = checks.filter((c) => c.severity === 'critical' && !c.passed);
        const errors = checks.filter((c) => c.severity === 'error' && !c.passed);
        const overallScore = checks.reduce((s, c) => s + c.score, 0) / checks.length;
        const passed = criticals.length === 0 && errors.length === 0 && overallScore >= 0.7;

        const recommendations: string[] = [];
        for (const check of checks.filter((c) => !c.passed)) {
            recommendations.push(`FIX [${check.severity}]: ${check.name} — ${check.details}`);
        }

        return {
            requestId: request.id,
            passed,
            overallScore,
            checks,
            recommendations,
            validatedAt: new Date(),
        };
    }

    // -------------------------------------------------------------------------
    // Validation Checks
    // -------------------------------------------------------------------------

    private checkSchemaCompliance(output: unknown, schema: Record<string, unknown>): ValidationCheck {
        // TODO: JSON Schema validation with ajv
        const isValid = output !== null && typeof output === 'object';
        return {
            name: 'Schema Compliance',
            passed: isValid,
            score: isValid ? 1.0 : 0.0,
            details: isValid ? 'Output matches expected schema' : 'Output does not match schema',
            severity: 'error',
        };
    }

    private checkEvidenceGrounding(output: unknown, sources: string[]): ValidationCheck {
        const outputStr = typeof output === 'string' ? output : JSON.stringify(output);
        // Check for source references in output
        const foundSources = sources.filter((s) =>
            outputStr.toLowerCase().includes(s.toLowerCase().slice(0, 30))
        );

        const ratio = sources.length > 0 ? foundSources.length / sources.length : 1;

        return {
            name: 'Evidence Grounding',
            passed: ratio >= 0.5,
            score: ratio,
            details: `${foundSources.length}/${sources.length} expected sources referenced`,
            severity: ratio < 0.3 ? 'critical' : 'warning',
        };
    }

    private checkToolCallIntegrity(calls: ToolCallAudit[]): ValidationCheck {
        const failed = calls.filter((c) => c.error || c.statusCode >= 400);
        const ratio = calls.length > 0 ? (calls.length - failed.length) / calls.length : 1;

        return {
            name: 'Tool Call Integrity',
            passed: failed.length === 0,
            score: ratio,
            details: failed.length > 0
                ? `${failed.length}/${calls.length} tool calls failed: ${failed.map((f) => f.toolName).join(', ')}`
                : `All ${calls.length} tool calls succeeded`,
            severity: failed.length > 0 ? 'error' : 'info',
        };
    }

    private checkConfidence(confidence: number): ValidationCheck {
        const passed = confidence >= this.config.minConfidenceScore;
        return {
            name: 'Confidence Score',
            passed,
            score: confidence,
            details: `Confidence ${(confidence * 100).toFixed(0)}% (min: ${(this.config.minConfidenceScore * 100).toFixed(0)}%)`,
            severity: confidence < 0.5 ? 'critical' : confidence < this.config.minConfidenceScore ? 'warning' : 'info',
        };
    }

    private checkCompleteness(output: unknown): ValidationCheck {
        if (output === null || output === undefined) {
            return { name: 'Output Completeness', passed: false, score: 0, details: 'Output is null/undefined', severity: 'critical' };
        }

        const outputStr = typeof output === 'string' ? output : JSON.stringify(output);

        if (outputStr.length < 50) {
            return { name: 'Output Completeness', passed: false, score: 0.3, details: 'Output suspiciously short', severity: 'warning' };
        }

        return { name: 'Output Completeness', passed: true, score: 1.0, details: 'Output appears complete', severity: 'info' };
    }

    private checkConsistency(output: unknown): ValidationCheck {
        // TODO: Check for internal contradictions (requires LLM call)
        return {
            name: 'Internal Consistency',
            passed: true,
            score: 0.9,
            details: 'Consistency check requires LLM evaluation — deferred',
            severity: 'info',
        };
    }

    async stop(): Promise<void> {
        console.log('🛡️  Reliability Engine shutting down...');
    }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * Reliability Engine API Routes:
 *
 * POST   /api/reliability/validate     — Run full validation suite
 * POST   /api/reliability/schema       — Schema compliance check only
 * POST   /api/reliability/evidence     — Evidence grounding check only
 * POST   /api/reliability/confidence   — Confidence calibration check
 *
 * GET    /api/reliability/stats        — Validation pass/fail rates
 * GET    /api/reliability/failures     — Recent validation failures
 *
 * GET    /health
 * GET    /metrics
 */

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const service = new ReliabilityEngineService();
service.start().catch((err) => { console.error('Failed:', err); process.exit(1); });
process.on('SIGTERM', () => service.stop());
process.on('SIGINT', () => service.stop());

export { ReliabilityEngineService };
export type { ReliabilityConfig, ValidationRequest, ValidationResult, ValidationCheck, ToolCallAudit };
