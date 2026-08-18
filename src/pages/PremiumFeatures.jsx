import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock3, Crown, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';
import { MEMBERSHIP_PRICING, formatMembershipPrice } from '@/lib/membershipConfig';

const COPY = {
  en: {
    eyebrow: 'ONE SIMPLE MEMBERSHIP',
    title: 'Start free. Go deeper when you are ready.',
    subtitle: 'The free account keeps the Love Note and community loop open. The relaunch membership begins with a smaller reviewed premium foundation, then adds more couple tools only after controlled review.',
    freeTitle: 'Free Account', membershipTitle: 'One2OneLove Membership', freeLabel: 'Always free', intro: 'for the first 6 months', then: 'Then', monthly: '/ month',
    noTrial: 'No separate trial and no retired Basic, Premiere or Exclusive tiers.',
    launchTitle: 'Reviewed relaunch premium foundation',
    roadmapTitle: 'Membership roadmap — staged for later rollout',
    roadmapNote: 'These additional tools existed in the earlier prototype, but they are not being presented as active relaunch features until their privacy, data and real-functionality reviews are complete.',
    freeFeatures: ['365 Love Notes: browse, write, send, reveal, reply and save', 'Core Live Community rooms and participation', 'Love Language Quiz and Date Ideas', 'Member profile, community discovery and friend requests', 'Private text chat'],
    launchFeatures: ['AI Relationship Coach', 'AI Content Creator for romantic messages and ideas', 'Relationship Goals and progress tracking'],
    roadmapFeatures: ['Couples Calendar, milestones and anniversary tools', 'Shared Journals and Memory Lane', 'Couples Dashboard and deeper relationship insights', 'Couple activities, cooperative games and communication practice', 'Meditation and advanced relationship quizzes', 'Love Note scheduling and AI personalization'],
    freeCta: 'Create Free Account', paidCta: 'View Membership', back: 'Back',
  },
  es: {
    eyebrow: 'UNA MEMBRESÍA SIMPLE', title: 'Empieza gratis. Profundiza cuando estés listo.', subtitle: 'La cuenta gratuita mantiene abierto el ciclo de Love Notes y comunidad. La membresía del relanzamiento comienza con una base premium más pequeña y revisada; las demás herramientas se añaden solo después de una revisión controlada.',
    freeTitle: 'Cuenta Gratis', membershipTitle: 'Membresía One2OneLove', freeLabel: 'Siempre gratis', intro: 'durante los primeros 6 meses', then: 'Luego', monthly: '/ mes', noTrial: 'Sin prueba adicional y sin los antiguos planes Basic, Premiere o Exclusive.', launchTitle: 'Base premium revisada para el relanzamiento', roadmapTitle: 'Hoja de ruta de membresía — preparada para después', roadmapNote: 'Estas herramientas adicionales existían en el prototipo anterior, pero no se presentan como funciones activas hasta completar su revisión de privacidad, datos y funcionamiento real.',
    freeFeatures: ['365 Love Notes: explorar, escribir, enviar, revelar, responder y guardar', 'Salas principales de Live Community y participación', 'Quiz de Lenguajes del Amor e Ideas de Citas', 'Perfil, descubrimiento de miembros y solicitudes de amistad', 'Chat privado de texto'],
    launchFeatures: ['Coach de Relaciones con IA', 'Creador de Contenido IA para mensajes e ideas románticas', 'Metas de Relación y seguimiento del progreso'],
    roadmapFeatures: ['Calendario de Pareja, hitos y aniversarios', 'Diarios Compartidos y Memory Lane', 'Panel de Pareja e información más profunda', 'Actividades, juegos cooperativos y práctica de comunicación', 'Meditación y cuestionarios avanzados', 'Programación de Love Notes y personalización con IA'],
    freeCta: 'Crear Cuenta Gratis', paidCta: 'Ver Membresía', back: 'Volver',
  },
  fr: {
    eyebrow: 'UNE SEULE ADHÉSION', title: 'Commencez gratuitement. Allez plus loin quand vous êtes prêt.', subtitle: 'Le compte gratuit garde ouverts les Love Notes et la communauté. L’adhésion de relance commence par une base premium plus petite et examinée; les autres outils ne sont ajoutés qu’après une revue contrôlée.',
    freeTitle: 'Compte Gratuit', membershipTitle: 'Adhésion One2OneLove', freeLabel: 'Toujours gratuit', intro: 'pendant les 6 premiers mois', then: 'Puis', monthly: '/ mois', noTrial: 'Aucun essai séparé et aucun ancien niveau Basic, Premiere ou Exclusive.', launchTitle: 'Base premium examinée pour la relance', roadmapTitle: 'Feuille de route adhésion — prévue plus tard', roadmapNote: 'Ces outils supplémentaires existaient dans l’ancien prototype, mais ne sont pas présentés comme actifs avant la fin de leur revue confidentialité, données et fonctionnement réel.',
    freeFeatures: ['365 Love Notes : parcourir, écrire, envoyer, révéler, répondre et enregistrer', 'Salles principales de Live Community et participation', 'Quiz des Langages de l’Amour et Idées de Rendez-vous', 'Profil, découverte des membres et demandes d’amis', 'Chat texte privé'],
    launchFeatures: ['Coach Relationnel IA', 'Créateur de Contenu IA pour messages et idées romantiques', 'Objectifs de Relation et suivi des progrès'],
    roadmapFeatures: ['Calendrier de Couple, jalons et anniversaires', 'Journaux Partagés et Memory Lane', 'Tableau de Bord Couple et analyses approfondies', 'Activités de couple, jeux coopératifs et pratique de communication', 'Méditation et quiz relationnels avancés', 'Planification des Love Notes et personnalisation IA'],
    freeCta: 'Créer un Compte Gratuit', paidCta: 'Voir l’Adhésion', back: 'Retour',
  },
  it: {
    eyebrow: 'UN SOLO ABBONAMENTO', title: 'Inizia gratis. Vai più in profondità quando sei pronto.', subtitle: 'L’account gratuito mantiene aperto il ciclo Love Notes e community. L’abbonamento del rilancio parte da una base premium più piccola e revisionata; gli altri strumenti vengono aggiunti solo dopo una revisione controllata.',
    freeTitle: 'Account Gratuito', membershipTitle: 'Abbonamento One2OneLove', freeLabel: 'Sempre gratis', intro: 'per i primi 6 mesi', then: 'Poi', monthly: '/ mese', noTrial: 'Nessuna prova separata e nessun vecchio livello Basic, Premiere o Exclusive.', launchTitle: 'Base premium revisionata per il rilancio', roadmapTitle: 'Roadmap abbonamento — prevista più avanti', roadmapNote: 'Questi strumenti aggiuntivi esistevano nel prototipo precedente, ma non vengono presentati come attivi finché non completano la revisione di privacy, dati e reale funzionalità.',
    freeFeatures: ['365 Love Notes: sfoglia, scrivi, invia, rivela, rispondi e salva', 'Stanze principali della Live Community e partecipazione', 'Quiz dei Linguaggi dell’Amore e Idee per Appuntamenti', 'Profilo, scoperta membri e richieste di amicizia', 'Chat privata testuale'],
    launchFeatures: ['Coach Relazionale IA', 'Creatore di Contenuti IA per messaggi e idee romantiche', 'Obiettivi di Relazione e monitoraggio dei progressi'],
    roadmapFeatures: ['Calendario di Coppia, traguardi e anniversari', 'Diari Condivisi e Memory Lane', 'Dashboard di Coppia e approfondimenti', 'Attività di coppia, giochi cooperativi e pratica di comunicazione', 'Meditazione e quiz relazionali avanzati', 'Programmazione Love Notes e personalizzazione IA'],
    freeCta: 'Crea Account Gratuito', paidCta: 'Vedi Abbonamento', back: 'Indietro',
  },
  de: {
    eyebrow: 'EINE EINFACHE MITGLIEDSCHAFT', title: 'Kostenlos starten. Tiefer gehen, wenn du bereit bist.', subtitle: 'Das kostenlose Konto hält Love Notes und Community offen. Die Relaunch-Mitgliedschaft startet mit einer kleineren geprüften Premium-Basis; weitere Paarwerkzeuge kommen erst nach kontrollierter Prüfung hinzu.',
    freeTitle: 'Kostenloses Konto', membershipTitle: 'One2OneLove Mitgliedschaft', freeLabel: 'Immer kostenlos', intro: 'für die ersten 6 Monate', then: 'Danach', monthly: '/ Monat', noTrial: 'Keine zusätzliche Testphase und keine alten Basic-, Premiere- oder Exclusive-Stufen.', launchTitle: 'Geprüfte Premium-Basis für den Relaunch', roadmapTitle: 'Mitgliedschafts-Roadmap — für spätere Einführung', roadmapNote: 'Diese zusätzlichen Werkzeuge gab es im früheren Prototyp, sie werden aber erst nach Prüfung von Datenschutz, Daten und echter Funktionalität als aktiv dargestellt.',
    freeFeatures: ['365 Love Notes: durchsuchen, schreiben, senden, enthüllen, antworten und speichern', 'Kernräume der Live Community und Teilnahme', 'Love-Language-Quiz und Date-Ideen', 'Profil, Mitglieder entdecken und Freundschaftsanfragen', 'Privater Text-Chat'],
    launchFeatures: ['KI-Beziehungscoach', 'KI-Content-Ersteller für romantische Nachrichten und Ideen', 'Beziehungsziele und Fortschrittsverfolgung'],
    roadmapFeatures: ['Paarkalender, Meilensteine und Jahrestage', 'Gemeinsame Journale und Memory Lane', 'Paar-Dashboard und tiefere Einblicke', 'Paaraktivitäten, kooperative Spiele und Kommunikationsübungen', 'Meditation und erweiterte Beziehungsquiz', 'Love-Note-Planung und KI-Personalisierung'],
    freeCta: 'Kostenloses Konto erstellen', paidCta: 'Mitgliedschaft ansehen', back: 'Zurück',
  },
  nl: {
    eyebrow: 'ÉÉN EENVOUDIG LIDMAATSCHAP', title: 'Begin gratis. Ga dieper wanneer je er klaar voor bent.', subtitle: 'Het gratis account houdt Love Notes en community open. Het herlanceringslidmaatschap begint met een kleinere beoordeelde premiumbasis; extra koppeltools volgen pas na gecontroleerde beoordeling.',
    freeTitle: 'Gratis Account', membershipTitle: 'One2OneLove Lidmaatschap', freeLabel: 'Altijd gratis', intro: 'voor de eerste 6 maanden', then: 'Daarna', monthly: '/ maand', noTrial: 'Geen aparte proefperiode en geen oude Basic-, Premiere- of Exclusive-niveaus.', launchTitle: 'Beoordeelde premiumbasis voor de herlancering', roadmapTitle: 'Lidmaatschapsroadmap — later uit te rollen', roadmapNote: 'Deze extra tools bestonden in het eerdere prototype, maar worden niet als actief gepresenteerd totdat hun privacy-, data- en echte-functionaliteitsbeoordeling klaar is.',
    freeFeatures: ['365 Love Notes: bladeren, schrijven, sturen, onthullen, antwoorden en bewaren', 'Kernruimtes van Live Community en deelname', 'Love Language Quiz en Date Ideas', 'Profiel, leden ontdekken en vriendschapsverzoeken', 'Privé tekstchat'],
    launchFeatures: ['AI Relatiecoach', 'AI Content Maker voor romantische berichten en ideeën', 'Relatiedoelen en voortgang volgen'],
    roadmapFeatures: ['Koppelkalender, mijlpalen en jubilea', 'Gedeelde Dagboeken en Memory Lane', 'Koppeldashboard en diepere inzichten', 'Koppelactiviteiten, coöperatieve spellen en communicatie-oefeningen', 'Meditatie en geavanceerde relatiequizzen', 'Love Note-planning en AI-personalisatie'],
    freeCta: 'Gratis Account Maken', paidCta: 'Lidmaatschap Bekijken', back: 'Terug',
  },
};

