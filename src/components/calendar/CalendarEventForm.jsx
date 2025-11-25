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
    addEvent: "Add New Event",
    editEvent: "Edit Event",
    title: "Event Title",
    titlePlaceholder: "e.g., Date Night at Italian Restaurant",
    description: "Description",
    descriptionPlaceholder: "Add details about your event...",
    date: "Date",
    time: "Time",
    type: "Event Type",
    location: "Location",
    locationPlaceholder: "e.g., Restaurant Name, Address",
    notes: "Notes",
    reminder: "Reminder",
    reminderDays: "Days Before",
    recurring: "Recurring Event",
    recurrencePattern: "Repeat",
    cancel: "Cancel",
    save: "Save Event",
    types: {
      date: "Date",
      anniversary: "Anniversary",
      milestone: "Milestone",
      reminder: "Reminder",
      appointment: "Appointment",
      activity: "Activity",
      other: "Other"
    },
    patterns: {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
      yearly: "Yearly"
    }
  },
  es: {
    addEvent: "Agregar Nuevo Evento",
    editEvent: "Editar Evento",
    title: "Título del Evento",
    titlePlaceholder: "ej., Noche de Cita en Restaurante Italiano",
    description: "Descripción",
    descriptionPlaceholder: "Agrega detalles sobre tu evento...",
    date: "Fecha",
    time: "Hora",
    type: "Tipo de Evento",
    location: "Ubicación",
    locationPlaceholder: "ej., Nombre del Restaurante, Dirección",
    notes: "Notas",
    reminder: "Recordatorio",
    reminderDays: "Días Antes",
    recurring: "Evento Recurrente",
    recurrencePattern: "Repetir",
    cancel: "Cancelar",
    save: "Guardar Evento"
  },
  fr: {
    addEvent: "Ajouter un Nouvel Événement",
    editEvent: "Modifier l'Événement",
    title: "Titre de l'Événement",
    titlePlaceholder: "ex., Soirée au Restaurant Italien",
    description: "Description",
    descriptionPlaceholder: "Ajoutez des détails sur votre événement...",
    date: "Date",
    time: "Heure",
    type: "Type d'Événement",
    location: "Lieu",
    locationPlaceholder: "ex., Nom du Restaurant, Adresse",
    notes: "Notes",
    reminder: "Rappel",
    reminderDays: "Jours Avant",
    recurring: "Événement Récurrent",
    recurrencePattern: "Répéter",
    cancel: "Annuler",
    save: "Enregistrer l'Événement"
  },
  it: {
    addEvent: "Aggiungi Nuovo Evento",
    editEvent: "Modifica Evento",
    title: "Titolo Evento",
    titlePlaceholder: "es., Serata Romantica al Ristorante Italiano",
    description: "Descrizione",
    descriptionPlaceholder: "Aggiungi dettagli sul tuo evento...",
    date: "Data",
    time: "Ora",
    type: "Tipo di Evento",
    location: "Luogo",
    locationPlaceholder: "es., Nome del Ristorante, Indirizzo",
    notes: "Note",
    reminder: "Promemoria",
    reminderDays: "Giorni Prima",
    recurring: "Evento Ricorrente",
    recurrencePattern: "Ripeti",
    cancel: "Annulla",
    save: "Salva Evento"
  },
  de: {
    addEvent: "Neues Ereignis Hinzufügen",
    editEvent: "Ereignis Bearbeiten",
    title: "Ereignistitel",
    titlePlaceholder: "z.B., Date-Abend im Italienischen Restaurant",
    description: "Beschreibung",
    descriptionPlaceholder: "Füge Details zu deinem Ereignis hinzu...",
    date: "Datum",
    time: "Uhrzeit",
    type: "Ereignistyp",
    location: "Ort",
    locationPlaceholder: "z.B., Restaurantname, Adresse",
    notes: "Notizen",
    reminder: "Erinnerung",
    reminderDays: "Tage Vorher",
    recurring: "Wiederkehrendes Ereignis",
    recurrencePattern: "Wiederholen",
    cancel: "Abbrechen",
    save: "Ereignis Speichern"
  }
};

export default function CalendarEventForm({ event, onSubmit, onCancel, milestones = [] }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📝 Form submit triggered with data:', formData);
    
    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    
    if (!formData.event_date) {
      toast.error('Please select a date');
      return;
    }
    
    // Clean up form data - convert empty strings to null for optional fields
    const cleanedData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      location: formData.location?.trim() || null,
      notes: formData.notes?.trim() || null,
      event_time: formData.event_time || null,
      recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
    };
    
    console.log('📝 Cleaned form data being submitted:', cleanedData);
    console.log('📝 onSubmit function:', onSubmit);
    
    // Submit the cleaned form data
    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit(cleanedData);
    } else {
      console.error('❌ onSubmit is not a function:', onSubmit);
      toast.error('Form submission error. Please refresh the page.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
              {event ? t.editEvent : t.addEvent}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.title} *
                </label>
                <Input
                  placeholder={t.titlePlaceholder}
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  {t.date} *
                </label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4" />
                  {t.time}
                </label>
                <Input
                  type="time"
                  value={formData.event_time}
                  onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.type} *
                </label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({...formData, event_type: value})}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">{t.types?.date || "Date"}</SelectItem>
                    <SelectItem value="anniversary">{t.types?.anniversary || "Anniversary"}</SelectItem>
                    <SelectItem value="milestone">{t.types?.milestone || "Milestone"}</SelectItem>
                    <SelectItem value="reminder">{t.types?.reminder || "Reminder"}</SelectItem>
                    <SelectItem value="appointment">{t.types?.appointment || "Appointment"}</SelectItem>
                    <SelectItem value="activity">{t.types?.activity || "Activity"}</SelectItem>
                    <SelectItem value="other">{t.types?.other || "Other"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  {t.location}
                </label>
                <Input
                  placeholder={t.locationPlaceholder}
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="h-12"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.description}
                </label>
                <Textarea
                  placeholder={t.descriptionPlaceholder}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="h-24"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="reminder"
                  checked={formData.reminder_enabled}
                  onChange={(e) => setFormData({...formData, reminder_enabled: e.target.checked})}
                  className="w-4 h-4 text-pink-600"
                />
                <label htmlFor="reminder" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Bell className="w-4 h-4" />
                  {t.reminder}
                </label>
                {formData.reminder_enabled && (
                  <Input
                    type="number"
                    min="1"
                    value={formData.reminder_days_before}
                    onChange={(e) => setFormData({...formData, reminder_days_before: parseInt(e.target.value)})}
                    className="w-20 h-10"
                  />
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                  className="w-4 h-4 text-pink-600"
                />
                <label htmlFor="recurring" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Repeat className="w-4 h-4" />
                  {t.recurring}
                </label>
                {formData.is_recurring && (
                  <Select
                    value={formData.recurrence_pattern}
                    onValueChange={(value) => setFormData({...formData, recurrence_pattern: value})}
                  >
                    <SelectTrigger className="w-32 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t.patterns?.daily || "Daily"}</SelectItem>
                      <SelectItem value="weekly">{t.patterns?.weekly || "Weekly"}</SelectItem>
                      <SelectItem value="monthly">{t.patterns?.monthly || "Monthly"}</SelectItem>
                      <SelectItem value="yearly">{t.patterns?.yearly || "Yearly"}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {t.save}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}