import React, { useMemo, useState } from 'react';
import { Heart, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Conversation Cards',
    subtitle: 'Better conversations do not always need a big moment. Sometimes they just need a good question.',
    choose: 'Choose a conversation focus',
    next: 'Next Card',
    tipTitle: 'How to use the cards',
    tip: 'Take turns answering. Listen without interrupting, ask one follow-up question, and do not use an answer as ammunition later.',
    categories: {
      connection: ['Connection', ['What is something small I did recently that made you feel cared for?', 'When do you feel closest to me lately?', 'What is one thing we could do this week to feel more connected?', 'What memory of us still makes you smile immediately?', 'What kind of affection feels most meaningful to you right now?']],
      appreciation: ['Appreciation', ['What is something about me you appreciate but do not say often enough?', 'What part of our relationship are you most grateful for today?', 'What strength do you see in me that I may overlook in myself?', 'What is one ordinary thing I do that makes your life easier?', 'What have we handled well together recently?']],
      growth: ['Growth', ['What is one habit that would make our relationship stronger if we practiced it consistently?', 'Where do you think we have grown the most as a couple?', 'What is one area where you would like more teamwork from us?', 'What would a healthier version of one recurring disagreement look like?', 'What is something new you would like us to learn or experience together?']],
      fun: ['Fun & Friendship', ['What is something silly we should do together soon?', 'If we had a completely free Saturday, how would you want to spend it?', 'What is one thing we used to do for fun that you would like to bring back?', 'What kind of mini-adventure would feel exciting right now?', 'What always makes us laugh together?']],
      future: ['Future', ['What are you most excited to build together over the next year?', 'What does a peaceful life together look like to you?', 'What is one shared goal you would love us to make progress on?', 'What tradition would you like us to create?', 'What do you hope we never stop doing as our relationship changes?']],
    },
  },
  es: {
    title: 'Tarjetas de Conversación',
    subtitle: 'Las mejores conversaciones no siempre necesitan un gran momento. A veces solo necesitan una buena pregunta.',
    choose: 'Elige un enfoque para conversar', next: 'Siguiente Tarjeta', tipTitle: 'Cómo usar las tarjetas', tip: 'Túrnense para responder. Escuchen sin interrumpir, hagan una pregunta de seguimiento y no usen una respuesta como arma más adelante.',
    categories: {
      connection: ['Conexión', ['¿Qué cosa pequeña hice recientemente que te hizo sentir cuidado/a?', '¿Cuándo te sientes más cerca de mí últimamente?', '¿Qué podríamos hacer esta semana para sentirnos más conectados?', '¿Qué recuerdo nuestro todavía te hace sonreír de inmediato?', '¿Qué tipo de afecto se siente más significativo para ti ahora?']],
      appreciation: ['Aprecio', ['¿Qué cosa de mí aprecias pero no dices con suficiente frecuencia?', '¿Qué parte de nuestra relación agradeces más hoy?', '¿Qué fortaleza ves en mí que quizá yo no veo?', '¿Qué cosa cotidiana hago que facilita tu vida?', '¿Qué hemos manejado bien juntos recientemente?']],
      growth: ['Crecimiento', ['¿Qué hábito fortalecería nuestra relación si lo practicáramos constantemente?', '¿En qué crees que más hemos crecido como pareja?', '¿En qué área te gustaría que trabajáramos más como equipo?', '¿Cómo sería una versión más saludable de una discusión recurrente?', '¿Qué cosa nueva te gustaría que aprendiéramos o viviéramos juntos?']],
      fun: ['Diversión y Amistad', ['¿Qué cosa divertida o tonta deberíamos hacer juntos pronto?', 'Si tuviéramos un sábado completamente libre, ¿cómo te gustaría pasarlo?', '¿Qué hacíamos antes por diversión que te gustaría recuperar?', '¿Qué miniaventura te parecería emocionante ahora?', '¿Qué siempre nos hace reír juntos?']],
      future: ['Futuro', ['¿Qué te emociona más construir juntos durante el próximo año?', '¿Cómo es para ti una vida tranquila juntos?', '¿En qué meta compartida te gustaría que avanzáramos?', '¿Qué tradición te gustaría que creáramos?', '¿Qué esperas que nunca dejemos de hacer mientras cambia nuestra relación?']],
    },
  },
  fr: {
    title: 'Cartes de Conversation',
    subtitle: 'Une meilleure conversation n’exige pas toujours un grand moment. Parfois, une bonne question suffit.',
    choose: 'Choisissez un thème de conversation', next: 'Carte Suivante', tipTitle: 'Comment utiliser les cartes', tip: 'Répondez chacun votre tour. Écoutez sans interrompre, posez une question complémentaire et ne réutilisez pas une réponse comme une arme plus tard.',
    categories: {
      connection: ['Connexion', ['Quelle petite chose que j’ai faite récemment t’a fait te sentir aimé(e) ou soutenu(e) ?', 'Quand te sens-tu le plus proche de moi ces derniers temps ?', 'Que pourrions-nous faire cette semaine pour nous sentir plus connectés ?', 'Quel souvenir de nous te fait encore sourire immédiatement ?', 'Quel type d’affection compte le plus pour toi en ce moment ?']],
      appreciation: ['Appréciation', ['Qu’est-ce que tu apprécies chez moi sans me le dire assez souvent ?', 'Pour quelle partie de notre relation es-tu le plus reconnaissant aujourd’hui ?', 'Quelle force vois-tu en moi que je ne remarque peut-être pas ?', 'Quelle chose ordinaire que je fais facilite ta vie ?', 'Qu’avons-nous particulièrement bien géré ensemble récemment ?']],
      growth: ['Croissance', ['Quelle habitude renforcerait notre relation si nous la pratiquions régulièrement ?', 'Dans quel domaine avons-nous le plus grandi comme couple ?', 'Dans quel domaine aimerais-tu davantage de travail d’équipe entre nous ?', 'À quoi ressemblerait une version plus saine d’un désaccord récurrent ?', 'Qu’aimerais-tu que nous apprenions ou découvrions ensemble ?']],
      fun: ['Plaisir & Amitié', ['Quelle chose un peu folle devrions-nous faire ensemble bientôt ?', 'Si nous avions un samedi entièrement libre, comment aimerais-tu le passer ?', 'Quelle activité amusante d’autrefois aimerais-tu reprendre ?', 'Quelle petite aventure serait excitante en ce moment ?', 'Qu’est-ce qui nous fait toujours rire ensemble ?']],
      future: ['Avenir', ['Qu’est-ce qui t’enthousiasme le plus dans ce que nous pourrions construire ensemble cette année ?', 'À quoi ressemble pour toi une vie paisible ensemble ?', 'Sur quel objectif commun aimerais-tu que nous avancions ?', 'Quelle tradition aimerais-tu créer avec moi ?', 'Qu’espères-tu que nous ne cessions jamais de faire malgré les changements de notre relation ?']],
    },
  },
  it: {
    title: 'Carte di Conversazione',
    subtitle: 'Le conversazioni migliori non richiedono sempre un grande momento. A volte basta una buona domanda.',
    choose: 'Scegli un tema di conversazione', next: 'Carta Successiva', tipTitle: 'Come usare le carte', tip: 'Rispondete a turno. Ascoltate senza interrompere, fate una domanda di approfondimento e non usate una risposta come arma in seguito.',
    categories: {
      connection: ['Connessione', ['Quale piccola cosa che ho fatto di recente ti ha fatto sentire amato/a?', 'Quando ti senti più vicino/a a me ultimamente?', 'Cosa potremmo fare questa settimana per sentirci più connessi?', 'Quale ricordo di noi ti fa ancora sorridere subito?', 'Quale tipo di affetto è più importante per te in questo momento?']],
      appreciation: ['Apprezzamento', ['Cosa apprezzi di me ma non dici abbastanza spesso?', 'Di quale parte della nostra relazione sei più grato/a oggi?', 'Quale mia forza vedi che io potrei non riconoscere?', 'Quale cosa quotidiana che faccio rende la tua vita più facile?', 'Cosa abbiamo gestito bene insieme recentemente?']],
      growth: ['Crescita', ['Quale abitudine renderebbe più forte la nostra relazione se la praticassimo con costanza?', 'Dove pensi che siamo cresciuti di più come coppia?', 'In quale area vorresti più lavoro di squadra tra noi?', 'Come sarebbe una versione più sana di un disaccordo ricorrente?', 'Cosa di nuovo vorresti imparare o vivere insieme?']],
      fun: ['Divertimento e Amicizia', ['Quale cosa sciocca dovremmo fare insieme presto?', 'Se avessimo un sabato completamente libero, come vorresti trascorrerlo?', 'Quale attività divertente del passato vorresti riprendere?', 'Quale piccola avventura sarebbe emozionante adesso?', 'Cosa ci fa sempre ridere insieme?']],
      future: ['Futuro', ['Cosa ti entusiasma di più costruire insieme nel prossimo anno?', 'Come immagini una vita serena insieme?', 'Su quale obiettivo condiviso vorresti che facessimo progressi?', 'Quale tradizione vorresti creare insieme?', 'Cosa speri che non smetteremo mai di fare mentre la nostra relazione cambia?']],
    },
  },
  de: {
    title: 'Gesprächskarten',
    subtitle: 'Gute Gespräche brauchen nicht immer einen großen Anlass. Manchmal reicht eine gute Frage.',
    choose: 'Wählt einen Gesprächsschwerpunkt', next: 'Nächste Karte', tipTitle: 'So nutzt ihr die Karten', tip: 'Antwortet abwechselnd. Hört ohne Unterbrechung zu, stellt eine Nachfrage und verwendet eine Antwort später nicht als Waffe.',
    categories: {
      connection: ['Verbindung', ['Welche kleine Sache, die ich kürzlich getan habe, hat dir gezeigt, dass ich mich um dich kümmere?', 'Wann fühlst du dich mir in letzter Zeit am nächsten?', 'Was könnten wir diese Woche tun, um uns verbundener zu fühlen?', 'Welche Erinnerung an uns bringt dich sofort zum Lächeln?', 'Welche Art von Zuneigung bedeutet dir gerade am meisten?']],
      appreciation: ['Wertschätzung', ['Was schätzt du an mir, sagst es aber nicht oft genug?', 'Für welchen Teil unserer Beziehung bist du heute besonders dankbar?', 'Welche Stärke siehst du in mir, die ich selbst vielleicht übersehe?', 'Welche alltägliche Sache, die ich tue, macht dein Leben leichter?', 'Was haben wir in letzter Zeit gemeinsam gut bewältigt?']],
      growth: ['Wachstum', ['Welche Gewohnheit würde unsere Beziehung stärken, wenn wir sie regelmäßig pflegen?', 'Wo sind wir deiner Meinung nach als Paar am meisten gewachsen?', 'In welchem Bereich wünschst du dir mehr Teamarbeit von uns?', 'Wie würde eine gesündere Version eines wiederkehrenden Konflikts aussehen?', 'Was Neues würdest du gern gemeinsam lernen oder erleben?']],
      fun: ['Spaß & Freundschaft', ['Welche alberne Sache sollten wir bald zusammen machen?', 'Wenn wir einen komplett freien Samstag hätten, wie würdest du ihn verbringen wollen?', 'Welche frühere gemeinsame Aktivität würdest du gern wieder aufnehmen?', 'Welche kleine Abenteueridee würde sich gerade spannend anfühlen?', 'Was bringt uns immer gemeinsam zum Lachen?']],
      future: ['Zukunft', ['Was möchtest du im nächsten Jahr am liebsten gemeinsam mit mir aufbauen?', 'Wie sieht für dich ein friedliches gemeinsames Leben aus?', 'Bei welchem gemeinsamen Ziel möchtest du Fortschritte machen?', 'Welche Tradition möchtest du mit mir schaffen?', 'Was sollten wir deiner Hoffnung nach nie aufhören zu tun, auch wenn sich unsere Beziehung verändert?']],
    },
  },
};

