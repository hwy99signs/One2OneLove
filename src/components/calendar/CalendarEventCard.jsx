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

const COPY={
 en:{types:{date:"Date",anniversary:"Anniversary",milestone:"Milestone",reminder:"Reminder",appointment:"Appointment",activity:"Activity",other:"Other"},patterns:{daily:"Daily",weekly:"Weekly",monthly:"Monthly",yearly:"Yearly"},daysBefore:"d before",edit:"Edit event",del:"Delete event"},
 es:{types:{date:"Cita",anniversary:"Aniversario",milestone:"Hito",reminder:"Recordatorio",appointment:"Cita Programada",activity:"Actividad",other:"Otro"},patterns:{daily:"Diario",weekly:"Semanal",monthly:"Mensual",yearly:"Anual"},daysBefore:"días antes",edit:"Editar evento",del:"Eliminar evento"},
 fr:{types:{date:"Rendez-vous",anniversary:"Anniversaire",milestone:"Jalon",reminder:"Rappel",appointment:"Rendez-vous Planifié",activity:"Activité",other:"Autre"},patterns:{daily:"Quotidien",weekly:"Hebdomadaire",monthly:"Mensuel",yearly:"Annuel"},daysBefore:"jours avant",edit:"Modifier l’événement",del:"Supprimer l’événement"},
 it:{types:{date:"Appuntamento",anniversary:"Anniversario",milestone:"Traguardo",reminder:"Promemoria",appointment:"Impegno",activity:"Attività",other:"Altro"},patterns:{daily:"Giornaliero",weekly:"Settimanale",monthly:"Mensile",yearly:"Annuale"},daysBefore:"giorni prima",edit:"Modifica evento",del:"Elimina evento"},
 de:{types:{date:"Date",anniversary:"Jahrestag",milestone:"Meilenstein",reminder:"Erinnerung",appointment:"Termin",activity:"Aktivität",other:"Andere"},patterns:{daily:"Täglich",weekly:"Wöchentlich",monthly:"Monatlich",yearly:"Jährlich"},daysBefore:"Tage vorher",edit:"Ereignis bearbeiten",del:"Ereignis löschen"}
};
const LOCALES={en:"en-US",es:"es-ES",fr:"fr-FR",it:"it-IT",de:"de-DE"};

export default function CalendarEventCard({ event, onEdit, onDelete, index }) {
  const { currentLanguage } = useLanguage();
  const t=COPY[currentLanguage]||COPY.en;
  const colorClass = eventTypeColors[event.event_type] || eventTypeColors.other;
  const icon = eventTypeIcons[event.event_type] || eventTypeIcons.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-pink-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                  {icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Intl.DateTimeFormat(LOCALES[currentLanguage]||LOCALES.en,{year:'numeric',month:'long',day:'numeric'}).format(new Date(event.event_date))}
                    </div>
                    {event.event_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {event.event_time}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-gray-700 mb-3">
                      {event.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${colorClass} text-white`}>
                      {t.types[event.event_type] || t.types.other}
                    </span>
                    {event.reminder_enabled && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        {event.reminder_days_before} {t.daysBefore}
                      </span>
                    )}
                    {event.is_recurring && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        {t.patterns[event.recurrence_pattern] || event.recurrence_pattern}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(event)}
                aria-label={t.edit}
                className="text-gray-400 hover:text-pink-600"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(event.id)}
                aria-label={t.del}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}