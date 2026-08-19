import React, { useMemo, useState } from 'react';
import { CheckCircle2, HeartHandshake, MessageCircleHeart, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Relationship Reset',
    subtitle: 'Ten intentional minutes can change the tone of the week.',
    intro: 'Use this short reset together when life has been busy, communication feels rushed, or you simply want to reconnect before small things pile up.',
    focus: 'This week’s focus',
    focuses: [
      ['Appreciation', 'Notice what is working before discussing what needs work.'],
      ['Listening', 'Slow down enough to understand before trying to answer.'],
      ['Teamwork', 'Look at the week as two people solving life together.'],
      ['Connection', 'Protect one small moment that belongs to the relationship, not the to-do list.'],
    ],
    stepsTitle: 'Your 10-minute reset',
    steps: [
      ['1. Arrive', 'Put phones aside, take one breath, and agree that this is a check-in—not a debate.'],
      ['2. Appreciate', 'Each person names one specific thing they appreciated about the other this week.'],
      ['3. Check In', 'Each answers: “What has felt easy lately, and what has felt heavy?” Listen without interrupting.'],
      ['4. Choose One Thing', 'Pick one small action that would make the next few days feel more connected or supported.'],
    ],
    promptsTitle: 'Conversation prompts',
    prompts: [
      'What do you need more of from me this week—attention, help, affection, space, encouragement, or something else?',
      'Is there anything small between us that would be easier to address now than later?',
      'What is one thing we can look forward to together before the week ends?',
    ],
    complete: 'Mark this reset complete',
    completed: 'Reset complete for this week',
    reset: 'Start over',
    privacy: 'Completion is stored only in this browser for the current week. One2OneLove does not receive your answers.',
    note: 'This reset is an educational relationship exercise, not therapy or professional advice. If a conversation feels unsafe or could escalate harm, prioritize safety and seek appropriate professional or emergency support.',
  },
  es: {
    title: 'Reinicio de la Relación',
    subtitle: 'Diez minutos intencionales pueden cambiar el tono de la semana.',
    intro: 'Usen este breve reinicio cuando la vida esté ocupada, la comunicación se sienta apresurada o simplemente quieran reconectarse antes de que se acumulen las pequeñas cosas.',
    focus: 'Enfoque de esta semana',
    focuses: [
      ['Aprecio', 'Reconozcan lo que está funcionando antes de hablar de lo que necesita mejorar.'],
      ['Escucha', 'Bajen el ritmo lo suficiente para comprender antes de responder.'],
      ['Trabajo en Equipo', 'Miren la semana como dos personas resolviendo la vida juntas.'],
      ['Conexión', 'Protejan un pequeño momento que pertenezca a la relación y no a la lista de tareas.'],
    ],
    stepsTitle: 'Su reinicio de 10 minutos',
    steps: [
      ['1. Llegar', 'Guarden los teléfonos, respiren una vez y acuerden que esto es una revisión, no un debate.'],
      ['2. Apreciar', 'Cada persona menciona algo específico que apreció de la otra esta semana.'],
      ['3. Revisar', 'Cada uno responde: “¿Qué se ha sentido fácil últimamente y qué se ha sentido pesado?” Escuchen sin interrumpir.'],
      ['4. Elegir Una Cosa', 'Elijan una pequeña acción que haga que los próximos días se sientan más conectados o apoyados.'],
    ],
    promptsTitle: 'Preguntas para conversar',
    prompts: [
      '¿Qué necesitas más de mí esta semana: atención, ayuda, afecto, espacio, ánimo u otra cosa?',
      '¿Hay algo pequeño entre nosotros que sería más fácil abordar ahora que después?',
      '¿Qué podemos esperar con ilusión juntos antes de que termine la semana?',
    ],
    complete: 'Marcar este reinicio como completado',
    completed: 'Reinicio completado esta semana',
    reset: 'Comenzar de nuevo',
    privacy: 'La finalización se guarda solo en este navegador durante la semana actual. One2OneLove no recibe sus respuestas.',
    note: 'Este reinicio es un ejercicio educativo para relaciones, no terapia ni asesoramiento profesional. Si una conversación se siente insegura o podría aumentar el daño, prioricen la seguridad y busquen apoyo profesional o de emergencia adecuado.',
  },
  fr: {
    title: 'Reset Relationnel',
    subtitle: 'Dix minutes intentionnelles peuvent changer le ton de la semaine.',
    intro: 'Utilisez ce court reset lorsque la vie est chargée, que la communication semble précipitée ou que vous souhaitez simplement vous reconnecter avant que les petites choses s’accumulent.',
    focus: 'Thème de cette semaine',
    focuses: [
      ['Appréciation', 'Remarquez ce qui fonctionne avant de parler de ce qui doit évoluer.'],
      ['Écoute', 'Ralentissez suffisamment pour comprendre avant de chercher à répondre.'],
      ['Équipe', 'Regardez la semaine comme deux personnes qui affrontent la vie ensemble.'],
      ['Connexion', 'Protégez un petit moment qui appartient à la relation et non à la liste des tâches.'],
    ],
    stepsTitle: 'Votre reset de 10 minutes',
    steps: [
      ['1. Arriver', 'Mettez les téléphones de côté, respirez une fois et convenez qu’il s’agit d’un bilan, pas d’un débat.'],
      ['2. Apprécier', 'Chacun nomme une chose précise qu’il a appréciée chez l’autre cette semaine.'],
      ['3. Faire le Point', 'Chacun répond : « Qu’est-ce qui a semblé facile récemment, et qu’est-ce qui a semblé lourd ? » Écoutez sans interrompre.'],
      ['4. Choisir Une Chose', 'Choisissez une petite action qui rendrait les prochains jours plus connectés ou soutenants.'],
    ],
    promptsTitle: 'Questions de conversation',
    prompts: [
      'De quoi as-tu le plus besoin de ma part cette semaine : attention, aide, affection, espace, encouragement ou autre chose ?',
      'Y a-t-il une petite chose entre nous qu’il serait plus facile d’aborder maintenant que plus tard ?',
      'Quelle est une chose que nous pouvons attendre ensemble avec plaisir avant la fin de la semaine ?',
    ],
    complete: 'Marquer ce reset comme terminé',
    completed: 'Reset terminé pour cette semaine',
    reset: 'Recommencer',
    privacy: 'La finalisation est enregistrée uniquement dans ce navigateur pour la semaine en cours. One2OneLove ne reçoit pas vos réponses.',
    note: 'Ce reset est un exercice relationnel éducatif, pas une thérapie ni un conseil professionnel. Si une conversation semble dangereuse ou risque d’aggraver un préjudice, privilégiez la sécurité et recherchez une aide professionnelle ou d’urgence adaptée.',
  },
  it: {
    title: 'Reset della Relazione',
    subtitle: 'Dieci minuti intenzionali possono cambiare il tono della settimana.',
    intro: 'Usate questo breve reset quando la vita è frenetica, la comunicazione sembra affrettata o volete semplicemente riconnettervi prima che le piccole cose si accumulino.',
    focus: 'Focus di questa settimana',
    focuses: [
      ['Apprezzamento', 'Notate ciò che funziona prima di parlare di ciò che deve migliorare.'],
      ['Ascolto', 'Rallentate abbastanza da capire prima di cercare una risposta.'],
      ['Squadra', 'Guardate la settimana come due persone che affrontano la vita insieme.'],
      ['Connessione', 'Proteggete un piccolo momento che appartenga alla relazione e non alla lista delle cose da fare.'],
    ],
    stepsTitle: 'Il vostro reset di 10 minuti',
    steps: [
      ['1. Arrivare', 'Mettete via i telefoni, fate un respiro e concordate che questo è un check-in, non un dibattito.'],
      ['2. Apprezzare', 'Ognuno nomina una cosa specifica che ha apprezzato dell’altro questa settimana.'],
      ['3. Fare il Punto', 'Ognuno risponde: “Cosa è sembrato facile ultimamente e cosa è sembrato pesante?” Ascoltate senza interrompere.'],
      ['4. Scegliere Una Cosa', 'Scegliete una piccola azione che renda i prossimi giorni più connessi o sostenuti.'],
    ],
    promptsTitle: 'Spunti di conversazione',
    prompts: [
      'Di cosa hai più bisogno da me questa settimana: attenzione, aiuto, affetto, spazio, incoraggiamento o altro?',
      'C’è qualcosa di piccolo tra noi che sarebbe più facile affrontare adesso piuttosto che dopo?',
      'Qual è una cosa che possiamo aspettare con piacere insieme prima della fine della settimana?',
    ],
    complete: 'Segna questo reset come completato',
    completed: 'Reset completato per questa settimana',
    reset: 'Ricomincia',
    privacy: 'Il completamento viene salvato solo in questo browser per la settimana corrente. One2OneLove non riceve le vostre risposte.',
    note: 'Questo reset è un esercizio educativo per la relazione, non terapia o consulenza professionale. Se una conversazione sembra pericolosa o potrebbe aumentare un danno, date priorità alla sicurezza e cercate un supporto professionale o di emergenza appropriato.',
  },
  de: {
    title: 'Beziehungs-Reset',
    subtitle: 'Zehn bewusste Minuten können den Ton der ganzen Woche verändern.',
    intro: 'Nutzt diesen kurzen Reset, wenn das Leben hektisch ist, Gespräche zu schnell werden oder ihr euch einfach wieder verbinden möchtet, bevor sich Kleinigkeiten ansammeln.',
    focus: 'Fokus dieser Woche',
    focuses: [
      ['Wertschätzung', 'Seht zuerst, was gut funktioniert, bevor ihr besprecht, was besser werden soll.'],
      ['Zuhören', 'Werdet langsam genug, um zu verstehen, bevor ihr antwortet.'],
      ['Teamarbeit', 'Betrachtet die Woche als zwei Menschen, die das Leben gemeinsam lösen.'],
      ['Verbindung', 'Schützt einen kleinen Moment, der der Beziehung gehört und nicht der Aufgabenliste.'],
    ],
    stepsTitle: 'Euer 10-Minuten-Reset',
    steps: [
      ['1. Ankommen', 'Legt die Handys weg, atmet einmal bewusst und vereinbart: Das ist ein Check-in, keine Debatte.'],
      ['2. Wertschätzen', 'Jeder nennt eine konkrete Sache, die er diese Woche am anderen geschätzt hat.'],
      ['3. Einchecken', 'Jeder beantwortet: „Was hat sich zuletzt leicht angefühlt und was schwer?“ Hört zu, ohne zu unterbrechen.'],
      ['4. Eine Sache Wählen', 'Wählt eine kleine Handlung, durch die sich die nächsten Tage verbundener oder unterstützender anfühlen.'],
    ],
    promptsTitle: 'Gesprächsfragen',
    prompts: [
      'Wovon brauchst du diese Woche mehr von mir: Aufmerksamkeit, Hilfe, Zuneigung, Raum, Ermutigung oder etwas anderes?',
      'Gibt es etwas Kleines zwischen uns, das jetzt leichter anzusprechen wäre als später?',
      'Auf welche eine Sache können wir uns vor Ende der Woche gemeinsam freuen?',
    ],
    complete: 'Diesen Reset als abgeschlossen markieren',
    completed: 'Reset für diese Woche abgeschlossen',
    reset: 'Neu beginnen',
    privacy: 'Der Abschluss wird nur für die aktuelle Woche in diesem Browser gespeichert. One2OneLove erhält eure Antworten nicht.',
    note: 'Dieser Reset ist eine Bildungsübung für Beziehungen und keine Therapie oder professionelle Beratung. Wenn sich ein Gespräch unsicher anfühlt oder Schaden verschärfen könnte, hat Sicherheit Vorrang; sucht geeignete professionelle oder Notfallhilfe.',
  },
};

