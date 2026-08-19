import React, { useState } from "react";
import { ArrowLeft, Calendar, Eye, EyeOff, Heart, Loader2, Lock, Mail, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";
import { getAuthUiTranslation } from "@/lib/authUiTranslations";
import EmailVerificationDialog from "./EmailVerificationDialog";

const translations = {
  en: {
    title: "Create Your Account",
    subtitle: "Join the One2One Love community and strengthen your relationships",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your full name",
    email: "Email Address",
    emailPlaceholder: "Enter your email",
    password: "Password",
    passwordPlaceholder: "Create a password (min 8 characters)",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm your password",
    relationshipStatus: "Relationship Status",
    relationshipStatuses: { single: "Single", dating: "Dating", engaged: "Engaged", married: "Married", complicated: "It's Complicated" },
    anniversaryDate: "Anniversary Date (Optional)",
    partnerEmail: "Partner's Email (Optional)",
    partnerEmailPlaceholder: "Invite your partner to join",
    termsPrefix: "I agree to the",
    terms: "Terms of Service",
    and: "and",
    privacy: "Privacy Policy",
    termsRequired: "Please agree to the Terms of Service and Privacy Policy.",
    createAccount: "Create Account",
    back: "Back",
  },
  es: {
    title: "Crea Tu Cuenta",
    subtitle: "Únete a la comunidad One2One Love y fortalece tus relaciones",
    fullName: "Nombre Completo",
    fullNamePlaceholder: "Ingresa tu nombre completo",
    email: "Correo Electrónico",
    emailPlaceholder: "Ingresa tu correo",
    password: "Contraseña",
    passwordPlaceholder: "Crea una contraseña (mín 8 caracteres)",
    confirmPassword: "Confirmar Contraseña",
    confirmPasswordPlaceholder: "Confirma tu contraseña",
    relationshipStatus: "Estado de Relación",
    relationshipStatuses: { single: "Soltero/a", dating: "Saliendo", engaged: "Comprometido/a", married: "Casado/a", complicated: "Es Complicado" },
    anniversaryDate: "Fecha de Aniversario (Opcional)",
    partnerEmail: "Correo de tu Pareja (Opcional)",
    partnerEmailPlaceholder: "Invita a tu pareja a unirse",
    termsPrefix: "Acepto los",
    terms: "Términos de Servicio",
    and: "y la",
    privacy: "Política de Privacidad",
    termsRequired: "Acepta los Términos de Servicio y la Política de Privacidad.",
    createAccount: "Crear Cuenta",
    back: "Volver",
  },
  fr: {
    title: "Créez Votre Compte",
    subtitle: "Rejoignez la communauté One2One Love et renforcez vos relations",
    fullName: "Nom Complet",
    fullNamePlaceholder: "Entrez votre nom complet",
    email: "Adresse E-mail",
    emailPlaceholder: "Entrez votre e-mail",
    password: "Mot de Passe",
    passwordPlaceholder: "Créez un mot de passe (min 8 caractères)",
    confirmPassword: "Confirmer le Mot de Passe",
    confirmPasswordPlaceholder: "Confirmez votre mot de passe",
    relationshipStatus: "Statut Relationnel",
    relationshipStatuses: { single: "Célibataire", dating: "En Couple", engaged: "Fiancé(e)", married: "Marié(e)", complicated: "C'est Compliqué" },
    anniversaryDate: "Date d'Anniversaire (Optionnel)",
    partnerEmail: "E-mail du Partenaire (Optionnel)",
    partnerEmailPlaceholder: "Invitez votre partenaire à rejoindre",
    termsPrefix: "J'accepte les",
    terms: "Conditions d'Utilisation",
    and: "et la",
    privacy: "Politique de Confidentialité",
    termsRequired: "Acceptez les Conditions d'Utilisation et la Politique de Confidentialité.",
    createAccount: "Créer un Compte",
    back: "Retour",
  },
  it: {
    title: "Crea Il Tuo Account",
    subtitle: "Unisciti alla comunità One2One Love e rafforza le tue relazioni",
    fullName: "Nome Completo",
    fullNamePlaceholder: "Inserisci il tuo nome completo",
    email: "Indirizzo Email",
    emailPlaceholder: "Inserisci la tua email",
    password: "Password",
    passwordPlaceholder: "Crea una password (min 8 caratteri)",
    confirmPassword: "Conferma Password",
    confirmPasswordPlaceholder: "Conferma la tua password",
    relationshipStatus: "Stato della Relazione",
    relationshipStatuses: { single: "Single", dating: "Fidanzato/a", engaged: "Impegnato/a", married: "Sposato/a", complicated: "È Complicato" },
    anniversaryDate: "Data dell'Anniversario (Opzionale)",
    partnerEmail: "Email del Partner (Opzionale)",
    partnerEmailPlaceholder: "Invita il tuo partner a unirsi",
    termsPrefix: "Accetto i",
    terms: "Termini di Servizio",
    and: "e l'",
    privacy: "Informativa sulla Privacy",
    termsRequired: "Accetta i Termini di Servizio e l'Informativa sulla Privacy.",
    createAccount: "Crea Account",
    back: "Indietro",
  },
  de: {
    title: "Erstelle Dein Konto",
    subtitle: "Tritt der One2One Love Community bei und stärke deine Beziehungen",
    fullName: "Vollständiger Name",
    fullNamePlaceholder: "Gib deinen vollständigen Namen ein",
    email: "E-Mail-Adresse",
    emailPlaceholder: "Gib deine E-Mail ein",
    password: "Passwort",
    passwordPlaceholder: "Erstelle ein Passwort (mind. 8 Zeichen)",
    confirmPassword: "Passwort Bestätigen",
    confirmPasswordPlaceholder: "Bestätige dein Passwort",
    relationshipStatus: "Beziehungsstatus",
    relationshipStatuses: { single: "Single", dating: "Dating", engaged: "Verlobt", married: "Verheiratet", complicated: "Es ist Kompliziert" },
    anniversaryDate: "Jubiläumsdatum (Optional)",
    partnerEmail: "Partner-E-Mail (Optional)",
    partnerEmailPlaceholder: "Lade deinen Partner ein",
    termsPrefix: "Ich stimme den",
    terms: "Nutzungsbedingungen",
    and: "und der",
    privacy: "Datenschutzrichtlinie",
    termsRequired: "Stimme den Nutzungsbedingungen und der Datenschutzrichtlinie zu.",
    createAccount: "Konto Erstellen",
    back: "Zurück",
  },
  nl: {
    title: "Maak Je Account Aan",
    subtitle: "Word lid van de One2One Love-community en versterk je relaties",
    fullName: "Volledige Naam",
    fullNamePlaceholder: "Voer je volledige naam in",
    email: "E-mailadres",
    emailPlaceholder: "Voer je e-mail in",
    password: "Wachtwoord",
    passwordPlaceholder: "Maak een wachtwoord (min 8 karakters)",
    confirmPassword: "Bevestig Wachtwoord",
    confirmPasswordPlaceholder: "Bevestig je wachtwoord",
    relationshipStatus: "Relatiestatus",
    relationshipStatuses: { single: "Single", dating: "Dating", engaged: "Verloofd", married: "Getrouwd", complicated: "Het Is Ingewikkeld" },
    anniversaryDate: "Jubileumdatum (Optioneel)",
    partnerEmail: "E-mail van Partner (Optioneel)",
    partnerEmailPlaceholder: "Nodig je partner uit",
    termsPrefix: "Ik ga akkoord met de",
    terms: "Servicevoorwaarden",
    and: "en het",
    privacy: "Privacybeleid",
    termsRequired: "Ga akkoord met de Servicevoorwaarden en het Privacybeleid.",
    createAccount: "Account Aanmaken",
    back: "Terug",
  },
  pt: {
    title: "Crie Sua Conta",
    subtitle: "Junte-se à comunidade One2One Love e fortaleça seus relacionamentos",
    fullName: "Nome Completo",
    fullNamePlaceholder: "Digite seu nome completo",
    email: "Endereço de E-mail",
    emailPlaceholder: "Digite seu e-mail",
    password: "Senha",
    passwordPlaceholder: "Crie uma senha (mín 8 caracteres)",
    confirmPassword: "Confirmar Senha",
    confirmPasswordPlaceholder: "Confirme sua senha",
    relationshipStatus: "Status do Relacionamento",
    relationshipStatuses: { single: "Solteiro/a", dating: "Namorando", engaged: "Noivo/a", married: "Casado/a", complicated: "É Complicado" },
    anniversaryDate: "Data do Aniversário (Opcional)",
    partnerEmail: "E-mail do Parceiro (Opcional)",
    partnerEmailPlaceholder: "Convide seu parceiro para participar",
    termsPrefix: "Concordo com os",
    terms: "Termos de Serviço",
    and: "e a",
    privacy: "Política de Privacidade",
    termsRequired: "Concorde com os Termos de Serviço e a Política de Privacidade.",
    createAccount: "Criar Conta",
    back: "Voltar",
  },
};

export default function RegularUserForm({ onBack }) {
  const { currentLanguage } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const t = translations[currentLanguage] || translations.en;
  const authT = getAuthUiTranslation(currentLanguage);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    relationshipStatus: "",
    anniversaryDate: "",
    partnerEmail: "",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [requiresVerification, setRequiresVerification] = useState(true);

  const updateForm = (field, value) => setFormData((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    const normalizedEmail = formData.email.trim();
    const normalizedName = formData.fullName.trim();
    const normalizedPartnerEmail = formData.partnerEmail.trim();

    if (!normalizedName || !normalizedEmail || !formData.password || !formData.confirmPassword) {
      toast.error(authT.accountCreateError);
      return;
    }
    if (formData.password.length < 8) {
      toast.error(authT.passwordTooShort);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error(authT.passwordsMismatch);
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error(t.termsRequired);
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        name: normalizedName,
        email: normalizedEmail,
        password: formData.password,
        relationshipStatus: formData.relationshipStatus,
        anniversaryDate: formData.anniversaryDate,
        partnerEmail: normalizedPartnerEmail,
        subscriptionPlan: "Basic",
        subscriptionPrice: 0,
      });

      if (!result?.success) {
        toast.error(authT.accountCreateError);
        return;
      }

      toast.success(authT.accountCreated);
      if (result.user?.email_verified) {
        navigate(createPageUrl("Profile"), { replace: true });
        return;
      }

      setRegisteredEmail(normalizedEmail);
      setRequiresVerification(true);
      setShowEmailDialog(true);
    } catch {
      toast.error(authT.accountCreateError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto shadow-2xl">
        <CardHeader>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
          >
            <ArrowLeft aria-hidden="true" size={20} className="mr-2" />
            {t.back}
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <Heart aria-hidden="true" className="w-6 h-6 text-white fill-white" />
            </div>
            <CardTitle className="text-3xl">{t.title}</CardTitle>
          </div>
          <p className="text-gray-600">{t.subtitle}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="signup-full-name" className="block text-sm font-medium text-gray-700 mb-2">{t.fullName} *</label>
              <div className="relative">
                <User aria-hidden="true" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input id="signup-full-name" type="text" autoComplete="name" value={formData.fullName} onChange={(event) => updateForm("fullName", event.target.value)} placeholder={t.fullNamePlaceholder} className="pl-12" required />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-2">{t.email} *</label>
              <div className="relative">
                <Mail aria-hidden="true" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input id="signup-email" type="email" inputMode="email" autoComplete="email" value={formData.email} onChange={(event) => updateForm("email", event.target.value)} placeholder={t.emailPlaceholder} className="pl-12" required />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-2">{t.password} *</label>
              <div className="relative">
                <Lock aria-hidden="true" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input id="signup-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={formData.password} onChange={(event) => updateForm("password", event.target.value)} placeholder={t.passwordPlaceholder} className="pl-12 pr-12" required minLength={8} />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500" aria-label={showPassword ? authT.hidePassword : authT.showPassword}>
                  {showPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">{t.confirmPassword} *</label>
              <div className="relative">
                <Lock aria-hidden="true" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input id="signup-confirm-password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={formData.confirmPassword} onChange={(event) => updateForm("confirmPassword", event.target.value)} placeholder={t.confirmPasswordPlaceholder} className="pl-12 pr-12" required minLength={8} />
                <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500" aria-label={showConfirmPassword ? authT.hidePassword : authT.showPassword}>
                  {showConfirmPassword ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.relationshipStatus}</label>
              <Select value={formData.relationshipStatus} onValueChange={(value) => updateForm("relationshipStatus", value)}>
                <SelectTrigger aria-label={t.relationshipStatus}><SelectValue placeholder={t.relationshipStatus} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{t.relationshipStatuses.single}</SelectItem>
                  <SelectItem value="dating">{t.relationshipStatuses.dating}</SelectItem>
                  <SelectItem value="engaged">{t.relationshipStatuses.engaged}</SelectItem>
                  <SelectItem value="married">{t.relationshipStatuses.married}</SelectItem>
                  <SelectItem value="complicated">{t.relationshipStatuses.complicated}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="signup-anniversary" className="block text-sm font-medium text-gray-700 mb-2">{t.anniversaryDate}</label>
              <div className="relative">
                <Calendar aria-hidden="true" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input id="signup-anniversary" type="date" value={formData.anniversaryDate} onChange={(event) => updateForm("anniversaryDate", event.target.value)} className="pl-12" />
              </div>
            </div>

            <div>
              <label htmlFor="signup-partner-email" className="block text-sm font-medium text-gray-700 mb-2">{t.partnerEmail}</label>
              <div className="relative">
                <Heart aria-hidden="true" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input id="signup-partner-email" type="email" inputMode="email" autoComplete="email" value={formData.partnerEmail} onChange={(event) => updateForm("partnerEmail", event.target.value)} placeholder={t.partnerEmailPlaceholder} className="pl-12" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="terms" checked={formData.agreeToTerms} onChange={(event) => updateForm("agreeToTerms", event.target.checked)} className="mt-1" required />
              <label htmlFor="terms" className="text-sm text-gray-600">
                {t.termsPrefix}{" "}
                <Link to={createPageUrl("TermsOfService")} className="font-medium text-pink-600 hover:underline">{t.terms}</Link>{" "}
                {t.and}{" "}
                <Link to={createPageUrl("PrivacyPolicy")} className="font-medium text-pink-600 hover:underline">{t.privacy}</Link>.
              </label>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-lg py-6">
              {isLoading ? <><Loader2 aria-hidden="true" className="w-5 h-5 mr-2 animate-spin" />{authT.creatingAccount}</> : t.createAccount}
            </Button>
          </form>
        </CardContent>
      </Card>

      <EmailVerificationDialog
        isOpen={showEmailDialog}
        onClose={() => {
          setShowEmailDialog(false);
          navigate(createPageUrl("SignIn"), { replace: true });
        }}
        email={registeredEmail}
        requiresVerification={requiresVerification}
      />
    </>
  );
}
