/**
 * Forum Store — Reddit-style discussion threads.
 *
 * All activity is authenticated (no anonymous posts).
 */

export type PostStatus = 'open' | 'answered' | 'closed' | 'pinned';

export interface ForumThread {
    id: string;
    title: string;
    body: string;
    category: string;
    tags: string[];
    authorId: string;
    authorName: string;
    status: PostStatus;
    isPinned: boolean;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    lastActivityAt: string;
    acceptedCommentId?: string;
}

export interface ForumComment {
    id: string;
    threadId: string;
    parentId?: string;
    authorId: string;
    authorName: string;
    body: string;
    upvotes: number;
    isAccepted: boolean;
    createdAt: string;
    updatedAt: string;
}

export type VoteType = 'up' | 'down' | 'none';

export class ForumStore {
    private threads = new Map<string, ForumThread>();
    private comments = new Map<string, ForumComment>(); // id → comment
    private threadComments = new Map<string, string[]>(); // threadId → commentIds
    private votes = new Map<string, VoteType>(); // `${userId}:thread:${id}` or `${userId}:comment:${id}`

    constructor() {
        this.seed();
    }

    private seed(): void {
        const threads: ForumThread[] = [
            {
                id: 'p1',
                title: 'Best workflow for generating product roadmaps from customer feedback?',
                body: 'I\'ve been trying to use the PRD Generator skill to build product roadmaps, but I\'m struggling to ingest bulk customer feedback from Jira and Intercom simultaneously.\n\nHas anyone solved this multi-source ingestion pattern?',
                category: 'workflows',
                tags: ['product', 'roadmap', 'jira', 'customer-feedback'],
                authorId: 'user-2',
                authorName: 'Sarah Chen',
                status: 'answered',
                isPinned: true,
                upvotes: 42,
                downvotes: 2,
                commentCount: 8,
                viewCount: 234,
                createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                lastActivityAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                acceptedCommentId: 'c1',
            },
            {
                id: 'p2',
                title: 'Recommendation: Add GitHub Actions integration to the CI/CD skill',
                body: 'Currently the CI/CD skill only connects to Jenkins and CircleCI. Many teams (including ours) are fully on GitHub Actions. I\'d love to see native support for workflow file generation and pipeline status monitoring.',
                category: 'skills',
                tags: ['github', 'ci-cd', 'feature-request'],
                authorId: 'user-3',
                authorName: 'Marcus Webb',
                status: 'open',
                isPinned: false,
                upvotes: 67,
                downvotes: 1,
                commentCount: 5,
                viewCount: 389,
                createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
                lastActivityAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            },
            {
                id: 'p3',
                title: 'How do you handle rate limits when running 10+ agents in parallel?',
                body: 'When we run our full engineering workflow, we hit OpenAI rate limits within a minute. Is there a built-in rate limit manager in the Agent Runtime?',
                category: 'agents',
                tags: ['rate-limits', 'parallelism', 'engineering'],
                authorId: 'user-4',
                authorName: 'Yuki Tanaka',
                status: 'open',
                isPinned: false,
                upvotes: 31,
                downvotes: 0,
                commentCount: 4,
                viewCount: 178,
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
                lastActivityAt: new Date(Date.now() - 18 * 3600000).toISOString(),
            },
            {
                id: 'p4',
                title: 'Canva integration returning 403 — OAuth scope issue?',
                body: 'Just connected Canva via the Tools page. Authentication appears to succeed but when I run the Brand Asset Generator skill, it throws a 403 Forbidden — insufficient_scope: write:designs',
                category: 'tools',
                tags: ['canva', 'oauth', 'troubleshooting'],
                authorId: 'user-5',
                authorName: 'Fatima Al-Hassan',
                status: 'open',
                isPinned: false,
                upvotes: 15,
                downvotes: 0,
                commentCount: 3,
                viewCount: 91,
                createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
                updatedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
                lastActivityAt: new Date(Date.now() - 10 * 3600000).toISOString(),
            },
            {
                id: 'p5',
                title: 'Weekly thread: Share your favorite AgentOS skill combos!',
                body: 'Every week I\'ll post a thread for the community to share their favorite skill combinations. I\'ll kick it off:\n\nMy favorite combo: Transcript → Actions → Sprint Planning → Jira Epic Creator\n\nOne meeting turns into fully created Jira epics with stories and acceptance criteria.',
                category: 'general',
                tags: ['showcase', 'weekly', 'productivity'],
                authorId: 'user-6',
                authorName: 'Riley Johnson',
                status: 'pinned',
                isPinned: true,
                upvotes: 89,
                downvotes: 3,
                commentCount: 12,
                viewCount: 512,
                createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
                lastActivityAt: new Date(Date.now() - 36 * 3600000).toISOString(),
            },
        ];

        for (const t of threads) {
            this.threads.set(t.id, t);
            this.threadComments.set(t.id, []);
        }

        // Seed comments
        const comments: ForumComment[] = [
            {
                id: 'c1', threadId: 'p1', authorId: 'user-7', authorName: 'Alex Kim',
                body: 'I solved this exact problem! Use the Knowledge Graph skill with the multi-source connector. Set sources: ["jira", "intercom"] in the config.',
                upvotes: 28, isAccepted: true,
                createdAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
            },
            {
                id: 'c2', threadId: 'p1', authorId: 'user-8', authorName: 'Priya Sharma',
                body: 'Also worth looking at the Campaign Strategy skill — it has a feedback-synthesis mode.',
                upvotes: 11, isAccepted: false,
                createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            },
            {
                id: 'c3', threadId: 'p2', authorId: 'user-9', authorName: 'Jordan Lee',
                body: 'Strongly +1 on this. We\'re already using the GitHub tool integration — it just needs workflow file support.',
                upvotes: 19, isAccepted: false,
                createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
            },
            {
                id: 'c4', threadId: 'p3', authorId: 'admin', authorName: 'Admin',
                body: 'The Agent Runtime has a built-in token bucket limiter. Set execution.maxConcurrency: 5 and execution.rateLimitStrategy: "token-bucket" in your workflow config.',
                upvotes: 22, isAccepted: false,
                createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
                updatedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
            },
        ];

        for (const c of comments) {
            this.comments.set(c.id, c);
            const list = this.threadComments.get(c.threadId) ?? [];
            list.push(c.id);
            this.threadComments.set(c.threadId, list);
        }
    }

