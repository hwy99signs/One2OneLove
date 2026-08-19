import React, { useState } from "react";
import { useLanguage } from "@/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Plus, List, Grid3x3, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addMonths, subMonths } from "date-fns";
import { toast } from "sonner";

import CalendarEventForm from "../components/calendar/CalendarEventForm";
import CalendarEventCard from "../components/calendar/CalendarEventCard";
import CalendarGrid from "../components/calendar/CalendarGrid";
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getTodayEvents,
  getThisWeekEvents,
  getThisMonthEvents,
  getUpcomingEventsFilter
} from "@/lib/calendarService";

const translations = {
  en: {
    title: "Our Calendar", subtitle: "Schedule dates, track anniversaries, and plan your life together",
    addEvent: "Add Event", listView: "List View", calendarView: "Calendar View", upcoming: "Upcoming Events", today: "Today", thisWeek: "This Week", thisMonth: "This Month", all: "All Events",
    noEvents: "No events scheduled", noEventsDesc: "Start planning your time together by adding your first event", loading: "Loading calendar events...",
    eventAdded: "Event added successfully! 💕", eventUpdated: "Event updated successfully!", eventDeleted: "Event deleted successfully",
    createError: "We could not create the event.", updateError: "We could not update the event.", deleteError: "We could not delete the event.", authRequired: "Please sign in to manage calendar events.", deleteConfirm: "Delete this event? This cannot be undone."
  },
  es: {
    title: "Nuestro Calendario", subtitle: "Programa citas, sigue aniversarios y planifica su vida juntos",
    addEvent: "Agregar Evento", listView: "Vista de Lista", calendarView: "Vista de Calendario", upcoming: "Próximos Eventos", today: "Hoy", thisWeek: "Esta Semana", thisMonth: "Este Mes", all: "Todos los Eventos",
    noEvents: "No hay eventos programados", noEventsDesc: "Comiencen a planificar su tiempo juntos agregando su primer evento", loading: "Cargando eventos del calendario...",
    eventAdded: "¡Evento agregado exitosamente! 💕", eventUpdated: "¡Evento actualizado exitosamente!", eventDeleted: "Evento eliminado exitosamente",
    createError: "No pudimos crear el evento.", updateError: "No pudimos actualizar el evento.", deleteError: "No pudimos eliminar el evento.", authRequired: "Inicia sesión para administrar eventos del calendario.", deleteConfirm: "¿Eliminar este evento? Esta acción no se puede deshacer."
  },
  fr: {
    title: "Notre Calendrier", subtitle: "Planifiez des rendez-vous, suivez les anniversaires et organisez votre vie ensemble",
    addEvent: "Ajouter un Événement", listView: "Vue Liste", calendarView: "Vue Calendrier", upcoming: "Événements à Venir", today: "Aujourd’hui", thisWeek: "Cette Semaine", thisMonth: "Ce Mois", all: "Tous les Événements",
    noEvents: "Aucun événement prévu", noEventsDesc: "Commencez à planifier votre temps ensemble en ajoutant votre premier événement", loading: "Chargement des événements du calendrier...",
    eventAdded: "Événement ajouté avec succès ! 💕", eventUpdated: "Événement mis à jour avec succès !", eventDeleted: "Événement supprimé avec succès",
    createError: "Nous n’avons pas pu créer l’événement.", updateError: "Nous n’avons pas pu mettre à jour l’événement.", deleteError: "Nous n’avons pas pu supprimer l’événement.", authRequired: "Connectez-vous pour gérer les événements du calendrier.", deleteConfirm: "Supprimer cet événement ? Cette action est irréversible."
  },
  it: {
    title: "Il Nostro Calendario", subtitle: "Programmate appuntamenti, tenete traccia degli anniversari e pianificate la vostra vita insieme",
    addEvent: "Aggiungi Evento", listView: "Vista Elenco", calendarView: "Vista Calendario", upcoming: "Eventi Imminenti", today: "Oggi", thisWeek: "Questa Settimana", thisMonth: "Questo Mese", all: "Tutti gli Eventi",
    noEvents: "Nessun evento programmato", noEventsDesc: "Iniziate a pianificare il vostro tempo insieme aggiungendo il primo evento", loading: "Caricamento degli eventi del calendario...",
    eventAdded: "Evento aggiunto con successo! 💕", eventUpdated: "Evento aggiornato con successo!", eventDeleted: "Evento eliminato con successo",
    createError: "Non è stato possibile creare l’evento.", updateError: "Non è stato possibile aggiornare l’evento.", deleteError: "Non è stato possibile eliminare l’evento.", authRequired: "Accedi per gestire gli eventi del calendario.", deleteConfirm: "Eliminare questo evento? L’azione non può essere annullata."
  },
  de: {
    title: "Unser Kalender", subtitle: "Plant Dates, verfolgt Jahrestage und organisiert euer gemeinsames Leben",
    addEvent: "Ereignis Hinzufügen", listView: "Listenansicht", calendarView: "Kalenderansicht", upcoming: "Bevorstehende Ereignisse", today: "Heute", thisWeek: "Diese Woche", thisMonth: "Dieser Monat", all: "Alle Ereignisse",
    noEvents: "Keine Ereignisse geplant", noEventsDesc: "Beginnt eure gemeinsame Zeit zu planen, indem ihr euer erstes Ereignis hinzufügt", loading: "Kalenderereignisse werden geladen...",
    eventAdded: "Ereignis erfolgreich hinzugefügt! 💕", eventUpdated: "Ereignis erfolgreich aktualisiert!", eventDeleted: "Ereignis erfolgreich gelöscht",
    createError: "Das Ereignis konnte nicht erstellt werden.", updateError: "Das Ereignis konnte nicht aktualisiert werden.", deleteError: "Das Ereignis konnte nicht gelöscht werden.", authRequired: "Bitte meldet euch an, um Kalenderereignisse zu verwalten.", deleteConfirm: "Dieses Ereignis löschen? Dies kann nicht rückgängig gemacht werden."
  }
};

