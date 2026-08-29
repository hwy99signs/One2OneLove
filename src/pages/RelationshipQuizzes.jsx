import React from "react";
import { AlertCircle, Heart, MessageCircle, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Relationship Quizzes",
    subtitle: "Use lightweight self-reflection prompts to notice preferences and conversation patterns.",
    note: "These quizzes are educational reflection tools, not validated psychological assessments, diagnoses, or professional advice.",
    open: "Open Quiz", soon: "Coming Soon", available: "Available now",
    items: [
      ["Love Language Quiz", "Explore which kinds of affectionate gestures tend to feel most meaningful to you.", "heart", "/LoveLanguageQuiz", true],
      ["Communication Style Reflection", "Reflect on how you usually speak, listen, and respond when conversations become difficult.", "message", "", false],
      ["Conflict Response Reflection", "Notice patterns in how you approach disagreement and repair.", "alert", "", false],
      ["Attachment Reflection", "Explore how closeness, distance, reassurance, and independence can feel in relationships.", "users", "", false],
      ["Dating Readiness Reflection", "Think through your expectations, boundaries, and current readiness before dating.", "sparkles", "", false],
      ["Relationship Check Reflection", "Review communication, connection, respect, support, and shared effort without assigning a clinical score.", "heart", "", false],
    ],
  },
  es: {
    title: "Cuestionarios de Relaciones",
    subtitle: "Usa preguntas ligeras de autorreflexión para observar preferencias y patrones de conversación.",
    note: "Estos cuestionarios son herramientas educativas de reflexión, no evaluaciones psicológicas validadas, diagnósticos ni asesoramiento profesional.",
    open: "Abrir Cuestionario", soon: "Próximamente", available: "Disponible ahora",
    items: [
      ["Cuestionario de Lenguajes del Amor", "Explora qué tipos de gestos afectivos suelen sentirse más significativos para ti.", "heart", "/LoveLanguageQuiz", true],
      ["Reflexión sobre Comunicación", "Reflexiona sobre cómo sueles hablar, escuchar y responder cuando una conversación se vuelve difícil.", "message", "", false],
      ["Reflexión sobre Conflictos", "Observa patrones en cómo abordas los desacuerdos y la reparación.", "alert", "", false],
      ["Reflexión sobre Apego", "Explora cómo se sienten la cercanía, la distancia, la tranquilidad y la independencia en las relaciones.", "users", "", false],
      ["Reflexión sobre Preparación para Citas", "Piensa en tus expectativas, límites y preparación actual antes de salir con alguien.", "sparkles", "", false],
      ["Reflexión sobre la Relación", "Revisa comunicación, conexión, respeto, apoyo y esfuerzo compartido sin asignar una puntuación clínica.", "heart", "", false],
    ],
  },
  fr: {
    title: "Quiz Relationnels",
    subtitle: "Utilisez de légères questions d’autoréflexion pour observer vos préférences et habitudes de conversation.",
    note: "Ces quiz sont des outils éducatifs de réflexion, et non des évaluations psychologiques validées, des diagnostics ou des conseils professionnels.",
    open: "Ouvrir le Quiz", soon: "Bientôt Disponible", available: "Disponible maintenant",
    items: [
      ["Quiz des Langages de l’Amour", "Explorez les gestes affectueux qui ont tendance à être les plus significatifs pour vous.", "heart", "/LoveLanguageQuiz", true],
      ["Réflexion sur la Communication", "Réfléchissez à votre façon de parler, d’écouter et de répondre lorsque la conversation devient difficile.", "message", "", false],
      ["Réflexion sur les Conflits", "Observez vos habitudes face au désaccord et à la réparation.", "alert", "", false],
      ["Réflexion sur l’Attachement", "Explorez votre vécu de la proximité, de la distance, du réconfort et de l’indépendance.", "users", "", false],
      ["Réflexion sur la Préparation aux Rencontres", "Réfléchissez à vos attentes, limites et disponibilité actuelle avant de rencontrer quelqu’un.", "sparkles", "", false],
      ["Réflexion sur la Relation", "Passez en revue communication, connexion, respect, soutien et effort partagé sans attribuer de score clinique.", "heart", "", false],
    ],
  },
  it: {
    title: "Quiz sulle Relazioni",
    subtitle: "Usate semplici domande di autoriflessione per osservare preferenze e schemi di conversazione.",
    note: "Questi quiz sono strumenti educativi di riflessione, non valutazioni psicologiche validate, diagnosi o consulenza professionale.",
    open: "Apri Quiz", soon: "Prossimamente", available: "Disponibile ora",
    items: [
      ["Quiz dei Linguaggi dell’Amore", "Esplora quali gesti affettuosi tendono a essere più significativi per te.", "heart", "/LoveLanguageQuiz", true],
      ["Riflessione sullo Stile di Comunicazione", "Rifletti su come parli, ascolti e rispondi quando una conversazione diventa difficile.", "message", "", false],
      ["Riflessione sulla Gestione dei Conflitti", "Osserva gli schemi con cui affronti disaccordo e riparazione.", "alert", "", false],
      ["Riflessione sull’Attaccamento", "Esplora come vivi vicinanza, distanza, rassicurazione e indipendenza nelle relazioni.", "users", "", false],
      ["Riflessione sulla Preparazione agli Appuntamenti", "Considera aspettative, confini e disponibilità attuale prima di iniziare a frequentare qualcuno.", "sparkles", "", false],
      ["Riflessione sulla Relazione", "Rivedi comunicazione, connessione, rispetto, sostegno e impegno condiviso senza assegnare un punteggio clinico.", "heart", "", false],
    ],
  },
  de: {
    title: "Beziehungsquiz",
    subtitle: "Nutzt leichte Selbstreflexionsfragen, um Vorlieben und Gesprächsmuster wahrzunehmen.",
    note: "Diese Quiz sind pädagogische Reflexionswerkzeuge, keine validierten psychologischen Tests, Diagnosen oder professionelle Beratung.",
    open: "Quiz Öffnen", soon: "Demnächst", available: "Jetzt verfügbar",
    items: [
      ["Liebessprachen-Quiz", "Erkundet, welche liebevollen Gesten sich für euch besonders bedeutsam anfühlen.", "heart", "/LoveLanguageQuiz", true],
      ["Kommunikations-Reflexion", "Reflektiert, wie ihr sprecht, zuhört und reagiert, wenn Gespräche schwierig werden.", "message", "", false],
      ["Konflikt-Reflexion", "Beobachtet eure Muster bei Meinungsverschiedenheiten und Reparatur.", "alert", "", false],
      ["Bindungs-Reflexion", "Erkundet, wie Nähe, Distanz, Bestätigung und Unabhängigkeit sich in Beziehungen anfühlen.", "users", "", false],
      ["Dating-Bereitschafts-Reflexion", "Denkt über Erwartungen, Grenzen und eure aktuelle Bereitschaft vor dem Dating nach.", "sparkles", "", false],
      ["Beziehungs-Reflexion", "Betrachtet Kommunikation, Verbindung, Respekt, Unterstützung und gemeinsamen Einsatz ohne klinischen Score.", "heart", "", false],
    ],
  },
};

const icons = { heart: Heart, message: MessageCircle, alert: AlertCircle, users: Users, sparkles: Sparkles };

export default function RelationshipQuizzes() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <Heart className="mx-auto h-14 w-14 fill-pink-100 text-pink-600" aria-hidden="true" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-4 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <p className="mt-4 rounded-2xl border border-purple-100 bg-white p-4 text-left text-sm leading-6 text-slate-700">{t.note}</p>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label={t.title}>
          {t.items.map(([title, description, iconKey, href, available]) => {
            const Icon = icons[iconKey] || Heart;
            return (
              <Card key={title} className="flex h-full flex-col border-slate-200">
                <CardHeader><Icon className="h-8 w-8 text-pink-600" aria-hidden="true" /><CardTitle className="mt-3">{title}</CardTitle></CardHeader>
                <CardContent className="flex flex-1 flex-col"><p className="flex-1 text-sm leading-6 text-slate-600">{description}</p><div className="mt-5">{available ? <Button asChild className="w-full"><Link to={href}>{t.open}</Link></Button> : <Button type="button" disabled className="w-full">{t.soon}</Button>}</div>{available && <p className="mt-2 text-center text-xs font-semibold text-emerald-700">{t.available}</p>}</CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}
