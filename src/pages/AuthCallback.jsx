import React, { useEffect, useState } from 'react';
import { CheckCircle2, Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';

const safeReturnTo = (value) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
};

export default function AuthCallback() {
  const [status, setStatus] = useState('Confirming your email…');

  useEffect(() => {
    let cancelled = false;

    const finishConfirmation = async () => {
      const storedReturnTo = safeReturnTo(localStorage.getItem('o2ol-return-after-auth'));
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(window.location.search);
      const authError = queryParams.get('error_description') || hashParams.get('error_description');

      if (authError) {
        if (!cancelled) setStatus('We could not confirm that email link. Please sign in or request a new link.');
        const signInUrl = storedReturnTo
          ? `${createPageUrl('SignIn')}?returnTo=${encodeURIComponent(storedReturnTo)}`
          : createPageUrl('SignIn');
        window.setTimeout(() => window.location.replace(signInUrl), 1800);
        return;
      }

      let session = null;
      for (let attempt = 0; attempt < 6 && !session && !cancelled; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        session = data?.session || null;
        if (!session) await new Promise((resolve) => window.setTimeout(resolve, 350));
      }

      if (cancelled) return;

      if (session?.user) {
        localStorage.removeItem('o2ol-return-after-auth');
        setStatus('Email confirmed. Taking you back to One2OneLove…');
        window.setTimeout(() => {
          window.location.replace(storedReturnTo || createPageUrl('Profile'));
        }, 700);
        return;
      }

      const signInUrl = storedReturnTo
        ? `${createPageUrl('SignIn')}?returnTo=${encodeURIComponent(storedReturnTo)}`
        : createPageUrl('SignIn');
      localStorage.removeItem('o2ol-return-after-auth');
      setStatus('Email confirmed. Please sign in to continue.');
      window.setTimeout(() => window.location.replace(signInUrl), 900);
    };

    finishConfirmation();
    return () => {
      cancelled = true;
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
          {status.startsWith('Email confirmed') ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Loader2 className="h-5 w-5 animate-spin text-pink-500" />}
          <span>{status}</span>
        </div>
      </div>
    </main>
  );
}
