import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';

const RETURN_KEY = 'o2ol-return-after-auth';

const safeReturnTo = (value) => {
  if (!value || typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
};

const isConfirmedUser = (user) => Boolean(user?.email_confirmed_at || user?.confirmed_at);

const loadStoredReturnTo = () => {
  if (typeof window === 'undefined') return null;
  // localStorage is the canonical cross-tab handoff. sessionStorage is read only as a
  // backward-compatible fallback for older preview flows.
  return safeReturnTo(
    window.localStorage.getItem(RETURN_KEY) || window.sessionStorage.getItem(RETURN_KEY)
  );
};

const clearStoredReturnTo = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(RETURN_KEY);
  window.sessionStorage.removeItem(RETURN_KEY);
};

export default function AuthCallback() {
  const [status, setStatus] = useState('Confirming your email…');
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    let redirectTimer;

    const scheduleRedirect = (url, delay) => {
      redirectTimer = window.setTimeout(() => window.location.replace(url), delay);
    };

    const finishConfirmation = async () => {
      const storedReturnTo = loadStoredReturnTo();
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(window.location.search);
      const authError = queryParams.get('error_description') || hashParams.get('error_description');
      const signInUrl = storedReturnTo
        ? `${createPageUrl('SignIn')}?returnTo=${encodeURIComponent(storedReturnTo)}`
        : createPageUrl('SignIn');

      if (authError) {
        if (!cancelled) {
          setState('error');
          setStatus('We could not confirm that email link. Please sign in or request a new confirmation link.');
        }
        // Keep the stored destination on an error so the member can request/sign in and
        // still return to the original Love Note or member experience afterward.
        scheduleRedirect(signInUrl, 1800);
        return;
      }

      let session = null;
      for (let attempt = 0; attempt < 8 && !session && !cancelled; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        session = data?.session || null;
        if (!session) await new Promise((resolve) => window.setTimeout(resolve, 300));
      }

      if (cancelled) return;

      if (session?.user && isConfirmedUser(session.user)) {
        clearStoredReturnTo();
        setState('success');
        setStatus('Email confirmed. Taking you back to One2OneLove…');
        scheduleRedirect(storedReturnTo || createPageUrl('Profile'), 700);
        return;
      }

      // Never call an account confirmed merely because a session object exists.
      // The AuthContext and protected backend paths use the same confirmation rule.
      if (session?.user && !isConfirmedUser(session.user)) {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.warn('Unable to clear unconfirmed callback session:', error);
        }
        if (cancelled) return;
        setState('error');
        setStatus('That link did not finish confirming your email. Please request a new confirmation link.');
        scheduleRedirect(signInUrl, 1800);
        return;
      }

      // Some email-link flows can return to the site without leaving a browser session.
      // Without a confirmed session we cannot truthfully claim confirmation succeeded.
      // Preserve the validated destination and let Sign In verify the account state.
      setState('success');
      setStatus('Confirmation link processed. Please sign in to continue.');
      scheduleRedirect(signInUrl, 900);
    };

    void finishConfirmation();
    return () => {
      cancelled = true;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 px-4 py-16">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg">
          <Heart className="h-8 w-8 fill-white" />
        </div>
        <h1 className="mt-6 text-3xl font-black text-slate-950">One2OneLove</h1>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-slate-600">
          {state === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : state === 'error' ? <AlertCircle className="h-5 w-5 text-amber-500" /> : <Loader2 className="h-5 w-5 animate-spin text-pink-500" />}
          <span>{status}</span>
        </div>
      </div>
    </main>
  );
}
