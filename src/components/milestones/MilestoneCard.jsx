import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Pencil, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const translations = {
  en: { edit: "Edit", delete: "Delete", celebrate: "Get Celebration Ideas", recurringBadge: "Annual Celebration", editLabel: "Edit milestone", deleteLabel: "Delete milestone" },
  es: { edit: "Editar", delete: "Eliminar", celebrate: "Obtener Ideas de Celebración", recurringBadge: "Celebración Anual", editLabel: "Editar hito", deleteLabel: "Eliminar hito" },
  fr: { edit: "Modifier", delete: "Supprimer", celebrate: "Obtenir des Idées de Célébration", recurringBadge: "Célébration Annuelle", editLabel: "Modifier le jalon", deleteLabel: "Supprimer le jalon" },
  it: { edit: "Modifica", delete: "Elimina", celebrate: "Ottieni Idee per la Celebrazione", recurringBadge: "Celebrazione Annuale", editLabel: "Modifica traguardo", deleteLabel: "Elimina traguardo" },
  de: { edit: "Bearbeiten", delete: "Löschen", celebrate: "Feier-Ideen Erhalten", recurringBadge: "Jährliche Feier", editLabel: "Meilenstein bearbeiten", deleteLabel: "Meilenstein löschen" }
};

const localeMap = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };

export default function MilestoneCard({ milestone, onEdit, onDelete, onCelebrate }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const milestoneDate = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${milestone.date}T12:00:00`));

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
      <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-pink-200 hover:shadow-xl">
        <CardHeader>
          {milestone.is_recurring && (
            <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
              <Sparkles className="h-3 w-3" aria-hidden="true" />{t.recurringBadge}
            </div>
          )}
          <CardTitle className="text-xl font-bold text-gray-900">{milestone.title}</CardTitle>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" aria-hidden="true" /><time dateTime={milestone.date}>{milestoneDate}</time>
          </div>
          {milestone.location && (
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600"><MapPin className="h-4 w-4" aria-hidden="true" />{milestone.location}</div>
          )}
        </CardHeader>
        <CardContent>
          {milestone.description && <p className="mb-4 line-clamp-3 text-gray-700">{milestone.description}</p>}
          {milestone.media_urls?.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              {milestone.media_urls.slice(0, 3).map((url, index) => (
                <img key={url} src={url} alt="" className="h-20 w-full rounded-lg object-cover" loading="lazy" data-index={index} />
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => onEdit(milestone)} className="flex-1" aria-label={t.editLabel}>
              <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />{t.edit}
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={() => onDelete(milestone.id)} className="flex-1 text-red-600 hover:text-red-700" aria-label={t.deleteLabel}>
              <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />{t.delete}
            </Button>
          </div>
          <Button type="button" onClick={() => onCelebrate(milestone)} className="mt-3 w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
            <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />{t.celebrate}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
