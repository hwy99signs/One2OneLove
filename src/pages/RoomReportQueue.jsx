import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Flag, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { isGlobalRoomModerator } from '@/lib/globalRoomModerationService';
import { getGlobalRoomReportQueue, reviewGlobalRoomReport } from '@/lib/globalRoomReportingService';

const translations = {
  en: { title: 'Global Room Program Reports', subtitle: 'Review viewer reports about approved Global Relationship Room programming.', back: 'Back to the Global Relationship Room', moderation: 'Moderation Queue', programs: 'Program Manager', restricted: 'Moderator access required', restrictedCopy: 'Viewer reports are available only to trusted One2OneLove Global Relationship Room moderators.', loading: 'Loading reports…', empty: 'No viewer reports are waiting for review.', reviewed: 'Mark Reviewed', actioned: 'Mark Actioned', dismiss: 'Dismiss', done: 'Report updated.', failed: 'The report could not be updated.', reason: 'Reason', program: 'Program', reporter: 'Reporter', details: 'Details' },
  es: { title: 'Reportes de Programas de la Sala Global', subtitle: 'Revisa reportes de espectadores sobre programación aprobada.', back: 'Volver a la Sala Global de Relaciones', moderation: 'Cola de Moderación', programs: 'Administrador de Programas', restricted: 'Se requiere acceso de moderador', restrictedCopy: 'Los reportes de espectadores están disponibles solo para moderadores de confianza de One2OneLove.', loading: 'Cargando reportes…', empty: 'No hay reportes pendientes de revisión.', reviewed: 'Marcar Revisado', actioned: 'Marcar Atendido', dismiss: 'Descartar', done: 'Reporte actualizado.', failed: 'No se pudo actualizar el reporte.', reason: 'Motivo', program: 'Programa', reporter: 'Reportado por', details: 'Detalles' },
  fr: { title: 'Signalements des Programmes', subtitle: 'Examinez les signalements des spectateurs concernant les programmes approuvés.', back: 'Retour à la Salle Mondiale des Relations', moderation: 'File de Modération', programs: 'Gestionnaire des Programmes', restricted: 'Accès modérateur requis', restrictedCopy: 'Les signalements sont réservés aux modérateurs de confiance One2OneLove.', loading: 'Chargement des signalements…', empty: 'Aucun signalement n’attend d’examen.', reviewed: 'Marquer Examiné', actioned: 'Marquer Traité', dismiss: 'Rejeter', done: 'Signalement mis à jour.', failed: 'Le signalement n’a pas pu être mis à jour.', reason: 'Motif', program: 'Programme', reporter: 'Signalé par', details: 'Détails' },
  it: { title: 'Segnalazioni Programmi della Sala Globale', subtitle: 'Esamina le segnalazioni degli spettatori sui programmi approvati.', back: 'Torna alla Sala Globale delle Relazioni', moderation: 'Coda Moderazione', programs: 'Gestione Programmi', restricted: 'Accesso moderatore richiesto', restrictedCopy: 'Le segnalazioni sono disponibili solo ai moderatori fidati One2OneLove.', loading: 'Caricamento segnalazioni…', empty: 'Nessuna segnalazione è in attesa di revisione.', reviewed: 'Segna Revisionato', actioned: 'Segna Gestito', dismiss: 'Ignora', done: 'Segnalazione aggiornata.', failed: 'Impossibile aggiornare la segnalazione.', reason: 'Motivo', program: 'Programma', reporter: 'Segnalato da', details: 'Dettagli' },
  de: { title: 'Programm-Meldungen des Globalen Raums', subtitle: 'Prüfe Meldungen von Zuschauern zu freigegebenen Programmen.', back: 'Zurück zum Globalen Beziehungsraum', moderation: 'Moderationsliste', programs: 'Programmverwaltung', restricted: 'Moderatorzugang erforderlich', restrictedCopy: 'Zuschauer-Meldungen sind nur für vertrauenswürdige One2OneLove-Moderatoren verfügbar.', loading: 'Meldungen werden geladen…', empty: 'Keine Meldungen warten auf Prüfung.', reviewed: 'Als Geprüft Markieren', actioned: 'Als Bearbeitet Markieren', dismiss: 'Verwerfen', done: 'Meldung aktualisiert.', failed: 'Die Meldung konnte nicht aktualisiert werden.', reason: 'Grund', program: 'Programm', reporter: 'Gemeldet von', details: 'Details' },
};

