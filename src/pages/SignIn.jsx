import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Mail, Lock, Eye, EyeOff, X, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const translations = {
  en: {
    signIn: { title: "Sign In", subtitle: "Sign in to access your love notes and games", email: "Email Address", password: "Password", emailPlaceholder: "Enter your email", passwordPlaceholder: "Enter your password", signInButton: "Sign In", forgotPassword: "Forgot Password?", invite: "Invite Friends" }
  },
  es: {
    signIn: { title: "Iniciar Sesión", subtitle: "Inicia sesión para acceder a tus notas de amor y juegos", email: "Correo Electrónico", password: "Contraseña", emailPlaceholder: "Ingresa tu correo electrónico", passwordPlaceholder: "Ingresa tu contraseña", signInButton: "Iniciar Sesión", forgotPassword: "¿Olvidaste tu contraseña?", invite: "Invitar Amigos" }
  },
  fr: {
    signIn: { title: "Se Connecter", subtitle: "Connectez-vous pour accéder à vos notes d'amour et jeux", email: "Adresse E-mail", password: "Mot de Passe", emailPlaceholder: "Entrez votre e-mail", passwordPlaceholder: "Entrez votre mot de passe", signInButton: "Se Connecter", forgotPassword: "Mot de passe oublié?", invite: "Inviter des Amis" }
  },
  it: {
    signIn: { title: "Accedi", subtitle: "Accedi per accedere alle tue note d'amore e giochi", email: "Indirizzo Email", password: "Password", emailPlaceholder: "Inserisci la tua email", passwordPlaceholder: "Inserisci la tua password", signInButton: "Accedi", forgotPassword: "Password dimenticata?", invite: "Invita Amici" }
  },
  de: {
    signIn: { title: "Anmelden", subtitle: "Melden Sie sich an, um auf Ihre Liebesbotschaften und Spiele zuzugreifen", email: "E-Mail-Adresse", password: "Passwort", emailPlaceholder: "Geben Sie Ihre E-Mail ein", passwordPlaceholder: "Geben Sie Ihr Passwort ein", signInButton: "Anmelden", forgotPassword: "Passwort vergessen?", invite: "Freunde Einladen" }
  },
  nl: {
    signIn: { title: "Inloggen", subtitle: "Log in om toegang te krijgen tot je liefdebriefjes en spelletjes", email: "E-mailadres", password: "Wachtwoord", emailPlaceholder: "Voer je e-mail in", passwordPlaceholder: "Voer je wachtwoord in", signInButton: "Inloggen", forgotPassword: "Wachtwoord vergeten?", invite: "Vrienden Uitnodigen" }
  },
  pt: {
    signIn: { title: "Entrar", subtitle: "Entre para acessar suas notas de amor e jogos", email: "Endereço de E-mail", password: "Senha", emailPlaceholder: "Digite seu e-mail", passwordPlaceholder: "Digite sua senha", signInButton: "Entrar", forgotPassword: "Esqueceu a senha?", invite: "Convidar Amigos" }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    console.log('🔵 Sign in form submitted for:', email);

    try {
      // Clear any stale localStorage data that might interfere
      // This ensures a clean login state
      try {
        const storageKey = 'sb-one2one-love-auth-token';
        const existingData = localStorage.getItem(storageKey);
        if (existingData) {
          console.log('🧹 Clearing stale auth data from localStorage...');
          // Don't clear completely, but let Supabase handle it
          // The login function will handle session clearing
        }
      } catch (storageError) {
        console.warn('⚠️ Could not check localStorage:', storageError);
      }

      const result = await login(email, password);
      console.log('🔵 Login result:', result);
      
      if (result && result.success) {
        console.log('✅ Login successful, redirecting...');
        toast.success("Successfully signed in!");
        setIsLoading(false);
        
        // Force navigation immediately using window.location for reliability
        const profileUrl = createPageUrl("Profile");
        console.log('🔵 Redirecting to:', profileUrl);
        
        // Use window.location.replace for immediate redirect
        window.location.replace(profileUrl);
      } else {
        const errorMessage = result?.error || "Invalid email or password. Please try again.";
        console.error('❌ Login failed:', errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

        <p className="text-gray-600 mb-8 text-center">
          {t.signIn.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.signIn.email} *
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.signIn.password}
            </label>
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