import React, { useState } from "react";
import { ArrowLeft, Mail, Lock, User, Heart, Eye, EyeOff, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import EmailVerificationDialog from "./EmailVerificationDialog";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    title: "Create Your Account",
    subtitle: "Join thousands of couples strengthening their relationships",
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
    agreeToTerms: "I agree to the Terms of Service and Privacy Policy",
    createAccount: "Create Account",
    creating: "Creating Account...",
    back: "Back"
  },
  es: {
    title: "Crea Tu Cuenta",
    subtitle: "Únete a miles de parejas fortaleciendo sus relaciones",
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
    agreeToTerms: "Acepto los Términos de Servicio y Política de Privacidad",
    createAccount: "Crear Cuenta",
    creating: "Creando Cuenta...",
    back: "Volver"
  },
  fr: {
    title: "Créez Votre Compte",
    subtitle: "Rejoignez des milliers de couples renforçant leurs relations",
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
    agreeToTerms: "J'accepte les Conditions d'Utilisation et la Politique de Confidentialité",
    createAccount: "Créer un Compte",
    creating: "Création du Compte...",
    back: "Retour"
  },
  it: {
    title: "Crea Il Tuo Account",
    subtitle: "Unisciti a migliaia di coppie che rafforzano le loro relazioni",
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
    agreeToTerms: "Accetto i Termini di Servizio e l'Informativa sulla Privacy",
    createAccount: "Crea Account",
    creating: "Creazione Account...",
    back: "Indietro"
  },
  de: {
    title: "Erstellen Sie Ihr Konto",
    subtitle: "Treten Sie Tausenden von Paaren bei, die ihre Beziehungen stärken",
    fullName: "Vollständiger Name",
    fullNamePlaceholder: "Geben Sie Ihren vollständigen Namen ein",
    email: "E-Mail-Adresse",
    emailPlaceholder: "Geben Sie Ihre E-Mail ein",
    password: "Passwort",
    passwordPlaceholder: "Erstellen Sie ein Passwort (mind. 8 Zeichen)",
    confirmPassword: "Passwort Bestätigen",
    confirmPasswordPlaceholder: "Bestätigen Sie Ihr Passwort",
    relationshipStatus: "Beziehungsstatus",
    relationshipStatuses: { single: "Single", dating: "Dating", engaged: "Verlobt", married: "Verheiratet", complicated: "Es ist Kompliziert" },
    anniversaryDate: "Jubiläumsdatum (Optional)",
    partnerEmail: "Partner-E-Mail (Optional)",
    partnerEmailPlaceholder: "Laden Sie Ihren Partner ein",
    agreeToTerms: "Ich stimme den Nutzungsbedingungen und der Datenschutzrichtlinie zu",
    createAccount: "Konto Erstellen",
    creating: "Konto Wird Erstellt...",
    back: "Zurück"
  },
  nl: {
    title: "Maak Je Account Aan",
    subtitle: "Sluit je aan bij duizenden koppels die hun relaties versterken",
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
    agreeToTerms: "Ik ga akkoord met de Servicevoorwaarden en Privacybeleid",
    createAccount: "Account Aanmaken",
    creating: "Account Aanmaken...",
    back: "Terug"
  },
  pt: {
    title: "Crie Sua Conta",
    subtitle: "Junte-se a milhares de casais fortalecendo seus relacionamentos",
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
    agreeToTerms: "Concordo com os Termos de Serviço e Política de Privacidade",
    createAccount: "Criar Conta",
    creating: "Criando Conta...",
    back: "Voltar"
  }
};

export default function RegularUserForm({ onBack }) {
  const { currentLanguage } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const t = translations[currentLanguage] || translations.en;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    relationshipStatus: "",
    anniversaryDate: "",
    partnerEmail: "",
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔥 SignUp Form - Submission started');
    console.log('Form data:', { 
      name: formData.fullName, 
      email: formData.email, 
      hasPassword: !!formData.password,
      relationshipStatus: formData.relationshipStatus,
      agreeToTerms: formData.agreeToTerms 
    });
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Calling register function...');
      const result = await register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        relationshipStatus: formData.relationshipStatus,
        anniversaryDate: formData.anniversaryDate,
        partnerEmail: formData.partnerEmail,
        subscriptionPlan: 'Basic', // All new users start with free Basic plan
        subscriptionPrice: 0, // Basic is free
      });

      console.log('Register result:', result);

      if (result.success) {
        // Show success message
        toast.success("Account created successfully! Welcome to One 2 One Love!");
        
        // Immediate redirect to profile/dashboard
        console.log('✅ Registration successful, redirecting to profile...');
        
        // Redirect immediately - no delay needed
        navigate(createPageUrl("Profile"), { replace: true });
      } else {
        console.error('Registration failed:', result.error);
        toast.error(result.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error('Registration error caught:', err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Card className="max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <button
          onClick={onBack}
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          {t.back}
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <CardTitle className="text-3xl">{t.title}</CardTitle>
        </div>
        <p className="text-gray-600">{t.subtitle}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.fullName} *
            </label>
            <div className="relative">
              <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder={t.fullNamePlaceholder}
                className="pl-12"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.email} *
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder={t.emailPlaceholder}
                className="pl-12"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.password} *
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder={t.passwordPlaceholder}
                className="pl-12 pr-12"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.confirmPassword} *
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder={t.confirmPasswordPlaceholder}
                className="pl-12 pr-12"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.relationshipStatus}
            </label>
            <Select value={formData.relationshipStatus} onValueChange={(value) => setFormData({...formData, relationshipStatus: value})}>
              <SelectTrigger>
                <SelectValue placeholder={t.relationshipStatus} />
              </SelectTrigger>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.anniversaryDate}
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="date"
                value={formData.anniversaryDate}
                onChange={(e) => setFormData({...formData, anniversaryDate: e.target.value})}
                className="pl-12"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.partnerEmail}
            </label>
            <div className="relative">
              <Heart size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="email"
                value={formData.partnerEmail}
                onChange={(e) => setFormData({...formData, partnerEmail: e.target.value})}
                placeholder={t.partnerEmailPlaceholder}
                className="pl-12"
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={formData.agreeToTerms}
              onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
              className="mt-1"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              {t.agreeToTerms}
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-lg py-6"
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
    
    {/* Email Verification Dialog */}
    <EmailVerificationDialog
      isOpen={showEmailDialog}
      onClose={() => {
        setShowEmailDialog(false);
        navigate(createPageUrl("SignIn"));
      }}
      email={registeredEmail}
    />
    </>
  );
}