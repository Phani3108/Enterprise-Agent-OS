export { MarketingExecutionAgent } from './marketing.js';
export type { MarketingRequest, MarketingAction, MarketingResult, Deliverable } from './marketing.js';

export { EngineeringIntelligenceAgent } from './engineering.js';
export type { EngineeringRequest, EngineeringAction, KnowledgeAnswer } from './engineering.js';

export { LearningUpskillingAgent } from './learning.js';
export type { LearningRequest, LearningAction, LearningModule, PromptTemplate, ModelComparison } from './learning.js';

export { CrossDomainFlowEngine, KNOWLEDGE_FLOWS } from './cross-domain.js';
export type { KnowledgeFlowTrigger, KnowledgeFlowTarget, KnowledgeFlowResult } from './cross-domain.js';
