import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Heart, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { clearAuthReturnTo, safeAuthReturnTo, storeAuthReturnTo } from '@/lib/authFlowService';

const COPY = {
  en: {
    name: 'Your name', email: 'Email address', password: 'Password', confirm: 'Confirm password',
    terms: 'I agree to the Terms of Service and Privacy Policy.', create: 'Create free account',
    creating: 'Creating account…', confirmationTitle: 'Check your email', confirmationBody: 'We sent a confirmation link to',
    confirmationNext: 'After you confirm, One2OneLove will return you to what you were trying to open.',
    passwordHint: 'Use at least 8 characters.', mismatch: 'The passwords do not match.',
    termsRequired: 'Please agree to the Terms of Service and Privacy Policy.',
  },
  es: {
    name: 'Tu nombre', email: 'Correo electrónico', password: 'Contraseña', confirm: 'Confirmar contraseña',
    terms: 'Acepto los Términos de Servicio y la Política de Privacidad.', create: 'Crear cuenta gratis',
    creating: 'Creando cuenta…', confirmationTitle: 'Revisa tu correo', confirmationBody: 'Enviamos un enlace de confirmación a',
    confirmationNext: 'Después de confirmar, One2OneLove te devolverá a lo que intentabas abrir.',
    passwordHint: 'Usa al menos 8 caracteres.', mismatch: 'Las contraseñas no coinciden.',
    termsRequired: 'Acepta los Términos de Servicio y la Política de Privacidad.',
  },
  fr: {
    name: 'Votre nom', email: 'Adresse e-mail', password: 'Mot de passe', confirm: 'Confirmer le mot de passe',
    terms: "J'accepte les Conditions d'utilisation et la Politique de confidentialité.", create: 'Créer un compte gratuit',
    creating: 'Création du compte…', confirmationTitle: 'Consultez votre e-mail', confirmationBody: 'Nous avons envoyé un lien de confirmation à',
    confirmationNext: 'Après confirmation, One2OneLove vous ramènera à ce que vous vouliez ouvrir.',
    passwordHint: 'Utilisez au moins 8 caractères.', mismatch: 'Les mots de passe ne correspondent pas.',
    termsRequired: "Acceptez les Conditions d'utilisation et la Politique de confidentialité.",
  },
  it: {
    name: 'Il tuo nome', email: 'Indirizzo email', password: 'Password', confirm: 'Conferma password',
    terms: 'Accetto i Termini di servizio e la Privacy Policy.', create: 'Crea account gratuito',
    creating: 'Creazione account…', confirmationTitle: 'Controlla la tua email', confirmationBody: 'Abbiamo inviato un link di conferma a',
    confirmationNext: 'Dopo la conferma, One2OneLove ti riporterà a ciò che stavi cercando di aprire.',
    passwordHint: 'Usa almeno 8 caratteri.', mismatch: 'Le password non corrispondono.',
    termsRequired: 'Accetta i Termini di servizio e la Privacy Policy.',
  },
  de: {
    name: 'Dein Name', email: 'E-Mail-Adresse', password: 'Passwort', confirm: 'Passwort bestätigen',
    terms: 'Ich stimme den Nutzungsbedingungen und der Datenschutzrichtlinie zu.', create: 'Kostenloses Konto erstellen',
    creating: 'Konto wird erstellt…', confirmationTitle: 'Prüfe deine E-Mail', confirmationBody: 'Wir haben einen Bestätigungslink gesendet an',
    confirmationNext: 'Nach der Bestätigung bringt One2OneLove dich zu dem zurück, was du öffnen wolltest.',
    passwordHint: 'Verwende mindestens 8 Zeichen.', mismatch: 'Die Passwörter stimmen nicht überein.',
    termsRequired: 'Bitte stimme den Nutzungsbedingungen und der Datenschutzrichtlinie zu.',
  },
  nl: {
    name: 'Je naam', email: 'E-mailadres', password: 'Wachtwoord', confirm: 'Bevestig wachtwoord',
    terms: 'Ik ga akkoord met de Servicevoorwaarden en het Privacybeleid.', create: 'Gratis account maken',
    creating: 'Account maken…', confirmationTitle: 'Controleer je e-mail', confirmationBody: 'We hebben een bevestigingslink gestuurd naar',
    confirmationNext: 'Na bevestiging brengt One2OneLove je terug naar wat je wilde openen.',
    passwordHint: 'Gebruik minimaal 8 tekens.', mismatch: 'De wachtwoorden komen niet overeen.',
    termsRequired: 'Ga akkoord met de Servicevoorwaarden en het Privacybeleid.',
  },
};

const safeLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage?.getItem('preferredLanguage') || 'en';
  return COPY[stored] ? stored : 'en';
};

export default function RegularUserRelaunchForm({ returnTo = '/' }) {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', accepted: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const language = safeLanguage();
  const t = COPY[language] || COPY.en;
  const destination = useMemo(() => safeAuthReturnTo(returnTo, '/'), [returnTo]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError(t.passwordHint);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t.mismatch);
      return;
    }
    if (!form.accepted) {
      setError(t.termsRequired);
      return;
    }

    setSubmitting(true);
    try {
      // Confirmation commonly opens in a new tab, so store the already-validated local
      // destination durably. The callback clears it once the auth flow completes.
      storeAuthReturnTo(destination, { durable: true });

      const result = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (!result?.success) {
        setError(result?.error || 'Unable to create your account right now.');
        return;
      }

      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(form.email.trim().toLowerCase());
        return;
      }

      clearAuthReturnTo();
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(submitError?.message || 'Unable to create your account right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmationEmail) {
    return (
      <div className="rounded-3xl border border-green-200 bg-white p-7 text-center shadow-xl sm:p-9">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-700" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">{t.confirmationTitle}</h2>
        <p className="mt-3 text-gray-600">{t.confirmationBody} <strong>{confirmationEmail}</strong>.</p>
        <p className="mt-2 text-sm text-gray-500">{t.confirmationNext}</p>
        <Button type="button" variant="outline" className="mt-6" onClick={() => navigate(`/SignIn?returnTo=${encodeURIComponent(destination)}`)}>
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-pink-200 bg-white p-6 shadow-xl sm:p-8">
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-700">
          {t.name}
          <div className="relative mt-2">
            <UserRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              required
              maxLength={120}
              autoComplete="name"
              className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </div>
        </label>

        <label className="block text-sm font-semibold text-gray-700">
          {t.email}
          <div className="relative mt-2">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              required
              maxLength={320}
              autoComplete="email"
              className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            />
          </div>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t.password}
            <div className="relative mt-2">
              <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            {t.confirm}
            <div className="relative mt-2">
              <LockKeyhole className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => update('confirmPassword', event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
              />
            </div>
          </label>
        </div>
        <p className="text-xs text-gray-500">{t.passwordHint}</p>

        <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.accepted}
            onChange={(event) => update('accepted', event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            {t.terms}{' '}
            <Link to="/TermsOfService" className="font-semibold text-pink-700 underline">Terms</Link>{' '}
            <span aria-hidden="true">·</span>{' '}
            <Link to="/PrivacyPolicy" className="font-semibold text-pink-700 underline">Privacy</Link>
          </span>
        </label>
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>}

      <Button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full bg-gradient-to-r from-pink-600 to-purple-600 py-6 text-base font-bold text-white"
      >
        {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Heart className="mr-2 h-5 w-5 fill-current" />}
        {submitting ? t.creating : t.create}
      </Button>

      <p className="mt-4 text-center text-xs text-gray-500">
        Free-account creation does not start a paid membership or charge a payment method.
      </p>
    </form>
  );
}