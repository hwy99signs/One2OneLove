
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMemories, createMemory, updateMemory, deleteMemory } from "@/lib/engagementService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Heart, Calendar, MapPin, Filter, Grid, List, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import MemoryForm from "../components/memories/MemoryForm";
import MemoryCard from "../components/memories/MemoryCard";
import MemoryTimeline from "../components/memories/MemoryTimeline";
import MemoryFilters from "../components/memories/MemoryFilters";

const translations = {
  en: {
    title: "Memory Lane 💕",
    subtitle: "Your beautiful journey together, captured in moments that last forever",
    addNewMemory: "Add New Memory",
    memories: "Memories",
    memory: "Memory",
    loadingMemories: "Loading your memories...",
    noMemories: "No Memories Yet",
    noMemoriesDesc: "Start building your memory lane by adding your first special moment!",
    addFirstMemory: "Add Your First Memory",
    deleteConfirm: "Are you sure you want to delete this memory?",
    back: "Back"
  },
  es: {
    title: "Carril de Recuerdos 💕",
    subtitle: "Tu hermoso viaje juntos, capturado en momentos que duran para siempre",
    addNewMemory: "Agregar Nuevo Recuerdo",
    memories: "Recuerdos",
    memory: "Recuerdo",
    loadingMemories: "Cargando tus recuerdos...",
    noMemories: "Aún No Hay Recuerdos",
    noMemoriesDesc: "¡Comienza a construir tu carril de recuerdos agregando tu primer momento especial!",
    addFirstMemory: "Agrega Tu Primer Recuerdo",
    deleteConfirm: "¿Estás seguro de que quieres eliminar este recuerdo?",
    back: "Atrás"
  },
  fr: {
    title: "Allée des Souvenirs 💕",
    subtitle: "Votre beau voyage ensemble, capturé dans des moments qui durent éternellement",
    addNewMemory: "Ajouter un Nouveau Souvenir",
    memories: "Souvenirs",
    memory: "Souvenir",
    loadingMemories: "Chargement de vos souvenirs...",
    noMemories: "Pas Encore de Souvenirs",
    noMemoriesDesc: "Commencez à construire votre allée des souvenirs en ajoutant votre premier moment spécial!",
    addFirstMemory: "Ajoutez Votre Premier Souvenir",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer ce souvenir?",
    back: "Retour"
  },
  it: {
    title: "Viale dei Ricordi 💕",
    subtitle: "Il vostro bellissimo viaggio insieme, catturato in momenti che durano per sempre",
    addNewMemory: "Aggiungi Nuovo Ricordo",
    memories: "Ricordi",
    memory: "Ricordo",
    loadingMemories: "Caricamento dei tuoi ricordi...",
    noMemories: "Nessun Ricordo Ancora",
    noMemoriesDesc: "Inizia a costruire il tuo viale dei ricordi aggiungendo il tuo primo momento speciale!",
    addFirstMemory: "Aggiungi Il Tuo Primo Ricordo",
    deleteConfirm: "Sei sicuro di voler eliminare questo ricordo?",
    back: "Indietro"
  },
  de: {
    title: "Erinnerungsgasse 💕",
    subtitle: "Ihre schöne Reise zusammen, festgehalten in Momenten, die ewig währen",
    addNewMemory: "Neue Erinnerung Hinzufügen",
    memories: "Erinnerungen",
    memory: "Erinnerung",
    loadingMemories: "Lade deine Erinnerungen...",
    noMemories: "Noch Keine Erinnerungen",
    noMemoriesDesc: "Beginnen Sie, Ihre Erinnerungsgasse aufzubauen, indem Sie Ihren ersten besonderen Moment hinzufügen!",
    addFirstMemory: "Fügen Sie Ihre Erste Erinnerung Hinzu",
    deleteConfirm: "Sind Sie sicher, dass Sie diese Erinnerung löschen möchten?",
    back: "Zurück"
  },
  nl: {
    title: "Herinneringslaan 💕",
    subtitle: "Jullie mooie reis samen, vastgelegd in momenten die eeuwig duren",
    addNewMemory: "Nieuwe Herinnering Toevoegen",
    memories: "Herinneringen",
    memory: "Herinnering",
    loadingMemories: "Je herinneringen laden...",
    noMemories: "Nog Geen Herinneringen",
    noMemoriesDesc: "Begin met het opbouwen van je herinneringslaan door je eerste speciale moment toe te voegen!",
    addFirstMemory: "Voeg Je Eerste Herinnering Toe",
    deleteConfirm: "Weet je zeker dat je deze herinnering wilt verwijderen?",
    back: "Terug"
  },
  pt: {
    title: "Alameda das Memórias 💕",
    subtitle: "Sua linda jornada juntos, capturada em momentos que duram para sempre",
    addNewMemory: "Adicionar Nova Memória",
    memories: "Memórias",
    memory: "Memória",
    loadingMemories: "Carregando suas memórias...",
    noMemories: "Nenhuma Memória Ainda",
    noMemoriesDesc: "Comece a construir sua alameda de memórias adicionando seu primeiro momento especial!",
    addFirstMemory: "Adicione Sua Primeira Memória",
    deleteConfirm: "Tem certeza de que deseja excluir esta memória?",
    back: "Voltar"
  }
};

