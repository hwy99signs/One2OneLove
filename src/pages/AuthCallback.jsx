import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    checking: 'Confirming Your Account', checkingCopy: 'One2OneLove is securely completing your account confirmation.', success: 'Account Confirmed', successCopy: 'Your account confirmation is complete. You can continue to your profile.', failed: 'Confirmation Could Not Be Completed', failedCopy: 'This confirmation link may have expired or already been used. You can request a new link or sign in if your account is already confirmed.', profile: 'Continue to Profile', signIn: 'Go to Sign In', reset: 'Reset Password', security: 'One2OneLove does not display confirmation codes or authentication tokens on this page.' },
  es: {
    checking: 'Confirmando Tu Cuenta', checkingCopy: 'One2OneLove está completando de forma segura la confirmación de tu cuenta.', success: 'Cuenta Confirmada', successCopy: 'La confirmación de tu cuenta está completa. Puedes continuar a tu perfil.', failed: 'No Se Pudo Completar la Confirmación', failedCopy: 'Este enlace puede haber caducado o ya haberse utilizado. Puedes solicitar uno nuevo o iniciar sesión si tu cuenta ya está confirmada.', profile: 'Continuar al Perfil', signIn: 'Ir a Iniciar Sesión', reset: 'Restablecer Contraseña', security: 'One2OneLove no muestra códigos de confirmación ni tokens de autenticación en esta página.' },
  fr: {
    checking: 'Confirmation de Votre Compte', checkingCopy: 'One2OneLove termine en toute sécurité la confirmation de votre compte.', success: 'Compte Confirmé', successCopy: 'La confirmation de votre compte est terminée. Vous pouvez continuer vers votre profil.', failed: 'La Confirmation N’a Pas Pu Être Terminée', failedCopy: 'Ce lien a peut-être expiré ou a déjà été utilisé. Vous pouvez demander un nouveau lien ou vous connecter si votre compte est déjà confirmé.', profile: 'Continuer vers le Profil', signIn: 'Aller à la Connexion', reset: 'Réinitialiser le Mot de Passe', security: 'One2OneLove n’affiche aucun code de confirmation ni jeton d’authentification sur cette page.' },
  it: {
    checking: 'Conferma del Tuo Account', checkingCopy: 'One2OneLove sta completando in modo sicuro la conferma del tuo account.', success: 'Account Confermato', successCopy: 'La conferma del tuo account è completa. Puoi continuare al tuo profilo.', failed: 'Impossibile Completare la Conferma', failedCopy: 'Questo link potrebbe essere scaduto o già utilizzato. Puoi richiedere un nuovo link o accedere se il tuo account è già confermato.', profile: 'Continua al Profilo', signIn: 'Vai all’Accesso', reset: 'Reimposta Password', security: 'One2OneLove non mostra codici di conferma o token di autenticazione in questa pagina.' },
  de: {
    checking: 'Konto Wird Bestätigt', checkingCopy: 'One2OneLove schließt deine Kontobestätigung sicher ab.', success: 'Konto Bestätigt', successCopy: 'Deine Kontobestätigung ist abgeschlossen. Du kannst zu deinem Profil weitergehen.', failed: 'Bestätigung Konnte Nicht Abgeschlossen Werden', failedCopy: 'Dieser Bestätigungslink ist möglicherweise abgelaufen oder wurde bereits verwendet. Du kannst einen neuen Link anfordern oder dich anmelden, wenn dein Konto bereits bestätigt ist.', profile: 'Zum Profil', signIn: 'Zur Anmeldung', reset: 'Passwort Zurücksetzen', security: 'One2OneLove zeigt auf dieser Seite keine Bestätigungscodes oder Authentifizierungs-Token an.' },
};

const cleanAuthUrl = () => {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, document.title, '/auth/callback');
};

export default function AuthCallback() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('checking');

  useEffect(() => {
    let active = true;

    const complete = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const returnedError = url.searchParams.get('error') || url.searchParams.get('error_code');

        if (returnedError) {
          cleanAuthUrl();
          if (active) setState('failed');
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            cleanAuthUrl();
            if (active) setState('failed');
            return;
          }
        }

        const { data, error } = await supabase.auth.getSession();
        cleanAuthUrl();
        if (error || !data?.session?.user) {
          if (active) setState('failed');
          return;
        }

        await refreshUserProfile();
        if (!active) return;
        setState('success');
      } catch {
        cleanAuthUrl();
        if (active) setState('failed');
      }
    };

    complete();
    return () => { active = false; };
  }, [refreshUserProfile]);

  const success = state === 'success';
  const failed = state === 'failed';
  const Icon = success ? CheckCircle : failed ? TriangleAlert : Loader2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4 py-12">
      <Card className="w-full max-w-xl border-2 border-white/70 bg-white/95 shadow-xl">
        <CardHeader className="text-center">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${success ? 'bg-green-100' : failed ? 'bg-amber-100' : 'bg-purple-100'}`}>
            <Icon className={`h-11 w-11 ${success ? 'text-green-600' : failed ? 'text-amber-600' : 'animate-spin text-purple-600'}`} aria-hidden="true" />
          </div>
          <CardTitle className="mt-5 text-3xl text-gray-900">{success ? t.success : failed ? t.failed : t.checking}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-base leading-7 text-gray-600">{success ? t.successCopy : failed ? t.failedCopy : t.checkingCopy}</p>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-left text-sm leading-6 text-blue-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{t.security}</p>
          </div>

          {success && (
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button type="button" onClick={() => navigate('/Profile', { replace: true })}>{t.profile}</Button>
              <Button asChild variant="outline"><Link to="/">One2OneLove</Link></Button>
            </div>
          )}

          {failed && (
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild><Link to="/SignIn">{t.signIn}</Link></Button>
              <Button asChild variant="outline"><Link to="/ForgotPassword">{t.reset}</Link></Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
