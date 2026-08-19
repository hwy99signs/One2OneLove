import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const eventTypeColors = {
  date: "bg-pink-500",
  anniversary: "bg-purple-500",
  milestone: "bg-amber-500",
  reminder: "bg-blue-500",
  appointment: "bg-green-500",
  activity: "bg-indigo-500",
  other: "bg-gray-500"
};

const translations = {
  en: { today: "Today", previous: "Previous month", next: "Next month", more: "more" },
  es: { today: "Hoy", previous: "Mes anterior", next: "Mes siguiente", more: "más" },
  fr: { today: "Aujourd’hui", previous: "Mois précédent", next: "Mois suivant", more: "de plus" },
  it: { today: "Oggi", previous: "Mese precedente", next: "Mese successivo", more: "altri" },
  de: { today: "Heute", previous: "Vorheriger Monat", next: "Nächster Monat", more: "weitere" }
};

const localeMap = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };

export default function CalendarGrid({ currentMonth, events, onEventClick, onPrevMonth, onNextMonth, onToday }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const weekStartsOn = currentLanguage === 'en' ? 0 : 1;
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const baseSunday = new Date(2024, 0, 7);
    const offset = (weekStartsOn + index) % 7;
    const value = new Date(baseSunday);
    value.setDate(baseSunday.getDate() + offset);
    return weekDayFormatter.format(value);
  });

  const getEventsForDay = (day) => events.filter((event) => isSameDay(new Date(`${event.event_date}T12:00:00`), day));

  return (
    <Card className="bg-white/90 shadow-xl backdrop-blur-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold capitalize text-gray-900">{monthFormatter.format(currentMonth)}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" type="button" onClick={onPrevMonth} aria-label={t.previous}>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button variant="outline" type="button" onClick={onToday}>{t.today}</Button>
            <Button variant="outline" size="icon" type="button" onClick={onNextMonth} aria-label={t.next}>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day, index) => (
            <div key={`${day}-${index}`} className="py-2 text-center text-xs font-semibold text-gray-600 sm:text-sm">{day}</div>
          ))}

          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.01 }}
                className={`min-h-[82px] rounded-lg border p-1.5 transition-all sm:min-h-[100px] sm:border-2 sm:p-2 ${
                  isTodayDate
                    ? 'border-pink-500 bg-pink-50'
                    : isCurrentMonth
                      ? 'border-gray-200 bg-white hover:border-pink-200 hover:shadow-md'
                      : 'border-gray-100 bg-gray-50 opacity-50'
                }`}
              >
                <div className={`mb-1 text-sm font-semibold ${isTodayDate ? 'text-pink-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>{day.getDate()}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick(event)}
                      className={`w-full truncate rounded px-1 py-1 text-left text-[10px] font-medium text-white transition-opacity hover:opacity-80 sm:px-2 sm:text-xs ${eventTypeColors[event.event_type] || eventTypeColors.other}`}
                    >
                      {event.event_time && <span className="mr-1 hidden sm:inline">{event.event_time}</span>}{event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && <div className="px-1 text-[10px] font-medium text-gray-500 sm:px-2 sm:text-xs">+{dayEvents.length - 3} {t.more}</div>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
