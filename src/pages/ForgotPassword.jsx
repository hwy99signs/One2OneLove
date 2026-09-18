import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Mail, ArrowLeft, CheckCircle, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { apiRequest, requestPasswordReset, resetPassword, readableApiError } from "@/lib/apiClient";

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
    emailSentMessage: "If an account exists for that email, check your inbox for password reset instructions.",
    backToHome: "Back to Home",
    didntReceive: "Didn't receive the email?",
    resendLink: "Resend Link",
    linkResent: "Reset link requested again.",
    errorSending: "Error sending reset link. Please try again.",
    resetTitle: "Reset Password",
    resetSubtitle: "Create a new password for your One2OneLove account.",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    passwordPlaceholder: "Enter your new password",
    confirmPasswordPlaceholder: "Enter it again",
    resetPassword: "Reset Password",
    resetting: "Resetting...",
    passwordRequirement: "Use 8 to 128 characters.",
    passwordsDontMatch: "The passwords do not match.",
    invalidPassword: "Your password must be between 8 and 128 characters.",
    invalidLinkTitle: "Reset Link Invalid",
    invalidLinkMessage: "This password reset link is invalid or has expired. Request a new reset link and try again.",
    requestNewLink: "Request New Reset Link",
    passwordReset: "Password Reset!",
    passwordResetMessage: "Your password has been updated. You can now sign in with your new password.",
    errorResetting: "We couldn't reset your password. The link may have expired. Please request a new reset link."
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
    emailSentMessage: "Si existe una cuenta con ese correo, revisa tu bandeja de entrada para obtener instrucciones de restablecimiento.",
    backToHome: "Volver al Inicio",
    didntReceive: "¿No recibiste el correo?",
    resendLink: "Reenviar Enlace",
    linkResent: "Enlace de restablecimiento solicitado nuevamente.",
    errorSending: "Error al enviar el enlace. Por favor, inténtalo de nuevo.",
    resetTitle: "Restablecer Contraseña",
    resetSubtitle: "Crea una nueva contraseña para tu cuenta de One2OneLove.",
    newPassword: "Nueva Contraseña",
    confirmPassword: "Confirmar Nueva Contraseña",
    passwordPlaceholder: "Ingresa tu nueva contraseña",
    confirmPasswordPlaceholder: "Ingresa la contraseña otra vez",
    resetPassword: "Restablecer Contraseña",
    resetting: "Restableciendo...",
    passwordRequirement: "Usa entre 8 y 128 caracteres.",
    passwordsDontMatch: "Las contraseñas no coinciden.",
    invalidPassword: "Tu contraseña debe tener entre 8 y 128 caracteres.",
    invalidLinkTitle: "Enlace No Válido",
    invalidLinkMessage: "Este enlace de restablecimiento no es válido o ha vencido. Solicita uno nuevo e inténtalo de nuevo.",
    requestNewLink: "Solicitar Nuevo Enlace",
    passwordReset: "¡Contraseña Restablecida!",
    passwordResetMessage: "Tu contraseña fue actualizada. Ya puedes iniciar sesión con tu nueva contraseña.",
    errorResetting: "No pudimos restablecer tu contraseña. Es posible que el enlace haya vencido. Solicita uno nuevo."
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
    emailSentMessage: "Si un compte existe pour cette adresse, consultez votre boîte de réception pour les instructions de réinitialisation.",
    backToHome: "Retour à l'Accueil",
    didntReceive: "Vous n'avez pas reçu l'e-mail?",
    resendLink: "Renvoyer le Lien",
    linkResent: "Lien de réinitialisation demandé à nouveau.",
    errorSending: "Erreur lors de l'envoi du lien. Veuillez réessayer.",
    resetTitle: "Réinitialiser le Mot de Passe",
    resetSubtitle: "Créez un nouveau mot de passe pour votre compte One2OneLove.",
    newPassword: "Nouveau Mot de Passe",
    confirmPassword: "Confirmer le Nouveau Mot de Passe",
    passwordPlaceholder: "Entrez votre nouveau mot de passe",
    confirmPasswordPlaceholder: "Entrez-le à nouveau",
    resetPassword: "Réinitialiser le Mot de Passe",
    resetting: "Réinitialisation...",
    passwordRequirement: "Utilisez entre 8 et 128 caractères.",
    passwordsDontMatch: "Les mots de passe ne correspondent pas.",
    invalidPassword: "Votre mot de passe doit comporter entre 8 et 128 caractères.",
    invalidLinkTitle: "Lien Invalide",
    invalidLinkMessage: "Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien puis réessayez.",
    requestNewLink: "Demander un Nouveau Lien",
    passwordReset: "Mot de Passe Réinitialisé!",
    passwordResetMessage: "Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
    errorResetting: "Impossible de réinitialiser votre mot de passe. Le lien a peut-être expiré. Demandez un nouveau lien."
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
    emailSentMessage: "Se esiste un account con questa email, controlla la posta in arrivo per le istruzioni di reimpostazione.",
    backToHome: "Torna alla Home",
    didntReceive: "Non hai ricevuto l'email?",
    resendLink: "Reinvia Link",
    linkResent: "Link di reimpostazione richiesto di nuovo.",
    errorSending: "Errore nell'invio del link. Riprova.",
    resetTitle: "Reimposta Password",
    resetSubtitle: "Crea una nuova password per il tuo account One2OneLove.",
    newPassword: "Nuova Password",
    confirmPassword: "Conferma Nuova Password",
    passwordPlaceholder: "Inserisci la nuova password",
    confirmPasswordPlaceholder: "Inseriscila di nuovo",
    resetPassword: "Reimposta Password",
    resetting: "Reimpostazione...",
    passwordRequirement: "Usa da 8 a 128 caratteri.",
    passwordsDontMatch: "Le password non corrispondono.",
    invalidPassword: "La password deve contenere da 8 a 128 caratteri.",
    invalidLinkTitle: "Link Non Valido",
    invalidLinkMessage: "Questo link di reimpostazione non è valido o è scaduto. Richiedi un nuovo link e riprova.",
    requestNewLink: "Richiedi Nuovo Link",
    passwordReset: "Password Reimpostata!",
    passwordResetMessage: "La password è stata aggiornata. Ora puoi accedere con la nuova password.",
    errorResetting: "Non è stato possibile reimpostare la password. Il link potrebbe essere scaduto. Richiedine uno nuovo."
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
    emailSentMessage: "Wenn für diese E-Mail-Adresse ein Konto existiert, prüfen Sie Ihren Posteingang auf Anweisungen zum Zurücksetzen.",
    backToHome: "Zurück zur Startseite",
    didntReceive: "E-Mail nicht erhalten?",
    resendLink: "Link Erneut Senden",
    linkResent: "Zurücksetzungslink erneut angefordert.",
    errorSending: "Fehler beim Senden des Links. Bitte versuchen Sie es erneut.",
    resetTitle: "Passwort Zurücksetzen",
    resetSubtitle: "Erstellen Sie ein neues Passwort für Ihr One2OneLove-Konto.",
    newPassword: "Neues Passwort",
    confirmPassword: "Neues Passwort Bestätigen",
    passwordPlaceholder: "Geben Sie Ihr neues Passwort ein",
    confirmPasswordPlaceholder: "Geben Sie es erneut ein",
    resetPassword: "Passwort Zurücksetzen",
    resetting: "Wird Zurückgesetzt...",
    passwordRequirement: "Verwenden Sie 8 bis 128 Zeichen.",
    passwordsDontMatch: "Die Passwörter stimmen nicht überein.",
    invalidPassword: "Ihr Passwort muss zwischen 8 und 128 Zeichen lang sein.",
    invalidLinkTitle: "Ungültiger Link",
    invalidLinkMessage: "Dieser Link ist ungültig oder abgelaufen. Fordern Sie einen neuen Link an und versuchen Sie es erneut.",
    requestNewLink: "Neuen Link Anfordern",
    passwordReset: "Passwort Zurückgesetzt!",
    passwordResetMessage: "Ihr Passwort wurde aktualisiert. Sie können sich jetzt mit dem neuen Passwort anmelden.",
    errorResetting: "Ihr Passwort konnte nicht zurückgesetzt werden. Der Link ist möglicherweise abgelaufen. Fordern Sie einen neuen Link an."
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
    emailSentMessage: "Als er een account voor dit e-mailadres bestaat, controleer dan je inbox voor instructies.",
    backToHome: "Terug naar Home",
    didntReceive: "E-mail niet ontvangen?",
    resendLink: "Link Opnieuw Verzenden",
    linkResent: "Herstellink opnieuw aangevraagd.",
    errorSending: "Fout bij het verzenden van de link. Probeer het opnieuw.",
    resetTitle: "Wachtwoord Opnieuw Instellen",
    resetSubtitle: "Maak een nieuw wachtwoord voor je One2OneLove-account.",
    newPassword: "Nieuw Wachtwoord",
    confirmPassword: "Bevestig Nieuw Wachtwoord",
    passwordPlaceholder: "Voer je nieuwe wachtwoord in",
    confirmPasswordPlaceholder: "Voer het opnieuw in",
    resetPassword: "Wachtwoord Opnieuw Instellen",
    resetting: "Opnieuw Instellen...",
    passwordRequirement: "Gebruik 8 tot 128 tekens.",
    passwordsDontMatch: "De wachtwoorden komen niet overeen.",
    invalidPassword: "Je wachtwoord moet tussen 8 en 128 tekens lang zijn.",
    invalidLinkTitle: "Ongeldige Link",
    invalidLinkMessage: "Deze link is ongeldig of verlopen. Vraag een nieuwe link aan en probeer het opnieuw.",
    requestNewLink: "Nieuwe Link Aanvragen",
    passwordReset: "Wachtwoord Opnieuw Ingesteld!",
    passwordResetMessage: "Je wachtwoord is bijgewerkt. Je kunt nu inloggen met je nieuwe wachtwoord.",
    errorResetting: "We konden je wachtwoord niet opnieuw instellen. De link is mogelijk verlopen. Vraag een nieuwe link aan."
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
    emailSentMessage: "Se existir uma conta para este email, verifique sua caixa de entrada para obter as instruções.",
    backToHome: "Voltar para Home",
    didntReceive: "Não recebeu o e-mail?",
    resendLink: "Reenviar Link",
    linkResent: "Link de redefinição solicitado novamente.",
    errorSending: "Erro ao enviar link. Tente novamente.",
    resetTitle: "Redefinir Senha",
    resetSubtitle: "Crie uma nova senha para sua conta One2OneLove.",
    newPassword: "Nova Senha",
    confirmPassword: "Confirmar Nova Senha",
    passwordPlaceholder: "Digite sua nova senha",
    confirmPasswordPlaceholder: "Digite novamente",
    resetPassword: "Redefinir Senha",
    resetting: "Redefinindo...",
    passwordRequirement: "Use de 8 a 128 caracteres.",
    passwordsDontMatch: "As senhas não coincidem.",
    invalidPassword: "Sua senha deve ter entre 8 e 128 caracteres.",
    invalidLinkTitle: "Link Inválido",
    invalidLinkMessage: "Este link é inválido ou expirou. Solicite um novo link e tente novamente.",
    requestNewLink: "Solicitar Novo Link",
    passwordReset: "Senha Redefinida!",
    passwordResetMessage: "Sua senha foi atualizada. Agora você pode entrar com a nova senha.",
    errorResetting: "Não foi possível redefinir sua senha. O link pode ter expirado. Solicite um novo link."
  }
};

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        {children}
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const resetLinkError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordResetComplete, setPasswordResetComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestReset = async () => {
    const readiness = await apiRequest('/api/launch-readiness');
    if (readiness?.readiness?.identity?.emailDeliveryReady !== true) {
      throw new Error(t.errorSending);
    }
    const redirectTo = `${window.location.origin}${createPageUrl("ForgotPassword")}`;
    await requestPasswordReset(email.trim(), redirectTo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await requestReset();
      setEmailSent(true);
      toast.success(t.emailSent);
    } catch (err) {
      console.error("Password reset request error:", err);
      toast.error(readableApiError(err, t.errorSending));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);

    try {
      await requestReset();
      toast.success(t.linkResent);
    } catch (err) {
      console.error("Password reset resend error:", err);
      toast.error(readableApiError(err, t.errorSending));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error(t.invalidLinkMessage);
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      toast.error(t.invalidPassword);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t.passwordsDontMatch);
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(newPassword, token);
      setPasswordResetComplete(true);
      toast.success(t.passwordReset);
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error(readableApiError(err, t.errorResetting));
    } finally {
      setIsLoading(false);
    }
  };

  if (passwordResetComplete) {
    return (
      <PageShell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t.passwordReset}</h1>
          <p className="text-gray-600 mb-8">{t.passwordResetMessage}</p>
          <Link to={createPageUrl("SignIn")}>
            <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg">
              {t.backToSignIn}
            </Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  if (resetLinkError || (!token && searchParams.has("error"))) {
    return (
      <PageShell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full mb-6">
            <Lock className="w-10 h-10 text-pink-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t.invalidLinkTitle}</h1>
          <p className="text-gray-600 mb-8">{t.invalidLinkMessage}</p>
          <div className="space-y-4">
            <Link to={createPageUrl("ForgotPassword")}>
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg">
                {t.requestNewLink}
              </Button>
            </Link>
            <Link to={createPageUrl("SignIn")}>
              <Button variant="outline" className="w-full py-6 rounded-xl text-gray-700">
                {t.backToSignIn}
              </Button>
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  if (token) {
    return (
      <PageShell>
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
          <h1 className="text-3xl font-bold text-gray-900">{t.resetTitle}</h1>
        </div>

        <p className="text-gray-600 mb-8">{t.resetSubtitle}</p>

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.newPassword} *</label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none text-gray-700 placeholder-gray-400"
                required
                disabled={isLoading}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">{t.passwordRequirement}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.confirmPassword} *</label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPasswordPlaceholder}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
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
                {t.resetting}
              </>
            ) : (
              t.resetPassword
            )}
          </Button>
        </form>
      </PageShell>
    );
  }

  if (emailSent) {
    return (
      <PageShell>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{t.emailSent}</h1>
          <p className="text-gray-600 mb-8">{t.emailSentMessage}</p>

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
            <p className="text-sm text-gray-600 mb-3">{t.didntReceive}</p>
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="text-pink-600 font-semibold hover:text-pink-700 disabled:opacity-50"
            >
              {isLoading ? t.sending : t.resendLink}
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
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

      <p className="text-gray-600 mb-8">{t.subtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.email} *</label>
          <div className="relative">
            <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              autoComplete="email"
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
    </PageShell>
  );
}
