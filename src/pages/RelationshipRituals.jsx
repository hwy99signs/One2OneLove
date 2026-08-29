import React, { useState } from 'react';
import { HeartHandshake, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';

const translations = {
  en: {
    title: 'Relationship Rituals',
    subtitle: 'Small repeatable habits that help connection survive busy schedules.',
    intro: 'Choose one ritual and practice it consistently before adding another. The goal is not perfection; it is creating dependable moments of attention.',
    privacy: 'This tool does not save or transmit your selections.',
    choose: 'Choose a ritual',
    reset: 'Choose another ritual',
    rituals: [
      ['Two-Minute Morning', 'Daily', 'Before the day gets busy, give each other two uninterrupted minutes.', ['Make eye contact.', 'Ask: “What matters most for you today?”', 'End with one encouraging sentence.']],
      ['Reunion Reset', 'Daily', 'Use the first few minutes after work or time apart to reconnect before logistics take over.', ['Pause phones and chores briefly.', 'Greet each other intentionally.', 'Ask one question about the other person’s day before discussing tasks.']],
      ['Specific Appreciation', '3× Weekly', 'Name one concrete thing you noticed and appreciated instead of relying on a general “thank you.”', ['Name what your partner did.', 'Say why it mattered to you.', 'Keep it specific and sincere.']],
      ['Weekly Team Huddle', 'Weekly', 'Spend 15 minutes looking at the coming week as teammates.', ['Review important schedules and responsibilities.', 'Name one place either person may need support.', 'Protect one small block of connection time.']],
      ['Monthly Us Conversation', 'Monthly', 'Create a longer conversation about how the relationship is feeling—not just what needs to get done.', ['Name one thing that felt good this month.', 'Name one area that deserves more attention.', 'Choose one shared intention for the next month.']],
    ],
    note: 'These rituals are educational relationship practices, not counseling or crisis support.',
  },
  es: {
    title: 'Rituales de Relación',
    subtitle: 'Pequeños hábitos repetibles que ayudan a mantener la conexión durante semanas ocupadas.',
    intro: 'Elijan un ritual y practíquenlo con constancia antes de agregar otro. La meta no es la perfección, sino crear momentos confiables de atención.',
    privacy: 'Esta herramienta no guarda ni transmite tus selecciones.',
    choose: 'Elige un ritual',
    reset: 'Elegir otro ritual',
    rituals: [
      ['Dos Minutos por la Mañana', 'Diario', 'Antes de que el día se llene de actividades, dense dos minutos sin interrupciones.', ['Mírense a los ojos.', 'Pregunten: “¿Qué es lo más importante para ti hoy?”', 'Terminen con una frase de ánimo.']],
      ['Reencuentro Intencional', 'Diario', 'Usen los primeros minutos después del trabajo o de estar separados para reconectarse antes de hablar de tareas.', ['Pausen teléfonos y quehaceres brevemente.', 'Salúdense con intención.', 'Hagan una pregunta sobre el día del otro antes de hablar de pendientes.']],
      ['Aprecio Específico', '3× por Semana', 'Nombren algo concreto que notaron y apreciaron en vez de depender de un “gracias” general.', ['Nombra lo que hizo tu pareja.', 'Explica por qué fue importante para ti.', 'Sé específico y sincero.']],
      ['Reunión Semanal de Equipo', 'Semanal', 'Dediquen 15 minutos a mirar la próxima semana como compañeros de equipo.', ['Revisen horarios y responsabilidades importantes.', 'Nombren un lugar donde alguno pueda necesitar apoyo.', 'Protejan un pequeño espacio para conectar.']],
      ['Conversación Mensual de Nosotros', 'Mensual', 'Tengan una conversación más larga sobre cómo se siente la relación, no solo sobre lo que hay que hacer.', ['Nombren algo que se sintió bien este mes.', 'Nombren un área que merece más atención.', 'Elijan una intención compartida para el próximo mes.']],
    ],
    note: 'Estos rituales son prácticas educativas para relaciones, no terapia ni apoyo para crisis.',
  },
  fr: {
    title: 'Rituels de Relation',
    subtitle: 'De petites habitudes répétées qui aident la connexion à résister aux semaines chargées.',
    intro: 'Choisissez un rituel et pratiquez-le régulièrement avant d’en ajouter un autre. Le but n’est pas la perfection, mais des moments fiables d’attention.',
    privacy: 'Cet outil n’enregistre ni ne transmet vos sélections.',
    choose: 'Choisir un rituel',
    reset: 'Choisir un autre rituel',
    rituals: [
      ['Deux Minutes le Matin', 'Quotidien', 'Avant que la journée ne s’accélère, accordez-vous deux minutes sans interruption.', ['Regardez-vous dans les yeux.', 'Demandez : « Qu’est-ce qui compte le plus pour toi aujourd’hui ? »', 'Terminez par une phrase encourageante.']],
      ['Retrouvailles Intentionnelles', 'Quotidien', 'Utilisez les premières minutes après le travail ou une séparation pour vous reconnecter avant la logistique.', ['Mettez brièvement téléphones et tâches en pause.', 'Saluez-vous avec intention.', 'Posez une question sur la journée de l’autre avant de parler des tâches.']],
      ['Appréciation Précise', '3× par Semaine', 'Nommez une chose concrète que vous avez remarquée et appréciée plutôt qu’un simple « merci » général.', ['Nommez ce que votre partenaire a fait.', 'Dites pourquoi cela a compté pour vous.', 'Restez précis et sincère.']],
      ['Réunion d’Équipe Hebdomadaire', 'Hebdomadaire', 'Passez 15 minutes à regarder la semaine à venir comme une équipe.', ['Passez en revue les horaires et responsabilités importants.', 'Nommez un endroit où l’un de vous pourrait avoir besoin de soutien.', 'Protégez un petit moment de connexion.']],
      ['Conversation Mensuelle sur Nous', 'Mensuel', 'Prenez un temps plus long pour parler de ce que vous ressentez dans la relation, pas seulement de ce qu’il faut faire.', ['Nommez une chose agréable ce mois-ci.', 'Nommez un domaine qui mérite plus d’attention.', 'Choisissez une intention commune pour le mois suivant.']],
    ],
    note: 'Ces rituels sont des pratiques éducatives relationnelles, pas une thérapie ni un soutien de crise.',
  },
  it: {
    title: 'Rituali di Coppia',
    subtitle: 'Piccole abitudini ripetibili che aiutano la connessione a resistere alle settimane impegnative.',
    intro: 'Scegliete un rituale e praticatelo con costanza prima di aggiungerne un altro. L’obiettivo non è la perfezione, ma momenti affidabili di attenzione.',
    privacy: 'Questo strumento non salva né trasmette le vostre selezioni.',
    choose: 'Scegli un rituale',
    reset: 'Scegli un altro rituale',
    rituals: [
      ['Due Minuti al Mattino', 'Quotidiano', 'Prima che la giornata diventi frenetica, dedicatevi due minuti senza interruzioni.', ['Guardatevi negli occhi.', 'Chiedete: “Che cosa conta di più per te oggi?”', 'Concludete con una frase di incoraggiamento.']],
      ['Rientro Intenzionale', 'Quotidiano', 'Usate i primi minuti dopo il lavoro o un periodo separati per riconnettervi prima della logistica.', ['Mettete in pausa telefoni e faccende per qualche minuto.', 'Salutatevi con intenzione.', 'Fate una domanda sulla giornata dell’altro prima di parlare delle cose da fare.']],
      ['Apprezzamento Specifico', '3× a Settimana', 'Nominate qualcosa di concreto che avete notato e apprezzato invece di affidarvi a un semplice “grazie”.', ['Nomina ciò che ha fatto il partner.', 'Spiega perché è stato importante per te.', 'Sii specifico e sincero.']],
      ['Riunione Settimanale di Squadra', 'Settimanale', 'Dedicate 15 minuti a guardare la settimana che arriva come una squadra.', ['Rivedete impegni e responsabilità importanti.', 'Nominate un punto in cui uno dei due potrebbe aver bisogno di supporto.', 'Proteggete un piccolo momento di connessione.']],
      ['Conversazione Mensile su Noi', 'Mensile', 'Create una conversazione più lunga su come si sente la relazione, non solo su ciò che bisogna fare.', ['Nominate una cosa che ha fatto stare bene questo mese.', 'Nominate un’area che merita più attenzione.', 'Scegliete un’intenzione condivisa per il mese successivo.']],
    ],
    note: 'Questi rituali sono pratiche educative per la relazione, non terapia né supporto per le crisi.',
  },
  de: {
    title: 'Beziehungsrituale',
    subtitle: 'Kleine wiederholbare Gewohnheiten, die Verbindung auch in vollen Wochen erhalten.',
    intro: 'Wählt ein Ritual und übt es regelmäßig, bevor ihr ein weiteres hinzufügt. Es geht nicht um Perfektion, sondern um verlässliche Momente der Aufmerksamkeit.',
    privacy: 'Dieses Werkzeug speichert oder überträgt eure Auswahl nicht.',
    choose: 'Ritual auswählen',
    reset: 'Anderes Ritual auswählen',
    rituals: [
      ['Zwei Minuten am Morgen', 'Täglich', 'Bevor der Tag voll wird, schenkt euch zwei ungestörte Minuten.', ['Schaut euch in die Augen.', 'Fragt: „Was ist dir heute am wichtigsten?“', 'Beendet den Moment mit einem ermutigenden Satz.']],
      ['Bewusstes Wiedersehen', 'Täglich', 'Nutzt die ersten Minuten nach Arbeit oder Zeit getrennt, um euch zu verbinden, bevor Organisatorisches übernimmt.', ['Legt Handys und Aufgaben kurz beiseite.', 'Begrüßt euch bewusst.', 'Fragt zuerst nach dem Tag des anderen, bevor ihr Aufgaben besprecht.']],
      ['Konkrete Wertschätzung', '3× Wöchentlich', 'Nennt etwas Konkretes, das euch aufgefallen ist und das ihr geschätzt habt, statt nur allgemein „Danke“ zu sagen.', ['Nennt, was euer Partner getan hat.', 'Sagt, warum es euch wichtig war.', 'Bleibt konkret und aufrichtig.']],
      ['Wöchentliches Team-Gespräch', 'Wöchentlich', 'Nehmt euch 15 Minuten, um als Team auf die kommende Woche zu schauen.', ['Besprecht wichtige Termine und Verantwortlichkeiten.', 'Nennt einen Bereich, in dem einer von euch Unterstützung brauchen könnte.', 'Schützt einen kleinen Zeitraum für Verbindung.']],
      ['Monatliches Wir-Gespräch', 'Monatlich', 'Führt ein längeres Gespräch darüber, wie sich eure Beziehung anfühlt – nicht nur darüber, was erledigt werden muss.', ['Nennt eine Sache, die sich diesen Monat gut angefühlt hat.', 'Nennt einen Bereich, der mehr Aufmerksamkeit verdient.', 'Wählt eine gemeinsame Absicht für den nächsten Monat.']],
    ],
    note: 'Diese Rituale sind pädagogische Beziehungsübungen und ersetzen keine Beratung oder Krisenhilfe.',
  },
};

export default function RelationshipRituals() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [selected, setSelected] = useState(null);

  if (selected !== null) {
    const [name, cadence, description, steps] = t.rituals[selected];
    return (
      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-100 bg-white p-7 shadow-lg md:p-10">
          <div className="flex items-center gap-3">
            <HeartHandshake className="h-8 w-8 text-rose-700" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700">{cadence}</p>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{name}</h1>
            </div>
          </div>
          <p className="mt-5 leading-7 text-slate-600">{description}</p>
          <ol className="mt-6 space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-slate-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white font-bold text-rose-700">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Button type="button" variant="outline" onClick={() => setSelected(null)} className="mt-7 w-full">
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />{t.reset}
          </Button>
          <p className="mt-5 text-center text-xs leading-5 text-slate-500">{t.note}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <Sparkles className="mx-auto h-12 w-12 text-rose-700" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <p className="mt-3 text-sm leading-6 text-slate-500">{t.intro}</p>
          <p className="mt-3 text-xs font-medium text-rose-800">{t.privacy}</p>
        </header>

        <section className="mt-9" aria-labelledby="ritual-list-title">
          <h2 id="ritual-list-title" className="sr-only">{t.choose}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {t.rituals.map(([name, cadence, description], index) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelected(index)}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">{cadence}</span>
                <span className="mt-2 block text-lg font-bold text-slate-900">{name}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">{description}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
