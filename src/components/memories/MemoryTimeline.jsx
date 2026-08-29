import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Heart, MapPin, Trash2, Video } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: { edit: "Edit", delete: "Delete", addFavorite: "Add to favorites", removeFavorite: "Remove from favorites" },
  es: { edit: "Editar", delete: "Eliminar", addFavorite: "Agregar a favoritos", removeFavorite: "Quitar de favoritos" },
  fr: { edit: "Modifier", delete: "Supprimer", addFavorite: "Ajouter aux favoris", removeFavorite: "Retirer des favoris" },
  it: { edit: "Modifica", delete: "Elimina", addFavorite: "Aggiungi ai preferiti", removeFavorite: "Rimuovi dai preferiti" },
  de: { edit: "Bearbeiten", delete: "Löschen", addFavorite: "Zu Favoriten hinzufügen", removeFavorite: "Aus Favoriten entfernen" }
};

const localeMap = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };
const isVideo = (url) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url || '');

export default function MemoryTimeline({ memories, onEdit, onDelete, onToggleFavorite }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;

  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="absolute bottom-0 left-5 top-0 w-0.5 bg-gradient-to-b from-pink-300 via-purple-300 to-blue-300 md:left-1/2 md:-translate-x-1/2" aria-hidden="true" />
      <div className="space-y-8">
        {memories.map((memory, index) => {
          const dateLabel = memory.memory_date
            ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${String(memory.memory_date).slice(0, 10)}T12:00:00`))
            : null;
          const media = Array.isArray(memory.media_urls) ? memory.media_urls.filter(Boolean) : [];
          const isLeft = index % 2 === 0;

          return (
            <motion.article key={memory.id} initial={{ opacity: 0, x: isLeft ? -30 : 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }} className={`relative pl-14 md:w-1/2 md:pl-0 ${isLeft ? 'md:pr-8' : 'md:ml-auto md:pl-8'}`}>
              <div className={`absolute left-[14px] top-6 flex h-4 w-4 items-center justify-center rounded-full border-4 border-white bg-pink-500 shadow md:left-auto ${isLeft ? 'md:-right-[8px]' : 'md:-left-[8px]'}`} aria-hidden="true" />
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-bold text-slate-900">{memory.title}</h2>
                  <button type="button" onClick={() => onToggleFavorite(memory)} aria-label={memory.is_favorite ? t.removeFavorite : t.addFavorite} aria-pressed={Boolean(memory.is_favorite)} className="rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"><Heart className={`h-5 w-5 ${memory.is_favorite ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} aria-hidden="true" /></button>
                </div>

                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  {dateLabel && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-pink-500" aria-hidden="true" /><time dateTime={String(memory.memory_date).slice(0, 10)}>{dateLabel}</time></div>}
                  {memory.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-purple-500" aria-hidden="true" />{memory.location}</div>}
                </div>

                {memory.description && <p className="mt-4 leading-6 text-slate-700">{memory.description}</p>}

                {media.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {media.slice(0, 4).map((url, mediaIndex) => (
                      <div key={`${url}-${mediaIndex}`} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                        {isVideo(url) ? <><video src={url} className="h-full w-full object-cover" muted preload="metadata" /><div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"><Video className="h-6 w-6 text-white" aria-hidden="true" /></div></> : <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex gap-2">
                  <Button variant="outline" size="sm" type="button" onClick={() => onEdit(memory)} className="flex-1"><Edit className="mr-1 h-4 w-4" aria-hidden="true" />{t.edit}</Button>
                  <Button variant="outline" size="sm" type="button" onClick={() => onDelete(memory.id)} className="flex-1 text-red-600 hover:text-red-700"><Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />{t.delete}</Button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
