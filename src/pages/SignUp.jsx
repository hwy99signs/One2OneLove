import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Briefcase, Stethoscope, Mic, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RegularUserForm from "@/components/signup/RegularUserForm";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Join One2One Love",
    subtitle: "Choose how you'd like to join our community",
    close: "Close sign up",
    continue: "Continue",
    already: "Already have an account?",
    signIn: "Sign In",
    regular: { title: "Regular User", description: "Join as a couple or individual to strengthen your relationship" },
    therapist: { title: "Therapist", description: "Licensed therapists and counselors" },
    influencer: { title: "Influencer", description: "Content creators and social media influencers" },
    professional: { title: "Professional", description: "Relationship coaches and other professionals" },
  },
  es: {
    title: "Únete a One2One Love",
    subtitle: "Elige cómo te gustaría unirte a nuestra comunidad",
    close: "Cerrar registro",
    continue: "Continuar",
    already: "¿Ya tienes una cuenta?",
    signIn: "Iniciar Sesión",
    regular: { title: "Usuario Regular", description: "Únete como pareja o individuo para fortalecer tu relación" },
    therapist: { title: "Terapeuta", description: "Terapeutas y consejeros con licencia" },
    influencer: { title: "Influencer", description: "Creadores de contenido e influencers de redes sociales" },
    professional: { title: "Profesional", description: "Coaches de relaciones y otros profesionales" },
  },
  fr: {
    title: "Rejoignez One2One Love",
    subtitle: "Choisissez comment vous souhaitez rejoindre notre communauté",
    close: "Fermer l'inscription",
    continue: "Continuer",
    already: "Vous avez déjà un compte ?",
    signIn: "Se Connecter",
    regular: { title: "Utilisateur", description: "Rejoignez-nous en couple ou individuellement pour renforcer votre relation" },
    therapist: { title: "Thérapeute", description: "Thérapeutes et conseillers agréés" },
    influencer: { title: "Influenceur", description: "Créateurs de contenu et influenceurs sur les réseaux sociaux" },
    professional: { title: "Professionnel", description: "Coachs relationnels et autres professionnels" },
  },
  it: {
    title: "Unisciti a One2One Love",
    subtitle: "Scegli come vuoi unirti alla nostra comunità",
    close: "Chiudi registrazione",
    continue: "Continua",
    already: "Hai già un account?",
    signIn: "Accedi",
    regular: { title: "Utente", description: "Unisciti come coppia o individuo per rafforzare la tua relazione" },
    therapist: { title: "Terapeuta", description: "Terapeuti e counselor abilitati" },
    influencer: { title: "Influencer", description: "Creator di contenuti e influencer sui social media" },
    professional: { title: "Professionista", description: "Coach relazionali e altri professionisti" },
  },
  de: {
    title: "One2One Love Beitreten",
    subtitle: "Wähle, wie du unserer Community beitreten möchtest",
    close: "Registrierung schließen",
    continue: "Weiter",
    already: "Du hast bereits ein Konto?",
    signIn: "Anmelden",
    regular: { title: "Nutzer", description: "Tritt als Paar oder Einzelperson bei, um deine Beziehung zu stärken" },
    therapist: { title: "Therapeut", description: "Lizenzierte Therapeuten und Berater" },
    influencer: { title: "Influencer", description: "Content-Creator und Social-Media-Influencer" },
    professional: { title: "Fachperson", description: "Beziehungscoaches und andere Fachkräfte" },
  },
};

export default function SignUp() {
  const [selectedType, setSelectedType] = useState(null);
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const signupTypes = [
    {
      id: "regular",
      title: t.regular.title,
      description: t.regular.description,
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      route: null,
    },
    {
      id: "therapist",
      title: t.therapist.title,
      description: t.therapist.description,
      icon: Stethoscope,
      color: "from-green-500 to-teal-500",
      route: "/TherapistSignup",
    },
    {
      id: "influencer",
      title: t.influencer.title,
      description: t.influencer.description,
      icon: Mic,
      color: "from-pink-500 to-red-500",
      route: "/InfluencerSignup",
    },
    {
      id: "professional",
      title: t.professional.title,
      description: t.professional.description,
      icon: Briefcase,
      color: "from-indigo-500 to-blue-500",
      route: "/ProfessionalSignup",
    },
  ];

  const handleSelectType = (type) => {
    if (type.route) {
      navigate(type.route);
      return;
    }
    setSelectedType(type);
  };

  if (selectedType?.id === "regular") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-12 px-4">
        <RegularUserForm onBack={() => setSelectedType(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-4xl">
        <Link
          to={createPageUrl("Home")}
          aria-label={t.close}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
        >
          <X aria-hidden="true" size={24} />
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full mb-4 shadow-xl">
            <Heart aria-hidden="true" className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">{t.title}</h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {signupTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card key={type.id} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-300 flex flex-col h-full">
                <CardHeader className="flex-1">
                  <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon aria-hidden="true" className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{type.title}</CardTitle>
                  <CardDescription className="text-base mt-2">{type.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button
                    type="button"
                    onClick={() => handleSelectType(type)}
                    className={`w-full bg-gradient-to-r ${type.color} hover:opacity-90 text-white`}
                  >
                    {t.continue}
                    <ArrowRight aria-hidden="true" className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {t.already}{" "}
            <Link to={createPageUrl("SignIn")} className="text-pink-600 hover:text-pink-700 font-semibold">
              {t.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