const CATEGORY_KEYS = ['connection', 'appreciation', 'growth', 'fun', 'future'];

export default function ConversationCards() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [category, setCategory] = useState('connection');
  const [cardIndex, setCardIndex] = useState(0);

  const categoryData = t.categories[category];
  const question = categoryData[1][cardIndex % categoryData[1].length];

  const nextCard = () => setCardIndex((current) => current + 1);
  const categoryButtons = useMemo(() => CATEGORY_KEYS.map((key) => ({ key, label: t.categories[key][0] })), [t]);

  const changeCategory = (key) => {
    setCategory(key);
    setCardIndex(0);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-indigo-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <MessageCircle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{t.subtitle}</p>
        </header>

        <section className="mt-9" aria-labelledby="conversation-focus-heading">
          <h2 id="conversation-focus-heading" className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500">{t.choose}</h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categoryButtons.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => changeCategory(key)}
                aria-pressed={category === key}
                className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 ${category === key ? 'bg-rose-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-rose-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-8 max-w-2xl rounded-3xl border border-rose-100 bg-white p-7 text-center shadow-lg md:p-10" aria-live="polite">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Heart className="h-5 w-5" aria-hidden="true" /></div>
          <p className="mt-6 text-xl font-semibold leading-8 text-slate-900 md:text-2xl">{question}</p>
          <Button type="button" onClick={nextCard} className="mt-7 bg-rose-600 hover:bg-rose-700">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {t.next}
          </Button>
        </section>

        <aside className="mx-auto mt-8 max-w-2xl rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 flex-none text-indigo-700" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-indigo-950">{t.tipTitle}</h2>
              <p className="mt-1 text-sm leading-6 text-indigo-900/80">{t.tip}</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
