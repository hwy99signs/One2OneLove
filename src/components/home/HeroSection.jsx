import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, HeartHandshake, MessageCircle, Radio, Users } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "One2OneLove",
    slogan: "We Start Where Dating Sites Stop.",
    subtitle: "Tools, conversations, and experiences that help people care for the relationships they already have.",
    description: "Reconnect, communicate, appreciate each other, make time together more intentional, and keep growing—one small relationship habit at a time.",
    loveNotes: "Send a Love Note",
    dailyQuestion: "Today's Question",
    marriageMatters: "Marriage Matters",
    globalRoom: "Global Relationship Room",
    relationshipSupport: "Relationship Support",
    dateIdeas: "Date Ideas",
  },
  es: {
    title: "One2OneLove",
    slogan: "Comenzamos Donde los Sitios de Citas Se Detienen.",
    subtitle: "Herramientas, conversaciones y experiencias para cuidar las relaciones que ya forman parte de tu vida.",
    description: "Reconéctense, comuníquense, valórense, hagan más intencional el tiempo juntos y sigan creciendo, un pequeño hábito de relación a la vez.",
    loveNotes: "Enviar una Nota de Amor",
    dailyQuestion: "Pregunta de Hoy",
    marriageMatters: "El Matrimonio Importa",
    globalRoom: "Sala Global de Relaciones",
    relationshipSupport: "Apoyo para Relaciones",
    dateIdeas: "Ideas para Citas",
  },
  fr: {
    title: "One2OneLove",
    slogan: "Nous Commençons Là Où les Sites de Rencontres S'Arrêtent.",
    subtitle: "Des outils, des conversations et des expériences pour prendre soin des relations déjà présentes dans votre vie.",
    description: "Reconnectez-vous, communiquez, montrez votre appréciation, rendez votre temps ensemble plus intentionnel et continuez à grandir, une petite habitude relationnelle à la fois.",
    loveNotes: "Envoyer une Note d'Amour",
    dailyQuestion: "Question du Jour",
    marriageMatters: "Le Mariage Compte",
    globalRoom: "Salle Mondiale des Relations",
    relationshipSupport: "Soutien aux Relations",
    dateIdeas: "Idées de Rendez-vous",
  },
  it: {
    title: "One2OneLove",
    slogan: "Iniziamo Dove i Siti di Incontri Si Fermano.",
    subtitle: "Strumenti, conversazioni ed esperienze per prendersi cura delle relazioni già presenti nella propria vita.",
    description: "Riconnettetevi, comunicate, mostrate apprezzamento, rendete più intenzionale il tempo insieme e continuate a crescere, una piccola abitudine relazionale alla volta.",
    loveNotes: "Invia una Nota d'Amore",
    dailyQuestion: "Domanda di Oggi",
    marriageMatters: "Il Matrimonio Conta",
    globalRoom: "Sala Globale delle Relazioni",
    relationshipSupport: "Supporto per Relazioni",
    dateIdeas: "Idee per Appuntamenti",
  },
  de: {
    title: "One2OneLove",
    slogan: "Wir Beginnen, Wo Dating-Seiten Aufhören.",
    subtitle: "Werkzeuge, Gespräche und Erlebnisse, die Menschen helfen, die Beziehungen in ihrem Leben bewusst zu pflegen.",
    description: "Findet wieder Nähe, kommuniziert, zeigt Wertschätzung, gestaltet gemeinsame Zeit bewusster und wachst weiter – mit kleinen Beziehungsgewohnheiten im Alltag.",
    loveNotes: "Liebesbotschaft senden",
    dailyQuestion: "Heutige Frage",
    marriageMatters: "Ehe Zählt",
    globalRoom: "Globaler Beziehungsraum",
    relationshipSupport: "Beziehungsunterstützung",
    dateIdeas: "Date-Ideen",
  },
};

const primaryActions = [
  ["loveNotes", "LoveNotes", Heart],
  ["dailyQuestion", "/DailyQuestion", MessageCircle],
  ["marriageMatters", "/MarriageMatters", HeartHandshake],
];

const secondaryActions = [
  ["globalRoom", "/GlobalRelationshipRoom", Radio],
  ["relationshipSupport", "CoupleSupport", Users],
  ["dateIdeas", "DateIdeas", Calendar],
];

function actionUrl(target) {
  return target.startsWith("/") ? target : createPageUrl(target);
}

export default function HeroSection() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <section className="relative flex min-h-[82vh] items-center justify-center overflow-hidden px-4 py-14" aria-labelledby="home-hero-title">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/691277042e7df273d4135492/bd7450758_-appbackgroundphoto.png')",
        }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/55" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="https://hphhmjcutesqsdnubnnw.supabase.co/storage/v1/object/public/app-assets/logo.png"
            alt="One2OneLove"
            className="h-28 w-auto drop-shadow-2xl sm:h-36 md:h-44"
          />
        </div>

        <h1 id="home-hero-title" className="text-5xl font-bold tracking-tight text-white drop-shadow-2xl sm:text-6xl md:text-7xl">
          {t.title}
        </h1>
        <p className="mt-4 text-2xl font-bold italic text-yellow-300 drop-shadow-lg sm:text-3xl">{t.slogan}</p>
        <p className="mx-auto mt-6 max-w-4xl text-xl font-medium leading-relaxed text-white drop-shadow-lg md:text-2xl">{t.subtitle}</p>
        <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-white/95 drop-shadow-lg md:text-lg">{t.description}</p>

        <div className="mx-auto mt-9 flex max-w-4xl flex-wrap justify-center gap-3">
          {primaryActions.map(([labelKey, target, Icon]) => (
            <Button key={labelKey} asChild size="lg" className="rounded-xl bg-pink-600 font-semibold hover:bg-pink-700">
              <Link to={actionUrl(target)}>
                <Icon className="mr-2 h-5 w-5" aria-hidden="true" />
                {t[labelKey]}
              </Link>
            </Button>
          ))}
        </div>

        <div className="mx-auto mt-3 flex max-w-4xl flex-wrap justify-center gap-3">
          {secondaryActions.map(([labelKey, target, Icon]) => (
            <Button key={labelKey} asChild size="lg" variant="secondary" className="rounded-xl bg-white/95 font-semibold text-slate-900 hover:bg-white">
              <Link to={actionUrl(target)}>
                <Icon className="mr-2 h-5 w-5" aria-hidden="true" />
                {t[labelKey]}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}