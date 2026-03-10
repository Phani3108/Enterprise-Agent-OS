/**
 * AgentOS Unified Data Model
 *
 * Source of truth TypeScript interfaces for all platform entities.
 * Matches the AgentOS Data Model Blueprint exactly.
 *
 * © 2025 Phani Marupaka. All rights reserved.
 */

// ---------------------------------------------------------------------------
// Enums & Literals
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'user' | 'corp_it' | 'moderator';
export type UserStatus = 'active' | 'inactive' | 'pending';

export type ToolCategory =
  | 'productivity' | 'design' | 'crm' | 'ads' | 'engineering'
  | 'analytics' | 'storage' | 'hr' | 'finance' | 'legal' | 'custom';
export type ToolAuthType = 'oauth' | 'api_key' | 'mcp' | 'manual';
export type ToolStatus = 'active' | 'beta' | 'deprecated';

export type ConnectionStatus =
  | 'not_connected' | 'connected' | 'expired' | 'permission_required' | 'sandbox';

export type AgentType = 'system' | 'persona' | 'skill' | 'workflow' | 'tool_proxy';
export type AgentStatus = 'active' | 'beta' | 'disabled';

export type SkillStatus = 'draft' | 'published' | 'archived';
export type SkillVisibility = 'private' | 'team' | 'organization';

export type WorkflowStatus = 'draft' | 'published' | 'archived';
export type WorkflowVisibility = 'private' | 'team' | 'organization';

export type PromptStatus = 'draft' | 'published' | 'archived';

export type ExecutionStatus =
  | 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
export type StepType = 'intent' | 'agent' | 'tool' | 'prompt' | 'workflow' | 'approval' | 'output';
export type StepStatus = 'queued' | 'running' | 'completed' | 'failed' | 'skipped';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type ArtifactType =
  | 'document' | 'ticket' | 'page' | 'design' | 'campaign'
  | 'file' | 'blog_post' | 'report' | 'commentary' | 'other';
export type StorageType = 'local' | 'google_drive' | 's3' | 'tool_native' | 'internal';

export type VoteTargetType = 'skill' | 'prompt' | 'workflow' | 'tool' | 'blog_post' | 'recommendation_post';
export type VoteType = 'up' | 'down';

export type CommentTargetType = 'skill' | 'prompt' | 'workflow' | 'tool' | 'blog_post' | 'recommendation_post';
export type CommentStatus = 'active' | 'edited' | 'deleted';

export type BlogPostStatus = 'draft' | 'published' | 'archived';
export type BlogPublishTargetType = 'internal' | 'blogin' | 'linkedin' | 'medium';
export type PublishTargetStatus = 'pending' | 'published' | 'failed';

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'active' | 'archived';

export type MemoryNodeType =
  | 'user' | 'persona' | 'skill' | 'workflow' | 'agent' | 'tool' | 'execution' | 'artifact' | 'feedback';

export type ACPMessagePriority = 'low' | 'medium' | 'high';
export type ACPMessageStatus = 'sent' | 'received' | 'processed' | 'failed';

export type BillingPeriod = 'monthly' | 'quarterly' | 'annual' | 'one_time';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'pending';

export type TourPlacement = 'top' | 'right' | 'bottom' | 'left' | 'center';
export type TourStatus = 'active' | 'archived';

// ---------------------------------------------------------------------------
// 1. User
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role: UserRole;
  personaId?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// ---------------------------------------------------------------------------
// 2. Persona
// ---------------------------------------------------------------------------

export interface Persona {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color?: string;
  sortOrder: number;
  isSystem: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  // Computed / joined
  skillCount?: number;
  toolCount?: number;
  agentCount?: number;
}

// ---------------------------------------------------------------------------
// 3. Tool
// ---------------------------------------------------------------------------

export interface Tool {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  description: string;
  iconUrl?: string;
  authType: ToolAuthType;
  status: ToolStatus;
  isSystem: boolean;
  supportsSandbox: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  capabilities?: ToolCapability[];
}

