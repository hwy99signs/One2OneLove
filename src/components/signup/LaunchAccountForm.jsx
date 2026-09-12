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

const copy = {
  en: {
    title: "Create Your One2OneLove Account", subtitle: "Create your account to join One2OneLove.", name: "Your Name", email: "Email Address", country: "Country", countryPick: "Select your country", language: "Preferred Language", languagePick: "Select your preferred language", password: "Password", confirm: "Confirm Password", termsTitle: "Terms acceptance is required", termsText: "Open the full Terms of Service, scroll to the bottom, and accept them before creating your account.", readTerms: "Read Full Terms of Service", accepted: "Terms accepted", create: "Create Account", creating: "Creating Account...", back: "Back to One2OneLove Home", fields: "Please complete every required field, including Country and Preferred Language.", mismatch: "Passwords do not match.", short: "Password must be at least 8 characters.", termsErr: "You must read and accept the Terms of Service before creating an account.", verify: "Verify Your Email", verifyBody: "We sent a verification email to the address below. Click the verification link before signing in.", verifyNote: "Your account will not be approved for access until your email is verified.", resend: "Resend Verification Email", resending: "Sending...", signIn: "Go to Sign In", close: "Close", scroll: "Scroll to the bottom to enable acceptance.", reached: "You reached the end. You may now accept the Terms of Service.", accept: "I Am 18+ and Accept the Terms of Service", privacy: "By accepting these Terms, you also acknowledge the One2OneLove Privacy Policy." },
  es: { title: "Crea tu cuenta de One2OneLove", subtitle: "Crea tu cuenta para unirte a One2OneLove.", name: "Tu nombre", email: "Correo electrónico", country: "País", countryPick: "Selecciona tu país", language: "Idioma preferido", languagePick: "Selecciona tu idioma preferido", password: "Contraseña", confirm: "Confirmar contraseña", termsTitle: "Es obligatorio aceptar los Términos", termsText: "Abre los Términos completos, desplázate hasta el final y acéptalos.", readTerms: "Leer los Términos completos", accepted: "Términos aceptados", create: "Crear cuenta", creating: "Creando cuenta...", back: "Volver al inicio", fields: "Completa todos los campos obligatorios, incluidos País e Idioma preferido.", mismatch: "Las contraseñas no coinciden.", short: "La contraseña debe tener al menos 8 caracteres.", termsErr: "Debes leer y aceptar los Términos antes de crear una cuenta.", verify: "Verifica tu correo", verifyBody: "Enviamos un correo de verificación. Haz clic en el enlace antes de iniciar sesión.", verifyNote: "Tu cuenta no tendrá acceso hasta verificar el correo.", resend: "Reenviar correo de verificación", resending: "Enviando...", signIn: "Ir a iniciar sesión", close: "Cerrar", scroll: "Desplázate hasta el final para habilitar la aceptación.", reached: "Has llegado al final. Ya puedes aceptar.", accept: "Confirmo que tengo 18+ y acepto los Términos", privacy: "Al aceptar, también reconoces la Política de Privacidad de One2OneLove." },
  fr: { title: "Créer votre compte One2OneLove", subtitle: "Créez votre compte pour rejoindre One2OneLove.", name: "Votre nom", email: "Adresse e-mail", country: "Pays", countryPick: "Sélectionnez votre pays", language: "Langue préférée", languagePick: "Sélectionnez votre langue préférée", password: "Mot de passe", confirm: "Confirmer le mot de passe", termsTitle: "Acceptation des Conditions requise", termsText: "Ouvrez les Conditions complètes, faites défiler jusqu’en bas et acceptez-les.", readTerms: "Lire les Conditions complètes", accepted: "Conditions acceptées", create: "Créer un compte", creating: "Création du compte...", back: "Retour à l’accueil", fields: "Complétez tous les champs requis, y compris Pays et Langue préférée.", mismatch: "Les mots de passe ne correspondent pas.", short: "Le mot de passe doit comporter au moins 8 caractères.", termsErr: "Vous devez lire et accepter les Conditions avant de créer un compte.", verify: "Vérifiez votre e-mail", verifyBody: "Nous avons envoyé un e-mail de vérification. Cliquez sur le lien avant de vous connecter.", verifyNote: "Votre compte n’aura pas accès avant la vérification de l’e-mail.", resend: "Renvoyer l’e-mail de vérification", resending: "Envoi...", signIn: "Aller à la connexion", close: "Fermer", scroll: "Faites défiler jusqu’en bas pour activer l’acceptation.", reached: "Vous avez atteint la fin. Vous pouvez accepter.", accept: "Je confirme avoir 18+ et j’accepte les Conditions", privacy: "En acceptant, vous reconnaissez aussi la Politique de Confidentialité de One2OneLove." },
  it: { title: "Crea il tuo account One2OneLove", subtitle: "Crea il tuo account per unirti a One2OneLove.", name: "Il tuo nome", email: "Indirizzo e-mail", country: "Paese", countryPick: "Seleziona il tuo paese", language: "Lingua preferita", languagePick: "Seleziona la lingua preferita", password: "Password", confirm: "Conferma password", termsTitle: "È obbligatorio accettare i Termini", termsText: "Apri i Termini completi, scorri fino in fondo e accettali.", readTerms: "Leggi i Termini completi", accepted: "Termini accettati", create: "Crea account", creating: "Creazione account...", back: "Torna alla home", fields: "Completa tutti i campi richiesti, inclusi Paese e Lingua preferita.", mismatch: "Le password non corrispondono.", short: "La password deve contenere almeno 8 caratteri.", termsErr: "Devi leggere e accettare i Termini prima di creare un account.", verify: "Verifica la tua e-mail", verifyBody: "Abbiamo inviato un’e-mail di verifica. Fai clic sul link prima di accedere.", verifyNote: "L’account non avrà accesso finché l’e-mail non sarà verificata.", resend: "Invia di nuovo l’e-mail", resending: "Invio...", signIn: "Vai all’accesso", close: "Chiudi", scroll: "Scorri fino in fondo per abilitare l’accettazione.", reached: "Hai raggiunto la fine. Ora puoi accettare.", accept: "Confermo di avere 18+ e accetto i Termini", privacy: "Accettando, riconosci anche l’Informativa sulla Privacy di One2OneLove." },
  de: { title: "Ihr One2OneLove-Konto erstellen", subtitle: "Erstellen Sie Ihr Konto, um One2OneLove beizutreten.", name: "Ihr Name", email: "E-Mail-Adresse", country: "Land", countryPick: "Wählen Sie Ihr Land", language: "Bevorzugte Sprache", languagePick: "Wählen Sie Ihre bevorzugte Sprache", password: "Passwort", confirm: "Passwort bestätigen", termsTitle: "Zustimmung zu den Bedingungen erforderlich", termsText: "Öffnen Sie die vollständigen Bedingungen, scrollen Sie bis zum Ende und akzeptieren Sie sie.", readTerms: "Vollständige Bedingungen lesen", accepted: "Bedingungen akzeptiert", create: "Konto erstellen", creating: "Konto wird erstellt...", back: "Zurück zur Startseite", fields: "Füllen Sie alle Pflichtfelder aus, einschließlich Land und bevorzugter Sprache.", mismatch: "Die Passwörter stimmen nicht überein.", short: "Das Passwort muss mindestens 8 Zeichen lang sein.", termsErr: "Sie müssen die Bedingungen lesen und akzeptieren, bevor Sie ein Konto erstellen.", verify: "Bestätigen Sie Ihre E-Mail", verifyBody: "Wir haben eine Bestätigungs-E-Mail gesendet. Klicken Sie vor der Anmeldung auf den Link.", verifyNote: "Ihr Konto erhält erst nach Bestätigung der E-Mail Zugriff.", resend: "Bestätigungs-E-Mail erneut senden", resending: "Wird gesendet...", signIn: "Zur Anmeldung", close: "Schließen", scroll: "Scrollen Sie bis zum Ende, um die Zustimmung zu aktivieren.", reached: "Sie haben das Ende erreicht. Sie können jetzt akzeptieren.", accept: "Ich bestätige, dass ich 18+ bin, und akzeptiere die Bedingungen", privacy: "Mit der Annahme erkennen Sie auch die Datenschutzrichtlinie von One2OneLove an." },
};

