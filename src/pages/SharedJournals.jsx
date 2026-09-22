import React, { useState } from 'react';
import { useLanguage } from '@/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import JournalForm from '../components/activities/JournalForm';
import JournalEntry from '../components/activities/JournalEntry';
import * as journalService from '@/lib/journalService';

const translations = {
  en: { title:'Shared Journals', subtitle:'Write together, share thoughts, and document your relationship journey', back:'Back to Activities', addEntry:'Add Entry', all:'All', noEntries:'No journal entries yet', startWriting:'Start writing your first entry together', saved:'Journal entry saved.', updated:'Journal entry updated.', deleted:'Journal entry deleted.', error:'Unable to update the journal right now.', deleteConfirm:'Are you sure you want to delete this journal entry?', moods:{ happy:'Happy', grateful:'Grateful', reflective:'Reflective', excited:'Excited', peaceful:'Peaceful', challenged:'Challenged', loving:'Loving' } },
  es: { title:'Diarios Compartidos', subtitle:'Escriban juntos, compartan pensamientos y documenten el viaje de su relación', back:'Volver a Actividades', addEntry:'Agregar Entrada', all:'Todos', noEntries:'Aún no hay entradas de diario', startWriting:'Comiencen a escribir su primera entrada juntos', saved:'Entrada guardada.', updated:'Entrada actualizada.', deleted:'Entrada eliminada.', error:'No se pudo actualizar el diario en este momento.', deleteConfirm:'¿Seguro que quieres eliminar esta entrada del diario?', moods:{ happy:'Feliz', grateful:'Agradecido', reflective:'Reflexivo', excited:'Emocionado', peaceful:'En Paz', challenged:'Con Desafíos', loving:'Cariñoso' } },
  fr: { title:'Journaux Partagés', subtitle:'Écrivez ensemble, partagez vos pensées et gardez une trace de votre parcours relationnel', back:'Retour aux Activités', addEntry:'Ajouter une Entrée', all:'Tous', noEntries:'Aucune entrée pour le moment', startWriting:'Commencez votre première entrée ensemble', saved:'Entrée enregistrée.', updated:'Entrée mise à jour.', deleted:'Entrée supprimée.', error:'Impossible de mettre à jour le journal pour le moment.', deleteConfirm:'Voulez-vous vraiment supprimer cette entrée du journal ?', moods:{ happy:'Heureux', grateful:'Reconnaissant', reflective:'Réfléchi', excited:'Enthousiaste', peaceful:'Paisible', challenged:'Mis au Défi', loving:'Aimant' } },
  it: { title:'Diari Condivisi', subtitle:'Scrivete insieme, condividete pensieri e documentate il vostro percorso di coppia', back:'Torna alle Attività', addEntry:'Aggiungi Voce', all:'Tutti', noEntries:'Ancora nessuna voce nel diario', startWriting:'Iniziate a scrivere insieme la prima voce', saved:'Voce del diario salvata.', updated:'Voce del diario aggiornata.', deleted:'Voce del diario eliminata.', error:'Impossibile aggiornare il diario in questo momento.', deleteConfirm:'Vuoi davvero eliminare questa voce del diario?', moods:{ happy:'Felice', grateful:'Grato', reflective:'Riflessivo', excited:'Entusiasta', peaceful:'Sereno', challenged:'In Difficoltà', loving:'Affettuoso' } },
  de: { title:'Geteilte Tagebücher', subtitle:'Schreibt gemeinsam, teilt Gedanken und haltet eure Beziehungsreise fest', back:'Zurück zu Aktivitäten', addEntry:'Eintrag Hinzufügen', all:'Alle', noEntries:'Noch keine Tagebucheinträge', startWriting:'Beginnt gemeinsam mit eurem ersten Eintrag', saved:'Tagebucheintrag gespeichert.', updated:'Tagebucheintrag aktualisiert.', deleted:'Tagebucheintrag gelöscht.', error:'Das Tagebuch kann gerade nicht aktualisiert werden.', deleteConfirm:'Möchten Sie diesen Tagebucheintrag wirklich löschen?', moods:{ happy:'Glücklich', grateful:'Dankbar', reflective:'Nachdenklich', excited:'Aufgeregt', peaceful:'Gelassen', challenged:'Herausgefordert', loving:'Liebevoll' } },
};

