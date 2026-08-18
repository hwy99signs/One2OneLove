import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const SCRIPT_ID = 'o2ol-cloudflare-turnstile';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const loadTurnstile = () => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') {
    reject(new Error('Turnstile requires a browser.'));
    return;
  }
  if (window.turnstile) {
    resolve(window.turnstile);
    return;
  }

  let script = document.getElementById(SCRIPT_ID);
  if (!script) {
    script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  const deadline = Date.now() + 10_000;
  const poll = () => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    if (Date.now() >= deadline) {
      reject(new Error('Verification service did not load.'));
      return;
    }
    window.setTimeout(poll, 100);
  };
  poll();
});

export const turnstileConfigured = () => Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);

export default function TurnstileWidget({ onToken, resetKey = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    onToken?.('');
    if (!siteKey) {
      setStatus('not-configured');
      return undefined;
    }

    let cancelled = false;
    let turnstileApi = null;

    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        turnstileApi = api;
        if (widgetIdRef.current !== null) {
          try { api.remove(widgetIdRef.current); } catch { /* no-op */ }
        }
        widgetIdRef.current = api.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'light',
          size: 'flexible',
          callback: (token) => {
            if (cancelled) return;
            setStatus('verified');
            onToken?.(token || '');
          },
          'expired-callback': () => {
            if (cancelled) return;
            setStatus('expired');
            onToken?.('');
          },
          'error-callback': () => {
            if (cancelled) return;
            setStatus('error');
            onToken?.('');
          },
        });
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('Application verification unavailable:', error);
        setStatus('error');
        onToken?.('');
      });

    return () => {
      cancelled = true;
      onToken?.('');
      if (turnstileApi && widgetIdRef.current !== null) {
        try { turnstileApi.remove(widgetIdRef.current); } catch { /* no-op */ }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, resetKey, onToken]);

  if (!siteKey) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
        <p>Secure application verification will be enabled when professional applications open.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div ref={containerRef} className="min-h-[65px]" />
      {(status === 'error' || status === 'expired') && (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          Verification needs to be completed again before submitting.
        </p>
      )}
    </div>
  );
}
