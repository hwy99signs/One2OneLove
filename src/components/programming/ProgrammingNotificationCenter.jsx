import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CalendarClock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  PROGRAMMING_REMINDERS_ENABLED,
  listProgrammingNotifications,
  markProgrammingNotificationRead,
} from '@/lib/programmingReminderService';

const COPY = {
  en: { label: 'Programming reminders', empty: 'No programming reminders yet.', reminder: 'Programming reminder', creator: 'Creator', o2ol: 'O2OL', live: 'Live', replay: 'Replay', scheduled: (title, time) => `You asked to be reminded about “${title},” scheduled for ${time}.` },
  es: { label: 'Recordatorios de programación', empty: 'Aún no hay recordatorios de programación.', reminder: 'Recordatorio de programación', creator: 'Creador', o2ol: 'O2OL', live: 'En vivo', replay: 'Repetición', scheduled: (title, time) => `Pediste un recordatorio para “${title}”, programado para ${time}.` },
  fr: { label: 'Rappels de programmation', empty: 'Aucun rappel de programmation pour le moment.', reminder: 'Rappel de programmation', creator: 'Créateur', o2ol: 'O2OL', live: 'Direct', replay: 'Rediffusion', scheduled: (title, time) => `Vous avez demandé un rappel pour « ${title} », prévu à ${time}.` },
  it: { label: 'Promemoria programmazione', empty: 'Nessun promemoria di programmazione.', reminder: 'Promemoria programmazione', creator: 'Creator', o2ol: 'O2OL', live: 'Live', replay: 'Replica', scheduled: (title, time) => `Hai richiesto un promemoria per “${title}”, programmato per ${time}.` },
  de: { label: 'Programmerinnerungen', empty: 'Noch keine Programmerinnerungen.', reminder: 'Programmerinnerung', creator: 'Creator', o2ol: 'O2OL', live: 'Live', replay: 'Wiederholung', scheduled: (title, time) => `Du hast eine Erinnerung für „${title}“ angefordert. Geplant für ${time}.` },
  nl: { label: 'Programmaherinneringen', empty: 'Nog geen programmaherinneringen.', reminder: 'Programmaherinnering', creator: 'Creator', o2ol: 'O2OL', live: 'Live', replay: 'Herhaling', scheduled: (title, time) => `Je vroeg om een herinnering voor “${title}”, gepland voor ${time}.` },
};

const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL' };

export default function ProgrammingNotificationCenter({ languageCode = 'en' }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const language = COPY[languageCode] ? languageCode : 'en';
  const t = COPY[language];
  const locale = localeByLanguage[language] || 'en-US';
  const panelRef = useRef(null);
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    if (!PROGRAMMING_REMINDERS_ENABLED || !isAuthenticated || !user?.id) return;
    setLoading(true);
    try {
      const rows = await listProgrammingNotifications(20);
      setNotifications(rows);
      setAvailable(true);
    } catch {
      setAvailable(false);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!PROGRAMMING_REMINDERS_ENABLED || !isAuthenticated || !user?.id) {
      setAvailable(false);
      setNotifications([]);
      return undefined;
    }

    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read_at).length, [notifications]);

  if (!PROGRAMMING_REMINDERS_ENABLED || !isAuthenticated || !available) return null;

  const openNotification = async (item) => {
    if (!item.read_at) {
      try {
        const updated = await markProgrammingNotificationRead(item.id);
        if (updated?.read_at) {
          setNotifications((current) => current.map((row) => row.id === item.id ? { ...row, read_at: updated.read_at } : row));
        }
      } catch {
        // Navigation remains available even if the read receipt cannot be saved.
      }
    }
    setOpen(false);
    navigate(item.action_path || '/LiveRoom?room=global-relationship-room');
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.label}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-black leading-4 text-white">{Math.min(unreadCount, 99)}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[80] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 font-black text-slate-900"><Bell className="h-4 w-4 text-violet-600" />{t.label}</div>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length ? notifications.map((item) => {
              const when = new Date(item.starts_at).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
              return (
                <button key={item.id} type="button" onClick={() => openNotification(item)} className={`mb-1 w-full rounded-xl p-3 text-left transition hover:bg-slate-50 ${item.read_at ? 'bg-white' : 'bg-violet-50/70'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><CalendarClock className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black uppercase tracking-[0.11em] text-violet-700">{t.reminder}</div>
                      <div className="mt-1 text-sm font-bold leading-5 text-slate-900">{t.scheduled(item.program_title, when)}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-black uppercase"><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{item.program_source === 'o2ol' ? t.o2ol : t.creator}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{item.content_mode === 'replay' ? t.replay : t.live}</span></div>
                    </div>
                  </div>
                </button>
              );
            }) : <div className="px-4 py-8 text-center text-sm text-slate-500">{t.empty}</div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
