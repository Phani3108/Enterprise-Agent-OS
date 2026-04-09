/**
 * DemoPreviewBanner — Shown when a page displays sample/demo data instead of real data.
 * Explains what the page does and how to populate with real data.
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */
'use client';

interface DemoPreviewBannerProps {
  pageName: string;
  steps: string[];
}

export default function DemoPreviewBanner({ pageName, steps }: DemoPreviewBannerProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 mb-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">✨</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-amber-900">Demo Preview — {pageName}</h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[9px] font-bold uppercase tracking-wider">Sample Data</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed mb-3">
            This is sample data showing what you&apos;ll see once the platform is connected. All items below are illustrative and will be replaced with your real data.
          </p>
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider">How to populate with real data:</p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-300 text-amber-900 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-amber-800">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
