import React, { useState } from "react";
import { useLanguage } from "@/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Plus, Heart, Calendar, Tag, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import JournalForm from "../components/activities/JournalForm";
import JournalEntry from "../components/activities/JournalEntry";
import * as journalService from "@/lib/journalService";

const translations = {
  en: {
    title: "Shared Journals",
    subtitle: "Write together, share thoughts, and document your relationship journey",
    back: "Back to Activities",
    addEntry: "Add Entry",
    entries: "entries",
    filterByMood: "Filter by Mood",
    all: "All",
    noEntries: "No journal entries yet",
    startWriting: "Start writing your first entry together"
  },
  es: {
    title: "Diarios Compartidos",
    subtitle: "Escriban juntos, compartan pensamientos y documenten el viaje de su relación",
    back: "Volver a Actividades",
    addEntry: "Agregar Entrada",
    entries: "entradas",
    filterByMood: "Filtrar por Estado de Ánimo",
    all: "Todo",
    noEntries: "Aún no hay entradas de diario",
    startWriting: "Comienza a escribir tu primera entrada juntos"
  }
};

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
    onError: (error) => {
      console.error('Error creating journal entry:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => journalService.updateJournalEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedJournals'] });
      setEditingEntry(null);
      setShowForm(false);
    },
    onError: (error) => {
      console.error('Error updating journal entry:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => journalService.deleteJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedJournals'] });
    },
    onError: (error) => {
      console.error('Error deleting journal entry:', error);
    }
  });

  const filteredEntries = moodFilter === 'all' 
    ? entries 
    : entries.filter(e => e.mood === moodFilter);

  const moods = ['happy', 'grateful', 'reflective', 'excited', 'peaceful', 'challenged', 'loving'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Link to={createPageUrl("CoupleActivities")} className="inline-flex items-center text-gray-600 hover:text-blue-600">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-6 shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{t.title}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t.subtitle}</p>
        </motion.div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={moodFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setMoodFilter('all')}
              size="sm"
            >
              {t.all}
            </Button>
            {moods.map(mood => (
              <Button
                key={mood}
                variant={moodFilter === mood ? 'default' : 'outline'}
                onClick={() => setMoodFilter(mood)}
                size="sm"
                className="capitalize"
              >
                {mood}
              </Button>
            ))}
          </div>

          <Button
            onClick={() => {
              setEditingEntry(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.addEntry}
          </Button>
        </div>

        <AnimatePresence>
          {showForm && (
            <JournalForm
              entry={editingEntry}
              onSubmit={(data) => {
                if (editingEntry) {
                  updateMutation.mutate({ id: editingEntry.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setShowForm(false);
                setEditingEntry(null);
              }}
            />
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <AnimatePresence>
            {filteredEntries.map((entry) => (
              <JournalEntry
                key={entry.id}
                entry={entry}
                onEdit={(entry) => {
                  setEditingEntry(entry);
                  setShowForm(true);
                }}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.noEntries}</h3>
            <p className="text-gray-500 mb-6">{t.startWriting}</p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.addEntry}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}