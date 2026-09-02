import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';
import {
  PRIVACY_REVIEW_ENABLED,
  acceptPrivacyRequestForFulfillment,
  declinePrivacyRequest,
  getPrivacyReviewAccess,
  listPrivacyReviewQueue,
  reopenPrivacyRequest,
  startPrivacyReview,
} from '@/lib/privacyReviewService';

const COPY = {
  en: {
    title: 'O2OL privacy request review',
    intro: 'Review member privacy requests without claiming that an export or deletion has already been fulfilled.',
    boundary: 'This console reviews requests only. Accepting a request moves it to Awaiting fulfillment. It does not export data, delete an account, change billing, or send a message.',
    disabled: 'Privacy request review is staged and not live yet.',
    denied: 'O2OL privacy reviewer access required.',
    loading: 'Loading privacy requests…',
    empty: 'No privacy requests in this queue.',
    active: 'Active review queue', submitted: 'Submitted', inReview: 'In review', awaiting: 'Awaiting fulfillment', declined: 'Declined', canceled: 'Canceled',
    requestTypes: { data_export: 'Data export', account_deletion: 'Account deletion', data_correction: 'Data correction' },
    statuses: { submitted: 'Submitted', in_review: 'In review', awaiting_fulfillment: 'Awaiting fulfillment', declined: 'Declined', canceled: 'Canceled' },
    memberNote: 'Member note', response: 'Review response', start: 'Start review', accept: 'Accept for fulfillment', decline: 'Decline', reopen: 'Reopen review', submittedAt: 'Submitted', decisionAt: 'Review decision', actionFailed: 'The privacy review action could not be completed.', responseRequired: 'Enter a review response before accepting or declining.'
  },
  es: {
    title: 'Revisión de solicitudes de privacidad O2OL',
    intro: 'Revisa solicitudes de privacidad sin afirmar que una exportación o eliminación ya fue ejecutada.',
    boundary: 'Esta consola solo revisa solicitudes. Aceptar una solicitud la mueve a En espera de ejecución. No exporta datos, elimina cuentas, cambia la facturación ni envía mensajes.',
    disabled: 'La revisión de privacidad está preparada, pero aún no está activa.', denied: 'Se requiere acceso de revisor de privacidad O2OL.', loading: 'Cargando solicitudes de privacidad…', empty: 'No hay solicitudes en esta cola.',
    active: 'Cola activa', submitted: 'Enviadas', inReview: 'En revisión', awaiting: 'En espera de ejecución', declined: 'Rechazadas', canceled: 'Canceladas',
    requestTypes: { data_export: 'Exportación de datos', account_deletion: 'Eliminación de cuenta', data_correction: 'Corrección de datos' },
    statuses: { submitted: 'Enviada', in_review: 'En revisión', awaiting_fulfillment: 'En espera de ejecución', declined: 'Rechazada', canceled: 'Cancelada' },
    memberNote: 'Nota del miembro', response: 'Respuesta de revisión', start: 'Comenzar revisión', accept: 'Aceptar para ejecución', decline: 'Rechazar', reopen: 'Reabrir revisión', submittedAt: 'Enviada', decisionAt: 'Decisión de revisión', actionFailed: 'No se pudo completar la acción de revisión.', responseRequired: 'Escribe una respuesta antes de aceptar o rechazar.'
  },
  fr: {
    title: 'Examen des demandes de confidentialité O2OL',
    intro: 'Examinez les demandes sans prétendre qu’un export ou une suppression a déjà été exécuté.',
    boundary: 'Cette console examine uniquement les demandes. Une demande acceptée passe à En attente de traitement. Elle n’exporte pas les données, ne supprime pas de compte, ne modifie pas la facturation et n’envoie aucun message.',
    disabled: 'L’examen des demandes est préparé, mais pas encore actif.', denied: 'Accès réviseur de confidentialité O2OL requis.', loading: 'Chargement des demandes…', empty: 'Aucune demande dans cette file.',
    active: 'File active', submitted: 'Envoyées', inReview: 'En cours de revue', awaiting: 'En attente de traitement', declined: 'Refusées', canceled: 'Annulées',
    requestTypes: { data_export: 'Export des données', account_deletion: 'Suppression du compte', data_correction: 'Correction des données' },
    statuses: { submitted: 'Envoyée', in_review: 'En cours de revue', awaiting_fulfillment: 'En attente de traitement', declined: 'Refusée', canceled: 'Annulée' },
    memberNote: 'Note du membre', response: 'Réponse d’examen', start: 'Commencer l’examen', accept: 'Accepter pour traitement', decline: 'Refuser', reopen: 'Rouvrir l’examen', submittedAt: 'Envoyée', decisionAt: 'Décision d’examen', actionFailed: 'L’action d’examen n’a pas pu être effectuée.', responseRequired: 'Saisissez une réponse avant d’accepter ou de refuser.'
  },
  it: {
    title: 'Revisione richieste privacy O2OL',
    intro: 'Esamina le richieste senza indicare che un’esportazione o eliminazione sia già stata eseguita.',
    boundary: 'Questa console esamina soltanto le richieste. Accettarne una la sposta a In attesa di evasione. Non esporta dati, elimina account, modifica la fatturazione o invia messaggi.',
    disabled: 'La revisione privacy è predisposta, ma non ancora attiva.', denied: 'È richiesto l’accesso revisore privacy O2OL.', loading: 'Caricamento richieste privacy…', empty: 'Nessuna richiesta in questa coda.',
    active: 'Coda attiva', submitted: 'Inviate', inReview: 'In revisione', awaiting: 'In attesa di evasione', declined: 'Rifiutate', canceled: 'Annullate',
    requestTypes: { data_export: 'Esportazione dati', account_deletion: 'Eliminazione account', data_correction: 'Correzione dati' },
    statuses: { submitted: 'Inviata', in_review: 'In revisione', awaiting_fulfillment: 'In attesa di evasione', declined: 'Rifiutata', canceled: 'Annullata' },
    memberNote: 'Nota del membro', response: 'Risposta di revisione', start: 'Avvia revisione', accept: 'Accetta per evasione', decline: 'Rifiuta', reopen: 'Riapri revisione', submittedAt: 'Inviata', decisionAt: 'Decisione di revisione', actionFailed: 'Impossibile completare l’azione di revisione.', responseRequired: 'Inserisci una risposta prima di accettare o rifiutare.'
  },
  de: {
    title: 'O2OL-Datenschutzanfragen prüfen',
    intro: 'Prüfe Datenschutzanfragen, ohne zu behaupten, dass Export oder Löschung bereits ausgeführt wurden.',
    boundary: 'Diese Konsole prüft Anfragen nur. Eine angenommene Anfrage wechselt zu Ausführung ausstehend. Sie exportiert keine Daten, löscht kein Konto, ändert keine Abrechnung und sendet keine Nachricht.',
    disabled: 'Die Datenschutzprüfung ist vorbereitet, aber noch nicht aktiv.', denied: 'O2OL-Datenschutzprüferzugang erforderlich.', loading: 'Datenschutzanfragen werden geladen…', empty: 'Keine Anfragen in dieser Warteschlange.',
    active: 'Aktive Warteschlange', submitted: 'Eingereicht', inReview: 'In Prüfung', awaiting: 'Ausführung ausstehend', declined: 'Abgelehnt', canceled: 'Storniert',
    requestTypes: { data_export: 'Datenexport', account_deletion: 'Kontolöschung', data_correction: 'Datenkorrektur' },
    statuses: { submitted: 'Eingereicht', in_review: 'In Prüfung', awaiting_fulfillment: 'Ausführung ausstehend', declined: 'Abgelehnt', canceled: 'Storniert' },
    memberNote: 'Mitgliedsnotiz', response: 'Prüfantwort', start: 'Prüfung starten', accept: 'Zur Ausführung annehmen', decline: 'Ablehnen', reopen: 'Prüfung wieder öffnen', submittedAt: 'Eingereicht', decisionAt: 'Prüfentscheidung', actionFailed: 'Die Datenschutz-Prüfaktion konnte nicht abgeschlossen werden.', responseRequired: 'Gib vor Annahme oder Ablehnung eine Prüfantwort ein.'
  },
};

