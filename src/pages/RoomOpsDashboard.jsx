import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CalendarClock, Flag, Radio, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { isGlobalRoomModerator } from '@/lib/globalRoomModerationService';
import { getGlobalRoomOpsSummary } from '@/lib/globalRoomOpsService';

const translations = {
  en: { title: 'Global Relationship Room Operations', subtitle: 'A private operational snapshot for trusted One2OneLove room moderators.', back: 'Back to the Global Relationship Room', restricted: 'Moderator access required', restrictedCopy: 'This operations dashboard is limited to trusted Global Relationship Room moderators.', loading: 'Loading room operations…', loadError: 'Room operations data is temporarily unavailable. Please try again.', pendingCreators: 'Creator applications', pendingPrograms: 'Programs awaiting review', reports: 'Open viewer reports', live: 'Programs live now', next24: 'Programs in next 24 hours', next7: 'Programs in next 7 days', creators: 'Approved creators', moderation: 'Moderation Queue', programManager: 'Program Manager', reportsQueue: 'Viewer Reports', official: 'Official Programming', replays: 'Replay Manager', audit: 'Moderation History' },
  es: { title: 'Operaciones de la Sala Global de Relaciones', subtitle: 'Resumen operativo privado para moderadores de confianza de One2OneLove.', back: 'Volver a la Sala Global de Relaciones', restricted: 'Se requiere acceso de moderador', restrictedCopy: 'Este panel está limitado a moderadores de confianza de la Sala Global.', loading: 'Cargando operaciones…', loadError: 'Los datos operativos no están disponibles temporalmente. Inténtalo de nuevo.', pendingCreators: 'Solicitudes de creadores', pendingPrograms: 'Programas pendientes de revisión', reports: 'Reportes abiertos de espectadores', live: 'Programas en vivo ahora', next24: 'Programas en próximas 24 horas', next7: 'Programas en próximos 7 días', creators: 'Creadores aprobados', moderation: 'Cola de Moderación', programManager: 'Administrador de Programas', reportsQueue: 'Reportes de Espectadores', official: 'Programación Oficial', replays: 'Administrador de Repeticiones', audit: 'Historial de Moderación' },
  fr: { title: 'Opérations de la Salle Mondiale des Relations', subtitle: 'Aperçu opérationnel privé pour les modérateurs de confiance One2OneLove.', back: 'Retour à la Salle Mondiale des Relations', restricted: 'Accès modérateur requis', restrictedCopy: 'Ce tableau de bord est réservé aux modérateurs de confiance de la Salle Mondiale.', loading: 'Chargement des opérations…', loadError: 'Les données opérationnelles sont temporairement indisponibles. Veuillez réessayer.', pendingCreators: 'Candidatures créateurs', pendingPrograms: 'Programmes en attente', reports: 'Signalements ouverts', live: 'Programmes en direct', next24: 'Programmes dans les 24 prochaines heures', next7: 'Programmes dans les 7 prochains jours', creators: 'Créateurs approuvés', moderation: 'File de Modération', programManager: 'Gestionnaire des Programmes', reportsQueue: 'Signalements Spectateurs', official: 'Programmation Officielle', replays: 'Gestionnaire des Rediffusions', audit: 'Historique de Modération' },
  it: { title: 'Operazioni della Sala Globale delle Relazioni', subtitle: 'Panoramica operativa privata per i moderatori fidati One2OneLove.', back: 'Torna alla Sala Globale delle Relazioni', restricted: 'Accesso moderatore richiesto', restrictedCopy: 'Questo pannello è riservato ai moderatori fidati della Sala Globale.', loading: 'Caricamento operazioni…', loadError: 'I dati operativi non sono temporaneamente disponibili. Riprova.', pendingCreators: 'Richieste creator', pendingPrograms: 'Programmi in attesa di revisione', reports: 'Segnalazioni aperte', live: 'Programmi in diretta', next24: 'Programmi nelle prossime 24 ore', next7: 'Programmi nei prossimi 7 giorni', creators: 'Creator approvati', moderation: 'Coda Moderazione', programManager: 'Gestione Programmi', reportsQueue: 'Segnalazioni Spettatori', official: 'Programmazione Ufficiale', replays: 'Gestione Repliche', audit: 'Cronologia Moderazione' },
  de: { title: 'Betrieb des Globalen Beziehungsraums', subtitle: 'Private Betriebsübersicht für vertrauenswürdige One2OneLove-Moderatoren.', back: 'Zurück zum Globalen Beziehungsraum', restricted: 'Moderatorzugang erforderlich', restrictedCopy: 'Dieses Dashboard ist auf vertrauenswürdige Moderatoren des Globalen Beziehungsraums beschränkt.', loading: 'Raumbetrieb wird geladen…', loadError: 'Betriebsdaten sind vorübergehend nicht verfügbar. Bitte versuche es erneut.', pendingCreators: 'Creator-Bewerbungen', pendingPrograms: 'Programme in Prüfung', reports: 'Offene Zuschauer-Meldungen', live: 'Jetzt laufende Programme', next24: 'Programme in den nächsten 24 Stunden', next7: 'Programme in den nächsten 7 Tagen', creators: 'Freigegebene Creator', moderation: 'Moderationsliste', programManager: 'Programmverwaltung', reportsQueue: 'Zuschauer-Meldungen', official: 'Offizielle Programme', replays: 'Wiederholungsverwaltung', audit: 'Moderationsverlauf' },
};

