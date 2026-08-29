import React from 'react';
import { BookOpen, Brain, HeartHandshake, MessageCircle, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Relationship Library',
    subtitle: 'Start with what your relationship needs today.',
    intro: 'Explore One2OneLove by relationship goal instead of searching through the entire platform.',
    groups: [
      ['Communicate Better', 'Practice listening, expressing needs, and starting conversations that matter.', 'message', [
        ['Communication Practice', '/CommunicationPractice'],
        ['Daily Relationship Question', '/DailyQuestion'],
        ['Conversation Cards', '/ConversationCards'],
        ['Relationship Quizzes', '/RelationshipQuizzes'],
      ]],
      ['Reconnect', 'Create small moments of attention, appreciation, and intentional time together.', 'heart', [
        ['Weekly Relationship Check-In', '/WeeklyCheckIn'],
        ['Love Notes', '/LoveNotes'],
        ['Date Night', '/DateNight'],
        ['Date Ideas', '/DateIdeas'],
      ]],
      ['Grow Together', 'Turn relationship intentions into shared habits, goals, and meaningful reflection.', 'sparkles', [
        ['Relationship Rituals', '/RelationshipRituals'],
        ['Couples Challenges', '/CouplesChallenges'],
        ['Relationship Goals', '/RelationshipGoals'],
        ['Shared Journals', '/SharedJournals'],
        ['Relationship Milestones', '/RelationshipMilestones'],
      ]],
      ['Marriage', 'Resources designed specifically for married couples who want to keep investing in their marriage.', 'marriage', [
        ['Marriage Matters', '/MarriageMatters'],
        ['Weekly Relationship Check-In', '/WeeklyCheckIn'],
        ['Anniversary Tracker', '/AnniversaryTracker'],
        ['Couples Calendar', '/CouplesCalendar'],
      ]],
      ['Calm & Reflect', 'Slow down, check in, and create more room for thoughtful responses.', 'brain', [
        ['Relationship Reset', '/RelationshipReset'],
        ['Meditation', '/Meditation'],
        ['Memory Lane', '/MemoryLane'],
        ['Shared Journals', '/SharedJournals'],
      ]],
      ['Find Support', 'Use community, relationship support, and programming when you need more perspective or help.', 'users', [
        ['Relationship Support', '/CoupleSupport'],
        ['Community', '/Community'],
        ['Global Relationship Room', '/GlobalRelationshipRoom'],
        ['The O2OL Show', '/O2OLShow'],
      ]],
    ],
    note: 'One2OneLove educational and reflection tools do not replace licensed counseling, medical care, legal advice, or emergency services.',
  },
  es: {
    title: 'Biblioteca de Relaciones',
    subtitle: 'Comienza con lo que tu relación necesita hoy.',
    intro: 'Explora One2OneLove según el objetivo de tu relación, sin tener que buscar por toda la plataforma.',
    groups: [
      ['Comunicarse Mejor', 'Practiquen escuchar, expresar necesidades e iniciar conversaciones importantes.', 'message', [
        ['Práctica de Comunicación', '/CommunicationPractice'],
        ['Pregunta Diaria para la Relación', '/DailyQuestion'],
        ['Tarjetas de Conversación', '/ConversationCards'],
        ['Cuestionarios de Relaciones', '/RelationshipQuizzes'],
      ]],
      ['Reconectarse', 'Creen pequeños momentos de atención, aprecio y tiempo intencional juntos.', 'heart', [
        ['Revisión Semanal de la Relación', '/WeeklyCheckIn'],
        ['Notas de Amor', '/LoveNotes'],
        ['Noche de Cita', '/DateNight'],
        ['Ideas para Citas', '/DateIdeas'],
      ]],
      ['Crecer Juntos', 'Conviertan sus intenciones en hábitos compartidos, metas y reflexión significativa.', 'sparkles', [
        ['Rituales de Relación', '/RelationshipRituals'],
        ['Retos para Parejas', '/CouplesChallenges'],
        ['Metas de Relación', '/RelationshipGoals'],
        ['Diarios Compartidos', '/SharedJournals'],
        ['Hitos de la Relación', '/RelationshipMilestones'],
      ]],
      ['Matrimonio', 'Recursos creados específicamente para matrimonios que quieren seguir invirtiendo en su relación.', 'marriage', [
        ['El Matrimonio Importa', '/MarriageMatters'],
        ['Revisión Semanal de la Relación', '/WeeklyCheckIn'],
        ['Seguimiento de Aniversario', '/AnniversaryTracker'],
        ['Calendario de Pareja', '/CouplesCalendar'],
      ]],
      ['Calma y Reflexión', 'Bajen el ritmo, hagan una pausa y creen más espacio para responder con intención.', 'brain', [
        ['Reinicio de la Relación', '/RelationshipReset'],
        ['Meditación', '/Meditation'],
        ['Camino de Recuerdos', '/MemoryLane'],
        ['Diarios Compartidos', '/SharedJournals'],
      ]],
      ['Encontrar Apoyo', 'Usen la comunidad, el apoyo para relaciones y la programación cuando necesiten más perspectiva o ayuda.', 'users', [
        ['Apoyo para Relaciones', '/CoupleSupport'],
        ['Comunidad', '/Community'],
        ['Sala Global de Relaciones', '/GlobalRelationshipRoom'],
        ['El Programa O2OL', '/O2OLShow'],
      ]],
    ],
    note: 'Las herramientas educativas y de reflexión de One2OneLove no sustituyen terapia profesional, atención médica, asesoramiento legal ni servicios de emergencia.',
  },
  fr: {
    title: 'Bibliothèque Relationnelle',
    subtitle: 'Commencez par ce dont votre relation a besoin aujourd’hui.',
    intro: 'Explorez One2OneLove selon votre objectif relationnel plutôt que de chercher dans toute la plateforme.',
    groups: [
      ['Mieux Communiquer', 'Entraînez-vous à écouter, exprimer vos besoins et lancer des conversations importantes.', 'message', [
        ['Pratique de Communication', '/CommunicationPractice'],
        ['Question Relationnelle du Jour', '/DailyQuestion'],
        ['Cartes de Conversation', '/ConversationCards'],
        ['Quiz Relationnels', '/RelationshipQuizzes'],
      ]],
      ['Se Reconnecter', 'Créez de petits moments d’attention, d’appréciation et de temps intentionnel ensemble.', 'heart', [
        ['Bilan Relationnel Hebdomadaire', '/WeeklyCheckIn'],
        ['Notes d’Amour', '/LoveNotes'],
        ['Soirée en Couple', '/DateNight'],
        ['Idées de Rendez-vous', '/DateIdeas'],
      ]],
      ['Grandir Ensemble', 'Transformez vos intentions en habitudes communes, objectifs et réflexion significative.', 'sparkles', [
        ['Rituels de Relation', '/RelationshipRituals'],
        ['Défis de Couple', '/CouplesChallenges'],
        ['Objectifs de Relation', '/RelationshipGoals'],
        ['Journaux Partagés', '/SharedJournals'],
        ['Jalons Relationnels', '/RelationshipMilestones'],
      ]],
      ['Mariage', 'Des ressources conçues spécialement pour les couples mariés qui souhaitent continuer à investir dans leur mariage.', 'marriage', [
        ['Le Mariage Compte', '/MarriageMatters'],
        ['Bilan Relationnel Hebdomadaire', '/WeeklyCheckIn'],
        ['Suivi d’Anniversaire', '/AnniversaryTracker'],
        ['Calendrier du Couple', '/CouplesCalendar'],
      ]],
      ['Calme & Réflexion', 'Ralentissez, faites le point et créez plus d’espace pour répondre avec intention.', 'brain', [
        ['Réinitialisation Relationnelle', '/RelationshipReset'],
        ['Méditation', '/Meditation'],
        ['Allée des Souvenirs', '/MemoryLane'],
        ['Journaux Partagés', '/SharedJournals'],
      ]],
      ['Trouver du Soutien', 'Utilisez la communauté, le soutien relationnel et les programmes lorsque vous avez besoin d’un autre point de vue ou d’aide.', 'users', [
        ['Soutien aux Relations', '/CoupleSupport'],
        ['Communauté', '/Community'],
        ['Salle Mondiale des Relations', '/GlobalRelationshipRoom'],
        ['L’Émission O2OL', '/O2OLShow'],
      ]],
    ],
    note: 'Les outils éducatifs et de réflexion One2OneLove ne remplacent pas un suivi professionnel, des soins médicaux, des conseils juridiques ou des services d’urgence.',
  },
  it: {
    title: 'Biblioteca delle Relazioni',
    subtitle: 'Inizia da ciò di cui la tua relazione ha bisogno oggi.',
    intro: 'Esplora One2OneLove in base all’obiettivo della relazione, senza dover cercare in tutta la piattaforma.',
    groups: [
      ['Comunicare Meglio', 'Esercitatevi ad ascoltare, esprimere bisogni e iniziare conversazioni importanti.', 'message', [
        ['Pratica di Comunicazione', '/CommunicationPractice'],
        ['Domanda Quotidiana sulla Relazione', '/DailyQuestion'],
        ['Carte di Conversazione', '/ConversationCards'],
        ['Quiz sulle Relazioni', '/RelationshipQuizzes'],
      ]],
      ['Riconnettersi', 'Create piccoli momenti di attenzione, apprezzamento e tempo intenzionale insieme.', 'heart', [
        ['Check-In Settimanale di Coppia', '/WeeklyCheckIn'],
        ['Note d’Amore', '/LoveNotes'],
        ['Serata di Coppia', '/DateNight'],
        ['Idee per Appuntamenti', '/DateIdeas'],
      ]],
      ['Crescere Insieme', 'Trasformate le intenzioni in abitudini condivise, obiettivi e riflessione significativa.', 'sparkles', [
        ['Rituali di Coppia', '/RelationshipRituals'],
        ['Sfide di Coppia', '/CouplesChallenges'],
        ['Obiettivi di Relazione', '/RelationshipGoals'],
        ['Diari Condivisi', '/SharedJournals'],
        ['Traguardi della Relazione', '/RelationshipMilestones'],
      ]],
      ['Matrimonio', 'Risorse create appositamente per le coppie sposate che vogliono continuare a investire nel proprio matrimonio.', 'marriage', [
        ['Il Matrimonio Conta', '/MarriageMatters'],
        ['Check-In Settimanale di Coppia', '/WeeklyCheckIn'],
        ['Monitoraggio Anniversario', '/AnniversaryTracker'],
        ['Calendario di Coppia', '/CouplesCalendar'],
      ]],
      ['Calma e Riflessione', 'Rallentate, fate il punto e create più spazio per rispondere con intenzione.', 'brain', [
        ['Reset della Relazione', '/RelationshipReset'],
        ['Meditazione', '/Meditation'],
        ['Viale dei Ricordi', '/MemoryLane'],
        ['Diari Condivisi', '/SharedJournals'],
      ]],
      ['Trovare Supporto', 'Usate la comunità, il supporto relazionale e la programmazione quando avete bisogno di più prospettiva o aiuto.', 'users', [
        ['Supporto per Relazioni', '/CoupleSupport'],
        ['Comunità', '/Community'],
        ['Sala Globale delle Relazioni', '/GlobalRelationshipRoom'],
        ['Lo Show O2OL', '/O2OLShow'],
      ]],
    ],
    note: 'Gli strumenti educativi e di riflessione One2OneLove non sostituiscono consulenza professionale, cure mediche, consulenza legale o servizi di emergenza.',
  },
  de: {
    title: 'Beziehungsbibliothek',
    subtitle: 'Beginnt mit dem, was eure Beziehung heute braucht.',
    intro: 'Entdeckt One2OneLove nach eurem Beziehungsziel, statt die gesamte Plattform durchsuchen zu müssen.',
    groups: [
      ['Besser Kommunizieren', 'Übt Zuhören, Bedürfnisse auszudrücken und wichtige Gespräche zu beginnen.', 'message', [
        ['Kommunikationspraxis', '/CommunicationPractice'],
        ['Tägliche Beziehungsfrage', '/DailyQuestion'],
        ['Gesprächskarten', '/ConversationCards'],
        ['Beziehungsquiz', '/RelationshipQuizzes'],
      ]],
      ['Wieder Nähe Finden', 'Schafft kleine Momente für Aufmerksamkeit, Wertschätzung und bewusste gemeinsame Zeit.', 'heart', [
        ['Wöchentlicher Beziehungs-Check-In', '/WeeklyCheckIn'],
        ['Liebesbotschaften', '/LoveNotes'],
        ['Date Night', '/DateNight'],
        ['Date-Ideen', '/DateIdeas'],
      ]],
      ['Gemeinsam Wachsen', 'Macht aus guten Absichten gemeinsame Gewohnheiten, Ziele und sinnvolle Reflexion.', 'sparkles', [
        ['Beziehungsrituale', '/RelationshipRituals'],
        ['Paar-Challenges', '/CouplesChallenges'],
        ['Beziehungsziele', '/RelationshipGoals'],
        ['Gemeinsame Journale', '/SharedJournals'],
        ['Beziehungsmeilensteine', '/RelationshipMilestones'],
      ]],
      ['Ehe', 'Ressourcen speziell für Ehepaare, die weiter bewusst in ihre Ehe investieren möchten.', 'marriage', [
        ['Ehe Zählt', '/MarriageMatters'],
        ['Wöchentlicher Beziehungs-Check-In', '/WeeklyCheckIn'],
        ['Jahrestags-Tracker', '/AnniversaryTracker'],
        ['Paar-Kalender', '/CouplesCalendar'],
      ]],
      ['Ruhe & Reflexion', 'Werdet langsamer, macht einen Check-in und schafft mehr Raum für bewusste Reaktionen.', 'brain', [
        ['Beziehungs-Reset', '/RelationshipReset'],
        ['Meditation', '/Meditation'],
        ['Erinnerungsgasse', '/MemoryLane'],
        ['Gemeinsame Journale', '/SharedJournals'],
      ]],
      ['Unterstützung Finden', 'Nutzt Community, Beziehungsunterstützung und Programme, wenn ihr zusätzliche Perspektive oder Hilfe braucht.', 'users', [
        ['Beziehungsunterstützung', '/CoupleSupport'],
        ['Community', '/Community'],
        ['Globaler Beziehungsraum', '/GlobalRelationshipRoom'],
        ['Die O2OL Show', '/O2OLShow'],
      ]],
    ],
    note: 'Die Bildungs- und Reflexionswerkzeuge von One2OneLove ersetzen keine professionelle Beratung, medizinische Versorgung, Rechtsberatung oder Notfalldienste.',
  },
};

const iconMap = {
  message: MessageCircle,
  heart: HeartHandshake,
  sparkles: Sparkles,
  marriage: HeartHandshake,
  brain: Brain,
  users: Users,
};

export default function RelationshipLibrary() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-pink-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
            <BookOpen className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-3 text-xl font-semibold text-indigo-700">{t.subtitle}</p>
          <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">{t.intro}</p>
        </header>

        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {t.groups.map(([title, description, iconKey, links]) => {
            const Icon = iconMap[iconKey] || BookOpen;
            return (
              <Card key={title} className="rounded-3xl border-slate-200">
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="pt-2 text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600">{description}</p>
                  <div className="mt-5 space-y-2">
                    {links.map(([label, href]) => (
                      <Link
                        key={href}
                        to={href}
                        className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-500">{t.note}</p>
      </div>
    </main>
  );
}
