import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Mail, Lock, Eye, EyeOff, X, UserCheck, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import { verifiedEmailLogin } from "@/lib/verifiedLoginService";
import { sendEmailVerificationOtp, verifyEmailOtp, readableApiError } from "@/lib/apiClient";

const translations = {
  en: {
    signIn: {
      title: "Sign In", subtitle: "Sign in to access your love notes and games", email: "Email Address", password: "Password", emailPlaceholder: "Enter your email", passwordPlaceholder: "Enter your password", signInButton: "Sign In", forgotPassword: "Forgot Password?", invite: "Invite Friends",
      verifyTitle: "Verify Your Email", verifySubtitle: "We sent a 6-digit verification code to", codeLabel: "Verification Code", codePlaceholder: "Enter 6-digit code", verifyButton: "Verify Email", verifying: "Verifying...", resendCode: "Resend Code", resendSent: "A new verification code was sent.", codeHelp: "The code expires in about 5 minutes.", invalidCode: "Enter the 6-digit code from your email.", backToSignIn: "Back to Sign In"
    }
  },
  es: {
    signIn: {
      title: "Iniciar Sesión", subtitle: "Inicia sesión para acceder a tus notas de amor y juegos", email: "Correo Electrónico", password: "Contraseña", emailPlaceholder: "Ingresa tu correo electrónico", passwordPlaceholder: "Ingresa tu contraseña", signInButton: "Iniciar Sesión", forgotPassword: "¿Olvidaste tu contraseña?", invite: "Invitar Amigos",
      verifyTitle: "Verifica Tu Correo", verifySubtitle: "Enviamos un código de verificación de 6 dígitos a", codeLabel: "Código de Verificación", codePlaceholder: "Ingresa el código de 6 dígitos", verifyButton: "Verificar Correo", verifying: "Verificando...", resendCode: "Reenviar Código", resendSent: "Se envió un nuevo código de verificación.", codeHelp: "El código vence en aproximadamente 5 minutos.", invalidCode: "Ingresa el código de 6 dígitos de tu correo.", backToSignIn: "Volver a Iniciar Sesión"
    }
  },
  fr: {
    signIn: {
      title: "Se Connecter", subtitle: "Connectez-vous pour accéder à vos notes d'amour et jeux", email: "Adresse E-mail", password: "Mot de Passe", emailPlaceholder: "Entrez votre e-mail", passwordPlaceholder: "Entrez votre mot de passe", signInButton: "Se Connecter", forgotPassword: "Mot de passe oublié?", invite: "Inviter des Amis",
      verifyTitle: "Vérifiez Votre E-mail", verifySubtitle: "Nous avons envoyé un code de vérification à 6 chiffres à", codeLabel: "Code de Vérification", codePlaceholder: "Entrez le code à 6 chiffres", verifyButton: "Vérifier l'E-mail", verifying: "Vérification...", resendCode: "Renvoyer le Code", resendSent: "Un nouveau code de vérification a été envoyé.", codeHelp: "Le code expire dans environ 5 minutes.", invalidCode: "Entrez le code à 6 chiffres reçu par e-mail.", backToSignIn: "Retour à la Connexion"
    }
  },
  it: {
    signIn: {
      title: "Accedi", subtitle: "Accedi per accedere alle tue note d'amore e giochi", email: "Indirizzo Email", password: "Password", emailPlaceholder: "Inserisci la tua email", passwordPlaceholder: "Inserisci la tua password", signInButton: "Accedi", forgotPassword: "Password dimenticata?", invite: "Invita Amici",
      verifyTitle: "Verifica la Tua Email", verifySubtitle: "Abbiamo inviato un codice di verifica a 6 cifre a", codeLabel: "Codice di Verifica", codePlaceholder: "Inserisci il codice a 6 cifre", verifyButton: "Verifica Email", verifying: "Verifica...", resendCode: "Reinvia Codice", resendSent: "È stato inviato un nuovo codice di verifica.", codeHelp: "Il codice scade tra circa 5 minuti.", invalidCode: "Inserisci il codice a 6 cifre ricevuto via email.", backToSignIn: "Torna ad Accedi"
    }
  },
  de: {
    signIn: {
      title: "Anmelden", subtitle: "Melden Sie sich an, um auf Ihre Liebesbotschaften und Spiele zuzugreifen", email: "E-Mail-Adresse", password: "Passwort", emailPlaceholder: "Geben Sie Ihre E-Mail ein", passwordPlaceholder: "Geben Sie Ihr Passwort ein", signInButton: "Anmelden", forgotPassword: "Passwort vergessen?", invite: "Freunde Einladen",
      verifyTitle: "E-Mail Bestätigen", verifySubtitle: "Wir haben einen 6-stelligen Bestätigungscode gesendet an", codeLabel: "Bestätigungscode", codePlaceholder: "6-stelligen Code eingeben", verifyButton: "E-Mail Bestätigen", verifying: "Wird Bestätigt...", resendCode: "Code Erneut Senden", resendSent: "Ein neuer Bestätigungscode wurde gesendet.", codeHelp: "Der Code läuft nach etwa 5 Minuten ab.", invalidCode: "Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.", backToSignIn: "Zurück zur Anmeldung"
    }
  },
  nl: {
    signIn: {
      title: "Inloggen", subtitle: "Log in om toegang te krijgen tot je liefdebriefjes en spelletjes", email: "E-mailadres", password: "Wachtwoord", emailPlaceholder: "Voer je e-mail in", passwordPlaceholder: "Voer je wachtwoord in", signInButton: "Inloggen", forgotPassword: "Wachtwoord vergeten?", invite: "Vrienden Uitnodigen",
      verifyTitle: "Verifieer Je E-mail", verifySubtitle: "We hebben een 6-cijferige verificatiecode gestuurd naar", codeLabel: "Verificatiecode", codePlaceholder: "Voer de 6-cijferige code in", verifyButton: "E-mail Verifiëren", verifying: "Verifiëren...", resendCode: "Code Opnieuw Verzenden", resendSent: "Er is een nieuwe verificatiecode verzonden.", codeHelp: "De code verloopt na ongeveer 5 minuten.", invalidCode: "Voer de 6-cijferige code uit je e-mail in.", backToSignIn: "Terug naar Inloggen"
    }
  },
  pt: {
    signIn: {
      title: "Entrar", subtitle: "Entre para acessar suas notas de amor e jogos", email: "Endereço de E-mail", password: "Senha", emailPlaceholder: "Digite seu e-mail", passwordPlaceholder: "Digite sua senha", signInButton: "Entrar", forgotPassword: "Esqueceu a senha?", invite: "Convidar Amigos",
      verifyTitle: "Verifique Seu E-mail", verifySubtitle: "Enviamos um código de verificação de 6 dígitos para", codeLabel: "Código de Verificação", codePlaceholder: "Digite o código de 6 dígitos", verifyButton: "Verificar E-mail", verifying: "Verificando...", resendCode: "Reenviar Código", resendSent: "Um novo código de verificação foi enviado.", codeHelp: "O código expira em cerca de 5 minutos.", invalidCode: "Digite o código de 6 dígitos recebido por e-mail.", backToSignIn: "Voltar para Entrar"
    }
  }
};

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const finishLogin = async () => {
    const result = await verifiedEmailLogin(email, password);
    if (result?.success) {
      toast.success("Successfully signed in!");
      setTimeout(() => {
        const needsBillingSetup = !result?.user?.stripe_subscription_id || !['active', 'trial'].includes(result?.user?.subscription_status);
        window.location.replace(createPageUrl(needsBillingSetup ? "Subscription" : "Profile"));
      }, 100);
      return true;
    }
    if (result?.emailVerificationRequired) {
      setVerificationMode(true);
      toast.error(result?.error || "Email verification required.");
      return false;
    }
    toast.error(result?.error || "Invalid email or password. Please try again.");
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const loginPromise = finishLogin();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Login timeout after 15 seconds")), 15000)
      );
      await Promise.race([loginPromise, timeoutPromise]);
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error(error?.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      toast.error(t.signIn.invalidCode);
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailOtp(email.trim(), code);
      toast.success("Email verified successfully.");
      setVerificationMode(false);
      setVerificationCode("");
      await finishLogin();
    } catch (error) {
      console.error("Email verification error:", error);
      toast.error(readableApiError(error, t.signIn.invalidCode));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await sendEmailVerificationOtp(email.trim());
      toast.success(t.signIn.resendSent);
    } catch (error) {
      console.error("Verification resend error:", error);
      toast.error(readableApiError(error, "Could not resend the verification code."));
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative">
          <button
            type="button"
            onClick={() => { setVerificationMode(false); setVerificationCode(""); }}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.signIn.backToSignIn}
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t.signIn.verifyTitle}</h1>
          </div>

          <p className="text-gray-600 mb-2">{t.signIn.verifySubtitle}</p>
          <p className="font-semibold text-gray-900 mb-8 break-all">{email}</p>

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.signIn.codeLabel}</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t.signIn.codePlaceholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none text-gray-900 text-center tracking-[0.35em] text-xl font-semibold"
                maxLength={6}
                required
                disabled={isLoading}
              />
              <p className="mt-2 text-xs text-gray-500">{t.signIn.codeHelp}</p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.signIn.verifying}
                </>
              ) : (
                t.signIn.verifyButton
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="text-pink-600 hover:text-pink-700 font-semibold disabled:opacity-50"
            >
              {t.signIn.resendCode}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative">
        <Link to={createPageUrl("Home")}>
          <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.signIn.title}</h1>
        </div>

        <p className="text-gray-600 mb-8 text-center">{t.signIn.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.signIn.email} *</label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.signIn.emailPlaceholder}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none text-gray-700 placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.signIn.password}</label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.signIn.passwordPlaceholder}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none text-gray-700 placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link to={createPageUrl("ForgotPassword")} className="text-sm text-pink-600 hover:text-pink-700 font-medium">
              {t.signIn.forgotPassword}
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              t.signIn.signInButton
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link to={createPageUrl("Invite")}>
            <Button
              variant="outline"
              className="w-full border-2 border-pink-300 text-pink-600 hover:bg-pink-50 font-semibold py-3 rounded-xl"
            >
              <UserCheck className="w-5 h-5 mr-2" />
              {t.signIn.invite}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
