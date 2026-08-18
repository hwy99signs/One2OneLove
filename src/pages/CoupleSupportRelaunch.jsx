import React, { useMemo, useState } from 'react';
import { Heart, HelpCircle, MessageCircle, Search, Sparkles, Target, CalendarHeart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/Layout';

const COPY = {
  en: {
    title: 'Relationship Support', subtitle: 'Start with practical One2OneLove tools that have been reviewed for the relaunch.', search: 'Search relationship tools…', noResults: 'No matching tools found.', note: 'One2OneLove is not presenting a therapist marketplace, verified professional directory, or counseling-booking service in this relaunch. Professional applications are being reviewed separately before any such directory is offered.', free: 'Free', membership: 'Membership', open: 'Open',
    items: {
      community: ['Live Community', 'Talk, listen and connect in relationship-focused rooms with real member presence rules.'],
      quiz: ['Love Language Quiz', 'Use an informal reflection quiz to explore how you tend to give and receive affection.'],
      dates: ['Date Ideas', 'Browse simple ways to spend intentional time together and save your own ideas.'],
      help: ['Help Center', 'Get straight answers about accounts, Love Notes, Community, Chat and membership.'],
      coach: ['AI Relationship Coach', 'A membership AI reflection tool with privacy, cost and safety boundaries. Not therapy.'],
      goals: ['Relationship Goals', 'A membership tool for private goals, action steps and progress tracking.'],
    },
  },
  es: {
    title: 'Apoyo para Relaciones', subtitle: 'Empieza con herramientas prácticas de One2OneLove revisadas para el relanzamiento.', search: 'Buscar herramientas…', noResults: 'No se encontraron herramientas.', note: 'One2OneLove no presenta en este relanzamiento un mercado de terapeutas, directorio profesional verificado ni servicio de reserva de asesoramiento. Las solicitudes profesionales se revisan por separado.', free: 'Gratis', membership: 'Membresía', open: 'Abrir',
    items: {
      community: ['Comunidad en Vivo', 'Habla, escucha y conecta en salas de relaciones con reglas de presencia real.'],
      quiz: ['Quiz de Lenguajes del Amor', 'Usa un quiz informal de reflexión para explorar cómo das y recibes afecto.'],
      dates: ['Ideas para Citas', 'Explora formas sencillas de pasar tiempo intencional juntos y guarda tus propias ideas.'],
      help: ['Centro de Ayuda', 'Obtén respuestas claras sobre cuentas, Love Notes, Comunidad, Chat y membresía.'],
      coach: ['Coach de Relaciones IA', 'Herramienta de reflexión IA de membresía con límites de privacidad, costo y seguridad. No es terapia.'],
      goals: ['Metas de Relación', 'Herramienta de membresía para metas privadas, pasos de acción y seguimiento del progreso.'],
    },
  },
  fr: {
    title: 'Soutien Relationnel', subtitle: 'Commencez par les outils pratiques One2OneLove examinés pour la relance.', search: 'Rechercher des outils…', noResults: 'Aucun outil correspondant.', note: 'One2OneLove ne présente pas, dans cette relance, de place de marché de thérapeutes, d’annuaire professionnel vérifié ou de service de réservation de conseil. Les candidatures professionnelles sont examinées séparément.', free: 'Gratuit', membership: 'Adhésion', open: 'Ouvrir',
    items: {
      community: ['Communauté Live', 'Parlez, écoutez et créez des liens dans des salons relationnels avec des règles de présence réelle.'],
      quiz: ['Quiz des Langages d’Amour', 'Utilisez un quiz de réflexion informel pour explorer votre façon de donner et recevoir de l’affection.'],
      dates: ['Idées de Rendez-vous', 'Explorez des façons simples de passer du temps intentionnel ensemble et sauvegardez vos idées.'],
      help: ['Centre d’Aide', 'Obtenez des réponses claires sur les comptes, Love Notes, Community, Chat et l’adhésion.'],
      coach: ['Coach Relationnel IA', 'Outil de réflexion IA pour membres avec limites de confidentialité, coût et sécurité. Ce n’est pas une thérapie.'],
      goals: ['Objectifs de Relation', 'Outil d’adhésion pour objectifs privés, étapes d’action et suivi des progrès.'],
    },
  },
  it: {
    title: 'Supporto Relazionale', subtitle: 'Inizia con strumenti pratici One2OneLove revisionati per il rilancio.', search: 'Cerca strumenti…', noResults: 'Nessuno strumento corrispondente.', note: 'One2OneLove non presenta in questo rilancio un marketplace di terapeuti, una directory professionale verificata o un servizio di prenotazione della consulenza. Le candidature professionali vengono valutate separatamente.', free: 'Gratis', membership: 'Abbonamento', open: 'Apri',
    items: {
      community: ['Community Live', 'Parla, ascolta e connettiti in stanze dedicate alle relazioni con regole di presenza reale.'],
      quiz: ['Quiz dei Linguaggi dell’Amore', 'Usa un quiz informale di riflessione per esplorare come dai e ricevi affetto.'],
      dates: ['Idee per Appuntamenti', 'Scopri modi semplici per passare tempo intenzionale insieme e salva le tue idee.'],
      help: ['Centro Assistenza', 'Trova risposte chiare su account, Love Notes, Community, Chat e abbonamento.'],
      coach: ['Coach Relazionale IA', 'Strumento IA in abbonamento con limiti di privacy, costi e sicurezza. Non è terapia.'],
      goals: ['Obiettivi di Relazione', 'Strumento in abbonamento per obiettivi privati, passi d’azione e progresso.'],
    },
  },
  de: {
    title: 'Beziehungsunterstützung', subtitle: 'Beginnen Sie mit praktischen One2OneLove-Werkzeugen, die für den Relaunch geprüft wurden.', search: 'Beziehungswerkzeuge suchen…', noResults: 'Keine passenden Werkzeuge gefunden.', note: 'One2OneLove bietet in diesem Relaunch keinen Therapeuten-Marktplatz, kein verifiziertes Fachkräfteverzeichnis und keinen Beratungs-Buchungsdienst an. Professionelle Bewerbungen werden separat geprüft.', free: 'Kostenlos', membership: 'Mitgliedschaft', open: 'Öffnen',
    items: {
      community: ['Live Community', 'Reden, zuhören und verbinden in Beziehungsräumen mit Regeln für echte Anwesenheit.'],
      quiz: ['Liebessprachen-Quiz', 'Ein informelles Reflexionsquiz darüber, wie Sie Zuneigung geben und empfangen.'],
      dates: ['Date-Ideen', 'Einfache Ideen für bewusste gemeinsame Zeit entdecken und eigene Ideen speichern.'],
      help: ['Hilfezentrum', 'Klare Antworten zu Konten, Love Notes, Community, Chat und Mitgliedschaft.'],
      coach: ['KI-Beziehungscoach', 'Mitgliedschafts-KI für Reflexion mit Datenschutz-, Kosten- und Sicherheitsgrenzen. Keine Therapie.'],
      goals: ['Beziehungsziele', 'Mitgliedschaftstool für private Ziele, Handlungsschritte und Fortschritt.'],
    },
  },
  nl: {
    title: 'Relatieondersteuning', subtitle: 'Begin met praktische One2OneLove-tools die voor de herlancering zijn beoordeeld.', search: 'Zoek relatietools…', noResults: 'Geen passende tools gevonden.', note: 'One2OneLove presenteert in deze herlancering geen therapeutenmarktplaats, geverifieerde professionele directory of boekingsdienst voor counseling. Professionele aanvragen worden afzonderlijk beoordeeld.', free: 'Gratis', membership: 'Lidmaatschap', open: 'Open',
    items: {
      community: ['Live Community', 'Praat, luister en verbind in relatieruimtes met regels voor echte aanwezigheid.'],
      quiz: ['Liefdestaalquiz', 'Gebruik een informele reflectiequiz om te verkennen hoe je genegenheid geeft en ontvangt.'],
      dates: ['Date-ideeën', 'Bekijk eenvoudige manieren om bewust tijd samen door te brengen en sla eigen ideeën op.'],
      help: ['Helpcentrum', 'Krijg duidelijke antwoorden over accounts, Love Notes, Community, Chat en lidmaatschap.'],
      coach: ['AI Relatiecoach', 'AI-reflectietool voor leden met privacy-, kosten- en veiligheidsgrenzen. Geen therapie.'],
      goals: ['Relatiedoelen', 'Lidmaatschapstool voor privédoelen, actiestappen en voortgang.'],
    },
  },
};

const ITEMS = [
  { key: 'community', path: '/Community', icon: Users, access: 'free' },
  { key: 'quiz', path: '/LoveLanguageQuiz', icon: Heart, access: 'free' },
  { key: 'dates', path: '/DateIdeas', icon: CalendarHeart, access: 'free' },
  { key: 'help', path: '/HelpCenter', icon: HelpCircle, access: 'free' },
  { key: 'coach', path: '/RelationshipCoach', icon: Sparkles, access: 'membership' },
  { key: 'goals', path: '/RelationshipGoals', icon: Target, access: 'membership' },
];

export default function CoupleSupportRelaunch() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ITEMS;
    return ITEMS.filter((item) => `${t.items[item.key][0]} ${t.items[item.key][1]}`.toLowerCase().includes(needle));
  }, [query, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg"><Heart className="h-8 w-8 fill-current" /></div>
          <h1 className="text-4xl font-black text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-3 max-w-3xl text-lg leading-8 text-gray-600">{t.subtitle}</p>
        </div>

        <div className="mx-auto mt-8 max-w-xl">
          <div className="relative"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className="pl-12" /></div>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{t.note}</div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const Icon = item.icon;
            const [title, description] = t.items[item.key];
            return (
              <Link key={item.key} to={item.path} className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-pink-200 hover:shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 text-purple-700"><Icon className="h-6 w-6" /></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${item.access === 'free' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>{item.access === 'free' ? t.free : t.membership}</span>
                </div>
                <h2 className="mt-5 text-xl font-black text-gray-900">{title}</h2>
                <p className="mt-2 min-h-20 text-sm leading-6 text-gray-600">{description}</p>
                <div className="mt-5 inline-flex items-center gap-2 font-bold text-purple-700"><MessageCircle className="h-4 w-4" />{t.open}</div>
              </Link>
            );
          })}
        </div>

        {!filtered.length && <p className="py-12 text-center text-gray-500">{t.noResults}</p>}
      </div>
    </div>
  );
}
