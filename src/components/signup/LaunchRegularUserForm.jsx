import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Globe2, Heart, Languages, Loader2, Lock, Mail, ShieldCheck, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useLanguage } from '@/Layout';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { registerLaunchUser, resendLaunchVerification, verifyLaunchEmail } from '@/lib/launchSignupService';
import termsEn from '@/content/terms/en';
import termsEs from '@/content/terms/es';
import termsFr from '@/content/terms/fr';
import termsIt from '@/content/terms/it';
import termsDe from '@/content/terms/de';

const TERMS_VERSION = '2026-09-11';
const termsByLanguage = { en: termsEn, es: termsEs, fr: termsFr, it: termsIt, de: termsDe };
const languageOptions = [
  { code:'en', label:'English' },
  { code:'es', label:'Español' },
  { code:'fr', label:'Français' },
  { code:'it', label:'Italiano' },
  { code:'de', label:'Deutsch' },
];
const countryCodes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const localeByLanguage = { en:'en-US', es:'es-ES', fr:'fr-FR', it:'it-IT', de:'de-DE' };

const translations = {
  en: {
    title:'Create Your One2OneLove Account', subtitle:'Join One2OneLove and start using relationship tools, resources and community features.', fullName:'Your Name', fullNamePlaceholder:'Enter your name', email:'Email Address', emailPlaceholder:'Enter your email', password:'Password', passwordPlaceholder:'Create a password (minimum 8 characters)', confirmPassword:'Confirm Password', confirmPasswordPlaceholder:'Confirm your password', country:'Country', countryPlaceholder:'Select your country', language:'Preferred Language', languagePlaceholder:'Select your preferred language', termsRequired:'Terms acceptance is required.', termsExplain:'Open the full Terms of Service, scroll to the bottom, and accept them before creating your account.', readTerms:'Read Full Terms of Service', accepted:'Terms of Service accepted', createAccount:'Create Account', creating:'Creating Account…', back:'Back to One2OneLove Home', termsTitle:'One2OneLove Terms of Service', termsIntro:'Please read the complete Terms of Service. The Accept button becomes available after you reach the bottom.', scrollHint:'Scroll to the bottom to enable acceptance.', reachedBottom:'You reached the end. You may now accept the Terms of Service.', acceptTerms:'I Am 18+ and Accept the Terms of Service', close:'Close', mismatch:'Passwords do not match.', termsError:'You must read and accept the Terms of Service before creating an account.', fieldsError:'Please select your country and preferred language.', verifyTitle:'Verify Your Email', verifyBody:'We sent a 6-digit verification code to the email address below.', verifyNote:'Enter the code to verify your email. Verification codes expire, so request a new one if needed.', code:'6-digit verification code', verify:'Verify Email', verifying:'Verifying…', verifiedTitle:'Email Verified', verifiedBody:'Your email is verified. You can now sign in to One2OneLove.', resend:'Resend Code', resent:'A new verification code was sent.', resending:'Sending…', signIn:'Go to Sign In', invalidCode:'Enter the 6-digit code from your email.', privacyNote:'By accepting these Terms, you also acknowledge the One2OneLove Privacy Policy.'
  },
  es: {
    title:'Crea tu Cuenta de One2OneLove', subtitle:'Únete a One2OneLove y comienza a usar herramientas, recursos y funciones de comunidad.', fullName:'Tu Nombre', fullNamePlaceholder:'Ingresa tu nombre', email:'Correo Electrónico', emailPlaceholder:'Ingresa tu correo', password:'Contraseña', passwordPlaceholder:'Crea una contraseña (mínimo 8 caracteres)', confirmPassword:'Confirmar Contraseña', confirmPasswordPlaceholder:'Confirma tu contraseña', country:'País', countryPlaceholder:'Selecciona tu país', language:'Idioma Preferido', languagePlaceholder:'Selecciona tu idioma preferido', termsRequired:'Es obligatorio aceptar los Términos.', termsExplain:'Abre los Términos de Servicio completos, desplázate hasta el final y acéptalos antes de crear tu cuenta.', readTerms:'Leer los Términos de Servicio Completos', accepted:'Términos de Servicio aceptados', createAccount:'Crear Cuenta', creating:'Creando Cuenta…', back:'Volver al Inicio de One2OneLove', termsTitle:'Términos de Servicio de One2OneLove', termsIntro:'Lee los Términos de Servicio completos. El botón Aceptar se habilita cuando llegues al final.', scrollHint:'Desplázate hasta el final para habilitar la aceptación.', reachedBottom:'Has llegado al final. Ahora puedes aceptar los Términos.', acceptTerms:'Confirmo que tengo 18+ y Acepto los Términos de Servicio', close:'Cerrar', mismatch:'Las contraseñas no coinciden.', termsError:'Debes leer y aceptar los Términos antes de crear una cuenta.', fieldsError:'Selecciona tu país e idioma preferido.', verifyTitle:'Verifica tu Correo', verifyBody:'Enviamos un código de verificación de 6 dígitos a la dirección indicada.', verifyNote:'Ingresa el código para verificar tu correo. Los códigos caducan; solicita uno nuevo si es necesario.', code:'Código de verificación de 6 dígitos', verify:'Verificar Correo', verifying:'Verificando…', verifiedTitle:'Correo Verificado', verifiedBody:'Tu correo está verificado. Ahora puedes iniciar sesión en One2OneLove.', resend:'Reenviar Código', resent:'Se envió un nuevo código de verificación.', resending:'Enviando…', signIn:'Ir a Iniciar Sesión', invalidCode:'Ingresa el código de 6 dígitos de tu correo.', privacyNote:'Al aceptar estos Términos, también reconoces la Política de Privacidad de One2OneLove.'
  },
  fr: {
    title:'Créez Votre Compte One2OneLove', subtitle:'Rejoignez One2OneLove et utilisez des outils, ressources et fonctions communautaires.', fullName:'Votre Nom', fullNamePlaceholder:'Entrez votre nom', email:'Adresse E-mail', emailPlaceholder:'Entrez votre e-mail', password:'Mot de Passe', passwordPlaceholder:'Créez un mot de passe (8 caractères minimum)', confirmPassword:'Confirmer le Mot de Passe', confirmPasswordPlaceholder:'Confirmez votre mot de passe', country:'Pays', countryPlaceholder:'Sélectionnez votre pays', language:'Langue Préférée', languagePlaceholder:'Sélectionnez votre langue préférée', termsRequired:'L’acceptation des Conditions est obligatoire.', termsExplain:'Ouvrez les Conditions complètes, faites défiler jusqu’en bas puis acceptez-les avant de créer votre compte.', readTerms:'Lire les Conditions Complètes', accepted:'Conditions acceptées', createAccount:'Créer un Compte', creating:'Création du Compte…', back:'Retour à l’Accueil One2OneLove', termsTitle:'Conditions d’Utilisation de One2OneLove', termsIntro:'Lisez les Conditions complètes. Le bouton Accepter devient disponible après avoir atteint la fin.', scrollHint:'Faites défiler jusqu’en bas pour activer l’acceptation.', reachedBottom:'Vous avez atteint la fin. Vous pouvez maintenant accepter les Conditions.', acceptTerms:'Je Confirme Avoir 18+ et J’accepte les Conditions', close:'Fermer', mismatch:'Les mots de passe ne correspondent pas.', termsError:'Vous devez lire et accepter les Conditions avant de créer un compte.', fieldsError:'Sélectionnez votre pays et votre langue préférée.', verifyTitle:'Vérifiez Votre E-mail', verifyBody:'Nous avons envoyé un code de vérification à 6 chiffres à l’adresse ci-dessous.', verifyNote:'Saisissez le code pour vérifier votre e-mail. Les codes expirent ; demandez-en un nouveau si nécessaire.', code:'Code de vérification à 6 chiffres', verify:'Vérifier l’E-mail', verifying:'Vérification…', verifiedTitle:'E-mail Vérifié', verifiedBody:'Votre e-mail est vérifié. Vous pouvez maintenant vous connecter à One2OneLove.', resend:'Renvoyer le Code', resent:'Un nouveau code de vérification a été envoyé.', resending:'Envoi…', signIn:'Aller à la Connexion', invalidCode:'Saisissez le code à 6 chiffres reçu par e-mail.', privacyNote:'En acceptant ces Conditions, vous reconnaissez également la Politique de Confidentialité de One2OneLove.'
  },
  it: {
    title:'Crea il Tuo Account One2OneLove', subtitle:'Unisciti a One2OneLove e inizia a usare strumenti, risorse e funzioni della community.', fullName:'Il Tuo Nome', fullNamePlaceholder:'Inserisci il tuo nome', email:'Indirizzo E-mail', emailPlaceholder:'Inserisci la tua e-mail', password:'Password', passwordPlaceholder:'Crea una password (minimo 8 caratteri)', confirmPassword:'Conferma Password', confirmPasswordPlaceholder:'Conferma la tua password', country:'Paese', countryPlaceholder:'Seleziona il tuo paese', language:'Lingua Preferita', languagePlaceholder:'Seleziona la lingua preferita', termsRequired:'L’accettazione dei Termini è obbligatoria.', termsExplain:'Apri i Termini di Servizio completi, scorri fino in fondo e accettali prima di creare il tuo account.', readTerms:'Leggi i Termini Completi', accepted:'Termini accettati', createAccount:'Crea Account', creating:'Creazione Account…', back:'Torna alla Home di One2OneLove', termsTitle:'Termini di Servizio di One2OneLove', termsIntro:'Leggi i Termini completi. Il pulsante Accetta si abilita dopo aver raggiunto il fondo.', scrollHint:'Scorri fino in fondo per abilitare l’accettazione.', reachedBottom:'Hai raggiunto la fine. Ora puoi accettare i Termini.', acceptTerms:'Confermo di Avere 18+ e Accetto i Termini', close:'Chiudi', mismatch:'Le password non corrispondono.', termsError:'Devi leggere e accettare i Termini prima di creare un account.', fieldsError:'Seleziona il tuo paese e la lingua preferita.', verifyTitle:'Verifica la Tua E-mail', verifyBody:'Abbiamo inviato un codice di verifica a 6 cifre all’indirizzo indicato.', verifyNote:'Inserisci il codice per verificare la tua e-mail. I codici scadono; richiedine uno nuovo se necessario.', code:'Codice di verifica a 6 cifre', verify:'Verifica E-mail', verifying:'Verifica…', verifiedTitle:'E-mail Verificata', verifiedBody:'La tua e-mail è verificata. Ora puoi accedere a One2OneLove.', resend:'Invia di Nuovo il Codice', resent:'È stato inviato un nuovo codice di verifica.', resending:'Invio…', signIn:'Vai all’Accesso', invalidCode:'Inserisci il codice a 6 cifre ricevuto via e-mail.', privacyNote:'Accettando questi Termini, riconosci anche l’Informativa sulla Privacy di One2OneLove.'
  },
  de: {
    title:'Ihr One2OneLove-Konto Erstellen', subtitle:'Treten Sie One2OneLove bei und nutzen Sie Beziehungstools, Ressourcen und Community-Funktionen.', fullName:'Ihr Name', fullNamePlaceholder:'Geben Sie Ihren Namen ein', email:'E-Mail-Adresse', emailPlaceholder:'Geben Sie Ihre E-Mail ein', password:'Passwort', passwordPlaceholder:'Erstellen Sie ein Passwort (mindestens 8 Zeichen)', confirmPassword:'Passwort Bestätigen', confirmPasswordPlaceholder:'Bestätigen Sie Ihr Passwort', country:'Land', countryPlaceholder:'Wählen Sie Ihr Land', language:'Bevorzugte Sprache', languagePlaceholder:'Wählen Sie Ihre bevorzugte Sprache', termsRequired:'Die Zustimmung zu den Bedingungen ist erforderlich.', termsExplain:'Öffnen Sie die vollständigen Nutzungsbedingungen, scrollen Sie bis zum Ende und akzeptieren Sie sie vor der Kontoerstellung.', readTerms:'Vollständige Nutzungsbedingungen Lesen', accepted:'Nutzungsbedingungen akzeptiert', createAccount:'Konto Erstellen', creating:'Konto Wird Erstellt…', back:'Zurück zur One2OneLove-Startseite', termsTitle:'One2OneLove-Nutzungsbedingungen', termsIntro:'Lesen Sie die vollständigen Bedingungen. Die Schaltfläche Akzeptieren wird am Ende aktiviert.', scrollHint:'Scrollen Sie bis zum Ende, um die Zustimmung zu aktivieren.', reachedBottom:'Sie haben das Ende erreicht. Sie können die Bedingungen jetzt akzeptieren.', acceptTerms:'Ich Bestätige, dass ich 18+ bin, und Akzeptiere die Bedingungen', close:'Schließen', mismatch:'Die Passwörter stimmen nicht überein.', termsError:'Sie müssen die Bedingungen lesen und akzeptieren, bevor Sie ein Konto erstellen.', fieldsError:'Wählen Sie Ihr Land und Ihre bevorzugte Sprache.', verifyTitle:'Bestätigen Sie Ihre E-Mail', verifyBody:'Wir haben einen 6-stelligen Bestätigungscode an die unten angegebene Adresse gesendet.', verifyNote:'Geben Sie den Code ein, um Ihre E-Mail zu bestätigen. Codes laufen ab; fordern Sie bei Bedarf einen neuen an.', code:'6-stelliger Bestätigungscode', verify:'E-Mail Bestätigen', verifying:'Wird Bestätigt…', verifiedTitle:'E-Mail Bestätigt', verifiedBody:'Ihre E-Mail ist bestätigt. Sie können sich jetzt bei One2OneLove anmelden.', resend:'Code Erneut Senden', resent:'Ein neuer Bestätigungscode wurde gesendet.', resending:'Wird Gesendet…', signIn:'Zur Anmeldung', invalidCode:'Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.', privacyNote:'Mit der Annahme dieser Bedingungen erkennen Sie auch die Datenschutzrichtlinie von One2OneLove an.'
  },
};

