import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Heart, KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/Layout';
import { supabase } from '@/lib/supabase';

const ACTIVE_LANGUAGES = new Set(['en', 'es', 'fr', 'it', 'de']);

const translations = {
  en: {
    title: 'Create a New Password',
    subtitle: 'Choose a new password for your One2OneLove account.',
    password: 'New Password',
    confirm: 'Confirm New Password',
    passwordPlaceholder: 'Enter your new password',
    confirmPlaceholder: 'Enter it again',
    update: 'Update Password',
    updating: 'Updating...',
    minimum: 'Use at least 8 characters.',
    mismatch: 'The passwords do not match.',
    tooShort: 'Your new password must contain at least 8 characters.',
    invalidTitle: 'Reset Link Unavailable',
    invalidCopy: 'This password-reset link is invalid, expired, or no longer has an active recovery session.',
    requestNew: 'Request a New Reset Link',
    successTitle: 'Password Updated',
    successCopy: 'Your password has been changed successfully. Sign in again using your new password.',
    signIn: 'Continue to Sign In',
    error: 'We could not update your password. Please request a new reset link and try again.',
    checking: 'Verifying your secure reset link...',
  },
  es: {
    title: 'Crear una Nueva Contraseña',
    subtitle: 'Elige una nueva contraseña para tu cuenta de One2OneLove.',
    password: 'Nueva Contraseña',
    confirm: 'Confirmar Nueva Contraseña',
    passwordPlaceholder: 'Ingresa tu nueva contraseña',
    confirmPlaceholder: 'Ingresa la contraseña nuevamente',
    update: 'Actualizar Contraseña',
    updating: 'Actualizando...',
    minimum: 'Usa al menos 8 caracteres.',
    mismatch: 'Las contraseñas no coinciden.',
    tooShort: 'La nueva contraseña debe tener al menos 8 caracteres.',
    invalidTitle: 'Enlace de Restablecimiento No Disponible',
    invalidCopy: 'Este enlace es inválido, ha vencido o ya no tiene una sesión de recuperación activa.',
    requestNew: 'Solicitar un Nuevo Enlace',
    successTitle: 'Contraseña Actualizada',
    successCopy: 'Tu contraseña se cambió correctamente. Inicia sesión nuevamente con tu nueva contraseña.',
    signIn: 'Continuar a Iniciar Sesión',
    error: 'No pudimos actualizar tu contraseña. Solicita un nuevo enlace e inténtalo de nuevo.',
    checking: 'Verificando tu enlace seguro...',
  },
  fr: {
    title: 'Créer un Nouveau Mot de Passe',
    subtitle: 'Choisissez un nouveau mot de passe pour votre compte One2OneLove.',
    password: 'Nouveau Mot de Passe',
    confirm: 'Confirmer le Nouveau Mot de Passe',
    passwordPlaceholder: 'Entrez votre nouveau mot de passe',
    confirmPlaceholder: 'Saisissez-le à nouveau',
    update: 'Mettre à Jour le Mot de Passe',
    updating: 'Mise à jour...',
    minimum: 'Utilisez au moins 8 caractères.',
    mismatch: 'Les mots de passe ne correspondent pas.',
    tooShort: 'Votre nouveau mot de passe doit contenir au moins 8 caractères.',
    invalidTitle: 'Lien de Réinitialisation Indisponible',
    invalidCopy: 'Ce lien est invalide, expiré ou ne dispose plus d’une session de récupération active.',
    requestNew: 'Demander un Nouveau Lien',
    successTitle: 'Mot de Passe Mis à Jour',
    successCopy: 'Votre mot de passe a été modifié. Connectez-vous à nouveau avec votre nouveau mot de passe.',
    signIn: 'Continuer vers la Connexion',
    error: 'Impossible de mettre à jour votre mot de passe. Demandez un nouveau lien et réessayez.',
    checking: 'Vérification de votre lien sécurisé...',
  },
  it: {
    title: 'Crea una Nuova Password',
    subtitle: 'Scegli una nuova password per il tuo account One2OneLove.',
    password: 'Nuova Password',
    confirm: 'Conferma Nuova Password',
    passwordPlaceholder: 'Inserisci la nuova password',
    confirmPlaceholder: 'Inseriscila di nuovo',
    update: 'Aggiorna Password',
    updating: 'Aggiornamento...',
    minimum: 'Usa almeno 8 caratteri.',
    mismatch: 'Le password non corrispondono.',
    tooShort: 'La nuova password deve contenere almeno 8 caratteri.',
    invalidTitle: 'Link di Reimpostazione Non Disponibile',
    invalidCopy: 'Questo link non è valido, è scaduto o non dispone più di una sessione di recupero attiva.',
    requestNew: 'Richiedi un Nuovo Link',
    successTitle: 'Password Aggiornata',
    successCopy: 'La password è stata modificata correttamente. Accedi di nuovo con la nuova password.',
    signIn: 'Continua ad Accedi',
    error: 'Impossibile aggiornare la password. Richiedi un nuovo link e riprova.',
    checking: 'Verifica del link sicuro...',
  },
  de: {
    title: 'Neues Passwort Erstellen',
    subtitle: 'Wähle ein neues Passwort für dein One2OneLove-Konto.',
    password: 'Neues Passwort',
    confirm: 'Neues Passwort Bestätigen',
    passwordPlaceholder: 'Neues Passwort eingeben',
    confirmPlaceholder: 'Passwort erneut eingeben',
    update: 'Passwort Aktualisieren',
    updating: 'Wird aktualisiert...',
    minimum: 'Verwende mindestens 8 Zeichen.',
    mismatch: 'Die Passwörter stimmen nicht überein.',
    tooShort: 'Dein neues Passwort muss mindestens 8 Zeichen enthalten.',
    invalidTitle: 'Zurücksetzungslink Nicht Verfügbar',
    invalidCopy: 'Dieser Link ist ungültig, abgelaufen oder hat keine aktive Wiederherstellungssitzung mehr.',
    requestNew: 'Neuen Link Anfordern',
    successTitle: 'Passwort Aktualisiert',
    successCopy: 'Dein Passwort wurde erfolgreich geändert. Melde dich mit deinem neuen Passwort erneut an.',
    signIn: 'Weiter zur Anmeldung',
    error: 'Das Passwort konnte nicht aktualisiert werden. Fordere einen neuen Link an und versuche es erneut.',
    checking: 'Sicherer Link wird überprüft...',
  },
};

