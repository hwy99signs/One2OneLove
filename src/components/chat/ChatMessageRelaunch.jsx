import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCheck, Clock, Copy, Download, FileText, MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getChatCopy } from '@/lib/chatCopy';
import { useLanguage } from '@/Layout';
import { toast } from 'sonner';

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
};

function DeliveryStatus({ message, t }) {
  if (!message?.isOwn) return null;
  if (message.status === 'sending') return <Clock className="h-3.5 w-3.5 text-gray-400" aria-label={t.sending} />;
  if (message.status === 'read' || message.readAt) return <CheckCheck className="h-3.5 w-3.5 text-blue-500" aria-label={t.read} />;
  if (message.status === 'delivered' || message.deliveredAt) return <CheckCheck className="h-3.5 w-3.5 text-gray-400" aria-label={t.delivered} />;
  return <Check className="h-3.5 w-3.5 text-gray-400" aria-label={t.delivered} />;
}

function UnavailableAttachment({ label, t }) {
  return <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 px-4 py-3 text-sm text-gray-500">{label || t.attachmentUnavailable}. {t.refreshPrivateLink}</div>;
}

function AttachmentBody({ message, t }) {
  if (message.type === 'image') {
    if (!message.imageUrl && !message.fileUrl) return <UnavailableAttachment label={t.photoUnavailable} t={t} />;
    const src = message.imageUrl || message.fileUrl;
    return <button type="button" onClick={() => window.open(src, '_blank', 'noopener,noreferrer')} className="block max-w-xs overflow-hidden rounded-xl"><img src={src} alt={message.caption || message.fileName || t.sharedPhoto} className="max-h-72 w-auto max-w-full object-contain" /></button>;
  }

  if (message.type === 'video') {
    if (!message.fileUrl) return <UnavailableAttachment label={t.videoUnavailable} t={t} />;
    return <video src={message.fileUrl} controls preload="metadata" className="max-h-72 max-w-xs rounded-xl" />;
  }

  if (message.type === 'voice' || message.type === 'audio') {
    const src = message.audioUrl || message.fileUrl;
    if (!src) return <UnavailableAttachment label={t.voiceUnavailable} t={t} />;
    return <audio src={src} controls preload="metadata" className="max-w-full" />;
  }

  if (message.type === 'file' || message.type === 'document') {
    if (!message.fileUrl) return <UnavailableAttachment label={t.documentUnavailable} t={t} />;
    return (
      <a href={message.fileUrl} download={message.fileName || undefined} className="flex min-w-[220px] max-w-xs items-center gap-3 rounded-xl border border-gray-200 bg-white/70 p-3 hover:bg-white">
        <FileText className="h-8 w-8 flex-shrink-0 text-purple-600" />
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-gray-800">{message.fileName || t.documentLabel}</span><span className="block text-xs text-gray-500">{formatBytes(message.fileSize)}</span></span>
        <Download className="h-4 w-4 flex-shrink-0 text-gray-500" />
      </a>
    );
  }

  if (message.type === 'location') {
    const latitude = Number(message.latitude ?? message.locationLat);
    const longitude = Number(message.longitude ?? message.locationLng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return <div className="text-sm text-gray-500">{t.locationUnavailable}</div>;
    const href = `https://www.google.com/maps?q=${encodeURIComponent(`${latitude},${longitude}`)}`;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="flex max-w-xs items-start gap-3 rounded-xl border border-gray-200 bg-white/70 p-3 hover:bg-white">
        <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
        <span className="text-sm text-gray-800"><span className="block font-semibold">{t.sharedLocation}</span><span className="block text-xs text-gray-500">{message.address || message.locationAddress || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}</span></span>
      </a>
    );
  }

  return null;
}

export default function ChatMessageRelaunch({ message, isOwn, onEdit, onDelete }) {
  const { currentLanguage } = useLanguage();
  const t = getChatCopy(currentLanguage);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message?.text || message?.content || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) setEditText(message?.text || message?.content || '');
  }, [isEditing, message?.text, message?.content]);

  const text = message?.text || message?.content || '';

  const copyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t.copied);
    } catch {
      toast.error(t.copyFailed);
    }
  };

  const saveEdit = async () => {
    const clean = editText.trim();
    if (!clean || clean === text) {
      setIsEditing(false);
      return;
    }
    try {
      await onEdit?.(message.id, clean);
      setIsEditing(false);
    } catch {
      // Parent mutation reports the failure; keep editor open.
    }
  };

  const deleteMessage = async () => {
    if (!isOwn || !onDelete) return;
    if (!window.confirm(t.deleteConfirm)) return;
    await onDelete(message.id);
  };

  return (
    <div className={cn('group flex w-full py-1', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('relative max-w-[82%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[72%]', isOwn ? 'bg-[#DCF8C6]' : 'border border-gray-200 bg-white')}>
        {(text || (isOwn && message.type === 'text')) && message.type === 'text' && (
          isEditing ? (
            <div className="min-w-[220px] space-y-2">
              <textarea ref={textareaRef} value={editText} onChange={(event) => setEditText(event.target.value.slice(0, 5000))} rows={Math.min(6, Math.max(2, editText.split('\n').length))} className="w-full resize-none rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-purple-300" />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsEditing(false)} className="rounded-lg px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">{t.cancel}</button><button type="button" onClick={saveEdit} className="rounded-lg bg-purple-600 px-2 py-1 text-xs font-semibold text-white hover:bg-purple-700">{t.save}</button></div>
            </div>
          ) : <p className="whitespace-pre-wrap break-words text-sm text-gray-900">{text}</p>
        )}

        {message.type !== 'text' && <AttachmentBody message={message} t={t} />}
        {message.type !== 'text' && text && text !== message.fileName && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-gray-800">{text}</p>}

        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-500">
          {message.isEdited && <span>{t.edited}</span>}
          <span>{formatTime(message.timestamp || message.createdAt || message.sentAt)}</span>
          <DeliveryStatus message={{ ...message, isOwn }} t={t} />
        </div>

        <div className={cn('absolute top-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100', isOwn ? '-left-8' : '-right-8')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button type="button" aria-label={t.messageActions} className="rounded-full p-1 text-gray-500 hover:bg-gray-200"><MoreVertical className="h-4 w-4" /></button></DropdownMenuTrigger>
            <DropdownMenuContent align={isOwn ? 'end' : 'start'} className="w-44">
              {text && <DropdownMenuItem onClick={copyText}><Copy className="mr-2 h-4 w-4" />{t.copy}</DropdownMenuItem>}
              {isOwn && message.type === 'text' && onEdit && <DropdownMenuItem onClick={() => setIsEditing(true)}><Pencil className="mr-2 h-4 w-4" />{t.edit}</DropdownMenuItem>}
              {isOwn && onDelete && <DropdownMenuItem onClick={deleteMessage} className="text-red-600 focus:text-red-600"><Trash2 className="mr-2 h-4 w-4" />{t.deleteMessage}</DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}