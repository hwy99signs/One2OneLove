import React, { useState } from 'react';
import { CheckCircle2, HeartHandshake, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Weekly Relationship Check-In',
    subtitle: 'A short weekly conversation to notice what is working, name what needs attention, and choose one thing to strengthen together.',
    privacy: 'Your answers stay on this screen and are not saved by this tool.',
    rating: 'How connected did we feel this week?',
    low: 'Distant', high: 'Very connected',
    prompts: [
      ['Appreciation', 'What did you appreciate most about your partner this week?'],
      ['Connection', 'When did you feel most connected to each other?'],
      ['Needs', 'Was there a moment when you needed something and did not know how to ask for it?'],
      ['Repair', 'Is there anything small we should clear up instead of carrying into next week?'],
      ['Next Week', 'What is one specific thing we can do next week to make our relationship feel cared for?'],
    ],
    finish: 'Complete Check-In', doneTitle: 'Check-In Complete', done: 'You made space for the relationship. The goal is not perfect answers—it is staying willing to notice, listen, and respond to each other.', reset: 'Start Again',
  },
  es: {
    title: 'Revisión Semanal de la Relación',
    subtitle: 'Una breve conversación semanal para reconocer lo que funciona, nombrar lo que necesita atención y elegir algo que fortalecer juntos.',
    privacy: 'Tus respuestas permanecen en esta pantalla y esta herramienta no las guarda.',
    rating: '¿Qué tan conectados nos sentimos esta semana?', low: 'Distantes', high: 'Muy conectados',
    prompts: [
      ['Aprecio', '¿Qué apreciaste más de tu pareja esta semana?'],
      ['Conexión', '¿Cuándo se sintieron más conectados entre sí?'],
      ['Necesidades', '¿Hubo un momento en que necesitabas algo y no sabías cómo pedirlo?'],
      ['Reparación', '¿Hay algo pequeño que debamos aclarar en vez de llevarlo a la próxima semana?'],
      ['Próxima Semana', '¿Qué cosa específica podemos hacer la próxima semana para cuidar mejor nuestra relación?'],
    ],
    finish: 'Completar Revisión', doneTitle: 'Revisión Completada', done: 'Crearon un espacio para la relación. El objetivo no son respuestas perfectas, sino seguir dispuestos a observar, escuchar y responderse mutuamente.', reset: 'Comenzar de Nuevo',
  },
  fr: {
    title: 'Bilan Relationnel Hebdomadaire',
    subtitle: 'Une courte conversation chaque semaine pour voir ce qui fonctionne, nommer ce qui demande de l’attention et choisir une chose à renforcer ensemble.',
    privacy: 'Vos réponses restent sur cet écran et ne sont pas enregistrées par cet outil.',
    rating: 'À quel point nous sommes-nous sentis connectés cette semaine ?', low: 'Éloignés', high: 'Très connectés',
    prompts: [
      ['Appréciation', 'Qu’as-tu le plus apprécié chez ton partenaire cette semaine ?'],
      ['Connexion', 'À quel moment vous êtes-vous sentis le plus proches ?'],
      ['Besoins', 'Y a-t-il eu un moment où tu avais besoin de quelque chose sans savoir comment le demander ?'],
      ['Réparation', 'Y a-t-il une petite chose à clarifier plutôt que de l’emporter dans la semaine prochaine ?'],
      ['Semaine Prochaine', 'Quelle action précise pouvons-nous faire la semaine prochaine pour prendre soin de notre relation ?'],
    ],
    finish: 'Terminer le Bilan', doneTitle: 'Bilan Terminé', done: 'Vous avez créé un espace pour votre relation. Le but n’est pas d’avoir des réponses parfaites, mais de rester disposés à remarquer, écouter et répondre l’un à l’autre.', reset: 'Recommencer',
  },
  it: {
    title: 'Check-In Settimanale di Coppia',
    subtitle: 'Una breve conversazione settimanale per riconoscere ciò che funziona, dare un nome a ciò che richiede attenzione e scegliere una cosa da rafforzare insieme.',
    privacy: 'Le vostre risposte restano su questa schermata e non vengono salvate da questo strumento.',
    rating: 'Quanto ci siamo sentiti connessi questa settimana?', low: 'Distanti', high: 'Molto connessi',
    prompts: [
      ['Apprezzamento', 'Cosa hai apprezzato di più del tuo partner questa settimana?'],
      ['Connessione', 'Quando vi siete sentiti più vicini tra voi?'],
      ['Bisogni', 'C’è stato un momento in cui avevi bisogno di qualcosa ma non sapevi come chiederlo?'],
      ['Riparazione', 'C’è qualcosa di piccolo da chiarire invece di portarlo nella prossima settimana?'],
      ['Prossima Settimana', 'Quale cosa concreta possiamo fare la prossima settimana per prenderci cura della relazione?'],
    ],
    finish: 'Completa Check-In', doneTitle: 'Check-In Completato', done: 'Avete creato spazio per la relazione. L’obiettivo non sono risposte perfette, ma continuare a notare, ascoltare e rispondere l’uno all’altra.', reset: 'Ricomincia',
  },
  de: {
    title: 'Wöchentlicher Beziehungs-Check-In',
    subtitle: 'Ein kurzes wöchentliches Gespräch, um wahrzunehmen, was gut läuft, was Aufmerksamkeit braucht und was ihr gemeinsam stärken möchtet.',
    privacy: 'Eure Antworten bleiben auf diesem Bildschirm und werden von diesem Werkzeug nicht gespeichert.',
    rating: 'Wie verbunden haben wir uns diese Woche gefühlt?', low: 'Distanziert', high: 'Sehr verbunden',
    prompts: [
      ['Wertschätzung', 'Was hast du diese Woche an deinem Partner besonders geschätzt?'],
      ['Verbindung', 'Wann habt ihr euch einander am nächsten gefühlt?'],
      ['Bedürfnisse', 'Gab es einen Moment, in dem du etwas gebraucht hast, aber nicht wusstest, wie du darum bitten kannst?'],
      ['Klärung', 'Gibt es etwas Kleines, das wir klären sollten, statt es in die nächste Woche mitzunehmen?'],
      ['Nächste Woche', 'Was können wir nächste Woche konkret tun, damit sich unsere Beziehung gut umsorgt anfühlt?'],
    ],
    finish: 'Check-In Abschließen', doneTitle: 'Check-In Abgeschlossen', done: 'Ihr habt bewusst Raum für eure Beziehung geschaffen. Es geht nicht um perfekte Antworten, sondern darum, weiter wahrzunehmen, zuzuhören und aufeinander zu reagieren.', reset: 'Neu Starten',
  },
};

