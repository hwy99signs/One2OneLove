import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CircleHelp, Loader2, MessageSquareReply } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  SUPPORT_REQUESTS_ENABLED,
  listMySupportRequests,
  markSupportResponseRead,
} from '@/lib/supportRequestService';

const COPY = {
  en: { label: 'Support responses', empty: 'No support responses yet.', response: 'One2OneLove replied', view: 'Open support request', openSupport: 'Open member support', status: { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' } },
  es: { label: 'Respuestas de soporte', empty: 'Aún no hay respuestas de soporte.', response: 'One2OneLove respondió', view: 'Abrir solicitud de soporte', openSupport: 'Abrir soporte para miembros', status: { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' } },
  fr: { label: 'Réponses du support', empty: 'Aucune réponse du support pour le moment.', response: 'One2OneLove a répondu', view: 'Ouvrir la demande', openSupport: 'Ouvrir l’assistance membres', status: { open: 'Ouverte', in_progress: 'En cours', resolved: 'Résolue', closed: 'Fermée' } },
  it: { label: 'Risposte assistenza', empty: 'Nessuna risposta di assistenza.', response: 'One2OneLove ha risposto', view: 'Apri richiesta di assistenza', openSupport: 'Apri assistenza membri', status: { open: 'Aperta', in_progress: 'In lavorazione', resolved: 'Risolta', closed: 'Chiusa' } },
  de: { label: 'Supportantworten', empty: 'Noch keine Supportantworten.', response: 'One2OneLove hat geantwortet', view: 'Supportanfrage öffnen', openSupport: 'Mitglieder-Support öffnen', status: { open: 'Offen', in_progress: 'In Bearbeitung', resolved: 'Gelöst', closed: 'Geschlossen' } },
  nl: { label: 'Supportantwoorden', empty: 'Nog geen supportantwoorden.', response: 'One2OneLove heeft geantwoord', view: 'Supportverzoek openen', openSupport: 'Ledenondersteuning openen', status: { open: 'Open', in_progress: 'In behandeling', resolved: 'Opgelost', closed: 'Gesloten' } },
};

const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL' };

export default function SupportNotificationCenter({ languageCode = 'en' }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const language = COPY[languageCode] ? languageCode : 'en';
  const t = COPY[language];
  const locale = localeByLanguage[language] || 'en-US';
  const panelRef = useRef(null);
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);

  const load = async () => {
    if (!SUPPORT_REQUESTS_ENABLED || !isAuthenticated || !user?.id) return;
    setLoading(true);
    try {
      const rows = await listMySupportRequests();
      setRequests(rows.filter((item) => Boolean(item.staff_response)).slice(0, 20));
      setAvailable(true);
    } catch {
      setAvailable(false);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!SUPPORT_REQUESTS_ENABLED || !isAuthenticated || !user?.id) {
      setAvailable(false);
      setRequests([]);
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

  const unreadCount = useMemo(
    () => requests.filter((item) => item.staff_response && !item.member_response_read_at).length,
    [requests]
  );

  if (!SUPPORT_REQUESTS_ENABLED || !isAuthenticated || !available) return null;

  const openRequest = async (item) => {
    if (item.staff_response && !item.member_response_read_at) {
      try {
        const updated = await markSupportResponseRead(item.id);
        if (updated?.member_response_read_at) {
          setRequests((current) => current.map((row) => row.id === item.id
            ? { ...row, member_response_read_at: updated.member_response_read_at }
            : row));
        }
      } catch {
        // The member can still open support if saving the read receipt fails.
      }
    }
    setOpen(false);
    navigate('/SupportRequests');
  };

  const openSupport = () => {
    setOpen(false);
    navigate('/SupportRequests');
  };

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.label}
        title={t.label}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/85 transition hover:bg-white/10 hover:text-white"
      >
        <CircleHelp className="h-5 w-5" />
        {unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-black leading-4 text-white">{Math.min(unreadCount, 99)}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-[80] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 font-black"><CircleHelp className="h-4 w-4 text-violet-600" />{t.label}</div>
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {requests.length ? requests.map((item) => {
              const when = new Date(item.responded_at || item.updated_at).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
              const unread = Boolean(item.staff_response && !item.member_response_read_at);
              return (
                <button key={item.id} type="button" onClick={() => openRequest(item)} className={`mb-1 w-full rounded-xl p-3 text-left transition hover:bg-slate-50 ${unread ? 'bg-violet-50/70' : 'bg-white'}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><MessageSquareReply className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black uppercase tracking-[0.11em] text-violet-700">{t.response}</div>
                      <div className="mt-1 truncate text-sm font-bold text-slate-900">{item.subject}</div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.staff_response}</div>
                      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-bold text-slate-400"><span>{t.status[item.status] || item.status}</span><span>{when}</span></div>
                      <div className="mt-2 text-[11px] font-black text-violet-700">{t.view}</div>
                    </div>
                  </div>
                </button>
              );
            }) : <div className="px-4 py-8 text-center text-sm text-slate-500">{t.empty}</div>}
          </div>
          <div className="border-t border-slate-100 p-2">
            <button type="button" onClick={openSupport} className="w-full rounded-xl px-3 py-2.5 text-sm font-black text-violet-700 transition hover:bg-violet-50">{t.openSupport}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
