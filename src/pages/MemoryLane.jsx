import React, { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Grid, List, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

import MemoryForm from "../components/memories/MemoryForm";
import MemoryCard from "../components/memories/MemoryCard";
import MemoryTimeline from "../components/memories/MemoryTimeline";
import MemoryFilters from "../components/memories/MemoryFilters";

const translations = {
  en: {
    title: "Memory Lane 💕", subtitle: "Your journey together, captured in meaningful moments", addNewMemory: "Add New Memory", memories: "Memories", memory: "Memory",
    loadingMemories: "Loading your memories...", loadError: "We could not load your memories.", noMemories: "No Memories Yet", noMemoriesDesc: "Start building your memory lane by adding your first special moment.", addFirstMemory: "Add Your First Memory",
    deleteConfirm: "Delete this memory? This cannot be undone.", createSuccess: "Memory added.", updateSuccess: "Memory updated.", deleteSuccess: "Memory deleted.", createError: "We could not add the memory.", updateError: "We could not update the memory.", deleteError: "We could not delete the memory.",
    back: "Back", gridView: "Grid view", timelineView: "Timeline view", signIn: "Sign in to view and manage your private memories.", signInButton: "Sign In"
  },
  es: {
    title: "Carril de Recuerdos 💕", subtitle: "Su camino juntos, capturado en momentos significativos", addNewMemory: "Agregar Nuevo Recuerdo", memories: "Recuerdos", memory: "Recuerdo",
    loadingMemories: "Cargando tus recuerdos...", loadError: "No pudimos cargar tus recuerdos.", noMemories: "Aún No Hay Recuerdos", noMemoriesDesc: "Comienza a construir tu carril de recuerdos agregando tu primer momento especial.", addFirstMemory: "Agrega Tu Primer Recuerdo",
    deleteConfirm: "¿Eliminar este recuerdo? Esta acción no se puede deshacer.", createSuccess: "Recuerdo agregado.", updateSuccess: "Recuerdo actualizado.", deleteSuccess: "Recuerdo eliminado.", createError: "No pudimos agregar el recuerdo.", updateError: "No pudimos actualizar el recuerdo.", deleteError: "No pudimos eliminar el recuerdo.",
    back: "Atrás", gridView: "Vista de cuadrícula", timelineView: "Vista de línea de tiempo", signIn: "Inicia sesión para ver y administrar tus recuerdos privados.", signInButton: "Iniciar Sesión"
  },
  fr: {
    title: "Allée des Souvenirs 💕", subtitle: "Votre parcours ensemble, capturé dans des moments significatifs", addNewMemory: "Ajouter un Nouveau Souvenir", memories: "Souvenirs", memory: "Souvenir",
    loadingMemories: "Chargement de vos souvenirs...", loadError: "Nous n’avons pas pu charger vos souvenirs.", noMemories: "Pas Encore de Souvenirs", noMemoriesDesc: "Commencez votre allée des souvenirs en ajoutant votre premier moment spécial.", addFirstMemory: "Ajouter Votre Premier Souvenir",
    deleteConfirm: "Supprimer ce souvenir ? Cette action est irréversible.", createSuccess: "Souvenir ajouté.", updateSuccess: "Souvenir mis à jour.", deleteSuccess: "Souvenir supprimé.", createError: "Nous n’avons pas pu ajouter le souvenir.", updateError: "Nous n’avons pas pu mettre à jour le souvenir.", deleteError: "Nous n’avons pas pu supprimer le souvenir.",
    back: "Retour", gridView: "Vue en grille", timelineView: "Vue chronologique", signIn: "Connectez-vous pour voir et gérer vos souvenirs privés.", signInButton: "Se Connecter"
  },
  it: {
    title: "Viale dei Ricordi 💕", subtitle: "Il vostro percorso insieme, catturato in momenti significativi", addNewMemory: "Aggiungi Nuovo Ricordo", memories: "Ricordi", memory: "Ricordo",
    loadingMemories: "Caricamento dei ricordi...", loadError: "Non è stato possibile caricare i ricordi.", noMemories: "Nessun Ricordo Ancora", noMemoriesDesc: "Iniziate a costruire il vostro viale dei ricordi aggiungendo il primo momento speciale.", addFirstMemory: "Aggiungi il Primo Ricordo",
    deleteConfirm: "Eliminare questo ricordo? L’azione non può essere annullata.", createSuccess: "Ricordo aggiunto.", updateSuccess: "Ricordo aggiornato.", deleteSuccess: "Ricordo eliminato.", createError: "Non è stato possibile aggiungere il ricordo.", updateError: "Non è stato possibile aggiornare il ricordo.", deleteError: "Non è stato possibile eliminare il ricordo.",
    back: "Indietro", gridView: "Vista a griglia", timelineView: "Vista cronologica", signIn: "Accedi per vedere e gestire i tuoi ricordi privati.", signInButton: "Accedi"
  },
  de: {
    title: "Erinnerungsgasse 💕", subtitle: "Euer gemeinsamer Weg, festgehalten in bedeutungsvollen Momenten", addNewMemory: "Neue Erinnerung Hinzufügen", memories: "Erinnerungen", memory: "Erinnerung",
    loadingMemories: "Erinnerungen werden geladen...", loadError: "Eure Erinnerungen konnten nicht geladen werden.", noMemories: "Noch Keine Erinnerungen", noMemoriesDesc: "Beginnt eure Erinnerungsgasse mit eurem ersten besonderen Moment.", addFirstMemory: "Erste Erinnerung Hinzufügen",
    deleteConfirm: "Diese Erinnerung löschen? Dies kann nicht rückgängig gemacht werden.", createSuccess: "Erinnerung hinzugefügt.", updateSuccess: "Erinnerung aktualisiert.", deleteSuccess: "Erinnerung gelöscht.", createError: "Die Erinnerung konnte nicht hinzugefügt werden.", updateError: "Die Erinnerung konnte nicht aktualisiert werden.", deleteError: "Die Erinnerung konnte nicht gelöscht werden.",
    back: "Zurück", gridView: "Rasteransicht", timelineView: "Zeitleistenansicht", signIn: "Meldet euch an, um eure privaten Erinnerungen anzusehen und zu verwalten.", signInButton: "Anmelden"
  }
};

const MEMORY_COLUMNS = 'id,user_id,title,description,memory_date,location,media_urls,is_favorite,created_at,updated_at';

const cleanMemoryPayload = (memoryData) => ({
  title: String(memoryData.title || '').trim().slice(0, 160),
  description: memoryData.description ? String(memoryData.description).trim().slice(0, 5000) : null,
  memory_date: memoryData.memory_date,
  location: memoryData.location ? String(memoryData.location).trim().slice(0, 300) : null,
  media_urls: Array.isArray(memoryData.media_urls) ? memoryData.media_urls.filter(Boolean).slice(0, 20) : [],
  is_favorite: Boolean(memoryData.is_favorite),
});

export default function MemoryLane() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [showForm, setShowForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({ isFavorite: false, searchQuery: '' });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: memories = [], isLoading, isError } = useQuery({
    queryKey: ['memories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('memories').select(MEMORY_COLUMNS).eq('user_id', user.id).order('memory_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    initialData: [],
  });

  const refreshMemories = () => queryClient.invalidateQueries({ queryKey: ['memories', user?.id] });

  const createMemoryMutation = useMutation({
    mutationFn: async (memoryData) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const payload = cleanMemoryPayload(memoryData);
      if (!payload.title || !payload.memory_date) throw new Error('INVALID_MEMORY');
      const { data, error } = await supabase.from('memories').insert({ ...payload, user_id: user.id }).select(MEMORY_COLUMNS).single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { refreshMemories(); setShowForm(false); setEditingMemory(null); toast.success(t.createSuccess); },
    onError: () => toast.error(t.createError),
  });

  const updateMemoryMutation = useMutation({
    mutationFn: async ({ id, memoryData }) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const payload = cleanMemoryPayload(memoryData);
      const { data, error } = await supabase.from('memories').update(payload).eq('id', id).eq('user_id', user.id).select(MEMORY_COLUMNS).single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { refreshMemories(); setShowForm(false); setEditingMemory(null); toast.success(t.updateSuccess); },
    onError: () => toast.error(t.updateError),
  });

  const favoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const { error } = await supabase.from('memories').update({ is_favorite: isFavorite }).eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: refreshMemories,
    onError: () => toast.error(t.updateError),
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (id) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const { error } = await supabase.from('memories').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => { refreshMemories(); toast.success(t.deleteSuccess); },
    onError: () => toast.error(t.deleteError),
  });

  const filteredMemories = useMemo(() => {
    const search = filters.searchQuery.trim().toLowerCase();
    return memories.filter((memory) => {
      if (filters.isFavorite && !memory.is_favorite) return false;
      if (!search) return true;
      return [memory.title, memory.description, memory.location].some((value) => String(value || '').toLowerCase().includes(search));
    });
  }, [memories, filters]);

  const handleSubmit = (memoryData) => editingMemory
    ? updateMemoryMutation.mutate({ id: editingMemory.id, memoryData })
    : createMemoryMutation.mutate(memoryData);

  const handleDelete = (id) => { if (window.confirm(t.deleteConfirm)) deleteMemoryMutation.mutate(id); };
  const handleEdit = (memory) => { setEditingMemory(memory); setShowForm(true); };
  const handleToggleFavorite = (memory) => favoriteMutation.mutate({ id: memory.id, isFavorite: !memory.is_favorite });

  if (!user) {
    return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4"><div className="max-w-lg text-center"><Heart className="mx-auto h-14 w-14 text-pink-500" aria-hidden="true" /><h1 className="mt-4 text-3xl font-bold text-gray-900">{t.title}</h1><p className="mt-3 text-gray-600">{t.signIn}</p><Button asChild className="mt-6 bg-gradient-to-r from-pink-500 to-purple-600"><Link to="/SignIn">{t.signInButton}</Link></Button></div></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <Link to={createPageUrl("Home")} className="inline-flex items-center rounded-xl px-4 py-2 text-gray-600 transition-all hover:bg-purple-50 hover:text-purple-600"><ArrowLeft className="mr-2 h-5 w-5" aria-hidden="true" />{t.back}</Link>

        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 mt-6 text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl"><Heart className="h-10 w-10 fill-white text-white" aria-hidden="true" /></div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">{t.title}</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 md:text-xl">{t.subtitle}</p>
        </motion.header>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button type="button" onClick={() => { setEditingMemory(null); setShowForm((current) => !current); }} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:from-pink-600 hover:to-purple-700"><Plus className="mr-2 h-5 w-5" aria-hidden="true" />{t.addNewMemory}</Button>
            <div className="flex items-center gap-1 rounded-lg bg-white p-1 shadow-md">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" type="button" onClick={() => setViewMode('grid')} aria-label={t.gridView} title={t.gridView} className={viewMode === 'grid' ? 'bg-pink-500 hover:bg-pink-600' : ''}><Grid className="h-4 w-4" aria-hidden="true" /></Button>
              <Button variant={viewMode === 'timeline' ? 'default' : 'ghost'} size="icon" type="button" onClick={() => setViewMode('timeline')} aria-label={t.timelineView} title={t.timelineView} className={viewMode === 'timeline' ? 'bg-pink-500 hover:bg-pink-600' : ''}><List className="h-4 w-4" aria-hidden="true" /></Button>
            </div>
          </div>
          <div className="text-lg font-semibold text-gray-700">{filteredMemories.length} {filteredMemories.length === 1 ? t.memory : t.memories}</div>
        </div>

        <MemoryFilters filters={filters} setFilters={setFilters} />

        <AnimatePresence>
          {showForm && <MemoryForm memory={editingMemory} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingMemory(null); }} isLoading={createMemoryMutation.isPending || updateMemoryMutation.isPending} />}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-600" role="status"><Loader2 className="h-6 w-6 animate-spin text-pink-500" aria-hidden="true" />{t.loadingMemories}</div>
        ) : isError ? (
          <div className="py-20 text-center text-red-700" role="alert">{t.loadError}</div>
        ) : filteredMemories.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center"><Heart className="mx-auto mb-6 h-24 w-24 text-gray-300" aria-hidden="true" /><h2 className="mb-3 text-2xl font-bold text-gray-700">{t.noMemories}</h2><p className="mb-6 text-gray-600">{t.noMemoriesDesc}</p><Button type="button" onClick={() => { setEditingMemory(null); setShowForm(true); }} className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"><Plus className="mr-2 h-5 w-5" aria-hidden="true" />{t.addFirstMemory}</Button></motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"><AnimatePresence>{filteredMemories.map((memory) => <MemoryCard key={memory.id} memory={memory} onEdit={handleEdit} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} />)}</AnimatePresence></div>
        ) : (
          <MemoryTimeline memories={filteredMemories} onEdit={handleEdit} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} />
        )}
      </div>
    </main>
  );
}
