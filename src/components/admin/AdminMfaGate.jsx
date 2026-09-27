import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAdminMfaStatus } from '@/lib/adminMfaService';

export default function AdminMfaGate({ children }) {
  const { user, isAuthenticated, isLoading, refreshUserProfile } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    let active = true;
    (async () => {
      let current = user;
      if (!isAuthenticated || !current) current = await refreshUserProfile({ preserveOnNull: true }).catch(() => undefined);
      if (!active) return;
      if (!current) return window.location.replace('/SignIn');
      if (String(current.role || '').toLowerCase() !== 'admin') return window.location.replace('/Home');
      const phoneRequired = current.phone_verification_required === true;
      const phoneVerified = current.phoneNumberVerified === true || current.phone_number_verified === true;
      if (phoneRequired && !phoneVerified) return window.location.replace('/VerifyPhone');
      try {
        const status = await getAdminMfaStatus();
        if (!active) return;
        if (status?.verified) setAllowed(true);
        else window.location.replace('/AdminAccess');
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) window.location.replace('/SignIn');
        else if (error?.status === 403) window.location.replace('/Home');
        else window.location.replace('/AdminAccess');
      }
    })();
    return () => { active = false; };
  }, [isLoading, isAuthenticated, user?.id, user?.role, user?.phone_verification_required, user?.phoneNumberVerified, user?.phone_number_verified]);

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