import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Eye, EyeOff, Heart, Loader2, Lock, Mail, ShieldCheck, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';
import { toast } from 'sonner';
import { verifiedEmailLogin } from '@/lib/verifiedLoginService';
import { readableApiError, sendEmailVerificationOtp, verifyEmailOtp } from '@/lib/apiClient';

const translations = {
  en: { signIn: { title:'Sign In', subtitle:'Sign in to access your One2OneLove relationship tools.', email:'Email Address', password:'Password', emailPlaceholder:'Enter your email', passwordPlaceholder:'Enter your password', signInButton:'Sign In', signingIn:'Signing in…', forgotPassword:'Forgot Password?', invite:'Invite Friends', verifyTitle:'Verify Your Email', verifySubtitle:'We sent a 6-digit verification code to', codeLabel:'Verification Code', codePlaceholder:'Enter 6-digit code', verifyButton:'Verify Email', verifying:'Verifying…', resendCode:'Resend Code', resendSent:'A new verification code was sent.', codeHelp:'The code expires in about 5 minutes.', invalidCode:'Enter the 6-digit code from your email.', backToSignIn:'Back to Sign In', required:'Please enter both email and password.', success:'Successfully signed in!', rateLimited:'Your sign-in was accepted, but too many requests were sent too quickly. Wait a few seconds and try once more if you are not redirected.' } },
  es: { signIn: { title:'Iniciar Sesión', subtitle:'Inicia sesión para acceder a tus herramientas de relación de One2OneLove.', email:'Correo Electrónico', password:'Contraseña', emailPlaceholder:'Ingresa tu correo electrónico', passwordPlaceholder:'Ingresa tu contraseña', signInButton:'Iniciar Sesión', signingIn:'Iniciando sesión…', forgotPassword:'¿Olvidaste tu contraseña?', invite:'Invitar Amigos', verifyTitle:'Verifica Tu Correo', verifySubtitle:'Enviamos un código de verificación de 6 dígitos a', codeLabel:'Código de Verificación', codePlaceholder:'Ingresa el código de 6 dígitos', verifyButton:'Verificar Correo', verifying:'Verificando…', resendCode:'Reenviar Código', resendSent:'Se envió un nuevo código de verificación.', codeHelp:'El código vence en aproximadamente 5 minutos.', invalidCode:'Ingresa el código de 6 dígitos de tu correo.', backToSignIn:'Volver a Iniciar Sesión', required:'Ingresa el correo y la contraseña.', success:'¡Sesión iniciada!', rateLimited:'Tu inicio de sesión fue aceptado, pero se enviaron demasiadas solicitudes muy rápido. Espera unos segundos e inténtalo una sola vez si no eres redirigido.' } },
  fr: { signIn: { title:'Se Connecter', subtitle:'Connectez-vous pour accéder à vos outils relationnels One2OneLove.', email:'Adresse E-mail', password:'Mot de Passe', emailPlaceholder:'Entrez votre e-mail', passwordPlaceholder:'Entrez votre mot de passe', signInButton:'Se Connecter', signingIn:'Connexion…', forgotPassword:'Mot de passe oublié ?', invite:'Inviter des Amis', verifyTitle:'Vérifiez Votre E-mail', verifySubtitle:'Nous avons envoyé un code de vérification à 6 chiffres à', codeLabel:'Code de Vérification', codePlaceholder:'Entrez le code à 6 chiffres', verifyButton:'Vérifier l’E-mail', verifying:'Vérification…', resendCode:'Renvoyer le Code', resendSent:'Un nouveau code de vérification a été envoyé.', codeHelp:'Le code expire dans environ 5 minutes.', invalidCode:'Entrez le code à 6 chiffres reçu par e-mail.', backToSignIn:'Retour à la Connexion', required:'Entrez votre e-mail et votre mot de passe.', success:'Connexion réussie !', rateLimited:'Votre connexion a été acceptée, mais trop de requêtes ont été envoyées trop rapidement. Attendez quelques secondes et réessayez une seule fois si vous n’êtes pas redirigé.' } },
  it: { signIn: { title:'Accedi', subtitle:'Accedi per usare gli strumenti di relazione One2OneLove.', email:'Indirizzo E-mail', password:'Password', emailPlaceholder:'Inserisci la tua e-mail', passwordPlaceholder:'Inserisci la password', signInButton:'Accedi', signingIn:'Accesso…', forgotPassword:'Password dimenticata?', invite:'Invita Amici', verifyTitle:'Verifica la Tua E-mail', verifySubtitle:'Abbiamo inviato un codice di verifica a 6 cifre a', codeLabel:'Codice di Verifica', codePlaceholder:'Inserisci il codice a 6 cifre', verifyButton:'Verifica E-mail', verifying:'Verifica…', resendCode:'Reinvia Codice', resendSent:'È stato inviato un nuovo codice di verifica.', codeHelp:'Il codice scade tra circa 5 minuti.', invalidCode:'Inserisci il codice a 6 cifre ricevuto via e-mail.', backToSignIn:'Torna ad Accedi', required:'Inserisci e-mail e password.', success:'Accesso eseguito!', rateLimited:'Il tuo accesso è stato accettato, ma sono state inviate troppe richieste troppo rapidamente. Attendi qualche secondo e riprova una sola volta se non vieni reindirizzato.' } },
  de: { signIn: { title:'Anmelden', subtitle:'Melden Sie sich an, um Ihre One2OneLove-Beziehungstools zu nutzen.', email:'E-Mail-Adresse', password:'Passwort', emailPlaceholder:'E-Mail eingeben', passwordPlaceholder:'Passwort eingeben', signInButton:'Anmelden', signingIn:'Anmeldung…', forgotPassword:'Passwort vergessen?', invite:'Freunde Einladen', verifyTitle:'E-Mail Bestätigen', verifySubtitle:'Wir haben einen 6-stelligen Bestätigungscode gesendet an', codeLabel:'Bestätigungscode', codePlaceholder:'6-stelligen Code eingeben', verifyButton:'E-Mail Bestätigen', verifying:'Wird Bestätigt…', resendCode:'Code Erneut Senden', resendSent:'Ein neuer Bestätigungscode wurde gesendet.', codeHelp:'Der Code läuft nach etwa 5 Minuten ab.', invalidCode:'Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.', backToSignIn:'Zurück zur Anmeldung', required:'Geben Sie E-Mail und Passwort ein.', success:'Erfolgreich angemeldet!', rateLimited:'Ihre Anmeldung wurde akzeptiert, aber es wurden zu viele Anfragen in kurzer Zeit gesendet. Warten Sie einige Sekunden und versuchen Sie es nur einmal erneut, falls keine Weiterleitung erfolgt.' } },
};

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const finishLogin = async () => {
    const result = await verifiedEmailLogin(email, password);
    if (result?.success) {
      toast.success(t.signIn.success);
      const role = String(result?.user?.role || '').toLowerCase();
      const status = String(result?.user?.subscription_status || '').toLowerCase();
      const target = role === 'admin'
        ? '/Admin'
        : ['active','trial','trialing'].includes(status)
          ? createPageUrl('Profile')
          : createPageUrl('Subscription');
      window.setTimeout(() => window.location.replace(target), 100);
      return true;
    }

    if (result?.emailVerificationRequired) {
      setVerificationMode(true);
      toast.error(result?.error || 'Email verification required.');
      return false;
    }

    if (result?.status === 429) {
      toast.error(t.signIn.rateLimited);
      return false;
    }

    toast.error(result?.error || 'Invalid email or password. Please try again.');
    return false;
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!email || !password) return toast.error(t.signIn.required);

    setIsLoading(true);
    try {
      const loginPromise = finishLogin();
      const timeoutPromise = new Promise((_, reject) => window.setTimeout(() => reject(new Error('Login timeout after 15 seconds')), 15000));
      await Promise.race([loginPromise, timeoutPromise]);
    } catch (error) {
      toast.error(error?.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async event => {
    event.preventDefault();
    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) return toast.error(t.signIn.invalidCode);

    setIsLoading(true);
    try {
      await verifyEmailOtp(email.trim(), code);
      toast.success(t.signIn.success);
      setVerificationMode(false);
      setVerificationCode('');
      await finishLogin();
    } catch (error) {
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
      toast.error(readableApiError(error, 'Could not resend the verification code.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4">
        <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
          <button type="button" onClick={() => { setVerificationMode(false); setVerificationCode(''); }} className="mb-6 inline-flex items-center text-gray-600 transition-colors hover:text-gray-800"><ArrowLeft size={20} className="mr-2"/>{t.signIn.backToSignIn}</button>
          <div className="mb-2 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg"><ShieldCheck className="h-6 w-6 text-white"/></div><h1 className="text-3xl font-bold text-gray-900">{t.signIn.verifyTitle}</h1></div>
          <p className="mb-2 text-gray-600">{t.signIn.verifySubtitle}</p><p className="mb-8 break-all font-semibold text-gray-900">{email}</p>
          <form onSubmit={handleVerify} className="space-y-5">
            <div><label className="mb-2 block text-sm font-medium text-gray-700">{t.signIn.codeLabel}</label><input type="text" inputMode="numeric" autoComplete="one-time-code" value={verificationCode} onChange={event => setVerificationCode(event.target.value.replace(/\D/g,'').slice(0,6))} placeholder={t.signIn.codePlaceholder} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-semibold tracking-[0.35em] text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-pink-400" maxLength={6} required disabled={isLoading}/><p className="mt-2 text-xs text-gray-500">{t.signIn.codeHelp}</p></div>
            <Button type="submit" disabled={isLoading || verificationCode.length !== 6} className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:from-pink-600 hover:to-purple-700 disabled:opacity-50">{isLoading?<><Loader2 className="mr-2 h-5 w-5 animate-spin"/>{t.signIn.verifying}</>:t.signIn.verifyButton}</Button>
          </form>
          <div className="mt-6 border-t border-gray-200 pt-6 text-center"><button type="button" onClick={handleResend} disabled={isLoading} className="font-semibold text-pink-600 hover:text-pink-700 disabled:opacity-50">{t.signIn.resendCode}</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <Link to={createPageUrl('Home')}><button className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-gray-600"><X size={24}/></button></Link>
        <div className="mb-2 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg"><Heart className="h-6 w-6 fill-white text-white"/></div><h1 className="text-3xl font-bold text-gray-900">{t.signIn.title}</h1></div>
        <p className="mb-8 text-center text-gray-600">{t.signIn.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="mb-2 block text-sm font-medium text-gray-700">{t.signIn.email} *</label><div className="relative"><Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={t.signIn.emailPlaceholder} className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-gray-700 outline-none placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-pink-400" required autoComplete="email"/></div></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">{t.signIn.password}</label><div className="relative"><Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><input type={showPassword?'text':'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={t.signIn.passwordPlaceholder} className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-12 text-gray-700 outline-none placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-pink-400" required autoComplete="current-password"/><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button></div></div>
          <div className="text-right"><Link to={createPageUrl('ForgotPassword')} className="text-sm font-medium text-pink-600 hover:text-pink-700">{t.signIn.forgotPassword}</Link></div>
          <Button type="submit" disabled={isLoading} className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:from-pink-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">{isLoading?<><Loader2 className="mr-2 h-5 w-5 animate-spin"/>{t.signIn.signingIn}</>:t.signIn.signInButton}</Button>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-6"><Link to={createPageUrl('Invite')}><Button variant="outline" className="w-full rounded-xl border-2 border-pink-300 py-3 font-semibold text-pink-600 hover:bg-pink-50"><UserCheck className="mr-2 h-5 w-5"/>{t.signIn.invite}</Button></Link></div>
      </div>
    </div>
  );
}
