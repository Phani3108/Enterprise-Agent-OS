'use client';

import { useState } from 'react';

/**
 * Learning Mode — Internal AI Academy
 *
 * When a user asks "teach me X", the workspace switches to learning mode
 * showing structured content: explanation, architecture diagrams,
 * code examples, and exercises.
 */

interface LearningTopic {
    title: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    estimatedTime: string;
    sections: Section[];
    codeExamples: CodeBlock[];
    exercises: Exercise[];
    internalRefs: Ref[];
}

interface Section { heading: string; content: string; diagram?: string }
interface CodeBlock { title: string; language: string; code: string; runnable: boolean }
interface Exercise { title: string; difficulty: 'easy' | 'medium' | 'hard'; description: string }
interface Ref { title: string; type: string; url: string }

const DEMO_TOPIC: LearningTopic = {
    title: 'Building a RAG Pipeline Using Our Stack',
    level: 'Intermediate',
    estimatedTime: '30 min',
    sections: [
        {
            heading: 'What is RAG?',
            content: 'Retrieval-Augmented Generation combines a retrieval system (vector search) with an LLM to produce answers grounded in real data. Instead of relying on the model\'s training data, RAG injects relevant context at inference time.',
        },
        {
            heading: 'Our Internal Architecture',
            content: 'Our RAG pipeline uses pgvector for embedding storage, the EAOS Memory Pipeline for retrieval (vector + keyword + graph), and the Cognitive Engine for prompt assembly and LLM execution.',
            diagram: `Query → Memory Pipeline
  ├─ Vector Search (pgvector, 60%)
  ├─ Keyword Search (BM25, 20%)
  └─ Knowledge Graph (20%)
      ↓
  Rank + Deduplicate + Pack
      ↓
  Prompt Assembly
      ↓
  LLM Execution
      ↓
  Output Validation`,
        },
        {
            heading: 'Step 1: Embedding Documents',
            content: 'Documents are chunked (512 tokens, 50-token overlap), embedded using text-embedding-3-small, and stored in pgvector with metadata (source, type, namespace, timestamp).',
        },
        {
            heading: 'Step 2: Retrieval',
            content: 'The Memory Pipeline performs a 5-stage retrieval: vector similarity search, keyword BM25 search, knowledge graph expansion, ranking (with recency boost and diversity penalty), and token budget packing.',
        },
        {
            heading: 'Step 3: Prompt Assembly',
            content: 'Retrieved context is assembled into a structured prompt with source citations, system instructions, and output schema requirements. The Cognitive Engine handles this via the Skills Compiler.',
        },
        {
            heading: 'Common Pitfalls',
            content: '• Stuffing too much context (dilutes relevance)\n• Not requiring citations (enables hallucination)\n• Ignoring chunk boundaries (breaks semantic coherence)\n• Missing fallback for zero-retrieval scenarios',
        },
    ],
    codeExamples: [
        {
            title: 'Embedding a document',
            language: 'typescript',
            runnable: false,
            code: `import { MemoryPipeline } from '@agentos/memory-pipeline';

const pipeline = new MemoryPipeline(
  { vectorWeight: 0.6, keywordWeight: 0.2, graphWeight: 0.2 },
  vectorStore,
  keywordIndex,
  knowledgeGraph,
);

const context = await pipeline.retrieve({
  query: 'How does card authorization work?',
  namespaces: ['engineering'],
  knowledgeTypes: ['architecture', 'code'],
  maxResults: 10,
  minRelevance: 0.3,
  expandGraph: true,
  includeKeyword: true,
});

console.log(\`Retrieved \${context.totalAfterRanking} docs (\${context.tokenCount} tokens)\`);`,
        },
        {
            title: 'Prompt with citations',
            language: 'typescript',
            runnable: false,
            code: `const prompt = \`Given the following context:
\${context.documents.map(d => \`[\${d.source}]: \${d.content}\`).join('\\n\\n')}

Answer the question: \${query}

Requirements:
- Cite sources using [source_name] format
- If unsure, say "I don't have enough information"
- Use structured output format
\`;`,
        },
    ],
    exercises: [
        { title: 'Build a simple retriever', difficulty: 'easy', description: 'Create a vector-only retriever that searches Confluence docs and returns the top 5 results with relevance scores.' },
        { title: 'Add hybrid search', difficulty: 'medium', description: 'Extend your retriever to combine vector and keyword search with weighted scoring. Evaluate recall vs. vector-only.' },
        { title: 'Production RAG pipeline', difficulty: 'hard', description: 'Build a full pipeline with graph expansion, citation verification, and hallucination checking. Benchmark against the EAOS Memory Pipeline.' },
    ],
    internalRefs: [
        { title: 'Memory Pipeline source', type: 'github', url: '#' },
        { title: 'RAG Architecture Doc', type: 'confluence', url: '#' },
        { title: 'Embedding best practices', type: 'blogin', url: '#' },
        { title: 'pgvector setup guide', type: 'confluence', url: '#' },
    ],
};

