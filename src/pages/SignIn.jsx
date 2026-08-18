import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Mail, Lock, Eye, EyeOff, X, UserCheck, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const RETURN_KEY = 'o2ol-return-after-auth';

const translations = {
  en: {
    signIn: { title: "Sign In", subtitle: "Join live conversations, send Love Notes, and access your relationship tools", email: "Email Address", password: "Password", emailPlaceholder: "Enter your email", passwordPlaceholder: "Enter your password", signInButton: "Sign In", forgotPassword: "Forgot Password?", invite: "Invite Friends", newHere: "New to One2OneLove?", createAccount: "Create a free account", confirmNeeded: "Your email still needs confirmation before you can sign in.", resendConfirmation: "Resend confirmation email", resending: "Sending confirmation…", resendSent: "If this account is awaiting confirmation, another confirmation email has been requested." }
  },
  es: {
    signIn: { title: "Iniciar Sesión", subtitle: "Únete a conversaciones en vivo, envía notas de amor y accede a tus herramientas de relación", email: "Correo Electrónico", password: "Contraseña", emailPlaceholder: "Ingresa tu correo electrónico", passwordPlaceholder: "Ingresa tu contraseña", signInButton: "Iniciar Sesión", forgotPassword: "¿Olvidaste tu contraseña?", invite: "Invitar Amigos", newHere: "¿Nuevo en One2OneLove?", createAccount: "Crea una cuenta gratis", confirmNeeded: "Tu correo todavía necesita confirmación antes de iniciar sesión.", resendConfirmation: "Reenviar correo de confirmación", resending: "Enviando confirmación…", resendSent: "Si esta cuenta espera confirmación, se solicitó otro correo de confirmación." }
  },
  fr: {
    signIn: { title: "Se Connecter", subtitle: "Rejoignez des conversations en direct, envoyez des mots d’amour et accédez à vos outils relationnels", email: "Adresse E-mail", password: "Mot de Passe", emailPlaceholder: "Entrez votre e-mail", passwordPlaceholder: "Entrez votre mot de passe", signInButton: "Se Connecter", forgotPassword: "Mot de passe oublié?", invite: "Inviter des Amis", newHere: "Nouveau sur One2OneLove ?", createAccount: "Créer un compte gratuit", confirmNeeded: "Votre e-mail doit encore être confirmé avant la connexion.", resendConfirmation: "Renvoyer l’e-mail de confirmation", resending: "Envoi de la confirmation…", resendSent: "Si ce compte attend une confirmation, un nouvel e-mail a été demandé." }
  },
  it: {
    signIn: { title: "Accedi", subtitle: "Partecipa alle conversazioni dal vivo, invia note d’amore e usa i tuoi strumenti di relazione", email: "Indirizzo Email", password: "Password", emailPlaceholder: "Inserisci la tua email", passwordPlaceholder: "Inserisci la password", signInButton: "Accedi", forgotPassword: "Password dimenticata?", invite: "Invita Amici", newHere: "Nuovo su One2OneLove?", createAccount: "Crea un account gratuito", confirmNeeded: "La tua email deve ancora essere confermata prima di accedere.", resendConfirmation: "Reinvia email di conferma", resending: "Invio conferma…", resendSent: "Se questo account è in attesa di conferma, è stata richiesta un’altra email." }
  },
  de: {
    signIn: { title: "Anmelden", subtitle: "Nimm an Live-Gesprächen teil, sende Liebesbotschaften und nutze deine Beziehungstools", email: "E-Mail-Adresse", password: "Passwort", emailPlaceholder: "Geben Sie Ihre E-Mail ein", passwordPlaceholder: "Geben Sie Ihr Passwort ein", signInButton: "Anmelden", forgotPassword: "Passwort vergessen?", invite: "Freunde Einladen", newHere: "Neu bei One2OneLove?", createAccount: "Kostenloses Konto erstellen", confirmNeeded: "Deine E-Mail muss vor der Anmeldung noch bestätigt werden.", resendConfirmation: "Bestätigungs-E-Mail erneut senden", resending: "Bestätigung wird gesendet…", resendSent: "Wenn dieses Konto auf Bestätigung wartet, wurde eine weitere E-Mail angefordert." }
  },
  nl: {
    signIn: { title: "Inloggen", subtitle: "Doe mee aan live gesprekken, stuur liefdesbriefjes en gebruik je relatietools", email: "E-mailadres", password: "Wachtwoord", emailPlaceholder: "Voer je e-mail in", passwordPlaceholder: "Voer je wachtwoord in", signInButton: "Inloggen", forgotPassword: "Wachtwoord vergeten?", invite: "Vrienden Uitnodigen", newHere: "Nieuw bij One2OneLove?", createAccount: "Maak een gratis account", confirmNeeded: "Je e-mail moet nog worden bevestigd voordat je kunt inloggen.", resendConfirmation: "Bevestigingsmail opnieuw sturen", resending: "Bevestiging versturen…", resendSent: "Als dit account op bevestiging wacht, is een nieuwe bevestigingsmail aangevraagd." }
  },
  pt: {
    signIn: { title: "Entrar", subtitle: "Participe de conversas ao vivo, envie notas de amor e acesse suas ferramentas de relacionamento", email: "Endereço de E-mail", password: "Senha", emailPlaceholder: "Digite seu e-mail", passwordPlaceholder: "Digite sua senha", signInButton: "Entrar", forgotPassword: "Esqueceu a senha?", invite: "Convidar Amigos", newHere: "Novo no One2OneLove?", createAccount: "Crie uma conta grátis", confirmNeeded: "Seu e-mail ainda precisa ser confirmado antes de entrar.", resendConfirmation: "Reenviar e-mail de confirmação", resending: "Enviando confirmação…", resendSent: "Se esta conta estiver aguardando confirmação, outro e-mail foi solicitado." }
  }
};

