import React, { useMemo, useState } from 'react';
import { Check, Heart, RefreshCw, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Couples Challenges',
    subtitle: 'Seven small actions. One week of more intentional connection.',
    intro: 'Complete the challenge at your own pace. Progress is stored only in this browser for the current weekly challenge.',
    week: 'This week’s challenge',
    progress: 'Completed',
    reset: 'Reset this week',
    complete: 'Challenge complete!',
    completeCopy: 'You made seven intentional moments for your relationship this week. Keep the habit, not just the streak.',
    packs: [
      ['Connection Week', [
        'Give your partner one specific, sincere compliment.',
        'Spend 15 minutes together with both phones put away.',
        'Ask one question about something your partner is looking forward to.',
        'Do one helpful thing before being asked.',
        'Share one favorite memory from your relationship.',
        'Plan one simple thing to enjoy together.',
        'Tell your partner one thing you appreciate about your relationship right now.',
      ]],
      ['Communication Week', [
        'Ask: “How are you really doing today?” and listen without fixing.',
        'Say one need clearly and kindly instead of expecting it to be guessed.',
        'Thank your partner for something they regularly do.',
        'Have a 10-minute check-in about how the week is going for both of you.',
        'Pause before responding during one tense moment and choose a calmer answer.',
        'Ask your partner what makes them feel most supported lately.',
        'End the week by naming one thing you understood better about each other.',
      ]],
      ['Joy Week', [
        'Send a playful or affectionate message during the day.',
        'Share a song that reminds you of your relationship.',
        'Do something small together that usually makes you laugh.',
        'Take a walk, coffee break, or short drive together with no agenda.',
        'Bring back a favorite snack, show, game, or small tradition.',
        'Take one photo together just because.',
        'Choose one fun thing you want to do together next week.',
      ]],
    ],
    note: 'Challenges are optional relationship activities, not therapy or professional advice. Skip any activity that does not feel appropriate or safe for your relationship.',
  },
  es: {
    title: 'Retos para Parejas',
    subtitle: 'Siete pequeñas acciones. Una semana con más conexión intencional.',
    intro: 'Completen el reto a su propio ritmo. El progreso se guarda solo en este navegador durante el reto semanal actual.',
    week: 'Reto de esta semana',
    progress: 'Completado',
    reset: 'Reiniciar esta semana',
    complete: '¡Reto completado!',
    completeCopy: 'Crearon siete momentos intencionales para su relación esta semana. Mantengan el hábito, no solo la racha.',
    packs: [
      ['Semana de Conexión', [
        'Dale a tu pareja un cumplido específico y sincero.',
        'Pasen 15 minutos juntos con ambos teléfonos guardados.',
        'Haz una pregunta sobre algo que tu pareja espera con ilusión.',
        'Haz algo útil antes de que te lo pidan.',
        'Comparte un recuerdo favorito de su relación.',
        'Planeen algo sencillo para disfrutar juntos.',
        'Dile a tu pareja algo que aprecias de su relación en este momento.',
      ]],
      ['Semana de Comunicación', [
        'Pregunta: “¿Cómo estás de verdad hoy?” y escucha sin intentar arreglarlo.',
        'Expresa una necesidad con claridad y amabilidad en lugar de esperar que la adivinen.',
        'Agradece a tu pareja algo que hace habitualmente.',
        'Tengan una conversación de 10 minutos sobre cómo va la semana para ambos.',
        'Haz una pausa antes de responder en un momento tenso y elige una respuesta más tranquila.',
        'Pregunta a tu pareja qué le hace sentir más apoyada últimamente.',
        'Terminen la semana nombrando algo que comprendieron mejor el uno del otro.',
      ]],
      ['Semana de Alegría', [
        'Envía un mensaje juguetón o cariñoso durante el día.',
        'Comparte una canción que te recuerde a su relación.',
        'Hagan juntos algo pequeño que normalmente les haga reír.',
        'Den un paseo, tomen un café o hagan un trayecto corto juntos sin agenda.',
        'Recuperen un snack, programa, juego o pequeña tradición favorita.',
        'Tómense una foto juntos simplemente porque sí.',
        'Elijan algo divertido que quieran hacer juntos la próxima semana.',
      ]],
    ],
    note: 'Los retos son actividades opcionales para la relación, no terapia ni asesoramiento profesional. Omite cualquier actividad que no resulte apropiada o segura para tu relación.',
  },
  fr: {
    title: 'Défis de Couple',
    subtitle: 'Sept petites actions. Une semaine de connexion plus intentionnelle.',
    intro: 'Avancez à votre rythme. La progression est enregistrée uniquement dans ce navigateur pour le défi hebdomadaire en cours.',
    week: 'Défi de cette semaine',
    progress: 'Terminé',
    reset: 'Réinitialiser la semaine',
    complete: 'Défi terminé !',
    completeCopy: 'Vous avez créé sept moments intentionnels pour votre relation cette semaine. Gardez l’habitude, pas seulement la série.',
    packs: [
      ['Semaine de Connexion', [
        'Faites à votre partenaire un compliment précis et sincère.',
        'Passez 15 minutes ensemble avec les deux téléphones rangés.',
        'Posez une question sur quelque chose que votre partenaire attend avec impatience.',
        'Faites une chose utile avant qu’on vous la demande.',
        'Partagez un souvenir préféré de votre relation.',
        'Planifiez une chose simple à apprécier ensemble.',
        'Dites à votre partenaire une chose que vous appréciez dans votre relation aujourd’hui.',
      ]],
      ['Semaine de Communication', [
        'Demandez : « Comment vas-tu vraiment aujourd’hui ? » et écoutez sans chercher à résoudre.',
        'Exprimez clairement et gentiment un besoin au lieu d’attendre qu’il soit deviné.',
        'Remerciez votre partenaire pour quelque chose qu’il ou elle fait régulièrement.',
        'Faites un bilan de 10 minutes sur la semaine pour chacun de vous.',
        'Faites une pause avant de répondre dans un moment tendu et choisissez une réponse plus calme.',
        'Demandez à votre partenaire ce qui lui donne le plus le sentiment d’être soutenu en ce moment.',
        'Terminez la semaine en nommant une chose que vous avez mieux comprise l’un de l’autre.',
      ]],
      ['Semaine de Joie', [
        'Envoyez un message joueur ou affectueux pendant la journée.',
        'Partagez une chanson qui vous rappelle votre relation.',
        'Faites ensemble une petite chose qui vous fait habituellement rire.',
        'Faites une promenade, une pause-café ou un court trajet ensemble sans programme.',
        'Ressortez une collation, une série, un jeu ou une petite tradition favorite.',
        'Prenez une photo ensemble juste pour le plaisir.',
        'Choisissez une chose amusante à faire ensemble la semaine prochaine.',
      ]],
    ],
    note: 'Les défis sont des activités relationnelles facultatives, pas une thérapie ni un conseil professionnel. Ignorez toute activité qui ne semble pas appropriée ou sûre pour votre relation.',
  },
  it: {
    title: 'Sfide di Coppia',
    subtitle: 'Sette piccole azioni. Una settimana di connessione più intenzionale.',
    intro: 'Completate la sfida al vostro ritmo. I progressi vengono salvati solo in questo browser per la sfida settimanale corrente.',
    week: 'Sfida di questa settimana',
    progress: 'Completato',
    reset: 'Reimposta questa settimana',
    complete: 'Sfida completata!',
    completeCopy: 'Avete creato sette momenti intenzionali per la relazione questa settimana. Conservate l’abitudine, non soltanto la serie.',
    packs: [
      ['Settimana della Connessione', [
        'Fai al partner un complimento specifico e sincero.',
        'Passate 15 minuti insieme con entrambi i telefoni messi via.',
        'Fai una domanda su qualcosa che il partner aspetta con entusiasmo.',
        'Fai una cosa utile prima che ti venga chiesta.',
        'Condividi un ricordo preferito della vostra relazione.',
        'Organizzate una cosa semplice da godervi insieme.',
        'Dì al partner una cosa che apprezzi della vostra relazione in questo momento.',
      ]],
      ['Settimana della Comunicazione', [
        'Chiedi: “Come stai davvero oggi?” e ascolta senza cercare di aggiustare tutto.',
        'Esprimi un bisogno in modo chiaro e gentile invece di aspettare che venga intuito.',
        'Ringrazia il partner per qualcosa che fa regolarmente.',
        'Fate un check-in di 10 minuti su come sta andando la settimana per entrambi.',
        'Fai una pausa prima di rispondere in un momento teso e scegli una risposta più calma.',
        'Chiedi al partner cosa lo fa sentire più sostenuto ultimamente.',
        'Concludete la settimana nominando una cosa che avete compreso meglio l’uno dell’altra.',
      ]],
      ['Settimana della Gioia', [
        'Invia un messaggio giocoso o affettuoso durante la giornata.',
        'Condividi una canzone che ti ricorda la vostra relazione.',
        'Fate insieme una piccola cosa che di solito vi fa ridere.',
        'Fate una passeggiata, una pausa caffè o un breve giro insieme senza programma.',
        'Riprendete uno snack, una serie, un gioco o una piccola tradizione preferita.',
        'Scattate una foto insieme semplicemente perché vi va.',
        'Scegliete una cosa divertente da fare insieme la prossima settimana.',
      ]],
    ],
    note: 'Le sfide sono attività relazionali facoltative, non terapia o consulenza professionale. Saltate qualsiasi attività che non sembri appropriata o sicura per la vostra relazione.',
  },
  de: {
    title: 'Paar-Challenges',
    subtitle: 'Sieben kleine Aktionen. Eine Woche mit bewussterer Verbindung.',
    intro: 'Absolviert die Challenge in eurem eigenen Tempo. Der Fortschritt wird nur in diesem Browser für die aktuelle Wochen-Challenge gespeichert.',
    week: 'Challenge dieser Woche',
    progress: 'Abgeschlossen',
    reset: 'Diese Woche zurücksetzen',
    complete: 'Challenge geschafft!',
    completeCopy: 'Ihr habt diese Woche sieben bewusste Momente für eure Beziehung geschaffen. Behaltet die Gewohnheit, nicht nur die Serie.',
    packs: [
      ['Woche der Verbindung', [
        'Mach deinem Partner ein konkretes, aufrichtiges Kompliment.',
        'Verbringt 15 Minuten zusammen, während beide Handys weggelegt sind.',
        'Frag nach etwas, auf das sich dein Partner gerade freut.',
        'Erledige eine hilfreiche Sache, bevor du darum gebeten wirst.',
        'Teilt eine Lieblings-Erinnerung aus eurer Beziehung.',
        'Plant eine einfache Sache, die ihr gemeinsam genießen könnt.',
        'Sag deinem Partner eine Sache, die du gerade an eurer Beziehung schätzt.',
      ]],
      ['Woche der Kommunikation', [
        'Frag: „Wie geht es dir heute wirklich?“ und höre zu, ohne sofort Lösungen anzubieten.',
        'Sprich ein Bedürfnis klar und freundlich aus, statt zu erwarten, dass es erraten wird.',
        'Bedanke dich bei deinem Partner für etwas, das er oder sie regelmäßig tut.',
        'Macht einen 10-minütigen Check-in darüber, wie die Woche für euch beide läuft.',
        'Mach in einem angespannten Moment eine Pause, bevor du antwortest, und wähle eine ruhigere Reaktion.',
        'Frag deinen Partner, wodurch er oder sie sich derzeit am meisten unterstützt fühlt.',
        'Beendet die Woche mit einer Sache, die ihr gegenseitig besser verstanden habt.',
      ]],
      ['Woche der Freude', [
        'Schick tagsüber eine spielerische oder liebevolle Nachricht.',
        'Teile ein Lied, das dich an eure Beziehung erinnert.',
        'Macht gemeinsam etwas Kleines, das euch normalerweise zum Lachen bringt.',
        'Macht einen Spaziergang, eine Kaffeepause oder eine kurze Fahrt zusammen – ohne Plan.',
        'Holt einen Lieblingssnack, eine Serie, ein Spiel oder eine kleine Tradition zurück.',
        'Macht einfach so ein gemeinsames Foto.',
        'Wählt eine Sache aus, auf die ihr euch nächste Woche gemeinsam freuen könnt.',
      ]],
    ],
    note: 'Challenges sind freiwillige Beziehungsaktivitäten und keine Therapie oder professionelle Beratung. Überspringt jede Aktivität, die sich für eure Beziehung nicht passend oder sicher anfühlt.',
  },
};

