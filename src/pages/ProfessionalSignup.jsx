import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Briefcase, Building2, Mic2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const COPY = {
  en: {
    back: "Back to Sign Up",
    title: "Professional Sign Up",
    subtitle: "Choose the professional category that accurately describes how you will participate on One2One Love.",
    note: "Licensed clinical care and non-clinical relationship guidance are kept separate so users always know what type of professional they are viewing.",
    licensed: { title: "Licensed Therapist or Counselor", body: "For licensed mental-health professionals. Requires credential verification before approval.", button: "Start Credential Application" },
    coach: { title: "Relationship Coach or Educator", body: "For non-clinical coaches, educators, mentors and relationship-focused professionals.", button: "Start Non-Clinical Application" },
    contributor: { title: "Creator, Podcaster, Writer or Influencer", body: "For media contributors, creators, authors, speakers and relationship-focused voices.", button: "Start Contributor Application" },
    organization: { title: "Organization or Professional Partner", body: "For organizations, practices, nonprofits, media companies and professional partners.", button: "Start Organization Application" },
  },
  es: {
    back: "Volver a Registrarse", title: "Registro Profesional", subtitle: "Elija la categoría profesional que describa correctamente cómo participará en One2One Love.", note: "La atención clínica con licencia y la orientación no clínica se mantienen separadas para que los usuarios siempre sepan qué tipo de profesional están viendo.",
    licensed: { title: "Terapeuta o Consejero con Licencia", body: "Para profesionales de salud mental con licencia. Requiere verificación de credenciales antes de la aprobación.", button: "Iniciar Solicitud de Credenciales" },
    coach: { title: "Coach o Educador de Relaciones", body: "Para coaches, educadores, mentores y profesionales de relaciones no clínicos.", button: "Iniciar Solicitud No Clínica" },
    contributor: { title: "Creador, Podcaster, Escritor o Influencer", body: "Para colaboradores de medios, creadores, autores, conferencistas y voces centradas en relaciones.", button: "Iniciar Solicitud de Colaborador" },
    organization: { title: "Organización o Socio Profesional", body: "Para organizaciones, prácticas, entidades sin fines de lucro, medios y socios profesionales.", button: "Iniciar Solicitud de Organización" },
  },
  fr: {
    back: "Retour à l’Inscription", title: "Inscription Professionnelle", subtitle: "Choisissez la catégorie qui décrit précisément votre participation sur One2One Love.", note: "Les soins cliniques agréés et l’accompagnement relationnel non clinique sont séparés afin que les utilisateurs sachent toujours quel type de professionnel ils consultent.",
    licensed: { title: "Thérapeute ou Conseiller Agréé", body: "Pour les professionnels agréés de santé mentale. Vérification des qualifications obligatoire avant approbation.", button: "Commencer la Vérification" },
    coach: { title: "Coach ou Éducateur Relationnel", body: "Pour les coaches, éducateurs, mentors et professionnels relationnels non cliniques.", button: "Commencer la Candidature Non Clinique" },
    contributor: { title: "Créateur, Podcasteur, Auteur ou Influenceur", body: "Pour les contributeurs média, créateurs, auteurs, conférenciers et voix relationnelles.", button: "Commencer la Candidature Contributeur" },
    organization: { title: "Organisation ou Partenaire Professionnel", body: "Pour les organisations, cabinets, associations, médias et partenaires professionnels.", button: "Commencer la Candidature Organisation" },
  },
  it: {
    back: "Torna alla Registrazione", title: "Registrazione Professionale", subtitle: "Scegli la categoria che descrive correttamente il tuo ruolo su One2One Love.", note: "L’assistenza clinica autorizzata e il supporto relazionale non clinico restano separati affinché gli utenti sappiano sempre che tipo di professionista stanno consultando.",
    licensed: { title: "Terapeuta o Consulente Abilitato", body: "Per professionisti della salute mentale abilitati. Richiede verifica delle credenziali prima dell’approvazione.", button: "Avvia Verifica Credenziali" },
    coach: { title: "Coach o Educatore Relazionale", body: "Per coach, educatori, mentori e professionisti relazionali non clinici.", button: "Avvia Candidatura Non Clinica" },
    contributor: { title: "Creator, Podcaster, Scrittore o Influencer", body: "Per contributor media, creator, autori, speaker e voci dedicate alle relazioni.", button: "Avvia Candidatura Contributor" },
    organization: { title: "Organizzazione o Partner Professionale", body: "Per organizzazioni, studi, nonprofit, media e partner professionali.", button: "Avvia Candidatura Organizzazione" },
  },
  de: {
    back: "Zurück zur Registrierung", title: "Professionelle Registrierung", subtitle: "Wählen Sie die Kategorie, die Ihre Teilnahme auf One2One Love korrekt beschreibt.", note: "Lizenzierte klinische Versorgung und nicht-klinische Beziehungsbegleitung bleiben getrennt, damit Nutzer immer wissen, welche Art Fachkraft sie sehen.",
    licensed: { title: "Lizenzierter Therapeut oder Berater", body: "Für lizenzierte Fachkräfte der psychischen Gesundheit. Qualifikationsprüfung vor Genehmigung erforderlich.", button: "Qualifikationsprüfung Starten" },
    coach: { title: "Beziehungscoach oder -pädagoge", body: "Für nicht-klinische Coaches, Pädagogen, Mentoren und Beziehungsexperten.", button: "Nicht-Klinische Bewerbung Starten" },
    contributor: { title: "Creator, Podcaster, Autor oder Influencer", body: "Für Medien-Contributors, Creator, Autoren, Redner und beziehungsorientierte Stimmen.", button: "Contributor-Bewerbung Starten" },
    organization: { title: "Organisation oder Professioneller Partner", body: "Für Organisationen, Praxen, gemeinnützige Einrichtungen, Medienunternehmen und professionelle Partner.", button: "Organisationsbewerbung Starten" },
  },
};

const OPTIONS = [
  { key: "licensed", icon: BadgeCheck, page: "TherapistSignup", gradient: "from-emerald-500 to-teal-600" },
  { key: "coach", icon: Briefcase, page: "RelationshipProfessionalSignup", gradient: "from-blue-500 to-indigo-600" },
  { key: "contributor", icon: Mic2, page: "ContributorSignup", gradient: "from-fuchsia-500 to-purple-600" },
  { key: "organization", icon: Building2, page: "OrganizationSignup", gradient: "from-amber-500 to-orange-600" },
];

export default function ProfessionalSignup() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("SignUp"))} className="mb-8 text-gray-600">
          <ArrowLeft className="w-5 h-5 mr-2" />{t.back}
        </Button>

        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
          <p className="mt-5 max-w-4xl mx-auto rounded-2xl bg-white/80 border border-purple-100 p-4 text-gray-700 shadow-sm">{t.note}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {OPTIONS.map(({ key, icon: Icon, page, gradient }) => (
            <Card key={key} className="shadow-xl border-2 border-transparent hover:border-purple-200 transition-all h-full">
              <CardContent className="p-7 h-full flex flex-col">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg mb-5`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-3">{t[key].title}</h2>
                <p className="text-gray-600 leading-relaxed mb-6 flex-1">{t[key].body}</p>
                <Button onClick={() => navigate(createPageUrl(page))} className={`w-full bg-gradient-to-r ${gradient} text-white font-bold py-6`}>
                  {t[key].button}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
