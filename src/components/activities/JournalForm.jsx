import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/Layout";
import { formatLocalDateInput } from "@/utils/localDate";

const COPY = {
  en:{newEntry:"New Journal Entry",editEntry:"Edit Entry",title:"Title",titlePlaceholder:"What's on your mind?",date:"Date",mood:"Mood",thoughts:"Your Thoughts",thoughtsPlaceholder:"Write your thoughts here…",tags:"Tags",tagsPlaceholder:"Add tags…",add:"Add",cancel:"Cancel",save:"Save Entry",close:"Close",removeTag:"Remove tag",moods:{happy:"Happy",grateful:"Grateful",reflective:"Reflective",excited:"Excited",peaceful:"Peaceful",challenged:"Challenged",loving:"Loving"}},
  es:{newEntry:"Nueva Entrada de Diario",editEntry:"Editar Entrada",title:"Título",titlePlaceholder:"¿Qué tienes en mente?",date:"Fecha",mood:"Estado de Ánimo",thoughts:"Tus Pensamientos",thoughtsPlaceholder:"Escribe aquí tus pensamientos…",tags:"Etiquetas",tagsPlaceholder:"Añadir etiquetas…",add:"Añadir",cancel:"Cancelar",save:"Guardar Entrada",close:"Cerrar",removeTag:"Eliminar etiqueta",moods:{happy:"Feliz",grateful:"Agradecido/a",reflective:"Reflexivo/a",excited:"Emocionado/a",peaceful:"En paz",challenged:"Con desafíos",loving:"Cariñoso/a"}},
  fr:{newEntry:"Nouvelle Entrée de Journal",editEntry:"Modifier l’Entrée",title:"Titre",titlePlaceholder:"À quoi pensez-vous ?",date:"Date",mood:"Humeur",thoughts:"Vos Pensées",thoughtsPlaceholder:"Écrivez vos pensées ici…",tags:"Étiquettes",tagsPlaceholder:"Ajouter des étiquettes…",add:"Ajouter",cancel:"Annuler",save:"Enregistrer l’Entrée",close:"Fermer",removeTag:"Supprimer l’étiquette",moods:{happy:"Heureux/se",grateful:"Reconnaissant/e",reflective:"Réfléchi/e",excited:"Enthousiaste",peaceful:"Paisible",challenged:"Mis/e au défi",loving:"Aimant/e"}},
  it:{newEntry:"Nuova Voce di Diario",editEntry:"Modifica Voce",title:"Titolo",titlePlaceholder:"A cosa stai pensando?",date:"Data",mood:"Umore",thoughts:"I Tuoi Pensieri",thoughtsPlaceholder:"Scrivi qui i tuoi pensieri…",tags:"Tag",tagsPlaceholder:"Aggiungi tag…",add:"Aggiungi",cancel:"Annulla",save:"Salva Voce",close:"Chiudi",removeTag:"Rimuovi tag",moods:{happy:"Felice",grateful:"Grato/a",reflective:"Riflessivo/a",excited:"Entusiasta",peaceful:"Sereno/a",challenged:"Messo/a alla prova",loving:"Affettuoso/a"}},
  de:{newEntry:"Neuer Tagebucheintrag",editEntry:"Eintrag Bearbeiten",title:"Titel",titlePlaceholder:"Was beschäftigt dich?",date:"Datum",mood:"Stimmung",thoughts:"Deine Gedanken",thoughtsPlaceholder:"Schreibe deine Gedanken hier…",tags:"Tags",tagsPlaceholder:"Tags hinzufügen…",add:"Hinzufügen",cancel:"Abbrechen",save:"Eintrag Speichern",close:"Schließen",removeTag:"Tag entfernen",moods:{happy:"Glücklich",grateful:"Dankbar",reflective:"Nachdenklich",excited:"Aufgeregt",peaceful:"Gelassen",challenged:"Herausgefordert",loving:"Liebevoll"}}
};

export default function JournalForm({ entry, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(entry || {
    title: '',
    content: '',
    entry_date: formatLocalDateInput(),
    mood: 'happy',
    tags: [],
    is_favorite: false
  });

  const [tagInput, setTagInput] = useState('');
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-8"
    >
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{entry ? t.editEntry : t.newEntry}</CardTitle>
            <Button type="button" variant="ghost" size="icon" onClick={onCancel} aria-label={t.close}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="journal-title" className="block text-sm font-medium mb-2">{t.title}</label>
              <Input
                id="journal-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t.titlePlaceholder}
                required
              />
            </div>

            <div>
              <label htmlFor="journal-date" className="block text-sm font-medium mb-2">{t.date}</label>
              <Input
                id="journal-date"
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                required
              />
            </div>

            <div>
              <label htmlFor="journal-mood" className="block text-sm font-medium mb-2">{t.mood}</label>
              <Select
                value={formData.mood}
                onValueChange={(value) => setFormData({ ...formData, mood: value })}
              >
                <SelectTrigger id="journal-mood" aria-label={t.mood}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="happy">😊 {t.moods.happy}</SelectItem>
                  <SelectItem value="grateful">🙏 {t.moods.grateful}</SelectItem>
                  <SelectItem value="reflective">🤔 {t.moods.reflective}</SelectItem>
                  <SelectItem value="excited">🎉 {t.moods.excited}</SelectItem>
                  <SelectItem value="peaceful">😌 {t.moods.peaceful}</SelectItem>
                  <SelectItem value="challenged">💪 {t.moods.challenged}</SelectItem>
                  <SelectItem value="loving">❤️ {t.moods.loving}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="journal-content" className="block text-sm font-medium mb-2">{t.thoughts}</label>
              <Textarea
                id="journal-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={t.thoughtsPlaceholder}
                rows={8}
                required
              />
            </div>

            <div>
              <label htmlFor="journal-tags" className="block text-sm font-medium mb-2">{t.tags}</label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="journal-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder={t.tagsPlaceholder}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  {t.add}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900"
                      aria-label={`${t.removeTag}: ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                {t.cancel}
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-600">
                <Save className="w-4 h-4 mr-2" />
                {t.save}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}