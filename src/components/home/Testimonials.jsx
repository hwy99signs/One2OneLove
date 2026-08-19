import React from "react";
import { Heart, MessageCircle, Sparkles } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    heading: "Small habits can strengthen connection",
    subheading: "One2OneLove is designed to make healthy relationship habits easier to practice in everyday life.",
    cards: [
      ["Say what matters", "Love Notes and conversation prompts make it easier to express appreciation instead of assuming your partner already knows."],
      ["Make time intentional", "Date ideas, daily questions, and couple activities turn ordinary time together into opportunities to reconnect."],
      ["Keep learning together", "Relationship tools, programming, and guided reflection give couples new ways to understand themselves and each other."],
    ],
    note: "We do not publish invented customer testimonials. Verified community stories can be featured here in the future with permission.",
  },
  es: {
    heading: "Los pequeños hábitos pueden fortalecer la conexión",
    subheading: "One2OneLove está diseñado para facilitar la práctica diaria de hábitos saludables en las relaciones.",
    cards: [
      ["Di lo que importa", "Las Notas de Amor y las preguntas de conversación facilitan expresar aprecio en lugar de asumir que tu pareja ya lo sabe."],
      ["Haz que el tiempo sea intencional", "Las ideas para citas, preguntas diarias y actividades para parejas convierten el tiempo cotidiano en oportunidades para reconectarse."],
      ["Sigan aprendiendo juntos", "Las herramientas, la programación y la reflexión guiada ofrecen nuevas formas de comprenderse a uno mismo y a la pareja."],
    ],
    note: "No publicamos testimonios inventados. En el futuro podremos presentar historias verificadas de la comunidad con su permiso.",
  },
  fr: {
    heading: "De petites habitudes peuvent renforcer la connexion",
    subheading: "One2OneLove est conçu pour rendre les bonnes habitudes relationnelles plus faciles à pratiquer au quotidien.",
    cards: [
      ["Dites ce qui compte", "Les Notes d’Amour et les questions de conversation facilitent l’expression de l’appréciation au lieu de supposer que votre partenaire le sait déjà."],
      ["Rendez le temps intentionnel", "Les idées de rendez-vous, questions quotidiennes et activités de couple transforment le quotidien en occasions de se reconnecter."],
      ["Continuez à apprendre ensemble", "Les outils relationnels, les programmes et la réflexion guidée donnent aux couples de nouvelles façons de se comprendre."],
    ],
    note: "Nous ne publions pas de faux témoignages clients. Des histoires vérifiées de la communauté pourront être présentées plus tard avec autorisation.",
  },
  it: {
    heading: "Piccole abitudini possono rafforzare la connessione",
    subheading: "One2OneLove è pensato per rendere più facile praticare ogni giorno abitudini sane nella relazione.",
    cards: [
      ["Dì ciò che conta", "Le Note d’Amore e gli spunti di conversazione rendono più semplice esprimere apprezzamento invece di dare per scontato che il partner lo sappia."],
      ["Rendi intenzionale il tempo insieme", "Idee per appuntamenti, domande quotidiane e attività di coppia trasformano il tempo normale in opportunità per riconnettersi."],
      ["Continuate a imparare insieme", "Strumenti relazionali, programmazione e riflessione guidata offrono alle coppie nuovi modi per comprendere se stesse e il partner."],
    ],
    note: "Non pubblichiamo testimonianze inventate. In futuro potranno essere presentate storie verificate della comunità con il consenso degli interessati.",
  },
  de: {
    heading: "Kleine Gewohnheiten können Verbindung stärken",
    subheading: "One2OneLove soll gesunde Beziehungsgewohnheiten im Alltag leichter umsetzbar machen.",
    cards: [
      ["Sag, was wichtig ist", "Liebesbotschaften und Gesprächsimpulse erleichtern es, Wertschätzung auszusprechen, statt anzunehmen, dass der Partner sie bereits kennt."],
      ["Gestaltet Zeit bewusst", "Date-Ideen, tägliche Fragen und Paar-Aktivitäten machen aus normaler gemeinsamer Zeit neue Gelegenheiten für Nähe."],
      ["Lernt gemeinsam weiter", "Beziehungstools, Programme und geführte Reflexion eröffnen Paaren neue Wege, sich selbst und einander besser zu verstehen."],
    ],
    note: "Wir veröffentlichen keine erfundenen Kundenstimmen. Verifizierte Geschichten aus der Community können später mit Zustimmung vorgestellt werden.",
  },
};

const icons = [Heart, MessageCircle, Sparkles];

export default function Testimonials() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-14 md:py-20" aria-labelledby="relationship-habits-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="relationship-habits-heading" className="text-3xl font-bold text-slate-900 md:text-4xl">{t.heading}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">{t.subheading}</p>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {t.cards.map(([title, copy], index) => {
            const Icon = icons[index];
            return (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-5 text-slate-500">{t.note}</p>
      </div>
    </section>
  );
}