export default function CouplesCalendar() {
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendarEvents', user?.id, selectedFilter],
    queryFn: () => {
      if (!user?.id) return [];
      switch (selectedFilter) {
        case 'today': return getTodayEvents(user.id);
        case 'thisWeek': return getThisWeekEvents(user.id);
        case 'thisMonth': return getThisMonthEvents(user.id);
        case 'upcoming': return getUpcomingEventsFilter(user.id);
        default: return getCalendarEvents(user.id, { sortBy: 'event_date', sortOrder: 'asc' });
      }
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      return createCalendarEvent(user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      setShowForm(false);
      setEditingEvent(null);
      toast.success(t.eventAdded);
    },
    onError: (error) => toast.error(error?.message === 'AUTH_REQUIRED' ? t.authRequired : t.createError)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      return updateCalendarEvent(id, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      setShowForm(false);
      setEditingEvent(null);
      toast.success(t.eventUpdated);
    },
    onError: (error) => toast.error(error?.message === 'AUTH_REQUIRED' ? t.authRequired : t.updateError)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      return deleteCalendarEvent(id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(t.eventDeleted);
    },
    onError: (error) => toast.error(error?.message === 'AUTH_REQUIRED' ? t.authRequired : t.deleteError)
  });

  const handleSubmit = (eventData) => {
    if (!user?.id) {
      toast.error(t.authRequired);
      return;
    }
    if (editingEvent) updateMutation.mutate({ id: editingEvent.id, data: eventData });
    else createMutation.mutate(eventData);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t.deleteConfirm)) deleteMutation.mutate(id);
  };

  const filters = [
    ['all', t.all],
    ['today', t.today],
    ['thisWeek', t.thisWeek],
    ['thisMonth', t.thisMonth],
    ['upcoming', t.upcoming]
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl">
            <CalendarIcon className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto max-w-3xl text-lg text-gray-600 md:text-xl">{t.subtitle}</p>
        </motion.header>

        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          <div className="flex flex-wrap gap-2">
            {filters.map(([value, label]) => (
              <Button key={value} type="button" onClick={() => setSelectedFilter(value)} variant={selectedFilter === value ? 'default' : 'outline'} className={selectedFilter === value ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}>{label}</Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 md:ml-auto">
            <Button type="button" onClick={() => setViewMode('list')} variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" aria-label={t.listView} title={t.listView}>
              <List className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button type="button" onClick={() => setViewMode('calendar')} variant={viewMode === 'calendar' ? 'default' : 'outline'} size="icon" aria-label={t.calendarView} title={t.calendarView}>
              <Grid3x3 className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Button type="button" onClick={() => { setEditingEvent(null); setShowForm(true); }} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              <Plus className="mr-2 h-5 w-5" aria-hidden="true" />{t.addEvent}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showForm && <CalendarEventForm event={editingEvent} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingEvent(null); }} />}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-600" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.loading}
          </div>
        ) : viewMode === 'calendar' ? (
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
            {events.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <CalendarIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" aria-hidden="true" />
                  <h2 className="mb-2 text-xl font-semibold text-gray-600">{t.noEvents}</h2>
                  <p className="mb-6 text-gray-500">{t.noEventsDesc}</p>
                  <Button type="button" onClick={() => { setEditingEvent(null); setShowForm(true); }} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                    <Plus className="mr-2 h-5 w-5" aria-hidden="true" />{t.addEvent}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {events.map((event, index) => <CalendarEventCard key={event.id} event={event} onEdit={handleEdit} onDelete={handleDelete} index={index} />)}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