function getWeekKey(date = new Date()) {
  const first = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayNumber = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - first.getTime()) / 86400000);
  const week = Math.ceil((dayNumber + first.getUTCDay() + 1) / 7);
  return `${date.getUTCFullYear()}-${week}`;
}

export default function RelationshipReset() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const weekKey = useMemo(() => getWeekKey(), []);
  const focusIndex = useMemo(() => Number(weekKey.split('-')[1]) % t.focuses.length, [t.focuses.length, weekKey]);
  const [focusTitle, focusCopy] = t.focuses[focusIndex];
  const storageKey = `o2ol-relationship-reset-${weekKey}`;
  const [completed, setCompleted] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === 'complete';
    } catch {
      return false;
    }
  });

  const markComplete = () => {
    setCompleted(true);
    try {
      localStorage.setItem(storageKey, 'complete');
    } catch {
      // The reset remains usable when browser storage is unavailable.
    }
  };

  const startOver = () => {
    setCompleted(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Browser storage is optional.
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><RefreshCw className="h-7 w-7" aria-hidden="true" /></div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-3 text-xl font-semibold text-emerald-700">{t.subtitle}</p>
          <p className="mt-4 text-base leading-7 text-slate-600 md:text-lg">{t.intro}</p>
        </header>

        <Card className="mt-9 rounded-3xl border-emerald-200 bg-emerald-50/70">
          <CardHeader>
            <div className="flex items-center gap-3 text-emerald-800"><Sparkles className="h-5 w-5" aria-hidden="true" /><span className="text-sm font-semibold uppercase tracking-wide">{t.focus}</span></div>
            <CardTitle className="text-2xl text-slate-900">{focusTitle}</CardTitle>
          </CardHeader>
          <CardContent><p className="leading-7 text-slate-700">{focusCopy}</p></CardContent>
        </Card>

        <section className="mt-9" aria-labelledby="reset-steps-title">
          <h2 id="reset-steps-title" className="text-2xl font-bold text-slate-900">{t.stepsTitle}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {t.steps.map(([title, copy]) => (
              <Card key={title} className="rounded-2xl border-slate-200">
                <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
                <CardContent><p className="text-sm leading-6 text-slate-600">{copy}</p></CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-9 rounded-3xl border border-cyan-200 bg-cyan-50 p-6 md:p-8" aria-labelledby="reset-prompts-title">
          <div className="flex items-center gap-3"><MessageCircleHeart className="h-6 w-6 text-cyan-700" aria-hidden="true" /><h2 id="reset-prompts-title" className="text-2xl font-bold text-slate-900">{t.promptsTitle}</h2></div>
          <div className="mt-5 space-y-3">
            {t.prompts.map((prompt) => <p key={prompt} className="rounded-xl bg-white p-4 leading-7 text-slate-700 shadow-sm">{prompt}</p>)}
          </div>
        </section>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3"><HeartHandshake className="mt-0.5 h-5 w-5 text-pink-600" aria-hidden="true" /><p className="text-sm leading-6 text-slate-600">{t.privacy}</p></div>
          <div className="mt-5">
            {completed ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 font-semibold text-emerald-700" role="status"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{t.completed}</div>
                <Button type="button" variant="outline" onClick={startOver}>{t.reset}</Button>
              </div>
            ) : (
              <Button type="button" onClick={markComplete} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />{t.complete}</Button>
            )}
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-500">{t.note}</p>
      </div>
    </div>
  );
}
