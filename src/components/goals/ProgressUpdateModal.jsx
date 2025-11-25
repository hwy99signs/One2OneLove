import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    updateProgress: "Update Progress",
    currentProgress: "Current Progress",
    newProgress: "New Progress",
    notes: "Notes (Optional)",
    notesPlaceholder: "Add any updates or reflections...",
    markComplete: "Mark as Complete",
    cancel: "Cancel",
    update: "Update"
  },
  es: {
    updateProgress: "Actualizar Progreso",
    currentProgress: "Progreso Actual",
    newProgress: "Nuevo Progreso",
    notes: "Notas (Opcional)",
    notesPlaceholder: "Agrega actualizaciones o reflexiones...",
    markComplete: "Marcar como Completado",
    cancel: "Cancelar",
    update: "Actualizar"
  },
  fr: {
    updateProgress: "Mettre à Jour le Progrès",
    currentProgress: "Progrès Actuel",
    newProgress: "Nouveau Progrès",
    notes: "Notes (Optionnel)",
    notesPlaceholder: "Ajoutez des mises à jour ou réflexions...",
    markComplete: "Marquer comme Terminé",
    cancel: "Annuler",
    update: "Mettre à Jour"
  },
  it: {
    updateProgress: "Aggiorna Progresso",
    currentProgress: "Progresso Attuale",
    newProgress: "Nuovo Progresso",
    notes: "Note (Opzionale)",
    notesPlaceholder: "Aggiungi aggiornamenti o riflessioni...",
    markComplete: "Segna come Completato",
    cancel: "Annulla",
    update: "Aggiorna"
  },
  de: {
    updateProgress: "Fortschritt Aktualisieren",
    currentProgress: "Aktueller Fortschritt",
    newProgress: "Neuer Fortschritt",
    notes: "Notizen (Optional)",
    notesPlaceholder: "Fügen Sie Updates oder Reflexionen hinzu...",
    markComplete: "Als Abgeschlossen Markieren",
    cancel: "Abbrechen",
    update: "Aktualisieren"
  }
};

export default function ProgressUpdateModal({ goal, onUpdate, onCancel, isLoading }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [progress, setProgress] = useState(goal.progress);
  const [notes, setNotes] = useState(goal.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({
      ...goal,
      progress,
      notes,
      status: progress === 100 ? 'completed' : goal.status
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t.updateProgress}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t.newProgress}: {progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(236, 72, 153) 0%, rgb(147, 51, 234) ${progress}%, rgb(229, 231, 235) ${progress}%, rgb(229, 231, 235) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.notes}
            </label>
            <Textarea
              placeholder={t.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24"
            />
          </div>

          {progress === 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                {t.markComplete}
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t.update}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}