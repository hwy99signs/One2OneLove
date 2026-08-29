import React, { useState } from "react";
import { useLanguage } from "@/Layout";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Loader2, Plus, ShieldCheck, Users } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import JournalForm from "../components/activities/JournalForm";
import JournalEntry from "../components/activities/JournalEntry";
import * as journalService from "@/lib/journalService";

const translations = {
  en: {
    title: "Shared Journals", subtitle: "Write privately by default, then choose which entries you want to share with your mutually linked partner.",
    privacy: "Existing and new entries remain private unless you explicitly turn on partner sharing for that entry. A linked partner can read a shared entry but cannot edit or delete it.",
    back: "Back to Activities", addEntry: "Add Entry", all: "All", loading: "Loading journal entries...", noEntries: "No journal entries yet", startWriting: "Start with a private entry, then share only if you choose.",
    deleteConfirm: "Delete this journal entry? This cannot be undone.", createError: "We could not create the journal entry.", updateError: "We could not update the journal entry.", deleteError: "We could not delete the journal entry.",
    moods: { happy: "Happy", grateful: "Grateful", reflective: "Reflective", excited: "Excited", peaceful: "Peaceful", challenged: "Challenged", loving: "Loving" }
  },
  es: {
    title: "Diarios Compartidos", subtitle: "Escriban en privado de forma predeterminada y luego elijan qué entradas desean compartir con su pareja vinculada mutuamente.",
    privacy: "Las entradas existentes y nuevas permanecen privadas salvo que activen explícitamente el uso compartido con la pareja. La pareja vinculada puede leer una entrada compartida, pero no editarla ni eliminarla.",
    back: "Volver a Actividades", addEntry: "Agregar Entrada", all: "Todo", loading: "Cargando entradas del diario...", noEntries: "Aún no hay entradas de diario", startWriting: "Empiecen con una entrada privada y compártanla solo si lo desean.",
    deleteConfirm: "¿Eliminar esta entrada del diario? Esta acción no se puede deshacer.", createError: "No pudimos crear la entrada del diario.", updateError: "No pudimos actualizar la entrada del diario.", deleteError: "No pudimos eliminar la entrada del diario.",
    moods: { happy: "Feliz", grateful: "Agradecido", reflective: "Reflexivo", excited: "Emocionado", peaceful: "En Paz", challenged: "Desafiado", loving: "Cariñoso" }
  },
  fr: {
    title: "Journaux Partagés", subtitle: "Écrivez en privé par défaut, puis choisissez les entrées que vous souhaitez partager avec votre partenaire lié réciproquement.",
    privacy: "Les entrées existantes et nouvelles restent privées sauf si vous activez explicitement le partage avec le partenaire. Votre partenaire lié peut lire une entrée partagée, mais ne peut ni la modifier ni la supprimer.",
    back: "Retour aux Activités", addEntry: "Ajouter une Entrée", all: "Toutes", loading: "Chargement des entrées du journal...", noEntries: "Aucune entrée de journal pour le moment", startWriting: "Commencez par une entrée privée, puis partagez-la uniquement si vous le souhaitez.",
    deleteConfirm: "Supprimer cette entrée du journal ? Cette action est irréversible.", createError: "Nous n’avons pas pu créer l’entrée du journal.", updateError: "Nous n’avons pas pu mettre à jour l’entrée du journal.", deleteError: "Nous n’avons pas pu supprimer l’entrée du journal.",
    moods: { happy: "Heureux", grateful: "Reconnaissant", reflective: "Réfléchi", excited: "Enthousiaste", peaceful: "Paisible", challenged: "Mis au Défi", loving: "Aimant" }
  },
  it: {
    title: "Diari Condivisi", subtitle: "Scrivete in privato per impostazione predefinita e poi scegliete quali voci condividere con il partner collegato reciprocamente.",
    privacy: "Le voci esistenti e nuove restano private a meno che non attiviate esplicitamente la condivisione con il partner. Il partner collegato può leggere una voce condivisa, ma non modificarla o eliminarla.",
    back: "Torna alle Attività", addEntry: "Aggiungi Voce", all: "Tutti", loading: "Caricamento delle voci del diario...", noEntries: "Nessuna voce del diario per ora", startWriting: "Iniziate con una voce privata e condividetela solo se lo desiderate.",
    deleteConfirm: "Eliminare questa voce del diario? L’azione non può essere annullata.", createError: "Non è stato possibile creare la voce del diario.", updateError: "Non è stato possibile aggiornare la voce del diario.", deleteError: "Non è stato possibile eliminare la voce del diario.",
    moods: { happy: "Felice", grateful: "Grato", reflective: "Riflessivo", excited: "Entusiasta", peaceful: "Sereno", challenged: "Messo alla Prova", loving: "Affettuoso" }
  },
  de: {
    title: "Gemeinsame Journale", subtitle: "Schreibt standardmäßig privat und entscheidet anschließend für jeden Eintrag, ob ihr ihn mit eurem gegenseitig verknüpften Partner teilen möchtet.",
    privacy: "Bestehende und neue Einträge bleiben privat, solange ihr die Partnerfreigabe nicht ausdrücklich aktiviert. Der verknüpfte Partner kann einen freigegebenen Eintrag lesen, aber nicht bearbeiten oder löschen.",
    back: "Zurück zu Aktivitäten", addEntry: "Eintrag Hinzufügen", all: "Alle", loading: "Journaleinträge werden geladen...", noEntries: "Noch keine Journaleinträge", startWriting: "Beginnt mit einem privaten Eintrag und teilt ihn nur, wenn ihr das möchtet.",
    deleteConfirm: "Diesen Journaleintrag löschen? Dies kann nicht rückgängig gemacht werden.", createError: "Der Journaleintrag konnte nicht erstellt werden.", updateError: "Der Journaleintrag konnte nicht aktualisiert werden.", deleteError: "Der Journaleintrag konnte nicht gelöscht werden.",
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

  const { data: entries = [], isLoading } = useQuery({ queryKey: ['sharedJournals'], queryFn: () => journalService.getJournalEntries('-entry_date'), initialData: [] });

  const createMutation = useMutation({
    mutationFn: (data) => journalService.createJournalEntry(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sharedJournals'] }); setShowForm(false); },
    onError: () => toast.error(t.createError)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => journalService.updateJournalEntry(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sharedJournals'] }); setEditingEntry(null); setShowForm(false); },
    onError: () => toast.error(t.updateError)
  });

  const deleteMutation = useMutation({ mutationFn: (id) => journalService.deleteJournalEntry(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sharedJournals'] }), onError: () => toast.error(t.deleteError) });

  const filteredEntries = moodFilter === 'all' ? entries : entries.filter((entry) => entry.mood === moodFilter);
  const requestDelete = (id) => { if (window.confirm(t.deleteConfirm)) deleteMutation.mutate(id); };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6"><Link to={createPageUrl("CoupleActivities")} className="inline-flex items-center text-gray-600 hover:text-blue-600"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />{t.back}</Link></div>

        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl"><BookOpen className="h-10 w-10 text-white" aria-hidden="true" /></div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">{t.subtitle}</p>
        </motion.header>

        <div className="mx-auto mb-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-blue-100 bg-white/90 p-4 text-sm leading-6 text-slate-700"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" /><p>{t.privacy}</p><Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" /></div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2" aria-label={t.title}>
            <Button variant={moodFilter === 'all' ? 'default' : 'outline'} onClick={() => setMoodFilter('all')} size="sm">{t.all}</Button>
            {moods.map((mood) => <Button key={mood} variant={moodFilter === mood ? 'default' : 'outline'} onClick={() => setMoodFilter(mood)} size="sm">{t.moods[mood]}</Button>)}
          </div>
          <Button onClick={() => { setEditingEntry(null); setShowForm(true); }} className="bg-gradient-to-r from-blue-500 to-cyan-600"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />{t.addEntry}</Button>
        </div>

        <AnimatePresence>{showForm && <JournalForm entry={editingEntry} onSubmit={(data) => { if (editingEntry) updateMutation.mutate({ id: editingEntry.id, data }); else createMutation.mutate(data); }} onCancel={() => { setShowForm(false); setEditingEntry(null); }} />}</AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-600" role="status"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.loading}</div>
        ) : (
          <div className="space-y-6"><AnimatePresence>{filteredEntries.map((entry) => <JournalEntry key={entry.id} entry={entry} onEdit={(selectedEntry) => { if (selectedEntry.isOwn === false) return; setEditingEntry(selectedEntry); setShowForm(true); }} onDelete={requestDelete} />)}</AnimatePresence></div>
        )}

        {!isLoading && filteredEntries.length === 0 && <div className="py-16 text-center"><BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300" aria-hidden="true" /><h2 className="mb-2 text-xl font-semibold text-gray-600">{t.noEntries}</h2><p className="mb-6 text-gray-500">{t.startWriting}</p><Button onClick={() => { setEditingEntry(null); setShowForm(true); }} className="bg-gradient-to-r from-blue-500 to-cyan-600"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />{t.addEntry}</Button></div>}
      </div>
    </main>
  );
}
