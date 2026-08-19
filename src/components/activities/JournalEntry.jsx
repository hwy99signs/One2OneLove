import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const moodEmojis = {
  happy: '😊',
  grateful: '🙏',
  reflective: '🤔',
  excited: '🎉',
  peaceful: '😌',
  challenged: '💪',
  loving: '❤️'
};

const translations = {
  en: { edit: 'Edit journal entry', delete: 'Delete journal entry' },
  es: { edit: 'Editar entrada del diario', delete: 'Eliminar entrada del diario' },
  fr: { edit: 'Modifier l’entrée du journal', delete: 'Supprimer l’entrée du journal' },
  it: { edit: 'Modifica voce del diario', delete: 'Elimina voce del diario' },
  de: { edit: 'Journaleintrag bearbeiten', delete: 'Journaleintrag löschen' }
};

const localeMap = {
  en: 'en-US',
  es: 'es',
  fr: 'fr',
  it: 'it',
  de: 'de'
};

export default function JournalEntry({ entry, onEdit, onDelete }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const entryDate = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${entry.entry_date}T12:00:00`));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{moodEmojis[entry.mood] || '💭'}</span>
                <CardTitle className="text-xl">{entry.title}</CardTitle>
                {entry.is_favorite && <Heart className="h-5 w-5 fill-red-500 text-red-500" aria-hidden="true" />}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                <time dateTime={entry.entry_date}>{entryDate}</time>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" type="button" onClick={() => onEdit(entry)} aria-label={t.edit}>
                <Edit className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" type="button" onClick={() => onDelete(entry.id)} aria-label={t.delete}>
                <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 whitespace-pre-wrap text-gray-700">{entry.content}</p>
          {entry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">#{tag}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
