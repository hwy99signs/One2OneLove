import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Heart, LockKeyhole, Trash2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const moodEmojis = { happy: '😊', grateful: '🙏', reflective: '🤔', excited: '🎉', peaceful: '😌', challenged: '💪', loving: '❤️' };

const translations = {
  en: { edit: 'Edit journal entry', delete: 'Delete journal entry', private: 'Private', shared: 'Shared with partner', partnerEntry: 'Shared by your partner' },
  es: { edit: 'Editar entrada del diario', delete: 'Eliminar entrada del diario', private: 'Privada', shared: 'Compartida con tu pareja', partnerEntry: 'Compartida por tu pareja' },
  fr: { edit: 'Modifier l’entrée du journal', delete: 'Supprimer l’entrée du journal', private: 'Privée', shared: 'Partagée avec votre partenaire', partnerEntry: 'Partagée par votre partenaire' },
  it: { edit: 'Modifica voce del diario', delete: 'Elimina voce del diario', private: 'Privata', shared: 'Condivisa con il partner', partnerEntry: 'Condivisa dal partner' },
  de: { edit: 'Journaleintrag bearbeiten', delete: 'Journaleintrag löschen', private: 'Privat', shared: 'Mit Partner geteilt', partnerEntry: 'Vom Partner geteilt' }
};

const localeMap = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };

export default function JournalEntry({ entry, onEdit, onDelete }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const entryDate = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${entry.entry_date}T12:00:00`));
  const isOwn = entry.isOwn !== false;
  const privacyLabel = isOwn ? (entry.shared_with_partner ? t.shared : t.private) : t.partnerEntry;
  const PrivacyIcon = isOwn && !entry.shared_with_partner ? LockKeyhole : Users;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <Card className={`transition-shadow hover:shadow-lg ${isOwn ? '' : 'border-purple-200 bg-purple-50/20'}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{moodEmojis[entry.mood] || '💭'}</span>
                <CardTitle className="text-xl">{entry.title}</CardTitle>
                {entry.is_favorite && isOwn && <Heart className="h-5 w-5 fill-red-500 text-red-500" aria-hidden="true" />}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4" aria-hidden="true" /><time dateTime={entry.entry_date}>{entryDate}</time></span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${isOwn && !entry.shared_with_partner ? 'bg-emerald-50 text-emerald-800' : 'bg-purple-100 text-purple-800'}`}><PrivacyIcon className="h-3.5 w-3.5" aria-hidden="true" />{privacyLabel}</span>
              </div>
            </div>
            {isOwn && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" type="button" onClick={() => onEdit(entry)} aria-label={t.edit}><Edit className="h-4 w-4" aria-hidden="true" /></Button>
                <Button variant="ghost" size="icon" type="button" onClick={() => onDelete(entry.id)} aria-label={t.delete}><Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" /></Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 whitespace-pre-wrap text-gray-700">{entry.content}</p>
          {entry.tags?.length > 0 && <div className="flex flex-wrap gap-2">{entry.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">#{tag}</span>)}</div>}
        </CardContent>
      </Card>
    </motion.div>
  );
}
