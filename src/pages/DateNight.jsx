import React, { useMemo, useState } from 'react';
import { CalendarHeart, Clock3, Coffee, Heart, Home, Shuffle, Sparkles, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Date Night',
    subtitle: 'Pick the time and budget. We’ll give you a simple plan.',
    intro: 'Date night does not have to be expensive or complicated. The goal is protected time together with enough structure that you do not spend the whole evening deciding what to do.',
    time: 'Time available',
    budget: 'Budget',
    times: [['quick', '30–60 min'], ['medium', '1–2 hours'], ['long', 'A few hours']],
    budgets: [['free', 'Free / almost free'], ['low', 'Low cost'], ['flex', 'Flexible']],
    yourPlan: 'Your date-night plan',
    another: 'Give us another plan',
    conversation: 'Conversation prompt',
    finish: 'Finish the night',
    plans: [
      ['quick', 'free', 'Phone-Free Walk', 'Take a walk together somewhere familiar, but leave the phones in a pocket or bag. Each person chooses one thing to notice and one question to ask.', 'What has been taking up the most space in your mind lately?', 'Before heading home, each name one thing you enjoyed about the time together.'],
      ['quick', 'low', 'Coffee & Curiosity', 'Grab coffee, tea, or dessert somewhere easy. Each person brings one question they have never asked the other—or have not asked in a long time.', 'What is something you are excited about that I may not fully know yet?', 'Choose one small thing you want to do together next week.'],
      ['quick', 'flex', 'Mini Adventure', 'Pick a nearby place neither of you normally stops: a bookstore, park, market, neighborhood, or dessert spot. Keep the plan intentionally small.', 'What makes an ordinary day feel special to you?', 'Take one photo or choose one word that captures the date.'],
      ['medium', 'free', 'Home Bistro Night', 'Use food you already have and turn one meal into an occasion. Set the table differently, put on music, and agree that chores and logistics wait until afterward.', 'What is one thing about our relationship you never want us to take for granted?', 'Clean up together while playing two songs each person chooses.'],
      ['medium', 'low', 'Two-Stop Date', 'Choose two simple stops: one for food or a drink and one for walking, browsing, music, games, or dessert. The variety makes a basic outing feel more intentional.', 'When do you feel most like we are a team?', 'On the way home, each rate the date by one word—not a number.'],
      ['medium', 'flex', 'Choose-for-Each-Other Date', 'Each person secretly chooses one small part of the date for the other: a snack, activity, place, song, or surprise stop. Keep the choices kind and low-pressure.', 'What is something you have noticed about me lately that I may not realize?', 'Thank each other for the part of the night they chose.'],
      ['long', 'free', 'Memory Lane Date', 'Revisit meaningful places, old photos, saved messages, or favorite music from your relationship. Mix remembering with one new thing you have never done together.', 'Which chapter of our relationship taught us the most?', 'End by naming one thing you hope the next chapter includes.'],
      ['long', 'low', 'Neighborhood Explorer', 'Pick an area nearby and make three simple stops without overplanning: something to eat, something to see, and somewhere to sit and talk.', 'If we had one completely free day together, how would you want to spend it?', 'Choose the best stop and save it as a place to revisit.'],
      ['long', 'flex', 'Full Reset Date', 'Build the date around three parts: something fun, a meal, and unhurried conversation. Keep work, household logistics, and problem-solving out of the first two parts.', 'What would help us feel more connected during the next month?', 'Choose one realistic connection habit to try before your next date night.'],
    ],
    note: 'Choose activities that fit your health, safety, budget, accessibility, and local conditions. One2OneLove does not arrange or supervise date activities.',
  },
  es: {
    title: 'Noche de Cita',
    subtitle: 'Elige el tiempo y el presupuesto. Te damos un plan sencillo.',
    intro: 'Una cita no tiene que ser cara ni complicada. La meta es proteger tiempo juntos con suficiente estructura para no pasar toda la noche decidiendo qué hacer.',
    time: 'Tiempo disponible',
    budget: 'Presupuesto',
    times: [['quick', '30–60 min'], ['medium', '1–2 horas'], ['long', 'Varias horas']],
    budgets: [['free', 'Gratis / casi gratis'], ['low', 'Bajo costo'], ['flex', 'Flexible']],
    yourPlan: 'Tu plan para la cita',
    another: 'Danos otro plan',
    conversation: 'Pregunta para conversar',
    finish: 'Para terminar la noche',
    plans: [
      ['quick', 'free', 'Paseo sin Teléfonos', 'Den un paseo juntos por un lugar conocido, pero guarden los teléfonos. Cada uno elige algo que observar y una pregunta que hacer.', '¿Qué ha estado ocupando más espacio en tu mente últimamente?', 'Antes de volver a casa, cada uno menciona algo que disfrutó del tiempo juntos.'],
      ['quick', 'low', 'Café y Curiosidad', 'Tomen café, té o un postre en un lugar sencillo. Cada uno lleva una pregunta que nunca haya hecho o que no haya hecho en mucho tiempo.', '¿Qué te emociona en este momento que quizá yo todavía no conozca bien?', 'Elijan una cosa pequeña que quieran hacer juntos la próxima semana.'],
      ['quick', 'flex', 'Mini Aventura', 'Elijan un lugar cercano donde normalmente no se detienen: librería, parque, mercado, vecindario o postre. Mantengan el plan intencionalmente pequeño.', '¿Qué hace que un día normal se sienta especial para ti?', 'Tomen una foto o elijan una palabra que represente la cita.'],
      ['medium', 'free', 'Bistró en Casa', 'Usen comida que ya tengan y conviertan una comida en una ocasión. Cambien la mesa, pongan música y dejen las tareas y la logística para después.', '¿Qué aspecto de nuestra relación nunca quisieras que diéramos por sentado?', 'Recojan juntos mientras cada uno elige dos canciones.'],
      ['medium', 'low', 'Cita de Dos Paradas', 'Elijan dos paradas sencillas: una para comer o beber y otra para caminar, explorar, escuchar música, jugar o tomar postre.', '¿Cuándo sientes más que somos un equipo?', 'De regreso a casa, cada uno describe la cita con una palabra, no con un número.'],
      ['medium', 'flex', 'Elijan el Uno para el Otro', 'Cada persona elige en secreto una parte pequeña de la cita para la otra: snack, actividad, lugar, canción o parada sorpresa. Mantengan las elecciones amables y sin presión.', '¿Qué has notado de mí últimamente que quizá yo no haya notado?', 'Agradézcanse mutuamente la parte de la noche que eligieron.'],
      ['long', 'free', 'Cita Camino de Recuerdos', 'Vuelvan a lugares significativos, fotos antiguas, mensajes guardados o música favorita de su relación. Combinen recuerdos con algo nuevo que nunca hayan hecho juntos.', '¿Qué etapa de nuestra relación nos enseñó más?', 'Terminen nombrando algo que esperan que incluya la próxima etapa.'],
      ['long', 'low', 'Exploradores del Vecindario', 'Elijan una zona cercana y hagan tres paradas simples sin planificar demasiado: algo para comer, algo para ver y un lugar para sentarse y hablar.', 'Si tuviéramos un día completamente libre juntos, ¿cómo te gustaría pasarlo?', 'Elijan la mejor parada y guárdenla como lugar para repetir.'],
      ['long', 'flex', 'Cita de Reinicio Completo', 'Construyan la cita en tres partes: algo divertido, una comida y conversación sin prisa. Dejen trabajo, logística doméstica y resolución de problemas fuera de las primeras dos partes.', '¿Qué nos ayudaría a sentirnos más conectados durante el próximo mes?', 'Elijan un hábito realista de conexión para probar antes de la próxima cita.'],
    ],
    note: 'Elijan actividades que se adapten a su salud, seguridad, presupuesto, accesibilidad y condiciones locales. One2OneLove no organiza ni supervisa las actividades.',
  },
  fr: {
    title: 'Soirée en Couple',
    subtitle: 'Choisissez le temps et le budget. Nous vous proposons un plan simple.',
    intro: 'Une soirée en couple n’a pas besoin d’être coûteuse ou compliquée. L’objectif est de protéger du temps ensemble avec assez de structure pour ne pas passer la soirée à décider quoi faire.',
    time: 'Temps disponible',
    budget: 'Budget',
    times: [['quick', '30–60 min'], ['medium', '1–2 heures'], ['long', 'Quelques heures']],
    budgets: [['free', 'Gratuit / presque gratuit'], ['low', 'Petit budget'], ['flex', 'Flexible']],
    yourPlan: 'Votre plan de soirée',
    another: 'Proposer un autre plan',
    conversation: 'Question de conversation',
    finish: 'Pour terminer la soirée',
    plans: [
      ['quick', 'free', 'Promenade Sans Téléphone', 'Faites une promenade dans un lieu familier en gardant les téléphones dans une poche ou un sac. Chacun choisit une chose à remarquer et une question à poser.', 'Qu’est-ce qui occupe le plus ton esprit ces derniers temps ?', 'Avant de rentrer, chacun nomme une chose appréciée pendant ce moment.'],
      ['quick', 'low', 'Café & Curiosité', 'Prenez un café, un thé ou un dessert dans un endroit simple. Chacun apporte une question qu’il n’a jamais posée ou qu’il n’a pas posée depuis longtemps.', 'Qu’est-ce qui t’enthousiasme en ce moment et que je ne connais peut-être pas encore bien ?', 'Choisissez une petite chose à faire ensemble la semaine prochaine.'],
      ['quick', 'flex', 'Mini Aventure', 'Choisissez un endroit proche où vous ne vous arrêtez pas d’habitude : librairie, parc, marché, quartier ou dessert. Gardez le plan volontairement simple.', 'Qu’est-ce qui rend une journée ordinaire spéciale pour toi ?', 'Prenez une photo ou choisissez un mot qui résume la soirée.'],
      ['medium', 'free', 'Bistrot à la Maison', 'Utilisez ce que vous avez déjà et transformez un repas en occasion spéciale. Changez la table, mettez de la musique et laissez les tâches et la logistique pour plus tard.', 'Qu’est-ce que tu ne voudrais jamais que nous considérions comme acquis dans notre relation ?', 'Rangez ensemble en choisissant chacun deux chansons.'],
      ['medium', 'low', 'Rendez-vous en Deux Étapes', 'Choisissez deux étapes simples : une pour manger ou boire et une autre pour marcher, regarder, écouter de la musique, jouer ou prendre un dessert.', 'Quand as-tu le plus le sentiment que nous formons une équipe ?', 'Sur le chemin du retour, chacun décrit la soirée en un mot, pas avec une note.'],
      ['medium', 'flex', 'Choisir l’un pour l’autre', 'Chacun choisit secrètement une petite partie de la soirée pour l’autre : collation, activité, lieu, chanson ou arrêt surprise. Gardez les choix bienveillants et sans pression.', 'Qu’as-tu remarqué chez moi récemment que je ne réalise peut-être pas ?', 'Remerciez-vous pour la partie de la soirée choisie par l’autre.'],
      ['long', 'free', 'Soirée Souvenirs', 'Revisitez des lieux importants, anciennes photos, messages sauvegardés ou musiques préférées de votre relation. Mélangez souvenirs et une chose nouvelle à faire ensemble.', 'Quel chapitre de notre relation nous a le plus appris ?', 'Terminez en nommant une chose que vous espérez voir dans le prochain chapitre.'],
      ['long', 'low', 'Explorer le Quartier', 'Choisissez un secteur proche et faites trois arrêts simples sans trop planifier : quelque chose à manger, quelque chose à voir et un endroit pour s’asseoir et parler.', 'Si nous avions une journée totalement libre ensemble, comment aimerais-tu la passer ?', 'Choisissez votre meilleur arrêt et gardez-le comme lieu à revisiter.'],
      ['long', 'flex', 'Soirée Grand Reset', 'Construisez la soirée en trois parties : quelque chose d’amusant, un repas et une conversation sans précipitation. Gardez travail, logistique domestique et résolution de problèmes hors des deux premières parties.', 'Qu’est-ce qui nous aiderait à nous sentir plus proches le mois prochain ?', 'Choisissez une habitude réaliste de connexion à essayer avant votre prochaine soirée.'],
    ],
    note: 'Choisissez des activités adaptées à votre santé, votre sécurité, votre budget, votre accessibilité et les conditions locales. One2OneLove n’organise ni ne supervise les activités.',
  },
  it: {
    title: 'Serata di Coppia',
    subtitle: 'Scegli tempo e budget. Ti proponiamo un piano semplice.',
    intro: 'Una serata di coppia non deve essere costosa o complicata. L’obiettivo è proteggere del tempo insieme con abbastanza struttura da non passare la serata a decidere cosa fare.',
    time: 'Tempo disponibile',
    budget: 'Budget',
    times: [['quick', '30–60 min'], ['medium', '1–2 ore'], ['long', 'Qualche ora']],
    budgets: [['free', 'Gratis / quasi gratis'], ['low', 'Basso costo'], ['flex', 'Flessibile']],
    yourPlan: 'Il vostro piano per la serata',
    another: 'Proponi un altro piano',
    conversation: 'Spunto di conversazione',
    finish: 'Per concludere la serata',
    plans: [
      ['quick', 'free', 'Passeggiata Senza Telefoni', 'Fate una passeggiata in un posto familiare lasciando i telefoni in tasca o in borsa. Ognuno sceglie una cosa da notare e una domanda da fare.', 'Che cosa sta occupando più spazio nella tua mente ultimamente?', 'Prima di tornare a casa, ognuno nomina una cosa apprezzata del tempo insieme.'],
      ['quick', 'low', 'Caffè e Curiosità', 'Prendete caffè, tè o dessert in un posto semplice. Ognuno porta una domanda mai fatta prima o non fatta da molto tempo.', 'C’è qualcosa che ti entusiasma e che forse io non conosco ancora bene?', 'Scegliete una piccola cosa da fare insieme la prossima settimana.'],
      ['quick', 'flex', 'Mini Avventura', 'Scegliete un posto vicino dove normalmente non vi fermate: libreria, parco, mercato, quartiere o dessert. Mantenete il piano volutamente piccolo.', 'Cosa rende speciale per te una giornata normale?', 'Scattate una foto o scegliete una parola che rappresenti la serata.'],
      ['medium', 'free', 'Bistrot a Casa', 'Usate ciò che avete già e trasformate un pasto in un’occasione. Cambiate la tavola, mettete musica e lasciate faccende e logistica a dopo.', 'Qual è una cosa della nostra relazione che non vorresti mai dessimo per scontata?', 'Sistemate insieme scegliendo due canzoni a testa.'],
      ['medium', 'low', 'Appuntamento in Due Tappe', 'Scegliete due tappe semplici: una per mangiare o bere e una per camminare, curiosare, ascoltare musica, giocare o prendere un dessert.', 'Quando senti maggiormente che siamo una squadra?', 'Sulla strada di casa descrivete la serata con una parola, non con un voto.'],
      ['medium', 'flex', 'Scegliete l’uno per l’altra', 'Ognuno sceglie in segreto una piccola parte della serata per l’altro: snack, attività, posto, canzone o tappa sorpresa. Mantenete le scelte gentili e senza pressione.', 'Cosa hai notato di me ultimamente che forse io non vedo?', 'Ringraziatevi per la parte della serata scelta dall’altro.'],
      ['long', 'free', 'Serata dei Ricordi', 'Tornate in luoghi significativi, guardate vecchie foto, messaggi salvati o musica preferita della relazione. Unite i ricordi a una cosa nuova mai fatta insieme.', 'Quale capitolo della nostra relazione ci ha insegnato di più?', 'Concludete nominando una cosa che sperate faccia parte del prossimo capitolo.'],
      ['long', 'low', 'Esploratori del Quartiere', 'Scegliete una zona vicina e fate tre tappe semplici senza pianificare troppo: qualcosa da mangiare, qualcosa da vedere e un posto dove sedersi e parlare.', 'Se avessimo un’intera giornata libera insieme, come vorresti trascorrerla?', 'Scegliete la tappa migliore e salvatela come posto da rivisitare.'],
      ['long', 'flex', 'Serata Reset Completo', 'Costruite la serata in tre parti: qualcosa di divertente, un pasto e una conversazione senza fretta. Tenete lavoro, logistica domestica e problemi fuori dalle prime due parti.', 'Cosa ci aiuterebbe a sentirci più connessi durante il prossimo mese?', 'Scegliete un’abitudine realistica di connessione da provare prima della prossima serata.'],
    ],
    note: 'Scegliete attività adatte a salute, sicurezza, budget, accessibilità e condizioni locali. One2OneLove non organizza né supervisiona le attività.',
  },
  de: {
    title: 'Date Night',
    subtitle: 'Wählt Zeit und Budget. Wir geben euch einen einfachen Plan.',
    intro: 'Ein Date muss weder teuer noch kompliziert sein. Das Ziel ist geschützte gemeinsame Zeit mit genug Struktur, damit ihr nicht den ganzen Abend überlegt, was ihr machen sollt.',
    time: 'Verfügbare Zeit',
    budget: 'Budget',
    times: [['quick', '30–60 Min.'], ['medium', '1–2 Stunden'], ['long', 'Ein paar Stunden']],
    budgets: [['free', 'Kostenlos / fast kostenlos'], ['low', 'Günstig'], ['flex', 'Flexibel']],
    yourPlan: 'Euer Date-Night-Plan',
    another: 'Einen anderen Plan zeigen',
    conversation: 'Gesprächsimpuls',
    finish: 'Zum Abschluss',
    plans: [
      ['quick', 'free', 'Handyfreier Spaziergang', 'Macht gemeinsam einen Spaziergang an einem vertrauten Ort und lasst die Handys in Tasche oder Jacke. Jeder wählt eine Sache zum Wahrnehmen und eine Frage.', 'Was beschäftigt dich in letzter Zeit am meisten?', 'Bevor ihr nach Hause geht, nennt jeder eine Sache, die an der gemeinsamen Zeit schön war.'],
      ['quick', 'low', 'Kaffee & Neugier', 'Holt euch Kaffee, Tee oder Dessert an einem einfachen Ort. Jeder bringt eine Frage mit, die noch nie oder lange nicht gestellt wurde.', 'Worauf freust du dich gerade, von dem ich vielleicht noch nicht viel weiß?', 'Wählt eine kleine Sache aus, die ihr nächste Woche zusammen machen möchtet.'],
      ['quick', 'flex', 'Mini-Abenteuer', 'Wählt einen nahen Ort, an dem ihr normalerweise nicht stoppt: Buchladen, Park, Markt, Viertel oder Dessert-Laden. Haltet den Plan bewusst klein.', 'Was macht einen gewöhnlichen Tag für dich besonders?', 'Macht ein Foto oder wählt ein Wort, das das Date beschreibt.'],
      ['medium', 'free', 'Bistro zu Hause', 'Nutzt Essen, das ihr schon habt, und macht aus einer Mahlzeit einen Anlass. Deckt anders, macht Musik an und verschiebt Haushalt und Organisation auf später.', 'Was an unserer Beziehung sollten wir niemals als selbstverständlich ansehen?', 'Räumt zusammen auf und wählt dabei jeweils zwei Songs aus.'],
      ['medium', 'low', 'Zwei-Stopps-Date', 'Wählt zwei einfache Stopps: einen für Essen oder Getränk und einen zum Spazieren, Stöbern, Musik hören, Spielen oder Dessert.', 'Wann fühlst du am stärksten, dass wir ein Team sind?', 'Auf dem Heimweg beschreibt jeder das Date mit einem Wort statt einer Zahl.'],
      ['medium', 'flex', 'Füreinander Auswählen', 'Jeder wählt heimlich einen kleinen Teil des Dates für den anderen: Snack, Aktivität, Ort, Song oder Überraschungsstopp. Haltet die Auswahl freundlich und ohne Druck.', 'Was ist dir in letzter Zeit an mir aufgefallen, das ich vielleicht selbst nicht merke?', 'Bedankt euch gegenseitig für den Teil des Abends, den der andere gewählt hat.'],
      ['long', 'free', 'Erinnerungs-Date', 'Besucht bedeutungsvolle Orte, alte Fotos, gespeicherte Nachrichten oder Lieblingsmusik aus eurer Beziehung. Verbindet Erinnern mit einer neuen Sache, die ihr noch nie zusammen gemacht habt.', 'Welches Kapitel unserer Beziehung hat uns am meisten gelehrt?', 'Nennt zum Abschluss eine Sache, die ihr euch für das nächste Kapitel wünscht.'],
      ['long', 'low', 'Viertel-Entdecker', 'Wählt eine Gegend in der Nähe und macht drei einfache Stopps ohne Überplanung: etwas essen, etwas ansehen und irgendwo sitzen und reden.', 'Wenn wir einen völlig freien Tag zusammen hätten, wie würdest du ihn verbringen wollen?', 'Wählt den besten Stopp und merkt ihn euch zum Wiederkommen.'],
      ['long', 'flex', 'Großes Reset-Date', 'Baut das Date aus drei Teilen: etwas Spaßiges, eine Mahlzeit und ein ruhiges Gespräch. Lasst Arbeit, Haushalt und Problemlösung aus den ersten beiden Teilen heraus.', 'Was würde uns helfen, uns im nächsten Monat stärker verbunden zu fühlen?', 'Wählt eine realistische Gewohnheit für mehr Verbindung bis zum nächsten Date.'],
    ],
    note: 'Wählt Aktivitäten, die zu Gesundheit, Sicherheit, Budget, Barrierefreiheit und örtlichen Bedingungen passen. One2OneLove organisiert oder beaufsichtigt Date-Aktivitäten nicht.',
  },
};

