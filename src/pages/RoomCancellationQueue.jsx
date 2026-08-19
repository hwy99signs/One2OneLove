import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarX2, CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { isGlobalRoomModerator } from '@/lib/globalRoomModerationService';
import {
  getGlobalRoomCancellationQueue,
  reviewGlobalRoomCancellationRequest,
} from '@/lib/globalRoomCancellationService';

const translations = {
  en: { title: 'Global Room Cancellation Requests', subtitle: 'Review creator requests to cancel approved or scheduled programming before it is removed from the public room.', back: 'Back to the Global Relationship Room', operations: 'Operations Dashboard', moderation: 'Moderation Queue', programs: 'Program Manager', restricted: 'Moderator access required', restrictedCopy: 'Cancellation review is limited to trusted One2OneLove Global Relationship Room moderators.', loading: 'Loading cancellation requests…', loadError: 'Cancellation requests are temporarily unavailable. Please try again.', empty: 'No creator cancellation requests are waiting for review.', approve: 'Approve Cancellation', deny: 'Keep Program', approving: 'Updating…', approved: 'Cancellation approved. The program was removed from the public schedule.', denied: 'Cancellation denied. The program remains scheduled.', failed: 'The cancellation request could not be updated. Please try again.', requestedBy: 'Creator', requested: 'Requested', programTime: 'Program time', reason: 'Creator reason', noReason: 'No reason provided.' },
  es: { title: 'Solicitudes de Cancelación de la Sala Global', subtitle: 'Revisa solicitudes de creadores para cancelar programación aprobada o programada antes de retirarla de la sala pública.', back: 'Volver a la Sala Global de Relaciones', operations: 'Panel de Operaciones', moderation: 'Cola de Moderación', programs: 'Administrador de Programas', restricted: 'Se requiere acceso de moderador', restrictedCopy: 'La revisión de cancelaciones está limitada a moderadores de confianza de One2OneLove.', loading: 'Cargando solicitudes de cancelación…', loadError: 'Las solicitudes de cancelación no están disponibles temporalmente. Inténtalo de nuevo.', empty: 'No hay solicitudes de cancelación pendientes.', approve: 'Aprobar Cancelación', deny: 'Mantener Programa', approving: 'Actualizando…', approved: 'Cancelación aprobada. El programa fue retirado del horario público.', denied: 'Cancelación denegada. El programa permanece programado.', failed: 'No se pudo actualizar la solicitud de cancelación. Inténtalo de nuevo.', requestedBy: 'Creador', requested: 'Solicitado', programTime: 'Horario del programa', reason: 'Motivo del creador', noReason: 'No se proporcionó un motivo.' },
  fr: { title: 'Demandes d’Annulation de la Salle Mondiale', subtitle: 'Examinez les demandes des créateurs visant à annuler un programme approuvé ou planifié avant son retrait public.', back: 'Retour à la Salle Mondiale des Relations', operations: 'Tableau des Opérations', moderation: 'File de Modération', programs: 'Gestionnaire des Programmes', restricted: 'Accès modérateur requis', restrictedCopy: 'L’examen des annulations est réservé aux modérateurs de confiance One2OneLove.', loading: 'Chargement des demandes d’annulation…', loadError: 'Les demandes d’annulation sont temporairement indisponibles. Veuillez réessayer.', empty: 'Aucune demande d’annulation n’attend d’examen.', approve: 'Approuver l’Annulation', deny: 'Maintenir le Programme', approving: 'Mise à jour…', approved: 'Annulation approuvée. Le programme a été retiré du planning public.', denied: 'Annulation refusée. Le programme reste planifié.', failed: 'La demande d’annulation n’a pas pu être mise à jour. Veuillez réessayer.', requestedBy: 'Créateur', requested: 'Demandé', programTime: 'Horaire du programme', reason: 'Motif du créateur', noReason: 'Aucun motif fourni.' },
  it: { title: 'Richieste di Cancellazione della Sala Globale', subtitle: 'Esamina le richieste dei creator per annullare programmi approvati o pianificati prima della rimozione dalla sala pubblica.', back: 'Torna alla Sala Globale delle Relazioni', operations: 'Pannello Operazioni', moderation: 'Coda Moderazione', programs: 'Gestione Programmi', restricted: 'Accesso moderatore richiesto', restrictedCopy: 'La revisione delle cancellazioni è riservata ai moderatori fidati One2OneLove.', loading: 'Caricamento richieste di cancellazione…', loadError: 'Le richieste di cancellazione non sono temporaneamente disponibili. Riprova.', empty: 'Nessuna richiesta di cancellazione è in attesa di revisione.', approve: 'Approva Cancellazione', deny: 'Mantieni Programma', approving: 'Aggiornamento…', approved: 'Cancellazione approvata. Il programma è stato rimosso dal calendario pubblico.', denied: 'Cancellazione negata. Il programma rimane pianificato.', failed: 'Impossibile aggiornare la richiesta di cancellazione. Riprova.', requestedBy: 'Creator', requested: 'Richiesto', programTime: 'Orario programma', reason: 'Motivo del creator', noReason: 'Nessun motivo fornito.' },
  de: { title: 'Stornierungsanfragen des Globalen Raums', subtitle: 'Prüfe Creator-Anfragen zur Stornierung freigegebener oder geplanter Programme, bevor sie aus dem öffentlichen Raum entfernt werden.', back: 'Zurück zum Globalen Beziehungsraum', operations: 'Betriebsübersicht', moderation: 'Moderationsliste', programs: 'Programmverwaltung', restricted: 'Moderatorzugang erforderlich', restrictedCopy: 'Die Prüfung von Stornierungen ist auf vertrauenswürdige One2OneLove-Moderatoren beschränkt.', loading: 'Stornierungsanfragen werden geladen…', loadError: 'Stornierungsanfragen sind vorübergehend nicht verfügbar. Bitte versuche es erneut.', empty: 'Keine Creator-Stornierungsanfragen warten auf Prüfung.', approve: 'Stornierung Genehmigen', deny: 'Programm Beibehalten', approving: 'Wird aktualisiert…', approved: 'Stornierung genehmigt. Das Programm wurde aus dem öffentlichen Zeitplan entfernt.', denied: 'Stornierung abgelehnt. Das Programm bleibt geplant.', failed: 'Die Stornierungsanfrage konnte nicht aktualisiert werden. Bitte versuche es erneut.', requestedBy: 'Creator', requested: 'Angefragt', programTime: 'Programmzeit', reason: 'Grund des Creators', noReason: 'Kein Grund angegeben.' },
};

