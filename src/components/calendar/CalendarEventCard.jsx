import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Bell, Repeat, Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "@/Layout";

const eventTypeColors = {
  date: "from-pink-500 to-rose-500",
  anniversary: "from-purple-500 to-pink-500",
  milestone: "from-amber-500 to-orange-500",
  reminder: "from-blue-500 to-cyan-500",
  appointment: "from-green-500 to-emerald-500",
  activity: "from-indigo-500 to-purple-500",
  other: "from-gray-500 to-slate-500"
};

const eventTypeIcons = {
  date: "💕",
  anniversary: "🎉",
  milestone: "🏆",
  reminder: "⏰",
  appointment: "📅",
  activity: "🎯",
  other: "📌"
};

const translations = {
  en: {
    edit: "Edit event", delete: "Delete event", daysBefore: "days before",
    types: { date: "Date", anniversary: "Anniversary", milestone: "Milestone", reminder: "Reminder", appointment: "Appointment", activity: "Activity", other: "Other" },
    patterns: { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" }
  },
  es: {
    edit: "Editar evento", delete: "Eliminar evento", daysBefore: "días antes",
    types: { date: "Cita", anniversary: "Aniversario", milestone: "Hito", reminder: "Recordatorio", appointment: "Compromiso", activity: "Actividad", other: "Otro" },
    patterns: { daily: "Diario", weekly: "Semanal", monthly: "Mensual", yearly: "Anual" }
  },
  fr: {
    edit: "Modifier l’événement", delete: "Supprimer l’événement", daysBefore: "jours avant",
    types: { date: "Rendez-vous", anniversary: "Anniversaire", milestone: "Jalon", reminder: "Rappel", appointment: "Rendez-vous Planifié", activity: "Activité", other: "Autre" },
    patterns: { daily: "Quotidien", weekly: "Hebdomadaire", monthly: "Mensuel", yearly: "Annuel" }
  },
  it: {
    edit: "Modifica evento", delete: "Elimina evento", daysBefore: "giorni prima",
    types: { date: "Appuntamento", anniversary: "Anniversario", milestone: "Traguardo", reminder: "Promemoria", appointment: "Impegno", activity: "Attività", other: "Altro" },
    patterns: { daily: "Giornaliero", weekly: "Settimanale", monthly: "Mensile", yearly: "Annuale" }
  },
  de: {
    edit: "Ereignis bearbeiten", delete: "Ereignis löschen", daysBefore: "Tage vorher",
    types: { date: "Date", anniversary: "Jahrestag", milestone: "Meilenstein", reminder: "Erinnerung", appointment: "Termin", activity: "Aktivität", other: "Sonstiges" },
    patterns: { daily: "Täglich", weekly: "Wöchentlich", monthly: "Monatlich", yearly: "Jährlich" }
  }
};

const localeMap = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };

export default function CalendarEventCard({ event, onEdit, onDelete, index }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const colorClass = eventTypeColors[event.event_type] || eventTypeColors.other;
  const icon = eventTypeIcons[event.event_type] || eventTypeIcons.other;
  const eventDate = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${event.event_date}T12:00:00`));
  const typeLabel = t.types[event.event_type] || t.types.other;
  const recurrenceLabel = t.patterns[event.recurrence_pattern] || event.recurrence_pattern;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: index * 0.05 }}>
      <Card className="border-2 border-transparent bg-white/80 backdrop-blur-sm transition-all hover:border-pink-200 hover:shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colorClass} text-2xl shadow-lg`} aria-hidden="true">{icon}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-2 text-xl font-bold text-gray-900">{event.title}</h3>
                  <div className="mb-3 flex flex-wrap gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1"><Calendar className="h-4 w-4" aria-hidden="true" /><time dateTime={event.event_date}>{eventDate}</time></div>
                    {event.event_time && <div className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden="true" />{event.event_time}</div>}
                    {event.location && <div className="flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden="true" />{event.location}</div>}
                  </div>
                  {event.description && <p className="mb-3 text-gray-700">{event.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${colorClass}`}>{typeLabel}</span>
                    {event.reminder_enabled && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        <Bell className="h-3 w-3" aria-hidden="true" />{event.reminder_days_before} {t.daysBefore}
                      </span>
                    )}
                    {event.is_recurring && (
                      <span className="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                        <Repeat className="h-3 w-3" aria-hidden="true" />{recurrenceLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="icon" type="button" onClick={() => onEdit(event)} aria-label={t.edit} className="text-gray-400 hover:text-pink-600">
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" type="button" onClick={() => onDelete(event.id)} aria-label={t.delete} className="text-gray-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
