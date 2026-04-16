'use client';

/**
 * DemoModeBanner — visible pill shown when a hub falls back to demo/seed data
 * instead of live gateway data. Protects demo credibility by making it obvious
 * which screens are showing canned content.
 */

import { useEffect, useState } from 'react';

interface DemoModeBannerProps {
  /** Whether the surrounding screen is using demo/fallback data. */
  active?: boolean;
  /** Optional custom message (e.g. "Gateway unreachable — showing seed data"). */
  message?: string;
  /** Where to show: 'inline' (in-layout) or 'floating' (absolute top-right). */
  variant?: 'inline' | 'floating';
}

export function DemoModeBanner({ active = true, message, variant = 'inline' }: DemoModeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (!active || dismissed) return null;

  const label = message ?? 'Demo data — live gateway not connected';

  if (variant === 'floating') {
    return (
      <div className="fixed top-3 right-3 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 shadow-sm text-[11px] font-medium text-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        {label}
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 text-amber-600 hover:text-amber-900"
          aria-label="Dismiss demo banner"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 mx-6 mt-3 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-800">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
      <span className="flex-1">{label}</span>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-600 hover:text-amber-900 text-[14px] leading-none"
        aria-label="Dismiss demo banner"
      >
        ×
      </button>
    </div>
  );
}

/**
 * Hook that reports whether the gateway is reachable. Wrapper components can
 * use this to decide whether to show DemoModeBanner.
 */
export function useGatewayReachable(pingIntervalMs = 30000): boolean {
  const [reachable, setReachable] = useState<boolean>(true);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000';
    const check = async () => {
      try {
        const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(2500) });
        setReachable(res.ok);
      } catch {
        setReachable(false);
      }
    };
    check();
    const id = setInterval(check, pingIntervalMs);
    return () => clearInterval(id);
  }, [pingIntervalMs]);
  return reachable;
}

export default DemoModeBanner;
