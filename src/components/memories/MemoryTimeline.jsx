import React from "react";
import { motion } from "framer-motion";
import { Heart, Calendar, MapPin, Edit, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de, enUS, es, fr, it } from "date-fns/locale";
import { useLanguage } from "@/Layout";

const translations = {
  en: { edit: "Edit", delete: "Delete", favorite: "Toggle favorite" },
  es: { edit: "Editar", delete: "Eliminar", favorite: "Cambiar favorito" },
  fr: { edit: "Modifier", delete: "Supprimer", favorite: "Changer le favori" },
  it: { edit: "Modifica", delete: "Elimina", favorite: "Cambia preferito" },
  de: { edit: "Bearbeiten", delete: "Löschen", favorite: "Favorit ändern" },
  nl: { edit: "Bewerken", delete: "Verwijderen" },
  pt: { edit: "Editar", delete: "Excluir" }
};
const DATE_LOCALES = { en:enUS, es, fr, it, de };

export default function MemoryTimeline({ memories, onEdit, onDelete, onToggleFavorite }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const dateLocale = DATE_LOCALES[currentLanguage] || enUS;
  const isVideo = (url) => url?.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <div className="relative">
      <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-pink-300 via-purple-300 to-blue-300"></div>
      <div className="space-y-8">
        {memories.map((memory, index) => {
          const canEdit = memory?.can_edit !== false;
          return (
            <motion.div key={memory.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="relative pl-20">
              <div className="absolute left-5 top-6 w-7 h-7 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                {memory.is_favorite && <Heart className="w-3 h-3 text-white fill-white" />}
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-gray-900">{memory.title}</h3>
                      {canEdit && (
                        <button type="button" onClick={() => onToggleFavorite(memory)} aria-label={`${t.favorite}: ${memory.title}`}>
                          <Heart className={`w-5 h-5 ${memory.is_favorite ? 'text-red-500 fill-red-500' : 'text-gray-300 hover:text-red-400'}`} />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {memory.memory_date && <div className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-pink-500" />{format(new Date(`${memory.memory_date}T00:00:00`), 'PPP', { locale: dateLocale })}</div>}
                      {memory.location && <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-purple-500" />{memory.location}</div>}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(memory)} aria-label={`${t.edit}: ${memory.title}`} className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(memory.id)} aria-label={`${t.delete}: ${memory.title}`} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  )}
                </div>

                {memory.description && <p className="text-gray-700 leading-relaxed mb-4">{memory.description}</p>}

                {memory.media_urls && memory.media_urls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {memory.media_urls.map((url, mediaIndex) => (
                      <div key={mediaIndex} className="relative aspect-square rounded-lg overflow-hidden group">
                        {isVideo(url) ? (
                          <><video src={url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors"><Video className="w-8 h-8 text-white" /></div></>
                        ) : (
                          <img src={url} alt={`${memory.title} ${mediaIndex + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {memory.tags && memory.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {memory.tags.map((tag, tagIndex) => <span key={tagIndex} className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded-full text-xs font-medium">#{tag}</span>)}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
