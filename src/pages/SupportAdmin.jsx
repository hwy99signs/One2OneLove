import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MessageSquareReply, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';
import {
  SUPPORT_REQUESTS_ENABLED,
  closeSupportRequestAsStaff,
  getSupportAdminAccess,
  listSupportQueue,
  reopenSupportRequest,
  respondToSupportRequest,
  startSupportRequest,
} from '@/lib/supportRequestService';

const COPY = {
  en: { title: 'O2OL support queue', intro: 'Review private member support requests without exposing account identity in the queue payload.', disabled: 'Support administration is staged, not live yet.', denied: 'O2OL support administrator access required.', loading: 'Loading support queue…', empty: 'No support requests in this queue.', open: 'Open', inProgress: 'In progress', resolved: 'Resolved', closed: 'Closed', allActive: 'Active queue', submitted: 'Submitted', response: 'Response', respond: 'Resolve with response', start: 'Start work', close: 'Close', reopen: 'Reopen', actionFailed: 'The support action could not be completed.', categories: { account: 'Account', technical: 'Technical problem', billing: 'Billing', safety: 'Safety concern', feedback: 'Feedback', other: 'Other' }, statuses: { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' } },
  es: { title: 'Cola de soporte O2OL', intro: 'Revisa solicitudes privadas sin exponer la identidad de la cuenta en la cola.', disabled: 'La administración de soporte está preparada, pero aún no está activa.', denied: 'Se requiere acceso de administrador de soporte O2OL.', loading: 'Cargando cola…', empty: 'No hay solicitudes en esta cola.', open: 'Abiertas', inProgress: 'En progreso', resolved: 'Resueltas', closed: 'Cerradas', allActive: 'Cola activa', submitted: 'Enviada', response: 'Respuesta', respond: 'Resolver con respuesta', start: 'Comenzar', close: 'Cerrar', reopen: 'Reabrir', actionFailed: 'No se pudo completar la acción de soporte.', categories: { account: 'Cuenta', technical: 'Problema técnico', billing: 'Facturación', safety: 'Preocupación de seguridad', feedback: 'Comentarios', other: 'Otro' }, statuses: { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' } },
  fr: { title: 'File d’assistance O2OL', intro: 'Examinez les demandes privées sans exposer l’identité du compte dans la file.', disabled: 'L’administration de l’assistance est préparée, mais pas encore active.', denied: 'Accès administrateur d’assistance O2OL requis.', loading: 'Chargement de la file…', empty: 'Aucune demande dans cette file.', open: 'Ouvertes', inProgress: 'En cours', resolved: 'Résolues', closed: 'Fermées', allActive: 'File active', submitted: 'Envoyée', response: 'Réponse', respond: 'Résoudre avec réponse', start: 'Commencer', close: 'Fermer', reopen: 'Rouvrir', actionFailed: 'L’action d’assistance n’a pas pu être effectuée.', categories: { account: 'Compte', technical: 'Problème technique', billing: 'Facturation', safety: 'Préoccupation de sécurité', feedback: 'Commentaire', other: 'Autre' }, statuses: { open: 'Ouverte', in_progress: 'En cours', resolved: 'Résolue', closed: 'Fermée' } },
  it: { title: 'Coda supporto O2OL', intro: 'Esamina le richieste private senza mostrare l’identità dell’account nella coda.', disabled: 'L’amministrazione supporto è predisposta, ma non ancora attiva.', denied: 'È richiesto l’accesso amministratore supporto O2OL.', loading: 'Caricamento coda…', empty: 'Nessuna richiesta in questa coda.', open: 'Aperte', inProgress: 'In lavorazione', resolved: 'Risolte', closed: 'Chiuse', allActive: 'Coda attiva', submitted: 'Inviata', response: 'Risposta', respond: 'Risolvi con risposta', start: 'Inizia lavoro', close: 'Chiudi', reopen: 'Riapri', actionFailed: 'Impossibile completare l’azione di supporto.', categories: { account: 'Account', technical: 'Problema tecnico', billing: 'Fatturazione', safety: 'Problema di sicurezza', feedback: 'Feedback', other: 'Altro' }, statuses: { open: 'Aperta', in_progress: 'In lavorazione', resolved: 'Risolta', closed: 'Chiusa' } },
  de: { title: 'O2OL-Supportwarteschlange', intro: 'Prüfe private Supportanfragen, ohne die Kontenidentität in der Warteschlange offenzulegen.', disabled: 'Supportverwaltung ist vorbereitet, aber noch nicht aktiv.', denied: 'O2OL-Supportadministratorzugang erforderlich.', loading: 'Supportwarteschlange wird geladen…', empty: 'Keine Supportanfragen in dieser Warteschlange.', open: 'Offen', inProgress: 'In Bearbeitung', resolved: 'Gelöst', closed: 'Geschlossen', allActive: 'Aktive Warteschlange', submitted: 'Gesendet', response: 'Antwort', respond: 'Mit Antwort lösen', start: 'Bearbeitung starten', close: 'Schließen', reopen: 'Wieder öffnen', actionFailed: 'Supportaktion konnte nicht abgeschlossen werden.', categories: { account: 'Konto', technical: 'Technisches Problem', billing: 'Abrechnung', safety: 'Sicherheitsanliegen', feedback: 'Feedback', other: 'Sonstiges' }, statuses: { open: 'Offen', in_progress: 'In Bearbeitung', resolved: 'Gelöst', closed: 'Geschlossen' } },
  nl: { title: 'O2OL-supportqueue', intro: 'Beoordeel privé-supportverzoeken zonder accountidentiteit in de queue te tonen.', disabled: 'Supportbeheer is voorbereid, maar nog niet actief.', denied: 'O2OL-supportbeheerderstoegang vereist.', loading: 'Supportqueue laden…', empty: 'Geen supportverzoeken in deze queue.', open: 'Open', inProgress: 'In behandeling', resolved: 'Opgelost', closed: 'Gesloten', allActive: 'Actieve queue', submitted: 'Ingediend', response: 'Antwoord', respond: 'Oplossen met antwoord', start: 'Start behandeling', close: 'Sluiten', reopen: 'Heropenen', actionFailed: 'De supportactie kon niet worden voltooid.', categories: { account: 'Account', technical: 'Technisch probleem', billing: 'Facturering', safety: 'Veiligheidszorg', feedback: 'Feedback', other: 'Anders' }, statuses: { open: 'Open', in_progress: 'In behandeling', resolved: 'Opgelost', closed: 'Gesloten' } },
};

const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL' };

export default function SupportAdmin() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const locale = localeByLanguage[language] || 'en-US';
  const [access, setAccess] = useState(null);
  const [status, setStatus] = useState('');
  const [requests, setRequests] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(SUPPORT_REQUESTS_ENABLED);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = async (filter = status) => {
    if (!SUPPORT_REQUESTS_ENABLED) return;
    setLoading(true);
    setError('');
    try {
      const accessResult = await getSupportAdminAccess();
      setAccess(accessResult);
      if (!accessResult.eligible) return;
      setRequests(await listSupportQueue(filter));
    } catch {
      setError(t.actionFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(status); }, [status]);

  const act = async (requestId, action) => {
    setBusyId(requestId);
    setError('');
    try {
      if (action === 'start') await startSupportRequest(requestId);
      else if (action === 'close') await closeSupportRequestAsStaff(requestId);
      else if (action === 'reopen') await reopenSupportRequest(requestId);
      else if (action === 'respond') await respondToSupportRequest(requestId, responses[requestId] || '');
      setResponses((current) => ({ ...current, [requestId]: '' }));
      await load(status);
    } catch {
      setError(t.actionFailed);
    } finally {
      setBusyId('');
    }
  };

  if (!SUPPORT_REQUESTS_ENABLED) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-slate-500" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.disabled}</h1></div></main>;
  }

  if (loading && !access) {
    return <main className="min-h-[70vh] px-5 py-16"><div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl bg-white p-10 text-slate-600 shadow-lg"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div></main>;
  }

  if (access && !access.eligible) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-rose-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.denied}</h1></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-slate-950 p-7 text-white sm:p-9"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300"><ShieldCheck className="h-4 w-4" />O2OL</div><h1 className="mt-3 text-4xl font-black">{t.title}</h1><p className="mt-4 max-w-3xl leading-7 text-slate-300">{t.intro}</p></div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><Button size="sm" variant={status === '' ? 'default' : 'outline'} onClick={() => setStatus('')}>{t.allActive}</Button><Button size="sm" variant={status === 'open' ? 'default' : 'outline'} onClick={() => setStatus('open')}>{t.open}</Button><Button size="sm" variant={status === 'in_progress' ? 'default' : 'outline'} onClick={() => setStatus('in_progress')}>{t.inProgress}</Button><Button size="sm" variant={status === 'resolved' ? 'default' : 'outline'} onClick={() => setStatus('resolved')}>{t.resolved}</Button><Button size="sm" variant={status === 'closed' ? 'default' : 'outline'} onClick={() => setStatus('closed')}>{t.closed}</Button><Button size="sm" variant="ghost" onClick={() => load(status)} aria-label={t.loading}><RotateCcw className="h-4 w-4" /></Button></div>

        {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-800">{error}</div> : null}

        <div className="mt-6 space-y-5">
          {loading ? <div className="flex justify-center py-16 text-slate-500"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div> : requests.length ? requests.map((item) => <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-800">{t.categories[item.category] || item.category}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-700">{t.statuses[item.status] || item.status}</span></div><h2 className="mt-3 text-2xl font-black text-slate-950">{item.subject}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{item.message}</p><div className="mt-3 text-xs font-bold text-slate-400">{t.submitted}: {new Date(item.created_at).toLocaleString(locale)}</div>{item.staff_response ? <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="font-black text-emerald-900">{t.response}</div><p className="mt-2 whitespace-pre-wrap leading-7 text-emerald-950">{item.staff_response}</p></div> : null}{item.status !== 'closed' ? <div className="mt-5"><textarea value={responses[item.id] || ''} onChange={(event) => setResponses((current) => ({ ...current, [item.id]: event.target.value.slice(0, 4000) }))} rows={4} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400" /><Button className="mt-2" disabled={busyId === item.id || (responses[item.id] || '').trim().length < 3} onClick={() => act(item.id, 'respond')}><MessageSquareReply className="mr-2 h-4 w-4" />{t.respond}</Button></div> : null}</div><div className="flex shrink-0 flex-wrap gap-2">{item.status === 'open' ? <Button variant="outline" disabled={busyId === item.id} onClick={() => act(item.id, 'start')}>{busyId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{t.start}</Button> : null}{['open','in_progress','resolved'].includes(item.status) ? <Button variant="outline" disabled={busyId === item.id} onClick={() => act(item.id, 'close')}><XCircle className="mr-2 h-4 w-4" />{t.close}</Button> : null}{['resolved','closed'].includes(item.status) ? <Button variant="outline" disabled={busyId === item.id} onClick={() => act(item.id, 'reopen')}><CheckCircle2 className="mr-2 h-4 w-4" />{t.reopen}</Button> : null}</div></div></article>) : <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">{t.empty}</div>}
        </div>
      </div>
    </main>
  );
}
