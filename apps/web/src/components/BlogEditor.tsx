'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, publishBlogPost, type BlogPostEntry as ApiBlogPost } from '../lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlogPost {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  destinations: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author: string;
  excerpt: string;
  coverImage?: string;
}

interface PublishResult {
  destination: string;
  status: 'success' | 'error';
  url?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Rich Text Toolbar
// ---------------------------------------------------------------------------

function ToolbarButton({
  onClick,
  title,
  active,
  children,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${
        active
          ? 'bg-slate-900 text-white'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sample posts
// ---------------------------------------------------------------------------

const SAMPLE_POSTS: BlogPost[] = [];

// ---------------------------------------------------------------------------
// Post List Sidebar
// ---------------------------------------------------------------------------

function PostList({
  posts,
  activeId,
  onSelect,
  onCreate,
}: {
  posts: BlogPost[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-slate-100 flex flex-col">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Posts</span>
        <button
          onClick={onCreate}
          className="text-xs px-2 py-1 rounded bg-slate-900 text-white hover:bg-slate-700 transition-colors"
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {posts.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
              activeId === p.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`text-xs font-medium truncate ${activeId === p.id ? 'text-slate-900' : 'text-slate-800'}`}>
              {p.title || 'Untitled'}
            </div>
            <div className={`flex items-center gap-1.5 mt-1`}>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                p.status === 'published'
                  ? activeId === p.id ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-50 text-emerald-600'
                  : activeId === p.id ? 'bg-slate-600 text-slate-300' : 'bg-slate-100 text-slate-500'
              }`}>
                {p.status}
              </span>
              <span className={`text-[11px] ${activeId === p.id ? 'text-slate-400' : 'text-slate-400'}`}>
                {new Date(p.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Publish Modal
// ---------------------------------------------------------------------------

function PublishModal({
  post,
  onClose,
  onPublished,
}: {
  post: BlogPost;
  onClose: () => void;
  onPublished: (results: PublishResult[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(post.destinations.length ? post.destinations : ['internal']);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<PublishResult[] | null>(null);

  const DESTINATIONS = [
    { id: 'internal', label: 'Internal Blog', icon: '🏢', description: 'Publish to company intranet' },
    { id: 'linkedin', label: 'LinkedIn', icon: '💼', description: 'Post as LinkedIn article' },
    { id: 'blogin', label: 'Blogin', icon: '✍️', description: 'Publish to Blogin platform' },
  ];

  const toggle = (id: string) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const handlePublish = async () => {
    if (!selected.length) return;
    setPublishing(true);
    try {
      const d = await publishBlogPost(post.id, selected);
      const res: PublishResult[] = d.results.map((r) => ({
        destination: r.destination,
        status: r.status === 'success' ? 'success' : 'error',
        url: r.url,
      }));
      setPublishing(false);
      setResults(res);
      onPublished(res);
    } catch {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[480px] p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-900">Publish Post</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
        </div>

        {results ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 mb-4">Your post has been published to:</p>
            {results.map((r) => (
              <div key={r.destination} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-emerald-500 text-lg">✓</span>
                <div>
                  <div className="text-xs font-medium text-slate-800 capitalize">{r.destination}</div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                       className="text-[11px] text-blue-500 hover:underline font-mono">{r.url}</a>
                  )}
                </div>
              </div>
            ))}
            <button onClick={onClose} className="w-full mt-2 py-2 text-xs bg-slate-900 text-white rounded-xl hover:bg-slate-700">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-4">Choose where to publish <strong className="text-slate-800">"{post.title || 'Untitled'}"</strong></p>

            <div className="space-y-2 mb-5">
              {DESTINATIONS.map((dest) => (
                <label key={dest.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selected.includes(dest.id)
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(dest.id)}
                    onChange={() => toggle(dest.id)}
                    className="w-4 h-4 accent-gray-900"
                  />
                  <span className="text-base">{dest.icon}</span>
                  <div>
                    <div className="text-xs font-medium text-slate-800">{dest.label}</div>
                    <div className="text-[11px] text-slate-400">{dest.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={!selected.length || publishing}
                className="flex-1 py-2 text-xs bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {publishing ? (
                  <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> Publishing…</>
                ) : (
                  `Publish to ${selected.length} destination${selected.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main BlogEditor Component
// ---------------------------------------------------------------------------

export function BlogEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    getBlogPosts().then(d => {
      const mapped = (d.posts || []).map((p: ApiBlogPost) => ({
        id: p.id,
        title: p.title,
        content: p.contentHtml || p.content,
        status: p.status === 'archived' ? 'draft' as const : p.status,
        destinations: p.destinations,
        tags: p.tags,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        publishedAt: p.publishedAt,
        author: p.authorName,
        excerpt: p.excerpt,
        coverImage: undefined,
      }));
      setPosts(mapped);
      if (mapped.length > 0 && !activeId) setActiveId(mapped[0].id);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activePost = posts.find((p) => p.id === activeId) ?? null;

  // Track active text formats
  const updateFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    setActiveFormats(formats);
  }, []);

  const execFormat = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    updateFormats();
  }, [updateFormats]);

  const insertTag = useCallback((tag: string) => {
    document.execCommand('formatBlock', false, tag);
    editorRef.current?.focus();
  }, []);

  // Auto-save on content change
  const handleInput = useCallback(() => {
    if (!activePost || !editorRef.current) return;
    const content = editorRef.current.innerHTML;
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setPosts((prev) => prev.map((p) =>
        p.id === activeId ? { ...p, content, updatedAt: new Date().toISOString() } : p
      ));
      if (activeId) {
        updateBlogPost(activeId, { content, contentHtml: content }).catch(() => {});
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
    updateFormats();
  }, [activeId, activePost, updateFormats]);

  // Sync editor content when switching posts
  useEffect(() => {
    if (editorRef.current && activePost) {
      editorRef.current.innerHTML = activePost.content;
    }
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateTitle = (title: string) => {
    setPosts((prev) => prev.map((p) => p.id === activeId ? { ...p, title, updatedAt: new Date().toISOString() } : p));
    if (activeId) updateBlogPost(activeId, { title }).catch(() => {});
  };

  const updateExcerpt = (excerpt: string) => {
    setPosts((prev) => prev.map((p) => p.id === activeId ? { ...p, excerpt, updatedAt: new Date().toISOString() } : p));
    if (activeId) updateBlogPost(activeId, { excerpt }).catch(() => {});
  };

  const createPost = () => {
    createBlogPost({ title: 'Untitled Post', content: '', excerpt: '' }).then(d => {
      const p = d.post;
      const mapped: BlogPost = {
        id: p.id,
        title: p.title,
        content: p.contentHtml || p.content,
        status: p.status === 'archived' ? 'draft' : p.status,
        destinations: p.destinations,
        tags: p.tags,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        publishedAt: p.publishedAt,
        author: p.authorName,
        excerpt: p.excerpt,
        coverImage: undefined,
      };
      setPosts(prev => [mapped, ...prev]);
      setActiveId(mapped.id);
    }).catch(() => {});
  };

  const handlePublished = (results: PublishResult[]) => {
    const destinations = results.filter((r) => r.status === 'success').map((r) => r.destination);
    setPosts((prev) => prev.map((p) =>
      p.id === activeId
        ? { ...p, status: 'published', destinations, publishedAt: new Date().toISOString() }
        : p
    ));
  };

  const deletePost = () => {
    if (!activePost || !activeId) return;
    if (!confirm('Delete this post?')) return;
    deleteBlogPost(activeId).then(() => {
      const remaining = posts.filter((p) => p.id !== activeId);
      setPosts(remaining);
      setActiveId(remaining[0]?.id ?? null);
    }).catch(() => {});
  };

  const wordCount = activePost
    ? (editorRef.current?.innerText ?? activePost.content.replace(/<[^>]*>/g, '')).split(/\s+/).filter(Boolean).length
    : 0;

  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  if (!activePost) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-slate-400">No post selected</p>
        <button onClick={createPost} className="text-xs px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700">
          Create first post
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden" data-testid="blog-editor">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-900">Blog Editor</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full transition-opacity ${
            activePost.status === 'published'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600'
          }`}>
            {activePost.status}
          </span>
          {saved && (
            <span className="text-[11px] text-slate-400 animate-fade-in">Saved</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">{wordCount} words · {readTime} min read</span>
          <button
            onClick={deletePost}
            className="text-xs px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => setShowPublish(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors"
          >
            Publish →
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <PostList
          posts={posts}
          activeId={activeId}
          onSelect={setActiveId}
          onCreate={createPost}
        />

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-4 py-2 border-b border-slate-100 flex-shrink-0 flex-wrap">
            <div className="flex items-center gap-0.5 mr-2">
              <ToolbarButton onClick={() => insertTag('h1')} title="Heading 1">H1</ToolbarButton>
              <ToolbarButton onClick={() => insertTag('h2')} title="Heading 2">H2</ToolbarButton>
              <ToolbarButton onClick={() => insertTag('h3')} title="Heading 3">H3</ToolbarButton>
              <ToolbarButton onClick={() => insertTag('p')} title="Paragraph">P</ToolbarButton>
            </div>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <div className="flex items-center gap-0.5 mr-2">
              <ToolbarButton onClick={() => execFormat('bold')} title="Bold" active={activeFormats.has('bold')}>
                <strong>B</strong>
              </ToolbarButton>
              <ToolbarButton onClick={() => execFormat('italic')} title="Italic" active={activeFormats.has('italic')}>
                <em>I</em>
              </ToolbarButton>
              <ToolbarButton onClick={() => execFormat('underline')} title="Underline" active={activeFormats.has('underline')}>
                <span className="underline">U</span>
              </ToolbarButton>
              <ToolbarButton onClick={() => execFormat('strikeThrough')} title="Strikethrough">
                <span className="line-through">S</span>
              </ToolbarButton>
            </div>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <div className="flex items-center gap-0.5 mr-2">
              <ToolbarButton onClick={() => execFormat('insertUnorderedList')} title="Bullet List">•≡</ToolbarButton>
              <ToolbarButton onClick={() => execFormat('insertOrderedList')} title="Numbered List">1≡</ToolbarButton>
              <ToolbarButton onClick={() => insertTag('blockquote')} title="Quote">❝</ToolbarButton>
              <ToolbarButton onClick={() => insertTag('pre')} title="Code Block">{'{}'}</ToolbarButton>
            </div>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <div className="flex items-center gap-0.5">
              <ToolbarButton onClick={() => execFormat('justifyLeft')} title="Align Left">⬅</ToolbarButton>
              <ToolbarButton onClick={() => execFormat('justifyCenter')} title="Center">↔</ToolbarButton>
              <ToolbarButton onClick={() => execFormat('justifyRight')} title="Align Right">➡</ToolbarButton>
            </div>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarButton onClick={() => {
              const url = prompt('Enter URL:');
              if (url) execFormat('createLink', url);
            }} title="Insert Link">🔗</ToolbarButton>
            <ToolbarButton onClick={() => execFormat('removeFormat')} title="Clear Formatting">✕</ToolbarButton>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-6">
              {/* Title */}
              <input
                type="text"
                value={activePost.title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="Post title…"
                className="w-full text-2xl font-bold text-slate-900 placeholder-slate-300 border-none outline-none bg-transparent mb-2 leading-tight"
                data-testid="blog-title-input"
              />

              {/* Excerpt */}
              <input
                type="text"
                value={activePost.excerpt}
                onChange={(e) => updateExcerpt(e.target.value)}
                placeholder="Write a short excerpt (shown in previews)…"
                className="w-full text-sm text-slate-400 placeholder-slate-300 border-none outline-none bg-transparent mb-4 leading-relaxed"
              />

              {/* Meta row */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-6 pb-4 border-b border-slate-100">
                <span>by {activePost.author}</span>
                <span>·</span>
                <span>{new Date(activePost.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                {activePost.publishedAt && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-500">Published {new Date(activePost.publishedAt).toLocaleDateString()}</span>
                  </>
                )}
                {activePost.destinations.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{activePost.destinations.join(', ')}</span>
                  </>
                )}
              </div>

              {/* Editor */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyUp={updateFormats}
                onMouseUp={updateFormats}
                data-testid="blog-content-editor"
                className="min-h-[400px] outline-none text-slate-800 leading-relaxed blog-content"
                style={{ fontSize: '15px' }}
              />
            </div>
          </div>
        </div>

        {/* Right panel — Post Settings */}
        <div className="w-52 flex-shrink-0 border-l border-slate-100 p-4 space-y-5 overflow-y-auto">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Tags</div>
            <input
              type="text"
              defaultValue={activePost.tags.join(', ')}
              onBlur={(e) => {
                const tags = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                setPosts((prev) => prev.map((p) => p.id === activeId ? { ...p, tags } : p));
              }}
              placeholder="tag1, tag2…"
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Author</div>
            <input
              type="text"
              defaultValue={activePost.author}
              onBlur={(e) => {
                setPosts((prev) => prev.map((p) => p.id === activeId ? { ...p, author: e.target.value } : p));
              }}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Destinations</div>
            {[
              { id: 'internal', label: '🏢 Internal' },
              { id: 'linkedin', label: '💼 LinkedIn' },
              { id: 'blogin', label: '✍️ Blogin' },
            ].map((dest) => (
              <label key={dest.id} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activePost.destinations.includes(dest.id)}
                  onChange={(e) => {
                    const destinations = e.target.checked
                      ? [...activePost.destinations, dest.id]
                      : activePost.destinations.filter((d) => d !== dest.id);
                    setPosts((prev) => prev.map((p) => p.id === activeId ? { ...p, destinations } : p));
                  }}
                  className="w-3.5 h-3.5 accent-gray-900"
                />
                <span className="text-xs text-slate-600">{dest.label}</span>
              </label>
            ))}
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Statistics</div>
            <div className="space-y-1.5">
              {[
                { label: 'Words', value: String(wordCount) },
                { label: 'Read time', value: `${readTime} min` },
                { label: 'Created', value: new Date(activePost.createdAt).toLocaleDateString() },
                { label: 'Updated', value: new Date(activePost.updatedAt).toLocaleDateString() },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{stat.label}</span>
                  <span className="text-[11px] text-slate-700 font-mono">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowPublish(true)}
            className="w-full py-2 text-xs bg-slate-900 text-white rounded-xl hover:bg-slate-700 transition-colors"
          >
            Publish →
          </button>
        </div>
      </div>

      {showPublish && activePost && (
        <PublishModal
          post={activePost}
          onClose={() => setShowPublish(false)}
          onPublished={(results) => { handlePublished(results); }}
        />
      )}

      <style>{`
        .blog-content h1 { font-size: 1.6em; font-weight: 700; margin: 1em 0 0.5em; color: #111827; }
        .blog-content h2 { font-size: 1.3em; font-weight: 600; margin: 0.9em 0 0.4em; color: #111827; }
        .blog-content h3 { font-size: 1.1em; font-weight: 600; margin: 0.8em 0 0.3em; color: #1f2937; }
        .blog-content p { margin: 0.6em 0; color: #374151; line-height: 1.7; }
        .blog-content ul, .blog-content ol { margin: 0.6em 0 0.6em 1.5em; color: #374151; }
        .blog-content li { margin: 0.3em 0; line-height: 1.6; }
        .blog-content blockquote { border-left: 3px solid #e5e7eb; padding-left: 1em; color: #6b7280; margin: 1em 0; font-style: italic; }
        .blog-content pre, .blog-content code { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.2em 0.5em; font-family: 'JetBrains Mono', monospace; font-size: 0.875em; color: #111827; }
        .blog-content pre { padding: 0.8em 1em; display: block; overflow-x: auto; margin: 0.8em 0; }
        .blog-content a { color: #2563eb; text-decoration: underline; }
        .blog-content strong { font-weight: 600; color: #111827; }
        .blog-content em { font-style: italic; }
      `}</style>
    </div>
  );
}

export default BlogEditor;
