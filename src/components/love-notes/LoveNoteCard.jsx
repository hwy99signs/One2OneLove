import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, MailOpen, Trash2 } from "lucide-react";
import { useLanguage } from "@/Layout";

const translations = {
  en: { sentTo: "Sent to", receivedFrom: "Received from", unread: "Unread", read: "Read", markRead: "Mark as read", delete: "Delete sent note" },
  es: { sentTo: "Enviado a", receivedFrom: "Recibido de", unread: "No leído", read: "Leído", markRead: "Marcar como leído", delete: "Eliminar nota enviada" },
  fr: { sentTo: "Envoyé à", receivedFrom: "Reçu de", unread: "Non lu", read: "Lu", markRead: "Marquer comme lu", delete: "Supprimer la note envoyée" },
  it: { sentTo: "Inviato a", receivedFrom: "Ricevuto da", unread: "Non letto", read: "Letto", markRead: "Segna come letto", delete: "Elimina nota inviata" },
  de: { sentTo: "Gesendet an", receivedFrom: "Erhalten von", unread: "Ungelesen", read: "Gelesen", markRead: "Als gelesen markieren", delete: "Gesendete Nachricht löschen" }
};

const localeMap = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };

export default function LoveNoteCard({ note, partnerName, onMarkRead, onDelete }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeMap[currentLanguage] || localeMap.en;
  const sentAt = note.sent_at || note.created_at;
  const dateLabel = sentAt ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(sentAt)) : '';
  const isSent = note.direction === 'sent';
  const background = /^#[0-9A-Fa-f]{6}$/.test(note.background_color || '') ? note.background_color : '#FFF7ED';
  const textColor = /^#[0-9A-Fa-f]{6}$/.test(note.text_color || '') ? note.text_color : '#1F2937';
  const alignment = ['left', 'center', 'right'].includes(note.alignment) ? note.alignment : 'center';
  const fontSize = Math.min(Math.max(Number(note.font_size) || 18, 12), 32);
  const fontFamily = String(note.font_family || 'Georgia').slice(0, 80);

  return (
    <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          {isSent ? <Mail className="h-4 w-4 text-pink-600" aria-hidden="true" /> : note.is_read ? <MailOpen className="h-4 w-4 text-green-600" aria-hidden="true" /> : <Mail className="h-4 w-4 text-purple-600" aria-hidden="true" />}
          <span className="font-semibold">{isSent ? t.sentTo : t.receivedFrom} {partnerName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {!isSent && <span className={`rounded-full px-2 py-1 font-semibold ${note.is_read ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'}`}>{note.is_read ? t.read : t.unread}</span>}
          {dateLabel && <time dateTime={sentAt}>{dateLabel}</time>}
        </div>
      </div>

      <div className="min-h-44 p-6 md:p-8" style={{ backgroundColor: background, color: textColor, textAlign: alignment, fontFamily, fontSize: `${fontSize}px` }}>
        <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
        {!isSent && !note.is_read && (
          <Button variant="outline" size="sm" type="button" onClick={() => onMarkRead(note.id)}>
            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />{t.markRead}
          </Button>
        )}
        {isSent && (
          <Button variant="outline" size="sm" type="button" onClick={() => onDelete(note.id)} className="text-red-600 hover:text-red-700">
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />{t.delete}
          </Button>
        )}
      </div>
    </motion.article>
  );
}