    // -----------------------------------------------------------------------
    // Threads
    // -----------------------------------------------------------------------

    createThread(data: {
        title: string;
        body: string;
        category: string;
        tags: string[];
        authorId: string;
        authorName: string;
    }): ForumThread {
        const id = `thread-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const thread: ForumThread = {
            ...data,
            id,
            status: 'open',
            isPinned: false,
            upvotes: 1,
            downvotes: 0,
            commentCount: 0,
            viewCount: 0,
            createdAt: now,
            updatedAt: now,
            lastActivityAt: now,
        };
        this.threads.set(id, thread);
        this.threadComments.set(id, []);
        return thread;
    }

    updateThread(id: string, updates: Partial<ForumThread>): ForumThread | null {
        const thread = this.threads.get(id);
        if (!thread) return null;
        const updated = { ...thread, ...updates, updatedAt: new Date().toISOString() };
        this.threads.set(id, updated);
        return updated;
    }

    getThread(id: string): ForumThread | null {
        return this.threads.get(id) ?? null;
    }

    getAllThreads(filters?: {
        category?: string;
        status?: PostStatus;
        tag?: string;
        q?: string;
        sort?: 'hot' | 'new' | 'top';
    }): ForumThread[] {
        let list = Array.from(this.threads.values());
        if (filters?.category && filters.category !== 'all') list = list.filter((t) => t.category === filters.category);
        if (filters?.status) list = list.filter((t) => t.status === filters.status);
        if (filters?.tag) list = list.filter((t) => t.tags.includes(filters.tag!));
        if (filters?.q) {
            const q = filters.q.toLowerCase();
            list = list.filter((t) => t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
        }

        const sort = filters?.sort ?? 'hot';
        if (sort === 'new') {
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sort === 'top') {
            list.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
        } else {
            // hot: pinned first, then by engagement score
            list.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                const scoreA = (a.upvotes - a.downvotes) + a.commentCount * 2 + a.viewCount * 0.01;
                const scoreB = (b.upvotes - b.downvotes) + b.commentCount * 2 + b.viewCount * 0.01;
                return scoreB - scoreA;
            });
        }

        return list;
    }

    voteThread(userId: string, threadId: string, vote: VoteType): ForumThread | null {
        const thread = this.threads.get(threadId);
        if (!thread) return null;

        const key = `${userId}:thread:${threadId}`;
        const prev = this.votes.get(key) ?? 'none';
        this.votes.set(key, vote);

        let { upvotes, downvotes } = thread;

        // Undo previous
        if (prev === 'up') upvotes--;
        if (prev === 'down') downvotes--;

        // Apply new
        if (vote === 'up') upvotes++;
        if (vote === 'down') downvotes++;

        const updated = { ...thread, upvotes, downvotes };
        this.threads.set(threadId, updated);
        return updated;
    }

    incrementView(threadId: string): void {
        const thread = this.threads.get(threadId);
        if (thread) this.threads.set(threadId, { ...thread, viewCount: thread.viewCount + 1 });
    }

    getUserVoteOnThread(userId: string, threadId: string): VoteType {
        return this.votes.get(`${userId}:thread:${threadId}`) ?? 'none';
    }

    // -----------------------------------------------------------------------
    // Comments
    // -----------------------------------------------------------------------

    addComment(data: {
        threadId: string;
        parentId?: string;
        authorId: string;
        authorName: string;
        body: string;
    }): ForumComment {
        const thread = this.threads.get(data.threadId);
        if (!thread) throw new Error('Thread not found');

        const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const comment: ForumComment = {
            ...data,
            id,
            upvotes: 0,
            isAccepted: false,
            createdAt: now,
            updatedAt: now,
        };
        this.comments.set(id, comment);

        const list = this.threadComments.get(data.threadId) ?? [];
        list.push(id);
        this.threadComments.set(data.threadId, list);

        this.threads.set(data.threadId, {
            ...thread,
            commentCount: thread.commentCount + 1,
            lastActivityAt: now,
        });

        return comment;
    }

    getComments(threadId: string): ForumComment[] {
        const ids = this.threadComments.get(threadId) ?? [];
        return ids
            .map((id) => this.comments.get(id))
            .filter((c): c is ForumComment => !!c)
            .sort((a, b) => {
                if (a.isAccepted && !b.isAccepted) return -1;
                if (!a.isAccepted && b.isAccepted) return 1;
                return b.upvotes - a.upvotes;
            });
    }

    acceptComment(threadId: string, commentId: string): ForumThread | null {
        const comment = this.comments.get(commentId);
        if (!comment || comment.threadId !== threadId) return null;

        // Un-accept previous
        const ids = this.threadComments.get(threadId) ?? [];
        for (const id of ids) {
            const c = this.comments.get(id);
            if (c?.isAccepted) this.comments.set(id, { ...c, isAccepted: false });
        }

        this.comments.set(commentId, { ...comment, isAccepted: true });
        return this.updateThread(threadId, { status: 'answered', acceptedCommentId: commentId });
    }

    voteComment(userId: string, commentId: string, vote: VoteType): ForumComment | null {
        const comment = this.comments.get(commentId);
        if (!comment) return null;

        const key = `${userId}:comment:${commentId}`;
        const prev = this.votes.get(key) ?? 'none';
        this.votes.set(key, vote);

        let { upvotes } = comment;
        if (prev === 'up') upvotes--;
        if (vote === 'up') upvotes++;

        const updated = { ...comment, upvotes };
        this.comments.set(commentId, updated);
        return updated;
    }

    // -----------------------------------------------------------------------
    // Stats
    // -----------------------------------------------------------------------

    getStats() {
        const threads = Array.from(this.threads.values());
        const comments = Array.from(this.comments.values());
        return {
            totalThreads: threads.length,
            openThreads: threads.filter((t) => t.status === 'open').length,
            answeredThreads: threads.filter((t) => t.status === 'answered').length,
            totalComments: comments.length,
            totalUpvotes: threads.reduce((s, t) => s + t.upvotes, 0),
            categories: [...new Set(threads.map((t) => t.category))],
        };
    }

    // -----------------------------------------------------------------------
    // Persistence hooks
    // -----------------------------------------------------------------------

    _exportData(): { threads: ForumThread[]; comments: ForumComment[] } {
        return {
            threads: Array.from(this.threads.values()),
            comments: Array.from(this.comments.values()),
        };
    }

    _importData(data: { threads?: ForumThread[]; comments?: ForumComment[] }): void {
        if (data.threads) {
            this.threads.clear();
            for (const t of data.threads) this.threads.set(t.id, t);
        }
        if (data.comments) {
            this.comments.clear();
            this.threadComments.clear();
            for (const c of data.comments) {
                this.comments.set(c.id, c);
                const existing = this.threadComments.get(c.threadId) ?? [];
                existing.push(c.id);
                this.threadComments.set(c.threadId, existing);
            }
        }
    }
}

export const forumStore = new ForumStore();