function Metric({ icon: Icon, label, value }) {
  return (
    <Card className="rounded-2xl border-slate-200">
      <CardContent className="p-5"><div className="flex items-center justify-between gap-4"><div><div className="text-sm font-medium text-slate-500">{label}</div><div className="mt-1 text-3xl font-bold text-slate-900" aria-label={`${label}: ${value}`}>{value}</div></div><div className="rounded-2xl bg-slate-50 p-3"><Icon aria-hidden="true" className="h-6 w-6 text-rose-600" /></div></div></CardContent>
    </Card>
  );
}

export default function RoomOpsDashboard() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const accessQuery = useQuery({ queryKey: ['globalRoomModeratorAccess', user?.id], queryFn: isGlobalRoomModerator, enabled: Boolean(user?.id) });
  const moderator = accessQuery.data?.success && accessQuery.data.isModerator;
  const summaryQuery = useQuery({ queryKey: ['globalRoomOpsSummary'], queryFn: getGlobalRoomOpsSummary, enabled: Boolean(moderator), refetchInterval: 60 * 1000, refetchOnWindowFocus: true });
  const summaryFailed = summaryQuery.isError || (summaryQuery.data && !summaryQuery.data.success);
  const s = summaryQuery.data?.success ? summaryQuery.data.summary : null;

  if (authLoading || (isAuthenticated && accessQuery.isLoading)) return <div role="status" aria-live="polite" className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">{t.loading}</div>;

  if (!isAuthenticated || !user || !moderator) {
    return <div className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-2xl"><Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link><Card className="mt-6 rounded-3xl"><CardHeader><CardTitle>{t.restricted}</CardTitle></CardHeader><CardContent><ShieldCheck aria-hidden="true" className="mb-4 h-10 w-10 text-slate-400" /><p className="text-slate-600">{t.restrictedCopy}</p></CardContent></Card></div></div>;
  }

  const links = [
    ['/RoomModeration', t.moderation, ShieldCheck],
    ['/RoomProgramManager', t.programManager, Radio],
    ['/RoomReportQueue', t.reportsQueue, Flag],
    ['/RoomOfficialScheduler', t.official, CalendarClock],
    ['/RoomReplayManager', t.replays, RotateCcw],
    ['/RoomModerationAudit', t.audit, Activity],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-rose-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10"><div className="flex gap-4"><div className="rounded-2xl bg-rose-50 p-3"><Activity aria-hidden="true" className="h-7 w-7 text-rose-600" /></div><div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1><p className="mt-2 text-slate-600">{t.subtitle}</p></div></div></div>

        {summaryQuery.isLoading ? <div role="status" aria-live="polite" className="mt-6 rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.loading}</div> : summaryFailed || !s ? (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><span>{t.loadError}</span></div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Users} label={t.pendingCreators} value={s.pendingCreators} /><Metric icon={ShieldCheck} label={t.pendingPrograms} value={s.pendingPrograms} /><Metric icon={Flag} label={t.reports} value={s.openReports} /><Metric icon={Radio} label={t.live} value={s.liveNow} /><Metric icon={CalendarClock} label={t.next24} value={s.next24Hours} /><Metric icon={CalendarClock} label={t.next7} value={s.next7Days} /><Metric icon={Users} label={t.creators} value={s.approvedCreators} /></div>
        )}

        <Card className="mt-6 rounded-3xl"><CardContent className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">{links.map(([to, label, Icon]) => <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800"><Icon aria-hidden="true" className="h-5 w-5" /> {label}</Link>)}</CardContent></Card>
      </div>
    </div>
  );
}
