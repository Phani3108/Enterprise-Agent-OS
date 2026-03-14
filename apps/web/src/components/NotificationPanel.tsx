'use client';

const NOTIFICATIONS = [
    { type: 'success' as const, icon: '✅', title: 'Campaign strategy delivered', time: '1m ago', message: 'Community banks card modernization — ready for review' },
    { type: 'warning' as const, icon: '🚨', title: 'Incident INC-342 detected', time: '3m ago', message: '503 spike on payments-api. Auto-analysis started.' },
    { type: 'info' as const, icon: '📋', title: 'PR #456 auto-reviewed', time: '15m ago', message: 'Architecture: 91%, Security: 88%. 2 suggestions.' },
    { type: 'info' as const, icon: '📰', title: 'On-call brief sent', time: '32m ago', message: 'Daily brief posted to #on-call' },
];

const TYPE_STYLES = {
    success: 'border-l-success/50',
    warning: 'border-l-warning/50',
    error: 'border-l-danger/50',
    info: 'border-l-accent/50',
};

export function NotificationPanel() {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notifications</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
                    {NOTIFICATIONS.filter((n) => n.type !== 'info' || true).length}
                </span>
            </div>

            <div className="space-y-2">
                {NOTIFICATIONS.map((notif, idx) => (
                    <div
                        key={idx}
                        className={`p-3 rounded-lg bg-white border-l-2 ${TYPE_STYLES[notif.type]} hover:bg-slate-50 transition-colors cursor-pointer`}
                    >
                        <div className="flex items-start gap-2">
                            <span className="text-sm mt-0.5">{notif.icon}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-slate-900">{notif.title}</span>
                                    <span className="text-[11px] text-slate-400">{notif.time}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{notif.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
