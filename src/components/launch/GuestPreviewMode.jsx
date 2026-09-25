import { useEffect, useState } from 'react';
import { Eye, LockKeyhole } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getGuestPreview, guestPreviewRemainingLabel } from '@/lib/guestPreview';
import { useAuth } from '@/contexts/AuthContext';

const MUTATING_METHODS = new Set(['POST','PUT','PATCH','DELETE']);
const ACTION_WORDS = /\b(send|save|submit|create|schedule|post|publish|upload|add|delete|remove|cancel|join|leave|request|accept|decline|start game|play|match|message|invite|update|change|complete|finish)\b/i;

function isApiMutation(input, init = {}) {
  const method = String(init?.method || (input instanceof Request ? input.method : 'GET') || 'GET').toUpperCase();
  if (!MUTATING_METHODS.has(method)) return false;
  const raw = typeof input === 'string' ? input : input?.url;
  if (!raw) return false;
  try {
    const url = new URL(raw, window.location.origin);
    return url.origin === window.location.origin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

export default function GuestPreviewMode() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [preview, setPreview] = useState(() => getGuestPreview(user));

  useEffect(() => {
    const refresh = () => setPreview(getGuestPreview(user));
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('storage', refresh);
    window.addEventListener('o2ol:guest-preview-changed', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('o2ol:guest-preview-changed', refresh);
    };
  }, [location.pathname, user?.created_at, user?.stripe_subscription_id, user?.subscription_status]);

  useEffect(() => {
    if (!preview.active) return undefined;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input, init = {}) => {
      if (isApiMutation(input, init)) {
        const error = new Error('Guest Preview is view-only. Subscribe to use this feature.');
        error.status = 403;
        error.code = 'guest_preview_view_only';
        window.dispatchEvent(new CustomEvent('o2ol:guest-preview-blocked'));
        throw error;
      }
      return originalFetch(input, init);
    };

    const blockSubmit = (event) => {
      event.preventDefault();
      event.stopPropagation();
      toast('Guest Preview is view-only. Subscribe to use this feature.');
    };

    const blockActionClick = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const control = target?.closest('button, [role="button"]');
      if (!control) return;
      if (control.closest('[data-guest-preview-allow="true"]')) return;
      const text = [control.textContent, control.getAttribute('aria-label'), control.getAttribute('title')]
        .filter(Boolean).join(' ').trim();
      if (!ACTION_WORDS.test(text)) return;
      event.preventDefault();
      event.stopPropagation();
      toast('Guest Preview is view-only. Subscribe to use this feature.');
    };

    const onBlocked = () => toast('Guest Preview is view-only. Subscribe to use this feature.');

    document.addEventListener('submit', blockSubmit, true);
    document.addEventListener('click', blockActionClick, true);
    window.addEventListener('o2ol:guest-preview-blocked', onBlocked);

    return () => {
      window.fetch = originalFetch;
      document.removeEventListener('submit', blockSubmit, true);
      document.removeEventListener('click', blockActionClick, true);
      window.removeEventListener('o2ol:guest-preview-blocked', onBlocked);
    };
  }, [preview.active]);

  if (!isAuthenticated || !preview.active) return null;

  return (
    <div className="sticky top-0 z-[65] border-b border-amber-300 bg-amber-50 px-3 py-2 text-amber-950 shadow-sm" data-guest-preview-allow="true">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-sm sm:justify-between sm:text-left">
        <div className="flex items-center gap-2 font-semibold">
          <Eye size={17}/>
          <span><strong>24-Hour Guest Preview — View Only</strong> · Explore the real features. Actions that save, send, post, schedule, message, or change data are locked.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold shadow-sm">{guestPreviewRemainingLabel(user)}</span>
          <button type="button" onClick={() => navigate('/Subscription')} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"><LockKeyhole size={13}/>Subscribe to Use Features</button>
          <button type="button" onClick={() => navigate('/Subscription')} className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold hover:bg-amber-100">View Plans</button>
        </div>
      </div>
    </div>
  );
}
