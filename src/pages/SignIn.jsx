import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Eye, EyeOff, Heart, Loader2, Lock, Mail, ShieldCheck, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';
import { toast } from 'sonner';
import { verifiedEmailLogin } from '@/lib/verifiedLoginService';
import { readableApiError, sendEmailVerificationOtp, verifyEmailOtp } from '@/lib/apiClient';
import { startGuestPreview } from '@/lib/guestPreview';

const translations = {
  en: { signIn: { title:'Sign In', subtitle:'Sign in to access your One2OneLove relationship tools.', email:'Email Address', password:'Password', emailPlaceholder:'Enter your email', passwordPlaceholder:'Enter your password', showPassword:'Show password', hidePassword:'Hide password', close:'Close', signInButton:'Sign In', signingIn:'Signing in…', forgotPassword:'Forgot Password?', invite:'Invite Friends', verifyTitle:'Verify Your Email', verifySubtitle:'We sent a 6-digit verification code to', codeLabel:'Verification Code', codePlaceholder:'Enter 6-digit code', verifyButton:'Verify Email', verifying:'Verifying…', resendCode:'Resend Code', resendSent:'A new verification code was sent.', codeHelp:'The code expires in about 5 minutes.', invalidCode:'Enter the 6-digit code from your email.', backToSignIn:'Back to Sign In', required:'Please enter both email and password.', success:'Successfully signed in!', rateLimited:'Your sign-in was accepted, but too many requests were sent too quickly. Wait a few seconds and try once more if you are not redirected.', emailVerificationRequired:'Email verification required.', invalidCredentials:'Invalid email or password. Please try again.', genericError:'An error occurred. Please try again.', resendError:'Could not resend the verification code.', timeout:'Sign-in took too long. Please try again.' } },
  es: { signIn: { title:'Iniciar Sesión', subtitle:'Inicia sesión para acceder a tus herramientas de relación de One2OneLove.', email:'Correo Electrónico', password:'Contraseña', emailPlaceholder:'Ingresa tu correo electrónico', passwordPlaceholder:'Ingresa tu contraseña', showPassword:'Mostrar contraseña', hidePassword:'Ocultar contraseña', close:'Cerrar', signInButton:'Iniciar Sesión', signingIn:'Iniciando sesión…', forgotPassword:'¿Olvidaste tu contraseña?', invite:'Invitar Amigos', verifyTitle:'Verifica Tu Correo', verifySubtitle:'Enviamos un código de verificación de 6 dígitos a', codeLabel:'Código de Verificación', codePlaceholder:'Ingresa el código de 6 dígitos', verifyButton:'Verificar Correo', verifying:'Verificando…', resendCode:'Reenviar Código', resendSent:'Se envió un nuevo código de verificación.', codeHelp:'El código vence en aproximadamente 5 minutos.', invalidCode:'Ingresa el código de 6 dígitos de tu correo.', backToSignIn:'Volver a Iniciar Sesión', required:'Ingresa el correo y la contraseña.', success:'¡Sesión iniciada!', rateLimited:'Tu inicio de sesión fue aceptado, pero se enviaron demasiadas solicitudes muy rápido. Espera unos segundos e inténtalo una sola vez si no eres redirigido.', emailVerificationRequired:'Se requiere verificar el correo electrónico.', invalidCredentials:'Correo electrónico o contraseña incorrectos. Inténtalo de nuevo.', genericError:'Ocurrió un error. Inténtalo de nuevo.', resendError:'No se pudo reenviar el código de verificación.', timeout:'El inicio de sesión tardó demasiado. Inténtalo de nuevo.' } },
  fr: { signIn: { title:'Se Connecter', subtitle:'Connectez-vous pour accéder à vos outils relationnels One2OneLove.', email:'Adresse E-mail', password:'Mot de Passe', emailPlaceholder:'Entrez votre e-mail', passwordPlaceholder:'Entrez votre mot de passe', showPassword:'Afficher le mot de passe', hidePassword:'Masquer le mot de passe', close:'Fermer', signInButton:'Se Connecter', signingIn:'Connexion…', forgotPassword:'Mot de passe oublié ?', invite:'Inviter des Amis', verifyTitle:'Vérifiez Votre E-mail', verifySubtitle:'Nous avons envoyé un code de vérification à 6 chiffres à', codeLabel:'Code de Vérification', codePlaceholder:'Entrez le code à 6 chiffres', verifyButton:'Vérifier l’E-mail', verifying:'Vérification…', resendCode:'Renvoyer le Code', resendSent:'Un nouveau code de vérification a été envoyé.', codeHelp:'Le code expire dans environ 5 minutes.', invalidCode:'Entrez le code à 6 chiffres reçu par e-mail.', backToSignIn:'Retour à la Connexion', required:'Entrez votre e-mail et votre mot de passe.', success:'Connexion réussie !', rateLimited:'Votre connexion a été acceptée, mais trop de requêtes ont été envoyées trop rapidement. Attendez quelques secondes et réessayez une seule fois si vous n’êtes pas redirigé.', emailVerificationRequired:'La vérification de l’e-mail est requise.', invalidCredentials:'Adresse e-mail ou mot de passe incorrect. Veuillez réessayer.', genericError:'Une erreur s’est produite. Veuillez réessayer.', resendError:'Impossible de renvoyer le code de vérification.', timeout:'La connexion a pris trop de temps. Veuillez réessayer.' } },
  it: { signIn: { title:'Accedi', subtitle:'Accedi per usare gli strumenti di relazione One2OneLove.', email:'Indirizzo E-mail', password:'Password', emailPlaceholder:'Inserisci la tua e-mail', passwordPlaceholder:'Inserisci la password', showPassword:'Mostra password', hidePassword:'Nascondi password', close:'Chiudi', signInButton:'Accedi', signingIn:'Accesso…', forgotPassword:'Password dimenticata?', invite:'Invita Amici', verifyTitle:'Verifica la Tua E-mail', verifySubtitle:'Abbiamo inviato un codice di verifica a 6 cifre a', codeLabel:'Codice di Verifica', codePlaceholder:'Inserisci il codice a 6 cifre', verifyButton:'Verifica E-mail', verifying:'Verifica…', resendCode:'Reinvia Codice', resendSent:'È stato inviato un nuovo codice di verifica.', codeHelp:'Il codice scade tra circa 5 minuti.', invalidCode:'Inserisci il codice a 6 cifre ricevuto via e-mail.', backToSignIn:'Torna ad Accedi', required:'Inserisci e-mail e password.', success:'Accesso eseguito!', rateLimited:'Il tuo accesso è stato accettato, ma sono state inviate troppe richieste troppo rapidamente. Attendi qualche secondo e riprova una sola volta se non vieni reindirizzato.', emailVerificationRequired:'È richiesta la verifica dell’e-mail.', invalidCredentials:'E-mail o password non validi. Riprova.', genericError:'Si è verificato un errore. Riprova.', resendError:'Impossibile reinviare il codice di verifica.', timeout:'L’accesso ha impiegato troppo tempo. Riprova.' } },
  de: { signIn: { title:'Anmelden', subtitle:'Melden Sie sich an, um Ihre One2OneLove-Beziehungstools zu nutzen.', email:'E-Mail-Adresse', password:'Passwort', emailPlaceholder:'E-Mail eingeben', passwordPlaceholder:'Passwort eingeben', showPassword:'Passwort anzeigen', hidePassword:'Passwort ausblenden', close:'Schließen', signInButton:'Anmelden', signingIn:'Anmeldung…', forgotPassword:'Passwort vergessen?', invite:'Freunde Einladen', verifyTitle:'E-Mail Bestätigen', verifySubtitle:'Wir haben einen 6-stelligen Bestätigungscode gesendet an', codeLabel:'Bestätigungscode', codePlaceholder:'6-stelligen Code eingeben', verifyButton:'E-Mail Bestätigen', verifying:'Wird Bestätigt…', resendCode:'Code Erneut Senden', resendSent:'Ein neuer Bestätigungscode wurde gesendet.', codeHelp:'Der Code läuft nach etwa 5 Minuten ab.', invalidCode:'Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.', backToSignIn:'Zurück zur Anmeldung', required:'Geben Sie E-Mail und Passwort ein.', success:'Erfolgreich angemeldet!', rateLimited:'Ihre Anmeldung wurde akzeptiert, aber es wurden zu viele Anfragen in kurzer Zeit gesendet. Warten Sie einige Sekunden und versuchen Sie es nur einmal erneut, falls keine Weiterleitung erfolgt.', emailVerificationRequired:'Eine E-Mail-Bestätigung ist erforderlich.', invalidCredentials:'E-Mail-Adresse oder Passwort ist ungültig. Bitte versuchen Sie es erneut.', genericError:'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.', resendError:'Der Bestätigungscode konnte nicht erneut gesendet werden.', timeout:'Die Anmeldung hat zu lange gedauert. Bitte versuchen Sie es erneut.' } },
};