export interface ToolCapability {
  id: string;
  toolId: string;
  capabilityKey: string;
  capabilityLabel: string;
  description: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 4. UserToolConnection
// ---------------------------------------------------------------------------

export interface UserToolConnection {
  id: string;
  userId: string;
  toolId: string;
  connectionName: string;
  status: ConnectionStatus;
  authReference?: string;
  connectedAt?: string;
  lastValidatedAt?: string;
  expiresAt?: string;
  scopesJson?: Record<string, unknown>;
  metadataJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 5. LicenseRecord
// ---------------------------------------------------------------------------

export interface LicenseRecord {
  id: string;
  toolId: string;
  toolName?: string;
  userId?: string;
  assignedBy?: string;
  licenseType: string;
  costAmount: number;
  costCurrency: string;
  billingPeriod: BillingPeriod;
  startsAt?: string;
  expiresAt?: string;
  status: LicenseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  usedLicenses?: number;
  totalLicenses?: number;
  users?: string[];
}

// ---------------------------------------------------------------------------
// 6. Agent
// ---------------------------------------------------------------------------

export interface Agent {
  id: string;
  name: string;
  slug: string;
  personaId?: string;
  description: string;
  agentType: AgentType;
  runtimeKey: string;
  configJson?: Record<string, unknown>;
  status: AgentStatus;
  model?: string;
  tokensUsed?: number;
  successRate?: number;
  avgLatencyMs?: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 7. Prompt
// ---------------------------------------------------------------------------

export interface Prompt {
  id: string;
  title: string;
  slug: string;
  personaId?: string;
  category: string;
  summary: string;
  bestModel?: string;
  status: PromptStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  versions?: PromptVersion[];
  currentVersion?: PromptVersion;
  // Engagement
  upvotes?: number;
  downvotes?: number;
  forkCount?: number;
  usageCount?: number;
  isPinned?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

export interface PromptVersion {
  id: string;
  promptId: string;
  versionNumber: number;
  content: string;
  inputSchemaJson?: Record<string, unknown>;
  tagsJson?: string[];
  isCurrent: boolean;
  createdBy: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 8. Skill
// ---------------------------------------------------------------------------

export interface Skill {
  id: string;
  name: string;
  slug: string;
  personaId?: string;
  personaName?: string;
  category: string;
  summary: string;
  description: string;
  status: SkillStatus;
  visibility: SkillVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  versions?: SkillVersion[];
  currentVersion?: SkillVersion;
  // Relations
  requiredTools?: SkillToolRequirement[];
  agents?: string[];
  promptIds?: string[];
  workflowIds?: string[];
  // Metrics
  usageCount?: number;
  successRate?: number;
  avgRuntimeSec?: number;
  timeSavedHours?: number;
  monthlyCost?: number;
  upvotes?: number;
  downvotes?: number;
  isEnabled?: boolean;
  qualityTier?: 'production' | 'certified' | 'beta' | 'experimental';
  tags?: string[];
}

export interface SkillVersion {
  id: string;
  skillId: string;
  versionNumber: number;
  contentMarkdown?: string;
  inputSchemaJson?: Record<string, unknown>;
  outputSchemaJson?: Record<string, unknown>;
  configJson?: Record<string, unknown>;
  isCurrent: boolean;
  createdBy: string;
  createdAt: string;
}

export interface SkillToolRequirement {
  id: string;
  skillId: string;
  toolId: string;
  toolName?: string;
  required: boolean;
  capabilityKey?: string;
}

// ---------------------------------------------------------------------------
// 9. Workflow
// ---------------------------------------------------------------------------

export interface Workflow {
  id: string;
  name: string;
  slug: string;
  personaId?: string;
  summary: string;
  status: WorkflowStatus;
  visibility: WorkflowVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  versions?: WorkflowVersion[];
  currentVersion?: WorkflowVersion;
  // Metrics
  usageCount?: number;
  successRate?: number;
  tags?: string[];
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  graphJson: WorkflowGraph;
  inputSchemaJson?: Record<string, unknown>;
  outputSchemaJson?: Record<string, unknown>;
  isCurrent: boolean;
  createdBy: string;
  createdAt: string;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'agent' | 'tool' | 'skill' | 'decision' | 'worker';
  label: string;
  x?: number;
  y?: number;
  config?: Record<string, unknown>;
  status?: StepStatus;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
}

// ---------------------------------------------------------------------------
// 10. Execution
// ---------------------------------------------------------------------------

export interface Execution {
  id: string;
  userId: string;
  personaId?: string;
  skillId?: string;
  workflowId?: string;
  promptId?: string;
  status: ExecutionStatus;
  intentText?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  success?: boolean;
  errorSummary?: string;
  createdAt: string;
  steps?: ExecutionStep[];
  logs?: ExecutionLog[];
  artifacts?: OutputArtifact[];
  // Joined
  skillName?: string;
  personaName?: string;
  agentsUsed?: string[];
  toolsUsed?: string[];
  tokensUsed?: number;
  costUsd?: number;
}

export interface ExecutionStep {
  id: string;
  executionId: string;
  stepOrder: number;
  stepType: StepType;
  agentId?: string;
  agentName?: string;
  toolId?: string;
  toolName?: string;
  name: string;
  status: StepStatus;
  inputJson?: Record<string, unknown>;
  outputJson?: Record<string, unknown>;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  executionStepId?: string;
  level: LogLevel;
  message: string;
  metadataJson?: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 11. OutputArtifact
// ---------------------------------------------------------------------------

export interface OutputArtifact {
  id: string;
  executionId: string;
  artifactType: ArtifactType;
  title: string;
  storageType: StorageType;
  storageReference?: string;
  previewText?: string;
  metadataJson?: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 12. Vote
// ---------------------------------------------------------------------------

export interface Vote {
  id: string;
  userId: string;
  targetType: VoteTargetType;
  targetId: string;
  voteType: VoteType;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 13. Comment
// ---------------------------------------------------------------------------

export interface Comment {
  id: string;
  userId: string;
  userName?: string;
  targetType: CommentTargetType;
  targetId: string;
  parentCommentId?: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

// ---------------------------------------------------------------------------
// 14. RecommendationPost / Forum Thread
// ---------------------------------------------------------------------------

export interface RecommendationPost {
  id: string;
  userId: string;
  userName?: string;
  personaId?: string;
  title: string;
  slug: string;
  body: string;
  topicTagsJson?: string[];
  status: 'active' | 'archived' | 'locked';
  isPinned?: boolean;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  viewCount: number;
  category?: string;
  acceptedReplyId?: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface RecommendationReply {
  id: string;
  postId: string;
  userId: string;
  userName?: string;
  parentReplyId?: string;
  content: string;
  upvotes: number;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// 15. BlogPost
// ---------------------------------------------------------------------------

export interface BlogPost {
  id: string;
  userId: string;
  authorName?: string;
  title: string;
  slug: string;
  summary?: string;
  contentMarkdown: string;
  contentHtml?: string;
  status: BlogPostStatus;
  tags?: string[];
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  publishTargets?: BlogPublishTarget[];
  externalUrls?: Record<string, string>;
}

export interface BlogPublishTarget {
  id: string;
  blogPostId: string;
  targetType: BlogPublishTargetType;
  status: PublishTargetStatus;
  externalReference?: string;
  publishedAt?: string;
  metadataJson?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 16. Course
// ---------------------------------------------------------------------------

export interface Course {
  id: string;
  personaId?: string;
  title: string;
  slug: string;
  description: string;
  contentUrl?: string;
  provider?: string;
  difficulty: CourseDifficulty;
  status: CourseStatus;
  durationHours?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  // Engagement
  likes?: number;
  dislikes?: number;
  pins?: number;
  views?: number;
  isPinned?: boolean;
}

// ---------------------------------------------------------------------------
// 17. Memory Graph
// ---------------------------------------------------------------------------

export interface MemoryNode {
  id: string;
  nodeType: MemoryNodeType;
  entityId: string;
  title?: string;
  propertiesJson?: Record<string, unknown>;
  createdAt: string;
  // Graph layout
  x?: number;
  y?: number;
  radius?: number;
  color?: string;
}

export interface MemoryEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: string;
  weight?: number;
  propertiesJson?: Record<string, unknown>;
  createdAt: string;
}

export interface MemoryGraph {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    mostConnectedNode?: string;
    topSkills?: string[];
    topTools?: string[];
  };
}

// ---------------------------------------------------------------------------
// 18. ACP Message
// ---------------------------------------------------------------------------

export interface ACPMessage {
  id: string;
  executionId: string;
  senderAgentId: string;
  senderAgentName?: string;
  targetAgentId?: string;
  targetAgentName?: string;
  eventType: string;
  payloadJson?: Record<string, unknown>;
  priority: ACPMessagePriority;
  status: ACPMessageStatus;
  createdAt: string;
  processedAt?: string;
}

export interface ACPExecution {
  id: string;
  name: string;
  personaName: string;
  skillName?: string;
  status: ExecutionStatus;
  startedAt: string;
  agents: Agent[];
  messages: ACPMessage[];
}

// ---------------------------------------------------------------------------
// 19. Guided Tour
// ---------------------------------------------------------------------------

export interface GuidedTour {
  id: string;
  name: string;
  slug: string;
  pageKey: string;
  status: TourStatus;
  createdAt: string;
  updatedAt: string;
  steps?: GuidedTourStep[];
}

export interface GuidedTourStep {
  id: string;
  tourId: string;
  stepOrder: number;
  title: string;
  body: string;
  selector: string;
  placement: TourPlacement;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// 20. Platform Stats (API response shapes)
// ---------------------------------------------------------------------------

export interface PlatformStats {
  totalAgents: number;
  activeAgents: number;
  skillsExecutedToday: number;
  skillsExecutedTotal: number;
  toolCallsToday: number;
  workflowsRunning: number;
  errorRate: number;
  avgLatencyMs: number;
  totalUsers: number;
  costTodayUsd: number;
  uptime: number;
}

export interface PlatformMetrics {
  stats: PlatformStats;
  agentRuntimes: AgentRuntime[];
  recentAlerts: SystemAlert[];
  serviceHealth: ServiceHealth[];
}

export interface AgentRuntime {
  agentId: string;
  agentName: string;
  personaName: string;
  model: string;
  status: AgentStatus;
  tokensUsed: number;
  lastAction: string;
  lastActionAt: string;
  successRate: number;
}

export interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  service?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  uptime: number;
  lastCheckedAt: string;
}

// ---------------------------------------------------------------------------
// 21. Governance (Corp IT)
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  targetType: string;
  targetId: string;
  targetName: string;
  result: 'success' | 'failure' | 'warning';
  metadata?: Record<string, unknown>;
}

export interface CostAttribution {
  personaId: string;
  personaName: string;
  personaIcon: string;
  skillsUsed: number;
  toolCalls: number;
  estimatedCostUsd: number;
  budgetUsd: number;
  budgetPct: number;
}

export interface ComplianceCheck {
  id: string;
  policy: string;
  category: string;
  status: 'pass' | 'fail' | 'warning' | 'n/a';
  detail: string;
  lastCheckedAt: string;
}
