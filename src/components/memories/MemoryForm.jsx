import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, X, Loader2, Video, Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: {
    editMemory: "Edit Memory", createMemory: "Create New Memory", memoryTitle: "Memory Title", titlePlaceholder: "Our first date, beach vacation, anniversary dinner...",
    description: "Description", descriptionPlaceholder: "Describe this moment and what made it meaningful...", date: "Date", location: "Location", locationPlaceholder: "City or place",
    media: "Existing Photos & Videos", mediaNote: "New photo and video uploads are not available yet. Existing media already attached to older memories can still be viewed or removed.", removeMedia: "Remove media",
    cancel: "Cancel", saveMemory: "Save Memory", saving: "Saving..."
  },
  es: {
    editMemory: "Editar Recuerdo", createMemory: "Crear Nuevo Recuerdo", memoryTitle: "Título del Recuerdo", titlePlaceholder: "Nuestra primera cita, vacaciones en la playa, cena de aniversario...",
    description: "Descripción", descriptionPlaceholder: "Describe este momento y lo que lo hizo significativo...", date: "Fecha", location: "Ubicación", locationPlaceholder: "Ciudad o lugar",
    media: "Fotos y Videos Existentes", mediaNote: "La carga de nuevas fotos y videos aún no está disponible. Los archivos ya vinculados a recuerdos anteriores pueden seguir viéndose o eliminarse.", removeMedia: "Eliminar archivo",
    cancel: "Cancelar", saveMemory: "Guardar Recuerdo", saving: "Guardando..."
  },
  fr: {
    editMemory: "Modifier le Souvenir", createMemory: "Créer un Nouveau Souvenir", memoryTitle: "Titre du Souvenir", titlePlaceholder: "Notre premier rendez-vous, vacances à la plage, dîner d’anniversaire...",
    description: "Description", descriptionPlaceholder: "Décrivez ce moment et ce qui l’a rendu important...", date: "Date", location: "Lieu", locationPlaceholder: "Ville ou lieu",
    media: "Photos et Vidéos Existantes", mediaNote: "L’ajout de nouvelles photos et vidéos n’est pas encore disponible. Les médias déjà liés à d’anciens souvenirs peuvent toujours être consultés ou supprimés.", removeMedia: "Supprimer le média",
    cancel: "Annuler", saveMemory: "Enregistrer le Souvenir", saving: "Enregistrement..."
  },
  it: {
    editMemory: "Modifica Ricordo", createMemory: "Crea Nuovo Ricordo", memoryTitle: "Titolo del Ricordo", titlePlaceholder: "Il nostro primo appuntamento, vacanza al mare, cena di anniversario...",
    description: "Descrizione", descriptionPlaceholder: "Descrivi questo momento e ciò che lo ha reso significativo...", date: "Data", location: "Luogo", locationPlaceholder: "Città o luogo",
    media: "Foto e Video Esistenti", mediaNote: "Il caricamento di nuove foto e video non è ancora disponibile. I contenuti già collegati ai ricordi precedenti possono comunque essere visualizzati o rimossi.", removeMedia: "Rimuovi contenuto",
    cancel: "Annulla", saveMemory: "Salva Ricordo", saving: "Salvataggio..."
  },
  de: {
    editMemory: "Erinnerung Bearbeiten", createMemory: "Neue Erinnerung Erstellen", memoryTitle: "Erinnerungstitel", titlePlaceholder: "Unser erstes Date, Strandurlaub, Jahrestagsessen...",
    description: "Beschreibung", descriptionPlaceholder: "Beschreibt diesen Moment und was ihn besonders gemacht hat...", date: "Datum", location: "Ort", locationPlaceholder: "Stadt oder Ort",
    media: "Vorhandene Fotos & Videos", mediaNote: "Neue Foto- und Video-Uploads sind noch nicht verfügbar. Bereits mit älteren Erinnerungen verknüpfte Medien können weiterhin angesehen oder entfernt werden.", removeMedia: "Medium entfernen",
    cancel: "Abbrechen", saveMemory: "Erinnerung Speichern", saving: "Speichern..."
  }
};

const isVideo = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || '');

export default function MemoryForm({ memory, onSubmit, onCancel, isLoading }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const [formData, setFormData] = useState({
    title: memory?.title || '',
    description: memory?.description || '',
    memory_date: memory?.memory_date ? String(memory.memory_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    location: memory?.location || '',
    media_urls: Array.isArray(memory?.media_urls) ? memory.media_urls : [],
    is_favorite: Boolean(memory?.is_favorite),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      memory_date: formData.memory_date,
      location: formData.location.trim() || null,
      media_urls: formData.media_urls,
      is_favorite: formData.is_favorite,
    });
  };

  const removeMedia = (index) => {
    setFormData((current) => ({ ...current, media_urls: current.media_urls.filter((_, itemIndex) => itemIndex !== index) }));
  };

  return (
    <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-8 rounded-2xl border-2 border-pink-200 bg-white p-6 shadow-2xl md:p-8" aria-labelledby="memory-form-title">
      <h2 id="memory-form-title" className="mb-6 text-2xl font-bold text-gray-900">{memory ? t.editMemory : t.createMemory}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="block text-sm font-semibold text-gray-700">
          {t.memoryTitle} *
          <Input className="mt-2 text-lg" placeholder={t.titlePlaceholder} value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} required maxLength={160} />
        </label>

        <label className="block text-sm font-semibold text-gray-700">
          {t.description}
          <Textarea className="mt-2 min-h-32 resize-y" placeholder={t.descriptionPlaceholder} value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} maxLength={5000} />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-gray-700">
            {t.date} *
            <Input className="mt-2" type="date" value={formData.memory_date} onChange={(event) => setFormData({ ...formData, memory_date: event.target.value })} required />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            {t.location}
            <div className="relative mt-2"><MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" aria-hidden="true" /><Input className="pl-10" placeholder={t.locationPlaceholder} value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} maxLength={300} /></div>
          </label>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700">{t.media}</h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">{t.mediaNote}</p>
          {formData.media_urls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {formData.media_urls.map((url, index) => (
                <div key={`${url}-${index}`} className="group relative overflow-hidden rounded-lg bg-gray-100">
                  {isVideo(url) ? (
                    <div className="relative aspect-square"><video src={url} className="h-full w-full object-cover" preload="metadata" /><div className="absolute inset-0 flex items-center justify-center bg-black/30"><Video className="h-6 w-6 text-white" aria-hidden="true" /></div></div>
                  ) : (
                    <div className="relative aspect-square"><img src={url} alt="" className="h-full w-full object-cover" loading="lazy" /><div className="sr-only"><ImageIcon /></div></div>
                  )}
                  <button type="button" onClick={() => removeMedia(index)} aria-label={`${t.removeMedia} ${index + 1}`} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white"><X className="h-4 w-4" aria-hidden="true" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">{t.cancel}</Button>
          <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />{t.saving}</> : t.saveMemory}
          </Button>
        </div>
      </form>
    </motion.section>
  );
}
