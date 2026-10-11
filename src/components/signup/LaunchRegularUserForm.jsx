import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Globe2, Heart, Languages, Loader2, Lock, Mail, ShieldCheck, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useLanguage } from '@/Layout';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getLaunchSignupReadiness, registerLaunchUser, resendLaunchVerification, verifyLaunchEmail } from '@/lib/launchSignupService';
import termsEn from '@/content/terms/en';
import termsEs from '@/content/terms/es';
import termsFr from '@/content/terms/fr';
import termsIt from '@/content/terms/it';
import termsDe from '@/content/terms/de';

const TERMS_VERSION = '2026-10-09';
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
    title:'Create Your One2OneLove Account', subtitle:'Join One2OneLove and start using relationship tools, resources and community features.', accountType:'Account type', registeredFree:'Free Account — no card required', selectedMembership:'Selected account', fullName:'Your Name', fullNamePlaceholder:'Enter your name', firstNameNotice:'YOUR FIRST NAME will be used when sending LOVE NOTES and messages to your loved ones', email:'Email Address', emailPlaceholder:'Enter your email', password:'Password', passwordPlaceholder:'Create a password', passwordHelp:'Use 8 or more characters. Letters, numbers and symbols are allowed; no special character is required.', passwordLengthOk:'8+ characters', passwordMatchOk:'Passwords match', passwordMatchWaiting:'Passwords must match', showPassword:'Show password', hidePassword:'Hide password', showConfirmPassword:'Show confirmation password', hideConfirmPassword:'Hide confirmation password', confirmPassword:'Confirm Password', confirmPasswordPlaceholder:'Confirm your password', country:'Country', countryPlaceholder:'Select your country', language:'Preferred Language', languagePlaceholder:'Select your preferred language', termsRequired:'Final Step — Review & Accept Terms', termsStep:'You must complete this step before Create Account becomes available.', termsExplain:'Open the full Terms of Service, scroll to the bottom, and accept them before creating your account.', readTerms:'OPEN TERMS & CONDITIONS TO REVIEW AND ACCEPT', accepted:'Terms of Service accepted', createAccount:'Create Account', createBlocked:'Create Account unlocks after you read and accept the Terms & Conditions.', creating:'Creating Account…', checkingReadiness:'Checking secure registration…', readinessUnavailable:'Verified registration is temporarily unavailable. Please try again shortly.', back:'Back to One2OneLove Home', termsTitle:'One2OneLove Terms of Service', termsIntro:'Please read the complete Terms of Service. The Accept button becomes available after you reach the bottom.', scrollHint:'Scroll to the bottom to enable acceptance.', reachedBottom:'You reached the end. You may now accept the Terms of Service.', acceptTerms:'I Am 18+ and Accept the Terms of Service', close:'Close', mismatch:'Passwords do not match.', termsError:'You must read and accept the Terms of Service before creating an account.', fieldsError:'Please select your country and preferred language.', nameError:'Please enter your name — a first name is required to create your account.', verifyTitle:'Verify Your Email', verifyBody:'We sent a 6-digit verification code to the email address below.', verifyNote:'Enter the code to verify your email. Verification codes expire, so request a new one if needed.', resumedNote:'This account was already waiting for verification. Use the password you created earlier; use password reset if you no longer have it.', code:'6-digit verification code', verify:'Verify Email', verifying:'Verifying…', verifiedTitle:'Email Verified', verifiedBody:'Your email is verified. You can now sign in to One2OneLove.', resend:'Resend Code', resent:'A new verification code was sent.', resending:'Sending…', signIn:'Go to Sign In', invalidCode:'Enter the 6-digit code from your email.', registrationFailed:'Registration failed. Please try again.', resendFailed:'Unable to resend the verification code.', termsVersionLabel:'Terms version', privacyNote:'By accepting these Terms, you also acknowledge the One2OneLove Privacy Policy.'
  },
  es: {
    title:'Crea tu Cuenta de One2OneLove', subtitle:'Únete a One2OneLove y comienza a usar herramientas, recursos y funciones de comunidad.', accountType:'Tipo de cuenta', registeredFree:'Cuenta Gratuita — no requiere tarjeta', selectedMembership:'Cuenta seleccionada', fullName:'Tu Nombre', fullNamePlaceholder:'Ingresa tu nombre', firstNameNotice:'TU PRIMER NOMBRE se usará al enviar NOTAS DE AMOR y mensajes a tus seres queridos', email:'Correo Electrónico', emailPlaceholder:'Ingresa tu correo', password:'Contraseña', passwordPlaceholder:'Crea una contraseña', passwordHelp:'Usa 8 o más caracteres. Se permiten letras, números y símbolos; no se requiere un carácter especial.', passwordLengthOk:'8+ caracteres', passwordMatchOk:'Las contraseñas coinciden', passwordMatchWaiting:'Las contraseñas deben coincidir', showPassword:'Mostrar contraseña', hidePassword:'Ocultar contraseña', showConfirmPassword:'Mostrar contraseña de confirmación', hideConfirmPassword:'Ocultar contraseña de confirmación', confirmPassword:'Confirmar Contraseña', confirmPasswordPlaceholder:'Confirma tu contraseña', country:'País', countryPlaceholder:'Selecciona tu país', language:'Idioma Preferido', languagePlaceholder:'Selecciona tu idioma preferido', termsRequired:'Paso Final — Revisa y Acepta los Términos', termsStep:'Debes completar este paso antes de que se habilite Crear Cuenta.', termsExplain:'Abre los Términos de Servicio completos, desplázate hasta el final y acéptalos antes de crear tu cuenta.', readTerms:'ABRIR TÉRMINOS Y CONDICIONES PARA REVISAR Y ACEPTAR', accepted:'Términos de Servicio aceptados', createAccount:'Crear Cuenta', createBlocked:'Crear Cuenta se habilita después de leer y aceptar los Términos y Condiciones.', creating:'Creando Cuenta…', checkingReadiness:'Comprobando el registro seguro…', readinessUnavailable:'El registro verificado no está disponible temporalmente. Inténtalo de nuevo en breve.', back:'Volver al Inicio de One2OneLove', termsTitle:'Términos de Servicio de One2OneLove', termsIntro:'Lee los Términos de Servicio completos. El botón Aceptar se habilita cuando llegues al final.', scrollHint:'Desplázate hasta el final para habilitar la aceptación.', reachedBottom:'Has llegado al final. Ahora puedes aceptar los Términos.', acceptTerms:'Confirmo que tengo 18+ y Acepto los Términos de Servicio', close:'Cerrar', mismatch:'Las contraseñas no coinciden.', termsError:'Debes leer y aceptar los Términos antes de crear una cuenta.', fieldsError:'Selecciona tu país e idioma preferido.', nameError:'Ingresa tu nombre: se requiere un primer nombre para crear tu cuenta.', verifyTitle:'Verifica tu Correo', verifyBody:'Enviamos un código de verificación de 6 dígitos a la dirección indicada.', verifyNote:'Ingresa el código para verificar tu correo. Los códigos caducan; solicita uno nuevo si es necesario.', code:'Código de verificación de 6 dígitos', verify:'Verificar Correo', verifying:'Verificando…', verifiedTitle:'Correo Verificado', verifiedBody:'Tu correo está verificado. Ahora puedes iniciar sesión en One2OneLove.', resend:'Reenviar Código', resent:'Se envió un nuevo código de verificación.', resending:'Enviando…', signIn:'Ir a Iniciar Sesión', invalidCode:'Ingresa el código de 6 dígitos de tu correo.', registrationFailed:'No se pudo completar el registro. Inténtalo de nuevo.', resendFailed:'No se pudo reenviar el código de verificación.', termsVersionLabel:'Versión de los Términos', privacyNote:'Al aceptar estos Términos, también reconoces la Política de Privacidad de One2OneLove.'
  },
  fr: {
    title:'Créez Votre Compte One2OneLove', subtitle:'Rejoignez One2OneLove et utilisez des outils, ressources et fonctions communautaires.', accountType:'Type de compte', registeredFree:'Compte Gratuit — aucune carte requise', selectedMembership:'Compte sélectionné', fullName:'Votre Nom', fullNamePlaceholder:'Entrez votre nom', firstNameNotice:'VOTRE PRÉNOM sera utilisé lors de l’envoi de NOTES D’AMOUR et de messages à vos proches', email:'Adresse E-mail', emailPlaceholder:'Entrez votre e-mail', password:'Mot de Passe', passwordPlaceholder:'Créez un mot de passe', passwordHelp:'Utilisez au moins 8 caractères. Lettres, chiffres et symboles sont autorisés ; aucun caractère spécial n’est obligatoire.', passwordLengthOk:'8+ caractères', passwordMatchOk:'Les mots de passe correspondent', passwordMatchWaiting:'Les mots de passe doivent correspondre', showPassword:'Afficher le mot de passe', hidePassword:'Masquer le mot de passe', showConfirmPassword:'Afficher la confirmation du mot de passe', hideConfirmPassword:'Masquer la confirmation du mot de passe', confirmPassword:'Confirmer le Mot de Passe', confirmPasswordPlaceholder:'Confirmez votre mot de passe', country:'Pays', countryPlaceholder:'Sélectionnez votre pays', language:'Langue Préférée', languagePlaceholder:'Sélectionnez votre langue préférée', termsRequired:'Dernière Étape — Lire et Accepter les Conditions', termsStep:'Vous devez terminer cette étape avant d’activer Créer un Compte.', termsExplain:'Ouvrez les Conditions complètes, faites défiler jusqu’en bas puis acceptez-les avant de créer votre compte.', readTerms:'OUVRIR LES CONDITIONS POUR LES LIRE ET LES ACCEPTER', accepted:'Conditions acceptées', createAccount:'Créer un Compte', createBlocked:'Créer un Compte se déverrouille après lecture et acceptation des Conditions.', creating:'Création du Compte…', back:'Retour à l’Accueil One2OneLove', termsTitle:'Conditions d’Utilisation de One2OneLove', termsIntro:'Lisez les Conditions complètes. Le bouton Accepter devient disponible après avoir atteint la fin.', scrollHint:'Faites défiler jusqu’en bas pour activer l’acceptation.', reachedBottom:'Vous avez atteint la fin. Vous pouvez maintenant accepter les Conditions.', acceptTerms:'Je Confirme Avoir 18+ et J’accepte les Conditions', close:'Fermer', mismatch:'Les mots de passe ne correspondent pas.', termsError:'Vous devez lire et accepter les Conditions avant de créer un compte.', fieldsError:'Sélectionnez votre pays et votre langue préférée.', nameError:'Veuillez saisir votre nom — un prénom est requis pour créer votre compte.', verifyTitle:'Vérifiez Votre E-mail', verifyBody:'Nous avons envoyé un code de vérification à 6 chiffres à l’adresse ci-dessous.', verifyNote:'Saisissez le code pour vérifier votre e-mail. Les codes expirent ; demandez-en un nouveau si nécessaire.', code:'Code de vérification à 6 chiffres', verify:'Vérifier l’E-mail', verifying:'Vérification…', verifiedTitle:'E-mail Vérifié', verifiedBody:'Votre e-mail est vérifié. Vous pouvez maintenant vous connecter à One2OneLove.', resend:'Renvoyer le Code', resent:'Un nouveau code de vérification a été envoyé.', resending:'Envoi…', signIn:'Aller à la Connexion', invalidCode:'Saisissez le code à 6 chiffres reçu par e-mail.', registrationFailed:'L’inscription a échoué. Veuillez réessayer.', resendFailed:'Impossible de renvoyer le code de vérification.', termsVersionLabel:'Version des Conditions', privacyNote:'En acceptant ces Conditions, vous reconnaissez également la Politique de Confidentialité de One2OneLove.'
  },
  it: {
    title:'Crea il Tuo Account One2OneLove', subtitle:'Unisciti a One2OneLove e inizia a usare strumenti, risorse e funzioni della community.', accountType:'Tipo di account', registeredFree:'Account Gratuito — nessuna carta richiesta', selectedMembership:'Account selezionato', fullName:'Il Tuo Nome', fullNamePlaceholder:'Inserisci il tuo nome', firstNameNotice:'IL TUO NOME verrà utilizzato quando invii NOTE D’AMORE e messaggi ai tuoi cari', email:'Indirizzo E-mail', emailPlaceholder:'Inserisci la tua e-mail', password:'Password', passwordPlaceholder:'Crea una password', passwordHelp:'Usa almeno 8 caratteri. Sono consentiti lettere, numeri e simboli; non è richiesto un carattere speciale.', passwordLengthOk:'8+ caratteri', passwordMatchOk:'Le password corrispondono', passwordMatchWaiting:'Le password devono corrispondere', showPassword:'Mostra password', hidePassword:'Nascondi password', showConfirmPassword:'Mostra conferma password', hideConfirmPassword:'Nascondi conferma password', confirmPassword:'Conferma Password', confirmPasswordPlaceholder:'Conferma la tua password', country:'Paese', countryPlaceholder:'Seleziona il tuo paese', language:'Lingua Preferita', languagePlaceholder:'Seleziona la lingua preferita', termsRequired:'Ultimo Passaggio — Leggi e Accetta i Termini', termsStep:'Devi completare questo passaggio prima di poter creare l’account.', termsExplain:'Apri i Termini di Servizio completi, scorri fino in fondo e accettali prima di creare il tuo account.', readTerms:'APRI I TERMINI E CONDIZIONI PER LEGGERE E ACCETTARE', accepted:'Termini accettati', createAccount:'Crea Account', createBlocked:'Crea Account si abilita dopo aver letto e accettato i Termini e Condizioni.', creating:'Creazione Account…', back:'Torna alla Home di One2OneLove', termsTitle:'Termini di Servizio di One2OneLove', termsIntro:'Leggi i Termini completi. Il pulsante Accetta si abilita dopo aver raggiunto il fondo.', scrollHint:'Scorri fino in fondo per abilitare l’accettazione.', reachedBottom:'Hai raggiunto la fine. Ora puoi accettare i Termini.', acceptTerms:'Confermo di Avere 18+ e Accetto i Termini', close:'Chiudi', mismatch:'Le password non corrispondono.', termsError:'Devi leggere e accettare i Termini prima di creare un account.', fieldsError:'Seleziona il tuo paese e la lingua preferita.', nameError:'Inserisci il tuo nome: è necessario un nome per creare il tuo account.', verifyTitle:'Verifica la Tua E-mail', verifyBody:'Abbiamo inviato un codice di verifica a 6 cifre all’indirizzo indicato.', verifyNote:'Inserisci il codice per verificare la tua e-mail. I codici scadono; richiedine uno nuovo se necessario.', code:'Codice di verifica a 6 cifre', verify:'Verifica E-mail', verifying:'Verifica…', verifiedTitle:'E-mail Verificata', verifiedBody:'La tua e-mail è verificata. Ora puoi accedere a One2OneLove.', resend:'Invia di Nuovo il Codice', resent:'È stato inviato un nuovo codice di verifica.', resending:'Invio…', signIn:'Vai all’Accesso', invalidCode:'Inserisci il codice a 6 cifre ricevuto via e-mail.', registrationFailed:'Registrazione non riuscita. Riprova.', resendFailed:'Impossibile reinviare il codice di verifica.', termsVersionLabel:'Versione dei Termini', privacyNote:'Accettando questi Termini, riconosci anche l’Informativa sulla Privacy di One2OneLove.'
  },
  de: {
    title:'Ihr One2OneLove-Konto Erstellen', subtitle:'Treten Sie One2OneLove bei und nutzen Sie Beziehungstools, Ressourcen und Community-Funktionen.', accountType:'Kontotyp', registeredFree:'Kostenloses Konto — keine Karte erforderlich', selectedMembership:'Ausgewähltes Konto', fullName:'Ihr Name', fullNamePlaceholder:'Geben Sie Ihren Namen ein', firstNameNotice:'DEIN VORNAME wird beim Senden von LIEBESBOTSCHAFTEN und Nachrichten an deine Liebsten verwendet', email:'E-Mail-Adresse', emailPlaceholder:'Geben Sie Ihre E-Mail ein', password:'Passwort', passwordPlaceholder:'Passwort erstellen', passwordHelp:'Verwenden Sie mindestens 8 Zeichen. Buchstaben, Zahlen und Symbole sind erlaubt; ein Sonderzeichen ist nicht erforderlich.', passwordLengthOk:'8+ Zeichen', passwordMatchOk:'Passwörter stimmen überein', passwordMatchWaiting:'Passwörter müssen übereinstimmen', showPassword:'Passwort anzeigen', hidePassword:'Passwort ausblenden', showConfirmPassword:'Passwortbestätigung anzeigen', hideConfirmPassword:'Passwortbestätigung ausblenden', confirmPassword:'Passwort Bestätigen', confirmPasswordPlaceholder:'Bestätigen Sie Ihr Passwort', country:'Land', countryPlaceholder:'Wählen Sie Ihr Land', language:'Bevorzugte Sprache', languagePlaceholder:'Wählen Sie Ihre bevorzugte Sprache', termsRequired:'Letzter Schritt — Bedingungen Lesen und Akzeptieren', termsStep:'Sie müssen diesen Schritt abschließen, bevor Konto Erstellen aktiviert wird.', termsExplain:'Öffnen Sie die vollständigen Nutzungsbedingungen, scrollen Sie bis zum Ende und akzeptieren Sie sie vor der Kontoerstellung.', readTerms:'BEDINGUNGEN ÖFFNEN, LESEN UND AKZEPTIEREN', accepted:'Nutzungsbedingungen akzeptiert', createAccount:'Konto Erstellen', createBlocked:'Konto Erstellen wird nach dem Lesen und Akzeptieren der Bedingungen freigeschaltet.', creating:'Konto Wird Erstellt…', back:'Zurück zur One2OneLove-Startseite', termsTitle:'One2OneLove-Nutzungsbedingungen', termsIntro:'Lesen Sie die vollständigen Bedingungen. Die Schaltfläche Akzeptieren wird am Ende aktiviert.', scrollHint:'Scrollen Sie bis zum Ende, um die Zustimmung zu aktivieren.', reachedBottom:'Sie haben das Ende erreicht. Sie können die Bedingungen jetzt akzeptieren.', acceptTerms:'Ich Bestätige, dass ich 18+ bin, und Akzeptiere die Bedingungen', close:'Schließen', mismatch:'Die Passwörter stimmen nicht überein.', termsError:'Sie müssen die Bedingungen lesen und akzeptieren, bevor Sie ein Konto erstellen.', fieldsError:'Wählen Sie Ihr Land und Ihre bevorzugte Sprache.', nameError:'Bitte geben Sie Ihren Namen ein — ein Vorname ist erforderlich, um Ihr Konto zu erstellen.', verifyTitle:'Bestätigen Sie Ihre E-Mail', verifyBody:'Wir haben einen 6-stelligen Bestätigungscode an die unten angegebene Adresse gesendet.', verifyNote:'Geben Sie den Code ein, um Ihre E-Mail zu bestätigen. Codes laufen ab; fordern Sie bei Bedarf einen neuen an.', code:'6-stelliger Bestätigungscode', verify:'E-Mail Bestätigen', verifying:'Wird Bestätigt…', verifiedTitle:'E-Mail Bestätigt', verifiedBody:'Ihre E-Mail ist bestätigt. Sie können sich jetzt bei One2OneLove anmelden.', resend:'Code Erneut Senden', resent:'Ein neuer Bestätigungscode wurde gesendet.', resending:'Wird Gesendet…', signIn:'Zur Anmeldung', invalidCode:'Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein.', registrationFailed:'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.', resendFailed:'Der Bestätigungscode konnte nicht erneut gesendet werden.', termsVersionLabel:'Version der Bedingungen', privacyNote:'Mit der Annahme dieser Bedingungen erkennen Sie auch die Datenschutzrichtlinie von One2OneLove an.'
  },
};

