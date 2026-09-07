import React from "react";
import { Heart, MessageCircle, AlertCircle, Users, Sparkles, ArrowLeft, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "Relationship Quizzes",
    subtitle: "Self-reflection tools to help you notice patterns, preferences, and areas for growth",
    disclaimer: "For education and self-reflection only. These tools are not a diagnosis, therapy, or a substitute for professional care.",
    sourceNote: "Reference source for relationship-education topics: Therapist Aid therapy worksheets. One2OneLove presents these as educational self-reflection tools and does not replace professional therapy or counseling.",
    back: "Back to Support",
    start: "Start Quiz",
    comingSoon: "Coming Soon",
    loveLanguage: { title: "Love Language Quiz", description: "Explore how you prefer to give and receive care and affection." },
    communication: { title: "Communication Style Reflection", description: "Reflect on how you express yourself, listen, and respond during conversations." },
    conflict: { title: "Conflict Response Reflection", description: "Consider the patterns you tend to use when disagreements happen." },
    attachment: { title: "Connection & Attachment Reflection", description: "Reflect on closeness, trust, reassurance, and emotional connection in relationships." },
    dating: { title: "Dating Readiness Reflection", description: "Think through your expectations, boundaries, and readiness for dating." },
    health: { title: "Relationship Check-In Reflection", description: "Reflect on communication, respect, connection, support, and areas you may want to strengthen." }
  },
  es: {
    title: "Cuestionarios de Relaciones",
    subtitle: "Herramientas de autorreflexión para identificar patrones, preferencias y áreas de crecimiento",
    disclaimer: "Solo para educación y autorreflexión. Estas herramientas no son diagnóstico, terapia ni sustituyen la atención profesional.",
    sourceNote: "Fuente de referencia para temas de educación sobre relaciones: hojas de trabajo de Therapist Aid. One2OneLove presenta estos temas como herramientas educativas de autorreflexión y no sustituye la terapia o consejería profesional.",
    back: "Volver al Apoyo",
    start: "Comenzar Cuestionario",
    comingSoon: "Próximamente",
    loveLanguage: { title: "Quiz de Lenguaje del Amor", description: "Explora cómo prefieres dar y recibir cuidado y afecto." },
    communication: { title: "Reflexión sobre el Estilo de Comunicación", description: "Reflexiona sobre cómo te expresas, escuchas y respondes en las conversaciones." },
    conflict: { title: "Reflexión sobre la Respuesta al Conflicto", description: "Considera los patrones que sueles usar cuando hay desacuerdos." },
    attachment: { title: "Reflexión sobre Conexión y Apego", description: "Reflexiona sobre cercanía, confianza, seguridad y conexión emocional." },
    dating: { title: "Reflexión sobre Preparación para Citas", description: "Piensa en tus expectativas, límites y preparación para salir con alguien." },
    health: { title: "Reflexión de Chequeo de la Relación", description: "Reflexiona sobre comunicación, respeto, conexión, apoyo y áreas por fortalecer." }
  },
  fr: {
    title: "Quiz sur les Relations",
    subtitle: "Des outils d'autoréflexion pour observer vos schémas, préférences et pistes de croissance",
    disclaimer: "À des fins éducatives et d'autoréflexion uniquement. Ces outils ne constituent ni un diagnostic ni une thérapie et ne remplacent pas un professionnel.",
    sourceNote: "Source de référence pour les thèmes d'éducation relationnelle : fiches de travail de Therapist Aid. One2OneLove les présente comme des outils éducatifs d'autoréflexion et ne remplace pas une thérapie ou un accompagnement professionnel.",
    back: "Retour au Soutien",
    start: "Commencer le Quiz",
    comingSoon: "Bientôt Disponible",
    loveLanguage: { title: "Quiz sur les Langages d'Amour", description: "Explorez la façon dont vous préférez donner et recevoir de l'attention et de l'affection." },
    communication: { title: "Réflexion sur le Style de Communication", description: "Réfléchissez à votre façon de vous exprimer, d'écouter et de répondre." },
    conflict: { title: "Réflexion sur la Réaction aux Conflits", description: "Observez les schémas que vous utilisez lorsque des désaccords surviennent." },
    attachment: { title: "Réflexion sur la Connexion et l'Attachement", description: "Réfléchissez à la proximité, la confiance, la sécurité et la connexion émotionnelle." },
    dating: { title: "Réflexion sur la Préparation aux Rencontres", description: "Examinez vos attentes, vos limites et votre préparation aux rencontres." },
    health: { title: "Réflexion sur l'État de la Relation", description: "Réfléchissez à la communication, au respect, au soutien, à la connexion et aux domaines à renforcer." }
  },
  it: {
    title: "Quiz sulle Relazioni",
    subtitle: "Strumenti di autoriflessione per riconoscere schemi, preferenze e aree di crescita",
    disclaimer: "Solo per educazione e autoriflessione. Questi strumenti non sono diagnosi o terapia e non sostituiscono l'assistenza professionale.",
    sourceNote: "Fonte di riferimento per i temi educativi sulle relazioni: schede di Therapist Aid. One2OneLove presenta questi temi come strumenti educativi di autoriflessione e non sostituisce terapia o consulenza professionale.",
    back: "Torna al Supporto",
    start: "Inizia Quiz",
    comingSoon: "Prossimamente",
    loveLanguage: { title: "Quiz sul Linguaggio dell'Amore", description: "Esplora come preferisci dare e ricevere cura e affetto." },
    communication: { title: "Riflessione sullo Stile di Comunicazione", description: "Rifletti su come ti esprimi, ascolti e rispondi nelle conversazioni." },
    conflict: { title: "Riflessione sulla Risposta ai Conflitti", description: "Considera gli schemi che tendi a usare durante i disaccordi." },
    attachment: { title: "Riflessione su Connessione e Attaccamento", description: "Rifletti su vicinanza, fiducia, rassicurazione e connessione emotiva." },
    dating: { title: "Riflessione sulla Preparazione agli Appuntamenti", description: "Pensa alle tue aspettative, ai tuoi confini e alla tua preparazione agli appuntamenti." },
    health: { title: "Riflessione sullo Stato della Relazione", description: "Rifletti su comunicazione, rispetto, connessione, supporto e aree da rafforzare." }
  },
  de: {
    title: "Beziehungsquiz",
    subtitle: "Selbstreflexions-Werkzeuge, um Muster, Vorlieben und Wachstumsbereiche zu erkennen",
    disclaimer: "Nur für Bildung und Selbstreflexion. Diese Werkzeuge sind keine Diagnose oder Therapie und ersetzen keine professionelle Unterstützung.",
    sourceNote: "Referenzquelle für Themen der Beziehungsbildung: Arbeitsblätter von Therapist Aid. One2OneLove stellt diese Themen als pädagogische Selbstreflexionswerkzeuge bereit und ersetzt keine professionelle Therapie oder Beratung.",
    back: "Zurück zur Unterstützung",
    start: "Quiz Starten",
    comingSoon: "Demnächst",
    loveLanguage: { title: "Liebessprachen-Quiz", description: "Erkunden Sie, wie Sie Fürsorge und Zuneigung am liebsten geben und empfangen." },
    communication: { title: "Reflexion zum Kommunikationsstil", description: "Reflektieren Sie, wie Sie sich ausdrücken, zuhören und in Gesprächen reagieren." },
    conflict: { title: "Reflexion zum Konfliktverhalten", description: "Betrachten Sie die Muster, die Sie bei Meinungsverschiedenheiten häufig nutzen." },
    attachment: { title: "Reflexion zu Verbindung und Bindung", description: "Reflektieren Sie Nähe, Vertrauen, Sicherheit und emotionale Verbindung." },
    dating: { title: "Reflexion zur Dating-Bereitschaft", description: "Denken Sie über Erwartungen, Grenzen und Ihre Bereitschaft für Dating nach." },
    health: { title: "Reflexion zum Beziehungs-Check-in", description: "Reflektieren Sie Kommunikation, Respekt, Verbindung, Unterstützung und mögliche Wachstumsbereiche." }
  }
};

