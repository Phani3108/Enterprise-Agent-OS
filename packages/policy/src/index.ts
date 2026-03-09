/**
 * @agentos/policy — Package entrypoint
 */

// Types
export type {
    Policy,
    PolicyScope,
    PolicyScopeType,
    PolicyAction,
    PolicyActionType,
    PolicyCondition,
    FieldCondition,
    AllCondition,
    AnyCondition,
    NotCondition,
    PolicyDecision,
    PolicyEvaluationResult,
    PolicyMatch,
    EvaluationContext,
} from './types.js';

// Engine
export { PolicyEngine } from './engine.js';

// Parser
export { parsePolicy, parsePolicies, PolicyParseError } from './parser.js';
