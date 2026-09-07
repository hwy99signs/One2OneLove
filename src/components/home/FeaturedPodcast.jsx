import React from "react";
import { Heart, Mic2 } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    heading: "Everything You Need for a Perfect Relationship",
    intro: "Discover all the amazing ways One2OneLove helps couples connect, communicate, and create lasting memories together.",
    featured: "Coming Soon",
    showName: "O2OL + Amora",
    showLabel: "One2OneLove Talk Show",
    description: "Real conversations about love, dating, marriage, communication and relationships.",
    subtext: "Thoughtful perspectives, honest questions and a little fun — all centered on helping relationships grow."
  },
  es: {
    heading: "Todo Lo Que Necesitas para una Relación Plena",
    intro: "Descubre todas las formas en que One2OneLove ayuda a las parejas a conectarse, comunicarse y crear recuerdos duraderos juntos.",
    featured: "Próximamente",
    showName: "O2OL + Amora",
    showLabel: "Programa de One2OneLove",
    description: "Conversaciones reales sobre amor, citas, matrimonio, comunicación y relaciones.",
    subtext: "Perspectivas reflexivas, preguntas sinceras y un poco de diversión, todo centrado en ayudar a que las relaciones crezcan."
  },
  fr: {
    heading: "Tout Ce Dont Vous Avez Besoin pour une Relation Épanouie",
    intro: "Découvrez toutes les façons dont One2OneLove aide les couples à se rapprocher, communiquer et créer ensemble des souvenirs durables.",
    featured: "Bientôt disponible",
    showName: "O2OL + Amora",
    showLabel: "Émission One2OneLove",
    description: "De vraies conversations sur l'amour, les rencontres, le mariage, la communication et les relations.",
    subtext: "Des points de vue réfléchis, des questions sincères et un peu de légèreté — le tout pour aider les relations à grandir."
  },
  it: {
    heading: "Tutto Ciò di Cui Hai Bisogno per una Relazione Appagante",
    intro: "Scopri tutti i modi in cui One2OneLove aiuta le coppie a connettersi, comunicare e creare insieme ricordi duraturi.",
    featured: "Prossimamente",
    showName: "O2OL + Amora",
    showLabel: "Talk Show One2OneLove",
    description: "Conversazioni vere su amore, appuntamenti, matrimonio, comunicazione e relazioni.",
    subtext: "Prospettive attente, domande sincere e un po' di divertimento — tutto pensato per aiutare le relazioni a crescere."
  },
  de: {
    heading: "Alles, Was Ihr für eine Erfüllte Beziehung Braucht",
    intro: "Entdeckt all die Möglichkeiten, wie One2OneLove Paaren hilft, sich zu verbinden, zu kommunizieren und gemeinsam bleibende Erinnerungen zu schaffen.",
    featured: "Demnächst",
    showName: "O2OL + Amora",
    showLabel: "One2OneLove Talkshow",
    description: "Echte Gespräche über Liebe, Dating, Ehe, Kommunikation und Beziehungen.",
    subtext: "Nachdenkliche Perspektiven, ehrliche Fragen und ein wenig Spaß — alles mit dem Ziel, Beziehungen wachsen zu lassen."
  }
};

export default function FeaturedPodcast() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="bg-white pt-20 pb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-16">
          {t.heading}
        </h2>

        <p className="text-xl text-center text-gray-600 mb-6 max-w-3xl mx-auto">
          {t.intro}
        </p>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-6 pt-10 border-2 border-pink-200 shadow-xl">
            <div className="absolute top-4 right-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-1.5 text-sm font-bold text-white shadow-md">
              ✨ {t.featured} ✨
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0">
                <Heart className="w-12 h-12 text-white fill-white" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                  <Mic2 className="w-5 h-5 text-pink-500" />
                  <span className="text-sm font-semibold text-pink-600 uppercase">{t.showLabel}</span>
                </div>

                <h4 className="text-2xl font-bold text-gray-900 mb-2">
                  {t.showName}
                </h4>

                <p className="text-base font-medium text-gray-800 mb-2">
                  {t.description}
                </p>

                <p className="text-gray-600 leading-relaxed">
                  {t.subtext}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
