import React from "react";
import { Headphones, Radio, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Relationship Audio & Programming",
    subtitle: "One2OneLove does not currently maintain a verified third-party podcast catalog with ratings, episode counts, or subscription claims.",
    notice: "Instead of showing unverified podcast statistics or dead Listen buttons, this page now sends you to real One2OneLove programming and relationship resources.",
    explore: "Explore real O2OL content",
    show: "O2OL Show", showDesc: "Visit the O2OL and AMORA programming destination.",
    room: "Global Relationship Room", roomDesc: "See live, upcoming, creator, replay, partner, and special programming.",
    library: "Relationship Library", libraryDesc: "Browse practical relationship resources by what you want help with.",
    back: "Back to Relationship Support"
  },
  es: {
    title: "Audio y Programación de Relaciones",
    subtitle: "One2OneLove no mantiene actualmente un catálogo verificado de podcasts externos con calificaciones, número de episodios o afirmaciones de suscripción.",
    notice: "En lugar de mostrar estadísticas de podcasts no verificadas o botones de escucha sin función, esta página ahora dirige a programación y recursos reales de One2OneLove.",
    explore: "Explora contenido real de O2OL",
    show: "O2OL Show", showDesc: "Visita el destino de programación de O2OL y AMORA.",
    room: "Sala Global de Relaciones", roomDesc: "Consulta programación en vivo, próxima, de creadores, repeticiones, socios y especiales.",
    library: "Biblioteca de Relaciones", libraryDesc: "Explora recursos prácticos según el tipo de ayuda que buscas.",
    back: "Volver al Apoyo para Relaciones"
  },
  fr: {
    title: "Audio et Programmation Relationnelle",
    subtitle: "One2OneLove ne maintient actuellement aucun catalogue vérifié de podcasts tiers avec évaluations, nombres d’épisodes ou affirmations d’abonnement.",
    notice: "Au lieu d’afficher des statistiques de podcasts non vérifiées ou des boutons d’écoute sans fonction, cette page vous dirige maintenant vers de vrais programmes et ressources One2OneLove.",
    explore: "Découvrir le vrai contenu O2OL",
    show: "O2OL Show", showDesc: "Visitez la destination de programmation O2OL et AMORA.",
    room: "Salle Mondiale des Relations", roomDesc: "Consultez les programmes en direct, à venir, de créateurs, rediffusions, partenaires et spéciaux.",
    library: "Bibliothèque Relationnelle", libraryDesc: "Parcourez des ressources pratiques selon le type d’aide recherché.",
    back: "Retour au Soutien Relationnel"
  },
  it: {
    title: "Audio e Programmazione Relazionale",
    subtitle: "One2OneLove non mantiene attualmente un catalogo verificato di podcast di terze parti con valutazioni, numero di episodi o affermazioni di abbonamento.",
    notice: "Invece di mostrare statistiche non verificate o pulsanti di ascolto senza funzione, questa pagina ora porta a programmazione e risorse reali One2OneLove.",
    explore: "Esplora contenuti reali O2OL",
    show: "O2OL Show", showDesc: "Visita la destinazione di programmazione O2OL e AMORA.",
    room: "Sala Globale delle Relazioni", roomDesc: "Consulta programmazione live, prossima, creator, replay, partner e speciale.",
    library: "Biblioteca delle Relazioni", libraryDesc: "Esplora risorse pratiche in base al tipo di aiuto che cerchi.",
    back: "Torna al Supporto Relazionale"
  },
  de: {
    title: "Beziehungs-Audio & Programme",
    subtitle: "One2OneLove betreibt derzeit keinen verifizierten Drittanbieter-Podcastkatalog mit Bewertungen, Episodenzahlen oder Abonnementbehauptungen.",
    notice: "Statt nicht verifizierter Podcast-Statistiken oder funktionsloser Listen-Schaltflächen führt diese Seite jetzt zu echten One2OneLove-Programmen und Beziehungsressourcen.",
    explore: "Echte O2OL-Inhalte entdecken",
    show: "O2OL Show", showDesc: "Besucht die O2OL- und AMORA-Programmdestination.",
    room: "Globaler Beziehungsraum", roomDesc: "Seht Live-, kommende, Creator-, Replay-, Partner- und Spezialprogramme.",
    library: "Beziehungsbibliothek", libraryDesc: "Durchsucht praktische Ressourcen nach der Art von Hilfe, die ihr sucht.",
    back: "Zurück zur Beziehungsunterstützung"
  }
};

export default function PodcastsSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const resources = [
    [t.show, t.showDesc, '/O2OLShow', Headphones],
    [t.room, t.roomDesc, '/GlobalRelationshipRoom', Radio],
    [t.library, t.libraryDesc, '/RelationshipLibrary', Sparkles],
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 px-4 py-12 md:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <Headphones className="mx-auto h-14 w-14 text-orange-600" aria-hidden="true" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <p className="mt-5 rounded-2xl border border-orange-100 bg-white p-4 text-left text-sm leading-6 text-slate-700">{t.notice}</p>
        </header>

        <section className="mt-10" aria-labelledby="o2ol-audio-heading">
          <h2 id="o2ol-audio-heading" className="text-center text-2xl font-bold text-slate-900">{t.explore}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {resources.map(([title, description, href, Icon]) => (
              <Link key={href} to={href} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2">
                <Icon className="h-7 w-7 text-orange-600" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center"><Button asChild><Link to="/CoupleSupport"><Users className="mr-2 h-4 w-4" aria-hidden="true" />{t.back}</Link></Button></div>
        </section>
      </div>
    </main>
  );
}
