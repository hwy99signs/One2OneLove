import React, { useMemo } from 'react';
import { CalendarDays, Heart, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Daily Relationship Question',
    subtitle: 'One thoughtful question a day can open a conversation that routine may have missed.',
    today: "Today's question",
    tipTitle: 'Conversation tip',
    tip: 'Take turns answering. Listen to understand first; respond after your partner finishes.',
    community: 'Continue in Community',
    dateIdeas: 'Explore Date Ideas',
    note: 'This reflection is for conversation and connection. It is not therapy, diagnosis, or professional advice.',
    questions: [
      'What is one small thing I did recently that made you feel cared for?',
      'What is something you wish we made more time for together?',
      'When do you feel most like we are a team?',
      'What is one memory of us that still makes you smile immediately?',
      'What kind of support feels most helpful to you when you are stressed?',
      'What is something about our relationship you never want us to take for granted?',
      'What is one thing we could do this week to feel more connected?',
      'What have you learned about me that has helped you love me better?',
      'What does a peaceful day together look like to you right now?',
      'What is one dream you would like us to work toward together?',
      'What helps you feel heard during a difficult conversation?',
      'What is one thing you appreciate about who we are becoming together?',
    ],
  },
  es: {
    title: 'Pregunta Diaria para la Relación',
    subtitle: 'Una pregunta reflexiva al día puede abrir una conversación que la rutina haya dejado pasar.',
    today: 'Pregunta de hoy',
    tipTitle: 'Consejo para conversar',
    tip: 'Túrnense para responder. Escucha primero para comprender; responde cuando tu pareja haya terminado.',
    community: 'Continuar en la Comunidad',
    dateIdeas: 'Explorar Ideas para Citas',
    note: 'Esta reflexión es para conversar y conectar. No sustituye terapia, diagnóstico ni asesoramiento profesional.',
    questions: [
      '¿Qué pequeña cosa hice recientemente que te hizo sentir cuidado/a?',
      '¿Para qué te gustaría que dedicáramos más tiempo juntos?',
      '¿Cuándo sientes más que somos un equipo?',
      '¿Qué recuerdo nuestro todavía te hace sonreír de inmediato?',
      '¿Qué tipo de apoyo te ayuda más cuando estás estresado/a?',
      '¿Qué aspecto de nuestra relación nunca quisieras que diéramos por sentado?',
      '¿Qué podríamos hacer esta semana para sentirnos más conectados?',
      '¿Qué has aprendido sobre mí que te ha ayudado a amarme mejor?',
      '¿Cómo sería para ti un día tranquilo juntos en este momento?',
      '¿Qué sueño te gustaría que trabajáramos para alcanzar juntos?',
      '¿Qué te ayuda a sentirte escuchado/a durante una conversación difícil?',
      '¿Qué aprecias de la persona en que nos estamos convirtiendo juntos?',
    ],
  },
  fr: {
    title: 'Question Relationnelle du Jour',
    subtitle: 'Une question réfléchie par jour peut ouvrir une conversation que la routine avait laissée de côté.',
    today: "Question d'aujourd'hui",
    tipTitle: 'Conseil de conversation',
    tip: "Répondez chacun votre tour. Écoutez d'abord pour comprendre, puis répondez quand votre partenaire a terminé.",
    community: 'Continuer dans la Communauté',
    dateIdeas: 'Explorer les Idées de Rendez-vous',
    note: "Cette réflexion favorise la conversation et la connexion. Elle ne remplace pas une thérapie, un diagnostic ou un conseil professionnel.",
    questions: [
      "Quelle petite chose ai-je faite récemment qui t'a fait te sentir aimé(e) ou soutenu(e) ?",
      "À quoi aimerais-tu que nous consacrions davantage de temps ensemble ?",
      "À quel moment as-tu le plus le sentiment que nous formons une équipe ?",
      "Quel souvenir de nous te fait encore sourire immédiatement ?",
      "Quel type de soutien t'aide le plus quand tu es stressé(e) ?",
      "Qu'est-ce que tu ne voudrais jamais que nous considérions comme acquis dans notre relation ?",
      "Que pourrions-nous faire cette semaine pour nous sentir plus proches ?",
      "Qu'as-tu appris sur moi qui t'a aidé à mieux m'aimer ?",
      "À quoi ressemble pour toi une journée paisible ensemble en ce moment ?",
      "Quel rêve aimerais-tu que nous poursuivions ensemble ?",
      "Qu'est-ce qui t'aide à te sentir écouté(e) pendant une conversation difficile ?",
      "Qu'apprécies-tu dans ce que nous devenons ensemble ?",
    ],
  },
  it: {
    title: 'Domanda Quotidiana sulla Relazione',
    subtitle: 'Una domanda significativa al giorno può aprire una conversazione che la routine ha lasciato indietro.',
    today: 'Domanda di oggi',
    tipTitle: 'Suggerimento per la conversazione',
    tip: 'Rispondete a turno. Ascolta prima per capire; rispondi quando il partner ha finito.',
    community: 'Continua nella Comunità',
    dateIdeas: 'Esplora Idee per Appuntamenti',
    note: 'Questa riflessione serve a favorire conversazione e connessione. Non sostituisce terapia, diagnosi o consulenza professionale.',
    questions: [
      'Qual è una piccola cosa che ho fatto di recente che ti ha fatto sentire amato/a?',
      'A cosa vorresti che dedicassimo più tempo insieme?',
      'Quando senti maggiormente che siamo una squadra?',
      'Quale ricordo di noi ti fa ancora sorridere immediatamente?',
      'Quale tipo di sostegno ti aiuta di più quando sei sotto stress?',
      'Qual è una cosa della nostra relazione che non vorresti mai dessimo per scontata?',
      'Cosa potremmo fare questa settimana per sentirci più connessi?',
      'Cosa hai imparato su di me che ti ha aiutato ad amarmi meglio?',
      'Come immagini una giornata tranquilla insieme in questo momento?',
      'Quale sogno vorresti che cercassimo di realizzare insieme?',
      'Cosa ti aiuta a sentirti ascoltato/a durante una conversazione difficile?',
      'Che cosa apprezzi di ciò che stiamo diventando insieme?',
    ],
  },
  de: {
    title: 'Tägliche Beziehungsfrage',
    subtitle: 'Eine nachdenkliche Frage pro Tag kann ein Gespräch öffnen, das im Alltag zu kurz gekommen ist.',
    today: 'Heutige Frage',
    tipTitle: 'Gesprächstipp',
    tip: 'Antwortet abwechselnd. Höre zuerst zu, um zu verstehen; antworte, nachdem dein Partner fertig ist.',
    community: 'In der Community weitermachen',
    dateIdeas: 'Date-Ideen entdecken',
    note: 'Diese Reflexion dient Gespräch und Verbindung. Sie ersetzt keine Therapie, Diagnose oder professionelle Beratung.',
    questions: [
      'Welche kleine Sache habe ich kürzlich getan, durch die du dich umsorgt gefühlt hast?',
      'Wofür wünschst du dir, dass wir uns gemeinsam mehr Zeit nehmen?',
      'Wann fühlst du am stärksten, dass wir ein Team sind?',
      'Welche Erinnerung an uns bringt dich sofort zum Lächeln?',
      'Welche Art von Unterstützung hilft dir am meisten, wenn du gestresst bist?',
      'Was an unserer Beziehung sollten wir deiner Meinung nach niemals als selbstverständlich ansehen?',
      'Was könnten wir diese Woche tun, um uns stärker verbunden zu fühlen?',
      'Was hast du über mich gelernt, das dir geholfen hat, mich besser zu lieben?',
      'Wie sieht für dich gerade ein friedlicher Tag zusammen aus?',
      'Auf welchen Traum würdest du gerne gemeinsam mit mir hinarbeiten?',
      'Was hilft dir, dich in einem schwierigen Gespräch gehört zu fühlen?',
      'Was schätzt du daran, wer wir gemeinsam werden?',
    ],
  },
};

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

export default function DailyQuestion() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const question = useMemo(() => {
    const index = getDayOfYear(new Date()) % t.questions.length;
    return t.questions[index];
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-cyan-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100">
            <Heart className="h-7 w-7 text-pink-600" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{t.subtitle}</p>
        </div>

        <Card className="mt-8 overflow-hidden rounded-3xl border-pink-100 shadow-sm">
          <CardContent className="p-6 md:p-10">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-pink-700">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {t.today}
            </div>
            <p className="mt-5 text-2xl font-semibold leading-relaxed text-slate-900 md:text-3xl">{question}</p>

            <div className="mt-8 rounded-2xl bg-cyan-50 p-5 text-cyan-950">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {t.tipTitle}
              </div>
              <p className="mt-2 leading-7">{t.tip}</p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="sm:flex-1">
                <Link to="/Community"><MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />{t.community}</Link>
              </Button>
              <Button asChild variant="outline" className="sm:flex-1">
                <Link to="/DateIdeas"><Heart className="mr-2 h-4 w-4" aria-hidden="true" />{t.dateIdeas}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-slate-500">{t.note}</p>
      </div>
    </div>
  );
}