const timeIcons = { quick: Coffee, medium: Clock3, long: CalendarHeart };

export default function DateNight() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [time, setTime] = useState('medium');
  const [budget, setBudget] = useState('low');
  const [nonce, setNonce] = useState(0);

  const matches = useMemo(() => t.plans.filter(([planTime, planBudget]) => planTime === time && planBudget === budget), [budget, t.plans, time]);
  const plan = matches[nonce % Math.max(matches.length, 1)] || t.plans[0];
  const [, , title, description, prompt, finish] = plan;

  return (
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50 via-white to-amber-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700">
            <CalendarHeart className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-3 text-xl font-semibold text-fuchsia-700">{t.subtitle}</p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-600">{t.intro}</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="rounded-3xl">
            <CardHeader><CardTitle>{t.time}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {t.times.map(([value, label]) => {
                const Icon = timeIcons[value] || Clock3;
                return (
                  <button key={value} type="button" onClick={() => { setTime(value); setNonce(0); }} aria-pressed={time === value} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${time === value ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900' : 'border-slate-200 text-slate-700 hover:border-fuchsia-200'}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />{label}
                  </button>
                );
              })}

              <div className="pt-3"><div className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><WalletCards className="h-4 w-4" aria-hidden="true" />{t.budget}</div>
                <div className="space-y-2">
                  {t.budgets.map(([value, label]) => (
                    <button key={value} type="button" onClick={() => { setBudget(value); setNonce(0); }} aria-pressed={budget === value} className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${budget === value ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900' : 'border-slate-200 text-slate-700 hover:border-fuchsia-200'}`}>{label}</button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-fuchsia-100">
            <CardHeader>
              <div className="text-sm font-semibold uppercase tracking-wide text-fuchsia-700">{t.yourPlan}</div>
              <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-7 text-slate-700">{description}</p>
              <div className="mt-6 rounded-2xl bg-pink-50 p-5">
                <div className="flex items-center gap-2 font-semibold text-pink-900"><Heart className="h-4 w-4" aria-hidden="true" />{t.conversation}</div>
                <p className="mt-2 leading-6 text-pink-950">{prompt}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-amber-50 p-5">
                <div className="flex items-center gap-2 font-semibold text-amber-900"><Sparkles className="h-4 w-4" aria-hidden="true" />{t.finish}</div>
                <p className="mt-2 leading-6 text-amber-950">{finish}</p>
              </div>
              <Button type="button" variant="outline" className="mt-6 w-full" onClick={() => setNonce((value) => value + 1)}>
                <Shuffle className="mr-2 h-4 w-4" aria-hidden="true" />{t.another}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-5 text-slate-500">
          <Home className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />{t.note}
        </p>
      </div>
    </div>
  );
}