export default function WeeklyCheckIn() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [connection, setConnection] = useState(3);
  const [answers, setAnswers] = useState(() => Array(5).fill(''));
  const [complete, setComplete] = useState(false);

  const updateAnswer = (index, value) => {
    setAnswers((current) => current.map((answer, i) => (i === index ? value : answer)));
  };

  const reset = () => {
    setConnection(3);
    setAnswers(Array(5).fill(''));
    setComplete(false);
  };

  if (complete) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50 px-4 py-12">
        <div className="mx-auto max-w-xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-lg md:p-10">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden="true" />
          <h1 className="mt-5 text-3xl font-bold text-slate-900">{t.doneTitle}</h1>
          <p className="mt-4 leading-7 text-slate-600">{t.done}</p>
          <Button type="button" variant="outline" onClick={reset} className="mt-7"><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />{t.reset}</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <HeartHandshake className="mx-auto h-12 w-12 text-emerald-700" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{t.subtitle}</p>
          <p className="mt-3 text-xs font-medium text-emerald-800">{t.privacy}</p>
        </header>

        <section className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm" aria-labelledby="connection-rating">
          <h2 id="connection-rating" className="font-semibold text-slate-900">{t.rating}</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-slate-500">{t.low}</span>
            <input type="range" min="1" max="5" value={connection} onChange={(event) => setConnection(Number(event.target.value))} className="w-full" aria-valuetext={`${connection} / 5`} />
            <span className="text-xs text-slate-500">{t.high}</span>
          </div>
          <p className="mt-2 text-center text-lg font-bold text-emerald-700">{connection} / 5</p>
        </section>

        <div className="mt-6 space-y-4">
          {t.prompts.map(([label, prompt], index) => (
            <label key={label} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-sm font-bold uppercase tracking-wide text-emerald-700">{label}</span>
              <span className="mt-2 block font-medium leading-6 text-slate-900">{prompt}</span>
              <textarea value={answers[index]} onChange={(event) => updateAnswer(index, event.target.value)} rows={3} className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" />
            </label>
          ))}
        </div>

        <Button type="button" onClick={() => setComplete(true)} className="mt-7 w-full bg-emerald-600 py-6 text-base font-semibold hover:bg-emerald-700">{t.finish}</Button>
      </div>
    </main>
  );
}
