import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";
import { parseLocalDate } from "@/utils/localDate";

const eventTypeColors = {
  date: "bg-pink-500",
  anniversary: "bg-purple-500",
  milestone: "bg-amber-500",
  reminder: "bg-blue-500",
  appointment: "bg-green-500",
  activity: "bg-indigo-500",
  other: "bg-gray-500"
};

const COPY={
 en:{today:"Today",more:"more",previous:"Previous month",next:"Next month"},
 es:{today:"Hoy",more:"más",previous:"Mes anterior",next:"Mes siguiente"},
 fr:{today:"Aujourd’hui",more:"de plus",previous:"Mois précédent",next:"Mois suivant"},
 it:{today:"Oggi",more:"in più",previous:"Mese precedente",next:"Mese successivo"},
 de:{today:"Heute",more:"weitere",previous:"Vorheriger Monat",next:"Nächster Monat"}
};
const LOCALES={en:"en-US",es:"es-ES",fr:"fr-FR",it:"it-IT",de:"de-DE"};

export default function CalendarGrid({ currentMonth, events, onEventClick, onPrevMonth, onNextMonth, onToday }) {
  const { currentLanguage } = useLanguage();
  const t=COPY[currentLanguage]||COPY.en;
  const locale=LOCALES[currentLanguage]||LOCALES.en;
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = Array.from({length:7},(_,i)=>new Intl.DateTimeFormat(locale,{weekday:'short'}).format(new Date(2026,7,2+i)));

  const getEventsForDay = (day) => {
    return events.filter(event => {
      const eventDate = parseLocalDate(event.event_date);
      return Boolean(eventDate) && isSameDay(eventDate, day);
    });
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {new Intl.DateTimeFormat(locale,{year:'numeric',month:'long'}).format(currentMonth)}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={onPrevMonth} aria-label={t.previous}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={onToday}>
              {t.today}
            </Button>
            <Button variant="outline" size="icon" onClick={onNextMonth} aria-label={t.next}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-2 text-sm">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            
            return (
              <motion.div
                key={day.toString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.01 }}
                className={`min-h-[100px] p-2 rounded-lg border-2 transition-all ${
                  isTodayDate
                    ? 'border-pink-500 bg-pink-50'
                    : isCurrentMonth
                    ? 'border-gray-200 bg-white hover:border-pink-200 hover:shadow-md'
                    : 'border-gray-100 bg-gray-50 opacity-50'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isTodayDate ? 'text-pink-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`w-full text-left px-2 py-1 rounded text-xs font-medium text-white ${
                        eventTypeColors[event.event_type] || eventTypeColors.other
                      } hover:opacity-80 transition-opacity truncate`}
                    >
                      {event.event_time && (
                        <span className="mr-1">{event.event_time}</span>
                      )}
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium px-2">
                      +{dayEvents.length - 3} {t.more}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}