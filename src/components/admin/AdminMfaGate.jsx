import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminMfaStatus } from '@/lib/adminMfaService';

export default function AdminMfaGate({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      window.location.replace('/SignIn');
      return;
    }
    if (user?.role !== 'admin') {
      window.location.replace('/Home');
      return;
    }

    let active = true;
    (async () => {
      try {
        const status = await getAdminMfaStatus();
        if (!active) return;
        if (status?.verified) {
          setAllowed(true);
          setChecking(false);
        } else {
          window.location.replace('/AdminAccess');
        }
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) window.location.replace('/SignIn');
        else if (error?.status === 403) window.location.replace('/Home');
        else window.location.replace('/AdminAccess');
      }
    })();

    return () => { active = false; };
  }, [isAuthenticated, isLoading, user?.role]);

  if (isLoading || checking || !allowed) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center p-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="relative mx-auto h-12 w-12">
            <ShieldCheck className="absolute inset-0 m-auto text-rose-500" size={28}/>
            <Loader2 className="absolute inset-0 m-auto animate-spin text-rose-200" size={48}/>
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Checking Admin Verification</h1>
          <p className="mt-2 text-sm text-slate-500">Confirming your secure administrator session.</p>
        </div>
      </div>
    );
  }

  return children;
}
