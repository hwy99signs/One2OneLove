import React, { useEffect, useState } from "react";
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
    subtitle: "Enter your email address and we'll send you a secure link to reset your password.",
    email: "Email Address",
    emailPlaceholder: "Enter your email",
    sendResetLink: "Send Reset Link",
    sending: "Sending...",
    backToSignIn: "Back to Sign In",
    emailSent: "Reset Link Sent",
    emailSentMessage: "If an account is associated with that email address, you'll receive password-reset instructions shortly.",
    backToHome: "Back to Home",
    didntReceive: "Didn't receive the email?",
    resendLink: "Resend Link",
    resendIn: "Resend available in",
    seconds: "seconds",
    linkResent: "Reset instructions sent again.",
    errorSending: "We couldn't send the reset link right now. Please try again.",
  },
  es: {
    title: "Olvidé Mi Contraseña",
    subtitle: "Ingresa tu correo electrónico y te enviaremos un enlace seguro para restablecer tu contraseña.",
    email: "Correo Electrónico",
    emailPlaceholder: "Ingresa tu correo",
    sendResetLink: "Enviar Enlace de Restablecimiento",
    sending: "Enviando...",
    backToSignIn: "Volver a Iniciar Sesión",
    emailSent: "Enlace de Restablecimiento Enviado",
    emailSentMessage: "Si existe una cuenta asociada con ese correo, recibirás pronto las instrucciones para restablecer la contraseña.",
    backToHome: "Volver al Inicio",
    didntReceive: "¿No recibiste el correo?",
    resendLink: "Reenviar Enlace",
    resendIn: "Podrás reenviar en",
    seconds: "segundos",
    linkResent: "Las instrucciones se enviaron nuevamente.",
    errorSending: "No pudimos enviar el enlace en este momento. Inténtalo de nuevo.",
  },
  fr: {
    title: "Mot de Passe Oublié",
    subtitle: "Entrez votre adresse e-mail et nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.",
    email: "Adresse E-mail",
    emailPlaceholder: "Entrez votre e-mail",
    sendResetLink: "Envoyer le Lien de Réinitialisation",
    sending: "Envoi...",
    backToSignIn: "Retour à la Connexion",
    emailSent: "Lien de Réinitialisation Envoyé",
    emailSentMessage: "Si un compte est associé à cette adresse e-mail, vous recevrez bientôt les instructions de réinitialisation.",
    backToHome: "Retour à l'Accueil",
    didntReceive: "Vous n'avez pas reçu l'e-mail ?",
    resendLink: "Renvoyer le Lien",
    resendIn: "Renvoi disponible dans",
    seconds: "secondes",
    linkResent: "Les instructions ont été renvoyées.",
    errorSending: "Impossible d'envoyer le lien pour le moment. Veuillez réessayer.",
  },
  it: {
    title: "Password Dimenticata",
    subtitle: "Inserisci il tuo indirizzo email e ti invieremo un link sicuro per reimpostare la password.",
    email: "Indirizzo Email",
    emailPlaceholder: "Inserisci la tua email",
    sendResetLink: "Invia Link di Reimpostazione",
    sending: "Invio...",
    backToSignIn: "Torna ad Accedi",
    emailSent: "Link di Reimpostazione Inviato",
    emailSentMessage: "Se esiste un account associato a questo indirizzo email, riceverai a breve le istruzioni per reimpostare la password.",
    backToHome: "Torna alla Home",
    didntReceive: "Non hai ricevuto l'email?",
    resendLink: "Reinvia Link",
    resendIn: "Potrai reinviare tra",
    seconds: "secondi",
    linkResent: "Le istruzioni sono state inviate di nuovo.",
    errorSending: "Non è stato possibile inviare il link. Riprova.",
  },
  de: {
    title: "Passwort Vergessen",
    subtitle: "Gib deine E-Mail-Adresse ein und wir senden dir einen sicheren Link zum Zurücksetzen deines Passworts.",
    email: "E-Mail-Adresse",
    emailPlaceholder: "E-Mail eingeben",
    sendResetLink: "Zurücksetzungslink Senden",
    sending: "Wird gesendet...",
    backToSignIn: "Zurück zur Anmeldung",
    emailSent: "Zurücksetzungslink Gesendet",
    emailSentMessage: "Wenn dieser E-Mail-Adresse ein Konto zugeordnet ist, erhältst du in Kürze Anweisungen zum Zurücksetzen des Passworts.",
    backToHome: "Zurück zur Startseite",
    didntReceive: "E-Mail nicht erhalten?",
    resendLink: "Link Erneut Senden",
    resendIn: "Erneut senden in",
    seconds: "Sekunden",
    linkResent: "Die Anweisungen wurden erneut gesendet.",
    errorSending: "Der Link konnte gerade nicht gesendet werden. Bitte versuche es erneut.",
  },
};

const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPassword() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const sendResetEmail = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const resetUrl = new URL('/ResetPassword', window.location.origin);
    resetUrl.searchParams.set('lang', currentLanguage);

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: resetUrl.toString(),
    });

    if (error) throw error;
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);

    try {
      await sendResetEmail();
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
    if (isLoading || resendCooldown > 0) return;
    setIsLoading(true);

    try {
      await sendResetEmail();
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
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t.emailSent}</h1>
          <p className="text-gray-600 mb-8">{t.emailSentMessage}</p>

          <div className="space-y-4">
            <Button asChild className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg">
              <Link to={createPageUrl("SignIn")}>{t.backToSignIn}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full py-6 rounded-xl text-gray-700">
              <Link to={createPageUrl("Home")}>{t.backToHome}</Link>
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">{t.didntReceive}</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading || resendCooldown > 0}
              className="text-pink-600 font-semibold hover:text-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t.sending : resendCooldown > 0 ? `${t.resendIn} ${resendCooldown} ${t.seconds}` : t.resendLink}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <Link to={createPageUrl("SignIn")} className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          {t.backToSignIn}
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        </div>
        <p className="text-gray-600 mb-8">{t.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password-reset-email" className="block text-sm font-medium text-gray-700 mb-2">{t.email} *</label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="password-reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.emailPlaceholder}
                autoComplete="email"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none text-gray-700 placeholder-gray-400"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg transition-all disabled:opacity-50">
            {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t.sending}</> : t.sendResetLink}
          </Button>
        </form>
      </div>
    </div>
  );
}
