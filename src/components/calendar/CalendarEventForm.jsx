import React, { useState } from "react";
import { useLanguage } from "@/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Bell, Repeat, X } from "lucide-react";
import { toast } from "sonner";

const translations = {
  en: {
    addEvent: "Add New Event", editEvent: "Edit Event", close: "Close event form",
    title: "Event Title", titlePlaceholder: "e.g., Date night at our favorite restaurant",
    description: "Description", descriptionPlaceholder: "Add details about your event...",
    date: "Date", time: "Time", type: "Event Type", location: "Location", locationPlaceholder: "e.g., Restaurant name or address",
    reminder: "Reminder", reminderDays: "Days Before", recurring: "Recurring Event", recurrencePattern: "Repeat",
    cancel: "Cancel", save: "Save Event", titleRequired: "Please enter an event title.", dateRequired: "Please select a date.", submitError: "The event could not be submitted. Please try again.",
    types: { date: "Date", anniversary: "Anniversary", milestone: "Milestone", reminder: "Reminder", appointment: "Appointment", activity: "Activity", other: "Other" },
    patterns: { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" }
  },
  es: {
    addEvent: "Agregar Nuevo Evento", editEvent: "Editar Evento", close: "Cerrar formulario del evento",
    title: "Título del Evento", titlePlaceholder: "ej., Noche de cita en nuestro restaurante favorito",
    description: "Descripción", descriptionPlaceholder: "Agrega detalles sobre tu evento...",
    date: "Fecha", time: "Hora", type: "Tipo de Evento", location: "Ubicación", locationPlaceholder: "ej., Nombre o dirección del restaurante",
    reminder: "Recordatorio", reminderDays: "Días Antes", recurring: "Evento Recurrente", recurrencePattern: "Repetir",
    cancel: "Cancelar", save: "Guardar Evento", titleRequired: "Ingresa un título para el evento.", dateRequired: "Selecciona una fecha.", submitError: "No se pudo enviar el evento. Inténtalo de nuevo.",
    types: { date: "Cita", anniversary: "Aniversario", milestone: "Hito", reminder: "Recordatorio", appointment: "Compromiso", activity: "Actividad", other: "Otro" },
    patterns: { daily: "Diario", weekly: "Semanal", monthly: "Mensual", yearly: "Anual" }
  },
  fr: {
    addEvent: "Ajouter un Nouvel Événement", editEvent: "Modifier l’Événement", close: "Fermer le formulaire de l’événement",
    title: "Titre de l’Événement", titlePlaceholder: "ex., Soirée dans notre restaurant préféré",
    description: "Description", descriptionPlaceholder: "Ajoutez des détails sur votre événement...",
    date: "Date", time: "Heure", type: "Type d’Événement", location: "Lieu", locationPlaceholder: "ex., Nom ou adresse du restaurant",
    reminder: "Rappel", reminderDays: "Jours Avant", recurring: "Événement Récurrent", recurrencePattern: "Répéter",
    cancel: "Annuler", save: "Enregistrer l’Événement", titleRequired: "Saisissez un titre pour l’événement.", dateRequired: "Sélectionnez une date.", submitError: "L’événement n’a pas pu être envoyé. Réessayez.",
    types: { date: "Rendez-vous", anniversary: "Anniversaire", milestone: "Jalon", reminder: "Rappel", appointment: "Rendez-vous Planifié", activity: "Activité", other: "Autre" },
    patterns: { daily: "Quotidien", weekly: "Hebdomadaire", monthly: "Mensuel", yearly: "Annuel" }
  },
  it: {
    addEvent: "Aggiungi Nuovo Evento", editEvent: "Modifica Evento", close: "Chiudi modulo dell’evento",
    title: "Titolo Evento", titlePlaceholder: "es., Serata nel nostro ristorante preferito",
    description: "Descrizione", descriptionPlaceholder: "Aggiungi dettagli sul tuo evento...",
    date: "Data", time: "Ora", type: "Tipo di Evento", location: "Luogo", locationPlaceholder: "es., Nome o indirizzo del ristorante",
    reminder: "Promemoria", reminderDays: "Giorni Prima", recurring: "Evento Ricorrente", recurrencePattern: "Ripeti",
    cancel: "Annulla", save: "Salva Evento", titleRequired: "Inserisci un titolo per l’evento.", dateRequired: "Seleziona una data.", submitError: "Non è stato possibile inviare l’evento. Riprova.",
    types: { date: "Appuntamento", anniversary: "Anniversario", milestone: "Traguardo", reminder: "Promemoria", appointment: "Impegno", activity: "Attività", other: "Altro" },
    patterns: { daily: "Giornaliero", weekly: "Settimanale", monthly: "Mensile", yearly: "Annuale" }
  },
  de: {
    addEvent: "Neues Ereignis Hinzufügen", editEvent: "Ereignis Bearbeiten", close: "Ereignisformular schließen",
    title: "Ereignistitel", titlePlaceholder: "z. B. Date-Abend in unserem Lieblingsrestaurant",
    description: "Beschreibung", descriptionPlaceholder: "Füge Details zu eurem Ereignis hinzu...",
    date: "Datum", time: "Uhrzeit", type: "Ereignistyp", location: "Ort", locationPlaceholder: "z. B. Restaurantname oder Adresse",
    reminder: "Erinnerung", reminderDays: "Tage Vorher", recurring: "Wiederkehrendes Ereignis", recurrencePattern: "Wiederholen",
    cancel: "Abbrechen", save: "Ereignis Speichern", titleRequired: "Bitte gib einen Ereignistitel ein.", dateRequired: "Bitte wähle ein Datum.", submitError: "Das Ereignis konnte nicht gespeichert werden. Bitte versuche es erneut.",
    types: { date: "Date", anniversary: "Jahrestag", milestone: "Meilenstein", reminder: "Erinnerung", appointment: "Termin", activity: "Aktivität", other: "Sonstiges" },
    patterns: { daily: "Täglich", weekly: "Wöchentlich", monthly: "Monatlich", yearly: "Jährlich" }
  }
};

export default function CalendarEventForm({ event, onSubmit, onCancel }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [formData, setFormData] = useState(event || {
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    event_type: "date",
    location: "",
    reminder_enabled: true,
    reminder_days_before: 1,
    is_recurring: false,
    recurrence_pattern: "monthly",
    notes: "",
    color: "pink"
  });

  const handleSubmit = (eventObject) => {
    eventObject.preventDefault();
    eventObject.stopPropagation();

    if (!formData.title?.trim()) {
      toast.error(t.titleRequired);
      return;
    }
    if (!formData.event_date) {
      toast.error(t.dateRequired);
      return;
    }
    if (typeof onSubmit !== 'function') {
      toast.error(t.submitError);
      return;
    }

    onSubmit({
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      location: formData.location?.trim() || null,
      notes: formData.notes?.trim() || null,
      event_time: formData.event_time || null,
      reminder_days_before: formData.reminder_enabled ? Math.max(Number(formData.reminder_days_before) || 1, 1) : null,
      recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-form-title"
      >
        <div className="sticky top-0 rounded-t-3xl border-b border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id="calendar-event-form-title" className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
              {event ? t.editEvent : t.addEvent}
            </h2>
            <button type="button" onClick={onCancel} aria-label={t.close} className="text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                {t.title} *
                <Input className="mt-2 h-12" placeholder={t.titlePlaceholder} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4" aria-hidden="true" />{t.date} *</span>
                <Input className="mt-2 h-12" type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} required />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4" aria-hidden="true" />{t.time}</span>
                <Input className="mt-2 h-12" type="time" value={formData.event_time} onChange={(e) => setFormData({ ...formData, event_time: e.target.value })} />
              </label>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="calendar-event-type">{t.type} *</label>
                <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                  <SelectTrigger id="calendar-event-type" className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(t.types).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <label className="block text-sm font-medium text-gray-700">
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden="true" />{t.location}</span>
                <Input className="mt-2 h-12" placeholder={t.locationPlaceholder} value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              </label>

              <label className="block text-sm font-medium text-gray-700 md:col-span-2">
                {t.description}
                <Textarea className="mt-2 min-h-24" placeholder={t.descriptionPlaceholder} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </label>

              <div className="rounded-2xl border border-gray-200 p-4">
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={formData.reminder_enabled} onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })} className="h-4 w-4 text-pink-600" />
                  <Bell className="h-4 w-4" aria-hidden="true" />{t.reminder}
                </label>
                {formData.reminder_enabled && (
                  <label className="mt-3 block text-xs font-medium text-gray-600">
                    {t.reminderDays}
                    <Input type="number" min="1" value={formData.reminder_days_before} onChange={(e) => setFormData({ ...formData, reminder_days_before: e.target.value })} className="mt-1 w-24" />
                  </label>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={formData.is_recurring} onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })} className="h-4 w-4 text-pink-600" />
                  <Repeat className="h-4 w-4" aria-hidden="true" />{t.recurring}
                </label>
                {formData.is_recurring && (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-gray-600" htmlFor="calendar-recurrence">{t.recurrencePattern}</label>
                    <Select value={formData.recurrence_pattern} onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}>
                      <SelectTrigger id="calendar-recurrence"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(t.patterns).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">{t.cancel}</Button>
              <Button type="submit" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">{t.save}</Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