const reasonLabels = {
  misleading: 'Misleading', harassment: 'Harassment', hate: 'Hate', sexual_content: 'Sexual content', self_harm: 'Self-harm', violence: 'Violence', spam: 'Spam', other: 'Other',
};

export default function RoomReportQueue() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const accessQuery = useQuery({ queryKey: ['globalRoomModeratorAccess', user?.id], queryFn: isGlobalRoomModerator, enabled: Boolean(user?.id) });
  const moderator = accessQuery.data?.success && accessQuery.data.isModerator;
  const reportsQuery = useQuery({ queryKey: ['globalRoomReportQueue'], queryFn: getGlobalRoomReportQueue, enabled: Boolean(moderator) });
  const reports = reportsQuery.data?.success ? reportsQuery.data.reports : [];

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }) => reviewGlobalRoomReport(id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalRoomReportQueue'] });
      queryClient.invalidateQueries({ queryKey: ['globalRoomModerationAudit'] });
    },
  });

  if (authLoading || (isAuthenticated && accessQuery.isLoading)) return <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">{t.loading}</div>;
  if (!isAuthenticated || !user || !moderator) {
    return <div className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-2xl"><Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link><Card className="mt-6 rounded-3xl"><CardHeader><CardTitle>{t.restricted}</CardTitle></CardHeader><CardContent><ShieldCheck className="mb-4 h-10 w-10 text-slate-400" /><p className="text-slate-600">{t.restrictedCopy}</p></CardContent></Card></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-rose-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap gap-4 text-sm"><Link to="/GlobalRelationshipRoom" className="font-medium text-rose-700 hover:underline">← {t.back}</Link><Link to="/RoomModeration" className="font-medium text-slate-600 hover:underline">{t.moderation}</Link><Link to="/RoomProgramManager" className="font-medium text-slate-600 hover:underline">{t.programs}</Link></div>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10"><div className="flex gap-4"><div className="rounded-2xl bg-rose-50 p-3"><Flag className="h-7 w-7 text-rose-600" /></div><div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1><p className="mt-2 text-slate-600">{t.subtitle}</p></div></div></div>
        <Card className="mt-6 rounded-3xl"><CardContent className="pt-6">{reportsQuery.isLoading ? <p className="text-slate-500">{t.loading}</p> : reports.length === 0 ? <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.empty}</p> : <div className="space-y-4">{reports.map((report) => <div key={report.id} className="rounded-2xl border border-slate-200 p-5"><div className="font-semibold text-slate-900">{t.program}: {report.program_title}</div><div className="mt-2 text-sm text-slate-600"><strong>{t.reason}:</strong> {reasonLabels[report.reason] || report.reason}</div>{report.details && <p className="mt-2 text-sm leading-6 text-slate-600"><strong>{t.details}:</strong> {report.details}</p>}<div className="mt-2 break-all text-xs text-slate-400"><strong>{t.reporter}:</strong> {report.reporter_user_id}</div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: report.id, decision: 'reviewed' })}><CheckCircle2 className="mr-2 h-4 w-4" />{t.reviewed}</Button><Button size="sm" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: report.id, decision: 'actioned' })}><ShieldCheck className="mr-2 h-4 w-4" />{t.actioned}</Button><Button size="sm" variant="ghost" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate({ id: report.id, decision: 'dismissed' })}><XCircle className="mr-2 h-4 w-4" />{t.dismiss}</Button></div></div>)}</div>}</CardContent></Card>
      </div>
    </div>
  );
}