export default function LaunchRegularUserForm({ onBack }) {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = translations[currentLanguage] || translations.en;
  const terms = termsByLanguage[currentLanguage] || termsEn;
  const scrollRef = useRef(null);

  const countryOptions = useMemo(() => {
    const locale = localeByLanguage[currentLanguage] || localeByLanguage.en;
    let names;
    try { names = new Intl.DisplayNames([locale], { type:'region' }); } catch { names = null; }
    return countryCodes.map(code => ({ code, name:names?.of(code) || code })).sort((a,b) => a.name.localeCompare(b.name, locale));
  }, [currentLanguage]);

  const [formData, setFormData] = useState({
    fullName:'', email:'', password:'', confirmPassword:'', country:'',
    preferredLanguage: languageOptions.some(item => item.code === currentLanguage) ? currentLanguage : 'en',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const goBack = () => onBack ? onBack() : navigate(createPageUrl('Home'));
  const openTerms = () => {
    setTermsScrolled(false);
    setTermsOpen(true);
    window.setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, 0);
  };
  const handleTermsScroll = event => {
    const node = event.currentTarget;
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 10) setTermsScrolled(true);
  };
  const acceptTerms = () => {
    if (!termsScrolled) return;
    setTermsAcceptedAt(new Date().toISOString());
    setTermsOpen(false);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) return toast.error(t.mismatch);
    if (!formData.country || !formData.preferredLanguage) return toast.error(t.fieldsError);
    if (!termsAcceptedAt) return toast.error(t.termsError);

    setIsLoading(true);
    try {
      const result = await registerLaunchUser({
        name:formData.fullName,
        email:formData.email,
        password:formData.password,
        country:formData.country,
        preferredLanguage:formData.preferredLanguage,
        termsAcceptedAt,
        termsVersion:TERMS_VERSION,
        privacyPolicyAcknowledged:true,
        age18Confirmed:true,
      });
      if (result?.success && result.emailVerificationRequired) {
        setSuccessEmail(formData.email.trim().toLowerCase());
        setOtp('');
        toast.success(t.verifyTitle);
      } else toast.error(result?.error || 'Registration failed. Please try again.');
    } catch (error) {
      toast.error(error?.message || 'Registration failed. Please try again.');
    } finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true);
    const result = await resendLaunchVerification(successEmail);
    if (result.success) toast.success(t.resent);
    else toast.error(result.error || 'Unable to resend the verification code.');
    setResendLoading(false);
  };

  const handleVerify = async event => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) return toast.error(t.invalidCode);
    setVerifyLoading(true);
    const result = await verifyLaunchEmail(successEmail, otp);
    if (result.success) {
      setVerified(true);
      toast.success(t.verifiedTitle);
    } else toast.error(result.error || t.invalidCode);
    setVerifyLoading(false);
  };

  if (successEmail) {
    return (
      <Card className="mx-auto max-w-xl shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${verified ? 'bg-green-100' : 'bg-purple-100'}`}>
            {verified ? <CheckCircle2 className="h-9 w-9 text-green-600"/> : <Mail className="h-9 w-9 text-purple-600"/>}
          </div>
          <h1 className="mb-3 text-3xl font-bold text-gray-900">{verified ? t.verifiedTitle : t.verifyTitle}</h1>
          <p className="mb-3 text-gray-600">{verified ? t.verifiedBody : t.verifyBody}</p>
          <p className="mb-5 break-all font-semibold text-gray-800">{successEmail}</p>

          {!verified ? (
            <>
              <div className="mb-5 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">{t.verifyNote}</div>
              <form onSubmit={handleVerify} className="space-y-4">
                <label className="block text-left text-sm font-semibold text-gray-700">{t.code}</label>
                <Input
                  value={otp}
                  onChange={event => setOtp(event.target.value.replace(/\D/g,'').slice(0,6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  className="h-14 text-center text-2xl font-black tracking-[0.35em]"
                  autoFocus
                />
                <Button type="submit" disabled={verifyLoading || otp.length !== 6} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-white">
                  {verifyLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/>{t.verifying}</> : <><ShieldCheck className="mr-2 h-5 w-5"/>{t.verify}</>}
                </Button>
              </form>
              <Button type="button" variant="outline" onClick={handleResend} disabled={resendLoading} className="mt-3 w-full">
                {resendLoading ? t.resending : t.resend}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={() => navigate(createPageUrl('SignIn'))} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-white">{t.signIn}</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mx-auto max-w-xl shadow-2xl">
        <CardHeader>
          <button type="button" onClick={goBack} className="mb-4 inline-flex items-center text-gray-600 transition-colors hover:text-gray-800"><ArrowLeft size={20} className="mr-2"/>{t.back}</button>
          <div className="mb-2 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg"><Heart className="h-6 w-6 fill-white text-white"/></div><CardTitle className="text-3xl">{t.title}</CardTitle></div>
          <p className="text-gray-600">{t.subtitle}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label={`${t.fullName} *`} icon={<User size={20}/>}><Input value={formData.fullName} onChange={e => setFormData({...formData,fullName:e.target.value})} placeholder={t.fullNamePlaceholder} className="pl-12" required/></Field>
            <Field label={`${t.email} *`} icon={<Mail size={20}/>}><Input type="email" value={formData.email} onChange={e => setFormData({...formData,email:e.target.value})} placeholder={t.emailPlaceholder} className="pl-12" required/></Field>
            <Field label={`${t.password} *`} icon={<Lock size={20}/>}>
              <Input type={showPassword?'text':'password'} value={formData.password} onChange={e => setFormData({...formData,password:e.target.value})} placeholder={t.passwordPlaceholder} className="pl-12 pr-12" minLength={8} required/>
              <button type="button" onClick={() => setShowPassword(v=>!v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button>
            </Field>
            <Field label={`${t.confirmPassword} *`} icon={<Lock size={20}/>}>
              <Input type={showConfirmPassword?'text':'password'} value={formData.confirmPassword} onChange={e => setFormData({...formData,confirmPassword:e.target.value})} placeholder={t.confirmPasswordPlaceholder} className="pl-12 pr-12" minLength={8} required/>
              <button type="button" onClick={() => setShowConfirmPassword(v=>!v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showConfirmPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button>
            </Field>

            <div><label className="mb-2 block text-sm font-medium text-gray-700">{t.country} *</label><div className="relative"><Globe2 size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><select value={formData.country} onChange={e => setFormData({...formData,country:e.target.value})} className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-700" required><option value="">{t.countryPlaceholder}</option>{countryOptions.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></div></div>
            <div><label className="mb-2 block text-sm font-medium text-gray-700">{t.language} *</label><div className="relative"><Languages size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><select value={formData.preferredLanguage} onChange={e => setFormData({...formData,preferredLanguage:e.target.value})} className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-700" required><option value="">{t.languagePlaceholder}</option>{languageOptions.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div></div>

            <div className={`rounded-xl border p-4 ${termsAcceptedAt?'border-green-300 bg-green-50':'border-gray-200 bg-gray-50'}`}><p className="mb-1 font-semibold text-gray-900">{t.termsRequired}</p><p className="mb-3 text-sm text-gray-600">{t.termsExplain}</p><button type="button" onClick={openTerms} className="text-sm font-bold text-blue-600 underline hover:text-blue-700">{t.readTerms}</button>{termsAcceptedAt && <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-700"><CheckCircle2 size={18}/>{t.accepted}</div>}</div>

            <Button type="submit" disabled={isLoading || !termsAcceptedAt} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white disabled:opacity-50">{isLoading?<><Loader2 className="mr-2 h-5 w-5 animate-spin"/>{t.creating}</>:t.createAccount}</Button>
          </form>
        </CardContent>
      </Card>

      {termsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
            <button type="button" onClick={() => setTermsOpen(false)} aria-label={t.close} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"><X size={20}/></button>
            <div className="p-6 pb-3 pr-16"><h2 className="text-2xl font-bold text-gray-900">{t.termsTitle}</h2><p className="mt-2 text-sm text-gray-600">{t.termsIntro}</p></div>
            <div ref={scrollRef} onScroll={handleTermsScroll} className="mx-6 min-h-0 max-h-[58vh] overflow-y-auto rounded-xl border p-5">{terms.map(([heading,body]) => <section key={heading} className="mb-5"><h3 className="mb-1 font-bold text-gray-900">{heading}</h3><p className="text-sm leading-6 text-gray-600">{body}</p></section>)}<p className="text-sm font-semibold text-gray-700">{t.privacyNote}</p><p className="mt-4 text-xs text-gray-500">Terms version: {TERMS_VERSION}</p></div>
            <div className="p-6 pt-4"><p className={`mb-3 text-center text-xs font-semibold ${termsScrolled?'text-green-700':'text-gray-500'}`}>{termsScrolled?t.reachedBottom:t.scrollHint}</p><Button type="button" onClick={acceptTerms} disabled={!termsScrolled} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40">{t.acceptTerms}</Button></div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, icon, children }) {
  return <div><label className="mb-2 block text-sm font-medium text-gray-700">{label}</label><div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>{children}</div></div>;
}
