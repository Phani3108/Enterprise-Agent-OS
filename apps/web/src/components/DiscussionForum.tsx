'use client';

import { useState, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ForumPost {
  id: string;
  title: string;
  body: string;
  author: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  commentCount: number;
  views: number;
  createdAt: string;
  userVote?: 'up' | 'down' | null;
  isPinned?: boolean;
  isAnswered?: boolean;
  comments: ForumComment[];
}

interface ForumComment {
  id: string;
  postId: string;
  author: string;
  authorAvatar: string;
  body: string;
  upvotes: number;
  createdAt: string;
  userVote?: 'up' | null;
  parentId?: string;
  replies: ForumComment[];
  isAccepted?: boolean;
}

// ---------------------------------------------------------------------------
// Sample Data
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'workflows', label: 'Workflows', icon: '⚡' },
  { id: 'skills', label: 'Skills', icon: '🔧' },
  { id: 'agents', label: 'Agents', icon: '🤖' },
  { id: 'tools', label: 'Tool Integrations', icon: '🔌' },
  { id: 'general', label: 'General', icon: '💬' },
];

const AVATARS = ['👨‍💻', '👩‍💼', '👨‍🔬', '👩‍🎨', '🧑‍🚀', '👩‍💻', '🧑‍💼'];

const SAMPLE_POSTS: ForumPost[] = [
  {
    id: 'p1',
    title: 'Best workflow for generating product roadmaps from customer feedback?',
    body: 'I\'ve been trying to use the PRD Generator skill to build product roadmaps, but I\'m struggling to ingest bulk customer feedback from Jira and Intercom simultaneously. Has anyone solved this multi-source ingestion pattern?\n\nSpecifically:\n1. We have ~500 Jira issues tagged "customer-feedback"\n2. Intercom has ~2000 conversation threads\n3. We want to cluster these and generate a themed roadmap\n\nAny recommended workflow or skill configuration would be very helpful!',
    author: 'Sarah Chen',
    authorAvatar: '👩‍💻',
    category: 'workflows',
    tags: ['product', 'roadmap', 'jira', 'customer-feedback'],
    upvotes: 42,
    downvotes: 2,
    commentCount: 8,
    views: 234,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    isPinned: true,
    isAnswered: true,
    comments: [
      {
        id: 'c1', postId: 'p1', author: 'Alex Kim', authorAvatar: '👨‍💻',
        body: 'I solved this exact problem last month! Use the Knowledge Graph skill with the multi-source connector. Set `sources: ["jira", "intercom"]` in the config. The skill clusters semantically and outputs a JSON roadmap you can then pipe into the PRD Generator.',
        upvotes: 28, createdAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
        isAccepted: true, replies: [],
      },
      {
        id: 'c2', postId: 'p1', author: 'Priya Sharma', authorAvatar: '👩‍🎨',
        body: 'Also worth looking at the Campaign Strategy skill — it has a feedback-synthesis mode. Not exactly what you need but the clustering logic is top-notch.',
        upvotes: 11, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        replies: [],
      },
    ],
  },
  {
    id: 'p2',
    title: 'Recommendation: Add GitHub Actions integration to the CI/CD skill',
    body: 'Currently the CI/CD skill only connects to Jenkins and CircleCI. Many teams (including ours) are fully on GitHub Actions. I\'d love to see native support for:\n\n- Workflow file generation\n- Pipeline status monitoring\n- Auto-triggering skills on PR merge\n\nUpvote if you want this too!',
    author: 'Marcus Webb',
    authorAvatar: '👨‍🔬',
    category: 'skills',
    tags: ['github', 'ci-cd', 'feature-request'],
    upvotes: 67,
    downvotes: 1,
    commentCount: 5,
    views: 389,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    comments: [
      {
        id: 'c3', postId: 'p2', author: 'Jordan Lee', authorAvatar: '🧑‍💼',
        body: 'Strongly +1 on this. We\'re already using the GitHub tool integration — it just needs workflow file support in the skill layer.',
        upvotes: 19, createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        replies: [],
      },
    ],
  },
  {
    id: 'p3',
    title: 'How do you handle rate limits when running 10+ agents in parallel?',
    body: 'When we run our full engineering workflow (incident analysis + PR review + docs update all at once), we hit OpenAI rate limits within a minute.\n\nCurrent approach: we\'re adding `rateLimitDelay: 2000` manually but it breaks the parallelism.\n\nIs there a built-in rate limit manager in the Agent Runtime? Or should we be using the queue-based execution mode?',
    author: 'Yuki Tanaka',
    authorAvatar: '🧑‍🚀',
    category: 'agents',
    tags: ['rate-limits', 'parallelism', 'engineering'],
    upvotes: 31,
    downvotes: 0,
    commentCount: 4,
    views: 178,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    comments: [
      {
        id: 'c4', postId: 'p3', author: 'Admin', authorAvatar: '👨‍💼',
        body: 'The Agent Runtime has a built-in token bucket limiter. Set `execution.maxConcurrency: 5` and `execution.rateLimitStrategy: "token-bucket"` in your workflow config. This will automatically queue excess agents and retry with exponential backoff.',
        upvotes: 22, createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
        replies: [],
      },
    ],
  },
  {
    id: 'p4',
    title: 'Canva integration returning 403 — OAuth scope issue?',
    body: 'Just connected Canva via the Tools page. Authentication appears to succeed (green checkmark) but when I run the Brand Asset Generator skill, it throws:\n\n```\nCanvaAPI: 403 Forbidden — insufficient_scope: write:designs\n```\n\nI can see designs in read mode but can\'t create new ones. Any idea which OAuth scope I need to add?',
    author: 'Fatima Al-Hassan',
    authorAvatar: '👩‍💼',
    category: 'tools',
    tags: ['canva', 'oauth', 'troubleshooting'],
    upvotes: 15,
    downvotes: 0,
    commentCount: 3,
    views: 91,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    comments: [],
  },
  {
    id: 'p5',
    title: 'Weekly thread: Share your favorite AgentOS skill combos!',
    body: 'Every week I\'ll post a thread for the community to share their favorite skill combinations and workflows. I\'ll kick it off:\n\n**My favorite combo**: Transcript → Actions → Sprint Planning → Jira Epic Creator\n\nOne meeting turns into fully created Jira epics with stories and acceptance criteria. Saves our team ~4 hours per sprint.',
    author: 'Riley Johnson',
    authorAvatar: '👩‍💼',
    category: 'general',
    tags: ['showcase', 'weekly', 'productivity'],
    upvotes: 89,
    downvotes: 3,
    commentCount: 12,
    views: 512,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    isPinned: true,
    comments: [
      {
        id: 'c5', postId: 'p5', author: 'Dev Team Lead', authorAvatar: '👨‍💻',
        body: '**Mine**: PR Architecture Review → Security Scan → Auto-merge on pass. Zero manual review overhead for small PRs.',
        upvotes: 34, createdAt: new Date(Date.now() - 44 * 3600000).toISOString(), replies: [],
      },
      {
        id: 'c6', postId: 'p5', author: 'Marketing Ops', authorAvatar: '👩‍🎨',
        body: '**Marketing combo**: ICP Analysis → Campaign Strategy → LinkedIn Ad Generator → HubSpot workflow. Full GTM motion in 2 hours!',
        upvotes: 27, createdAt: new Date(Date.now() - 36 * 3600000).toISOString(), replies: [],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function Avatar({ emoji, size = 'md' }: { emoji: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-sm' : size === 'lg' ? 'w-10 h-10 text-xl' : 'w-8 h-8 text-base';
  return (
    <div className={`${sizeClass} rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
      {emoji}
    </div>
  );
}

function VoteButton({
  direction,
  count,
  active,
  onClick,
}: {
  direction: 'up' | 'down';
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
        active
          ? direction === 'up' ? 'text-orange-500 bg-orange-50' : 'text-blue-500 bg-blue-50'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span className="text-xs">{direction === 'up' ? '▲' : '▼'}</span>
      <span className="text-[10px] font-medium">{count}</span>
    </button>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Comment Component
// ---------------------------------------------------------------------------

function Comment({
  comment,
  onVote,
  onReply,
  depth = 0,
}: {
  comment: ForumComment;
  onVote: (commentId: string) => void;
  onReply: (commentId: string, author: string) => void;
  depth?: number;
}) {
  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        <Avatar emoji={comment.authorAvatar} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-gray-800">{comment.author}</span>
            {comment.isAccepted && (
              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
                ✓ Accepted
              </span>
            )}
            <span className="text-[10px] text-gray-400">{relativeTime(comment.createdAt)}</span>
          </div>
          <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line mb-2">
            {comment.body}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onVote(comment.id)}
              className={`flex items-center gap-1 text-[10px] transition-colors ${
                comment.userVote === 'up' ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
              }`}
            >
              ▲ {comment.upvotes}
            </button>
            <button
              onClick={() => onReply(comment.id, comment.author)}
              className="text-[10px] text-gray-400 hover:text-gray-600"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
      {comment.replies.map((r) => (
        <Comment key={r.id} comment={r} onVote={onVote} onReply={onReply} depth={depth + 1} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Post Detail View
// ---------------------------------------------------------------------------

function PostDetail({
  post,
  onVote,
  onBack,
  onAddComment,
  onVoteComment,
}: {
  post: ForumPost;
  onVote: (dir: 'up' | 'down') => void;
  onBack: () => void;
  onAddComment: (body: string) => void;
  onVoteComment: (commentId: string) => void;
}) {
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleReply = (id: string, author: string) => {
    setReplyTo({ id, author });
    textRef.current?.focus();
  };

  const submitComment = () => {
    if (!commentBody.trim()) return;
    onAddComment(commentBody.trim());
    setCommentBody('');
    setReplyTo(null);
  };

  const score = post.upvotes - post.downvotes;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        {/* Back */}
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 mb-4 transition-colors">
          ← Back to discussions
        </button>

        {/* Post */}
        <div className="flex gap-4">
          {/* Votes */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
            <VoteButton direction="up" count={post.upvotes} active={post.userVote === 'up'} onClick={() => onVote('up')} />
            <span className="text-xs font-bold text-gray-700">{score}</span>
            <VoteButton direction="down" count={post.downvotes} active={post.userVote === 'down'} onClick={() => onVote('down')} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start gap-2 mb-2">
              {post.isPinned && <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">📌 Pinned</span>}
              {post.isAnswered && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">✓ Answered</span>}
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mb-3">{post.title}</h1>

            <div className="flex items-center gap-3 mb-4 text-[10px] text-gray-400">
              <Avatar emoji={post.authorAvatar} size="sm" />
              <span className="font-medium text-gray-600">{post.author}</span>
              <span>·</span>
              <span>{relativeTime(post.createdAt)}</span>
              <span>·</span>
              <span>{post.views} views</span>
            </div>

            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4 prose">
              {post.body.split('\n').map((line, i) => {
                if (line.startsWith('```')) return <code key={i} className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono my-2">{line.replace(/```/g, '')}</code>;
                if (line.startsWith('**') && line.endsWith('**')) return <strong key={i} className="block">{line.replace(/\*\*/g, '')}</strong>;
                if (!line.trim()) return <br key={i} />;
                return <p key={i} className="mb-1">{line}</p>;
              })}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-6">
              {post.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">#{t}</span>
              ))}
            </div>

            {/* Comments */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-700 mb-3">{post.comments.length} {post.comments.length === 1 ? 'Comment' : 'Comments'}</h3>

              <div className="space-y-1 divide-y divide-gray-50">
                {post.comments.map((c) => (
                  <Comment key={c.id} comment={c} onVote={onVoteComment} onReply={handleReply} />
                ))}
              </div>

              {/* New comment */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                {replyTo && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <span>Replying to <strong>{replyTo.author}</strong></span>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">×</button>
                  </div>
                )}
                <textarea
                  ref={textRef}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Add a comment… (be specific and helpful)"
                  rows={3}
                  className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none leading-relaxed"
                  data-testid="comment-textarea"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={submitComment}
                    disabled={!commentBody.trim()}
                    className="text-xs px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
                    data-testid="submit-comment-btn"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Post Card (list view)
// ---------------------------------------------------------------------------

function PostCard({ post, onClick, onVote }: {
  post: ForumPost;
  onClick: () => void;
  onVote: (dir: 'up' | 'down', e: React.MouseEvent) => void;
}) {
  const score = post.upvotes - post.downvotes;

  return (
    <div
      className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50 transition-all cursor-pointer"
      onClick={onClick}
      data-testid={`post-card-${post.id}`}
    >
      {/* Vote column */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => onVote('up', e)}
          className={`text-xs px-1.5 py-1 rounded transition-colors ${post.userVote === 'up' ? 'text-orange-500' : 'text-gray-300 hover:text-orange-400'}`}
        >▲</button>
        <span className={`text-xs font-bold ${score > 0 ? 'text-orange-500' : score < 0 ? 'text-blue-500' : 'text-gray-400'}`}>{score}</span>
        <button
          onClick={(e) => onVote('down', e)}
          className={`text-xs px-1.5 py-1 rounded transition-colors ${post.userVote === 'down' ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}
        >▼</button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          {post.isPinned && <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full flex-shrink-0">📌</span>}
          {post.isAnswered && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full flex-shrink-0">✓</span>}
          <h3 className="text-sm font-medium text-gray-900 leading-snug">{post.title}</h3>
        </div>

        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
          {post.body.replace(/\n/g, ' ').replace(/\*\*/g, '').substring(0, 120)}…
        </p>

        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <div className="flex items-center gap-1">
            <Avatar emoji={post.authorAvatar} size="sm" />
            <span>{post.author}</span>
          </div>
          <span>·</span>
          <span>{relativeTime(post.createdAt)}</span>
          <span>·</span>
          <span>💬 {post.commentCount}</span>
          <span>·</span>
          <span>👁 {post.views}</span>
          <div className="flex gap-1 ml-1">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">#{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Post Modal
// ---------------------------------------------------------------------------

function NewPostModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (post: Partial<ForumPost>) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState('');

  const handleSubmit = () => {
    if (!title.trim() || !body.trim()) return;
    onSubmit({
      title: title.trim(),
      body: body.trim(),
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[600px] mx-4 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">New Discussion</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question or recommendation?"
              className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400"
              data-testid="new-post-title"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 bg-white"
            >
              {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Description *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Provide context, steps tried, code snippets… The more detail, the better answers you'll get."
              rows={8}
              className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400 resize-none leading-relaxed"
              data-testid="new-post-body"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Tags (comma-separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="workflow, jira, automation…"
              className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-gray-400"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim()}
            className="text-xs px-5 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
            data-testid="submit-post-btn"
          >
            Post Discussion
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main DiscussionForum Component
// ---------------------------------------------------------------------------

export function DiscussionForum() {
  const [posts, setPosts] = useState<ForumPost[]>(SAMPLE_POSTS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);

  // Filter & sort
  const filtered = posts
    .filter((p) => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !p.body.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (sortBy === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'top') return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      // hot: weighted by recency + votes
      const scoreA = (a.upvotes - a.downvotes) + a.commentCount * 2 + a.views * 0.01;
      const scoreB = (b.upvotes - b.downvotes) + b.commentCount * 2 + b.views * 0.01;
      return scoreB - scoreA;
    });

  const handleVote = (postId: string, dir: 'up' | 'down') => {
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const wasUp = p.userVote === 'up';
      const wasDown = p.userVote === 'down';
      if (dir === 'up') {
        return { ...p, upvotes: wasUp ? p.upvotes - 1 : p.upvotes + 1, downvotes: wasDown ? p.downvotes - 1 : p.downvotes, userVote: wasUp ? null : 'up' };
      } else {
        return { ...p, downvotes: wasDown ? p.downvotes - 1 : p.downvotes + 1, upvotes: wasUp ? p.upvotes - 1 : p.upvotes, userVote: wasDown ? null : 'down' };
      }
    }));
    // Update selected if open
    if (selectedPost?.id === postId) {
      setSelectedPost((prev) => {
        if (!prev) return prev;
        const p = prev;
        const wasUp = p.userVote === 'up';
        const wasDown = p.userVote === 'down';
        if (dir === 'up') return { ...p, upvotes: wasUp ? p.upvotes - 1 : p.upvotes + 1, downvotes: wasDown ? p.downvotes - 1 : p.downvotes, userVote: wasUp ? null : 'up' };
        return { ...p, downvotes: wasDown ? p.downvotes - 1 : p.downvotes + 1, upvotes: wasUp ? p.upvotes - 1 : p.upvotes, userVote: wasDown ? null : 'down' };
      });
    }
  };

  const handleAddComment = (body: string) => {
    if (!selectedPost) return;
    const newComment: ForumComment = {
      id: `c-${Date.now()}`,
      postId: selectedPost.id,
      author: 'You',
      authorAvatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      body,
      upvotes: 0,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    setPosts((prev) => prev.map((p) =>
      p.id === selectedPost.id
        ? { ...p, comments: [...p.comments, newComment], commentCount: p.commentCount + 1 }
        : p
    ));
    setSelectedPost((prev) => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev);
  };

  const handleVoteComment = (commentId: string) => {
    if (!selectedPost) return;
    const updatedComments = selectedPost.comments.map((c) =>
      c.id === commentId
        ? { ...c, upvotes: c.userVote === 'up' ? c.upvotes - 1 : c.upvotes + 1, userVote: c.userVote === 'up' ? undefined : 'up' as 'up' }
        : c
    );
    setSelectedPost({ ...selectedPost, comments: updatedComments });
    setPosts((prev) => prev.map((p) =>
      p.id === selectedPost.id ? { ...p, comments: updatedComments } : p
    ));
  };

  const handleNewPost = (data: Partial<ForumPost>) => {
    const newPost: ForumPost = {
      id: `p-${Date.now()}`,
      title: data.title ?? '',
      body: data.body ?? '',
      author: 'You',
      authorAvatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      category: data.category ?? 'general',
      tags: data.tags ?? [],
      upvotes: 1,
      downvotes: 0,
      commentCount: 0,
      views: 1,
      createdAt: new Date().toISOString(),
      userVote: 'up',
      comments: [],
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  const totalPosts = posts.length;
  const totalComments = posts.reduce((s, p) => s + p.commentCount, 0);
  const totalUsers = new Set(posts.map((p) => p.author)).size;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden" data-testid="discussion-forum">
      {selectedPost ? (
        <PostDetail
          post={selectedPost}
          onVote={(dir) => handleVote(selectedPost.id, dir)}
          onBack={() => setSelectedPost(null)}
          onAddComment={handleAddComment}
          onVoteComment={handleVoteComment}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 flex-shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Discussion Forum</h2>
              <p className="text-xs text-gray-400 mt-0.5">Share workflows, ask questions, and discuss skills</p>
            </div>
            <button
              onClick={() => setShowNewPost(true)}
              className="text-xs px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors"
              data-testid="new-discussion-btn"
            >
              + New Discussion
            </button>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 px-6 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            {[
              { label: 'Discussions', value: totalPosts },
              { label: 'Comments', value: totalComments },
              { label: 'Contributors', value: totalUsers },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-700">{s.value}</span>
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search discussions…"
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-gray-400 w-48"
                data-testid="forum-search"
              />
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-48 flex-shrink-0 border-r border-gray-100 p-3 space-y-1 overflow-y-auto">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-2 mb-2">Categories</div>
              {CATEGORIES.map((cat) => {
                const count = cat.id === 'all' ? posts.length : posts.filter((p) => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors ${
                      activeCategory === cat.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    data-testid={`category-${cat.id}`}
                  >
                    <span>{cat.icon} {cat.label}</span>
                    <span className={`text-[9px] ${activeCategory === cat.id ? 'text-gray-400' : 'text-gray-400'}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Main */}
            <div className="flex-1 overflow-y-auto">
              {/* Sort */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
                {(['hot', 'new', 'top'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`text-xs px-3 py-1 rounded-lg capitalize transition-colors ${
                      sortBy === s ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    data-testid={`sort-${s}`}
                  >
                    {s === 'hot' ? '🔥' : s === 'new' ? '✨' : '🏆'} {s}
                  </button>
                ))}
                <span className="ml-auto text-[10px] text-gray-400">{filtered.length} discussions</span>
              </div>

              {/* Posts */}
              <div className="p-4 space-y-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-3xl mb-2">💬</div>
                    <div className="text-sm">No discussions found</div>
                    <button
                      onClick={() => setShowNewPost(true)}
                      className="mt-3 text-xs px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700"
                    >
                      Start the first discussion
                    </button>
                  </div>
                ) : (
                  filtered.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onClick={() => {
                        setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, views: p.views + 1 } : p));
                        setSelectedPost({ ...post, views: post.views + 1 });
                      }}
                      onVote={(dir, e) => { e.stopPropagation(); handleVote(post.id, dir); }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showNewPost && (
        <NewPostModal onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} />
      )}
    </div>
  );
}

export default DiscussionForum;
