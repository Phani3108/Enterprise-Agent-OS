/**
 * @agentos/cognition — Package entrypoint
 */

// Reasoning
export {
    ReasoningLoop,
    TaskDecomposer,
    DEFAULT_REASONING_CONFIG,
} from './reasoning.js';
export type {
    ReasoningPhase, ReasoningStep, ReasoningLoopConfig,
    ReasoningResult, DecomposedTask, SubTask, CognitiveLLM,
} from './reasoning.js';

// Debate
export { DebateEngine, DEFAULT_DEBATE_CONFIG } from './debate.js';
export type {
    DebateConfig, Debater, DebateArgument, DebateResult,
} from './debate.js';

// Hallucination Suppression
export {
    HallucinationPipeline,
    DEFAULT_HALLUCINATION_CONFIG,
} from './hallucination.js';
export type {
    HallucinationCheckResult, FactualClaim, HallucinationConfig,
} from './hallucination.js';

// Long-Horizon Planning
export { LongHorizonPlanner } from './planning.js';
export type {
    PlanHorizon, Plan, PlanStep, PlanCheckpoint, PlanRevision,
} from './planning.js';