const DIFFICULTY_COLORS = {
    easy: 'bg-success/10 text-success border-success/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    hard: 'bg-danger/10 text-danger border-danger/20',
};

const LEVEL_COLORS = {
    Beginner: 'bg-emerald-500/10 text-emerald-400',
    Intermediate: 'bg-amber-500/10 text-amber-400',
    Advanced: 'bg-red-500/10 text-red-400',
};

export function LearningMode() {
    const [activeTab, setActiveTab] = useState<'content' | 'code' | 'exercises'>('content');
    const topic = DEMO_TOPIC;

    return (
        <div className="glass rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">🎓</span>
                    <h2 className="text-base font-semibold text-white">{topic.title}</h2>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${LEVEL_COLORS[topic.level]}`}>
                        {topic.level}
                    </span>
                    <span className="text-xs text-neutral-500">⏱ {topic.estimatedTime}</span>
                    <span className="text-xs text-neutral-500">📖 {topic.sections.length} sections</span>
                    <span className="text-xs text-neutral-500">💻 {topic.codeExamples.length} examples</span>
                    <span className="text-xs text-neutral-500">🏋️ {topic.exercises.length} exercises</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06]">
                {(['content', 'code', 'exercises'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 text-xs font-medium transition-colors ${activeTab === tab
                                ? 'text-accent border-b-2 border-accent bg-accent/5'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                    >
                        {tab === 'content' ? '📖 Content' : tab === 'code' ? '💻 Code' : '🏋️ Exercises'}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-6 max-h-[500px] overflow-y-auto">
                {activeTab === 'content' && (
                    <div className="space-y-6">
                        {topic.sections.map((section, idx) => (
                            <div key={idx} className="animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                    <span className="text-xs text-neutral-500 font-mono w-5">{idx + 1}.</span>
                                    {section.heading}
                                </h3>
                                <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line pl-7">
                                    {section.content}
                                </p>
                                {section.diagram && (
                                    <pre className="mt-3 ml-7 p-3 rounded-lg bg-surface text-[11px] text-accent font-mono leading-relaxed border border-accent/10">
                                        {section.diagram}
                                    </pre>
                                )}
                            </div>
                        ))}

                        {/* Internal References */}
                        <div className="pt-4 border-t border-white/[0.06]">
                            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                                Internal Resources
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {topic.internalRefs.map((ref, idx) => (
                                    <a
                                        key={idx}
                                        href={ref.url}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-surface hover:bg-surface-overlay transition-colors"
                                    >
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-accent/10 text-accent">
                                            {ref.type}
                                        </span>
                                        <span className="text-xs text-neutral-300">{ref.title}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'code' && (
                    <div className="space-y-4">
                        {topic.codeExamples.map((example, idx) => (
                            <div key={idx} className="rounded-lg border border-white/[0.06] overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2 bg-surface-overlay border-b border-white/[0.06]">
                                    <span className="text-xs font-medium text-white">{example.title}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-neutral-400 font-mono">
                                            {example.language}
                                        </span>
                                        {example.runnable && (
                                            <button className="text-[10px] px-2 py-0.5 rounded bg-accent/20 text-accent hover:bg-accent/30 transition-colors">
                                                ▶ Run
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <pre className="p-4 text-[11px] text-neutral-300 font-mono leading-relaxed overflow-x-auto bg-surface">
                                    {example.code}
                                </pre>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'exercises' && (
                    <div className="space-y-3">
                        {topic.exercises.map((exercise, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-xl border border-white/[0.06] bg-surface hover:bg-surface-overlay transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[exercise.difficulty]}`}>
                                        {exercise.difficulty}
                                    </span>
                                    <h4 className="text-sm font-medium text-white">{exercise.title}</h4>
                                </div>
                                <p className="text-xs text-neutral-400 leading-relaxed">{exercise.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
