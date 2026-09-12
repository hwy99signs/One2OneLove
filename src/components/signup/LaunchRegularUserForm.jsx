import React, { useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Heart, Loader2, Lock, Mail, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import termsEn from "@/content/terms/en";
import termsEs from "@/content/terms/es";
import termsFr from "@/content/terms/fr";
import termsIt from "@/content/terms/it";
import termsDe from "@/content/terms/de";

const TERMS_VERSION = "2026-09-11";

const termsByLanguage = {
  en: termsEn,
  es: termsEs,
  fr: termsFr,
  it: termsIt,
  de: termsDe,
};

const translations = {
  en: {
    title: "Create Your One2OneLove Account",
    subtitle: "Create your account to join One2OneLove and access relationship tools as they become available.",
    fullName: "Your Name",
    fullNamePlaceholder: "Enter your name",
    email: "Email Address",
    emailPlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Create a password (minimum 8 characters)",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm your password",
    termsRequired: "Terms acceptance is required.",
    termsExplain: "Open the full Terms of Service, scroll all the way to the bottom, and accept them before creating your account.",
    readTerms: "Read Full Terms of Service",
    accepted: "Terms of Service accepted",
    createAccount: "Create Account",
    creating: "Creating Account...",
    back: "Back to One2OneLove Home",
    termsTitle: "One2OneLove Terms of Service",
    termsIntro: "Please read the complete Terms of Service. The Accept button becomes available only after you scroll to the bottom.",
    scrollHint: "Scroll to the bottom to enable acceptance.",
    reachedBottom: "You reached the end. You may now accept the Terms of Service.",
    acceptTerms: "I Am 18+ and Accept the Terms of Service",
    close: "Close",
    mismatch: "Passwords do not match.",
    termsError: "You must read and accept the Terms of Service before creating an account.",
    successTitle: "Account Created Successfully",
    successBody: "Your One2OneLove account has been created. Check your email for any verification message, then sign in.",
    signIn: "Go to Sign In",
    privacyNote: "By accepting these Terms, you also acknowledge the One2OneLove Privacy Policy.",
  },
  es: {
    title: "Crea tu cuenta de One2OneLove",
    subtitle: "Crea tu cuenta para unirte a One2OneLove y acceder a las herramientas para relaciones a medida que estén disponibles.",
    fullName: "Tu nombre",
    fullNamePlaceholder: "Ingresa tu nombre",
    email: "Correo electrónico",
    emailPlaceholder: "Ingresa tu correo",
    password: "Contraseña",
    passwordPlaceholder: "Crea una contraseña (mínimo 8 caracteres)",
    confirmPassword: "Confirmar contraseña",
    confirmPasswordPlaceholder: "Confirma tu contraseña",
    termsRequired: "Es obligatorio aceptar los Términos.",
    termsExplain: "Abre los Términos de Servicio completos, desplázate hasta el final y acéptalos antes de crear tu cuenta.",
    readTerms: "Leer los Términos de Servicio completos",
    accepted: "Términos de Servicio aceptados",
    createAccount: "Crear cuenta",
    creating: "Creando cuenta...",
    back: "Volver al inicio de One2OneLove",
    termsTitle: "Términos de Servicio de One2OneLove",
    termsIntro: "Lee los Términos de Servicio completos. El botón Aceptar se habilita únicamente después de llegar al final.",
    scrollHint: "Desplázate hasta el final para habilitar la aceptación.",
    reachedBottom: "Has llegado al final. Ahora puedes aceptar los Términos de Servicio.",
    acceptTerms: "Confirmo que tengo 18+ y acepto los Términos de Servicio",
    close: "Cerrar",
    mismatch: "Las contraseñas no coinciden.",
    termsError: "Debes leer y aceptar los Términos de Servicio antes de crear una cuenta.",
    successTitle: "Cuenta creada correctamente",
    successBody: "Tu cuenta de One2OneLove ha sido creada. Revisa tu correo por cualquier mensaje de verificación y luego inicia sesión.",
    signIn: "Ir a iniciar sesión",
    privacyNote: "Al aceptar estos Términos, también reconoces la Política de Privacidad de One2OneLove.",
  },
  fr: {
    title: "Créer votre compte One2OneLove",
    subtitle: "Créez votre compte pour rejoindre One2OneLove et accéder aux outils relationnels à mesure qu’ils deviennent disponibles.",
    fullName: "Votre nom",
    fullNamePlaceholder: "Entrez votre nom",
    email: "Adresse e-mail",
    emailPlaceholder: "Entrez votre e-mail",
    password: "Mot de passe",
    passwordPlaceholder: "Créez un mot de passe (8 caractères minimum)",
    confirmPassword: "Confirmer le mot de passe",
    confirmPasswordPlaceholder: "Confirmez votre mot de passe",
    termsRequired: "L’acceptation des Conditions est obligatoire.",
    termsExplain: "Ouvrez les Conditions d’Utilisation complètes, faites défiler jusqu’en bas et acceptez-les avant de créer votre compte.",
    readTerms: "Lire l’intégralité des Conditions d’Utilisation",
    accepted: "Conditions d’Utilisation acceptées",
    createAccount: "Créer un compte",
    creating: "Création du compte...",
    back: "Retour à l’accueil One2OneLove",
    termsTitle: "Conditions d’Utilisation de One2OneLove",
    termsIntro: "Veuillez lire l’intégralité des Conditions d’Utilisation. Le bouton Accepter ne devient actif qu’après avoir atteint la fin.",
    scrollHint: "Faites défiler jusqu’en bas pour activer l’acceptation.",
    reachedBottom: "Vous avez atteint la fin. Vous pouvez maintenant accepter les Conditions d’Utilisation.",
    acceptTerms: "Je confirme avoir 18+ et j’accepte les Conditions d’Utilisation",
    close: "Fermer",
    mismatch: "Les mots de passe ne correspondent pas.",
    termsError: "Vous devez lire et accepter les Conditions d’Utilisation avant de créer un compte.",
    successTitle: "Compte créé avec succès",
    successBody: "Votre compte One2OneLove a été créé. Consultez votre e-mail pour tout message de vérification, puis connectez-vous.",
    signIn: "Aller à la connexion",
    privacyNote: "En acceptant ces Conditions, vous reconnaissez également la Politique de Confidentialité de One2OneLove.",
  },
  it: {
    title: "Crea il tuo account One2OneLove",
    subtitle: "Crea il tuo account per unirti a One2OneLove e accedere agli strumenti per le relazioni man mano che diventano disponibili.",
    fullName: "Il tuo nome",
    fullNamePlaceholder: "Inserisci il tuo nome",
    email: "Indirizzo e-mail",
    emailPlaceholder: "Inserisci la tua e-mail",
    password: "Password",
    passwordPlaceholder: "Crea una password (minimo 8 caratteri)",
    confirmPassword: "Conferma password",
    confirmPasswordPlaceholder: "Conferma la tua password",
    termsRequired: "L’accettazione dei Termini è obbligatoria.",
    termsExplain: "Apri i Termini di Servizio completi, scorri fino in fondo e accettali prima di creare il tuo account.",
    readTerms: "Leggi i Termini di Servizio completi",
    accepted: "Termini di Servizio accettati",
    createAccount: "Crea account",
    creating: "Creazione account...",
    back: "Torna alla home di One2OneLove",
    termsTitle: "Termini di Servizio di One2OneLove",
    termsIntro: "Leggi integralmente i Termini di Servizio. Il pulsante Accetta si abilita solo dopo aver raggiunto il fondo.",
    scrollHint: "Scorri fino in fondo per abilitare l’accettazione.",
    reachedBottom: "Hai raggiunto la fine. Ora puoi accettare i Termini di Servizio.",
    acceptTerms: "Confermo di avere 18+ e accetto i Termini di Servizio",
    close: "Chiudi",
    mismatch: "Le password non corrispondono.",
    termsError: "Devi leggere e accettare i Termini di Servizio prima di creare un account.",
    successTitle: "Account creato con successo",
    successBody: "Il tuo account One2OneLove è stato creato. Controlla la tua e-mail per eventuali messaggi di verifica, quindi accedi.",
    signIn: "Vai all’accesso",
    privacyNote: "Accettando questi Termini, riconosci anche l’Informativa sulla Privacy di One2OneLove.",
  },
  de: {
    title: "Ihr One2OneLove-Konto erstellen",
    subtitle: "Erstellen Sie Ihr Konto, um One2OneLove beizutreten und auf Beziehungstools zuzugreifen, sobald sie verfügbar werden.",
    fullName: "Ihr Name",
    fullNamePlaceholder: "Geben Sie Ihren Namen ein",
    email: "E-Mail-Adresse",
    emailPlaceholder: "Geben Sie Ihre E-Mail ein",
    password: "Passwort",
    passwordPlaceholder: "Erstellen Sie ein Passwort (mindestens 8 Zeichen)",
    confirmPassword: "Passwort bestätigen",
    confirmPasswordPlaceholder: "Bestätigen Sie Ihr Passwort",
    termsRequired: "Die Zustimmung zu den Bedingungen ist erforderlich.",
    termsExplain: "Öffnen Sie die vollständigen Nutzungsbedingungen, scrollen Sie bis zum Ende und akzeptieren Sie sie, bevor Sie Ihr Konto erstellen.",
    readTerms: "Vollständige Nutzungsbedingungen lesen",
    accepted: "Nutzungsbedingungen akzeptiert",
    createAccount: "Konto erstellen",
    creating: "Konto wird erstellt...",
    back: "Zurück zur One2OneLove-Startseite",
    termsTitle: "One2OneLove-Nutzungsbedingungen",
    termsIntro: "Bitte lesen Sie die vollständigen Nutzungsbedingungen. Die Schaltfläche Akzeptieren wird erst aktiviert, nachdem Sie bis zum Ende gescrollt haben.",
    scrollHint: "Scrollen Sie bis zum Ende, um die Zustimmung zu aktivieren.",
    reachedBottom: "Sie haben das Ende erreicht. Sie können die Nutzungsbedingungen jetzt akzeptieren.",
    acceptTerms: "Ich bestätige, dass ich 18+ bin, und akzeptiere die Nutzungsbedingungen",
    close: "Schließen",
    mismatch: "Die Passwörter stimmen nicht überein.",
    termsError: "Sie müssen die Nutzungsbedingungen lesen und akzeptieren, bevor Sie ein Konto erstellen.",
    successTitle: "Konto erfolgreich erstellt",
    successBody: "Ihr One2OneLove-Konto wurde erstellt. Prüfen Sie Ihre E-Mail auf eine Bestätigungsnachricht und melden Sie sich anschließend an.",
    signIn: "Zur Anmeldung",
    privacyNote: "Mit der Annahme dieser Bedingungen erkennen Sie auch die Datenschutzrichtlinie von One2OneLove an.",
  },
};

export default function LaunchRegularUserForm({ onBack }) {
  const { currentLanguage } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const t = translations[currentLanguage] || translations.en;
  const terms = termsByLanguage[currentLanguage] || termsEn;
  const scrollRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsAcceptedAt, setTermsAcceptedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");

  const openTerms = () => {
    setTermsScrolled(false);
    setTermsOpen(true);
    window.setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 0);
  };

  const handleTermsScroll = (event) => {
    const node = event.currentTarget;
    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 10;
    if (atBottom) setTermsScrolled(true);
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

    if (!termsAcceptedAt) {
      toast.error(t.termsError);
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        relationshipStatus: "",
        anniversaryDate: "",
        partnerEmail: "",
        subscriptionPlan: "Basic",
        subscriptionPrice: 0,
        termsAcceptedAt,
        termsVersion: TERMS_VERSION,
        privacyPolicyAcknowledged: true,
        age18Confirmed: true,
      });

      if (result?.success) {
        setSuccessEmail(formData.email);
        toast.success(t.successTitle);
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

  if (successEmail) {
    return (
      <Card className="max-w-xl mx-auto shadow-2xl">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.successTitle}</h1>
          <p className="text-gray-600 mb-3">{t.successBody}</p>
          <p className="font-semibold text-gray-800 break-all mb-6">{successEmail}</p>
          <Button
            type="button"
            onClick={() => navigate(createPageUrl("SignIn"))}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
          >
            {t.signIn}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="max-w-xl mx-auto shadow-2xl">
        <CardHeader>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.fullName} *</label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder={t.fullNamePlaceholder}
                  className="pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.email} *</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t.emailPlaceholder}
                  className="pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.password} *</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t.passwordPlaceholder}
                  className="pl-12 pr-12"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.confirmPassword} *</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder={t.confirmPasswordPlaceholder}
                  className="pl-12 pr-12"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${termsAcceptedAt ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
              <p className="font-semibold text-gray-900 mb-1">{t.termsRequired}</p>
              <p className="text-sm text-gray-600 mb-3">{t.termsExplain}</p>
              <button
                type="button"
                onClick={openTerms}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 underline"
              >
                {t.readTerms}
              </button>
              {termsAcceptedAt && (
                <div className="flex items-center gap-2 text-sm font-semibold text-green-700 mt-3">
                  <CheckCircle2 size={18} />
                  {t.accepted}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !termsAcceptedAt}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-lg py-6 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.creating}
                </>
              ) : (
                t.createAccount
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {termsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col relative">
            <button
              type="button"
              aria-label={t.close}
              onClick={() => setTermsOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center z-10"
            >
              <X size={20} />
            </button>

            <div className="p-6 pr-16 border-b">
              <h2 className="text-2xl font-bold text-gray-900">{t.termsTitle}</h2>
              <p className="text-sm text-gray-600 mt-2">{t.termsIntro}</p>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleTermsScroll}
              className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0"
            >
              {terms.map(([heading, body]) => (
                <section key={heading}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{heading}</h3>
                  <p className="text-sm leading-6 text-gray-700">{body}</p>
                </section>
              ))}
              <p className="text-sm font-semibold text-gray-700 pt-2">{t.privacyNote}</p>
              <p className="text-xs text-gray-500">Terms version: {TERMS_VERSION}</p>
            </div>

            <div className="p-5 border-t bg-gray-50 rounded-b-2xl">
              <p className="text-center text-xs font-semibold text-gray-600 mb-3">
                {termsScrolled ? t.reachedBottom : t.scrollHint}
              </p>
              <Button
                type="button"
                disabled={!termsScrolled}
                onClick={acceptTerms}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-50"
              >
                {t.acceptTerms}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