function getWeekId(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const day = Math.floor((date - start) / 86400000);
  const week = Math.ceil((day + start.getUTCDay() + 1) / 7);
  return `${date.getUTCFullYear()}-${week}`;
}

export default function CouplesChallenges() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const weekId = useMemo(() => getWeekId(), []);
  const packIndex = useMemo(() => {
    const [, week] = weekId.split('-');
    return Number(week) % t.packs.length;
  }, [t.packs.length, weekId]);
  const [packTitle, activities] = t.packs[packIndex];
  const storageKey = `o2ol-couples-challenge-${weekId}`;

  const [completed, setCompleted] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved.filter((value) => Number.isInteger(value) && value >= 0 && value < 7) : [];
    } catch {
      return [];
    }
  });

  const updateCompleted = (next) => {
    setCompleted(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Local progress is optional; the challenge remains usable without storage.
    }
  };

  const toggle = (index) => {
    const next = completed.includes(index)
      ? completed.filter((item) => item !== index)
      : [...completed, index].sort((a, b) => a - b);
    updateCompleted(next);
  };

  const reset = () => updateCompleted([]);
  const finished = completed.length === activities.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Trophy className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-3 text-xl font-semibold text-emerald-700">{t.subtitle}</p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">{t.intro}</p>
        </div>

        <Card className="mt-8 rounded-3xl border-emerald-100">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{t.week}</div>
                <CardTitle className="mt-1 text-2xl">{packTitle}</CardTitle>
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                {t.progress}: {completed.length}/7
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.map((activity, index) => {
              const isDone = completed.includes(index);
              return (
                <button
                  key={activity}
                  type="button"
                  onClick={() => toggle(index)}
                  aria-pressed={isDone}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                    isDone ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-200'
                  }`}
                >
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${isDone ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 text-slate-400'}`}>
                    {isDone ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className={`leading-6 ${isDone ? 'text-emerald-950 line-through decoration-emerald-400' : 'text-slate-700'}`}>{activity}</span>
                </button>
              );
            })}

            {finished ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950" role="status">
                <div className="flex items-center gap-2 font-bold"><Sparkles className="h-5 w-5" aria-hidden="true" />{t.complete}</div>
                <p className="mt-2 text-sm leading-6">{t.completeCopy}</p>
              </div>
            ) : null}

            <div className="pt-3 text-center">
              <Button type="button" variant="outline" onClick={reset} disabled={completed.length === 0}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />{t.reset}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-5 text-slate-500">
          <Heart className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />{t.note}
        </p>
      </div>
    </div>
  );
}