function FeatureList({ items, tone = 'free', icon: Icon = CheckCircle2 }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3 text-sm leading-6 text-gray-700">
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone === 'paid' ? 'text-purple-600' : tone === 'staged' ? 'text-amber-600' : 'text-green-600'}`} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export default function PremiumFeatures() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-pink-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-purple-700"><ArrowLeft className="h-4 w-4" />{t.back}</Link>

        <div className="mx-auto mt-8 max-w-3xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg"><Crown className="h-8 w-8 text-white" /></div>
          <p className="text-sm font-black tracking-[0.2em] text-purple-700">{t.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900 sm:text-5xl">{t.title}</h1>
          <p className="mt-5 text-lg leading-8 text-gray-600">{t.subtitle}</p>
        </div>

        <div className="mt-12 grid gap-7 lg:grid-cols-2">
          <section className="rounded-3xl border border-green-200 bg-white p-7 shadow-xl sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100"><Heart className="h-6 w-6 fill-current text-green-700" /></div>
              <div><p className="text-sm font-bold uppercase tracking-[0.14em] text-green-700">{t.freeLabel}</p><h2 className="text-2xl font-black text-gray-900">{t.freeTitle}</h2></div>
            </div>
            <div className="mt-6"><FeatureList items={t.freeFeatures} /></div>
            <Button asChild variant="outline" className="mt-7 w-full border-green-300 text-green-800 hover:bg-green-50"><Link to="/SignUp">{t.freeCta}</Link></Button>
          </section>

          <section className="overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-7 text-white sm:p-8">
              <div className="flex items-center gap-3"><Sparkles className="h-7 w-7" /><h2 className="text-2xl font-black">{t.membershipTitle}</h2></div>
              <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1"><span className="text-5xl font-black">{formatMembershipPrice(MEMBERSHIP_PRICING.introMonthly)}</span><span className="pb-1 text-lg">{t.monthly}</span></div>
              <p className="mt-2 font-semibold">{t.intro}</p>
              <p className="mt-1 text-sm text-purple-100">{t.then} {formatMembershipPrice(MEMBERSHIP_PRICING.standardMonthly)} {t.monthly}.</p>
            </div>

            <div className="p-7 sm:p-8">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-purple-800">{t.launchTitle}</h3>
              <div className="mt-4"><FeatureList items={t.launchFeatures} tone="paid" /></div>
              <p className="mt-6 rounded-xl bg-purple-50 p-3 text-xs leading-5 text-purple-900">{t.noTrial}</p>
              <Button asChild className="mt-7 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"><Link to="/Subscription">{t.paidCta}</Link></Button>
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-7 shadow-sm sm:p-8">
          <div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" /><div><h2 className="text-xl font-black text-amber-950">{t.roadmapTitle}</h2><p className="mt-2 text-sm leading-6 text-amber-900">{t.roadmapNote}</p></div></div>
          <div className="mt-5"><FeatureList items={t.roadmapFeatures} tone="staged" icon={Clock3} /></div>
        </section>
      </div>
    </div>
  );
}
