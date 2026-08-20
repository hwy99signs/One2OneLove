import React, { useEffect, useState } from 'react';
import { Database, FilePenLine, Loader2, LockKeyhole, Send, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  PRIVACY_REQUESTS_ENABLED,
  PRIVACY_REQUEST_TYPES,
  cancelPrivacyRequest,
  createPrivacyRequest,
  listMyPrivacyRequests,
} from '@/lib/privacyRequestService';

const COPY = {
  en: {
    badge: 'PRIVACY REQUESTS', title: 'Manage privacy requests', intro: 'Submit and track private requests related to your One2OneLove account data. Submitting a request does not automatically export, change, or delete account data.', disabled: 'Privacy requests are staged, not live yet.', signIn: 'Sign in to manage private privacy requests.', newRequest: 'New privacy request', type: 'Request type', details: 'Optional details', detailsPlaceholder: 'Add context that may help O2OL review the request…', submit: 'Submit request', submitting: 'Submitting…', requests: 'Your privacy requests', empty: 'You have not submitted a privacy request.', cancel: 'Cancel request', response: 'O2OL response', submitted: 'Submitted', updated: 'Updated', success: 'Privacy request submitted.', failed: 'The privacy request could not be completed.', duplicate: 'You already have an active request of this type.',
    types: { data_export: 'Data export request', account_deletion: 'Account deletion request', data_correction: 'Data correction request' }, statuses: { submitted: 'Submitted', in_review: 'In review', completed: 'Completed', cancelled: 'Cancelled', rejected: 'Rejected' },
  },
  es: {
    badge: 'SOLICITUDES DE PRIVACIDAD', title: 'Administrar solicitudes de privacidad', intro: 'Envía y sigue solicitudes privadas relacionadas con los datos de tu cuenta. Enviar una solicitud no exporta, cambia ni elimina automáticamente los datos.', disabled: 'Las solicitudes de privacidad están preparadas, pero aún no están activas.', signIn: 'Inicia sesión para administrar solicitudes privadas.', newRequest: 'Nueva solicitud de privacidad', type: 'Tipo de solicitud', details: 'Detalles opcionales', detailsPlaceholder: 'Agrega contexto que pueda ayudar a O2OL a revisar la solicitud…', submit: 'Enviar solicitud', submitting: 'Enviando…', requests: 'Tus solicitudes', empty: 'Aún no has enviado una solicitud de privacidad.', cancel: 'Cancelar solicitud', response: 'Respuesta de O2OL', submitted: 'Enviada', updated: 'Actualizada', success: 'Solicitud de privacidad enviada.', failed: 'No se pudo completar la solicitud.', duplicate: 'Ya tienes una solicitud activa de este tipo.', types: { data_export: 'Solicitud de exportación de datos', account_deletion: 'Solicitud de eliminación de cuenta', data_correction: 'Solicitud de corrección de datos' }, statuses: { submitted: 'Enviada', in_review: 'En revisión', completed: 'Completada', cancelled: 'Cancelada', rejected: 'Rechazada' },
  },
  fr: {
    badge: 'DEMANDES DE CONFIDENTIALITÉ', title: 'Gérer les demandes de confidentialité', intro: 'Envoyez et suivez des demandes privées concernant les données de votre compte. L’envoi d’une demande n’exporte, ne modifie et ne supprime pas automatiquement les données.', disabled: 'Les demandes de confidentialité sont préparées, mais pas encore actives.', signIn: 'Connectez-vous pour gérer les demandes privées.', newRequest: 'Nouvelle demande', type: 'Type de demande', details: 'Détails facultatifs', detailsPlaceholder: 'Ajoutez un contexte pouvant aider O2OL à examiner la demande…', submit: 'Envoyer la demande', submitting: 'Envoi…', requests: 'Vos demandes', empty: 'Vous n’avez encore envoyé aucune demande de confidentialité.', cancel: 'Annuler la demande', response: 'Réponse O2OL', submitted: 'Envoyée', updated: 'Mise à jour', success: 'Demande de confidentialité envoyée.', failed: 'La demande n’a pas pu être traitée.', duplicate: 'Vous avez déjà une demande active de ce type.', types: { data_export: 'Demande d’export de données', account_deletion: 'Demande de suppression de compte', data_correction: 'Demande de correction de données' }, statuses: { submitted: 'Envoyée', in_review: 'En cours d’examen', completed: 'Terminée', cancelled: 'Annulée', rejected: 'Rejetée' },
  },
  it: {
    badge: 'RICHIESTE PRIVACY', title: 'Gestisci richieste privacy', intro: 'Invia e segui richieste private relative ai dati del tuo account. L’invio di una richiesta non esporta, modifica o elimina automaticamente i dati.', disabled: 'Le richieste privacy sono predisposte, ma non ancora attive.', signIn: 'Accedi per gestire le richieste private.', newRequest: 'Nuova richiesta privacy', type: 'Tipo di richiesta', details: 'Dettagli facoltativi', detailsPlaceholder: 'Aggiungi contesto che possa aiutare O2OL a esaminare la richiesta…', submit: 'Invia richiesta', submitting: 'Invio…', requests: 'Le tue richieste', empty: 'Non hai ancora inviato richieste privacy.', cancel: 'Annulla richiesta', response: 'Risposta O2OL', submitted: 'Inviata', updated: 'Aggiornata', success: 'Richiesta privacy inviata.', failed: 'Impossibile completare la richiesta.', duplicate: 'Hai già una richiesta attiva di questo tipo.', types: { data_export: 'Richiesta esportazione dati', account_deletion: 'Richiesta eliminazione account', data_correction: 'Richiesta correzione dati' }, statuses: { submitted: 'Inviata', in_review: 'In revisione', completed: 'Completata', cancelled: 'Annullata', rejected: 'Rifiutata' },
  },
  de: {
    badge: 'DATENSCHUTZANFRAGEN', title: 'Datenschutzanfragen verwalten', intro: 'Sende und verfolge private Anfragen zu deinen Kontodaten. Das Absenden einer Anfrage exportiert, ändert oder löscht Kontodaten nicht automatisch.', disabled: 'Datenschutzanfragen sind vorbereitet, aber noch nicht aktiv.', signIn: 'Melde dich an, um private Datenschutzanfragen zu verwalten.', newRequest: 'Neue Datenschutzanfrage', type: 'Anfragetyp', details: 'Optionale Details', detailsPlaceholder: 'Füge Kontext hinzu, der O2OL bei der Prüfung helfen kann…', submit: 'Anfrage senden', submitting: 'Wird gesendet…', requests: 'Deine Anfragen', empty: 'Du hast noch keine Datenschutzanfrage gesendet.', cancel: 'Anfrage stornieren', response: 'O2OL-Antwort', submitted: 'Gesendet', updated: 'Aktualisiert', success: 'Datenschutzanfrage gesendet.', failed: 'Die Anfrage konnte nicht abgeschlossen werden.', duplicate: 'Du hast bereits eine aktive Anfrage dieses Typs.', types: { data_export: 'Datenexport-Anfrage', account_deletion: 'Kontolöschungs-Anfrage', data_correction: 'Datenkorrektur-Anfrage' }, statuses: { submitted: 'Gesendet', in_review: 'In Prüfung', completed: 'Abgeschlossen', cancelled: 'Storniert', rejected: 'Abgelehnt' },
  },
  nl: {
    badge: 'PRIVACYVERZOEKEN', title: 'Privacyverzoeken beheren', intro: 'Dien privéverzoeken in over je accountgegevens en volg ze hier. Het indienen van een verzoek exporteert, wijzigt of verwijdert gegevens niet automatisch.', disabled: 'Privacyverzoeken zijn voorbereid, maar nog niet actief.', signIn: 'Log in om privéprivacyverzoeken te beheren.', newRequest: 'Nieuw privacyverzoek', type: 'Type verzoek', details: 'Optionele details', detailsPlaceholder: 'Voeg context toe die O2OL kan helpen bij de beoordeling…', submit: 'Verzoek indienen', submitting: 'Indienen…', requests: 'Jouw verzoeken', empty: 'Je hebt nog geen privacyverzoek ingediend.', cancel: 'Verzoek annuleren', response: 'Antwoord van O2OL', submitted: 'Ingediend', updated: 'Bijgewerkt', success: 'Privacyverzoek ingediend.', failed: 'Het privacyverzoek kon niet worden voltooid.', duplicate: 'Je hebt al een actief verzoek van dit type.', types: { data_export: 'Verzoek om data-export', account_deletion: 'Verzoek om accountverwijdering', data_correction: 'Verzoek om datacorrectie' }, statuses: { submitted: 'Ingediend', in_review: 'In beoordeling', completed: 'Voltooid', cancelled: 'Geannuleerd', rejected: 'Afgewezen' },
  },
};

