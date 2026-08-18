import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';
import {
  authUserIsConfirmed,
  clearAuthReturnTo,
  loadAuthReturnTo,
  scrubAuthMaterialFromUrl,
} from '@/lib/authFlowService';

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
      const storedReturnTo = loadAuthReturnTo();
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(window.location.search);
      const authError = queryParams.get('error_description') || hashParams.get('error_description');
      const signInUrl = storedReturnTo
        ? `${createPageUrl('SignIn')}?returnTo=${encodeURIComponent(storedReturnTo)}`
        : createPageUrl('SignIn');

      if (authError) {
        // Read the provider error first, then remove auth/error material from the browser
        // address/history before the member is redirected.
        scrubAuthMaterialFromUrl();
        if (!cancelled) {
          setState('error');
          setStatus('We could not confirm that email link. Please sign in or request a new confirmation link.');
        }
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

      if (session?.user && authUserIsConfirmed(session.user)) {
        // Supabase has consumed the temporary confirmation credentials. Remove them from
        // the visible URL/history before any application navigation occurs.
        scrubAuthMaterialFromUrl();
        clearAuthReturnTo();
        setState('success');
        setStatus('Email confirmed. Taking you back to One2OneLove…');
        scheduleRedirect(storedReturnTo || createPageUrl('Profile'), 700);
        return;
      }

      if (session?.user && !authUserIsConfirmed(session.user)) {
        scrubAuthMaterialFromUrl();
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

      // A confirmation link may have been consumed without leaving a browser session.
      // Never claim success from the URL alone; scrub one-time material and require sign-in
      // to establish the confirmed account state.
      scrubAuthMaterialFromUrl();
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
