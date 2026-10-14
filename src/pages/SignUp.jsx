import React from "react";
import { ArrowLeft, BriefcaseBusiness, UserRound } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";
import LaunchRegularUserForm from "@/components/signup/LaunchRegularUserForm";

const COPY = {
  en: {
    title:"Create Your One2OneLove Account",
    subtitle:"Start with a free account. No credit card is required.",
    account:"Account",
    free:"Free account · no card required",
    founding:"Founding Member intent is preserved with the Free + Credit model.",
    individual:"Individual Member",
    individualBody:"Create a personal account for One2OneLove relationship tools, community, activities and member features.",
    professional:"Professional / Contributor",
    professionalBody:"Apply as a licensed therapist or counselor, relationship coach or educator, creator or media contributor, organization, or professional partner.",
    continue:"Continue",
    back:"Back to One2OneLove",
  },
  es: {
    title:"Crea Tu Cuenta de One2OneLove",subtitle:"Comienza con una cuenta gratuita. No se requiere tarjeta.",account:"Cuenta",
    free:"Cuenta gratuita · sin tarjeta",founding:"Tu intención de Miembro Fundador se conserva con el modelo Gratis + Créditos.",
    individual:"Miembro Individual",individualBody:"Crea una cuenta personal para herramientas, comunidad, actividades y funciones de One2OneLove.",
    professional:"Profesional / Colaborador",professionalBody:"Solicita acceso como terapeuta o consejero con licencia, coach o educador, creador, colaborador de medios, organización o socio profesional.",
    continue:"Continuar",back:"Volver a One2OneLove",
  },
  fr: {
    title:"Créez Votre Compte One2OneLove",subtitle:"Commencez avec un compte gratuit. Aucune carte bancaire requise.",account:"Compte",
    free:"Compte gratuit · sans carte",founding:"Votre intention de Membre Fondateur est conservée avec le modèle Gratuit + Crédits.",
    individual:"Membre Particulier",individualBody:"Créez un compte personnel pour les outils relationnels, la communauté, les activités et les fonctions membres.",
    professional:"Professionnel / Contributeur",professionalBody:"Candidatez comme thérapeute ou conseiller agréé, coach ou éducateur, créateur, contributeur média, organisation ou partenaire professionnel.",
    continue:"Continuer",back:"Retour à One2OneLove",
  },
  it: {
    title:"Crea il Tuo Account One2OneLove",subtitle:"Inizia con un account gratuito. Nessuna carta richiesta.",account:"Account",
    free:"Account gratuito · senza carta",founding:"La tua intenzione di Membro Fondatore resta valida con il modello Gratis + Credito.",
    individual:"Membro Individuale",individualBody:"Crea un account personale per strumenti relazionali, community, attività e funzioni per membri.",
    professional:"Professionista / Contributor",professionalBody:"Candidati come terapeuta o consulente abilitato, coach o educatore, creator, contributor media, organizzazione o partner professionale.",
    continue:"Continua",back:"Torna a One2OneLove",
  },
  de: {
    title:"Erstellen Sie Ihr One2OneLove-Konto",subtitle:"Starten Sie mit einem kostenlosen Konto. Keine Kreditkarte erforderlich.",account:"Konto",
    free:"Kostenloses Konto · keine Karte",founding:"Ihre Gründungsmitglied-Absicht bleibt im Gratis + Credit-Modell erhalten.",
    individual:"Privatmitglied",individualBody:"Erstellen Sie ein persönliches Konto für Beziehungstools, Community, Aktivitäten und Mitgliederfunktionen.",
    professional:"Fachkraft / Contributor",professionalBody:"Bewerben Sie sich als lizenzierter Therapeut oder Berater, Beziehungscoach oder Pädagoge, Creator, Medien-Contributor, Organisation oder professioneller Partner.",
    continue:"Weiter",back:"Zurück zu One2OneLove",
  },
};

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const signupType = String(searchParams.get("type") || "").toLowerCase();
  const foundingIntent = searchParams.get("founding") === "1";

  if (signupType === "individual") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 px-4 py-12">
        <LaunchRegularUserForm
          selectedPlan="Free"
          freeAccount
          foundingIntent={foundingIntent}
          onBack={() => navigate(foundingIntent ? "/SignUp?founding=1" : "/SignUp")}
        />
      </div>
    );
  }

  const chooseIndividual = () => navigate(foundingIntent ? "/SignUp?type=individual&founding=1" : "/SignUp?type=individual");
  const chooseProfessional = () => navigate("/ProfessionalSignup?account=free");

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/Home")} className="mb-8 text-gray-600">
          <ArrowLeft className="mr-2 h-5 w-5" />{t.back}
        </Button>

        <div className="mb-10 text-center">
          <h1 className="mb-4 text-4xl font-black text-gray-900 md:text-5xl">{t.title}</h1>
          <p className="text-xl text-gray-600">{t.subtitle}</p>
          <div className="mt-5 inline-flex items-center rounded-full border border-cyan-200 bg-white px-5 py-2 font-bold text-cyan-800 shadow-sm">
            {t.account}: {t.free}
          </div>
          {foundingIntent && <div className="mx-auto mt-3 max-w-2xl rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-900">{t.founding}</div>}
        </div>

        <div className="grid gap-7 md:grid-cols-2">
          <Card className="border-2 border-transparent shadow-xl transition-shadow hover:border-pink-200 hover:shadow-2xl">
            <CardContent className="flex h-full flex-col p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg"><UserRound className="h-8 w-8" /></div>
              <h2 className="mb-3 text-3xl font-black text-gray-900">{t.individual}</h2>
              <p className="mb-7 flex-1 leading-relaxed text-gray-600">{t.individualBody}</p>
              <Button onClick={chooseIndividual} aria-label={t.individual} className="w-full bg-gradient-to-r from-pink-500 to-rose-600 py-6 font-bold text-white">{t.continue}</Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-transparent shadow-xl transition-shadow hover:border-purple-200 hover:shadow-2xl">
            <CardContent className="flex h-full flex-col p-8">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg"><BriefcaseBusiness className="h-8 w-8" /></div>
              <h2 className="mb-3 text-3xl font-black text-gray-900">{t.professional}</h2>
              <p className="mb-7 flex-1 leading-relaxed text-gray-600">{t.professionalBody}</p>
              <Button onClick={chooseProfessional} aria-label={t.professional} className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 py-6 font-bold text-white">{t.continue}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
