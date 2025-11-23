import React, { useState, useMemo } from "react";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Plus, List, Grid3x3, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { toast } from "sonner";

import CalendarEventForm from "../components/calendar/CalendarEventForm";
import CalendarEventCard from "../components/calendar/CalendarEventCard";
import CalendarGrid from "../components/calendar/CalendarGrid";
import { 
  getCalendarEvents, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent 
} from "@/lib/calendarService";

const translations = {
  en: {
    title: "Our Calendar",
    subtitle: "Schedule dates, track anniversaries, and plan your life together",
    addEvent: "Add Event",
    listView: "List View",
    calendarView: "Calendar View",
    upcoming: "Upcoming Events",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    all: "All Events",
    noEvents: "No events scheduled",
    noEventsDesc: "Start planning your time together by adding your first event",
    eventAdded: "Event added successfully! 💕",
    eventUpdated: "Event updated successfully!",
    eventDeleted: "Event deleted successfully",
    filter: "Filter",
    types: {
      date: "Date",
      anniversary: "Anniversary",
      milestone: "Milestone",
      reminder: "Reminder",
      appointment: "Appointment",
      activity: "Activity",
      other: "Other"
    }
  },
  es: {
    title: "Nuestro Calendario",
    subtitle: "Programa citas, rastrea aniversarios y planifica tu vida juntos",
    addEvent: "Agregar Evento",
    listView: "Vista de Lista",
    calendarView: "Vista de Calendario",
    upcoming: "Próximos Eventos",
    today: "Hoy",
    thisWeek: "Esta Semana",
    thisMonth: "Este Mes",
    all: "Todos los Eventos",
    noEvents: "No hay eventos programados",
    noEventsDesc: "Comienza a planificar tu tiempo juntos agregando tu primer evento",
    eventAdded: "¡Evento agregado exitosamente! 💕",
    eventUpdated: "¡Evento actualizado exitosamente!",
    eventDeleted: "Evento eliminado exitosamente",
    filter: "Filtrar",
    types: {
      date: "Cita",
      anniversary: "Aniversario",
      milestone: "Hito",
      reminder: "Recordatorio",
      appointment: "Cita",
      activity: "Actividad",
      other: "Otro"
    }
  },
  fr: {
    title: "Notre Calendrier",
    subtitle: "Planifiez des rendez-vous, suivez les anniversaires et organisez votre vie ensemble",
    addEvent: "Ajouter un Événement",
    listView: "Vue Liste",
    calendarView: "Vue Calendrier",
    upcoming: "Événements à Venir",
    today: "Aujourd'hui",
    thisWeek: "Cette Semaine",
    thisMonth: "Ce Mois",
    all: "Tous les Événements",
    noEvents: "Aucun événement prévu",
    noEventsDesc: "Commencez à planifier votre temps ensemble en ajoutant votre premier événement",
    eventAdded: "Événement ajouté avec succès! 💕",
    eventUpdated: "Événement mis à jour avec succès!",
    eventDeleted: "Événement supprimé avec succès",
    filter: "Filtrer",
    types: {
      date: "Rendez-vous",
      anniversary: "Anniversaire",
      milestone: "Jalon",
      reminder: "Rappel",
      appointment: "Rendez-vous",
      activity: "Activité",
      other: "Autre"
    }
  },
  it: {
    title: "Il Nostro Calendario",
    subtitle: "Programma appuntamenti, tieni traccia degli anniversari e pianifica la tua vita insieme",
    addEvent: "Aggiungi Evento",
    listView: "Vista Elenco",
    calendarView: "Vista Calendario",
    upcoming: "Eventi Imminenti",
    today: "Oggi",
    thisWeek: "Questa Settimana",
    thisMonth: "Questo Mese",
    all: "Tutti gli Eventi",
    noEvents: "Nessun evento programmato",
    noEventsDesc: "Inizia a pianificare il tuo tempo insieme aggiungendo il tuo primo evento",
    eventAdded: "Evento aggiunto con successo! 💕",
    eventUpdated: "Evento aggiornato con successo!",
    eventDeleted: "Evento eliminato con successo",
    filter: "Filtra",
    types: {
      date: "Appuntamento",
      anniversary: "Anniversario",
      milestone: "Traguardo",
      reminder: "Promemoria",
      appointment: "Appuntamento",
      activity: "Attività",
      other: "Altro"
    }
  },
  de: {
    title: "Unser Kalender",
    subtitle: "Plane Dates, verfolge Jahrestage und organisiere euer gemeinsames Leben",
    addEvent: "Ereignis Hinzufügen",
    listView: "Listenansicht",
    calendarView: "Kalenderansicht",
    upcoming: "Bevorstehende Ereignisse",
    today: "Heute",
    thisWeek: "Diese Woche",
    thisMonth: "Dieser Monat",
    all: "Alle Ereignisse",
    noEvents: "Keine Ereignisse geplant",
    noEventsDesc: "Beginne eure gemeinsame Zeit zu planen, indem du dein erstes Ereignis hinzufügst",
    eventAdded: "Ereignis erfolgreich hinzugefügt! 💕",
    eventUpdated: "Ereignis erfolgreich aktualisiert!",
    eventDeleted: "Ereignis erfolgreich gelöscht",
    filter: "Filtern",
    types: {
      date: "Date",
      anniversary: "Jahrestag",
      milestone: "Meilenstein",
      reminder: "Erinnerung",
      appointment: "Termin",
      activity: "Aktivität",
      other: "Sonstiges"
    }
  }
};

