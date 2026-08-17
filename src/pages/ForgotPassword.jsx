import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { supabase } from "@/lib/supabase";

const translations = {
  en: {
    title: "Forgot Password",
    subtitle: "Enter your email address and we'll send you a secure link to reset your password",
    email: "Email Address",
    emailPlaceholder: "Enter your email",
    sendResetLink: "Send Reset Link",
    sending: "Sending...",
    backToSignIn: "Back to Sign In",
    emailSent: "Check Your Email",
    emailSentMessage: "If an account matches that email address, a password-reset link has been sent. Open the link while it is still valid to choose a new password.",
    backToHome: "Back to Home",
    didntReceive: "Didn't receive the email?",
    resendLink: "Resend Link",
    linkResent: "If the account exists, another reset link has been requested.",
    errorSending: "We couldn't request a reset link right now. Please try again."
  },
  es: {
    title: "Olvidé Mi Contraseña", subtitle: "Ingresa tu correo y te enviaremos un enlace seguro para restablecer tu contraseña", email: "Correo Electrónico", emailPlaceholder: "Ingresa tu correo", sendResetLink: "Enviar Enlace de Restablecimiento", sending: "Enviando...", backToSignIn: "Volver a Iniciar Sesión", emailSent: "Revisa Tu Correo", emailSentMessage: "Si existe una cuenta con ese correo, se ha enviado un enlace para restablecer la contraseña. Ábrelo mientras siga siendo válido para elegir una nueva contraseña.", backToHome: "Volver al Inicio", didntReceive: "¿No recibiste el correo?", resendLink: "Reenviar Enlace", linkResent: "Si la cuenta existe, se solicitó otro enlace de restablecimiento.", errorSending: "No pudimos solicitar el enlace en este momento. Inténtalo de nuevo."
  },
  fr: {
    title: "Mot de Passe Oublié", subtitle: "Entrez votre e-mail et nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe", email: "Adresse E-mail", emailPlaceholder: "Entrez votre e-mail", sendResetLink: "Envoyer le Lien de Réinitialisation", sending: "Envoi...", backToSignIn: "Retour à la Connexion", emailSent: "Vérifiez Votre E-mail", emailSentMessage: "Si un compte correspond à cette adresse, un lien de réinitialisation a été envoyé. Ouvrez-le tant qu’il est valide pour choisir un nouveau mot de passe.", backToHome: "Retour à l'Accueil", didntReceive: "Vous n'avez pas reçu l'e-mail ?", resendLink: "Renvoyer le Lien", linkResent: "Si le compte existe, un nouveau lien a été demandé.", errorSending: "Impossible de demander un lien pour le moment. Veuillez réessayer."
  },
  it: {
    title: "Password Dimenticata", subtitle: "Inserisci la tua email e ti invieremo un link sicuro per reimpostare la password", email: "Indirizzo Email", emailPlaceholder: "Inserisci la tua email", sendResetLink: "Invia Link di Reimpostazione", sending: "Invio...", backToSignIn: "Torna ad Accedi", emailSent: "Controlla la Tua Email", emailSentMessage: "Se esiste un account con quell’indirizzo email, è stato inviato un link di reimpostazione. Aprilo mentre è ancora valido per scegliere una nuova password.", backToHome: "Torna alla Home", didntReceive: "Non hai ricevuto l'email?", resendLink: "Reinvia Link", linkResent: "Se l’account esiste, è stato richiesto un altro link.", errorSending: "Non è stato possibile richiedere il link. Riprova."
  },
  de: {
    title: "Passwort Vergessen", subtitle: "Gib deine E-Mail-Adresse ein und wir senden dir einen sicheren Link zum Zurücksetzen des Passworts", email: "E-Mail-Adresse", emailPlaceholder: "Gib deine E-Mail ein", sendResetLink: "Zurücksetzungslink Senden", sending: "Senden...", backToSignIn: "Zurück zur Anmeldung", emailSent: "Prüfe Deine E-Mail", emailSentMessage: "Wenn ein Konto zu dieser E-Mail-Adresse existiert, wurde ein Passwort-Zurücksetzungslink gesendet. Öffne ihn, solange er gültig ist, um ein neues Passwort festzulegen.", backToHome: "Zurück zur Startseite", didntReceive: "E-Mail nicht erhalten?", resendLink: "Link Erneut Senden", linkResent: "Wenn das Konto existiert, wurde ein weiterer Link angefordert.", errorSending: "Der Zurücksetzungslink konnte gerade nicht angefordert werden. Bitte versuche es erneut."
  },
  nl: {
    title: "Wachtwoord Vergeten", subtitle: "Voer je e-mailadres in en we sturen je een beveiligde link om je wachtwoord opnieuw in te stellen", email: "E-mailadres", emailPlaceholder: "Voer je e-mail in", sendResetLink: "Herstellink Verzenden", sending: "Verzenden...", backToSignIn: "Terug naar Inloggen", emailSent: "Controleer Je E-mail", emailSentMessage: "Als er een account bij dat e-mailadres hoort, is een wachtwoordherstellink verstuurd. Open de link zolang deze geldig is om een nieuw wachtwoord te kiezen.", backToHome: "Terug naar Home", didntReceive: "E-mail niet ontvangen?", resendLink: "Link Opnieuw Verzenden", linkResent: "Als het account bestaat, is opnieuw een herstellink aangevraagd.", errorSending: "We konden nu geen herstellink aanvragen. Probeer het opnieuw."
  },
};

export default function ForgotPassword() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestReset = async () => {
    const redirectTo = `${window.location.origin}/ResetPassword`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) throw error;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await requestReset();
      setEmailSent(true);
      toast.success(t.emailSent);
    } catch (error) {
      console.error("Password reset request error:", error);
      toast.error(t.errorSending);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await requestReset();
      toast.success(t.linkResent);
    } catch (error) {
      console.error("Password reset resend error:", error);
      toast.error(t.errorSending);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100"><CheckCircle className="h-10 w-10 text-green-600" /></div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">{t.emailSent}</h1>
          <p className="mb-8 text-gray-600">{t.emailSentMessage}</p>
          <div className="space-y-4">
            <Link to={createPageUrl("SignIn")}><Button className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white shadow-lg hover:from-pink-600 hover:to-purple-700">{t.backToSignIn}</Button></Link>
            <Link to={createPageUrl("Home")}><Button variant="outline" className="w-full rounded-xl py-6 text-gray-700">{t.backToHome}</Button></Link>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6"><p className="mb-3 text-sm text-gray-600">{t.didntReceive}</p><button onClick={handleResend} disabled={isLoading} className="font-semibold text-pink-600 hover:text-pink-700 disabled:opacity-50">{isLoading ? t.sending : t.resendLink}</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <Link to={createPageUrl("SignIn")} className="mb-6 inline-flex items-center text-gray-600 transition-colors hover:text-gray-800"><ArrowLeft size={20} className="mr-2" />{t.backToSignIn}</Link>
        <div className="mb-2 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg"><Heart className="h-6 w-6 fill-white text-white" /></div><h1 className="text-3xl font-bold text-gray-900">{t.title}</h1></div>
        <p className="mb-8 text-gray-600">{t.subtitle}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label className="mb-2 block text-sm font-medium text-gray-700">{t.email} *</label><div className="relative"><Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.emailPlaceholder} autoComplete="email" className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-gray-700 outline-none placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-pink-400" required disabled={isLoading} /></div></div>
          <Button type="submit" disabled={isLoading} className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:from-pink-600 hover:to-purple-700 disabled:opacity-50">{isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.sending}</> : t.sendResetLink}</Button>
        </form>
      </div>
    </div>
  );
}
