import React, { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";
import IndividualSignupForm from "@/components/signup/IndividualSignupForm";

const COPY = {
  en: { title: "Create Your One2One Love Account", subtitle: "Choose how you are joining the platform.", individual: "Individual", individualBody: "Join as a member to use One2One Love relationship tools, community and member features.", professional: "Professional / Contributor", professionalBody: "Apply as a licensed professional, coach or educator, creator/media contributor, organization or professional partner.", continue: "Continue", back: "Back" },
  es: { title: "Crea Tu Cuenta de One2One Love", subtitle: "Elige cómo te unes a la plataforma.", individual: "Individual", individualBody: "Únete como miembro para usar las herramientas, la comunidad y las funciones para miembros de One2One Love.", professional: "Profesional / Colaborador", professionalBody: "Solicita acceso como profesional con licencia, coach o educador, colaborador de medios, organización o socio profesional.", continue: "Continuar", back: "Volver" },
  fr: { title: "Créez Votre Compte One2One Love", subtitle: "Choisissez comment vous rejoignez la plateforme.", individual: "Particulier", individualBody: "Rejoignez la communauté pour utiliser les outils relationnels et les fonctions membres de One2One Love.", professional: "Professionnel / Contributeur", professionalBody: "Candidatez comme professionnel agréé, coach ou éducateur, contributeur média, organisation ou partenaire professionnel.", continue: "Continuer", back: "Retour" },
  it: { title: "Crea il Tuo Account One2One Love", subtitle: "Scegli come vuoi entrare nella piattaforma.", individual: "Privato", individualBody: "Iscriviti come membro per usare gli strumenti relazionali, la community e le funzioni di One2One Love.", professional: "Professionista / Contributor", professionalBody: "Candidati come professionista abilitato, coach o educatore, contributor media, organizzazione o partner professionale.", continue: "Continua", back: "Indietro" },
  de: { title: "Erstellen Sie Ihr One2One Love Konto", subtitle: "Wählen Sie, wie Sie der Plattform beitreten.", individual: "Privatperson", individualBody: "Treten Sie als Mitglied bei und nutzen Sie Beziehungstools, Community und Mitgliederfunktionen von One2One Love.", professional: "Fachkraft / Contributor", professionalBody: "Bewerben Sie sich als lizenzierte Fachkraft, Coach oder Pädagoge, Medien-Contributor, Organisation oder professioneller Partner.", continue: "Weiter", back: "Zurück" },
};

export default function SignUp() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [mode, setMode] = useState(null);

  const handleBack = () => {
    if (mode === "individual") {
      setMode(null);
      return;
    }
    navigate(createPageUrl("Home"));
  };

  if (mode === "individual") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-12 px-4">
        <IndividualSignupForm onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={handleBack} className="mb-8 text-gray-600"><ArrowLeft className="w-5 h-5 mr-2" />{t.back}</Button>
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-7">
          <Card className="shadow-xl hover:shadow-2xl transition-shadow border-2 border-transparent hover:border-pink-200">
            <CardContent className="p-8 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg mb-5"><UserRound className="w-8 h-8" /></div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">{t.individual}</h2>
              <p className="text-gray-600 leading-relaxed mb-7 flex-1">{t.individualBody}</p>
              <Button onClick={() => setMode("individual")} className="w-full py-6 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold">{t.continue}</Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-shadow border-2 border-transparent hover:border-purple-200">
            <CardContent className="p-8 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg mb-5"><BriefcaseBusiness className="w-8 h-8" /></div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">{t.professional}</h2>
              <p className="text-gray-600 leading-relaxed mb-7 flex-1">{t.professionalBody}</p>
              <Button onClick={() => navigate(createPageUrl("ProfessionalSignup"))} className="w-full py-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold">{t.continue}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
