import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Heart, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const copy = {
  en: {
    title: "Choose a new password", subtitle: "Use a strong password you do not use on another account.", password: "New password", confirm: "Confirm new password", save: "Update password", saving: "Updating…", checking: "Checking your reset link…", invalid: "This password-reset link is invalid, expired, or has already been used.", requestNew: "Request a new reset link", mismatch: "The passwords do not match.", short: "Use at least 8 characters.", success: "Password updated", successText: "Your password has been changed. Sign in with your new password to continue.", signIn: "Go to Sign In", error: "We couldn't update your password. Please request a new reset link and try again."
  },
  es: {
    title: "Elige una nueva contraseña", subtitle: "Usa una contraseña segura que no utilices en otra cuenta.", password: "Nueva contraseña", confirm: "Confirmar nueva contraseña", save: "Actualizar contraseña", saving: "Actualizando…", checking: "Comprobando tu enlace…", invalid: "Este enlace para restablecer la contraseña no es válido, expiró o ya fue utilizado.", requestNew: "Solicitar un nuevo enlace", mismatch: "Las contraseñas no coinciden.", short: "Usa al menos 8 caracteres.", success: "Contraseña actualizada", successText: "Tu contraseña fue cambiada. Inicia sesión con la nueva contraseña para continuar.", signIn: "Ir a Iniciar Sesión", error: "No pudimos actualizar tu contraseña. Solicita un nuevo enlace e inténtalo de nuevo."
  },
  fr: {
    title: "Choisissez un nouveau mot de passe", subtitle: "Utilisez un mot de passe fort que vous n’utilisez pas ailleurs.", password: "Nouveau mot de passe", confirm: "Confirmer le nouveau mot de passe", save: "Mettre à jour le mot de passe", saving: "Mise à jour…", checking: "Vérification de votre lien…", invalid: "Ce lien de réinitialisation est invalide, expiré ou a déjà été utilisé.", requestNew: "Demander un nouveau lien", mismatch: "Les mots de passe ne correspondent pas.", short: "Utilisez au moins 8 caractères.", success: "Mot de passe mis à jour", successText: "Votre mot de passe a été modifié. Connectez-vous avec le nouveau mot de passe pour continuer.", signIn: "Aller à la Connexion", error: "Impossible de mettre à jour votre mot de passe. Demandez un nouveau lien et réessayez."
  },
  it: {
    title: "Scegli una nuova password", subtitle: "Usa una password sicura che non utilizzi su altri account.", password: "Nuova password", confirm: "Conferma nuova password", save: "Aggiorna password", saving: "Aggiornamento…", checking: "Controllo del link…", invalid: "Questo link di reimpostazione non è valido, è scaduto o è già stato utilizzato.", requestNew: "Richiedi un nuovo link", mismatch: "Le password non coincidono.", short: "Usa almeno 8 caratteri.", success: "Password aggiornata", successText: "La password è stata modificata. Accedi con la nuova password per continuare.", signIn: "Vai ad Accedi", error: "Non è stato possibile aggiornare la password. Richiedi un nuovo link e riprova."
  },
  de: {
    title: "Wähle ein neues Passwort", subtitle: "Verwende ein starkes Passwort, das du nicht für ein anderes Konto nutzt.", password: "Neues Passwort", confirm: "Neues Passwort bestätigen", save: "Passwort aktualisieren", saving: "Aktualisieren…", checking: "Zurücksetzungslink wird geprüft…", invalid: "Dieser Passwort-Link ist ungültig, abgelaufen oder wurde bereits verwendet.", requestNew: "Neuen Link anfordern", mismatch: "Die Passwörter stimmen nicht überein.", short: "Verwende mindestens 8 Zeichen.", success: "Passwort aktualisiert", successText: "Dein Passwort wurde geändert. Melde dich mit dem neuen Passwort an.", signIn: "Zur Anmeldung", error: "Das Passwort konnte nicht aktualisiert werden. Fordere einen neuen Link an und versuche es erneut."
  },
  nl: {
    title: "Kies een nieuw wachtwoord", subtitle: "Gebruik een sterk wachtwoord dat je niet voor een ander account gebruikt.", password: "Nieuw wachtwoord", confirm: "Nieuw wachtwoord bevestigen", save: "Wachtwoord bijwerken", saving: "Bijwerken…", checking: "Je herstellink wordt gecontroleerd…", invalid: "Deze wachtwoordherstellink is ongeldig, verlopen of al gebruikt.", requestNew: "Nieuwe link aanvragen", mismatch: "De wachtwoorden komen niet overeen.", short: "Gebruik minimaal 8 tekens.", success: "Wachtwoord bijgewerkt", successText: "Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord om verder te gaan.", signIn: "Naar Inloggen", error: "We konden je wachtwoord niet bijwerken. Vraag een nieuwe herstellink aan en probeer het opnieuw."
  },
};