const safeReturnTo = (value) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
};

const needsEmailConfirmation = (message) => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('confirm your email') || normalized.includes('email not confirmed') || normalized.includes('email_not_confirmed');
};

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationNeeded, setConfirmationNeeded] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { currentLanguage } = useLanguage();
  const { login, logout } = useAuth();
  const t = translations[currentLanguage] || translations.en;
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const signupUrl = returnTo
    ? `${createPageUrl("SignUp")}?returnTo=${encodeURIComponent(returnTo)}`
    : createPageUrl("SignUp");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConfirmationNeeded(false);

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsLoading(true);

    try {
      const loginPromise = login(email, password);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timeout after 15 seconds')), 15000)
      );

      const result = await Promise.race([loginPromise, timeoutPromise]);

      if (result && result.success) {
        const { data: authCheck, error: authCheckError } = await supabase.auth.getUser();
        const authenticatedUser = authCheck?.user;

        if (authCheckError || !authenticatedUser) {
          await logout();
          toast.error("We could not verify your account session. Please sign in again.");
          setIsLoading(false);
          return;
        }

        if (!authenticatedUser.email_confirmed_at && !authenticatedUser.confirmed_at) {
          await logout();
          setConfirmationNeeded(true);
          toast.error(t.signIn.confirmNeeded);
          setIsLoading(false);
          return;
        }

        toast.success("Successfully signed in!");
        setIsLoading(false);

        setTimeout(() => {
          window.location.replace(returnTo || createPageUrl("Profile"));
        }, 100);
      } else {
        const errorMessage = result?.error || "Invalid email or password. Please try again.";
        if (needsEmailConfirmation(errorMessage)) setConfirmationNeeded(true);
        toast.error(errorMessage);
        setIsLoading(false);
      }
    } catch (error) {
      const errorMessage = error.message || "An error occurred. Please try again.";
      if (needsEmailConfirmation(errorMessage)) setConfirmationNeeded(true);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const resendConfirmation = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || resendLoading) return;

    setResendLoading(true);
    try {
      if (returnTo && typeof window !== 'undefined') {
        window.localStorage.setItem(RETURN_KEY, returnTo);
      }
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success(t.signIn.resendSent);
    } catch (error) {
      console.error('Unable to resend confirmation email:', error);
      toast.error('We could not request another confirmation email right now. Please try again shortly.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 relative">
        <Link to={createPageUrl("Home")}>
          <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close sign in">
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
                onChange={(e) => { setEmail(e.target.value); setConfirmationNeeded(false); }}
                placeholder={t.signIn.emailPlaceholder}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none text-gray-700 placeholder-gray-400"
                autoComplete="email"
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
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
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

        {confirmationNeeded && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold leading-6 text-amber-900">{t.signIn.confirmNeeded}</p>
            <Button
              type="button"
              variant="outline"
              disabled={resendLoading || !email.trim()}
              onClick={() => void resendConfirmation()}
              className="mt-3 w-full border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            >
              {resendLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {resendLoading ? t.signIn.resending : t.signIn.resendConfirmation}
            </Button>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-pink-50 p-4 text-center">
          <span className="text-sm text-gray-600">{t.signIn.newHere} </span>
          <Link to={signupUrl} className="text-sm font-bold text-pink-600 hover:text-pink-700">
            {t.signIn.createAccount}
          </Link>
        </div>

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