const LOCALES = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };
const FILTERS = ['', 'submitted', 'in_review', 'awaiting_fulfillment', 'declined', 'canceled'];

export default function PrivacyAdmin() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const locale = LOCALES[language] || 'en-US';
  const [access, setAccess] = useState(null);
  const [status, setStatus] = useState('');
  const [requests, setRequests] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(PRIVACY_REVIEW_ENABLED);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = async (filter = status) => {
    if (!PRIVACY_REVIEW_ENABLED) return;
    setLoading(true);
    setError('');
    try {
      const accessResult = await getPrivacyReviewAccess();
      setAccess(accessResult);
      if (!accessResult.eligible) {
        setRequests([]);
        return;
      }
      setRequests(await listPrivacyReviewQueue(filter));
    } catch {
      setError(t.actionFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(status); }, [status, currentLanguage]);

  const act = async (item, action) => {
    const response = String(responses[item.id] || '').trim();
    if (['accept', 'decline'].includes(action) && response.length < 3) {
      setError(t.responseRequired);
      return;
    }

    setBusyId(item.id);
    setError('');
    try {
      if (action === 'start') await startPrivacyReview(item.id);
      else if (action === 'accept') await acceptPrivacyRequestForFulfillment(item.id, response);
      else if (action === 'decline') await declinePrivacyRequest(item.id, response);
      else if (action === 'reopen') await reopenPrivacyRequest(item.id);
      setResponses((current) => ({ ...current, [item.id]: '' }));
      await load(status);
    } catch {
      setError(t.actionFailed);
    } finally {
      setBusyId('');
    }
  };

  if (!PRIVACY_REVIEW_ENABLED) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-slate-500" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.disabled}</h1></div></main>;
  }

  if (loading && !access) {
    return <main className="min-h-[70vh] px-5 py-16"><div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl bg-white p-10 text-slate-600 shadow-lg"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div></main>;
  }

  if (access && !access.eligible) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-rose-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.denied}</h1></div></main>;
  }

  const filterLabels = { '': t.active, submitted: t.submitted, in_review: t.inReview, awaiting_fulfillment: t.awaiting, declined: t.declined, canceled: t.canceled };

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[2rem] bg-slate-950 p-7 text-white sm:p-9">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-violet-300"><ShieldCheck className="h-4 w-4" />O2OL</div>
          <h1 className="mt-3 text-4xl font-black">{t.title}</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">{t.intro}</p>
          <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm font-bold leading-6 text-amber-100">{t.boundary}</div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {FILTERS.map((filter) => <Button key={filter || 'active'} size="sm" variant={status === filter ? 'default' : 'outline'} onClick={() => setStatus(filter)}>{filterLabels[filter]}</Button>)}
          <Button size="sm" variant="ghost" onClick={() => void load(status)} aria-label={t.loading}><RotateCcw className="h-4 w-4" /></Button>
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-800">{error}</div> : null}

        <div className="mt-6 space-y-5">
          {loading ? <div className="flex justify-center py-16 text-slate-500"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div> : requests.length ? requests.map((item) => (
            <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase text-violet-800">{t.requestTypes[item.request_type] || item.request_type}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-700">{t.statuses[item.status] || item.status}</span>
                  </div>
                  <div className="mt-3 text-xs font-bold text-slate-400">{t.submittedAt}: {new Date(item.created_at).toLocaleString(locale)}</div>
                  {item.decision_at ? <div className="mt-1 text-xs font-bold text-slate-400">{t.decisionAt}: {new Date(item.decision_at).toLocaleString(locale)}</div> : null}
                  {item.member_note ? <div className="mt-4 rounded-2xl bg-slate-50 p-4"><div className="text-xs font-black uppercase tracking-wide text-slate-500">{t.memberNote}</div><p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{item.member_note}</p></div> : null}
                  {item.staff_response ? <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="text-xs font-black uppercase tracking-wide text-violet-700">{t.response}</div><p className="mt-2 whitespace-pre-wrap leading-7 text-violet-950">{item.staff_response}</p></div> : null}
                  {item.status === 'in_review' ? <div className="mt-5"><textarea value={responses[item.id] || ''} onChange={(event) => setResponses((current) => ({ ...current, [item.id]: event.target.value.slice(0, 4000) }))} rows={4} aria-label={t.response} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /></div> : null}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {item.status === 'submitted' ? <Button variant="outline" disabled={busyId === item.id} onClick={() => void act(item, 'start')}>{busyId === item.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{t.start}</Button> : null}
                  {item.status === 'in_review' ? <><Button disabled={busyId === item.id || String(responses[item.id] || '').trim().length < 3} onClick={() => void act(item, 'accept')}><CheckCircle2 className="mr-2 h-4 w-4" />{t.accept}</Button><Button variant="destructive" disabled={busyId === item.id || String(responses[item.id] || '').trim().length < 3} onClick={() => void act(item, 'decline')}><XCircle className="mr-2 h-4 w-4" />{t.decline}</Button></> : null}
                  {['awaiting_fulfillment', 'declined'].includes(item.status) ? <Button variant="outline" disabled={busyId === item.id} onClick={() => void act(item, 'reopen')}><RotateCcw className="mr-2 h-4 w-4" />{t.reopen}</Button> : null}
                </div>
              </div>
            </article>
          )) : <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">{t.empty}</div>}
        </div>
      </div>
    </main>
  );
}