export default function LaunchRegularUserForm({ onBack, selectedPlan = 'Free', freeAccount = true, foundingIntent = false }) {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = translations[currentLanguage] || translations.en;
  const readinessCopy = {
    checking: t.checkingReadiness || translations.en.checkingReadiness,
    unavailable: t.readinessUnavailable || translations.en.readinessUnavailable,
  };
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
  const [checkingReadiness, setCheckingReadiness] = useState(true);
  const [signupReady, setSignupReady] = useState(false);
  const [readinessError, setReadinessError] = useState('');
  const [signupResumed, setSignupResumed] = useState(false);

  const passwordLengthOk = formData.password.length >= 8;
  const passwordsMatch = Boolean(formData.confirmPassword) && formData.password === formData.confirmPassword;

  useEffect(() => {
    let active = true;
    const check = async () => {
      setCheckingReadiness(true);
      const result = await getLaunchSignupReadiness();
      if (!active) return;
      setSignupReady(result.success === true);
      setReadinessError(result.success ? '' : (result.error || readinessCopy.unavailable));
      setCheckingReadiness(false);
    };
    check();
    return () => { active = false; };
  }, [readinessCopy.unavailable]);

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
  const signupContext = () => ({
    name: formData.fullName,
    email: formData.email.trim().toLowerCase(),
    country: formData.country,
    preferredLanguage: formData.preferredLanguage,
    termsAcceptedAt,
    termsVersion: TERMS_VERSION,
    privacyPolicyAcknowledged: true,
    age18Confirmed: true,
    selectedPlan,
    freeAccount,
  });

  const handleSubmit = async event => {
    event.preventDefault();
    // FIRST NAME is mandatory (owner, 2026-10-08): signup collects one
    // name field, and its first token is the first name that signs Love
    // Notes — a blank or whitespace-only name has no first token, so
    // account creation stops here. The server enforces the same rule in
    // worker/launch-auth.ts registrationContext.
    if (!String(formData.fullName || '').trim().split(/\s+/).filter(Boolean)[0]) return toast.error(t.nameError);
    if (formData.password !== formData.confirmPassword) return toast.error(t.mismatch);
    if (!formData.country || !formData.preferredLanguage) return toast.error(t.fieldsError);
    if (!termsAcceptedAt) return toast.error(t.termsError);
    if (!signupReady) return toast.error(readinessError || readinessCopy.unavailable);

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
        selectedPlan,
        freeAccount,
      });
      if (result?.success && result.emailVerificationRequired) {
        setSuccessEmail(formData.email.trim().toLowerCase());
        setOtp('');
        setSignupResumed(result.resumed === true);
        toast.success(t.verifyTitle);
      } else toast.error(currentLanguage === 'en' ? (result?.error || t.registrationFailed) : t.registrationFailed);
    } catch (error) {
      toast.error(currentLanguage === 'en' ? (error?.message || t.registrationFailed) : t.registrationFailed);
    } finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true);
    const result = await resendLaunchVerification(successEmail);
    if (result.success) toast.success(t.resent);
    else toast.error(currentLanguage === 'en' ? (result.error || t.resendFailed) : t.resendFailed);
    setResendLoading(false);
  };

  const handleVerify = async event => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) return toast.error(t.invalidCode);
    setVerifyLoading(true);
    const result = await verifyLaunchEmail(successEmail, otp, signupContext());
    if (result.success) {
      setVerified(true);
      toast.success(t.verifiedTitle);
    } else toast.error(result.error || t.invalidCode);
    setVerifyLoading(false);
  };

  const cardClass = 'mx-auto max-w-xl shadow-2xl';

  if (successEmail) {
    return (
      <Card className={cardClass}>
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
              {signupResumed && <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{t.resumedNote || translations.en.resumedNote}</div>}
              <form onSubmit={handleVerify} className="space-y-4">
                <label htmlFor="signup-email-verification-code" className="block text-left text-sm font-semibold text-gray-700">{t.code}</label>
                <Input
                  id="signup-email-verification-code"
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
            <Button type="button" onClick={() => navigate(foundingIntent ? '/SignIn?redirect=%2FTokens' : createPageUrl('SignIn'))} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-white">{t.signIn}</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cardClass}>
        <CardHeader>
          <button type="button" onClick={goBack} className="mb-4 inline-flex items-center text-gray-600 transition-colors hover:text-gray-800"><ArrowLeft size={20} className="mr-2"/>{t.back}</button>
          <div className="mb-2 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg"><Heart className="h-6 w-6 fill-white text-white"/></div><CardTitle className="text-3xl">{t.title}</CardTitle></div>
          <p className="text-gray-600">{t.subtitle}</p>
          <div className={`mt-4 inline-flex rounded-full border px-4 py-2 text-sm font-black ${freeAccount?'border-cyan-200 bg-cyan-50 text-cyan-800':'border-purple-200 bg-purple-50 text-purple-800'}`}>
            {freeAccount ? t.registeredFree : `${t.selectedMembership}: ${selectedPlan}`}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {(checkingReadiness || !signupReady) && <div className={`rounded-xl border p-4 text-sm ${checkingReadiness ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{checkingReadiness ? readinessCopy.checking : (readinessError || readinessCopy.unavailable)}</div>}
            <Field htmlFor="signup-full-name" label={`${t.fullName} *`} icon={<User size={20}/>}><Input id="signup-full-name" value={formData.fullName} onChange={e => setFormData({...formData,fullName:e.target.value})} placeholder={t.fullNamePlaceholder} className="pl-12" required/></Field>
            <p className="-mt-3 text-xs font-semibold text-purple-800">{t.firstNameNotice}</p>
            <Field htmlFor="signup-email" label={`${t.email} *`} icon={<Mail size={20}/>}><Input id="signup-email" type="email" value={formData.email} onChange={e => setFormData({...formData,email:e.target.value})} placeholder={t.emailPlaceholder} className="pl-12" required/></Field>
            <Field htmlFor="signup-password" label={`${t.password} *`} icon={<Lock size={20}/>}>
              <Input id="signup-password" type={showPassword?'text':'password'} value={formData.password} onChange={e => setFormData({...formData,password:e.target.value})} placeholder={t.passwordPlaceholder} className="pl-12 pr-12" minLength={8} autoComplete="new-password" aria-describedby="signup-password-help" required/>
              <button type="button" aria-label={showPassword ? (t.hidePassword || t.password) : (t.showPassword || t.password)} onClick={() => setShowPassword(v=>!v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button>
            </Field>
            <div id="signup-password-help" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{t.passwordHelp}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                <span className={passwordLengthOk?'text-green-700':'text-slate-500'}>{passwordLengthOk?'✓':'○'} {t.passwordLengthOk}</span>
                <span className={passwordsMatch?'text-green-700':'text-slate-500'}>{passwordsMatch?'✓':'○'} {passwordsMatch?t.passwordMatchOk:t.passwordMatchWaiting}</span>
              </div>
            </div>
            <Field htmlFor="signup-confirm-password" label={`${t.confirmPassword} *`} icon={<Lock size={20}/>}>
              <Input id="signup-confirm-password" type={showConfirmPassword?'text':'password'} value={formData.confirmPassword} onChange={e => setFormData({...formData,confirmPassword:e.target.value})} placeholder={t.confirmPasswordPlaceholder} className="pl-12 pr-12" minLength={8} autoComplete="new-password" required/>
              <button type="button" aria-label={showConfirmPassword ? (t.hideConfirmPassword || t.confirmPassword) : (t.showConfirmPassword || t.confirmPassword)} onClick={() => setShowConfirmPassword(v=>!v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showConfirmPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button>
            </Field>

            <div><label htmlFor="signup-country" className="mb-2 block text-sm font-medium text-gray-700">{t.country} *</label><div className="relative"><Globe2 size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><select id="signup-country" value={formData.country} onChange={e => setFormData({...formData,country:e.target.value})} className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-700" required><option value="">{t.countryPlaceholder}</option>{countryOptions.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></div></div>
            <div><label htmlFor="signup-language" className="mb-2 block text-sm font-medium text-gray-700">{t.language} *</label><div className="relative"><Languages size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><select id="signup-language" value={formData.preferredLanguage} onChange={e => setFormData({...formData,preferredLanguage:e.target.value})} className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 text-gray-700" required><option value="">{t.languagePlaceholder}</option>{languageOptions.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div></div>

            <div className={`rounded-2xl border-2 p-5 ${termsAcceptedAt?'border-green-400 bg-green-50':'border-amber-300 bg-amber-50'}`} aria-live="polite">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${termsAcceptedAt?'bg-green-600 text-white':'bg-amber-500 text-white'}`}>{termsAcceptedAt?'✓':'!'}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-black text-gray-900">{t.termsRequired}</p>
                  <p className="mt-1 text-sm font-semibold text-amber-900/80">{termsAcceptedAt?t.accepted:t.termsStep}</p>
                  <p className="mt-2 text-sm text-gray-700">{t.termsExplain}</p>
                </div>
              </div>
              {!termsAcceptedAt ? (
                <Button type="button" onClick={openTerms} className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 py-5 text-sm font-black text-white shadow-md hover:from-amber-600 hover:to-orange-600">
                  {t.readTerms}
                </Button>
              ) : (
                <button type="button" onClick={openTerms} className="mt-3 text-sm font-bold text-blue-700 underline hover:text-blue-800">{t.readTerms}</button>
              )}
            </div>

            {!termsAcceptedAt && <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-600">{t.createBlocked}</p>}
            <Button type="submit" disabled={isLoading || checkingReadiness || !signupReady || !termsAcceptedAt || !passwordLengthOk || !passwordsMatch} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{isLoading?<><Loader2 className="mr-2 h-5 w-5 animate-spin"/>{t.creating}</>:t.createAccount}</Button>
          </form>
        </CardContent>
      </Card>

      {termsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
            <button type="button" onClick={() => setTermsOpen(false)} aria-label={t.close} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"><X size={20}/></button>
            <div className="border-b p-6 pb-4 pr-16"><p className="text-xs font-black uppercase tracking-wider text-blue-600">Required before account creation</p><h2 className="mt-1 text-2xl font-bold text-gray-900">{t.termsTitle}</h2><p className="mt-2 text-sm text-gray-600">{t.termsIntro}</p></div>
            <div ref={scrollRef} onScroll={handleTermsScroll} className="mx-6 min-h-0 max-h-[58vh] overflow-y-auto rounded-xl border p-5">{terms.map(([heading,body]) => <section key={heading} className="mb-5"><h3 className="mb-1 font-bold text-gray-900">{heading}</h3><p className="text-sm leading-6 text-gray-600">{body}</p></section>)}<p className="text-sm font-semibold text-gray-700">{t.privacyNote}</p><p className="mt-4 text-xs text-gray-500">{t.termsVersionLabel}: {TERMS_VERSION}</p></div>
            <div className="border-t p-6 pt-4"><p className={`mb-3 rounded-lg px-3 py-2 text-center text-sm font-bold ${termsScrolled?'bg-green-50 text-green-700':'bg-amber-50 text-amber-800'}`}>{termsScrolled?t.reachedBottom:t.scrollHint}</p><Button type="button" onClick={acceptTerms} disabled={!termsScrolled} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-5 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{t.acceptTerms}</Button></div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, icon, children, htmlFor }) {
  return <div><label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-gray-700">{label}</label><div className="relative"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>{children}</div></div>;
}
