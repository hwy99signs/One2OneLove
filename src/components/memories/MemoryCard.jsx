import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, MapPin, Edit, Trash2, Image as ImageIcon, Video, X } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: { favorite: "Favorite", edit: "Edit", delete: "Delete", showLess: "Show less", readMore: "Read more", addFavorite: "Add to favorites", removeFavorite: "Remove from favorites", closeImage: "Close image preview" },
  es: { favorite: "Favorito", edit: "Editar", delete: "Eliminar", showLess: "Mostrar menos", readMore: "Leer más", addFavorite: "Agregar a favoritos", removeFavorite: "Quitar de favoritos", closeImage: "Cerrar vista previa de imagen" },
  fr: { favorite: "Favori", edit: "Modifier", delete: "Supprimer", showLess: "Montrer moins", readMore: "Lire la suite", addFavorite: "Ajouter aux favoris", removeFavorite: "Retirer des favoris", closeImage: "Fermer l’aperçu de l’image" },
  it: { favorite: "Preferito", edit: "Modifica", delete: "Elimina", showLess: "Mostra meno", readMore: "Leggi di più", addFavorite: "Aggiungi ai preferiti", removeFavorite: "Rimuovi dai preferiti", closeImage: "Chiudi anteprima immagine" },
  de: { favorite: "Favorit", edit: "Bearbeiten", delete: "Löschen", showLess: "Weniger anzeigen", readMore: "Mehr lesen", addFavorite: "Zu Favoriten hinzufügen", removeFavorite: "Aus Favoriten entfernen", closeImage: "Bildvorschau schließen" }
};

const localeMap = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };
const isVideo = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || '');

export default function MemoryCard({ memory, onEdit, onDelete, onToggleFavorite }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const media = Array.isArray(memory.media_urls) ? memory.media_urls.filter(Boolean) : [];
  const dateLabel = memory.memory_date
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${String(memory.memory_date).slice(0, 10)}T12:00:00`))
    : null;
  const description = memory.description || '';
  const visibleDescription = showFullDescription || description.length <= 120 ? description : `${description.slice(0, 120)}…`;

  return (
    <>
      <motion.article initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} whileHover={{ y: -4 }} className="relative">
        <Card className="flex h-full flex-col overflow-hidden bg-white shadow-lg transition-all duration-300 hover:shadow-2xl">
          {media.length > 0 && (
            <div className="group relative h-48 overflow-hidden bg-gray-100">
              {isVideo(media[0]) ? (
                <div className="relative h-full w-full"><video src={media[0]} className="h-full w-full object-cover" muted preload="metadata" /><div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"><Video className="h-12 w-12 text-white" aria-hidden="true" /></div></div>
              ) : (
                <button type="button" onClick={() => setSelectedImage(media[0])} className="h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500"><img src={media[0]} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" /></button>
              )}
              {media.length > 1 && <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white"><ImageIcon className="h-3 w-3" aria-hidden="true" />+{media.length - 1}</div>}
              {memory.is_favorite && <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white shadow-lg"><Heart className="h-3 w-3 fill-current" aria-hidden="true" />{t.favorite}</div>}
            </div>
          )}

          <CardContent className="flex flex-1 flex-col p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="flex-1 text-xl font-bold text-gray-900">{memory.title}</h2>
              <button type="button" onClick={() => onToggleFavorite(memory)} aria-label={memory.is_favorite ? t.removeFavorite : t.addFavorite} aria-pressed={Boolean(memory.is_favorite)} className="shrink-0 rounded-full p-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">
                <Heart className={`h-6 w-6 ${memory.is_favorite ? 'fill-red-500 text-red-500' : 'text-gray-300 hover:text-red-400'}`} aria-hidden="true" />
              </button>
            </div>

            <div className="mb-4 space-y-2">
              {dateLabel && <div className="flex items-center text-sm text-gray-600"><Calendar className="mr-2 h-4 w-4 text-pink-500" aria-hidden="true" /><time dateTime={String(memory.memory_date).slice(0, 10)}>{dateLabel}</time></div>}
              {memory.location && <div className="flex items-center text-sm text-gray-600"><MapPin className="mr-2 h-4 w-4 text-purple-500" aria-hidden="true" />{memory.location}</div>}
            </div>

            {description && (
              <div className="mb-4 flex-1">
                <p className="leading-relaxed text-gray-700">{visibleDescription}</p>
                {description.length > 120 && <button type="button" onClick={() => setShowFullDescription((current) => !current)} aria-expanded={showFullDescription} className="mt-2 text-sm font-medium text-pink-600 hover:text-pink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500">{showFullDescription ? t.showLess : t.readMore}</button>}
              </div>
            )}

            <div className="mt-auto flex items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => onEdit(memory)} className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"><Edit className="mr-2 h-4 w-4" aria-hidden="true" />{t.edit}</Button>
              <Button variant="outline" size="sm" type="button" onClick={() => onDelete(memory.id)} className="flex-1 border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />{t.delete}</Button>
            </div>
          </CardContent>
        </Card>
      </motion.article>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)} role="presentation">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative max-h-full max-w-full" role="dialog" aria-modal="true" aria-label={memory.title} onClick={(event) => event.stopPropagation()}>
            <img src={selectedImage} alt="" className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" />
            <button type="button" className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500" onClick={() => setSelectedImage(null)} aria-label={t.closeImage}><X className="h-5 w-5" aria-hidden="true" /></button>
          </motion.div>
        </div>
      )}
    </>
  );
}
