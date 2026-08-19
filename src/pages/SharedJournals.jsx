import React, { useState } from "react";
import { useLanguage } from "@/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import JournalForm from "../components/activities/JournalForm";
import JournalEntry from "../components/activities/JournalEntry";
import * as journalService from "@/lib/journalService";

const translations = {
  en: {
    title: "Shared Journals",
    subtitle: "Write together, share thoughts, and document your relationship journey",
    back: "Back to Activities",
    addEntry: "Add Entry",
    all: "All",
    loading: "Loading journal entries...",
    noEntries: "No journal entries yet",
    startWriting: "Start writing your first entry together",
    deleteConfirm: "Delete this journal entry? This cannot be undone.",
    createError: "We could not create the journal entry.",
    updateError: "We could not update the journal entry.",
    deleteError: "We could not delete the journal entry.",
    moods: { happy: "Happy", grateful: "Grateful", reflective: "Reflective", excited: "Excited", peaceful: "Peaceful", challenged: "Challenged", loving: "Loving" }
  },
  es: {
    title: "Diarios Compartidos",
    subtitle: "Escriban juntos, compartan pensamientos y documenten el viaje de su relación",
    back: "Volver a Actividades",
    addEntry: "Agregar Entrada",
    all: "Todo",
    loading: "Cargando entradas del diario...",
    noEntries: "Aún no hay entradas de diario",
    startWriting: "Comiencen a escribir juntos su primera entrada",
    deleteConfirm: "¿Eliminar esta entrada del diario? Esta acción no se puede deshacer.",
    createError: "No pudimos crear la entrada del diario.",
    updateError: "No pudimos actualizar la entrada del diario.",
    deleteError: "No pudimos eliminar la entrada del diario.",
    moods: { happy: "Feliz", grateful: "Agradecido", reflective: "Reflexivo", excited: "Emocionado", peaceful: "En Paz", challenged: "Desafiado", loving: "Cariñoso" }
  },
  fr: {
    title: "Journaux Partagés",
    subtitle: "Écrivez ensemble, partagez vos pensées et documentez votre parcours relationnel",
    back: "Retour aux Activités",
    addEntry: "Ajouter une Entrée",
    all: "Toutes",
    loading: "Chargement des entrées du journal...",
    noEntries: "Aucune entrée de journal pour le moment",
    startWriting: "Commencez à écrire ensemble votre première entrée",
    deleteConfirm: "Supprimer cette entrée du journal ? Cette action est irréversible.",
    createError: "Nous n’avons pas pu créer l’entrée du journal.",
    updateError: "Nous n’avons pas pu mettre à jour l’entrée du journal.",
    deleteError: "Nous n’avons pas pu supprimer l’entrée du journal.",
    moods: { happy: "Heureux", grateful: "Reconnaissant", reflective: "Réfléchi", excited: "Enthousiaste", peaceful: "Paisible", challenged: "Mis au Défi", loving: "Aimant" }
  },
  it: {
    title: "Diari Condivisi",
    subtitle: "Scrivete insieme, condividete pensieri e documentate il vostro percorso di coppia",
    back: "Torna alle Attività",
    addEntry: "Aggiungi Voce",
    all: "Tutti",
    loading: "Caricamento delle voci del diario...",
    noEntries: "Nessuna voce del diario per ora",
    startWriting: "Iniziate a scrivere insieme la vostra prima voce",
    deleteConfirm: "Eliminare questa voce del diario? L’azione non può essere annullata.",
    createError: "Non è stato possibile creare la voce del diario.",
    updateError: "Non è stato possibile aggiornare la voce del diario.",
    deleteError: "Non è stato possibile eliminare la voce del diario.",
    moods: { happy: "Felice", grateful: "Grato", reflective: "Riflessivo", excited: "Entusiasta", peaceful: "Sereno", challenged: "Messo alla Prova", loving: "Affettuoso" }
  },
  de: {
    title: "Gemeinsame Journale",
    subtitle: "Schreibt gemeinsam, teilt Gedanken und dokumentiert eure Beziehungsreise",
    back: "Zurück zu Aktivitäten",
    addEntry: "Eintrag Hinzufügen",
    all: "Alle",
    loading: "Journaleinträge werden geladen...",
    noEntries: "Noch keine Journaleinträge",
    startWriting: "Beginnt gemeinsam mit eurem ersten Eintrag",
    deleteConfirm: "Diesen Journaleintrag löschen? Dies kann nicht rückgängig gemacht werden.",
    createError: "Der Journaleintrag konnte nicht erstellt werden.",
    updateError: "Der Journaleintrag konnte nicht aktualisiert werden.",
    deleteError: "Der Journaleintrag konnte nicht gelöscht werden.",
    moods: { happy: "Glücklich", grateful: "Dankbar", reflective: "Nachdenklich", excited: "Begeistert", peaceful: "Friedlich", challenged: "Gefordert", loving: "Liebevoll" }
  }
};

