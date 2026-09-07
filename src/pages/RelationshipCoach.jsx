import React from "react";
import { ArrowLeft, Sparkles, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    title: "AI Relationship Guide",
    subtitle: "Coming Soon",
    body: "One2OneLove is developing an educational AI relationship guide for reflection, communication, and everyday relationship questions. It will not replace therapy, counseling, or professional care.",
    back: "Back to Relationship Support"
  },
  es: {
    title: "Guía de Relaciones con IA",
    subtitle: "Próximamente",
    body: "One2OneLove está desarrollando una guía educativa con IA para la reflexión, la comunicación y las preguntas cotidianas sobre relaciones. No reemplazará la terapia, la consejería ni la atención profesional.",
    back: "Volver al Apoyo para Relaciones"
  },
  fr: {
    title: "Guide Relationnel IA",
    subtitle: "Bientôt Disponible",
    body: "One2OneLove développe un guide relationnel éducatif basé sur l'IA pour la réflexion, la communication et les questions du quotidien. Il ne remplacera ni la thérapie, ni le conseil, ni les soins professionnels.",
    back: "Retour au Soutien Relationnel"
  },
  it: {
    title: "Guida Relazionale IA",
    subtitle: "Prossimamente",
    body: "One2OneLove sta sviluppando una guida educativa basata sull'IA per riflessione, comunicazione e domande quotidiane sulle relazioni. Non sostituirà terapia, consulenza o assistenza professionale.",
    back: "Torna al Supporto per le Relazioni"
  },
  de: {
    title: "KI-Beziehungsleitfaden",
    subtitle: "Demnächst",
    body: "One2OneLove entwickelt einen pädagogischen KI-Beziehungsleitfaden für Reflexion, Kommunikation und alltägliche Beziehungsfragen. Er ersetzt keine Therapie, Beratung oder professionelle Versorgung.",
    back: "Zurück zur Beziehungsunterstützung"
  }
};

export default function RelationshipCoach() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          to={createPageUrl("CoupleSupport")}
          className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t.back}
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-6 shadow-xl">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="inline-block bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-bold mb-4 ml-3">
            {t.subtitle}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-5">{t.title}</h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">{t.body}</p>
          <MessageCircle className="w-8 h-8 text-purple-400 mx-auto mt-8" />
        </div>
      </div>
    </div>
  );
}
