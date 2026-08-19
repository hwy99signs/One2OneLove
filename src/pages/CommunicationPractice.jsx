import React, { useState } from "react";
import { Heart, MessageCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Communication Practice",
    subtitle: "Practice a healthier way to start difficult conversations without recording what you choose or say.",
    privacy: "Nothing you say or select in this practice is saved or transmitted by this tool.",
    limit: "This is an educational relationship exercise, not therapy, diagnosis, crisis care, or professional counseling.",
    choose: "Choose a practice",
    reset: "Start Over",
    step: "Practice step",
    prompts: [
      ["Start with an “I” statement", "Instead of accusing your partner, name your own feeling and the specific situation.", "Try: “I felt disappointed when our plan changed because I was looking forward to time together.”"],
      ["Make a clear request", "Turn a complaint into one specific request your partner can understand and respond to.", "Try: “Could we choose another evening this week and protect that time for us?”"],
      ["Reflect before responding", "Show that you heard the meaning before defending your position.", "Try: “What I hear you saying is that you felt alone in handling this. Did I understand you?”"],
      ["Repair after tension", "Use a small repair statement to lower defensiveness and return to the issue with care.", "Try: “I don’t want us fighting each other. Can we restart and talk about the problem as a team?”"],
    ],
  },
  es: {
    title: "Práctica de Comunicación",
    subtitle: "Practiquen una forma más saludable de iniciar conversaciones difíciles sin registrar lo que eligen o dicen.",
    privacy: "Nada de lo que digan o seleccionen en esta práctica se guarda ni se transmite mediante esta herramienta.",
    limit: "Este es un ejercicio educativo de relación, no terapia, diagnóstico, atención de crisis ni asesoramiento profesional.",
    choose: "Elige una práctica", reset: "Empezar de Nuevo", step: "Paso de práctica",
    prompts: [
      ["Empieza con una frase en primera persona", "En lugar de acusar, nombra tu propio sentimiento y la situación específica.", "Prueba: “Me sentí decepcionado cuando cambió nuestro plan porque esperaba pasar tiempo juntos.”"],
      ["Haz una petición clara", "Convierte una queja en una petición concreta que tu pareja pueda entender y responder.", "Prueba: “¿Podemos elegir otra noche esta semana y reservar ese tiempo para nosotros?”"],
      ["Refleja antes de responder", "Demuestra que escuchaste el significado antes de defender tu posición.", "Prueba: “Lo que escucho es que te sentiste solo al manejar esto. ¿Lo entendí bien?”"],
      ["Repara después de la tensión", "Usa una pequeña frase de reparación para bajar la defensividad y volver al tema con cuidado.", "Prueba: “No quiero que peleemos entre nosotros. ¿Podemos empezar de nuevo y abordar el problema como equipo?”"],
    ],
  },
  fr: {
    title: "Pratique de Communication",
    subtitle: "Entraînez-vous à commencer les conversations difficiles de façon plus saine, sans enregistrer ce que vous choisissez ou dites.",
    privacy: "Rien de ce que vous dites ou sélectionnez dans cet exercice n’est enregistré ni transmis par cet outil.",
    limit: "Il s’agit d’un exercice éducatif sur la relation, et non d’une thérapie, d’un diagnostic, d’un service de crise ou d’un conseil professionnel.",
    choose: "Choisissez un exercice", reset: "Recommencer", step: "Étape de pratique",
    prompts: [
      ["Commencez par une phrase en « je »", "Au lieu d’accuser votre partenaire, nommez votre propre émotion et la situation précise.", "Essayez : « Je me suis senti déçu quand notre projet a changé, car j’attendais ce moment ensemble. »"],
      ["Formulez une demande claire", "Transformez une plainte en une demande précise à laquelle votre partenaire peut répondre.", "Essayez : « Pourrions-nous choisir une autre soirée cette semaine et garder ce temps pour nous ? »"],
      ["Reformulez avant de répondre", "Montrez que vous avez compris le sens avant de défendre votre position.", "Essayez : « J’entends que tu t’es senti seul pour gérer cela. Est-ce que j’ai bien compris ? »"],
      ["Réparez après la tension", "Utilisez une petite phrase de réparation pour réduire la défensive et revenir au problème avec attention.", "Essayez : « Je ne veux pas que nous nous battions l’un contre l’autre. Peut-on recommencer et traiter le problème en équipe ? »"],
    ],
  },
  it: {
    title: "Pratica di Comunicazione",
    subtitle: "Esercitate un modo più sano di iniziare conversazioni difficili senza registrare ciò che scegliete o dite.",
    privacy: "Nulla di ciò che dite o selezionate in questa pratica viene salvato o trasmesso da questo strumento.",
    limit: "Questo è un esercizio educativo sulla relazione, non terapia, diagnosi, assistenza di crisi o consulenza professionale.",
    choose: "Scegli una pratica", reset: "Ricomincia", step: "Passo di pratica",
    prompts: [
      ["Inizia con una frase in prima persona", "Invece di accusare il partner, descrivi il tuo sentimento e la situazione specifica.", "Prova: “Mi sono sentito deluso quando il nostro piano è cambiato perché aspettavo quel tempo insieme.”"],
      ["Fai una richiesta chiara", "Trasforma una lamentela in una richiesta concreta che il partner possa capire e a cui possa rispondere.", "Prova: “Possiamo scegliere un’altra sera questa settimana e riservare quel tempo a noi?”"],
      ["Rifletti prima di rispondere", "Mostra di aver ascoltato il significato prima di difendere la tua posizione.", "Prova: “Quello che sento è che ti sei sentito solo nel gestire questa cosa. Ho capito bene?”"],
      ["Ripara dopo la tensione", "Usa una breve frase di riparazione per ridurre la difensiva e tornare al problema con cura.", "Prova: “Non voglio che combattiamo tra noi. Possiamo ricominciare e affrontare il problema come una squadra?”"],
    ],
  },
  de: {
    title: "Kommunikationsübung",
    subtitle: "Übt einen gesünderen Einstieg in schwierige Gespräche, ohne dass eure Auswahl oder Aussagen gespeichert werden.",
    privacy: "Nichts, was ihr in dieser Übung sagt oder auswählt, wird von diesem Werkzeug gespeichert oder übertragen.",
    limit: "Dies ist eine pädagogische Beziehungsübung, keine Therapie, Diagnose, Krisenhilfe oder professionelle Beratung.",
    choose: "Übung auswählen", reset: "Neu Beginnen", step: "Übungsschritt",
    prompts: [
      ["Beginnt mit einer Ich-Aussage", "Statt den Partner anzuklagen, benennt das eigene Gefühl und die konkrete Situation.", "Versucht: „Ich war enttäuscht, als sich unser Plan änderte, weil ich mich auf die gemeinsame Zeit gefreut hatte.“"],
      ["Formuliert eine klare Bitte", "Macht aus einer Beschwerde eine konkrete Bitte, die der Partner verstehen und beantworten kann.", "Versucht: „Können wir diese Woche einen anderen Abend auswählen und diese Zeit für uns schützen?“"],
      ["Spiegelt vor der Antwort", "Zeigt zuerst, dass ihr die Bedeutung verstanden habt, bevor ihr eure Position verteidigt.", "Versucht: „Ich höre, dass du dich mit dieser Aufgabe allein gefühlt hast. Habe ich dich richtig verstanden?“"],
      ["Repariert nach Spannung", "Nutzt eine kurze Reparaturaussage, um Abwehr zu senken und fürsorglich zum Thema zurückzukehren.", "Versucht: „Ich möchte nicht, dass wir gegeneinander kämpfen. Können wir neu anfangen und das Problem als Team besprechen?“"],
    ],
  },
};

export default function CommunicationPractice() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [selected, setSelected] = useState(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-rose-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <MessageCircle className="mx-auto h-14 w-14 text-cyan-700" aria-hidden="true" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <div className="mt-5 rounded-2xl border border-cyan-100 bg-white p-4 text-left text-sm leading-6 text-slate-700"><p className="flex gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" aria-hidden="true" />{t.privacy}</p><p className="mt-2 flex gap-2"><Heart className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />{t.limit}</p></div>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{selected === null ? t.choose : t.step}</h2>
          {selected === null ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {t.prompts.map(([title, description], index) => <button key={title} type="button" onClick={() => setSelected(index)} className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></button>)}
            </div>
          ) : (
            <Card className="mt-4 border-cyan-100">
              <CardHeader><CardTitle>{t.prompts[selected][0]}</CardTitle></CardHeader>
              <CardContent><p className="leading-7 text-slate-700">{t.prompts[selected][1]}</p><div className="mt-5 rounded-2xl bg-cyan-50 p-5 text-cyan-950">{t.prompts[selected][2]}</div><Button type="button" variant="outline" onClick={() => setSelected(null)} className="mt-6"><RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />{t.reset}</Button></CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
