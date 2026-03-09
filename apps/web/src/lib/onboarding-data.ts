/**
 * Onboarding Data — Role definitions, use cases, and quick-start cards
 */

export interface Role {
    id: string;
    label: string;
    icon: string;
    description: string;
    color: string;
}

export interface UseCase {
    id: string;
    label: string;
    icon: string;
    roleIds: string[];
}

export interface QuickStartCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    query: string;
    roleIds: string[];
    domain: string;
    color: string;
}

export const ROLES: Role[] = [
    { id: 'engineer', label: 'Engineer', icon: '🔧', description: 'Build, debug, review code, and analyze incidents', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
    { id: 'marketing', label: 'Marketing', icon: '📣', description: 'Plan campaigns, analyze markets, generate content', color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30' },
    { id: 'product', label: 'Product & Strategy', icon: '🎯', description: 'Roadmaps, strategy analysis, decision support', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
    { id: 'learner', label: 'Learner', icon: '🎓', description: 'Learn AI, explore skills, guided tutorials', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30' },
    { id: 'operator', label: 'Operator & Admin', icon: '⚙️', description: 'Monitor systems, manage policies, observe traces', color: 'from-cyan-500/20 to-sky-500/20 border-cyan-500/30' },
];

export const USE_CASES: UseCase[] = [
    { id: 'search-knowledge', label: 'Search internal knowledge', icon: '📚', roleIds: ['engineer', 'marketing', 'product', 'learner', 'operator'] },
    { id: 'incident-analysis', label: 'Analyze production incidents', icon: '🚨', roleIds: ['engineer', 'operator'] },
    { id: 'pr-review', label: 'Review PRs for architecture', icon: '🔍', roleIds: ['engineer'] },
    { id: 'campaign-planning', label: 'Plan marketing campaigns', icon: '📊', roleIds: ['marketing', 'product'] },
    { id: 'transcript-summary', label: 'Summarize meeting transcripts', icon: '📋', roleIds: ['engineer', 'marketing', 'product', 'operator'] },
    { id: 'learn-ai', label: 'Learn AI / upskill', icon: '🎓', roleIds: ['learner', 'engineer'] },
    { id: 'workflow-automation', label: 'Automate workflows', icon: '⚡', roleIds: ['engineer', 'operator', 'product'] },
    { id: 'monitor-systems', label: 'Monitor system traces', icon: '🔍', roleIds: ['operator', 'engineer'] },
];

export const QUICK_START_CARDS: QuickStartCard[] = [
    // Engineer
    {
        id: 'qs-explain-service', title: 'Explain a Service', description: 'Get architecture, dependencies, owners, and related docs for any internal service.',
        icon: '📖', query: 'Explain the card authorization service', roleIds: ['engineer'],
        domain: 'Engineering', color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
    },
    {
        id: 'qs-analyze-incident', title: 'Analyze an Incident', description: 'Root cause analysis with logs, metrics, recent deployments, and remediation steps.',
        icon: '🚨', query: 'Analyze incident INC-3421 on payments-api', roleIds: ['engineer', 'operator'],
        domain: 'Engineering', color: 'from-red-500/10 to-orange-500/10 border-red-500/20',
    },
    {
        id: 'qs-summarize-meeting', title: 'Summarize a Meeting', description: 'Extract decisions, action items, and draft Jira tickets from meeting notes.',
        icon: '📋', query: 'Summarize meeting transcript and create action items', roleIds: ['engineer', 'product'],
        domain: 'Leadership', color: 'from-amber-500/10 to-yellow-500/10 border-amber-500/20',
    },
    // Marketing
    {
        id: 'qs-campaign', title: 'Generate a Campaign', description: 'Full campaign with ICP, messaging, channels, content calendar, and KPIs.',
        icon: '📊', query: 'Create campaign for community banks around card modernization', roleIds: ['marketing'],
        domain: 'Marketing', color: 'from-orange-500/10 to-amber-500/10 border-orange-500/20',
    },
    {
        id: 'qs-explore-skills', title: 'Explore Skills', description: 'Browse the skill library — reusable AI capabilities with success rates and usage stats.',
        icon: '🧩', query: '', roleIds: ['marketing', 'learner'],
        domain: 'Skills', color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
    },
    // Learner
    {
        id: 'qs-learn-rag', title: 'Learn RAG', description: 'Structured tutorial on building RAG pipelines using your internal stack.',
        icon: '🎓', query: 'Teach me how to build a RAG pipeline using our internal stack', roleIds: ['learner'],
        domain: 'Learning', color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
    },
    {
        id: 'qs-prompt-eng', title: 'Prompt Engineering', description: 'Comprehensive guide to prompt engineering with internal examples.',
        icon: '✍️', query: 'Teach me prompt engineering best practices', roleIds: ['learner', 'engineer'],
        domain: 'Learning', color: 'from-teal-500/10 to-cyan-500/10 border-teal-500/20',
    },
    // Operator
    {
        id: 'qs-view-traces', title: 'View Execution Traces', description: 'See every LLM call, tool invocation, and policy check with duration and cost.',
        icon: '🔍', query: '', roleIds: ['operator'],
        domain: 'System', color: 'from-cyan-500/10 to-sky-500/10 border-cyan-500/20',
    },
    // Product
    {
        id: 'qs-strategy', title: 'Strategy Analysis', description: 'SWOT, competitive analysis, and scenario planning for executive decisions.',
        icon: '🎯', query: 'Run a SWOT analysis for our payments platform', roleIds: ['product'],
        domain: 'Strategy', color: 'from-purple-500/10 to-indigo-500/10 border-purple-500/20',
    },
];

export function getQuickStartsForRole(roleId: string): QuickStartCard[] {
    return QUICK_START_CARDS.filter(card => card.roleIds.includes(roleId));
}

export function getUseCasesForRole(roleId: string): UseCase[] {
    return USE_CASES.filter(uc => uc.roleIds.includes(roleId));
}
