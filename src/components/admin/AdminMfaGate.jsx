import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { endAdminMfa, getAdminMfaStatus, touchAdminMfa } from '@/lib/adminMfaService';

const ADMIN_IDLE_MS = 30 * 60 * 1000;
const SERVER_TOUCH_THROTTLE_MS = 30 * 1000;

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
    const phoneRequired = user?.phone_verification_required === true;
    const phoneVerified = user?.phoneNumberVerified === true || user?.phone_number_verified === true;
    if (phoneRequired && !phoneVerified) {
      window.location.replace('/VerifyPhone');
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
  }, [isAuthenticated, isLoading, user?.role, user?.phone_verification_required, user?.phoneNumberVerified, user?.phone_number_verified]);

  useEffect(() => {
    if (!allowed) return undefined;

    let idleTimer = null;
    let lastServerTouch = Date.now();
    let ending = false;

    const finishAdminSession = async () => {
      if (ending) return;
      ending = true;
      try {
        await endAdminMfa();
      } catch {
        // The browser-side idle timeout still exits Admin even if the cleanup request fails.
      } finally {
        try { sessionStorage.setItem('o2olAdminIdleLogout', '1'); } catch {}
        window.location.replace('/Home');
      }
    };

    const resetIdleTimer = () => {
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(finishAdminSession, ADMIN_IDLE_MS);
    };

    const renewServerSession = async () => {
      const now = Date.now();
      if (now - lastServerTouch < SERVER_TOUCH_THROTTLE_MS || ending) return;
      lastServerTouch = now;
      try {
        await touchAdminMfa();
      } catch (error) {
        if ([401, 403, 428].includes(error?.status)) {
          finishAdminSession();
        }
      }
    };

    const registerActivity = () => {
      if (ending) return;
      resetIdleTimer();
      renewServerSession();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') registerActivity();
    };

    resetIdleTimer();

    window.addEventListener('pointerdown', registerActivity, { passive: true });
    window.addEventListener('keydown', registerActivity);
    window.addEventListener('scroll', registerActivity, { passive: true });
    window.addEventListener('touchstart', registerActivity, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (idleTimer) window.clearTimeout(idleTimer);
      window.removeEventListener('pointerdown', registerActivity);
      window.removeEventListener('keydown', registerActivity);
      window.removeEventListener('scroll', registerActivity);
      window.removeEventListener('touchstart', registerActivity);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [allowed]);

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