const TYPE_ICONS = { data_export: Database, account_deletion: Trash2, data_correction: FilePenLine };
const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL' };

export default function PrivacyRequests() {
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const locale = localeByLanguage[language] || 'en-US';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(PRIVACY_REQUESTS_ENABLED && isAuthenticated);
  const [busy, setBusy] = useState(false);
  const [requestType, setRequestType] = useState('data_export');
  const [description, setDescription] = useState('');

  const load = async () => {
    if (!PRIVACY_REQUESTS_ENABLED || !isAuthenticated || !user?.id) return;
    setLoading(true);
    try { setRequests(await listMyPrivacyRequests()); }
    catch { toast.error(t.failed); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [isAuthenticated, user?.id]);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const created = await createPrivacyRequest({ requestType, description });
      if (created) setRequests((current) => [created, ...current]);
      setDescription('');
      toast.success(t.success);
    } catch (error) {
      toast.error(String(error?.message || '').includes('ACTIVE_REQUEST_ALREADY_EXISTS') ? t.duplicate : t.failed);
    } finally { setBusy(false); }
  };

  const cancel = async (requestId) => {
    try {
      const updated = await cancelPrivacyRequest(requestId);
      if (updated) setRequests((current) => current.map((item) => item.id === requestId ? updated : item));
    } catch { toast.error(t.failed); }
  };

  if (!PRIVACY_REQUESTS_ENABLED) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><LockKeyhole className="mx-auto h-10 w-10 text-violet-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.disabled}</h1></div></main>;
  }

  if (!isAuthenticated) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-violet-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.signIn}</h1></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 px-5 py-14 text-white"><div className="mx-auto max-w-6xl"><div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black tracking-[0.16em]"><ShieldCheck className="h-4 w-4" />{t.badge}</div><h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{t.title}</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-white/80">{t.intro}</p></div></section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[.8fr_1.2fr]">
        <form onSubmit={submit} className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">{t.newRequest}</h2><div className="mt-5 space-y-4"><div><label className="mb-1.5 block text-sm font-bold">{t.type}</label><div className="grid gap-2">{PRIVACY_REQUEST_TYPES.map((value) => { const Icon = TYPE_ICONS[value]; return <button key={value} type="button" onClick={() => setRequestType(value)} className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-black ${requestType === value ? 'border-violet-400 bg-violet-50 text-violet-900' : 'border-slate-200 text-slate-700'}`}><Icon className="h-4 w-4" />{t.types[value]}</button>; })}</div></div><div><label className="mb-1.5 block text-sm font-bold">{t.details}</label><textarea value={description} onChange={(event) => setDescription(event.target.value.slice(0, 2000))} rows={6} placeholder={t.detailsPlaceholder} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" /></div><Button type="submit" disabled={busy} className="w-full bg-violet-700 text-white hover:bg-violet-800">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{busy ? t.submitting : t.submit}</Button></div></form>

        <div><h2 className="text-2xl font-black">{t.requests}</h2>{loading ? <div className="flex justify-center py-16 text-slate-500"><Loader2 className="mr-3 h-5 w-5 animate-spin" /></div> : requests.length ? <div className="mt-5 space-y-4">{requests.map((item) => { const Icon = TYPE_ICONS[item.request_type] || ShieldCheck; return <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Icon className="h-5 w-5" /></div><div><div className="font-black text-slate-950">{t.types[item.request_type] || item.request_type}</div><div className="mt-1 text-xs font-bold text-slate-400">{t.submitted}: {new Date(item.created_at).toLocaleString(locale)}</div></div></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{t.statuses[item.status] || item.status}</span></div>{item.description ? <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">{item.description}</p> : null}<div className="mt-3 text-xs font-bold text-slate-400">{t.updated}: {new Date(item.updated_at).toLocaleString(locale)}</div>{item.staff_response ? <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="font-black text-emerald-900">{t.response}</div><p className="mt-2 whitespace-pre-wrap leading-7 text-emerald-950">{item.staff_response}</p></div> : null}{item.status === 'submitted' ? <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => cancel(item.id)}><XCircle className="mr-2 h-4 w-4" />{t.cancel}</Button> : null}</article>; })}</div> : <div className="mt-5 rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">{t.empty}</div>}</div>
      </section>
    </main>
  );
}
