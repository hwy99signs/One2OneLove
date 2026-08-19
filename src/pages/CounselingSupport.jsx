import React from "react";
import { Heart, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Professional Relationship Support",
    subtitle: "One2OneLove does not currently operate a verified therapist directory or counseling-booking service.",
    notice: "We removed unverified provider listings, ratings, prices, session counts, and booking claims from this page. One2OneLove relationship tools are educational and are not a substitute for therapy, diagnosis, crisis care, or advice from a licensed professional.",
    supportTitle: "Use One2OneLove for educational relationship support",
    communication: "Communication Practice",
    communicationDesc: "Practice calmer conversation habits without saving your responses.",
    reset: "Relationship Reset",
    resetDesc: "Use a guided reflection when you want to slow down and choose a constructive next step.",
    library: "Relationship Library",
    libraryDesc: "Browse real One2OneLove resources by the kind of relationship help you are looking for.",
    back: "Back to Relationship Support"
  },
  es: {
    title: "Apoyo Profesional para Relaciones",
    subtitle: "One2OneLove no opera actualmente un directorio verificado de terapeutas ni un servicio de reserva de asesoramiento.",
    notice: "Eliminamos de esta página listados de proveedores, calificaciones, precios, números de sesiones y afirmaciones de reserva no verificados. Las herramientas de One2OneLove son educativas y no sustituyen terapia, diagnóstico, atención de crisis ni el consejo de un profesional con licencia.",
    supportTitle: "Usa One2OneLove para apoyo educativo de relaciones",
    communication: "Práctica de Comunicación",
    communicationDesc: "Practiquen hábitos de conversación más tranquilos sin guardar sus respuestas.",
    reset: "Reinicio de la Relación",
    resetDesc: "Usen una reflexión guiada cuando quieran bajar el ritmo y elegir un siguiente paso constructivo.",
    library: "Biblioteca de Relaciones",
    libraryDesc: "Exploren recursos reales de One2OneLove según el tipo de ayuda de relación que buscan.",
    back: "Volver al Apoyo para Relaciones"
  },
  fr: {
    title: "Soutien Relationnel Professionnel",
    subtitle: "One2OneLove n’exploite actuellement ni annuaire vérifié de thérapeutes ni service de réservation de consultations.",
    notice: "Nous avons retiré de cette page les listes de prestataires, évaluations, prix, nombres de séances et affirmations de réservation non vérifiés. Les outils One2OneLove sont éducatifs et ne remplacent ni une thérapie, ni un diagnostic, ni une aide de crise, ni les conseils d’un professionnel agréé.",
    supportTitle: "Utilisez One2OneLove pour un soutien relationnel éducatif",
    communication: "Pratique de Communication",
    communicationDesc: "Entraînez-vous à des habitudes de conversation plus calmes sans enregistrer vos réponses.",
    reset: "Réinitialisation de la Relation",
    resetDesc: "Utilisez une réflexion guidée lorsque vous souhaitez ralentir et choisir une prochaine étape constructive.",
    library: "Bibliothèque Relationnelle",
    libraryDesc: "Parcourez les vraies ressources One2OneLove selon le type d’aide relationnelle recherchée.",
    back: "Retour au Soutien Relationnel"
  },
  it: {
    title: "Supporto Relazionale Professionale",
    subtitle: "One2OneLove non gestisce attualmente un elenco verificato di terapeuti né un servizio di prenotazione di consulenze.",
    notice: "Abbiamo rimosso da questa pagina elenchi di professionisti, valutazioni, prezzi, numeri di sessioni e affermazioni di prenotazione non verificati. Gli strumenti One2OneLove sono educativi e non sostituiscono terapia, diagnosi, assistenza di crisi o il consiglio di un professionista autorizzato.",
    supportTitle: "Usa One2OneLove per supporto relazionale educativo",
    communication: "Pratica di Comunicazione",
    communicationDesc: "Esercitate abitudini di conversazione più calme senza salvare le vostre risposte.",
    reset: "Reset della Relazione",
    resetDesc: "Usate una riflessione guidata quando volete rallentare e scegliere un prossimo passo costruttivo.",
    library: "Biblioteca delle Relazioni",
    libraryDesc: "Esplorate le risorse reali One2OneLove in base al tipo di aiuto relazionale che cercate.",
    back: "Torna al Supporto Relazionale"
  },
  de: {
    title: "Professionelle Beziehungsunterstützung",
    subtitle: "One2OneLove betreibt derzeit weder ein verifiziertes Therapeutenverzeichnis noch einen Beratungs-Buchungsdienst.",
    notice: "Wir haben nicht verifizierte Anbieterprofile, Bewertungen, Preise, Sitzungszahlen und Buchungsbehauptungen von dieser Seite entfernt. One2OneLove-Werkzeuge sind pädagogisch und ersetzen keine Therapie, Diagnose, Krisenversorgung oder Beratung durch lizenzierte Fachpersonen.",
    supportTitle: "Nutzt One2OneLove für pädagogische Beziehungsunterstützung",
    communication: "Kommunikationsübung",
    communicationDesc: "Übt ruhigere Gesprächsgewohnheiten, ohne eure Antworten zu speichern.",
    reset: "Beziehungs-Reset",
    resetDesc: "Nutzt eine geführte Reflexion, wenn ihr langsamer werden und einen konstruktiven nächsten Schritt wählen möchtet.",
    library: "Beziehungsbibliothek",
    libraryDesc: "Durchsucht echte One2OneLove-Ressourcen nach der Art von Beziehungsunterstützung, die ihr sucht.",
    back: "Zurück zur Beziehungsunterstützung"
  }
};

export default function CounselingSupport() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const resources = [
    [t.communication, t.communicationDesc, '/CommunicationPractice', MessageCircle],
    [t.reset, t.resetDesc, '/RelationshipReset', Heart],
    [t.library, t.libraryDesc, '/RelationshipLibrary', Sparkles],
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 px-4 py-12 md:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <ShieldCheck className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
        </header>

        <Card className="mx-auto mt-8 max-w-3xl border-indigo-100 bg-white shadow-sm">
          <CardContent className="p-6 md:p-8">
            <p className="rounded-2xl bg-indigo-50 p-5 text-sm leading-6 text-indigo-950">{t.notice}</p>
          </CardContent>
        </Card>

        <section className="mt-10" aria-labelledby="educational-support-heading">
          <h2 id="educational-support-heading" className="text-center text-2xl font-bold text-slate-900">{t.supportTitle}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {resources.map(([title, description, href, Icon]) => (
              <Link key={href} to={href} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                <Icon className="h-7 w-7 text-indigo-600" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center"><Button asChild><Link to="/CoupleSupport">{t.back}</Link></Button></div>
        </section>
      </div>
    </main>
  );
}