export default function CouplesCalendar() {
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'list' or 'calendar'
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch calendar events from Supabase
  const { data: events, isLoading } = useQuery({
    queryKey: ['calendarEvents', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return getCalendarEvents(user.id, { sortBy: 'event_date', sortOrder: 'asc' });
    },
    enabled: !!user?.id,
    initialData: []
  });

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!user?.id) throw new Error('User not authenticated');
      return createCalendarEvent(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      setShowForm(false);
      setEditingEvent(null);
      toast.success(t.eventAdded);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create event');
    }
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return updateCalendarEvent(id, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      setShowForm(false);
      setEditingEvent(null);
      toast.success(t.eventUpdated);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update event');
    }
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      if (!user?.id) throw new Error('User not authenticated');
      return deleteCalendarEvent(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t.eventDeleted);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete event');
    }
  });

  const handleSubmit = (eventData) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: eventData });
    } else {
      createMutation.mutate(eventData);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthEnd = endOfMonth(now);

    return events.filter(event => {
      const eventDate = new Date(event.event_date);

      // Filter by time range
      if (selectedFilter === 'today' && !isSameDay(eventDate, today)) return false;
      if (selectedFilter === 'thisWeek' && (eventDate < today || eventDate > weekFromNow)) return false;
      if (selectedFilter === 'thisMonth' && (eventDate < today || eventDate > monthEnd)) return false;
      if (selectedFilter === 'upcoming' && eventDate < today) return false;

      return true;
    });
  }, [events, selectedFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <CalendarIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setSelectedFilter('all')}
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              className={selectedFilter === 'all' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
            >
              {t.all}
            </Button>
            <Button
              onClick={() => setSelectedFilter('today')}
              variant={selectedFilter === 'today' ? 'default' : 'outline'}
              className={selectedFilter === 'today' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
            >
              {t.today}
            </Button>
            <Button
              onClick={() => setSelectedFilter('thisWeek')}
              variant={selectedFilter === 'thisWeek' ? 'default' : 'outline'}
              className={selectedFilter === 'thisWeek' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
            >
              {t.thisWeek}
            </Button>
            <Button
              onClick={() => setSelectedFilter('thisMonth')}
              variant={selectedFilter === 'thisMonth' ? 'default' : 'outline'}
              className={selectedFilter === 'thisMonth' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
            >
              {t.thisMonth}
            </Button>
            <Button
              onClick={() => setSelectedFilter('upcoming')}
              variant={selectedFilter === 'upcoming' ? 'default' : 'outline'}
              className={selectedFilter === 'upcoming' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
            >
              {t.upcoming}
            </Button>
          </div>

          <div className="flex gap-2 md:ml-auto">
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
            >
              <List className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setViewMode('calendar')}
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="icon"
            >
              <Grid3x3 className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => {
                setEditingEvent(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t.addEvent}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <CalendarEventForm
              event={editingEvent}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingEvent(null);
              }}
              milestones={milestones}
            />
          )}
        </AnimatePresence>

        {viewMode === 'calendar' ? (
          <CalendarGrid
            currentMonth={currentMonth}
            events={events}
            onEventClick={handleEdit}
            onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
            onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
            onToday={() => setCurrentMonth(new Date())}
          />
        ) : (
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.noEvents}</h3>
                  <p className="text-gray-500 mb-6">{t.noEventsDesc}</p>
                  <Button
                    onClick={() => {
                      setEditingEvent(null);
                      setShowForm(true);
                    }}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {t.addEvent}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {filteredEvents.map((event, index) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </div>
  );
}