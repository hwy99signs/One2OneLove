import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Check, Copy, Gift, Heart, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/Layout";
import { getMilestoneCelebrationFallback } from "@/lib/milestoneCelebrationFallbacks";

const translations = {
  en: { title: "Celebration Ideas", subtitle: "Simple ways to make this milestone feel intentionally celebrated", loveNotes: "Love Note Prompts", dates: "Date Ideas", gifts: "Gift & Keepsake Ideas", copied: "Copied!", copyError: "Could not copy this note.", close: "Close", closeLabel: "Close celebration ideas" },
  es: { title: "Ideas de Celebración", subtitle: "Formas sencillas de hacer que este hito se sienta celebrado con intención", loveNotes: "Ideas para Notas de Amor", dates: "Ideas para Citas", gifts: "Ideas de Regalos y Recuerdos", copied: "¡Copiado!", copyError: "No se pudo copiar esta nota.", close: "Cerrar", closeLabel: "Cerrar ideas de celebración" },
  fr: { title: "Idées de Célébration", subtitle: "Des façons simples de célébrer ce jalon avec intention", loveNotes: "Idées de Notes d’Amour", dates: "Idées de Rendez-vous", gifts: "Idées de Cadeaux et Souvenirs", copied: "Copié !", copyError: "Impossible de copier cette note.", close: "Fermer", closeLabel: "Fermer les idées de célébration" },
  it: { title: "Idee per la Celebrazione", subtitle: "Modi semplici per celebrare questo traguardo con intenzione", loveNotes: "Spunti per Note d’Amore", dates: "Idee per Appuntamenti", gifts: "Idee per Regali e Ricordi", copied: "Copiato!", copyError: "Non è stato possibile copiare questa nota.", close: "Chiudi", closeLabel: "Chiudi idee per la celebrazione" },
  de: { title: "Feier-Ideen", subtitle: "Einfache Möglichkeiten, diesen Meilenstein bewusst zu feiern", loveNotes: "Ideen für Liebesbotschaften", dates: "Date-Ideen", gifts: "Geschenk- und Erinnerungs-Ideen", copied: "Kopiert!", copyError: "Diese Nachricht konnte nicht kopiert werden.", close: "Schließen", closeLabel: "Feier-Ideen schließen" }
};

export default function CelebrationIdeas({ milestone, onClose }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const ideas = getMilestoneCelebrationFallback(currentLanguage);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success(t.copied);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      toast.error(t.copyError);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        role="dialog" aria-modal="true" aria-labelledby="celebration-ideas-title"
      >
        <header className="sticky top-0 rounded-t-2xl bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="celebration-ideas-title" className="text-2xl font-bold md:text-3xl">{t.title}</h2>
              <p className="mt-2 text-white/90">{milestone?.title ? `${milestone.title} — ${t.subtitle}` : t.subtitle}</p>
            </div>
            <button type="button" onClick={onClose} aria-label={t.closeLabel} className="rounded-full p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="space-y-8 p-6">
          <section aria-labelledby="celebration-love-notes">
            <div className="mb-4 flex items-center gap-3"><Heart className="h-6 w-6 text-pink-500" aria-hidden="true" /><h3 id="celebration-love-notes" className="text-2xl font-bold text-gray-900">{t.loveNotes}</h3></div>
            <div className="space-y-3">
              {ideas.loveNotes.map((note, index) => (
                <Card key={note} className="border-2 border-pink-100 transition-colors hover:border-pink-300">
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <p className="flex-1 leading-relaxed text-gray-700">{note}</p>
                    <Button variant="ghost" size="icon" type="button" onClick={() => copyToClipboard(note, index)} aria-label={`${t.loveNotes}: ${index + 1}`}>
                      {copiedIndex === index ? <Check className="h-4 w-4 text-green-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="celebration-date-ideas">
            <div className="mb-4 flex items-center gap-3"><Calendar className="h-6 w-6 text-purple-500" aria-hidden="true" /><h3 id="celebration-date-ideas" className="text-2xl font-bold text-gray-900">{t.dates}</h3></div>
            <div className="grid gap-3 md:grid-cols-2">
              {ideas.dates.map((idea) => <Card key={idea} className="border-2 border-purple-100"><CardContent className="p-4 text-gray-700">{idea}</CardContent></Card>)}
            </div>
          </section>

          <section aria-labelledby="celebration-gift-ideas">
            <div className="mb-4 flex items-center gap-3"><Gift className="h-6 w-6 text-blue-500" aria-hidden="true" /><h3 id="celebration-gift-ideas" className="text-2xl font-bold text-gray-900">{t.gifts}</h3></div>
            <div className="grid gap-3 md:grid-cols-2">
              {ideas.gifts.map((idea) => <Card key={idea} className="border-2 border-blue-100"><CardContent className="p-4 text-gray-700">{idea}</CardContent></Card>)}
            </div>
          </section>
        </div>

        <footer className="border-t p-6">
          <Button type="button" onClick={onClose} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 py-6 text-lg hover:from-pink-600 hover:to-purple-700">{t.close}</Button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
