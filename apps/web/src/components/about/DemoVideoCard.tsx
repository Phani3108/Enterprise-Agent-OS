'use client';

/**
 * Demo Video Card — Reusable card for demo videos
 */

interface DemoVideo {
    id: string;
    title: string;
    description: string;
    duration: string;
    category: string;
    thumbnail: string;
    videoUrl: string;
}

export const DEMO_VIDEOS: DemoVideo[] = [
    { id: 'v1', title: 'Search Internal Knowledge', description: 'See how EOS searches across Confluence, GitHub, Jira, and transcripts to find exactly what you need.', duration: '2:30', category: 'Knowledge', thumbnail: '📚', videoUrl: '#' },
    { id: 'v2', title: 'Analyze an Incident', description: 'Watch EOS pull metrics, logs, recent deploys, and past incidents to identify root causes.', duration: '3:15', category: 'Engineering', thumbnail: '🚨', videoUrl: '#' },
    { id: 'v3', title: 'Summarize a Transcript', description: 'Turn meeting recordings into decisions, action items, and draft Jira tickets automatically.', duration: '1:45', category: 'Leadership', thumbnail: '📋', videoUrl: '#' },
    { id: 'v4', title: 'Generate a Campaign', description: 'Full marketing campaign generation: ICP analysis, messaging, content calendar, and email sequences.', duration: '4:00', category: 'Marketing', thumbnail: '📊', videoUrl: '#' },
    { id: 'v5', title: 'Learn AI with EOS', description: 'Structured learning mode with explanations, architecture diagrams, code examples, and exercises.', duration: '5:20', category: 'Learning', thumbnail: '🎓', videoUrl: '#' },
];

const CATEGORY_COLORS: Record<string, string> = {
    Knowledge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Engineering: 'bg-red-500/10 text-red-400 border-red-500/20',
    Leadership: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Marketing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Learning: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function DemoVideoCard({ video }: { video: DemoVideo }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all group">
            {/* Thumbnail area */}
            <div className="relative h-32 rounded-t-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex items-center justify-center overflow-hidden">
                <span className="text-4xl group-hover:scale-110 transition-transform">{video.thumbnail}</span>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[11px] text-white font-mono">
                    {video.duration}
                </div>
                {/* Play button overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <div className="w-12 h-12 rounded-full bg-accent/80 flex items-center justify-center text-white text-lg">
                        ▶
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono uppercase border ${CATEGORY_COLORS[video.category] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {video.category}
                    </span>
                </div>
                <h4 className="text-[14px] font-medium text-slate-900 mb-1">{video.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{video.description}</p>
                <button className="mt-3 text-xs text-accent hover:text-accent/80 transition-colors font-medium">
                    Watch Demo →
                </button>
            </div>
        </div>
    );
}
