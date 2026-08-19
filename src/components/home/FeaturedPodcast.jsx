import React from "react";
import { ArrowRight, Heart, Radio, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    eyebrow: "O2OL programming",
    title: "Conversations for real relationships",
    copy: "The O2OL Global Relationship Room brings together One2OneLove programming, thoughtful conversations, approved creators, guests, and replays throughout the day.",
    host1: "O2OL",
    host1Copy: "Calm, thoughtful, reflective conversations about relationships, connection, and growth.",
    host2: "AMORA",
    host2Copy: "Warm, empathetic conversations that help people reflect, communicate, and understand each other more clearly.",
    room: "Explore the Global Relationship Room",
    note: "Programming may include One2OneLove-hosted and third-party creator content. Third-party views do not necessarily represent One2OneLove or ERANT.",
  },
  es: {
    eyebrow: "Programación O2OL",
    title: "Conversaciones para relaciones reales",
    copy: "La Sala Global de Relaciones O2OL reúne programación de One2OneLove, conversaciones reflexivas, creadores aprobados, invitados y repeticiones durante todo el día.",
    host1: "O2OL",
    host1Copy: "Conversaciones tranquilas, reflexivas y consideradas sobre relaciones, conexión y crecimiento.",
    host2: "AMORA",
    host2Copy: "Conversaciones cálidas y empáticas que ayudan a reflexionar, comunicarse y comprenderse con mayor claridad.",
    room: "Explorar la Sala Global de Relaciones",
    note: "La programación puede incluir contenido de One2OneLove y de creadores externos. Las opiniones de terceros no representan necesariamente a One2OneLove o ERANT.",
  },
  fr: {
    eyebrow: "Programmes O2OL",
    title: "Des conversations pour de vraies relations",
    copy: "La Salle Mondiale des Relations O2OL réunit des programmes One2OneLove, des conversations réfléchies, des créateurs approuvés, des invités et des rediffusions tout au long de la journée.",
    host1: "O2OL",
    host1Copy: "Des conversations calmes, réfléchies et nuancées sur les relations, la connexion et la croissance.",
    host2: "AMORA",
    host2Copy: "Des conversations chaleureuses et empathiques qui aident à réfléchir, communiquer et mieux se comprendre.",
    room: "Explorer la Salle Mondiale des Relations",
    note: "La programmation peut inclure des contenus One2OneLove et de créateurs tiers. Les opinions de tiers ne représentent pas nécessairement One2OneLove ou ERANT.",
  },
  it: {
    eyebrow: "Programmazione O2OL",
    title: "Conversazioni per relazioni reali",
    copy: "La Sala Globale delle Relazioni O2OL riunisce programmi One2OneLove, conversazioni significative, creator approvati, ospiti e repliche durante tutta la giornata.",
    host1: "O2OL",
    host1Copy: "Conversazioni calme, attente e riflessive su relazioni, connessione e crescita.",
    host2: "AMORA",
    host2Copy: "Conversazioni calde ed empatiche che aiutano a riflettere, comunicare e comprendersi con maggiore chiarezza.",
    room: "Esplora la Sala Globale delle Relazioni",
    note: "La programmazione può includere contenuti One2OneLove e di creator terzi. Le opinioni di terzi non rappresentano necessariamente One2OneLove o ERANT.",
  },
  de: {
    eyebrow: "O2OL-Programm",
    title: "Gespräche für echte Beziehungen",
    copy: "Der O2OL Globale Beziehungsraum verbindet One2OneLove-Programme, nachdenkliche Gespräche, zugelassene Creators, Gäste und Wiederholungen über den ganzen Tag hinweg.",
    host1: "O2OL",
    host1Copy: "Ruhige, durchdachte und reflektierte Gespräche über Beziehungen, Verbindung und Wachstum.",
    host2: "AMORA",
    host2Copy: "Warme, einfühlsame Gespräche, die Menschen beim Reflektieren, Kommunizieren und besseren gegenseitigen Verstehen unterstützen.",
    room: "Globalen Beziehungsraum entdecken",
    note: "Das Programm kann One2OneLove-Inhalte und Inhalte externer Creators enthalten. Ansichten Dritter entsprechen nicht notwendigerweise denen von One2OneLove oder ERANT.",
  },
};

export default function FeaturedPodcast() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <section className="bg-white px-4 py-14 md:py-20" aria-labelledby="o2ol-programming-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-sm font-semibold text-purple-700">
            <Radio className="h-4 w-4" aria-hidden="true" /> {t.eyebrow}
          </div>
          <h2 id="o2ol-programming-heading" className="mt-4 text-3xl font-bold text-slate-900 md:text-5xl">{t.title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">{t.copy}</p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white p-6 md:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">{t.host1}</h3>
            <p className="mt-2 leading-7 text-slate-600">{t.host1Copy}</p>
          </div>
          <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-6 md:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <Heart className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 text-2xl font-bold text-slate-900">{t.host2}</h3>
            <p className="mt-2 leading-7 text-slate-600">{t.host2Copy}</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button asChild size="lg">
            <Link to="/GlobalRelationshipRoom">
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
              {t.room}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <p className="mx-auto mt-5 max-w-3xl text-xs leading-5 text-slate-500">{t.note}</p>
        </div>
      </div>
    </section>
  );
}
