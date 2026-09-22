import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, MapPin, Edit, Trash2, Image as ImageIcon, Video } from "lucide-react";
import { format } from "date-fns";
import { de, enUS, es, fr, it } from "date-fns/locale";
import { useLanguage } from "@/Layout";

const translations = {
  en: { favorite: "Favorite", edit: "Edit", delete: "Delete", showLess: "Show less", readMore: "Read more", memoryImage: "Memory image", closeImage: "Close memory image" },
  es: { favorite: "Favorito", edit: "Editar", delete: "Eliminar", showLess: "Mostrar menos", readMore: "Leer más", memoryImage: "Imagen del recuerdo", closeImage: "Cerrar imagen del recuerdo" },
  fr: { favorite: "Favori", edit: "Modifier", delete: "Supprimer", showLess: "Montrer moins", readMore: "Lire la suite", memoryImage: "Image du souvenir", closeImage: "Fermer l’image du souvenir" },
  it: { favorite: "Preferito", edit: "Modifica", delete: "Elimina", showLess: "Mostra meno", readMore: "Leggi di più", memoryImage: "Immagine del ricordo", closeImage: "Chiudi immagine del ricordo" },
  de: { favorite: "Favorit", edit: "Bearbeiten", delete: "Löschen", showLess: "Weniger anzeigen", readMore: "Mehr lesen", memoryImage: "Erinnerungsbild", closeImage: "Erinnerungsbild schließen" },
  nl: { favorite: "Favoriet", edit: "Bewerken", delete: "Verwijderen", showLess: "Minder tonen", readMore: "Lees meer" },
  pt: { favorite: "Favorito", edit: "Editar", delete: "Excluir", showLess: "Mostrar menos", readMore: "Ler mais" }
};
const DATE_LOCALES = { en:enUS, es, fr, it, de };

export default function MemoryCard({ memory, onEdit, onDelete, onToggleFavorite }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const dateLocale = DATE_LOCALES[currentLanguage] || enUS;
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const canEdit = memory?.can_edit !== false;

  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const isVideo = (url) => url?.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={{ y: -5 }} className="relative">
        <Card className="overflow-hidden bg-white shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
          {memory.media_urls && memory.media_urls.length > 0 && (
            <div className="relative h-48 bg-gray-100 overflow-hidden group">
              {isVideo(memory.media_urls[0]) ? (
                <div className="relative w-full h-full">
                  <video src={memory.media_urls[0]} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Video className="w-12 h-12 text-white" /></div>
                </div>
              ) : (
                <img src={memory.media_urls[0]} alt={memory.title} className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-110" onClick={() => setSelectedImage(memory.media_urls[0])} />
              )}
              {memory.media_urls.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" />+{memory.media_urls.length - 1}</div>
              )}
              {memory.is_favorite && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg"><Heart className="w-3 h-3 fill-current" />{t.favorite}</div>
              )}
            </div>
          )}

          <CardContent className="p-5 flex-1 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900 flex-1 pr-2">{memory.title}</h3>
              {canEdit && (
                <button onClick={() => onToggleFavorite(memory)} className="flex-shrink-0 transition-all" aria-label={t.favorite}>
                  <Heart className={`w-6 h-6 ${memory.is_favorite ? 'text-red-500 fill-red-500' : 'text-gray-300 hover:text-red-400'}`} />
                </button>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {memory.memory_date && <div className="flex items-center text-sm text-gray-600"><Calendar className="w-4 h-4 mr-2 text-pink-500" />{format(new Date(`${memory.memory_date}T00:00:00`), 'PPP', { locale: dateLocale })}</div>}
              {memory.location && <div className="flex items-center text-sm text-gray-600"><MapPin className="w-4 h-4 mr-2 text-purple-500" />{memory.location}</div>}
            </div>

            {memory.description && (
              <div className="mb-4 flex-1">
                <p className="text-gray-700 leading-relaxed">{showFullDescription ? memory.description : truncateText(memory.description)}</p>
                {memory.description.length > 120 && <button onClick={() => setShowFullDescription(!showFullDescription)} className="text-pink-600 hover:text-pink-700 text-sm font-medium mt-2">{showFullDescription ? t.showLess : t.readMore}</button>}
              </div>
            )}

            {memory.tags && memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {memory.tags.map((tag, index) => <span key={index} className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded-full text-xs font-medium">#{tag}</span>)}
              </div>
            )}

            {canEdit && (
              <div className="flex items-center gap-2 mt-auto">
                <Button variant="outline" size="sm" onClick={() => onEdit(memory)} className="flex-1 border-pink-300 text-pink-600 hover:bg-pink-50"><Edit className="w-4 h-4 mr-2" />{t.edit}</Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(memory.id)} className="flex-1 border-red-300 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4 mr-2" />{t.delete}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t.memoryImage} onClick={() => setSelectedImage(null)}>
          <motion.img initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} src={selectedImage} alt={`${t.memoryImage}: ${memory.title}`} className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button type="button" aria-label={t.closeImage} className="absolute top-4 right-4 text-white text-3xl hover:text-pink-300" onClick={(event) => { event.stopPropagation(); setSelectedImage(null); }}>×</button>
        </div>
      )}
    </>
  );
}
