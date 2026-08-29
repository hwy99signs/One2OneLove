import React from "react";
import { ArrowLeft, CalendarHeart, Heart, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/Layout";
import { createPageUrl } from "@/utils";

const translations = {
  en: {
    back: "Back", badge: "Preview", title: "AI Content Creator", subtitle: "Personalized AI writing is planned, but the live generation service is not available yet.", privacyTitle: "No relationship details are collected here", privacy: "This preview has no partner-name or personal-context fields and does not save or transmit relationship information. AI generation will only be activated after the backend, privacy controls, safety rules, and five-language behavior are ready.", boundaryTitle: "What the future tool is for", boundary: "The future creator may help draft relationship messages and ideas. Generated text will be a writing aid—not therapy, diagnosis, professional advice, or a substitute for direct communication and judgment.", useNow: "Use these working tools now", loveNotes: "Love Notes", loveNotesDesc: "Choose or send a real note through the secure mutual-partner flow.", dateNight: "Date Night", dateNightDesc: "Build a simple date plan based on time and budget without giving O2OL private context.", cards: "Conversation Cards", cardsDesc: "Use ready-made prompts for meaningful conversation without saving answers.", open: "Open tool", coming: "AI generation: coming later" },
  es: {
    back: "Volver", badge: "Vista previa", title: "Creador de Contenido con IA", subtitle: "La escritura personalizada con IA está planificada, pero el servicio de generación aún no está disponible.", privacyTitle: "Aquí no recopilamos detalles de tu relación", privacy: "Esta vista previa no tiene campos para nombre de pareja ni contexto personal y no guarda ni transmite información de la relación. La generación con IA se activará solo cuando estén listos el backend, la privacidad, las reglas de seguridad y el comportamiento en cinco idiomas.", boundaryTitle: "Para qué será la futura herramienta", boundary: "El futuro creador podrá ayudar a redactar mensajes e ideas de relación. El texto generado será una ayuda de escritura, no terapia, diagnóstico, consejo profesional ni sustituto de la comunicación directa y tu criterio.", useNow: "Usa estas herramientas disponibles", loveNotes: "Notas de Amor", loveNotesDesc: "Elige o envía una nota real mediante el flujo seguro de pareja recíproca.", dateNight: "Noche de Cita", dateNightDesc: "Crea un plan sencillo según tiempo y presupuesto sin dar contexto privado a O2OL.", cards: "Tarjetas de Conversación", cardsDesc: "Usa preguntas preparadas para conversar sin guardar respuestas.", open: "Abrir herramienta", coming: "Generación con IA: próximamente" },
  fr: {
    back: "Retour", badge: "Aperçu", title: "Créateur de Contenu IA", subtitle: "L’écriture personnalisée par IA est prévue, mais le service de génération en direct n’est pas encore disponible.", privacyTitle: "Aucun détail relationnel n’est collecté ici", privacy: "Cet aperçu ne contient aucun champ pour le nom du partenaire ou le contexte personnel et n’enregistre ni ne transmet d’informations relationnelles. La génération IA ne sera activée que lorsque le backend, les contrôles de confidentialité, les règles de sécurité et le fonctionnement dans cinq langues seront prêts.", boundaryTitle: "À quoi servira le futur outil", boundary: "Le futur créateur pourra aider à rédiger des messages et des idées relationnelles. Le texte généré sera une aide à l’écriture, pas une thérapie, un diagnostic, un conseil professionnel ni un substitut au dialogue et au jugement personnel.", useNow: "Utilisez ces outils disponibles", loveNotes: "Notes d’Amour", loveNotesDesc: "Choisissez ou envoyez une vraie note via le lien de partenaire réciproque sécurisé.", dateNight: "Soirée en Couple", dateNightDesc: "Construisez un plan simple selon le temps et le budget sans fournir de contexte privé à O2OL.", cards: "Cartes de Conversation", cardsDesc: "Utilisez des questions prêtes à l’emploi sans enregistrer les réponses.", open: "Ouvrir l’outil", coming: "Génération IA : à venir" },
  it: {
    back: "Indietro", badge: "Anteprima", title: "Creatore di Contenuti IA", subtitle: "La scrittura personalizzata con IA è prevista, ma il servizio di generazione live non è ancora disponibile.", privacyTitle: "Qui non vengono raccolti dettagli della relazione", privacy: "Questa anteprima non contiene campi per il nome del partner o il contesto personale e non salva né trasmette informazioni sulla relazione. La generazione IA verrà attivata solo quando backend, privacy, regole di sicurezza e comportamento in cinque lingue saranno pronti.", boundaryTitle: "A cosa servirà lo strumento futuro", boundary: "Il futuro creatore potrà aiutare a scrivere messaggi e idee per la relazione. Il testo generato sarà un aiuto alla scrittura, non terapia, diagnosi, consulenza professionale o sostituto della comunicazione diretta e del giudizio personale.", useNow: "Usa questi strumenti già disponibili", loveNotes: "Note d’Amore", loveNotesDesc: "Scegli o invia una nota reale tramite il collegamento reciproco sicuro con il partner.", dateNight: "Serata di Coppia", dateNightDesc: "Crea un piano semplice in base a tempo e budget senza fornire contesto privato a O2OL.", cards: "Carte di Conversazione", cardsDesc: "Usa domande già pronte senza salvare le risposte.", open: "Apri strumento", coming: "Generazione IA: prossimamente" },
  de: {
    back: "Zurück", badge: "Vorschau", title: "KI-Content-Ersteller", subtitle: "Personalisierte KI-Texterstellung ist geplant, aber der Live-Generierungsdienst ist noch nicht verfügbar.", privacyTitle: "Hier werden keine Beziehungsdetails gesammelt", privacy: "Diese Vorschau enthält keine Felder für Partnernamen oder persönlichen Kontext und speichert oder überträgt keine Beziehungsinformationen. KI-Generierung wird erst aktiviert, wenn Backend, Datenschutzkontrollen, Sicherheitsregeln und das Verhalten in fünf Sprachen bereit sind.", boundaryTitle: "Wofür das zukünftige Werkzeug gedacht ist", boundary: "Der zukünftige Ersteller kann beim Formulieren von Beziehungsnachrichten und Ideen helfen. Generierter Text ist eine Schreibhilfe, keine Therapie, Diagnose, professionelle Beratung oder Ersatz für direkte Kommunikation und eigenes Urteilsvermögen.", useNow: "Diese funktionierenden Werkzeuge jetzt nutzen", loveNotes: "Liebesbotschaften", loveNotesDesc: "Wähle oder sende eine echte Nachricht über die sichere gegenseitige Partnerverknüpfung.", dateNight: "Date Night", dateNightDesc: "Erstelle einen einfachen Plan nach Zeit und Budget, ohne O2OL privaten Kontext zu geben.", cards: "Gesprächskarten", cardsDesc: "Nutze fertige Fragen für Gespräche, ohne Antworten zu speichern.", open: "Werkzeug öffnen", coming: "KI-Generierung: kommt später" },
};

const tools = [
  ["loveNotes", "loveNotesDesc", "LoveNotes", Heart],
  ["dateNight", "dateNightDesc", "DateNight", CalendarHeart],
  ["cards", "cardsDesc", "ConversationCards", MessageCircle],
];

export default function AIContentCreator() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-white hover:text-purple-700"><ArrowLeft className="h-4 w-4" />{t.back}</Link>

        <section className="mt-6 rounded-3xl border border-purple-100 bg-white p-7 text-center shadow-xl md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white"><Sparkles className="h-8 w-8" /></div>
          <span className="mt-5 inline-flex rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">{t.badge}</span>
          <h1 className="mt-4 text-4xl font-bold text-gray-950 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-gray-600">{t.subtitle}</p>
          <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4 text-sm font-semibold text-purple-900">{t.coming}</div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Card className="border-emerald-200 bg-emerald-50/70"><CardHeader><CardTitle className="flex items-center gap-2 text-emerald-950"><ShieldCheck className="h-5 w-5" />{t.privacyTitle}</CardTitle></CardHeader><CardContent className="leading-7 text-emerald-900">{t.privacy}</CardContent></Card>
          <Card className="border-amber-200 bg-amber-50/70"><CardHeader><CardTitle className="text-amber-950">{t.boundaryTitle}</CardTitle></CardHeader><CardContent className="leading-7 text-amber-900">{t.boundary}</CardContent></Card>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-950">{t.useNow}</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {tools.map(([titleKey, descKey, page, Icon]) => (
              <Card key={page} className="border-purple-100 shadow-sm">
                <CardHeader><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700"><Icon className="h-5 w-5" /></div><CardTitle>{t[titleKey]}</CardTitle></CardHeader>
                <CardContent><p className="leading-7 text-gray-600">{t[descKey]}</p><Button asChild variant="outline" className="mt-5 w-full"><Link to={createPageUrl(page)}>{t.open}</Link></Button></CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
