import React from "react";
import { BrainCircuit, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    eyebrow: "ONE2ONELOVE FEATURE",
    title: "MyMatchIQ",
    tagline: "Clarity Before Connection",
    body: "MyMatchIQ is becoming part of One2OneLove, giving you a dedicated place to explore compatibility, values, communication and relationship alignment.",
    note: "The full MyMatchIQ experience is being integrated here now.",
    private: "Private by design",
    compatibility: "Compatibility insights",
    connection: "Built for intentional connection"
  },
  es: {
    eyebrow: "FUNCIÓN DE ONE2ONELOVE",
    title: "MyMatchIQ",
    tagline: "Claridad Antes de Conectar",
    body: "MyMatchIQ se está integrando en One2OneLove para ofrecerte un espacio dedicado a explorar compatibilidad, valores, comunicación y afinidad en las relaciones.",
    note: "La experiencia completa de MyMatchIQ se está integrando aquí ahora.",
    private: "Privado por diseño",
    compatibility: "Información de compatibilidad",
    connection: "Creado para conexiones intencionales"
  },
  fr: {
    eyebrow: "FONCTION ONE2ONELOVE",
    title: "MyMatchIQ",
    tagline: "La Clarté Avant la Connexion",
    body: "MyMatchIQ rejoint One2OneLove afin d'offrir un espace dédié à la compatibilité, aux valeurs, à la communication et à l'alignement relationnel.",
    note: "L'expérience complète MyMatchIQ est en cours d'intégration ici.",
    private: "Conçu pour la confidentialité",
    compatibility: "Aperçus de compatibilité",
    connection: "Pensé pour des connexions intentionnelles"
  },
  it: {
    eyebrow: "FUNZIONE ONE2ONELOVE",
    title: "MyMatchIQ",
    tagline: "Chiarezza Prima della Connessione",
    body: "MyMatchIQ sta entrando a far parte di One2OneLove, con uno spazio dedicato a compatibilità, valori, comunicazione e sintonia relazionale.",
    note: "L'esperienza completa di MyMatchIQ è ora in fase di integrazione qui.",
    private: "Privato per scelta",
    compatibility: "Insight sulla compatibilità",
    connection: "Pensato per connessioni intenzionali"
  },
  de: {
    eyebrow: "ONE2ONELOVE-FUNKTION",
    title: "MyMatchIQ",
    tagline: "Klarheit Vor der Verbindung",
    body: "MyMatchIQ wird Teil von One2OneLove und bietet einen eigenen Bereich für Kompatibilität, Werte, Kommunikation und Beziehungsabstimmung.",
    note: "Das vollständige MyMatchIQ-Erlebnis wird derzeit hier integriert.",
    private: "Datenschutz von Anfang an",
    compatibility: "Kompatibilitäts-Einblicke",
    connection: "Für bewusste Verbindungen entwickelt"
  }
};

export default function MyMatchIQ() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-sm shadow-2xl p-8 sm:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 flex items-center justify-center shadow-xl flex-shrink-0">
              <BrainCircuit className="w-14 h-14" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="text-sm font-bold tracking-[0.2em] text-cyan-300 mb-2">{t.eyebrow}</div>
              <h1 className="text-4xl sm:text-5xl font-black mb-2">{t.title}</h1>
              <p className="text-xl sm:text-2xl font-semibold text-pink-300 mb-5">{t.tagline}</p>
              <p className="text-lg text-white/90 leading-relaxed mb-5">{t.body}</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                {t.note}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 auto-rows-fr gap-4 mt-10">
            <div className="h-full rounded-2xl bg-white/10 border border-white/10 p-5 text-center">
              <ShieldCheck className="w-7 h-7 mx-auto mb-2 text-emerald-300" />
              <div className="font-semibold">{t.private}</div>
            </div>
            <div className="h-full rounded-2xl bg-white/10 border border-white/10 p-5 text-center">
              <BrainCircuit className="w-7 h-7 mx-auto mb-2 text-cyan-300" />
              <div className="font-semibold">{t.compatibility}</div>
            </div>
            <div className="h-full rounded-2xl bg-white/10 border border-white/10 p-5 text-center">
              <Heart className="w-7 h-7 mx-auto mb-2 text-pink-300" />
              <div className="font-semibold">{t.connection}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