const urlHasRecoveryMarker = () => {
  if (typeof window === "undefined") return false;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return search.get("type") === "recovery" || hash.get("type") === "recovery";
};

export default function ResetPassword() {
  const { currentLanguage } = useLanguage();
  const t = copy[currentLanguage] || copy.en;
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    let recoverySeen = false;

    const acceptRecoverySession = (session) => {
      if (!mounted || !session?.user) return;
      recoverySeen = true;
      setValidSession(true);
      setError("");
      setChecking(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        acceptRecoverySession(session);
      }
    });

    const verify = async () => {
      // A normal SIGNED_IN/INITIAL_SESSION must never authorize this page. The only
      // fallback accepted here is a valid authenticated session paired with Supabase's
      // explicit recovery marker in the URL. This covers implicit recovery redirects if
      // PASSWORD_RECOVERY fired just before this component subscribed.
      if (urlHasRecoveryMarker()) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && data?.session?.user) {
          acceptRecoverySession(data.session);
          return;
        }
      }

      // Give the auth client a short window to process a legitimate PKCE recovery code
      // and emit PASSWORD_RECOVERY. Do not upgrade an ordinary signed-in session.
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
      if (!mounted || recoverySeen) return;

      setChecking(false);
      setValidSession(false);
      setError(t.invalid);
    };

    void verify();
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [t.invalid]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validSession) {
      setError(t.invalid);
      return;
    }
    if (password.length < 8) {
      setError(t.short);
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
      setSuccess(true);
      setValidSession(false);
      try { await supabase.auth.signOut(); } catch (signOutError) { console.warn("Post-reset sign out failed:", signOutError); }
    } catch (updateError) {
      console.error("Password update failed:", updateError);
      setError(t.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg"><Heart className="h-6 w-6 fill-white text-white" /></div><div><div className="text-xs font-black uppercase tracking-[0.16em] text-pink-600">One2OneLove</div><h1 className="text-2xl font-black text-slate-950">{success ? t.success : t.title}</h1></div></div>

        {success ? (
          <div className="mt-8 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"><CheckCircle2 className="h-8 w-8 text-emerald-600" /></div><p className="mt-5 text-sm leading-6 text-slate-600">{t.successText}</p><Link to={createPageUrl("SignIn")} className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-pink-600 px-5 py-3.5 text-sm font-black text-white">{t.signIn}</Link></div>
        ) : checking ? (
          <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-600"><Loader2 className="h-5 w-5 animate-spin text-pink-500" />{t.checking}</div>
        ) : !validSession ? (
          <div className="mt-8 text-center"><LockKeyhole className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-4 text-sm leading-6 text-slate-600">{error || t.invalid}</p><Link to={createPageUrl("ForgotPassword")} className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-pink-600 px-5 py-3.5 text-sm font-black text-white">{t.requestNew}</Link></div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <p className="text-sm leading-6 text-slate-600">{t.subtitle}</p>
            <div><label className="mb-2 block text-sm font-black text-slate-700">{t.password}</label><div className="relative"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>
            <div><label className="mb-2 block text-sm font-black text-slate-700">{t.confirm}</label><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100" /></div>
            {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{error}</div>}
            <Button type="submit" disabled={saving} className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-base font-black text-white disabled:opacity-50">{saving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.saving}</> : t.save}</Button>
          </form>
        )}
      </section>
    </main>
  );
}
