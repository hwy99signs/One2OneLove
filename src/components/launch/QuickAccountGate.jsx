import React, { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { getAnalyticsVisitorId } from '@/lib/interactionAnalytics';
import { registerQuickUser, resendLaunchVerification, verifyLaunchEmail } from '@/lib/launchSignupService';

const copy = {
  en:{
    eyebrow:'Free Account',
    title:'Create your free One2OneLove account',
    body:'Choose a username, enter your email, and create a password to continue.',
    username:'Username',usernamePh:'Choose a username',
    email:'Email',emailPh:'Enter your email',
    password:'Create password',passwordPh:'8 or more characters',
    promo:'Yes, send me promotional emails and One2OneLove updates.',
    continue:'Create Free Account & Continue',creating:'Creating your account…',
    noCard:'No credit card required. Your current free access stays free.',
    terms:'By continuing, you confirm you are 18+ and agree to the One2OneLove Terms of Service and Privacy Policy.',
    signIn:'Already have an account? Sign in',
    verifyTitle:'Verify your email',
    verifyBody:'We sent a 6-digit verification code to',
    code:'Verification code',verify:'Verify & Continue',verifying:'Verifying…',
    resend:'Send a new code',resent:'A new code was sent.',
    invalid:'Enter the 6-digit code.',
    usernameError:'Use 3–40 letters, numbers, periods, underscores, or hyphens.',
    passwordError:'Password must be at least 8 characters.',
  },
  es:{
    eyebrow:'Cuenta Gratuita',title:'Crea tu cuenta gratuita de One2OneLove',body:'Elige un nombre de usuario, ingresa tu correo y crea una contraseña para continuar.',
    username:'Nombre de usuario',usernamePh:'Elige un nombre de usuario',email:'Correo electrónico',emailPh:'Ingresa tu correo',
    password:'Crear contraseña',passwordPh:'8 caracteres o más',promo:'Sí, envíame correos promocionales y novedades de One2OneLove.',
    continue:'Crear Cuenta Gratis y Continuar',creating:'Creando tu cuenta…',noCard:'No se requiere tarjeta. Tu acceso gratuito actual sigue siendo gratuito.',
    terms:'Al continuar, confirmas que tienes 18+ y aceptas los Términos y la Política de Privacidad de One2OneLove.',signIn:'¿Ya tienes cuenta? Inicia sesión',
    verifyTitle:'Verifica tu correo',verifyBody:'Enviamos un código de 6 dígitos a',code:'Código de verificación',verify:'Verificar y Continuar',verifying:'Verificando…',resend:'Enviar otro código',resent:'Se envió un nuevo código.',invalid:'Ingresa el código de 6 dígitos.',usernameError:'Usa 3–40 letras, números, puntos, guiones bajos o guiones.',passwordError:'La contraseña debe tener al menos 8 caracteres.',
  },
  fr:{
    eyebrow:'Compte Gratuit',title:'Créez votre compte One2OneLove gratuit',body:'Choisissez un nom d’utilisateur, saisissez votre e-mail et créez un mot de passe pour continuer.',
    username:'Nom d’utilisateur',usernamePh:'Choisissez un nom d’utilisateur',email:'E-mail',emailPh:'Saisissez votre e-mail',
    password:'Créer un mot de passe',passwordPh:'8 caractères ou plus',promo:'Oui, envoyez-moi des e-mails promotionnels et les actualités One2OneLove.',
    continue:'Créer un Compte Gratuit et Continuer',creating:'Création du compte…',noCard:'Aucune carte bancaire requise. Votre accès gratuit reste gratuit.',
    terms:'En continuant, vous confirmez avoir 18+ et accepter les Conditions et la Politique de confidentialité de One2OneLove.',signIn:'Vous avez déjà un compte ? Connectez-vous',
    verifyTitle:'Vérifiez votre e-mail',verifyBody:'Nous avons envoyé un code à 6 chiffres à',code:'Code de vérification',verify:'Vérifier et Continuer',verifying:'Vérification…',resend:'Renvoyer un code',resent:'Un nouveau code a été envoyé.',invalid:'Saisissez le code à 6 chiffres.',usernameError:'Utilisez 3 à 40 lettres, chiffres, points, tirets bas ou tirets.',passwordError:'Le mot de passe doit contenir au moins 8 caractères.',
  },
  it:{
    eyebrow:'Account Gratuito',title:'Crea il tuo account One2OneLove gratuito',body:'Scegli un nome utente, inserisci la tua email e crea una password per continuare.',
    username:'Nome utente',usernamePh:'Scegli un nome utente',email:'Email',emailPh:'Inserisci la tua email',
    password:'Crea password',passwordPh:'8 o più caratteri',promo:'Sì, inviami email promozionali e aggiornamenti One2OneLove.',
    continue:'Crea Account Gratuito e Continua',creating:'Creazione account…',noCard:'Nessuna carta richiesta. Il tuo accesso gratuito resta gratuito.',
    terms:'Continuando, confermi di avere 18+ anni e di accettare Termini e Privacy di One2OneLove.',signIn:'Hai già un account? Accedi',
    verifyTitle:'Verifica la tua email',verifyBody:'Abbiamo inviato un codice di 6 cifre a',code:'Codice di verifica',verify:'Verifica e Continua',verifying:'Verifica…',resend:'Invia un nuovo codice',resent:'È stato inviato un nuovo codice.',invalid:'Inserisci il codice di 6 cifre.',usernameError:'Usa 3–40 lettere, numeri, punti, underscore o trattini.',passwordError:'La password deve contenere almeno 8 caratteri.',
  },
  de:{
    eyebrow:'Kostenloses Konto',title:'Erstellen Sie Ihr kostenloses One2OneLove-Konto',body:'Wählen Sie einen Benutzernamen, geben Sie Ihre E-Mail ein und erstellen Sie ein Passwort.',
    username:'Benutzername',usernamePh:'Benutzernamen wählen',email:'E-Mail',emailPh:'E-Mail eingeben',
    password:'Passwort erstellen',passwordPh:'8 oder mehr Zeichen',promo:'Ja, senden Sie mir Werbe-E-Mails und One2OneLove-Updates.',
    continue:'Kostenloses Konto Erstellen & Weiter',creating:'Konto wird erstellt…',noCard:'Keine Kreditkarte erforderlich. Ihr aktueller kostenloser Zugang bleibt kostenlos.',
    terms:'Mit dem Fortfahren bestätigen Sie, dass Sie 18+ sind und den One2OneLove-Bedingungen und der Datenschutzrichtlinie zustimmen.',signIn:'Schon ein Konto? Anmelden',
    verifyTitle:'E-Mail bestätigen',verifyBody:'Wir haben einen 6-stelligen Code gesendet an',code:'Bestätigungscode',verify:'Bestätigen & Weiter',verifying:'Bestätigung…',resend:'Neuen Code senden',resent:'Ein neuer Code wurde gesendet.',invalid:'Geben Sie den 6-stelligen Code ein.',usernameError:'3–40 Buchstaben, Zahlen, Punkte, Unterstriche oder Bindestriche verwenden.',passwordError:'Das Passwort muss mindestens 8 Zeichen haben.',
  },
};

export default function QuickAccountGate({ intendedPath='/' }) {
  const { currentLanguage } = useLanguage();
  const { login } = useAuth();
  const t = copy[currentLanguage] || copy.en;
  const language = copy[currentLanguage] ? currentLanguage : 'en';

  const [username,setUsername]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [promo,setPromo]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [verifyEmail,setVerifyEmail]=useState('');
  const [otp,setOtp]=useState('');
  const [verifying,setVerifying]=useState(false);
  const visitorId=useMemo(()=>getAnalyticsVisitorId(),[]);

  const signupContext=()=>({
    quickAccount:true,
    username:username.trim(),
    name:username.trim(),
    country:null,
    preferredLanguage:language,
    termsAcceptedAt:new Date().toISOString(),
    termsVersion:'2026-10-09-quick',
    privacyPolicyAcknowledged:true,
    age18Confirmed:true,
    marketingEmailOptIn:promo,
    visitorId,
    foundingIntent:false,
  });

  const submit=async e=>{
    e.preventDefault();
    setError('');
    if(!/^[A-Za-z0-9._-]{3,40}$/.test(username.trim())) return setError(t.usernameError);
    if(password.length<8) return setError(t.passwordError);
    setBusy(true);
    const result=await registerQuickUser({
      username:username.trim(),
      email:email.trim().toLowerCase(),
      password,
      marketingEmailOptIn:promo,
      visitorId,
      preferredLanguage:language,
    });
    setBusy(false);
    if(!result?.success) return setError(result?.error||'Account creation failed.');
    if(result.emailVerificationRequired!==false){
      setVerifyEmail(email.trim().toLowerCase());
      return;
    }
    const signedIn=await login(email.trim().toLowerCase(),password);
    if(!signedIn?.success) setError(signedIn?.error||'Please sign in to continue.');
  };

  const verify=async e=>{
    e.preventDefault();
    if(!/^\d{6}$/.test(otp.trim())) return setError(t.invalid);
    setVerifying(true); setError('');
    const result=await verifyLaunchEmail(verifyEmail,otp.trim(),signupContext());
    if(!result?.success){ setVerifying(false); return setError(result?.error||t.invalid); }
    const signedIn=await login(verifyEmail,password);
    setVerifying(false);
    if(!signedIn?.success) return setError(signedIn?.error||'Email verified. Please sign in to continue.');
  };

  const resend=async()=>{
    setError('');
    const result=await resendLaunchVerification(verifyEmail);
    setError(result?.success?t.resent:(result?.error||'Unable to resend code.'));
  };

  return <div className="min-h-[72vh] bg-gradient-to-b from-rose-50 via-white to-purple-50 px-4 py-10">
    <div className="mx-auto max-w-md rounded-3xl border border-rose-100 bg-white p-7 shadow-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          {verifyEmail?<Mail className="h-6 w-6"/>:<User className="h-6 w-6"/>}
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">{t.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">{verifyEmail?t.verifyTitle:t.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{verifyEmail?<>{t.verifyBody} <strong>{verifyEmail}</strong>.</>:t.body}</p>
      </div>

      {!verifyEmail ? <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold text-slate-700">{t.username}
          <Input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder={t.usernamePh} className="mt-1.5" required/>
        </label>
        <label className="block text-sm font-bold text-slate-700">{t.email}
          <Input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t.emailPh} className="mt-1.5" required/>
        </label>
        <label className="block text-sm font-bold text-slate-700">{t.password}
          <Input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={t.passwordPh} className="mt-1.5" required/>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <input type="checkbox" checked={promo} onChange={e=>setPromo(e.target.checked)} className="mt-1 h-4 w-4"/>
          <span>{t.promo}</span>
        </label>
        {error&&<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        <Button type="submit" disabled={busy} className="w-full bg-rose-600 hover:bg-rose-700">
          {busy?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{t.creating}</>:t.continue}
        </Button>
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0"/><span>{t.noCard}</span>
        </div>
        <p className="text-center text-xs leading-5 text-slate-500">{t.terms} <a href="/TermsOfService" className="font-bold text-rose-600">Terms</a> · <a href="/PrivacyPolicy" className="font-bold text-rose-600">Privacy</a></p>
        <a href={"/SignIn?next="+encodeURIComponent(intendedPath)} className="block text-center text-sm font-bold text-rose-600">{t.signIn}</a>
      </form> : <form onSubmit={verify} className="space-y-4">
        <label className="block text-sm font-bold text-slate-700">{t.code}
          <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} className="mt-1.5 text-center text-xl tracking-[0.35em]" required/>
        </label>
        {error&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">{error}</div>}
        <Button type="submit" disabled={verifying} className="w-full bg-rose-600 hover:bg-rose-700">
          {verifying?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{t.verifying}</>:<><Lock className="mr-2 h-4 w-4"/>{t.verify}</>}
        </Button>
        <button type="button" onClick={resend} className="w-full text-sm font-bold text-rose-600">{t.resend}</button>
      </form>}
    </div>
  </div>;
}
