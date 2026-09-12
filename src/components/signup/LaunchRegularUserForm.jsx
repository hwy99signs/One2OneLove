import React, { useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Globe2, Heart, Languages, Loader2, Lock, Mail, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { registerLaunchUser, resendLaunchVerification } from "@/lib/launchSignupService";
import termsEn from "@/content/terms/en";
import termsEs from "@/content/terms/es";
import termsFr from "@/content/terms/fr";
import termsIt from "@/content/terms/it";
import termsDe from "@/content/terms/de";

const TERMS_VERSION = "2026-09-11";

const termsByLanguage = { en: termsEn, es: termsEs, fr: termsFr, it: termsIt, de: termsDe };

const languageOptions = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
];

const countryCodes = "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(" ");

const localeByLanguage = { en: "en-US", es: "es-ES", fr: "fr-FR", it: "it-IT", de: "de-DE" };

const translations = {
  en: {
    title: "Create Your One2OneLove Account",
    subtitle: "Create your account to join One2OneLove and access relationship tools as they become available.",
    fullName: "Your Name", fullNamePlaceholder: "Enter your name",
    email: "Email Address", emailPlaceholder: "Enter your email",
    password: "Password", passwordPlaceholder: "Create a password (minimum 8 characters)",
    confirmPassword: "Confirm Password", confirmPasswordPlaceholder: "Confirm your password",
    country: "Country", countryPlaceholder: "Select the country you are signing up from",
    language: "Preferred Language", languagePlaceholder: "Select your preferred language",
    termsRequired: "Terms acceptance is required.",
    termsExplain: "Open the full Terms of Service, scroll all the way to the bottom, and accept them before creating your account.",
    readTerms: "Read Full Terms of Service", accepted: "Terms of Service accepted",
    createAccount: "Create Account", creating: "Creating Account...", back: "Back to One2OneLove Home",
    termsTitle: "One2OneLove Terms of Service",
    termsIntro: "Please read the complete Terms of Service. The Accept button becomes available only after you scroll to the bottom.",
    scrollHint: "Scroll to the bottom to enable acceptance.", reachedBottom: "You reached the end. You may now accept the Terms of Service.",
    acceptTerms: "I Am 18+ and Accept the Terms of Service", close: "Close",
    mismatch: "Passwords do not match.", termsError: "You must read and accept the Terms of Service before creating an account.",
    fieldsError: "Please select your country and preferred language.",
    verifyTitle: "Verify Your Email",
    verifyBody: "We sent a verification email to the address below. You must click the verification link in that email before you can sign in to One2OneLove.",
    verifyNote: "Your account will not be approved for access until the email address is verified.",
    resend: "Resend Verification Email", resent: "Verification email sent again.", resending: "Sending...",
    signIn: "Go to Sign In", privacyNote: "By accepting these Terms, you also acknowledge the One2OneLove Privacy Policy.",
  },
  es: {
    title: "Crea tu cuenta de One2OneLove", subtitle: "Crea tu cuenta para unirte a One2OneLove y acceder a las herramientas para relaciones a medida que estén disponibles.",
    fullName: "Tu nombre", fullNamePlaceholder: "Ingresa tu nombre", email: "Correo electrónico", emailPlaceholder: "Ingresa tu correo",
    password: "Contraseña", passwordPlaceholder: "Crea una contraseña (mínimo 8 caracteres)", confirmPassword: "Confirmar contraseña", confirmPasswordPlaceholder: "Confirma tu contraseña",
    country: "País", countryPlaceholder: "Selecciona el país desde el que te registras", language: "Idioma preferido", languagePlaceholder: "Selecciona tu idioma preferido",
    termsRequired: "Es obligatorio aceptar los Términos.", termsExplain: "Abre los Términos de Servicio completos, desplázate hasta el final y acéptalos antes de crear tu cuenta.",
    readTerms: "Leer los Términos de Servicio completos", accepted: "Términos de Servicio aceptados", createAccount: "Crear cuenta", creating: "Creando cuenta...", back: "Volver al inicio de One2OneLove",
    termsTitle: "Términos de Servicio de One2OneLove", termsIntro: "Lee los Términos de Servicio completos. El botón Aceptar se habilita únicamente después de llegar al final.",
    scrollHint: "Desplázate hasta el final para habilitar la aceptación.", reachedBottom: "Has llegado al final. Ahora puedes aceptar los Términos de Servicio.", acceptTerms: "Confirmo que tengo 18+ y acepto los Términos de Servicio", close: "Cerrar",
    mismatch: "Las contraseñas no coinciden.", termsError: "Debes leer y aceptar los Términos de Servicio antes de crear una cuenta.", fieldsError: "Selecciona tu país e idioma preferido.",
    verifyTitle: "Verifica tu correo electrónico", verifyBody: "Enviamos un correo de verificación a la dirección indicada. Debes hacer clic en el enlace de verificación antes de iniciar sesión en One2OneLove.",
    verifyNote: "Tu cuenta no será aprobada para el acceso hasta que se verifique el correo electrónico.", resend: "Reenviar correo de verificación", resent: "Correo de verificación reenviado.", resending: "Enviando...", signIn: "Ir a iniciar sesión",
    privacyNote: "Al aceptar estos Términos, también reconoces la Política de Privacidad de One2OneLove.",
  },
  fr: {
    title: "Créer votre compte One2OneLove", subtitle: "Créez votre compte pour rejoindre One2OneLove et accéder aux outils relationnels à mesure qu’ils deviennent disponibles.",
    fullName: "Votre nom", fullNamePlaceholder: "Entrez votre nom", email: "Adresse e-mail", emailPlaceholder: "Entrez votre e-mail",
    password: "Mot de passe", passwordPlaceholder: "Créez un mot de passe (8 caractères minimum)", confirmPassword: "Confirmer le mot de passe", confirmPasswordPlaceholder: "Confirmez votre mot de passe",
    country: "Pays", countryPlaceholder: "Sélectionnez le pays depuis lequel vous vous inscrivez", language: "Langue préférée", languagePlaceholder: "Sélectionnez votre langue préférée",
    termsRequired: "L’acceptation des Conditions est obligatoire.", termsExplain: "Ouvrez les Conditions d’Utilisation complètes, faites défiler jusqu’en bas et acceptez-les avant de créer votre compte.",
    readTerms: "Lire l’intégralité des Conditions d’Utilisation", accepted: "Conditions d’Utilisation acceptées", createAccount: "Créer un compte", creating: "Création du compte...", back: "Retour à l’accueil One2OneLove",
    termsTitle: "Conditions d’Utilisation de One2OneLove", termsIntro: "Veuillez lire l’intégralité des Conditions d’Utilisation. Le bouton Accepter ne devient actif qu’après avoir atteint la fin.",
    scrollHint: "Faites défiler jusqu’en bas pour activer l’acceptation.", reachedBottom: "Vous avez atteint la fin. Vous pouvez maintenant accepter les Conditions d’Utilisation.", acceptTerms: "Je confirme avoir 18+ et j’accepte les Conditions d’Utilisation", close: "Fermer",
    mismatch: "Les mots de passe ne correspondent pas.", termsError: "Vous devez lire et accepter les Conditions d’Utilisation avant de créer un compte.", fieldsError: "Sélectionnez votre pays et votre langue préférée.",
    verifyTitle: "Vérifiez votre e-mail", verifyBody: "Nous avons envoyé un e-mail de vérification à l’adresse ci-dessous. Vous devez cliquer sur le lien de vérification avant de pouvoir vous connecter à One2OneLove.",
    verifyNote: "Votre compte ne sera pas approuvé pour l’accès tant que l’adresse e-mail n’aura pas été vérifiée.", resend: "Renvoyer l’e-mail de vérification", resent: "E-mail de vérification renvoyé.", resending: "Envoi...", signIn: "Aller à la connexion",
    privacyNote: "En acceptant ces Conditions, vous reconnaissez également la Politique de Confidentialité de One2OneLove.",
  },
  it: {
    title: "Crea il tuo account One2OneLove", subtitle: "Crea il tuo account per unirti a One2OneLove e accedere agli strumenti per le relazioni man mano che diventano disponibili.",
    fullName: "Il tuo nome", fullNamePlaceholder: "Inserisci il tuo nome", email: "Indirizzo e-mail", emailPlaceholder: "Inserisci la tua e-mail",
    password: "Password", passwordPlaceholder: "Crea una password (minimo 8 caratteri)", confirmPassword: "Conferma password", confirmPasswordPlaceholder: "Conferma la tua password",
    country: "Paese", countryPlaceholder: "Seleziona il paese da cui ti stai registrando", language: "Lingua preferita", languagePlaceholder: "Seleziona la lingua preferita",
    termsRequired: "L’accettazione dei Termini è obbligatoria.", termsExplain: "Apri i Termini di Servizio completi, scorri fino in fondo e accettali prima di creare il tuo account.",
    readTerms: "Leggi i Termini di Servizio completi", accepted: "Termini di Servizio accettati", createAccount: "Crea account", creating: "Creazione account...", back: "Torna alla home di One2OneLove",
    termsTitle: "Termini di Servizio di One2OneLove", termsIntro: "Leggi integralmente i Termini di Servizio. Il pulsante Accetta si abilita solo dopo aver raggiunto il fondo.",
    scrollHint: "Scorri fino in fondo per abilitare l’accettazione.", reachedBottom: "Hai raggiunto la fine. Ora puoi accettare i Termini di Servizio.", acceptTerms: "Confermo di avere 18+ e accetto i Termini di Servizio", close: "Chiudi",
    mismatch: "Le password non corrispondono.", termsError: "Devi leggere e accettare i Termini di Servizio prima di creare un account.", fieldsError: "Seleziona il tuo paese e la lingua preferita.",
    verifyTitle: "Verifica la tua e-mail", verifyBody: "Abbiamo inviato un’e-mail di verifica all’indirizzo indicato. Devi fare clic sul link di verifica prima di poter accedere a One2OneLove.",
    verifyNote: "Il tuo account non sarà approvato per l’accesso finché l’indirizzo e-mail non sarà verificato.", resend: "Invia di nuovo l’e-mail di verifica", resent: "E-mail di verifica inviata di nuovo.", resending: "Invio...", signIn: "Vai all’accesso",
    privacyNote: "Accettando questi Termini, riconosci anche l’Informativa sulla Privacy di One2OneLove.",
  },
  de: {
    title: "Ihr One2OneLove-Konto erstellen", subtitle: "Erstellen Sie Ihr Konto, um One2OneLove beizutreten und auf Beziehungstools zuzugreifen, sobald sie verfügbar werden.",
    fullName: "Ihr Name", fullNamePlaceholder: "Geben Sie Ihren Namen ein", email: "E-Mail-Adresse", emailPlaceholder: "Geben Sie Ihre E-Mail ein",
    password: "Passwort", passwordPlaceholder: "Erstellen Sie ein Passwort (mindestens 8 Zeichen)", confirmPassword: "Passwort bestätigen", confirmPasswordPlaceholder: "Bestätigen Sie Ihr Passwort",
    country: "Land", countryPlaceholder: "Wählen Sie das Land, aus dem Sie sich registrieren", language: "Bevorzugte Sprache", languagePlaceholder: "Wählen Sie Ihre bevorzugte Sprache",
    termsRequired: "Die Zustimmung zu den Bedingungen ist erforderlich.", termsExplain: "Öffnen Sie die vollständigen Nutzungsbedingungen, scrollen Sie bis zum Ende und akzeptieren Sie sie, bevor Sie Ihr Konto erstellen.",
    readTerms: "Vollständige Nutzungsbedingungen lesen", accepted: "Nutzungsbedingungen akzeptiert", createAccount: "Konto erstellen", creating: "Konto wird erstellt...", back: "Zurück zur One2OneLove-Startseite",
    termsTitle: "One2OneLove-Nutzungsbedingungen", termsIntro: "Bitte lesen Sie die vollständigen Nutzungsbedingungen. Die Schaltfläche Akzeptieren wird erst aktiviert, nachdem Sie bis zum Ende gescrollt haben.",
    scrollHint: "Scrollen Sie bis zum Ende, um die Zustimmung zu aktivieren.", reachedBottom: "Sie haben das Ende erreicht. Sie können die Nutzungsbedingungen jetzt akzeptieren.", acceptTerms: "Ich bestätige, dass ich 18+ bin, und akzeptiere die Nutzungsbedingungen", close: "Schließen",
    mismatch: "Die Passwörter stimmen nicht überein.", termsError: "Sie müssen die Nutzungsbedingungen lesen und akzeptieren, bevor Sie ein Konto erstellen.", fieldsError: "Wählen Sie Ihr Land und Ihre bevorzugte Sprache.",
    verifyTitle: "Bestätigen Sie Ihre E-Mail", verifyBody: "Wir haben eine Bestätigungs-E-Mail an die unten angegebene Adresse gesendet. Sie müssen den Bestätigungslink anklicken, bevor Sie sich bei One2OneLove anmelden können.",
    verifyNote: "Ihr Konto wird erst für den Zugriff freigegeben, nachdem die E-Mail-Adresse bestätigt wurde.", resend: "Bestätigungs-E-Mail erneut senden", resent: "Bestätigungs-E-Mail wurde erneut gesendet.", resending: "Wird gesendet...", signIn: "Zur Anmeldung",
    privacyNote: "Mit der Annahme dieser Bedingungen erkennen Sie auch die Datenschutzrichtlinie von One2OneLove an.",
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
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      names = null;
    }
    return countryCodes
      .map((code) => ({ code, name: names?.of(code) || code }))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [currentLanguage]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    preferredLanguage: languageOptions.some((item) => item.code === currentLanguage) ? currentLanguage : "en",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const openTerms = () => {
    setTermsScrolled(false);
    setTermsOpen(true);
    window.setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 0);
  };

  const handleTermsScroll = (event) => {
    const node = event.currentTarget;
    if (node.scrollTop + node.clientHeight >= node.scrollHeight - 10) setTermsScrolled(true);
  };

  const acceptTerms = () => {
    if (!termsScrolled) return;
    setTermsAcceptedAt(new Date().toISOString());
    setTermsOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(t.mismatch);
      return;
    }
    if (!formData.country || !formData.preferredLanguage) {
      toast.error(t.fieldsError);
      return;
    }
    if (!termsAcceptedAt) {
      toast.error(t.termsError);
      return;
    }

    setIsLoading(true);
    try {
      const result = await registerLaunchUser({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        country: formData.country,
        preferredLanguage: formData.preferredLanguage,
        termsAcceptedAt,
        termsVersion: TERMS_VERSION,
        privacyPolicyAcknowledged: true,
        age18Confirmed: true,
      });

      if (result?.success && result.emailVerificationRequired) {
        setSuccessEmail(formData.email);
        toast.success(t.verifyTitle);
      } else {
        toast.error(result?.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Launch signup error:", error);
      toast.error(error?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    const result = await resendLaunchVerification(successEmail);
    if (result.success) toast.success(t.resent);
    else toast.error(result.error || "Unable to resend verification email.");
    setResendLoading(false);
  };

  if (successEmail) {
    return (
      <Card className="max-w-xl mx-auto shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.verifyTitle}</h1>
          <p className="text-gray-600 mb-3">{t.verifyBody}</p>
          <p className="font-semibold text-gray-800 break-all mb-3">{successEmail}</p>
          <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-4 mb-6">{t.verifyNote}</div>
          <div className="grid gap-3">
            <Button type="button" variant="outline" onClick={handleResend} disabled={resendLoading}>
              {resendLoading ? t.resending : t.resend}
            </Button>
            <Button type="button" onClick={() => navigate(createPageUrl("SignIn"))} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              {t.signIn}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-xl mx-auto shadow-2xl">
        <CardHeader>
          <button type="button" onClick={onBack} className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors">
            <ArrowLeft size={20} className="mr-2" />{t.back}
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <CardTitle className="text-3xl">{t.title}</CardTitle>
          </div>
          <p className="text-gray-600">{t.subtitle}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label={`${t.fullName} *`} icon={<User size={20} />}>
              <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} placeholder={t.fullNamePlaceholder} className="pl-12" required />
            </Field>

            <Field label={`${t.email} *`} icon={<Mail size={20} />}>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder={t.emailPlaceholder} className="pl-12" required />
            </Field>

            <Field label={`${t.password} *`} icon={<Lock size={20} />}>
              <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={t.passwordPlaceholder} className="pl-12 pr-12" minLength={8} required />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </Field>

            <Field label={`${t.confirmPassword} *`} icon={<Lock size={20} />}>
              <Input type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder={t.confirmPasswordPlaceholder} className="pl-12 pr-12" minLength={8} required />
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
            </Field>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.country} *</label>
              <div className="relative">
                <Globe2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700" required>
                  <option value="">{t.countryPlaceholder}</option>
                  {countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.language} *</label>
              <div className="relative">
                <Languages size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select value={formData.preferredLanguage} onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700" required>
                  <option value="">{t.languagePlaceholder}</option>
                  {languageOptions.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                </select>
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${termsAcceptedAt ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
              <p className="font-semibold text-gray-900 mb-1">{t.termsRequired}</p>
              <p className="text-sm text-gray-600 mb-3">{t.termsExplain}</p>
              <button type="button" onClick={openTerms} className="text-sm font-bold text-blue-600 hover:text-blue-700 underline">{t.readTerms}</button>
              {termsAcceptedAt && <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mt-3"><CheckCircle2 size={18} />{t.accepted}</div>}
            </div>

            <Button type="submit" disabled={isLoading || !termsAcceptedAt} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 disabled:opacity-50">
              {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t.creating}</> : t.createAccount}
            </Button>
          </form>
        </CardContent>
      </Card>

      {termsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col relative">
            <button type="button" onClick={() => setTermsOpen(false)} aria-label={t.close} className="absolute right-4 top-4 z-10 w-9 h-9 rounded-full bg-gray-100 grid place-items-center text-gray-600 hover:bg-gray-200"><X size={20} /></button>
            <div className="p-6 pb-3 pr-16">
              <h2 className="text-2xl font-bold text-gray-900">{t.termsTitle}</h2>
              <p className="text-sm text-gray-600 mt-2">{t.termsIntro}</p>
            </div>
            <div ref={scrollRef} onScroll={handleTermsScroll} className="mx-6 border rounded-xl p-5 overflow-y-auto min-h-0 max-h-[58vh]">
              {terms.map(([heading, body]) => <section key={heading} className="mb-5"><h3 className="font-bold text-gray-900 mb-1">{heading}</h3><p className="text-sm leading-6 text-gray-600">{body}</p></section>)}
              <p className="text-sm font-semibold text-gray-700">{t.privacyNote}</p>
              <p className="text-xs text-gray-500 mt-4">Terms version: {TERMS_VERSION}</p>
            </div>
            <div className="p-6 pt-4">
              <p className={`text-xs text-center font-semibold mb-3 ${termsScrolled ? "text-green-700" : "text-gray-500"}`}>{termsScrolled ? t.reachedBottom : t.scrollHint}</p>
              <Button type="button" onClick={acceptTerms} disabled={!termsScrolled} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40">{t.acceptTerms}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        {children}
      </div>
    </div>
  );
}