export default function MemoryLane() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;

  const [showForm, setShowForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'
  const [filters, setFilters] = useState({ isFavorite: false, searchQuery: '' });

  const queryClient = useQueryClient();

  const { user } = useAuth();

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getMemories();
    },
    enabled: !!user?.id,
    initialData: [],
  });

  const createMemoryMutation = useMutation({
    mutationFn: async (memoryData) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await createMemory(memoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setShowForm(false);
      setEditingMemory(null);
    },
  });

  const updateMemoryMutation = useMutation({
    mutationFn: async ({ id, memoryData }) => {
      return await updateMemory(id, memoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setShowForm(false);
      setEditingMemory(null);
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (id) => {
      await deleteMemory(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
    },
  });

  const handleSubmit = (memoryData) => {
    if (editingMemory) {
      updateMemoryMutation.mutate({ id: editingMemory.id, memoryData });
    } else {
      createMemoryMutation.mutate(memoryData);
    }
  };

  const handleEdit = (memory) => {
    setEditingMemory(memory);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t.deleteConfirm)) {
      deleteMemoryMutation.mutate(id);
    }
  };

  const handleToggleFavorite = (memory) => {
    updateMemoryMutation.mutate({
      id: memory.id,
      memoryData: { ...memory, is_favorite: !memory.is_favorite }
    });
  };

  // Filter memories
  const filteredMemories = memories.filter(memory => {
    const matchesFavorite = !filters.isFavorite || memory.is_favorite;
    const matchesSearch = !filters.searchQuery || 
      memory.title?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      memory.description?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      memory.location?.toLowerCase().includes(filters.searchQuery.toLowerCase());
    return matchesFavorite && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link
            to={createPageUrl("Home")}
            className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
          >
            <ArrowLeft size={20} className="mr-2" />
            {t.back}
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl"
          >
            <Heart className="w-10 h-10 text-white fill-white" />
          </motion.div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {t.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t.addNewMemory}
            </Button>
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                className={viewMode === 'timeline' ? 'bg-pink-500 hover:bg-pink-600' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-lg font-semibold text-gray-700">
            {filteredMemories.length} {filteredMemories.length === 1 ? t.memory : t.memories}
          </div>
        </div>

        {/* Filters */}
        <MemoryFilters filters={filters} setFilters={setFilters} />

        {/* Memory Form */}
        <AnimatePresence>
          {showForm && (
            <MemoryForm
              memory={editingMemory}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingMemory(null);
              }}
              isLoading={createMemoryMutation.isPending || updateMemoryMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Memories Display */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">{t.loadingMemories}</p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 mb-3">
              {t.noMemories}
            </h3>
            <p className="text-gray-600 mb-6">
              {t.noMemoriesDesc}
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t.addFirstMemory}
            </Button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <MemoryTimeline
            memories={filteredMemories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>
    </div>
  );
}