export default function RelationshipQuizzes() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const quizzes = [
    { id: "love-language", ...t.loveLanguage, icon: Heart, color: "from-pink-500 to-rose-600", link: "LoveLanguageQuiz", active: true },
    { id: "communication", ...t.communication, icon: MessageCircle, color: "from-blue-500 to-cyan-600", active: false },
    { id: "conflict", ...t.conflict, icon: AlertCircle, color: "from-orange-500 to-red-600", active: false },
    { id: "attachment", ...t.attachment, icon: Users, color: "from-purple-500 to-pink-600", active: false },
    { id: "dating", ...t.dating, icon: Sparkles, color: "from-green-500 to-emerald-600", active: false },
    { id: "health", ...t.health, icon: Heart, color: "from-red-500 to-pink-600", active: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link
          to={createPageUrl("CoupleSupport")}
          className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          {t.back}
        </Link>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-6 shadow-xl">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-5">{t.subtitle}</p>
          <div className="max-w-3xl mx-auto bg-white border border-purple-100 rounded-2xl px-5 py-4 text-sm text-gray-600 shadow-sm">
            {t.disclaimer}
          </div>
          <div className="max-w-3xl mx-auto mt-3 text-xs text-gray-500 leading-relaxed">
            {t.sourceNote}{" "}
            <a
              href="https://www.therapistaid.com/therapy-worksheets"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 underline underline-offset-2"
            >
              Therapist Aid
            </a>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz, index) => {
            const Icon = quiz.icon;
            const Wrapper = quiz.active ? Link : "div";
            const wrapperProps = quiz.active ? { to: createPageUrl(quiz.link) } : {};

            return (
              <motion.div key={quiz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="relative">
                <Wrapper {...wrapperProps}>
                  <Card className={`h-full border-2 ${quiz.active ? "border-transparent hover:border-purple-200 hover:shadow-xl cursor-pointer" : "border-gray-200"} transition-all`}>
                    {!quiz.active && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                        {t.comingSoon}
                      </div>
                    )}
                    <CardHeader>
                      <div className={`w-14 h-14 bg-gradient-to-br ${quiz.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <CardTitle className="text-xl pr-20">{quiz.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed mb-4">{quiz.description}</p>
                      {quiz.active && (
                        <Button className={`w-full bg-gradient-to-r ${quiz.color} text-white hover:opacity-90`}>
                          {t.start}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Wrapper>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