const moodKeys = ['happy','grateful','reflective','excited','peaceful','challenged','loving'];

export default function SharedJournals() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [moodFilter, setMoodFilter] = useState('all');

  const { data: entries = [] } = useQuery({
    queryKey:['sharedJournals'],
    queryFn:() => journalService.getJournalEntries('-entry_date'),
  });

  const createMutation = useMutation({
    mutationFn:data => journalService.createJournalEntry(data),
    onSuccess:() => {
      queryClient.invalidateQueries({ queryKey:['sharedJournals'] });
      queryClient.invalidateQueries({ queryKey:['activityProgress'] });
      setShowForm(false);
      toast.success(t.saved);
    },
    onError:error => toast.error(currentLanguage === 'en' ? (error?.message || t.error) : t.error),
  });

  const updateMutation = useMutation({
    mutationFn:({ id, data }) => journalService.updateJournalEntry(id, data),
    onSuccess:() => {
      queryClient.invalidateQueries({ queryKey:['sharedJournals'] });
      setEditingEntry(null);
      setShowForm(false);
      toast.success(t.updated);
    },
    onError:error => toast.error(currentLanguage === 'en' ? (error?.message || t.error) : t.error),
  });

  const deleteMutation = useMutation({
    mutationFn:id => journalService.deleteJournalEntry(id),
    onSuccess:() => {
      queryClient.invalidateQueries({ queryKey:['sharedJournals'] });
      toast.success(t.deleted);
    },
    onError:error => toast.error(currentLanguage === 'en' ? (error?.message || t.error) : t.error),
  });

  const handleDelete = (id) => {
    if (window.confirm(t.deleteConfirm)) deleteMutation.mutate(id);
  };

  const filteredEntries = moodFilter === 'all' ? entries : entries.filter(entry => entry.mood === moodFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6"><Link to={createPageUrl('CoupleActivities')} className="inline-flex items-center text-gray-600 hover:text-blue-600"><ArrowLeft className="mr-2 h-4 w-4"/>{t.back}</Link></div>

        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 shadow-xl"><BookOpen className="h-10 w-10 text-white"/></div>
          <h1 className="mb-4 text-5xl font-bold text-gray-900">{t.title}</h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">{t.subtitle}</p>
        </motion.div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant={moodFilter==='all'?'default':'outline'} onClick={() => setMoodFilter('all')} size="sm">{t.all}</Button>
            {moodKeys.map(mood => <Button key={mood} variant={moodFilter===mood?'default':'outline'} onClick={() => setMoodFilter(mood)} size="sm">{t.moods[mood]}</Button>)}
          </div>
          <Button onClick={() => { setEditingEntry(null); setShowForm(true); }} className="bg-gradient-to-r from-blue-500 to-cyan-600"><Plus className="mr-2 h-4 w-4"/>{t.addEntry}</Button>
        </div>

        <AnimatePresence>
          {showForm && <JournalForm entry={editingEntry} onSubmit={data => editingEntry ? updateMutation.mutate({ id:editingEntry.id, data }) : createMutation.mutate(data)} onCancel={() => { setShowForm(false); setEditingEntry(null); }}/>} 
        </AnimatePresence>

        <div className="space-y-6"><AnimatePresence>{filteredEntries.map(entry => <JournalEntry key={entry.id} entry={entry} onEdit={item => { setEditingEntry(item); setShowForm(true); }} onDelete={handleDelete}/>)}</AnimatePresence></div>

        {filteredEntries.length === 0 && (
          <div className="py-16 text-center"><BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300"/><h3 className="mb-2 text-xl font-semibold text-gray-600">{t.noEntries}</h3><p className="mb-6 text-gray-500">{t.startWriting}</p><Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-blue-500 to-cyan-600"><Plus className="mr-2 h-4 w-4"/>{t.addEntry}</Button></div>
        )}
      </div>
    </div>
  );
}
