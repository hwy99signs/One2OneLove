import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminMfaStatus } from '@/lib/adminMfaService';
import { ADMIN_AUTH_REDIRECT, claimAutoRedirect } from '@/lib/activityGuard';

const wait = (ms) => new Promise(resolve => window.setTimeout(resolve, ms));
const isPrelaunchAdminPreview = () => window.location.hostname === 'one2onelove-prelaunch.hwy99signs.workers.dev';

export default function AdminMfaGate({ children }) {
  const { refreshUserProfile } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      if (isPrelaunchAdminPreview()) {
        setAllowed(true);
        return;
      }

      // The server-side Admin MFA endpoint is the source of truth on a hard
      // refresh. Do not redirect based on the still-hydrating React auth state.
      let lastError = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const status = await getAdminMfaStatus();
          if (!active) return;

          if (status?.verified) {
            setAllowed(true);
            // Rehydrate the normal user context after access is already proven.
            refreshUserProfile({ preserveOnNull: true }).catch(() => undefined);
            return;
          }

          // Guarded against Admin <-> AdminAccess bounce loops: if the
          // redirect budget is spent, stay on this screen instead of
          // reloading forever (2026-10-08 polling fix).
          if (claimAutoRedirect(ADMIN_AUTH_REDIRECT.key, ADMIN_AUTH_REDIRECT.limit, ADMIN_AUTH_REDIRECT.windowMs)) {
            window.location.replace('/AdminAccess');
          }
          return;
        } catch (error) {
          lastError = error;
          if (!active) return;

          // A hard refresh can briefly race session hydration upstream. Give the
          // secure cookie-backed session a moment before treating a 401/5xx as
          // an actual logout.
          if ([401, 429, 500, 502, 503, 504].includes(error?.status) && attempt < 4) {
            await wait(500 * (attempt + 1));
            continue;
          }
          break;
        }
      }

      if (!active) return;
      // Same loop guard: if these redirects have already bounced too many
      // times in the last minute, stay on the checking screen rather than
      // reloading again.
      if (!claimAutoRedirect(ADMIN_AUTH_REDIRECT.key, ADMIN_AUTH_REDIRECT.limit, ADMIN_AUTH_REDIRECT.windowMs)) return;
      if (lastError?.status === 403) window.location.replace('/Home');
      else if (lastError?.status === 428) window.location.replace('/AdminAccess');
      else if (lastError?.status === 401) window.location.replace('/SignIn');
      else window.location.replace('/AdminAccess');
    })();

    return () => { active = false; };
  }, [refreshUserProfile]);

  if (!allowed) return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <ShieldCheck className="mx-auto text-rose-500" size={32}/>
        <Loader2 className="mx-auto mt-4 animate-spin text-slate-300" size={30}/>
        <h1 className="mt-4 text-lg font-black text-slate-900">Checking Admin Access</h1>
      </div>
    </div>
  );
  return children;
}
