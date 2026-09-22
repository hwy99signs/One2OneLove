import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Pencil, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    edit: "Edit",
    delete: "Delete",
    celebrate: "Get Celebration Ideas",
    recurringBadge: "Annual Celebration",
    photo: "Milestone photo"
  },
  es: {
    edit: "Editar",
    delete: "Eliminar",
    celebrate: "Obtener Ideas de Celebración",
    recurringBadge: "Celebración Anual",
    photo: "Foto del hito"
  },
  fr: {
    edit: "Modifier",
    delete: "Supprimer",
    celebrate: "Obtenir des Idées de Célébration",
    recurringBadge: "Célébration Annuelle",
    photo: "Photo du jalon"
  },
  it: {
    edit: "Modifica",
    delete: "Elimina",
    celebrate: "Ottieni Idee per la Celebrazione",
    recurringBadge: "Celebrazione Annuale",
    photo: "Foto del traguardo"
  },
  de: {
    edit: "Bearbeiten",
    delete: "Löschen",
    celebrate: "Feier-Ideen Erhalten",
    recurringBadge: "Jährliche Feier",
    photo: "Meilensteinfoto"
  }
};

const LOCALES = { en: "en-US", es: "es-ES", fr: "fr-FR", it: "it-IT", de: "de-DE" };

export default function MilestoneCard({ milestone, onEdit, onDelete, onCelebrate }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const dateLabel = new Intl.DateTimeFormat(LOCALES[currentLanguage] || LOCALES.en, { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${milestone.date}T00:00:00`));

  return (
    <motion.div
      data-milestone-type={milestone.milestone_type || "custom"}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-pink-200">
        <CardHeader>
          {milestone.is_recurring && (
            <div className="inline-flex items-center gap-1 bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold mb-2 w-fit">
              <Sparkles className="w-3 h-3" />
              {t.recurringBadge}
            </div>
          )}
          <CardTitle className="text-xl font-bold text-gray-900">
            {milestone.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
            <Calendar className="w-4 h-4" />
            {dateLabel}
          </div>
          {milestone.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <MapPin className="w-4 h-4" />
              {milestone.location}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {milestone.description && (
            <p className="text-gray-700 mb-4 line-clamp-3">
              {milestone.description}
            </p>
          )}
          {milestone.media_urls && milestone.media_urls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {milestone.media_urls.slice(0, 3).map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${t.photo} ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(milestone)}
              aria-label={`${t.edit}: ${milestone.title}`}
              className="flex-1"
            >
              <Pencil className="w-4 h-4 mr-1" />
              {t.edit}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(milestone.id)}
              aria-label={`${t.delete}: ${milestone.title}`}
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {t.delete}
            </Button>
          </div>
          <Button
            onClick={() => onCelebrate(milestone)}
            className="w-full mt-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t.celebrate}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}