import React, { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, MapPin, Mic, Paperclip, Send, Video, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import VoiceRecorder from './VoiceRecorder';
import { toast } from 'sonner';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const VIDEO_ACCEPT = 'video/mp4,video/webm,video/quicktime';
const DOCUMENT_ACCEPT = '.pdf,.txt,.doc,.docx,.xls,.xlsx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// These switches are intentionally OFF unless an approved deployment environment
// explicitly enables them after the private-storage/location review and controlled tests.
const CHAT_ATTACHMENTS_ENABLED = import.meta.env.VITE_CHAT_ATTACHMENTS_ENABLED === 'true';
const CHAT_LOCATION_ENABLED = import.meta.env.VITE_CHAT_LOCATION_ENABLED === 'true';

const voiceFileFromBlob = (blob) => {
  if (typeof File === 'undefined') return blob;
  const mime = String(blob?.type || 'audio/webm').toLowerCase();
  const extension = mime.includes('ogg') ? 'ogg' : mime.includes('mp4') ? 'm4a' : mime.includes('wav') ? 'wav' : 'webm';
  return new File([blob], `voice-${Date.now()}.${extension}`, { type: blob?.type || 'audio/webm' });
};

export default function ChatComposerRelaunch({ onSendMessage, onSendFile, onSendLocation, disabled = false }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const textareaRef = useRef(null);

  const locked = disabled || busy;

  const sendText = async () => {
    const clean = message.trim();
    if (!clean || locked || !onSendMessage) return;
    setBusy(true);
    try {
      await onSendMessage(clean);
      setMessage('');
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch {
      // Parent mutation owns the error toast and the draft is intentionally preserved.
    } finally {
      setBusy(false);
    }
  };

  const sendSelectedFile = async (event, messageType) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!CHAT_ATTACHMENTS_ENABLED || !file || !onSendFile || locked) return;

    setBusy(true);
    try {
      await onSendFile(file, messageType);
    } catch {
      // Parent mutation reports the actual backend/storage error.
    } finally {
      setBusy(false);
    }
  };

  const sendVoice = async (blob, duration) => {
    if (!CHAT_ATTACHMENTS_ENABLED || !blob || !onSendFile) return;
    setBusy(true);
    try {
      await onSendFile(voiceFileFromBlob(blob), 'voice', duration);
      setShowVoiceRecorder(false);
    } catch {
      // Keep the recorder view available if delivery failed.
    } finally {
      setBusy(false);
    }
  };

  const shareLocation = () => {
    if (!CHAT_LOCATION_ENABLED || locked || !onSendLocation) return;
    if (!navigator.geolocation) {
      toast.error('Location sharing is not supported by this browser');
      return;
    }

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await onSendLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        } catch {
          // Parent mutation reports the error.
        } finally {
          setBusy(false);
        }
      },
      () => {
        setBusy(false);
        toast.error('Location permission was not available');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  if (CHAT_ATTACHMENTS_ENABLED && showVoiceRecorder) {
    return (
      <div className="border-t border-gray-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Voice note</span>
          <button type="button" onClick={() => setShowVoiceRecorder(false)} disabled={busy} className="rounded-full p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50" aria-label="Cancel voice note"><X className="h-4 w-4" /></button>
        </div>
        <VoiceRecorder onRecordingComplete={sendVoice} onCancel={() => setShowVoiceRecorder(false)} />
      </div>
    );
  }

  const showExtraTools = CHAT_ATTACHMENTS_ENABLED || CHAT_LOCATION_ENABLED;

  return (
    <div className="border-t border-gray-200 bg-white p-2">
      <div className="flex items-end gap-2">
        {showExtraTools && (
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" disabled={locked} aria-label="Add attachment or location" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"><Paperclip className="h-5 w-5" /></button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="grid grid-cols-2 gap-2">
                {CHAT_ATTACHMENTS_ENABLED && <>
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-2 rounded-lg p-3 hover:bg-gray-100"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><ImageIcon className="h-5 w-5 text-blue-600" /></span><span className="text-sm text-gray-700">Photo</span></button>
                  <button type="button" onClick={() => videoInputRef.current?.click()} className="flex flex-col items-center gap-2 rounded-lg p-3 hover:bg-gray-100"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100"><Video className="h-5 w-5 text-red-600" /></span><span className="text-sm text-gray-700">Video</span></button>
                  <button type="button" onClick={() => documentInputRef.current?.click()} className="flex flex-col items-center gap-2 rounded-lg p-3 hover:bg-gray-100"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100"><FileText className="h-5 w-5 text-purple-600" /></span><span className="text-sm text-gray-700">Document</span></button>
                </>}
                {CHAT_LOCATION_ENABLED && <button type="button" onClick={shareLocation} className="flex flex-col items-center gap-2 rounded-lg p-3 hover:bg-gray-100"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100"><MapPin className="h-5 w-5 text-green-600" /></span><span className="text-sm text-gray-700">Location</span></button>}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {CHAT_ATTACHMENTS_ENABLED && <>
          <input ref={imageInputRef} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(event) => sendSelectedFile(event, 'image')} />
          <input ref={videoInputRef} type="file" accept={VIDEO_ACCEPT} className="hidden" onChange={(event) => sendSelectedFile(event, 'video')} />
          <input ref={documentInputRef} type="file" accept={DOCUMENT_ACCEPT} className="hidden" onChange={(event) => sendSelectedFile(event, 'file')} />
        </>}

        <div className="flex flex-1 items-end rounded-3xl bg-gray-100 px-4 py-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 5000))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void sendText();
              }
            }}
            placeholder="Type a message"
            disabled={locked}
            rows={1}
            className="max-h-32 min-h-[24px] flex-1 resize-none overflow-y-auto border-none bg-transparent text-sm outline-none disabled:opacity-50"
          />
        </div>

        {message.trim() || !CHAT_ATTACHMENTS_ENABLED ? (
          <button type="button" onClick={() => void sendText()} disabled={locked || !message.trim()} aria-label="Send message" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-5 w-5" /></button>
        ) : (
          <button type="button" onClick={() => setShowVoiceRecorder(true)} disabled={locked} aria-label="Record voice note" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"><Mic className="h-5 w-5" /></button>
        )}
      </div>
      {!showExtraTools && <p className="mt-1 px-3 text-[11px] text-gray-400">Private text chat is active. Attachments and location sharing remain staged until their privacy review is activated.</p>}
      {showExtraTools && <p className="mt-1 px-12 text-[11px] text-gray-400">Only activated private-chat tools are shown.</p>}
    </div>
  );
}
