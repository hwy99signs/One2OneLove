import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, MessageCircle, BookOpen, ClipboardCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/Layout";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    back: "Back",
    badge: "Preview",
    title: "AI Relationship Coach",
    subtitle: "A guided O2OL coaching experience is being prepared. The live AI conversation service is not available yet.",
    privacyTitle: "Your private relationship details are not collected here",
    privacyBody: "This preview has no chat box and does not save or transmit relationship answers. O2OL will only activate conversational AI after its privacy, safety, and multilingual controls are ready.",
    boundaryTitle: "What this future tool will — and will not — be",
    boundaryBody: "It will offer educational relationship reflection and communication support. It will not diagnose, provide therapy, replace licensed professional care, or serve as crisis support.",
    useNow: "Relationship tools you can use now",
    practice: "Communication Practice",
    practiceDesc: "Practice listening, repair, appreciation, and clear requests without storing your responses.",
    library: "Relationship Library",
    libraryDesc: "Browse practical O2OL resources by relationship goal and situation.",
    checkIn: "Weekly Check-In",
    checkInDesc: "Use a private, in-memory weekly reflection to talk about connection, needs, repair, and next steps.",
    open: "Open tool",
    coming: "AI Coach conversations: coming later",
  },
  es: {
    back: "Volver",
    badge: "Vista previa",
    title: "Coach de Relaciones con IA",
    subtitle: "Se está preparando una experiencia guiada de coaching de O2OL. El servicio de conversación con IA aún no está disponible.",
    privacyTitle: "Tus detalles privados de relación no se recopilan aquí",
    privacyBody: "Esta vista previa no tiene chat y no guarda ni transmite respuestas sobre tu relación. O2OL activará la IA conversacional solo cuando estén listos sus controles de privacidad, seguridad y multilingües.",
    boundaryTitle: "Lo que esta futura herramienta será — y lo que no será",
    boundaryBody: "Ofrecerá reflexión educativa sobre relaciones y apoyo para la comunicación. No diagnosticará, no brindará terapia, no reemplazará atención profesional licenciada ni funcionará como apoyo de crisis.",
    useNow: "Herramientas de relación que puedes usar ahora",
    practice: "Práctica de Comunicación",
    practiceDesc: "Practica escucha, reparación, aprecio y peticiones claras sin guardar tus respuestas.",
    library: "Biblioteca de Relaciones",
    libraryDesc: "Explora recursos prácticos de O2OL por objetivo y situación de relación.",
    checkIn: "Revisión Semanal",
    checkInDesc: "Usa una reflexión semanal privada y temporal para hablar de conexión, necesidades, reparación y próximos pasos.",
    open: "Abrir herramienta",
    coming: "Conversaciones con el Coach IA: próximamente",
  },
  fr: {
    back: "Retour",
    badge: "Aperçu",
    title: "Coach Relationnel IA",
    subtitle: "Une expérience guidée de coaching O2OL est en préparation. Le service de conversation IA en direct n’est pas encore disponible.",
    privacyTitle: "Vos détails relationnels privés ne sont pas collectés ici",
    privacyBody: "Cet aperçu ne contient aucune zone de chat et n’enregistre ni ne transmet vos réponses relationnelles. O2OL n’activera l’IA conversationnelle que lorsque les contrôles de confidentialité, de sécurité et multilingues seront prêts.",
    boundaryTitle: "Ce que cet outil futur sera — et ne sera pas",
    boundaryBody: "Il proposera une réflexion relationnelle éducative et un soutien à la communication. Il ne posera pas de diagnostic, ne fournira pas de thérapie, ne remplacera pas les soins d’un professionnel agréé et ne servira pas de soutien de crise.",
    useNow: "Outils relationnels disponibles maintenant",
    practice: "Pratique de Communication",
    practiceDesc: "Entraînez l’écoute, la réparation, l’appréciation et les demandes claires sans enregistrer vos réponses.",
    library: "Bibliothèque Relationnelle",
    libraryDesc: "Parcourez les ressources pratiques O2OL selon votre objectif ou votre situation relationnelle.",
    checkIn: "Bilan Hebdomadaire",
    checkInDesc: "Utilisez une réflexion hebdomadaire privée et temporaire sur la connexion, les besoins, la réparation et les prochaines étapes.",
    open: "Ouvrir l’outil",
    coming: "Conversations avec le Coach IA : à venir",
  },
  it: {
    back: "Indietro",
    badge: "Anteprima",
    title: "Coach Relazionale IA",
    subtitle: "È in preparazione un’esperienza guidata di coaching O2OL. Il servizio di conversazione IA dal vivo non è ancora disponibile.",
    privacyTitle: "I dettagli privati della tua relazione non vengono raccolti qui",
    privacyBody: "Questa anteprima non contiene una chat e non salva né trasmette risposte sulla relazione. O2OL attiverà l’IA conversazionale solo quando i controlli di privacy, sicurezza e multilingua saranno pronti.",
    boundaryTitle: "Cosa sarà — e cosa non sarà — questo futuro strumento",
    boundaryBody: "Offrirà riflessione educativa sulle relazioni e supporto alla comunicazione. Non farà diagnosi, non fornirà terapia, non sostituirà professionisti abilitati e non sarà un servizio di supporto in crisi.",
    useNow: "Strumenti di relazione disponibili ora",
    practice: "Pratica di Comunicazione",
    practiceDesc: "Esercita ascolto, riparazione, apprezzamento e richieste chiare senza salvare le tue risposte.",
    library: "Biblioteca delle Relazioni",
    libraryDesc: "Esplora risorse pratiche O2OL in base all’obiettivo o alla situazione della relazione.",
    checkIn: "Check-In Settimanale",
    checkInDesc: "Usa una riflessione settimanale privata e temporanea su connessione, bisogni, riparazione e prossimi passi.",
    open: "Apri strumento",
    coming: "Conversazioni con il Coach IA: prossimamente",
  },
  de: {
    back: "Zurück",
    badge: "Vorschau",
    title: "KI-Beziehungscoach",
    subtitle: "Eine geführte O2OL-Coaching-Erfahrung wird vorbereitet. Der Live-KI-Konversationsdienst ist noch nicht verfügbar.",
    privacyTitle: "Private Beziehungsdetails werden hier nicht gesammelt",
    privacyBody: "Diese Vorschau hat kein Chatfeld und speichert oder überträgt keine Beziehungsantworten. O2OL aktiviert die Konversations-KI erst, wenn Datenschutz-, Sicherheits- und Mehrsprachenkontrollen bereit sind.",
    boundaryTitle: "Was dieses zukünftige Werkzeug sein wird — und was nicht",
    boundaryBody: "Es wird pädagogische Beziehungsreflexion und Unterstützung für Kommunikation bieten. Es stellt keine Diagnosen, bietet keine Therapie, ersetzt keine zugelassene professionelle Betreuung und ist keine Krisenhilfe.",
    useNow: "Beziehungswerkzeuge, die du jetzt nutzen kannst",
    practice: "Kommunikationspraxis",
    practiceDesc: "Übe Zuhören, Reparatur, Wertschätzung und klare Bitten, ohne deine Antworten zu speichern.",
    library: "Beziehungsbibliothek",
    libraryDesc: "Durchsuche praktische O2OL-Ressourcen nach Beziehungsziel und Situation.",
    checkIn: "Wöchentlicher Check-In",
    checkInDesc: "Nutze eine private, nur vorübergehende Wochenreflexion zu Verbindung, Bedürfnissen, Reparatur und nächsten Schritten.",
    open: "Werkzeug öffnen",
    coming: "KI-Coach-Gespräche: kommen später",
  },
};

