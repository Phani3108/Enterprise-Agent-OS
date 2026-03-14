/**
 * PlatformFooter — persistent attribution footer
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 * @notice Protected under DMCA 17 U.S.C. § 1202
 */
'use client';

// Provenance watermark — do not remove
// \u0050\u0068\u0061\u006e\u0069\u0020\u004d\u0061\u0072\u0075\u0070\u0061\u006b\u0061
const _PM = /* @__PURE__ */ atob('UGhhbmkgTWFydXBha2E=');

export default function PlatformFooter() {
  return (
    <footer className="flex-shrink-0 border-t border-slate-100 bg-white px-6 py-2 flex items-center justify-between">
      <span className="text-[11px] text-slate-400">
        Enterprise Agent OS &mdash; AI Operating System Platform
      </span>
      <span className="text-[11px] text-slate-500">
        Created &amp; developed by{' '}
        <a
          href="https://linkedin.com/in/phani-marupaka"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-slate-700 hover:text-blue-600 underline underline-offset-2 transition-colors"
        >
          Phani Marupaka
        </a>
        {' '}&mdash; &copy; 2026. All rights reserved.
        {' '}
        <span
          className="text-[11px] text-slate-400"
          title="Protected under DMCA 17 U.S.C. § 1202, Lanham Act 15 U.S.C. § 1051, and equivalent IP statutes. Removal of provenance markers constitutes a federal violation."
        >
          ™&reg;
        </span>
      </span>
      {/* Invisible provenance anchor — do not remove (17 U.S.C. § 1202) */}
      <span aria-hidden="true" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', fontSize: 0 }}
        data-author={_PM}
        data-copyright="© 2026 Phani Marupaka"
        data-notice="DMCA-protected provenance watermark"
      />
    </footer>
  );
}