export default function ResetPassword() {
  const { currentLanguage, changeLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const languageFromLink = new URLSearchParams(window.location.search).get('lang');
    if (languageFromLink && ACTIVE_LANGUAGES.has(languageFromLink) && languageFromLink !== currentLanguage) {
      changeLanguage(languageFromLink);
    }
  }, [changeLanguage, currentLanguage]);

  useEffect(() => {
    let active = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        setCanReset(true);
        setChecking(false);
        setError('');
      }
    });

    const verifySession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!active) return;
        if (sessionError) throw sessionError;
        setCanReset(Boolean(data?.session));
      } catch (sessionError) {
        console.error('Password recovery session verification error:', sessionError);
        if (active) setCanReset(false);
      } finally {
        if (active) setChecking(false);
      }
    };

    verifySession();

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t.tooShort);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.mismatch);
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // End the recovery session after the password is changed so the user signs in cleanly
      // with the new credential instead of leaving the recovery session active in the browser.
      await supabase.auth.signOut();
      setCompleted(true);
      setCanReset(false);
      setPassword('');
      setConfirmPassword('');
    } catch (updateError) {
      console.error('Password update error:', updateError);
      setError(t.error);
    } finally {
      setSaving(false);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">{children}</div>
    </div>
  );

  if (checking) {
    return shell(
      <div className="py-10 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-pink-600" />
        <p className="mt-4 text-gray-600">{t.checking}</p>
      </div>
    );
  }

  if (completed) {
    return shell(
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t.successTitle}</h1>
        <p className="mt-4 text-gray-600">{t.successCopy}</p>
        <Button asChild className="mt-8 w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white hover:from-pink-600 hover:to-purple-700">
          <Link to="/SignIn">{t.signIn}</Link>
        </Button>
      </div>
    );
  }

  if (!canReset) {
    return shell(
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t.invalidTitle}</h1>
        <p className="mt-4 text-gray-600">{t.invalidCopy}</p>
        <Button asChild className="mt-8 w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white hover:from-pink-600 hover:to-purple-700">
          <Link to="/ForgotPassword">{t.requestNew}</Link>
        </Button>
      </div>
    );
  }

  return shell(
    <>
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg">
          <Heart className="h-6 w-6 fill-white text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
      </div>
      <p className="mb-8 text-gray-600">{t.subtitle}</p>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-gray-700">{t.password}</label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.passwordPlaceholder}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={saving}
              className="pl-12 pr-12"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">{t.minimum}</p>
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-700">{t.confirm}</label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder={t.confirmPlaceholder}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={saving}
              className="pl-12 pr-12"
            />
            <button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-50">
          {saving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.updating}</> : t.update}
        </Button>
      </form>
    </>
  );
}
