import React from "react";
import { Globe, Heart, Shield } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    heading: "Relationships belong here",
    intro: "One2OneLove welcomes couples across cultures, faiths, identities, orientations, and relationship experiences. Respect and dignity are the starting point.",
    cards: [
      ["For real people", "Different backgrounds and life experiences deserve thoughtful, respectful relationship resources."],
      ["A broad point of view", "Programming and resources are designed to reflect the variety of modern relationships without treating one story as the only story."],
      ["Respect comes first", "Community participation is built around respect, boundaries, consent, and constructive conversation."],
    ],
    notDating: "One2OneLove is not a dating site.",
    notDatingCopy: "It is a relationship platform for people who want to care for, understand, and strengthen the relationships already in their lives.",
  },
  es: {
    heading: "Aquí hay espacio para las relaciones",
    intro: "One2OneLove da la bienvenida a parejas de diferentes culturas, religiones, identidades, orientaciones y experiencias de relación. El respeto y la dignidad son el punto de partida.",
    cards: [
      ["Para personas reales", "Diferentes orígenes y experiencias de vida merecen recursos de relación considerados y respetuosos."],
      ["Una perspectiva amplia", "La programación y los recursos buscan reflejar la variedad de las relaciones modernas sin presentar una sola historia como la única válida."],
      ["El respeto es primero", "La participación en la comunidad se basa en respeto, límites, consentimiento y conversación constructiva."],
    ],
    notDating: "One2OneLove no es un sitio de citas.",
    notDatingCopy: "Es una plataforma de relaciones para personas que quieren cuidar, comprender y fortalecer las relaciones que ya forman parte de sus vidas.",
  },
  fr: {
    heading: "Toutes les relations ont leur place ici",
    intro: "One2OneLove accueille les couples de cultures, croyances, identités, orientations et parcours relationnels variés. Le respect et la dignité sont notre point de départ.",
    cards: [
      ["Pour de vraies personnes", "Des parcours et des expériences de vie différents méritent des ressources relationnelles réfléchies et respectueuses."],
      ["Une perspective ouverte", "Les programmes et ressources cherchent à refléter la diversité des relations modernes sans présenter une seule histoire comme modèle unique."],
      ["Le respect d’abord", "La participation à la communauté repose sur le respect, les limites, le consentement et des échanges constructifs."],
    ],
    notDating: "One2OneLove n’est pas un site de rencontres.",
    notDatingCopy: "C’est une plateforme relationnelle pour les personnes qui souhaitent prendre soin, mieux comprendre et renforcer les relations déjà présentes dans leur vie.",
  },
  it: {
    heading: "Qui c’è spazio per le relazioni",
    intro: "One2OneLove accoglie coppie di culture, fedi, identità, orientamenti ed esperienze relazionali diverse. Rispetto e dignità sono il punto di partenza.",
    cards: [
      ["Per persone reali", "Esperienze e percorsi di vita diversi meritano risorse relazionali attente e rispettose."],
      ["Una prospettiva ampia", "Programmi e risorse cercano di riflettere la varietà delle relazioni moderne senza presentare una sola storia come l’unica valida."],
      ["Prima di tutto il rispetto", "La partecipazione alla comunità si basa su rispetto, confini, consenso e conversazioni costruttive."],
    ],
    notDating: "One2OneLove non è un sito di incontri.",
    notDatingCopy: "È una piattaforma dedicata alle relazioni per chi vuole prendersi cura, comprendere e rafforzare i rapporti già presenti nella propria vita.",
  },
  de: {
    heading: "Beziehungen haben hier ihren Platz",
    intro: "One2OneLove heißt Paare aus unterschiedlichen Kulturen, Glaubensrichtungen, Identitäten, Orientierungen und Beziehungserfahrungen willkommen. Respekt und Würde stehen am Anfang.",
    cards: [
      ["Für echte Menschen", "Unterschiedliche Hintergründe und Lebenserfahrungen verdienen durchdachte und respektvolle Beziehungsangebote."],
      ["Eine breite Perspektive", "Programme und Ressourcen sollen die Vielfalt moderner Beziehungen widerspiegeln, ohne eine einzige Geschichte zum alleinigen Maßstab zu machen."],
      ["Respekt zuerst", "Die Teilnahme an der Community basiert auf Respekt, Grenzen, Zustimmung und konstruktiven Gesprächen."],
    ],
    notDating: "One2OneLove ist keine Dating-Seite.",
    notDatingCopy: "Es ist eine Beziehungsplattform für Menschen, die die Beziehungen in ihrem Leben pflegen, besser verstehen und stärken möchten.",
  },
};

const icons = [Globe, Heart, Shield];

export default function DiversitySection() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <section className="bg-gradient-to-br from-purple-700 via-pink-700 to-rose-700 px-4 py-10 md:py-14" aria-labelledby="inclusive-platform-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <h2 id="inclusive-platform-heading" className="text-3xl font-bold text-white md:text-4xl">{t.heading}</h2>
          <p className="mt-4 text-base leading-7 text-white/90 md:text-lg">{t.intro}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {t.cards.map(([title, copy], index) => {
            const Icon = icons[index];
            return (
              <div key={title} className="rounded-2xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur-sm">
                <Icon className="mx-auto h-8 w-8 text-white" aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/85">{copy}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-5 text-center backdrop-blur-sm">
          <p className="text-lg font-bold text-white">{t.notDating}</p>
          <p className="mx-auto mt-2 max-w-3xl text-sm leading-6 text-white/90 md:text-base">{t.notDatingCopy}</p>
        </div>
      </div>
    </section>
  );
}