export default function LaunchAccountForm({ onBack }) {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = copy[currentLanguage] || copy.en;
  const terms = termsByLanguage[currentLanguage] || termsEn;
  const scrollRef = useRef(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", country: "", preferredLanguage: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successEmail, setSuccessEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const countryOptions = useMemo(() => {
    const locale = localeByLanguage[currentLanguage] || localeByLanguage.en;
    let names = null;
    try { names = new Intl.DisplayNames([locale], { type: "region" }); } catch {}
    return countryCodes.map((code) => ({ code, name: names?.of(code) || code })).sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [currentLanguage]);

  const fail = (message) => { setErrorMessage(message); toast.error(message); };
  const openTerms = () => { setTermsScrolled(false); setTermsOpen(true); setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, 0); };
  const handleTermsScroll = (e) => { const n = e.currentTarget; if (n.scrollTop + n.clientHeight >= n.scrollHeight - 10) setTermsScrolled(true); };
  const acceptTerms = () => { if (!termsScrolled) return; setTermsAcceptedAt(new Date().toISOString()); setTermsOpen(false); setErrorMessage(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!formData.fullName || !formData.email || !formData.country || !formData.preferredLanguage || !formData.password || !formData.confirmPassword) return fail(t.fields);
    if (formData.password.length < 8) return fail(t.short);
    if (formData.password !== formData.confirmPassword) return fail(t.mismatch);
    if (!termsAcceptedAt) return fail(t.termsErr);
    setIsLoading(true);
    try {
      const result = await registerLaunchUser({ name: formData.fullName, email: formData.email, password: formData.password, country: formData.country, preferredLanguage: formData.preferredLanguage, termsAcceptedAt, termsVersion: TERMS_VERSION, privacyPolicyAcknowledged: true, age18Confirmed: true });
      if (result?.success && result.emailVerificationRequired) {
        setSuccessEmail(formData.email);
        toast.success(t.verify);
      } else {
        fail(result?.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      fail(error?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    const result = await resendLaunchVerification(successEmail);
    if (result?.success) toast.success(t.resend);
    else fail(result?.error || "Unable to resend verification email.");
    setResendLoading(false);
  };

  if (successEmail) return (
    <Card className="max-w-xl mx-auto shadow-2xl"><CardContent className="p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5"><Mail className="w-9 h-9 text-green-600" /></div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.verify}</h1>
      <p className="text-gray-600 mb-3">{t.verifyBody}</p><p className="font-semibold text-gray-800 break-all mb-3">{successEmail}</p>
      <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-4 mb-6">{t.verifyNote}</div>
      <div className="grid gap-3"><Button type="button" variant="outline" onClick={handleResend} disabled={resendLoading}>{resendLoading ? t.resending : t.resend}</Button><Button type="button" onClick={() => navigate(createPageUrl("SignIn"))} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">{t.signIn}</Button></div>
    </CardContent></Card>
  );

  return <>
    <Card className="max-w-xl mx-auto shadow-2xl"><CardHeader>
      <button type="button" onClick={onBack} className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"><ArrowLeft size={20} className="mr-2" />{t.back}</button>
      <div className="flex items-center gap-3 mb-2"><div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"><Heart className="w-6 h-6 text-white fill-white" /></div><CardTitle className="text-3xl">{t.title}</CardTitle></div>
      <p className="text-gray-600">{t.subtitle}</p>
    </CardHeader><CardContent><form onSubmit={handleSubmit} className="space-y-5">
      <Field label={`${t.name} *`} icon={<User size={20} />}><Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="pl-12" required /></Field>
      <Field label={`${t.email} *`} icon={<Mail size={20} />}><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-12" required /></Field>
      <div><label className="block text-sm font-medium text-gray-700 mb-2">{t.country} *</label><div className="relative"><Globe2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /><select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700" required><option value="">{t.countryPick}</option>{countryOptions.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-2">{t.language} *</label><div className="relative"><Languages size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" /><select value={formData.preferredLanguage} onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })} className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-700" required><option value="">{t.languagePick}</option>{languageOptions.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div></div>
      <Field label={`${t.password} *`} icon={<Lock size={20} />}><Input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="pl-12 pr-12" minLength={8} required /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></Field>
      <Field label={`${t.confirm} *`} icon={<Lock size={20} />}><Input type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="pl-12 pr-12" minLength={8} required /><button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></Field>
      <div className={`rounded-xl border p-4 ${termsAcceptedAt ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}><p className="font-semibold text-gray-900 mb-1">{t.termsTitle}</p><p className="text-sm text-gray-600 mb-3">{t.termsText}</p><button type="button" onClick={openTerms} className="text-sm font-bold text-blue-600 underline">{t.readTerms}</button>{termsAcceptedAt && <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mt-3"><CheckCircle2 size={18} />{t.accepted}</div>}</div>
      {errorMessage && <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold p-3" role="alert">{errorMessage}</div>}
      <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 disabled:opacity-50">{isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{t.creating}</> : t.create}</Button>
    </form></CardContent></Card>
    {termsOpen && <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col relative"><button type="button" onClick={() => setTermsOpen(false)} aria-label={t.close} className="absolute right-4 top-4 z-10 w-9 h-9 rounded-full bg-gray-100 grid place-items-center"><X size={20} /></button><div className="p-6 pb-3 pr-16"><h2 className="text-2xl font-bold text-gray-900">One2OneLove Terms of Service</h2></div><div ref={scrollRef} onScroll={handleTermsScroll} className="mx-6 border rounded-xl p-5 overflow-y-auto min-h-0 max-h-[58vh]">{terms.map(([heading, body]) => <section key={heading} className="mb-5"><h3 className="font-bold text-gray-900 mb-1">{heading}</h3><p className="text-sm leading-6 text-gray-600">{body}</p></section>)}<p className="text-sm font-semibold text-gray-700">{t.privacy}</p><p className="text-xs text-gray-500 mt-4">Terms version: {TERMS_VERSION}</p></div><div className="p-6 pt-4"><p className={`text-xs text-center font-semibold mb-3 ${termsScrolled ? "text-green-700" : "text-gray-500"}`}>{termsScrolled ? t.reached : t.scroll}</p><Button type="button" onClick={acceptTerms} disabled={!termsScrolled} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-40">{t.accept}</Button></div></div></div>}
  </>;
}

function Field({ label, icon, children }) { return <div><label className="block text-sm font-medium text-gray-700 mb-2">{label}</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>{children}</div></div>; }
