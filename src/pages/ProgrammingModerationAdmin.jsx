import React, { useEffect, useState } from 'react';
import { Flag, Loader2, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';
import {
  PROGRAMMING_MODERATION_ENABLED,
  dismissProgrammingReport,
  getProgrammingModeratorAccess,
  listPendingProgrammingReports,
  removeReportedProgramming,
} from '@/lib/programmingModerationService';

const COPY = {
  en: { title: 'Programming moderation', intro: 'Review private member reports about Global Relationship Room programming. Reporter identity is intentionally omitted from this console.', disabled: 'Programming moderation is staged, not live yet.', denied: 'O2OL programming moderator access required.', loading: 'Loading moderation queue…', empty: 'No pending programming reports.', creator: 'Creator', o2ol: 'O2OL', live: 'Live', replay: 'Replay', reason: 'Reason', details: 'Details', reported: 'Reported', dismiss: 'Dismiss report', remove: 'Remove program', actionFailed: 'The moderation action could not be completed.' },
  es: { title: 'Moderación de programación', intro: 'Revisa reportes privados de miembros sobre la programación de la Sala Global de Relaciones. La identidad de quien reporta se omite intencionalmente.', disabled: 'La moderación está preparada, pero aún no está activa.', denied: 'Se requiere acceso de moderador O2OL.', loading: 'Cargando cola de moderación…', empty: 'No hay reportes pendientes.', creator: 'Creador', o2ol: 'O2OL', live: 'En vivo', replay: 'Repetición', reason: 'Motivo', details: 'Detalles', reported: 'Reportado', dismiss: 'Descartar reporte', remove: 'Eliminar programa', actionFailed: 'No se pudo completar la acción de moderación.' },
  fr: { title: 'Modération de la programmation', intro: 'Examinez les signalements privés concernant les programmes du Salon Mondial des Relations. L’identité du membre ayant signalé est volontairement omise.', disabled: 'La modération est préparée, mais pas encore active.', denied: 'Accès de modérateur O2OL requis.', loading: 'Chargement de la file de modération…', empty: 'Aucun signalement en attente.', creator: 'Créateur', o2ol: 'O2OL', live: 'Direct', replay: 'Rediffusion', reason: 'Raison', details: 'Détails', reported: 'Signalé', dismiss: 'Rejeter le signalement', remove: 'Retirer le programme', actionFailed: 'L’action de modération n’a pas pu être effectuée.' },
  it: { title: 'Moderazione programmazione', intro: 'Esamina le segnalazioni private sui programmi della Sala Globale delle Relazioni. L’identità di chi segnala viene intenzionalmente omessa.', disabled: 'La moderazione è predisposta, ma non è ancora attiva.', denied: 'È richiesto l’accesso moderatore O2OL.', loading: 'Caricamento coda di moderazione…', empty: 'Nessuna segnalazione in sospeso.', creator: 'Creator', o2ol: 'O2OL', live: 'Live', replay: 'Replica', reason: 'Motivo', details: 'Dettagli', reported: 'Segnalato', dismiss: 'Ignora segnalazione', remove: 'Rimuovi programma', actionFailed: 'Impossibile completare l’azione di moderazione.' },
  de: { title: 'Programm-Moderation', intro: 'Prüfe private Meldungen zu Programmen im Globalen Beziehungsraum. Die Identität der meldenden Person wird bewusst nicht angezeigt.', disabled: 'Programm-Moderation ist vorbereitet, aber noch nicht aktiv.', denied: 'O2OL-Moderatorzugang erforderlich.', loading: 'Moderationswarteschlange wird geladen…', empty: 'Keine ausstehenden Programmmeldungen.', creator: 'Creator', o2ol: 'O2OL', live: 'Live', replay: 'Wiederholung', reason: 'Grund', details: 'Details', reported: 'Gemeldet', dismiss: 'Meldung verwerfen', remove: 'Programm entfernen', actionFailed: 'Moderationsaktion konnte nicht abgeschlossen werden.' },
  nl: { title: 'Programmamoderatie', intro: 'Beoordeel privé-meldingen over programmering in de Wereldwijde Relatiekamer. De identiteit van de melder wordt bewust niet getoond.', disabled: 'Programmamoderatie is voorbereid, maar nog niet actief.', denied: 'O2OL-moderatortoegang vereist.', loading: 'Moderatiequeue laden…', empty: 'Geen openstaande programmameldingen.', creator: 'Creator', o2ol: 'O2OL', live: 'Live', replay: 'Herhaling', reason: 'Reden', details: 'Details', reported: 'Gemeld', dismiss: 'Melding afwijzen', remove: 'Programma verwijderen', actionFailed: 'De moderatieactie kon niet worden voltooid.' },
};

const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL' };

export default function ProgrammingModerationAdmin() {
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const locale = localeByLanguage[language] || 'en-US';
  const [access, setAccess] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(PROGRAMMING_MODERATION_ENABLED);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!PROGRAMMING_MODERATION_ENABLED) return;
    setLoading(true);
    setError('');
    try {
      const accessResult = await getProgrammingModeratorAccess();
      setAccess(accessResult);
      if (!accessResult.eligible) return;
      setReports(await listPendingProgrammingReports());
    } catch {
      setError(t.actionFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const act = async (reportId, action) => {
    setBusyId(reportId);
    setError('');
    try {
      if (action === 'remove') await removeReportedProgramming(reportId);
      else await dismissProgrammingReport(reportId);
      setReports((current) => current.filter((report) => report.id !== reportId));
    } catch {
      setError(t.actionFailed);
    } finally {
      setBusyId('');
    }
  };

  if (!PROGRAMMING_MODERATION_ENABLED) {
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
        <div className="rounded-[2rem] bg-slate-950 p-7 text-white sm:p-9"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-rose-300"><Flag className="h-4 w-4" />O2OL</div><h1 className="mt-3 text-4xl font-black">{t.title}</h1><p className="mt-4 max-w-3xl leading-7 text-slate-300">{t.intro}</p></div>

        {error ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-800">{error}</div> : null}

        <div className="mt-8 space-y-5">
          {loading ? <div className="flex justify-center py-16 text-slate-500"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div> : reports.length ? reports.map((report) => {
            const slot = report.creator_programming_slots || {};
            return (
              <article key={report.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase"><span className="rounded-full bg-violet-100 px-2.5 py-1 text-violet-800">{slot.program_source === 'o2ol' ? t.o2ol : t.creator}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{slot.content_mode === 'replay' ? t.replay : t.live}</span></div>
                    <h2 className="mt-3 text-2xl font-black text-slate-950">{slot.title || '—'}</h2>
                    {slot.description ? <p className="mt-2 leading-7 text-slate-600">{slot.description}</p> : null}
                    <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3"><div><div className="text-xs font-black uppercase text-slate-400">{t.reason}</div><div className="mt-1 font-bold text-slate-800">{report.reason}</div></div><div><div className="text-xs font-black uppercase text-slate-400">{t.details}</div><div className="mt-1 text-sm leading-6 text-slate-700">{report.details || '—'}</div></div><div><div className="text-xs font-black uppercase text-slate-400">{t.reported}</div><div className="mt-1 text-sm font-bold text-slate-700">{new Date(report.created_at).toLocaleString(locale)}</div></div></div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2"><Button variant="outline" disabled={busyId === report.id} onClick={() => act(report.id, 'dismiss')}><XCircle className="mr-2 h-4 w-4" />{t.dismiss}</Button><Button disabled={busyId === report.id} onClick={() => act(report.id, 'remove')} className="bg-rose-700 text-white hover:bg-rose-800">{busyId === report.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}{t.remove}</Button></div>
                </div>
              </article>
            );
          }) : <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">{t.empty}</div>}
        </div>
      </div>
    </main>
  );
}