function formatDateTime(value, language) {
  try { return new Intl.DateTimeFormat(language || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return new Date(value).toLocaleString(); }
}

export default function RoomCancellationQueue() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const accessQuery = useQuery({ queryKey: ['globalRoomModeratorAccess', user?.id], queryFn: isGlobalRoomModerator, enabled: Boolean(user?.id) });
  const moderator = accessQuery.data?.success && accessQuery.data.isModerator;
  const queueQuery = useQuery({ queryKey: ['globalRoomCancellationQueue'], queryFn: getGlobalRoomCancellationQueue, enabled: Boolean(moderator), refetchOnWindowFocus: true });
  const requests = queueQuery.data?.success ? queueQuery.data.requests : [];
  const queueFailed = queueQuery.isError || (queueQuery.data && !queueQuery.data.success);

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }) => reviewGlobalRoomCancellationRequest(id, decision),
    onSuccess: (result, variables) => {
      if (!result.success) { setNotice(''); setError(t.failed); return; }
      setError('');
      setNotice(variables.decision === 'approved' ? t.approved : t.denied);
      queryClient.invalidateQueries({ queryKey: ['globalRoomCancellationQueue'] });
      queryClient.invalidateQueries({ queryKey: ['globalRoomActivePrograms'] });
      queryClient.invalidateQueries({ queryKey: ['globalRelationshipRoom'] });
      queryClient.invalidateQueries({ queryKey: ['globalRoomModerationAudit'] });
      queryClient.invalidateQueries({ queryKey: ['globalRoomOpsSummary'] });
    },
    onError: () => { setNotice(''); setError(t.failed); },
  });

  if (authLoading || (isAuthenticated && accessQuery.isLoading)) return <div role="status" aria-live="polite" className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">{t.loading}</div>;

  if (!isAuthenticated || !user || !moderator) {
    return <div className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-2xl"><Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link><Card className="mt-6 rounded-3xl"><CardHeader><CardTitle>{t.restricted}</CardTitle></CardHeader><CardContent><ShieldCheck aria-hidden="true" className="mb-4 h-10 w-10 text-slate-400" /><p className="text-slate-600">{t.restrictedCopy}</p></CardContent></Card></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-rose-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap gap-4 text-sm"><Link to="/GlobalRelationshipRoom" className="font-medium text-rose-700 hover:underline">← {t.back}</Link><Link to="/RoomOpsDashboard" className="font-medium text-slate-600 hover:underline">{t.operations}</Link><Link to="/RoomModeration" className="font-medium text-slate-600 hover:underline">{t.moderation}</Link><Link to="/RoomProgramManager" className="font-medium text-slate-600 hover:underline">{t.programs}</Link></div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10"><div className="flex gap-4"><div className="rounded-2xl bg-rose-50 p-3"><CalendarX2 aria-hidden="true" className="h-7 w-7 text-rose-600" /></div><div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1><p className="mt-2 text-slate-600">{t.subtitle}</p></div></div></div>

        {(notice || error) && <div role={error ? 'alert' : 'status'} aria-live="polite" className={`mt-5 rounded-2xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}

        <Card className="mt-6 rounded-3xl"><CardContent className="pt-6">
          {queueQuery.isLoading ? <p role="status" className="text-slate-500">{t.loading}</p> : queueFailed ? (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><span>{t.loadError}</span></div>
          ) : requests.length === 0 ? <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.empty}</p> : (
            <div className="space-y-4">{requests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0"><h2 className="text-lg font-semibold text-slate-900">{request.program_title}</h2>{request.creator_display_name && <p className="mt-1 text-sm font-medium text-rose-700">{t.requestedBy}: {request.creator_display_name}</p>}<time dateTime={request.scheduled_start} className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Clock3 aria-hidden="true" className="h-4 w-4" />{t.programTime}: {formatDateTime(request.scheduled_start, currentLanguage)}</time><time dateTime={request.created_at} className="mt-1 block text-xs text-slate-500">{t.requested}: {formatDateTime(request.created_at, currentLanguage)}</time><p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700"><strong>{t.reason}:</strong> {request.reason || t.noReason}</p></div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col"><Button disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: request.id, decision: 'approved' })}><CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />{reviewMutation.isPending ? t.approving : t.approve}</Button><Button variant="outline" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: request.id, decision: 'denied' })}><XCircle aria-hidden="true" className="mr-2 h-4 w-4" />{t.deny}</Button></div>
                </div>
              </article>
            ))}</div>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
