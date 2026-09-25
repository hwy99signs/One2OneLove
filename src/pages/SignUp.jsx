import React from "react";
import { ArrowLeft, BriefcaseBusiness, UserRound } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";
import LaunchRegularUserForm from "@/components/signup/LaunchRegularUserForm";

const COPY = {
  en: { title: "Complete Your One2OneLove Sign Up", subtitle: "Your plan is selected. Now choose how you are joining One2OneLove.", selectedPlan: "Selected plan", individual: "Individual Member", individualBody: "Create a personal member account for One2OneLove relationship tools, community, activities and member features.", professional: "Professional / Contributor", professionalBody: "Apply as a licensed therapist or counselor, relationship coach or educator, creator or media contributor, organization, or professional partner.", continue: "Continue", back: "Back to Plans" },
  es: { title: "Completa Tu Registro en One2OneLove", subtitle: "Tu plan está seleccionado. Ahora elige cómo te unes a One2OneLove.", selectedPlan: "Plan seleccionado", individual: "Miembro Individual", individualBody: "Crea una cuenta personal para las herramientas, comunidad, actividades y funciones de One2OneLove.", professional: "Profesional / Colaborador", professionalBody: "Solicita acceso como terapeuta o consejero con licencia, coach o educador, creador o colaborador de medios, organización o socio profesional.", continue: "Continuar", back: "Volver a los Planes" },
  fr: { title: "Finalisez Votre Inscription One2OneLove", subtitle: "Votre formule est sélectionnée. Choisissez maintenant comment vous rejoignez One2OneLove.", selectedPlan: "Formule sélectionnée", individual: "Membre Particulier", individualBody: "Créez un compte personnel pour les outils relationnels, la communauté, les activités et les fonctions membres.", professional: "Professionnel / Contributeur", professionalBody: "Candidatez comme thérapeute ou conseiller agréé, coach ou éducateur, créateur ou contributeur média, organisation ou partenaire professionnel.", continue: "Continuer", back: "Retour aux Formules" },
  it: { title: "Completa la Registrazione One2OneLove", subtitle: "Il tuo piano è selezionato. Ora scegli come entrare in One2OneLove.", selectedPlan: "Piano selezionato", individual: "Membro Individuale", individualBody: "Crea un account personale per strumenti relazionali, community, attività e funzioni per membri.", professional: "Professionista / Contributor", professionalBody: "Candidati come terapeuta o consulente abilitato, coach o educatore, creator o contributor media, organizzazione o partner professionale.", continue: "Continua", back: "Torna ai Piani" },
  de: { title: "One2OneLove-Registrierung Abschließen", subtitle: "Ihr Tarif ist ausgewählt. Wählen Sie nun, wie Sie One2OneLove beitreten.", selectedPlan: "Ausgewählter Tarif", individual: "Privatmitglied", individualBody: "Erstellen Sie ein persönliches Mitgliedskonto für Beziehungstools, Community, Aktivitäten und Mitgliederfunktionen.", professional: "Fachkraft / Contributor", professionalBody: "Bewerben Sie sich als lizenzierter Therapeut oder Berater, Beziehungscoach oder Pädagoge, Creator oder Medien-Contributor, Organisation oder professioneller Partner.", continue: "Weiter", back: "Zurück zu den Tarifen" },
};

const PLAN_PRICE = { Premiere: "US$9.99/month", Exclusive: "US$19.99/month" };

function canonicalPlan(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "premiere" || raw === "premier") return "Premiere";
  if (raw === "exclusive") return "Exclusive";
  return null;
}

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const selectedPlan = canonicalPlan(searchParams.get("plan"));
  const signupType = String(searchParams.get("type") || "").toLowerCase();

  if (!selectedPlan) return <Navigate to="/Subscription?signup=1" replace />;

  if (signupType === "individual") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 px-4 py-12">
        <LaunchRegularUserForm
          selectedPlan={selectedPlan}
          onBack={() => navigate(`/SignUp?plan=${encodeURIComponent(selectedPlan)}`)}
        />
      </div>
    );
  }

  const chooseIndividual = () => navigate(`/SignUp?plan=${encodeURIComponent(selectedPlan)}&type=individual`);
  const chooseProfessional = () => navigate(`/ProfessionalSignup?plan=${encodeURIComponent(selectedPlan)}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/Subscription?signup=1")} className="mb-8 text-gray-600">
          <ArrowLeft className="w-5 h-5 mr-2" />{t.back}
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
          <div className="mt-5 inline-flex items-center rounded-full border border-purple-200 bg-white px-5 py-2 font-bold text-purple-800 shadow-sm">
            {t.selectedPlan}: {selectedPlan} — {PLAN_PRICE[selectedPlan]}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-7">
          <Card className="shadow-xl hover:shadow-2xl transition-shadow border-2 border-transparent hover:border-pink-200">
            <CardContent className="p-8 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg mb-5"><UserRound className="w-8 h-8" /></div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">{t.individual}</h2>
              <p className="text-gray-600 leading-relaxed mb-7 flex-1">{t.individualBody}</p>
              <Button onClick={chooseIndividual} className="w-full py-6 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold">{t.continue}</Button>
            </CardContent>
          </Card>

          <Card className="shadow-xl hover:shadow-2xl transition-shadow border-2 border-transparent hover:border-purple-200">
            <CardContent className="p-8 flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg mb-5"><BriefcaseBusiness className="w-8 h-8" /></div>
              <h2 className="text-3xl font-black text-gray-900 mb-3">{t.professional}</h2>
              <p className="text-gray-600 leading-relaxed mb-7 flex-1">{t.professionalBody}</p>
              <Button onClick={chooseProfessional} className="w-full py-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold">{t.continue}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
