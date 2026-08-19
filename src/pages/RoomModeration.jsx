import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock3, Radio, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  getGlobalRoomModerationQueue,
  isGlobalRoomModerator,
  reviewGlobalRoomCreator,
  reviewGlobalRoomSlot,
} from '@/lib/globalRoomModerationService';

const translations = {
  en: {
    title: 'Global Relationship Room Moderation', subtitle: 'Review creator applications and programming before they enter the public room.', back: 'Back to the Global Relationship Room', operations: 'Operations Dashboard', loading: 'Loading moderation access…', restricted: 'Moderator access required', restrictedCopy: 'This area is limited to trusted One2OneLove Global Relationship Room moderators.', signIn: 'Sign In', creators: 'Creator Applications', programming: 'Programming Queue', noCreators: 'No creator applications are waiting for review.', noSlots: 'No programming submissions are waiting for review.', queueError: 'The moderation queue is temporarily unavailable. Please try again.', approve: 'Approve', reject: 'Reject', pending: 'Pending', scheduled: 'Scheduled for', creatorApproved: 'Creator approved.', creatorRejected: 'Creator application rejected.', slotApproved: 'Programming approved and scheduled.', slotRejected: 'Programming rejected.', actionError: 'The moderation action could not be completed. Please try again.', disclaimer: 'Approval confirms platform eligibility only. Third-party views remain the creator’s own and do not necessarily represent One2OneLove or ERANT.'
  },
  es: {
    title: 'Moderación de la Sala Global de Relaciones', subtitle: 'Revisa solicitudes de creadores y programación antes de que entren en la sala pública.', back: 'Volver a la Sala Global de Relaciones', operations: 'Panel de Operaciones', loading: 'Cargando acceso de moderación…', restricted: 'Se requiere acceso de moderador', restrictedCopy: 'Esta área está limitada a moderadores de confianza de la Sala Global de Relaciones de One2OneLove.', signIn: 'Iniciar Sesión', creators: 'Solicitudes de Creadores', programming: 'Cola de Programación', noCreators: 'No hay solicitudes de creadores pendientes de revisión.', noSlots: 'No hay programas pendientes de revisión.', queueError: 'La cola de moderación no está disponible temporalmente. Inténtalo de nuevo.', approve: 'Aprobar', reject: 'Rechazar', pending: 'Pendiente', scheduled: 'Programado para', creatorApproved: 'Creador aprobado.', creatorRejected: 'Solicitud de creador rechazada.', slotApproved: 'Programación aprobada y programada.', slotRejected: 'Programación rechazada.', actionError: 'No se pudo completar la acción de moderación. Inténtalo de nuevo.', disclaimer: 'La aprobación confirma únicamente la elegibilidad en la plataforma. Las opiniones de terceros siguen siendo propias del creador y no representan necesariamente a One2OneLove o ERANT.'
  },
  fr: {
    title: 'Modération de la Salle Mondiale des Relations', subtitle: 'Examinez les candidatures de créateurs et les programmes avant leur diffusion publique.', back: 'Retour à la Salle Mondiale des Relations', operations: 'Tableau des Opérations', loading: 'Chargement de l’accès modérateur…', restricted: 'Accès modérateur requis', restrictedCopy: 'Cette zone est réservée aux modérateurs de confiance de la Salle Mondiale des Relations One2OneLove.', signIn: 'Se Connecter', creators: 'Candidatures Créateurs', programming: 'File de Programmation', noCreators: 'Aucune candidature créateur n’attend d’examen.', noSlots: 'Aucun programme n’attend d’examen.', queueError: 'La file de modération est temporairement indisponible. Veuillez réessayer.', approve: 'Approuver', reject: 'Refuser', pending: 'En attente', scheduled: 'Prévu pour', creatorApproved: 'Créateur approuvé.', creatorRejected: 'Candidature créateur refusée.', slotApproved: 'Programme approuvé et planifié.', slotRejected: 'Programme refusé.', actionError: 'L’action de modération n’a pas pu être effectuée. Veuillez réessayer.', disclaimer: 'L’approbation confirme uniquement l’éligibilité sur la plateforme. Les opinions de tiers restent celles du créateur et ne représentent pas nécessairement One2OneLove ou ERANT.'
  },
  it: {
    title: 'Moderazione della Sala Globale delle Relazioni', subtitle: 'Esamina le richieste creator e i programmi prima della pubblicazione nella sala.', back: 'Torna alla Sala Globale delle Relazioni', operations: 'Pannello Operazioni', loading: 'Caricamento accesso moderatore…', restricted: 'Accesso moderatore richiesto', restrictedCopy: 'Quest’area è riservata ai moderatori fidati della Sala Globale delle Relazioni One2OneLove.', signIn: 'Accedi', creators: 'Richieste Creator', programming: 'Coda Programmazione', noCreators: 'Non ci sono richieste creator in attesa di revisione.', noSlots: 'Non ci sono programmi in attesa di revisione.', queueError: 'La coda di moderazione non è temporaneamente disponibile. Riprova.', approve: 'Approva', reject: 'Rifiuta', pending: 'In attesa', scheduled: 'Programmato per', creatorApproved: 'Creator approvato.', creatorRejected: 'Richiesta creator rifiutata.', slotApproved: 'Programma approvato e pianificato.', slotRejected: 'Programma rifiutato.', actionError: 'Impossibile completare l’azione di moderazione. Riprova.', disclaimer: 'L’approvazione conferma solo l’idoneità alla piattaforma. Le opinioni di terzi restano proprie del creator e non rappresentano necessariamente One2OneLove o ERANT.'
  },
  de: {
    title: 'Moderation des Globalen Beziehungsraums', subtitle: 'Prüfe Creator-Bewerbungen und Programme, bevor sie im öffentlichen Raum erscheinen.', back: 'Zurück zum Globalen Beziehungsraum', operations: 'Betriebsübersicht', loading: 'Moderatorzugang wird geladen…', restricted: 'Moderatorzugang erforderlich', restrictedCopy: 'Dieser Bereich ist auf vertrauenswürdige Moderatoren des One2OneLove Globalen Beziehungsraums beschränkt.', signIn: 'Anmelden', creators: 'Creator-Bewerbungen', programming: 'Programm-Prüfliste', noCreators: 'Keine Creator-Bewerbungen warten auf Prüfung.', noSlots: 'Keine Programme warten auf Prüfung.', queueError: 'Die Moderationsliste ist vorübergehend nicht verfügbar. Bitte versuche es erneut.', approve: 'Freigeben', reject: 'Ablehnen', pending: 'In Prüfung', scheduled: 'Geplant für', creatorApproved: 'Creator freigegeben.', creatorRejected: 'Creator-Bewerbung abgelehnt.', slotApproved: 'Programm freigegeben und geplant.', slotRejected: 'Programm abgelehnt.', actionError: 'Die Moderationsaktion konnte nicht abgeschlossen werden. Bitte versuche es erneut.', disclaimer: 'Die Freigabe bestätigt nur die Plattformberechtigung. Ansichten Dritter bleiben die eigenen des Creators und vertreten nicht notwendigerweise One2OneLove oder ERANT.'
  },
};