const toolCards = [
  { key: "practice", descriptionKey: "practiceDesc", page: "CommunicationPractice", icon: MessageCircle },
  { key: "library", descriptionKey: "libraryDesc", page: "RelationshipLibrary", icon: BookOpen },
  { key: "checkIn", descriptionKey: "checkInDesc", page: "WeeklyCheckIn", icon: ClipboardCheck },
];

export default function RelationshipCoach() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to={createPageUrl("Home")}
          className="mb-8 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-purple-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t.back}
        </Link>

        <section className="rounded-3xl border border-purple-100 bg-white p-7 shadow-xl md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg">
              <Brain className="h-8 w-8" aria-hidden="true" />
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t.badge}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-950 md:text-5xl">{t.title}</h1>
            <p className="mt-4 text-lg leading-8 text-gray-600">{t.subtitle}</p>
            <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 text-sm font-semibold text-purple-900">
              {t.coming}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Card className="border-emerald-200 bg-emerald-50/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-950">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                {t.privacyTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="leading-7 text-emerald-900">{t.privacyBody}</CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/70">
            <CardHeader>
              <CardTitle className="text-amber-950">{t.boundaryTitle}</CardTitle>
            </CardHeader>
            <CardContent className="leading-7 text-amber-900">{t.boundaryBody}</CardContent>
          </Card>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-950">{t.useNow}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {toolCards.map(({ key, descriptionKey, page, icon: Icon }) => (
              <Card key={key} className="flex h-full flex-col border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle>{t[key]}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <p className="flex-1 leading-7 text-gray-600">{t[descriptionKey]}</p>
                  <Button asChild className="mt-5 w-full">
                    <Link to={createPageUrl(page)}>{t.open}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
