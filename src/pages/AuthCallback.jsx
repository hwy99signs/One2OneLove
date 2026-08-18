import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/Layout';
import {
  authUserIsConfirmed,
  clearAuthReturnTo,
  loadAuthReturnTo,
  scrubAuthMaterialFromUrl,
} from '@/lib/authFlowService';

const COPY = {
  en: { confirming: 'Confirming your email…', linkError: 'We could not confirm that email link. Please sign in or request a new confirmation link.', confirmed: 'Email confirmed. Taking you back to One2OneLove…', incomplete: 'That link did not finish confirming your email. Please request a new confirmation link.', processed: 'Confirmation link processed. Please sign in to continue.' },
  es: { confirming: 'Confirmando tu correo…', linkError: 'No pudimos confirmar ese enlace. Inicia sesión o solicita un nuevo correo de confirmación.', confirmed: 'Correo confirmado. Volviendo a One2OneLove…', incomplete: 'Ese enlace no terminó de confirmar tu correo. Solicita un nuevo enlace de confirmación.', processed: 'Enlace de confirmación procesado. Inicia sesión para continuar.' },
  fr: { confirming: 'Confirmation de votre e-mail…', linkError: 'Nous n’avons pas pu confirmer ce lien. Connectez-vous ou demandez un nouvel e-mail de confirmation.', confirmed: 'E-mail confirmé. Retour à One2OneLove…', incomplete: 'Ce lien n’a pas terminé la confirmation de votre e-mail. Demandez un nouveau lien.', processed: 'Lien de confirmation traité. Connectez-vous pour continuer.' },
  it: { confirming: 'Conferma della tua email…', linkError: 'Non siamo riusciti a confermare quel link. Accedi o richiedi una nuova email di conferma.', confirmed: 'Email confermata. Ritorno a One2OneLove…', incomplete: 'Quel link non ha completato la conferma della tua email. Richiedi un nuovo link.', processed: 'Link di conferma elaborato. Accedi per continuare.' },
  de: { confirming: 'E-Mail wird bestätigt…', linkError: 'Dieser Bestätigungslink konnte nicht bestätigt werden. Melde dich an oder fordere eine neue Bestätigungs-E-Mail an.', confirmed: 'E-Mail bestätigt. Zurück zu One2OneLove…', incomplete: 'Dieser Link hat die E-Mail-Bestätigung nicht abgeschlossen. Fordere einen neuen Bestätigungslink an.', processed: 'Bestätigungslink verarbeitet. Melde dich an, um fortzufahren.' },
};

export default function AuthCallback() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [status, setStatus] = useState(t.confirming);
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
        scrubAuthMaterialFromUrl();
        if (!cancelled) {
          setState('error');
          setStatus(t.linkError);
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
        scrubAuthMaterialFromUrl();
        clearAuthReturnTo();
        setState('success');
        setStatus(t.confirmed);
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
        setStatus(t.incomplete);
        scheduleRedirect(signInUrl, 1800);
        return;
      }

      scrubAuthMaterialFromUrl();
      setState('success');
      setStatus(t.processed);
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg"><Heart className="h-8 w-8 fill-white" /></div>
        <h1 className="mt-6 text-3xl font-black text-slate-950">One2OneLove</h1>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-slate-600">
          {state === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : state === 'error' ? <AlertCircle className="h-5 w-5 text-amber-500" /> : <Loader2 className="h-5 w-5 animate-spin text-pink-500" />}
          <span>{status}</span>
        </div>
      </div>
    </main>
  );
}