function formatDateTime(value, language) {
  try {
    return new Intl.DateTimeFormat(language || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

export default function RoomModeration() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const accessQuery = useQuery({ queryKey: ['globalRoomModeratorAccess', user?.id], queryFn: isGlobalRoomModerator, enabled: Boolean(user?.id) });
  const isModerator = accessQuery.data?.success && accessQuery.data.isModerator;
  const queueQuery = useQuery({ queryKey: ['globalRoomModerationQueue'], queryFn: getGlobalRoomModerationQueue, enabled: Boolean(isModerator), refetchOnWindowFocus: true });
  const queueFailed = queueQuery.isError || (queueQuery.data && !queueQuery.data.success);

  const refreshQueue = () => {
    queryClient.invalidateQueries({ queryKey: ['globalRoomModerationQueue'] });
    queryClient.invalidateQueries({ queryKey: ['globalRelationshipRoom'] });
    queryClient.invalidateQueries({ queryKey: ['globalRoomOpsSummary'] });
  };

  const creatorMutation = useMutation({
    mutationFn: ({ id, decision }) => reviewGlobalRoomCreator(id, decision),
    onSuccess: (result, variables) => {
      if (!result.success) { setNotice(''); setError(t.actionError); return; }
      setError('');
      setNotice(variables.decision === 'approved' ? t.creatorApproved : t.creatorRejected);
      refreshQueue();
    },
    onError: () => { setNotice(''); setError(t.actionError); },
  });

  const slotMutation = useMutation({
    mutationFn: ({ id, decision }) => reviewGlobalRoomSlot(id, decision),
    onSuccess: (result, variables) => {
      if (!result.success) { setNotice(''); setError(t.actionError); return; }
      setError('');
      setNotice(variables.decision === 'approved' ? t.slotApproved : t.slotRejected);
      refreshQueue();
    },
    onError: () => { setNotice(''); setError(t.actionError); },
  });

  if (authLoading || (isAuthenticated && accessQuery.isLoading)) {
    return <div role="status" aria-live="polite" className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">{t.loading}</div>;
  }

  if (!isAuthenticated || !user || !isModerator) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-rose-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link>
          <Card className="mt-6 rounded-3xl">
            <CardHeader><CardTitle>{t.restricted}</CardTitle></CardHeader>
            <CardContent><ShieldCheck aria-hidden="true" className="mb-4 h-10 w-10 text-slate-400" /><p className="text-slate-600">{t.restrictedCopy}</p>{!isAuthenticated && <Button className="mt-5" asChild><Link to="/SignIn">{t.signIn}</Link></Button>}</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const creators = queueQuery.data?.success ? queueQuery.data.creators : [];
  const slots = queueQuery.data?.success ? queueQuery.data.slots : [];
  const busy = creatorMutation.isPending || slotMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-rose-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap gap-4 text-sm"><Link to="/GlobalRelationshipRoom" className="font-medium text-rose-700 hover:underline">← {t.back}</Link><Link to="/RoomOpsDashboard" className="font-medium text-slate-600 hover:underline">{t.operations}</Link></div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <div className="flex items-start gap-4"><div className="rounded-2xl bg-slate-100 p-3"><ShieldCheck aria-hidden="true" className="h-7 w-7 text-slate-700" /></div><div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1><p className="mt-2 text-slate-600">{t.subtitle}</p></div></div>
          <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{t.disclaimer}</p>
        </div>

        {(notice || error) && <div role={error ? 'alert' : 'status'} aria-live="polite" className={`mt-5 rounded-2xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}

        {queueFailed ? (
          <div role="alert" className="mt-7 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><span>{t.queueError}</span></div>
        ) : (
          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl">
              <CardHeader><CardTitle>{t.creators}</CardTitle></CardHeader>
              <CardContent>
                {queueQuery.isLoading ? <p role="status" className="text-slate-500">{t.loading}</p> : creators.length === 0 ? <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.noCreators}</p> : (
                  <div className="space-y-4">{creators.map((creator) => (
                    <article key={creator.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="font-semibold text-slate-900">{creator.display_name}</div>{creator.bio && <p className="mt-2 text-sm leading-6 text-slate-600">{creator.bio}</p>}<div className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">{t.pending}</div>
                      <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => creatorMutation.mutate({ id: creator.id, decision: 'approved' })} disabled={busy}><CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />{t.approve}</Button><Button size="sm" variant="outline" onClick={() => creatorMutation.mutate({ id: creator.id, decision: 'rejected' })} disabled={busy}><XCircle aria-hidden="true" className="mr-2 h-4 w-4" />{t.reject}</Button></div>
                    </article>
                  ))}</div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader><CardTitle>{t.programming}</CardTitle></CardHeader>
              <CardContent>
                {queueQuery.isLoading ? <p role="status" className="text-slate-500">{t.loading}</p> : slots.length === 0 ? <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.noSlots}</p> : (
                  <div className="space-y-4">{slots.map((slot) => (
                    <article key={slot.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start gap-2"><Radio aria-hidden="true" className="mt-1 h-4 w-4 text-rose-600" /><div className="font-semibold text-slate-900">{slot.title}</div></div>{slot.description && <p className="mt-2 text-sm leading-6 text-slate-600">{slot.description}</p>}<time dateTime={slot.scheduled_start} className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Clock3 aria-hidden="true" className="h-4 w-4" />{t.scheduled} {formatDateTime(slot.scheduled_start, currentLanguage)}</time>
                      <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => slotMutation.mutate({ id: slot.id, decision: 'approved' })} disabled={busy}><CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />{t.approve}</Button><Button size="sm" variant="outline" onClick={() => slotMutation.mutate({ id: slot.id, decision: 'rejected' })} disabled={busy}><XCircle aria-hidden="true" className="mr-2 h-4 w-4" />{t.reject}</Button></div>
                    </article>
                  ))}</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
