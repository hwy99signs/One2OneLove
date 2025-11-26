import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Forgot Password",
    subtitle: "Enter your email address and we'll send you a link to reset your password",
    email: "Email Address",
    emailPlaceholder: "Enter your email",
    sendResetLink: "Send Reset Link",
    sending: "Sending...",
    backToSignIn: "Back to Sign In",
    emailSent: "Reset Link Sent!",
    emailSentMessage: "Check your email for instructions to reset your password. The link will expire in 24 hours.",
    backToHome: "Back to Home",
    didntReceive: "Didn't receive the email?",
    resendLink: "Resend Link",
    linkResent: "Link resent successfully!",
    errorSending: "Error sending reset link. Please try again."
  },
  es: {
    title: "Olvidé Mi Contraseña",
    subtitle: "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña",
    email: "Correo Electrónico",
    emailPlaceholder: "Ingresa tu correo",
    sendResetLink: "Enviar Enlace de Restablecimiento",
    sending: "Enviando...",
    backToSignIn: "Volver a Iniciar Sesión",
    emailSent: "¡Enlace de Restablecimiento Enviado!",
    emailSentMessage: "Revisa tu correo para obtener instrucciones para restablecer tu contraseña. El enlace expirará en 24 horas.",
    backToHome: "Volver al Inicio",
    didntReceive: "¿No recibiste el correo?",
    resendLink: "Reenviar Enlace",
    linkResent: "¡Enlace reenviado exitosamente!",
    errorSending: "Error al enviar el enlace. Por favor, inténtalo de nuevo."
  },
  fr: {
    title: "Mot de Passe Oublié",
    subtitle: "Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe",
    email: "Adresse E-mail",
    emailPlaceholder: "Entrez votre e-mail",
    sendResetLink: "Envoyer le Lien de Réinitialisation",
    sending: "Envoi...",
    backToSignIn: "Retour à la Connexion",
    emailSent: "Lien de Réinitialisation Envoyé!",
    emailSentMessage: "Consultez votre e-mail pour les instructions pour réinitialiser votre mot de passe. Le lien expirera dans 24 heures.",
    backToHome: "Retour à l'Accueil",
    didntReceive: "Vous n'avez pas reçu l'e-mail?",
    resendLink: "Renvoyer le Lien",
    linkResent: "Lien renvoyé avec succès!",
    errorSending: "Erreur lors de l'envoi du lien. Veuillez réessayer."
  },
  it: {
    title: "Password Dimenticata",
    subtitle: "Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la password",
    email: "Indirizzo Email",
    emailPlaceholder: "Inserisci la tua email",
    sendResetLink: "Invia Link di Reimpostazione",
    sending: "Invio...",
    backToSignIn: "Torna ad Accedi",
    emailSent: "Link di Reimpostazione Inviato!",
    emailSentMessage: "Controlla la tua email per le istruzioni per reimpostare la password. Il link scadrà tra 24 ore.",
    backToHome: "Torna alla Home",
    didntReceive: "Non hai ricevuto l'email?",
    resendLink: "Reinvia Link",
    linkResent: "Link reinviato con successo!",
    errorSending: "Errore nell'invio del link. Riprova."
  },
  de: {
    title: "Passwort Vergessen",
    subtitle: "Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts",
    email: "E-Mail-Adresse",
    emailPlaceholder: "Geben Sie Ihre E-Mail ein",
    sendResetLink: "Zurücksetzungslink Senden",
    sending: "Senden...",
    backToSignIn: "Zurück zur Anmeldung",
    emailSent: "Zurücksetzungslink Gesendet!",
    emailSentMessage: "Überprüfen Sie Ihre E-Mail für Anweisungen zum Zurücksetzen Ihres Passworts. Der Link läuft in 24 Stunden ab.",
    backToHome: "Zurück zur Startseite",
    didntReceive: "E-Mail nicht erhalten?",
    resendLink: "Link Erneut Senden",
    linkResent: "Link erfolgreich erneut gesendet!",
    errorSending: "Fehler beim Senden des Links. Bitte versuchen Sie es erneut."
  },
  nl: {
    title: "Wachtwoord Vergeten",
    subtitle: "Voer je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen",
    email: "E-mailadres",
    emailPlaceholder: "Voer je e-mail in",
    sendResetLink: "Herstellink Verzenden",
    sending: "Verzenden...",
    backToSignIn: "Terug naar Inloggen",
    emailSent: "Herstellink Verzonden!",
    emailSentMessage: "Controleer je e-mail voor instructies om je wachtwoord opnieuw in te stellen. De link vervalt over 24 uur.",
    backToHome: "Terug naar Home",
    didntReceive: "E-mail niet ontvangen?",
    resendLink: "Link Opnieuw Verzenden",
    linkResent: "Link succesvol opnieuw verzonden!",
    errorSending: "Fout bij het verzenden van de link. Probeer het opnieuw."
  },
  pt: {
    title: "Esqueci Minha Senha",
    subtitle: "Digite seu endereço de e-mail e enviaremos um link para redefinir sua senha",
    email: "Endereço de E-mail",
    emailPlaceholder: "Digite seu e-mail",
    sendResetLink: "Enviar Link de Redefinição",
    sending: "Enviando...",
    backToSignIn: "Voltar para Entrar",
    emailSent: "Link de Redefinição Enviado!",
    emailSentMessage: "Verifique seu e-mail para obter instruções para redefinir sua senha. O link expirará em 24 horas.",
    backToHome: "Voltar para Home",
    didntReceive: "Não recebeu o e-mail?",
    resendLink: "Reenviar Link",
    linkResent: "Link reenviado com sucesso!",
    errorSending: "Erro ao enviar link. Tente novamente."
  }
};

export default function ForgotPassword() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real implementation, you would call your password reset API
      // For now, we simulate the API call
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
      toast.success(t.emailSent);
      
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error(t.errorSending);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(t.linkResent);
    } catch (err) {
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t.emailSent}
          </h1>
          
          <p className="text-gray-600 mb-8">
            {t.emailSentMessage}
          </p>

          <div className="space-y-4">
            <Link to={createPageUrl("SignIn")}>
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg">
                {t.backToSignIn}
              </Button>
            </Link>

            <Link to={createPageUrl("Home")}>
              <Button variant="outline" className="w-full py-6 rounded-xl text-gray-700">
                {t.backToHome}
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              {t.didntReceive}
            </p>
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="text-pink-600 font-semibold hover:text-pink-700 disabled:opacity-50"
            >
              {t.resendLink}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        <Link
          to={createPageUrl("SignIn")}
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          {t.backToSignIn}
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
        </div>

        <p className="text-gray-600 mb-8">
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.email} *
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none text-gray-700 placeholder-gray-400"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {t.sending}
              </>
            ) : (
              t.sendResetLink
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}