import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Trash2, Loader2, Bell, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    addGoal: "Add Goal",
    editGoal: "Edit Goal",
    goalTitle: "Goal Title",
    titlePlaceholder: "e.g., Have weekly date nights",
    description: "Description",
    descriptionPlaceholder: "Describe your goal and why it's important...",
    category: "Category",
    targetDate: "Target Date",
    partnerEmail: "Partner's Email (Optional)",
    partnerEmailPlaceholder: "partner@example.com",
    actionSteps: "Action Steps",
    addStep: "Add Step",
    stepPlaceholder: "e.g., Plan date night every Friday",
    reminders: "Text Reminders",
    enableReminders: "Enable SMS Reminders",
    reminderPhone: "Phone Number for Reminders",
    reminderPhonePlaceholder: "(555) 123-4567",
    reminderFrequency: "Reminder Frequency",
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Every 2 Weeks",
    cancel: "Cancel",
    save: "Save Goal",
    close: "Close goal form",
    removeStep: "Remove action step",
    categories: {
      communication: "Communication",
      quality_time: "Quality Time",
      intimacy: "Intimacy",
      personal_growth: "Personal Growth",
      financial: "Financial",
      family: "Family",
      health: "Health & Wellness",
      adventure: "Adventure & Travel",
      home: "Home & Living",
      career: "Career & Goals"
    }
  },
  es: {
    addGoal: "Agregar Meta",
    editGoal: "Editar Meta",
    goalTitle: "Título de la Meta",
    titlePlaceholder: "ej., Tener citas semanales",
    description: "Descripción",
    descriptionPlaceholder: "Describe tu meta y por qué es importante...",
    category: "Categoría",
    targetDate: "Fecha Objetivo",
    partnerEmail: "Email de Pareja (Opcional)",
    partnerEmailPlaceholder: "pareja@ejemplo.com",
    actionSteps: "Pasos de Acción",
    addStep: "Agregar Paso",
    stepPlaceholder: "ej., Planear cita cada viernes",
    reminders: "Recordatorios de Texto",
    enableReminders: "Habilitar Recordatorios SMS",
    reminderPhone: "Número de Teléfono para Recordatorios",
    reminderPhonePlaceholder: "(555) 123-4567",
    reminderFrequency: "Frecuencia de Recordatorios",
    daily: "Diario",
    weekly: "Semanal",
    biweekly: "Cada 2 Semanas",
    cancel: "Cancelar",
    save: "Guardar Meta",
    close: "Cerrar formulario de meta",
    removeStep: "Eliminar paso de acción",
    categories: {
      communication: "Comunicación",
      quality_time: "Tiempo de Calidad",
      intimacy: "Intimidad",
      personal_growth: "Crecimiento Personal",
      financial: "Financiero",
      family: "Familia",
      health: "Salud y Bienestar",
      adventure: "Aventura y Viajes",
      home: "Hogar y Vida",
      career: "Carrera y Metas"
    }
  },
  fr: {
    addGoal: "Ajouter Objectif",
    editGoal: "Modifier Objectif",
    goalTitle: "Titre de l'Objectif",
    titlePlaceholder: "ex., Avoir des rendez-vous hebdomadaires",
    description: "Description",
    descriptionPlaceholder: "Décrivez votre objectif et pourquoi c'est important...",
    category: "Catégorie",
    targetDate: "Date Cible",
    partnerEmail: "Email du Partenaire (Optionnel)",
    partnerEmailPlaceholder: "partenaire@exemple.com",
    actionSteps: "Étapes d'Action",
    addStep: "Ajouter Étape",
    stepPlaceholder: "ex., Planifier rendez-vous chaque vendredi",
    reminders: "Rappels par Texte",
    enableReminders: "Activer Rappels SMS",
    reminderPhone: "Numéro pour Rappels",
    reminderPhonePlaceholder: "(555) 123-4567",
    reminderFrequency: "Fréquence des Rappels",
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    biweekly: "Toutes les 2 Semaines",
    cancel: "Annuler",
    save: "Sauvegarder Objectif",
    close: "Fermer le formulaire d’objectif",
    removeStep: "Supprimer l’étape d’action",
    categories: {
      communication: "Communication",
      quality_time: "Temps de Qualité",
      intimacy: "Intimité",
      personal_growth: "Croissance Personnelle",
      financial: "Financier",
      family: "Famille",
      health: "Santé et Bien-être",
      adventure: "Aventure et Voyage",
      home: "Maison et Vie",
      career: "Carrière et Objectifs"
    }
  },
  it: {
    addGoal: "Aggiungi Obiettivo",
    editGoal: "Modifica Obiettivo",
    goalTitle: "Titolo dell'Obiettivo",
    titlePlaceholder: "es., Avere appuntamenti settimanali",
    description: "Descrizione",
    descriptionPlaceholder: "Descrivi il tuo obiettivo e perché è importante...",
    category: "Categoria",
    targetDate: "Data Obiettivo",
    partnerEmail: "Email del Partner (Opzionale)",
    partnerEmailPlaceholder: "partner@esempio.com",
    actionSteps: "Passi d'Azione",
    addStep: "Aggiungi Passo",
    stepPlaceholder: "es., Pianificare appuntamento ogni venerdì",
    reminders: "Promemoria Testuali",
    enableReminders: "Abilita Promemoria SMS",
    reminderPhone: "Numero per Promemoria",
    reminderPhonePlaceholder: "(555) 123-4567",
    reminderFrequency: "Frequenza Promemoria",
    daily: "Giornaliero",
    weekly: "Settimanale",
    biweekly: "Ogni 2 Settimane",
    cancel: "Annulla",
    save: "Salva Obiettivo",
    close: "Chiudi il modulo dell’obiettivo",
    removeStep: "Rimuovi passaggio d’azione",
    categories: {
      communication: "Comunicazione",
      quality_time: "Tempo di Qualità",
      intimacy: "Intimità",
      personal_growth: "Crescita Personale",
      financial: "Finanziario",
      family: "Famiglia",
      health: "Salute e Benessere",
      adventure: "Avventura e Viaggio",
      home: "Casa e Vita",
      career: "Carriera e Obiettivi"
    }
  },
  de: {
    addGoal: "Ziel Hinzufügen",
    editGoal: "Ziel Bearbeiten",
    goalTitle: "Zieltitel",
    titlePlaceholder: "z.B., Wöchentliche Date-Abende haben",
    description: "Beschreibung",
    descriptionPlaceholder: "Beschreibe dein Ziel und warum es wichtig ist...",
    category: "Kategorie",
    targetDate: "Zieldatum",
    partnerEmail: "Partner E-Mail (Optional)",
    partnerEmailPlaceholder: "partner@beispiel.com",
    actionSteps: "Aktionsschritte",
    addStep: "Schritt Hinzufügen",
    stepPlaceholder: "z.B., Date-Abend jeden Freitag planen",
    reminders: "Text-Erinnerungen",
    enableReminders: "SMS-Erinnerungen Aktivieren",
    reminderPhone: "Telefonnummer für Erinnerungen",
    reminderPhonePlaceholder: "(555) 123-4567",
    reminderFrequency: "Erinnerungsfrequenz",
    daily: "Täglich",
    weekly: "Wöchentlich",
    biweekly: "Alle 2 Wochen",
    cancel: "Abbrechen",
    save: "Ziel Speichern",
    close: "Zielformular schließen",
    removeStep: "Aktionsschritt entfernen",
    categories: {
      communication: "Kommunikation",
      quality_time: "Qualitätszeit",
      intimacy: "Intimität",
      personal_growth: "Persönliches Wachstum",
      financial: "Finanziell",
      family: "Familie",
      health: "Gesundheit & Wellness",
      adventure: "Abenteuer & Reisen",
      home: "Zuhause & Leben",
      career: "Karriere & Ziele"
    }
  }
};

function localDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export default function GoalForm({ goal, onSubmit, onCancel, isLoading }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [formData, setFormData] = useState(goal || {
    title: '',
    description: '',
    category: 'communication',
    target_date: '',
    partner_email: '',
    action_steps: [''],
    progress: 0,
    status: 'in_progress',
    reminder_enabled: false,
    reminder_phone: '',
    reminder_frequency: 'weekly'
  });

  const handleAddStep = () => {
    setFormData({
      ...formData,
      action_steps: [...formData.action_steps, '']
    });
  };

  const handleRemoveStep = (index) => {
    setFormData({
      ...formData,
      action_steps: formData.action_steps.filter((_, i) => i !== index)
    });
  };

  const handleStepChange = (index, value) => {
    const newSteps = [...formData.action_steps];
    newSteps[index] = value;
    setFormData({ ...formData, action_steps: newSteps });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedSteps = formData.action_steps.filter(step => step.trim() !== '');
    onSubmit({ ...formData, action_steps: cleanedSteps });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-form-title"
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 id="goal-form-title" className="text-2xl font-bold text-gray-900">
              {goal ? t.editGoal : t.addGoal}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              aria-label={t.close}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="goal-title" className="block text-sm font-medium text-gray-700 mb-2">
              {t.goalTitle}
            </label>
            <Input
              id="goal-title"
              placeholder={t.titlePlaceholder}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="h-12"
            />
          </div>

          <div>
            <label htmlFor="goal-description" className="block text-sm font-medium text-gray-700 mb-2">
              {t.description}
            </label>
            <Textarea
              id="goal-description"
              placeholder={t.descriptionPlaceholder}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="goal-category" className="block text-sm font-medium text-gray-700 mb-2">
                {t.category}
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="goal-category" aria-label={t.category} className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t.categories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="goal-target-date" className="block text-sm font-medium text-gray-700 mb-2">
                {t.targetDate}
              </label>
              <Input
                id="goal-target-date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                min={localDateInputValue()}
                required
                className="h-12"
              />
            </div>
          </div>

          <div>
            <label htmlFor="goal-partner-email" className="block text-sm font-medium text-gray-700 mb-2">
              {t.partnerEmail}
            </label>
            <Input
              id="goal-partner-email"
              type="email"
              placeholder={t.partnerEmailPlaceholder}
              value={formData.partner_email}
              onChange={(e) => setFormData({ ...formData, partner_email: e.target.value })}
              className="h-12"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.actionSteps}
            </label>
            <div className="space-y-2">
              {formData.action_steps.map((step, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    aria-label={`${t.actionSteps} ${index + 1}`}
                    placeholder={t.stepPlaceholder}
                    value={step}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {formData.action_steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStep(index)}
                      aria-label={`${t.removeStep} ${index + 1}`}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddStep}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.addStep}
              </Button>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">{t.reminders}</h3>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminder_enabled}
                  onChange={(e) => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">{t.enableReminders}</span>
              </label>

              {formData.reminder_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <div>
                    <label htmlFor="goal-reminder-phone" className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      {t.reminderPhone}
                    </label>
                    <Input
                      id="goal-reminder-phone"
                      type="tel"
                      placeholder={t.reminderPhonePlaceholder}
                      value={formData.reminder_phone}
                      onChange={(e) => setFormData({ ...formData, reminder_phone: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div>
                    <label htmlFor="goal-reminder-frequency" className="block text-sm font-medium text-gray-700 mb-2">
                      {t.reminderFrequency}
                    </label>
                    <Select
                      value={formData.reminder_frequency}
                      onValueChange={(value) => setFormData({ ...formData, reminder_frequency: value })}
                    >
                      <SelectTrigger id="goal-reminder-frequency" aria-label={t.reminderFrequency} className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t.daily}</SelectItem>
                        <SelectItem value="weekly">{t.weekly}</SelectItem>
                        <SelectItem value="biweekly">{t.biweekly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 h-12"
            >
              {t.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t.save}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}