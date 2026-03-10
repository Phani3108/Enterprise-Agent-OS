/**
 * Blog Store — manages blog posts and publication state.
 *
 * In-memory for development; swap persistence adapter for Neo4j/Redis
 * (see persistence.ts).
 */

export type BlogPostStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    contentHtml: string;
    status: BlogPostStatus;
    authorId: string;
    authorName: string;
    tags: string[];
    coverImage?: string;
    destinations: string[];
    publishedAt?: string;
    scheduledFor?: string;
    createdAt: string;
    updatedAt: string;
    viewCount: number;
    likeCount: number;
    /** External URLs after publishing */
    externalUrls?: Record<string, string>;
}

export interface PublishRequest {
    postId: string;
    destinations: string[];
    publishedAt?: string;
}

export interface PublishResult {
    destination: string;
    status: 'success' | 'error';
    url?: string;
    error?: string;
}

function slugify(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
        .slice(0, 80);
}

export class BlogStore {
    private posts = new Map<string, BlogPost>();
    private slugIndex = new Map<string, string>(); // slug → id

    constructor() {
        this.seed();
    }

    private seed(): void {
        const demo: BlogPost[] = [
            {
                id: 'post-1',
                title: 'How AgentOS Reduced Our Sprint Planning Time by 60%',
                slug: 'how-agentos-reduced-sprint-planning-time',
                excerpt: 'How we used AgentOS to cut sprint planning time from 3 hours to 45 minutes.',
                content: 'Our engineering team was spending 3+ hours every sprint on planning ceremonies...',
                contentHtml: '<h2>Introduction</h2><p>Our engineering team was spending 3+ hours every sprint on planning ceremonies. With AgentOS, we automated the entire backlog grooming process using the PRD Generator skill.</p><h2>Results</h2><p>Sprint planning time dropped from 3 hours to 45 minutes.</p>',
                status: 'published',
                authorId: 'user-1',
                authorName: 'Phani Marupaka',
                tags: ['engineering', 'productivity', 'case-study'],
                destinations: ['internal'],
                publishedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
                createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
                viewCount: 234,
                likeCount: 18,
                externalUrls: { internal: '/blog/how-agentos-reduced-sprint-planning-time' },
            },
            {
                id: 'post-2',
                title: 'Building Intelligent Marketing Campaigns with AI Agents',
                slug: 'intelligent-marketing-campaigns-ai-agents',
                excerpt: 'From 2 weeks to 4 hours — how AI agents are transforming campaign management.',
                content: 'The marketing team at our organization runs 15+ campaigns per quarter...',
                contentHtml: '<h2>Overview</h2><p>The marketing team runs 15+ campaigns per quarter. Each previously required 2 weeks of research. AgentOS changed everything.</p>',
                status: 'draft',
                authorId: 'user-1',
                authorName: 'Phani Marupaka',
                tags: ['marketing', 'ai', 'automation'],
                destinations: [],
                createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString(),
                viewCount: 0,
                likeCount: 0,
            },
        ];

        for (const p of demo) {
            this.posts.set(p.id, p);
            this.slugIndex.set(p.slug, p.id);
        }
    }

    // -----------------------------------------------------------------------
    // CRUD
    // -----------------------------------------------------------------------

    createPost(data: {
        title: string;
        content?: string;
        contentHtml?: string;
        excerpt?: string;
        authorId: string;
        authorName: string;
        tags?: string[];
    }): BlogPost {
        const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const slug = slugify(data.title || 'untitled');
        const post: BlogPost = {
            id,
            title: data.title,
            slug,
            excerpt: data.excerpt ?? '',
            content: data.content ?? '',
            contentHtml: data.contentHtml ?? '',
            status: 'draft',
            authorId: data.authorId,
            authorName: data.authorName,
            tags: data.tags ?? [],
            destinations: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            viewCount: 0,
            likeCount: 0,
        };
        this.posts.set(id, post);
        this.slugIndex.set(slug, id);
        return post;
    }

    updatePost(id: string, updates: Partial<Omit<BlogPost, 'id' | 'createdAt'>>): BlogPost | null {
        const post = this.posts.get(id);
        if (!post) return null;

        const updated = { ...post, ...updates, updatedAt: new Date().toISOString() };

        // Re-index slug if title changed
        if (updates.title && updates.title !== post.title) {
            const newSlug = slugify(updates.title);
            this.slugIndex.delete(post.slug);
            this.slugIndex.set(newSlug, id);
            updated.slug = newSlug;
        }

        this.posts.set(id, updated);
        return updated;
    }

    deletePost(id: string): boolean {
        const post = this.posts.get(id);
        if (!post) return false;
        this.slugIndex.delete(post.slug);
        this.posts.delete(id);
        return true;
    }

    getPost(id: string): BlogPost | null {
        return this.posts.get(id) ?? null;
    }

    getPostBySlug(slug: string): BlogPost | null {
        const id = this.slugIndex.get(slug);
        return id ? (this.posts.get(id) ?? null) : null;
    }

    getAllPosts(filters?: {
        status?: BlogPostStatus;
        authorId?: string;
        tag?: string;
        destination?: string;
    }): BlogPost[] {
        let list = Array.from(this.posts.values());
        if (filters?.status) list = list.filter((p) => p.status === filters.status);
        if (filters?.authorId) list = list.filter((p) => p.authorId === filters.authorId);
        if (filters?.tag) list = list.filter((p) => p.tags.includes(filters.tag!));
        if (filters?.destination) list = list.filter((p) => p.destinations.includes(filters.destination!));
        return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    // -----------------------------------------------------------------------
    // Publishing
    // -----------------------------------------------------------------------

    async publishPost(request: PublishRequest): Promise<{ post: BlogPost; results: PublishResult[] }> {
        const post = this.posts.get(request.postId);
        if (!post) throw new Error('Post not found');

        const results: PublishResult[] = [];
        const externalUrls: Record<string, string> = { ...(post.externalUrls ?? {}) };

        for (const dest of request.destinations) {
            await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

            const url = dest === 'internal'
                ? `/blog/${post.slug}`
                : dest === 'linkedin'
                    ? `https://linkedin.com/pulse/${post.slug}-${post.id.slice(-6)}`
                    : `https://blogin.co/posts/${post.slug}`;

            results.push({ destination: dest, status: 'success', url });
            externalUrls[dest] = url;
        }

        const updated = this.updatePost(request.postId, {
            status: 'published',
            destinations: [...new Set([...post.destinations, ...request.destinations])],
            publishedAt: request.publishedAt ?? new Date().toISOString(),
            externalUrls,
        });

        return { post: updated!, results };
    }

    // -----------------------------------------------------------------------
    // Engagement
    // -----------------------------------------------------------------------

    incrementViews(id: string): void {
        const post = this.posts.get(id);
        if (post) this.posts.set(id, { ...post, viewCount: post.viewCount + 1 });
    }

    toggleLike(id: string): BlogPost | null {
        const post = this.posts.get(id);
        if (!post) return null;
        const updated = { ...post, likeCount: post.likeCount + 1 };
        this.posts.set(id, updated);
        return updated;
    }

    getStats() {
        const all = Array.from(this.posts.values());
        return {
            total: all.length,
            published: all.filter((p) => p.status === 'published').length,
            drafts: all.filter((p) => p.status === 'draft').length,
            totalViews: all.reduce((s, p) => s + p.viewCount, 0),
            totalLikes: all.reduce((s, p) => s + p.likeCount, 0),
        };
    }
}

export const blogStore = new BlogStore();
