/**
 * @agentos/simulation — Simulation Mode for Risky Actions
 *
 * Provides dry-run and shadow execution capabilities.
 * In simulation mode, tool calls are intercepted, side effects are blocked,
 * and results are synthetic — allowing safe testing of workflows and
 * worker behavior without real-world impact.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SimulationMode = 'off' | 'dry-run' | 'shadow' | 'replay';

export interface SimulationConfig {
    mode: SimulationMode;
    /** Tools that are allowed to execute even in simulation mode */
    allowedTools: string[];
    /** Whether to record all actions for later replay */
    recordActions: boolean;
    /** Whether to generate synthetic outputs */
    generateSyntheticOutputs: boolean;
    /** Maximum actions before auto-stopping */
    maxActions: number;
}

export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
    mode: 'dry-run',
    allowedTools: [],
    recordActions: true,
    generateSyntheticOutputs: true,
    maxActions: 1000,
};

export interface SimulatedAction {
    id: string;
    timestamp: Date;
    type: 'tool_call' | 'event_publish' | 'delegation' | 'approval' | 'state_change';
    details: {
        name: string;
        args: Record<string, unknown>;
        wouldHaveExecuted: boolean;
        blocked: boolean;
        blockReason?: string;
    };
    syntheticResult?: unknown;
    originalRiskTier?: string;
}

export interface SimulationReport {
    id: string;
    mode: SimulationMode;
    startedAt: Date;
    completedAt: Date;
    totalActions: number;
    blockedActions: number;
    allowedActions: number;
    actions: SimulatedAction[];
    riskAssessment: {
        highRiskActions: number;
        criticalRiskActions: number;
        totalEstimatedCostUsd: number;
        affectedSystems: string[];
    };
    recommendation: 'safe_to_execute' | 'review_required' | 'do_not_execute';
}

// ---------------------------------------------------------------------------
// Simulation Engine
// ---------------------------------------------------------------------------

export class SimulationEngine {
    private config: SimulationConfig;
    private actions: SimulatedAction[] = [];
    private running = false;
    private startTime?: Date;

    constructor(config: Partial<SimulationConfig> = {}) {
        this.config = { ...DEFAULT_SIMULATION_CONFIG, ...config };
    }

    /**
     * Start a simulation session.
     */
    start(): void {
        this.running = true;
        this.actions = [];
        this.startTime = new Date();
        console.log(`🧪 Simulation started (mode: ${this.config.mode})`);
    }

    /**
     * Stop the simulation and generate a report.
     */
    stop(): SimulationReport {
        this.running = false;
        const report = this.generateReport();
        console.log(`🧪 Simulation complete: ${report.totalActions} actions, ${report.blockedActions} blocked`);
        return report;
    }

    /**
     * Check if simulation mode is active.
     */
    isActive(): boolean {
        return this.running && this.config.mode !== 'off';
    }

    /**
     * Intercept a tool call — block or allow based on simulation rules.
     */
    interceptToolCall(
        toolName: string,
        args: Record<string, unknown>,
        riskTier: string
    ): { allowed: boolean; syntheticResult?: unknown; action: SimulatedAction } {
        if (this.actions.length >= this.config.maxActions) {
            throw new Error(`Simulation action limit reached (max: ${this.config.maxActions})`);
        }

        const isAllowed = this.config.allowedTools.includes(toolName);
        const isBlocked = !isAllowed && (riskTier !== 'read-only' || this.config.mode === 'dry-run');

        const action: SimulatedAction = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type: 'tool_call',
            details: {
                name: toolName,
                args,
                wouldHaveExecuted: true,
                blocked: isBlocked,
                blockReason: isBlocked ? `Simulation mode: ${this.config.mode}` : undefined,
            },
            originalRiskTier: riskTier,
        };

        // Generate synthetic output if configured
        if (isBlocked && this.config.generateSyntheticOutputs) {
            action.syntheticResult = {
                _simulated: true,
                toolName,
                status: 'success',
                data: `[Simulated output for ${toolName}]`,
            };
        }

        if (this.config.recordActions) {
            this.actions.push(action);
        }

        return {
            allowed: !isBlocked,
            syntheticResult: action.syntheticResult,
            action,
        };
    }

    /**
     * Intercept an event publish.
     */
    interceptEvent(eventType: string, data: unknown): SimulatedAction {
        const action: SimulatedAction = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type: 'event_publish',
            details: {
                name: eventType,
                args: data as Record<string, unknown>,
                wouldHaveExecuted: true,
                blocked: this.config.mode === 'dry-run',
                blockReason: this.config.mode === 'dry-run' ? 'Events blocked in dry-run mode' : undefined,
            },
        };

        if (this.config.recordActions) {
            this.actions.push(action);
        }

        return action;
    }

    /**
     * Get all recorded actions.
     */
    getActions(): SimulatedAction[] {
        return [...this.actions];
    }

    // -------------------------------------------------------------------------
    // Report Generation
    // -------------------------------------------------------------------------

    private generateReport(): SimulationReport {
        const blockedActions = this.actions.filter((a) => a.details.blocked);
        const highRisk = this.actions.filter(
            (a) => a.originalRiskTier === 'high' || a.originalRiskTier === 'critical'
        );
        const criticalRisk = this.actions.filter(
            (a) => a.originalRiskTier === 'critical'
        );

        const affectedSystems = new Set<string>();
        for (const action of this.actions) {
            const toolName = action.details.name;
            const system = toolName.split('.')[0]; // e.g., "github" from "github.pull_request.comment"
            affectedSystems.add(system);
        }

        let recommendation: SimulationReport['recommendation'] = 'safe_to_execute';
        if (criticalRisk.length > 0) {
            recommendation = 'do_not_execute';
        } else if (highRisk.length > 0) {
            recommendation = 'review_required';
        }

        return {
            id: crypto.randomUUID(),
            mode: this.config.mode,
            startedAt: this.startTime!,
            completedAt: new Date(),
            totalActions: this.actions.length,
            blockedActions: blockedActions.length,
            allowedActions: this.actions.length - blockedActions.length,
            actions: this.actions,
            riskAssessment: {
                highRiskActions: highRisk.length,
                criticalRiskActions: criticalRisk.length,
                totalEstimatedCostUsd: 0, // TODO: estimate from model router
                affectedSystems: Array.from(affectedSystems),
            },
            recommendation,
        };
    }
}
