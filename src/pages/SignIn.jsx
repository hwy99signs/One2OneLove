import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Mail, Lock, Eye, EyeOff, X, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthUiTranslation } from "@/lib/authUiTranslations";

const translations = {
  en: {
    signIn: { title: "Sign In", subtitle: "Sign in to access your love notes and games", email: "Email Address", password: "Password", emailPlaceholder: "Enter your email", passwordPlaceholder: "Enter your password", signInButton: "Sign In", forgotPassword: "Forgot Password?", invite: "Invite Friends", close: "Close sign in" }
  },
  es: {
    signIn: { title: "Iniciar Sesión", subtitle: "Inicia sesión para acceder a tus notas de amor y juegos", email: "Correo Electrónico", password: "Contraseña", emailPlaceholder: "Ingresa tu correo electrónico", passwordPlaceholder: "Ingresa tu contraseña", signInButton: "Iniciar Sesión", forgotPassword: "¿Olvidaste tu contraseña?", invite: "Invitar Amigos", close: "Cerrar inicio de sesión" }
  },
  fr: {
    signIn: { title: "Se Connecter", subtitle: "Connectez-vous pour accéder à vos notes d'amour et jeux", email: "Adresse E-mail", password: "Mot de Passe", emailPlaceholder: "Entrez votre e-mail", passwordPlaceholder: "Entrez votre mot de passe", signInButton: "Se Connecter", forgotPassword: "Mot de passe oublié?", invite: "Inviter des Amis", close: "Fermer la connexion" }
  },
  it: {
    signIn: { title: "Accedi", subtitle: "Accedi per accedere alle tue note d'amore e giochi", email: "Indirizzo Email", password: "Password", emailPlaceholder: "Inserisci la tua email", passwordPlaceholder: "Inserisci la tua password", signInButton: "Accedi", forgotPassword: "Password dimenticata?", invite: "Invita Amici", close: "Chiudi accesso" }
  },
  de: {
    signIn: { title: "Anmelden", subtitle: "Melden Sie sich an, um auf Ihre Liebesbotschaften und Spiele zuzugreifen", email: "E-Mail-Adresse", password: "Passwort", emailPlaceholder: "Geben Sie Ihre E-Mail ein", passwordPlaceholder: "Geben Sie Ihr Passwort ein", signInButton: "Anmelden", forgotPassword: "Passwort vergessen?", invite: "Freunde Einladen", close: "Anmeldung schließen" }
  },
  nl: {
    signIn: { title: "Inloggen", subtitle: "Log in om toegang te krijgen tot je liefdebriefjes en spelletjes", email: "E-mailadres", password: "Wachtwoord", emailPlaceholder: "Voer je e-mail in", passwordPlaceholder: "Voer je wachtwoord in", signInButton: "Inloggen", forgotPassword: "Wachtwoord vergeten?", invite: "Vrienden Uitnodigen", close: "Inloggen sluiten" }
  },
  pt: {
    signIn: { title: "Entrar", subtitle: "Entre para acessar suas notas de amor e jogos", email: "Endereço de E-mail", password: "Senha", emailPlaceholder: "Digite seu e-mail", passwordPlaceholder: "Digite sua senha", signInButton: "Entrar", forgotPassword: "Esqueceu a senha?", invite: "Convidar Amigos", close: "Fechar login" }
  }
};

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const { login } = useAuth();
  const t = translations[currentLanguage] || translations.en;
  const authT = getAuthUiTranslation(currentLanguage);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      toast.error(authT.signInRequired);
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(normalizedEmail, password);
      if (!result?.success) {
        toast.error(authT.invalidCredentials);
        return;
      }

      toast.success(authT.welcomeBack);
      navigate(createPageUrl("Profile"), { replace: true });
    } catch {
      toast.error(authT.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative">
        <Link to={createPageUrl("Home")} aria-label={t.signIn.close}>
          <span className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors rounded-md p-1 focus-within:ring-2 focus-within:ring-pink-500">
            <X aria-hidden="true" size={24} />
          </span>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart aria-hidden="true" className="w-6 h-6 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.signIn.title}</h1>
        </div>

        <p className="text-gray-600 mb-8 text-center">{t.signIn.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-2">
              {t.signIn.email} *
            </label>
            <div className="relative">
              <Mail aria-hidden="true" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.signIn.emailPlaceholder}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none text-gray-700 placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-2">
              {t.signIn.password} *
            </label>
            <div className="relative">
              <Lock aria-hidden="true" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="signin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.signIn.passwordPlaceholder}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none text-gray-700 placeholder-gray-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                aria-label={showPassword ? authT.hidePassword : authT.showPassword}
              >
                {showPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
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
                <Loader2 aria-hidden="true" className="w-5 h-5 mr-2 animate-spin" />
                {authT.signingIn}
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
              <UserCheck aria-hidden="true" className="w-5 h-5 mr-2" />
              {t.signIn.invite}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
