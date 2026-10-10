import React from "react";
import { useLanguage } from "@/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import termsEn from '@/content/terms/en';
import termsEs from '@/content/terms/es';
import termsFr from '@/content/terms/fr';
import termsIt from '@/content/terms/it';
import termsDe from '@/content/terms/de';

const translations = {
  en: {
    title: "Terms of Service",
    subtitle: "Rules and conditions for using One2OneLove",
    back: "Back",
    lastUpdated: "Last Updated: October 10, 2026",
    translationNotice: "If a translated version differs from the English version, the English version controls to the extent permitted by applicable law.",
    ownershipNotice: "The One2One Love Platform is owned and operated by ERANT Property Services LLC (EPS LLC), its parent company. These Terms are an agreement between you and ERANT Property Services LLC relating to your use of the One2One Love Platform. References to ‘One2OneLove,’ ‘we,’ ‘us,’ or ‘our’ mean ERANT Property Services LLC operating the One2One Love Platform, unless the context requires otherwise.",
    sections: termsEn.map(([title,content])=>({title,content}))
  },
  es: {
    title: "Términos de Servicio", subtitle: "Reglas y condiciones para usar One2OneLove", back: "Volver", lastUpdated: "Última Actualización: 9 de Octubre de 2026", translationNotice: "Si una versión traducida difiere de la versión en inglés, la versión en inglés prevalece en la medida permitida por la ley aplicable.", ownershipNotice: "La Plataforma One2One Love es propiedad de ERANT Property Services LLC (EPS LLC), su empresa matriz, y es operada por ella. Estos Términos constituyen un acuerdo entre tú y ERANT Property Services LLC en relación con tu uso de la Plataforma One2One Love. Las referencias a ‘One2OneLove’, ‘nosotros’, ‘nos’ o ‘nuestro’ significan ERANT Property Services LLC operando la Plataforma One2One Love, salvo que el contexto indique lo contrario.",
    sections: termsEs.map(([title,content])=>({title,content}))
  },
  fr: {
    title: "Conditions d'Utilisation", subtitle: "Règles et conditions d'utilisation de One2OneLove", back: "Retour", lastUpdated: "Dernière Mise à Jour : 9 Octobre 2026", translationNotice: "Si une traduction diffère de la version anglaise, la version anglaise prévaut dans la mesure permise par le droit applicable.", ownershipNotice: "La Plateforme One2One Love est détenue et exploitée par ERANT Property Services LLC (EPS LLC), sa société mère. Les présentes Conditions constituent un accord entre vous et ERANT Property Services LLC concernant votre utilisation de la Plateforme One2One Love. Les références à « One2OneLove », « nous », « notre » ou « nos » désignent ERANT Property Services LLC exploitant la Plateforme One2One Love, sauf indication contraire du contexte.",
    sections: termsFr.map(([title,content])=>({title,content}))
  },
  it: {
    title: "Termini di Servizio", subtitle: "Regole e condizioni per l'uso di One2OneLove", back: "Indietro", lastUpdated: "Ultimo Aggiornamento: 9 Ottobre 2026", translationNotice: "Se una traduzione differisce dalla versione inglese, la versione inglese prevale nella misura consentita dalla legge applicabile.", ownershipNotice: "La Piattaforma One2One Love è di proprietà ed è gestita da ERANT Property Services LLC (EPS LLC), la sua società madre. I presenti Termini costituiscono un accordo tra te ed ERANT Property Services LLC relativo all'uso della Piattaforma One2One Love. I riferimenti a ‘One2OneLove’, ‘noi’, ‘ci’ o ‘nostro’ indicano ERANT Property Services LLC che gestisce la Piattaforma One2One Love, salvo che il contesto richieda diversamente.",
    sections: termsIt.map(([title,content])=>({title,content}))
  },
  de: {
    title: "Nutzungsbedingungen", subtitle: "Regeln und Bedingungen für die Nutzung von One2OneLove", back: "Zurück", lastUpdated: "Letzte Aktualisierung: 9. Oktober 2026", translationNotice: "Wenn eine Übersetzung von der englischen Fassung abweicht, gilt die englische Fassung, soweit dies nach geltendem Recht zulässig ist.", ownershipNotice: "Die One2One Love Plattform befindet sich im Eigentum von ERANT Property Services LLC (EPS LLC), ihrer Muttergesellschaft, und wird von ihr betrieben. Diese Bedingungen sind eine Vereinbarung zwischen Ihnen und ERANT Property Services LLC in Bezug auf Ihre Nutzung der One2One Love Plattform. ‘One2OneLove’, ‘wir’, ‘uns’ und ‘unser’ beziehen sich auf ERANT Property Services LLC als Betreiberin der One2One Love Plattform, sofern der Kontext nichts anderes verlangt.",
    sections: termsDe.map(([title,content])=>({title,content}))
  }
};

export default function TermsOfService() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="mx-auto min-w-0 max-w-5xl px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("Home")} className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="mb-4 break-words text-4xl font-bold text-gray-900 [overflow-wrap:anywhere] sm:text-5xl">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">{t.subtitle}</p>
          <p className="text-sm text-gray-500 mt-4">{t.lastUpdated}</p>
          {currentLanguage !== "en" && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-5 max-w-3xl mx-auto">{t.translationNotice}</p>}
          <p className="text-sm text-slate-700 bg-white/80 border border-blue-200 rounded-xl p-4 mt-5 max-w-4xl mx-auto shadow-sm">{t.ownershipNotice}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="min-w-0 overflow-hidden shadow-2xl">
            <CardContent className="min-w-0 p-6 sm:p-8 md:p-10">
              <div className="prose prose-lg min-w-0 max-w-none break-words [overflow-wrap:anywhere]">
                {t.sections.map((section, index) => (
                  <div key={index} className="mb-9">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
