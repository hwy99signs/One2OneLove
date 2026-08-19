import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    edit: "Edit Entry",
    new: "New Journal Entry",
    close: "Close journal form",
    title: "Title",
    titlePlaceholder: "What's on your mind?",
    date: "Date",
    mood: "Mood",
    thoughts: "Your Thoughts",
    thoughtsPlaceholder: "Write your thoughts here...",
    tags: "Tags",
    tagsPlaceholder: "Add tags...",
    add: "Add",
    removeTag: "Remove tag",
    cancel: "Cancel",
    save: "Save Entry",
    moods: {
      happy: "Happy",
      grateful: "Grateful",
      reflective: "Reflective",
      excited: "Excited",
      peaceful: "Peaceful",
      challenged: "Challenged",
      loving: "Loving"
    }
  },
  es: {
    edit: "Editar Entrada",
    new: "Nueva Entrada de Diario",
    close: "Cerrar formulario del diario",
    title: "Título",
    titlePlaceholder: "¿Qué tienes en mente?",
    date: "Fecha",
    mood: "Estado de Ánimo",
    thoughts: "Tus Pensamientos",
    thoughtsPlaceholder: "Escribe tus pensamientos aquí...",
    tags: "Etiquetas",
    tagsPlaceholder: "Agregar etiquetas...",
    add: "Agregar",
    removeTag: "Eliminar etiqueta",
    cancel: "Cancelar",
    save: "Guardar Entrada",
    moods: {
      happy: "Feliz",
      grateful: "Agradecido",
      reflective: "Reflexivo",
      excited: "Emocionado",
      peaceful: "En Paz",
      challenged: "Desafiado",
      loving: "Cariñoso"
    }
  },
  fr: {
    edit: "Modifier l’Entrée",
    new: "Nouvelle Entrée de Journal",
    close: "Fermer le formulaire du journal",
    title: "Titre",
    titlePlaceholder: "Qu’avez-vous en tête ?",
    date: "Date",
    mood: "Humeur",
    thoughts: "Vos Réflexions",
    thoughtsPlaceholder: "Écrivez vos réflexions ici...",
    tags: "Étiquettes",
    tagsPlaceholder: "Ajouter des étiquettes...",
    add: "Ajouter",
    removeTag: "Supprimer l’étiquette",
    cancel: "Annuler",
    save: "Enregistrer l’Entrée",
    moods: {
      happy: "Heureux",
      grateful: "Reconnaissant",
      reflective: "Réfléchi",
      excited: "Enthousiaste",
      peaceful: "Paisible",
      challenged: "Mis au Défi",
      loving: "Aimant"
    }
  },
  it: {
    edit: "Modifica Voce",
    new: "Nuova Voce del Diario",
    close: "Chiudi modulo del diario",
    title: "Titolo",
    titlePlaceholder: "Cosa hai in mente?",
    date: "Data",
    mood: "Umore",
    thoughts: "I Tuoi Pensieri",
    thoughtsPlaceholder: "Scrivi qui i tuoi pensieri...",
    tags: "Tag",
    tagsPlaceholder: "Aggiungi tag...",
    add: "Aggiungi",
    removeTag: "Rimuovi tag",
    cancel: "Annulla",
    save: "Salva Voce",
    moods: {
      happy: "Felice",
      grateful: "Grato",
      reflective: "Riflessivo",
      excited: "Entusiasta",
      peaceful: "Sereno",
      challenged: "Messo alla Prova",
      loving: "Affettuoso"
    }
  },
  de: {
    edit: "Eintrag Bearbeiten",
    new: "Neuer Journaleintrag",
    close: "Journalformular schließen",
    title: "Titel",
    titlePlaceholder: "Was beschäftigt dich?",
    date: "Datum",
    mood: "Stimmung",
    thoughts: "Eure Gedanken",
    thoughtsPlaceholder: "Schreibt eure Gedanken hier...",
    tags: "Schlagwörter",
    tagsPlaceholder: "Schlagwörter hinzufügen...",
    add: "Hinzufügen",
    removeTag: "Schlagwort entfernen",
    cancel: "Abbrechen",
    save: "Eintrag Speichern",
    moods: {
      happy: "Glücklich",
      grateful: "Dankbar",
      reflective: "Nachdenklich",
      excited: "Begeistert",
      peaceful: "Friedlich",
      challenged: "Gefordert",
      loving: "Liebevoll"
    }
  }
};

const moodEmojis = {
  happy: '😊',
  grateful: '🙏',
  reflective: '🤔',
  excited: '🎉',
  peaceful: '😌',
  challenged: '💪',
  loving: '❤️'
};

export default function JournalForm({ entry, onSubmit, onCancel }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [formData, setFormData] = useState(entry || {
    title: '',
    content: '',
    entry_date: new Date().toISOString().split('T')[0],
    mood: 'happy',
    tags: [],
    is_favorite: false
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((current) => ({ ...current, tags: [...current.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-8">
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{entry ? t.edit : t.new}</CardTitle>
            <Button variant="ghost" size="icon" type="button" onClick={onCancel} aria-label={t.close}>
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium">
              {t.title}
              <Input className="mt-2" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} placeholder={t.titlePlaceholder} required />
            </label>

            <label className="block text-sm font-medium">
              {t.date}
              <Input className="mt-2" type="date" value={formData.entry_date} onChange={(event) => setFormData({ ...formData, entry_date: event.target.value })} required />
            </label>

            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="journal-mood">{t.mood}</label>
              <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                <SelectTrigger id="journal-mood"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(moodEmojis).map((mood) => (
                    <SelectItem key={mood} value={mood}>{moodEmojis[mood]} {t.moods[mood]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="block text-sm font-medium">
              {t.thoughts}
              <Textarea className="mt-2" value={formData.content} onChange={(event) => setFormData({ ...formData, content: event.target.value })} placeholder={t.thoughtsPlaceholder} rows={8} required />
            </label>

            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="journal-tags">{t.tags}</label>
              <div className="mb-2 flex gap-2">
                <Input
                  id="journal-tags"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder={t.tagsPlaceholder}
                />
                <Button type="button" onClick={addTag} variant="outline">{t.add}</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900" aria-label={`${t.removeTag}: ${tag}`}>
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>{t.cancel}</Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-600">
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />{t.save}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