const moods = ['happy', 'grateful', 'reflective', 'excited', 'peaceful', 'challenged', 'loving'];

export default function SharedJournals() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [moodFilter, setMoodFilter] = useState('all');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['sharedJournals'],
    queryFn: () => journalService.getJournalEntries('-entry_date'),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => journalService.createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedJournals'] });
      queryClient.invalidateQueries({ queryKey: ['activityProgress'] });
      setShowForm(false);
    },
    onError: () => toast.error(t.createError)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => journalService.updateJournalEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedJournals'] });
      setEditingEntry(null);
      setShowForm(false);
    },
    onError: () => toast.error(t.updateError)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => journalService.deleteJournalEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sharedJournals'] }),
    onError: () => toast.error(t.deleteError)
  });

  const filteredEntries = moodFilter === 'all' ? entries : entries.filter((entry) => entry.mood === moodFilter);

  const requestDelete = (id) => {
    if (window.confirm(t.deleteConfirm)) deleteMutation.mutate(id);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("CoupleActivities")} className="inline-flex items-center text-gray-600 hover:text-blue-600">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />{t.back}
          </Link>
        </div>

        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl">
            <BookOpen className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">{t.subtitle}</p>
        </motion.header>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" aria-label={t.title}>
            <Button variant={moodFilter === 'all' ? 'default' : 'outline'} onClick={() => setMoodFilter('all')} size="sm">{t.all}</Button>
            {moods.map((mood) => (
              <Button key={mood} variant={moodFilter === mood ? 'default' : 'outline'} onClick={() => setMoodFilter(mood)} size="sm">
                {t.moods[mood]}
              </Button>
            ))}
          </div>

          <Button onClick={() => { setEditingEntry(null); setShowForm(true); }} className="bg-gradient-to-r from-blue-500 to-cyan-600">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />{t.addEntry}
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <JournalForm
              entry={editingEntry}
              onSubmit={(data) => {
                if (editingEntry) updateMutation.mutate({ id: editingEntry.id, data });
                else createMutation.mutate(data);
              }}
              onCancel={() => { setShowForm(false); setEditingEntry(null); }}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-600" role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.loading}
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredEntries.map((entry) => (
                <JournalEntry
                  key={entry.id}
                  entry={entry}
                  onEdit={(selectedEntry) => { setEditingEntry(selectedEntry); setShowForm(true); }}
                  onDelete={requestDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {!isLoading && filteredEntries.length === 0 && (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300" aria-hidden="true" />
            <h2 className="mb-2 text-xl font-semibold text-gray-600">{t.noEntries}</h2>
            <p className="mb-6 text-gray-500">{t.startWriting}</p>
            <Button onClick={() => { setEditingEntry(null); setShowForm(true); }} className="bg-gradient-to-r from-blue-500 to-cyan-600">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />{t.addEntry}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
