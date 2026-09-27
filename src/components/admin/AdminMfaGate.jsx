import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminMfaStatus } from '@/lib/adminMfaService';

const wait = (ms) => new Promise(resolve => window.setTimeout(resolve, ms));

export default function AdminMfaGate({ children }) {
  const { refreshUserProfile } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      // The server-side Admin MFA endpoint is the source of truth on a hard
      // refresh. Do not redirect based on the still-hydrating React auth state.
      let lastError = null;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const status = await getAdminMfaStatus();
          if (!active) return;

          if (status?.verified) {
            setAllowed(true);
            // Rehydrate the normal user context after access is already proven.
            refreshUserProfile({ preserveOnNull: true }).catch(() => undefined);
            return;
          }

          window.location.replace('/AdminAccess');
          return;
        } catch (error) {
          lastError = error;
          if (!active) return;

          // A hard refresh can briefly race session hydration upstream. Give the
          // secure cookie-backed session a moment before treating a 401/5xx as
          // an actual logout.
          if ([401, 429, 500, 502, 503, 504].includes(error?.status) && attempt < 2) {
            await wait(350 * (attempt + 1));
            continue;
          }
          break;
        }
      }

      if (!active) return;
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
