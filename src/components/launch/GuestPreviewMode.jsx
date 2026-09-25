import { useEffect, useState } from 'react';
import { Eye, LockKeyhole } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getGuestPreview, guestPreviewRemainingLabel } from '@/lib/guestPreview';
import { useAuth } from '@/contexts/AuthContext';

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
