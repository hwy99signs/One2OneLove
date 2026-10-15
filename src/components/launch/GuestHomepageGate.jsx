import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import QuickAccountGate from '@/components/launch/QuickAccountGate.jsx';
import { PUBLIC_INFORMATION_ROUTES, VIEW_ONLY_ROUTES } from '@/components/launch/LaunchAccessGate.jsx';

// View-only homepage (owner, 2026-10-11): guests may open and SCROLL the
// homepage - it is the shop window - but every action tab, button, card,
// menu item and other interactive element is locked. A tap on any of them
// opens the sign-up panel (QuickAccountGate) as a modal instead of acting;
// the panel stays until the guest closes it (X, backdrop tap, or Escape)
// or completes sign-up. Links to the pages a guest may open before joining
// (sign in / sign up / Terms / Privacy / About / Help / price list, ...)
// and links leaving the site stay live. Members never see this component.
const EXTRA_OPEN_PATHS = new Set(['/featurepricing']);

// The homepage is the one page a guest may always SEE (owner, 2026-10-11;
// reaffirmed 2026-10-15): links that simply take the guest home — the header
// logo, the Home nav item — are navigation to the shop window, not locked
// actions, and must never open the sign-up panel.
const HOME_PATHS = new Set(['/', '/home']);

function anchorPath(anchor) {
  const href = anchor.getAttribute('href') || '';
  if (!href) return null;
  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      return url.hostname === window.location.hostname ? url.pathname : 'external';
    } catch { return null; }
  }
  return href.startsWith('/') ? href.split(/[?#]/)[0] : null;
}

export default function GuestHomepageGate({ pathname }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const route = String(pathname || '/').toLowerCase().replace(/\/$/, '') || '/';
  const active = !isLoading && !isAuthenticated && VIEW_ONLY_ROUTES.has(route);

  useEffect(() => { setOpen(false); }, [route]);
  useEffect(() => { if (!active) setOpen(false); }, [active]);

  useEffect(() => {
    if (!active) return undefined;
    const onClick = (event) => {
      // Elements marked data-guest-allow (the header Sign In / Sign Up
      // buttons, which navigate by onClick rather than by link) always act.
      if (event.target.closest('[data-guest-allow]')) return;
      const modal = document.getElementById('guest-homepage-gate-modal');
      if (modal && modal.contains(event.target)) return;
      // Buttons that navigate (the footer links are <button>s, not
      // anchors) can declare their destination with data-guest-path;
      // a declared PUBLIC destination acts like an allowed anchor.
      // Without this, every footer link on the guest homepage —
      // Terms, Privacy, About, Help, Report a Problem — opened the
      // sign-up panel instead of the page a guest is meant to read
      // before joining (sweep finding, 2026-10-13).
      const marked = event.target.closest('[data-guest-path]');
      if (marked) {
        const declared = String(marked.getAttribute('data-guest-path') || '').toLowerCase().replace(/\/$/, '') || '/';
        if (PUBLIC_INFORMATION_ROUTES.has(declared) || EXTRA_OPEN_PATHS.has(declared) || HOME_PATHS.has(declared)) return;
      }
      const interactive = event.target.closest('a,button,[role="button"],input,select,textarea,summary,video,[data-analytics-destination],[class*="cursor-pointer"]');
      if (!interactive) return;
      const anchor = event.target.closest('a');
      if (anchor) {
        const path = anchorPath(anchor);
        if (path === 'external') return;
        if (path) {
          const normalized = path.toLowerCase().replace(/\/$/, '') || '/';
          if (PUBLIC_INFORMATION_ROUTES.has(normalized) || EXTRA_OPEN_PATHS.has(normalized) || HOME_PATHS.has(normalized)) return;
        }
      }
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [active]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open ]);

  if (!active || !open) return null;

  return (
    <div
      id="guest-homepage-gate-modal"
      className="fixed inset-0 z-[90] overflow-y-auto bg-black/60 p-4"
      onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
    >
      <div className="relative mx-auto my-6 w-full max-w-md">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute -right-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-hidden rounded-3xl">
          <QuickAccountGate intendedPath={pathname || '/'} />
        </div>
      </div>
    </div>
  );
}