const GUEST_COPY = {
  en: { title:'24-Hour Guest Preview — View Only', body:'Explore the actual One2OneLove features for 24 hours. You can open and review the tools, but saving, sending, posting, scheduling, messaging, uploading, or changing data is locked until you subscribe.', button:'Start 24-Hour Guest Preview' },
  es: { title:'Vista Previa de Invitado por 24 Horas — Solo Lectura', body:'Explora las funciones reales de One2OneLove durante 24 horas. Puedes abrir y revisar las herramientas, pero guardar, enviar, publicar, programar, enviar mensajes, subir archivos o cambiar datos requiere una suscripción.', button:'Iniciar Vista Previa de 24 Horas' },
  fr: { title:'Aperçu Invité de 24 Heures — Consultation Uniquement', body:'Explorez les vraies fonctionnalités de One2OneLove pendant 24 heures. Vous pouvez ouvrir et consulter les outils, mais enregistrer, envoyer, publier, programmer, envoyer des messages, téléverser ou modifier des données nécessite un abonnement.', button:'Démarrer l’Aperçu de 24 Heures' },
  it: { title:'Anteprima Ospite di 24 Ore — Solo Visualizzazione', body:'Esplora le vere funzionalità di One2OneLove per 24 ore. Puoi aprire e consultare gli strumenti, ma salvare, inviare, pubblicare, programmare, messaggiare, caricare o modificare dati richiede un abbonamento.', button:'Avvia Anteprima di 24 Ore' },
  de: { title:'24-Stunden-Gastvorschau — Nur Ansicht', body:'Entdecken Sie 24 Stunden lang die tatsächlichen One2OneLove-Funktionen. Sie können die Tools öffnen und ansehen; Speichern, Senden, Posten, Planen, Nachrichten, Hochladen oder Datenänderungen erfordern ein Abonnement.', button:'24-Stunden-Gastvorschau Starten' },
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
  const guest = GUEST_COPY[currentLanguage] || GUEST_COPY.en;

  const finishLogin = async () => {
    const result = await verifiedEmailLogin(email, password);
    if (result?.success) {
      toast.success(t.signIn.success);
      const role = String(result?.user?.role || '').toLowerCase();
      const status = String(result?.user?.subscription_status || '').toLowerCase();
      const phoneRequired = result?.user?.phone_verification_required === true;
      const phoneVerified = result?.user?.phoneNumberVerified === true || result?.user?.phone_number_verified === true;
      const target = phoneRequired && !phoneVerified
        ? '/VerifyPhone'
        : role === 'admin'
          ? '/Admin'
          : ['active','trial','trialing'].includes(status) && result?.user?.stripe_subscription_id
            ? createPageUrl('Profile')
            : createPageUrl('Subscription');
      window.setTimeout(() => window.location.replace(target), 100);
      return true;
    }

    if (result?.emailVerificationRequired) {
      setVerificationMode(true);
      toast.error(t.signIn.emailVerificationRequired);
      return false;
    }

    if (result?.status === 429) {
      toast.error(t.signIn.rateLimited);
      return false;
    }

    toast.error(t.signIn.invalidCredentials);
    return false;
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!email || !password) return toast.error(t.signIn.required);

    setIsLoading(true);
    try {
      const loginPromise = finishLogin();
      const timeoutPromise = new Promise((_, reject) => window.setTimeout(() => reject(new Error(t.signIn.timeout)), 15000));
      await Promise.race([loginPromise, timeoutPromise]);
    } catch (error) {
      toast.error(error?.message === t.signIn.timeout ? t.signIn.timeout : (currentLanguage === 'en' ? (error?.message || t.signIn.genericError) : t.signIn.genericError));
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
      toast.error(currentLanguage === 'en' ? readableApiError(error, t.signIn.invalidCode) : t.signIn.invalidCode);
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
      toast.error(currentLanguage === 'en' ? readableApiError(error, t.signIn.resendError) : t.signIn.resendError);
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
            <div><label htmlFor="signin-verification-code" className="mb-2 block text-sm font-medium text-gray-700">{t.signIn.codeLabel}</label><input id="signin-verification-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={verificationCode} onChange={event => setVerificationCode(event.target.value.replace(/\D/g,'').slice(0,6))} placeholder={t.signIn.codePlaceholder} className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-xl font-semibold tracking-[0.35em] text-gray-900 outline-none focus:border-transparent focus:ring-2 focus:ring-pink-400" maxLength={6} required disabled={isLoading}/><p className="mt-2 text-xs text-gray-500">{t.signIn.codeHelp}</p></div>
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
        <Link to={createPageUrl('Home')} aria-label={t.signIn.close} className="absolute right-6 top-6 text-gray-400 transition-colors hover:text-gray-600"><X size={24}/></Link>
        <div className="mb-2 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg"><Heart className="h-6 w-6 fill-white text-white"/></div><h1 className="text-3xl font-bold text-gray-900">{t.signIn.title}</h1></div>
        <p className="mb-8 text-center text-gray-600">{t.signIn.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label htmlFor="signin-email" className="mb-2 block text-sm font-medium text-gray-700">{t.signIn.email} *</label><div className="relative"><Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><input id="signin-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder={t.signIn.emailPlaceholder} className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-4 text-gray-700 outline-none placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-pink-400" required autoComplete="email"/></div></div>
          <div><label htmlFor="signin-password" className="mb-2 block text-sm font-medium text-gray-700">{t.signIn.password}</label><div className="relative"><Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><input id="signin-password" type={showPassword?'text':'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={t.signIn.passwordPlaceholder} className="w-full rounded-xl border border-gray-300 py-3 pl-12 pr-12 text-gray-700 outline-none placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-pink-400" required autoComplete="current-password"/><button type="button" aria-label={showPassword ? t.signIn.hidePassword : t.signIn.showPassword} onClick={() => setShowPassword(value => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button></div></div>
          <div className="text-right"><Link to={createPageUrl('ForgotPassword')} className="text-sm font-medium text-pink-600 hover:text-pink-700">{t.signIn.forgotPassword}</Link></div>
          <Button type="submit" disabled={isLoading} className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:from-pink-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50">{isLoading?<><Loader2 className="mr-2 h-5 w-5 animate-spin"/>{t.signIn.signingIn}</>:t.signIn.signInButton}</Button>
        </form>

        <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Eye className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"/>
            <div>
              <div className="font-bold text-amber-950">{guest.title}</div>
              <p className="mt-1 text-sm leading-5 text-amber-900">{guest.body}</p>
            </div>
          </div>
          <Button type="button" onClick={() => { startGuestPreview(); window.location.replace('/DateIdeas'); }} className="mt-4 w-full rounded-xl bg-amber-600 py-5 font-bold text-white hover:bg-amber-700">
            <Eye className="mr-2 h-5 w-5"/>{guest.button}
          </Button>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6"><Link to={createPageUrl('Invite')}><Button variant="outline" className="w-full rounded-xl border-2 border-pink-300 py-3 font-semibold text-pink-600 hover:bg-pink-50"><UserCheck className="mr-2 h-5 w-5"/>{t.signIn.invite}</Button></Link></div>
      </div>
    </div>
  );
}
