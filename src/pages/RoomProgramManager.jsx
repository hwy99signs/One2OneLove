import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock3, Radio, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  getGlobalRoomActivePrograms,
  isGlobalRoomModerator,
  removeGlobalRoomProgram,
} from '@/lib/globalRoomModerationService';

const translations = {
  en: {
    title: 'Global Room Program Manager',
    subtitle: 'Manage approved, scheduled, and live programming without exposing moderator controls to ordinary users.',
    back: 'Back to the Global Relationship Room',
    moderation: 'Moderation Queue',
    replays: 'Replay Manager',
    restricted: 'Moderator access required',
    restrictedCopy: 'This operational area is limited to trusted One2OneLove Global Relationship Room moderators.',
    loading: 'Loading active programming…',
    empty: 'No approved, scheduled, or live programs require management right now.',
    remove: 'Remove Program',
    removing: 'Removing…',
    reason: 'Reason for removal (optional but recommended)',
    removed: 'Program removed from the Global Relationship Room.',
    failed: 'The program could not be removed. Please try again.',
    status: 'Status',
    type: 'Type',
    live: 'LIVE NOW',
    disclaimer: 'Removing a program immediately hides it from the public schedule and records the moderation action in the private audit trail.',
  },
  es: {
    title: 'Administrador de Programas de la Sala Global',
    subtitle: 'Gestiona programación aprobada, programada y en vivo sin exponer controles de moderación a usuarios normales.',
    back: 'Volver a la Sala Global de Relaciones',
    moderation: 'Cola de Moderación',
    replays: 'Administrador de Repeticiones',
    restricted: 'Se requiere acceso de moderador',
    restrictedCopy: 'Esta área operativa está limitada a moderadores de confianza de la Sala Global de Relaciones One2OneLove.',
    loading: 'Cargando programación activa…',
    empty: 'No hay programas aprobados, programados o en vivo que requieran gestión.',
    remove: 'Retirar Programa',
    removing: 'Retirando…',
    reason: 'Motivo del retiro (opcional, pero recomendado)',
    removed: 'Programa retirado de la Sala Global de Relaciones.',
    failed: 'No se pudo retirar el programa. Inténtalo de nuevo.',
    status: 'Estado',
    type: 'Tipo',
    live: 'EN VIVO',
    disclaimer: 'Retirar un programa lo oculta inmediatamente del horario público y registra la acción en el historial privado de moderación.',
  },
  fr: {
    title: 'Gestionnaire des Programmes de la Salle Mondiale',
    subtitle: 'Gérez les programmes approuvés, planifiés et en direct sans exposer les contrôles de modération aux utilisateurs ordinaires.',
    back: 'Retour à la Salle Mondiale des Relations',
    moderation: 'File de Modération',
    replays: 'Gestionnaire des Rediffusions',
    restricted: 'Accès modérateur requis',
    restrictedCopy: 'Cette zone opérationnelle est réservée aux modérateurs de confiance de la Salle Mondiale des Relations One2OneLove.',
    loading: 'Chargement des programmes actifs…',
    empty: 'Aucun programme approuvé, planifié ou en direct ne nécessite de gestion.',
    remove: 'Retirer le Programme',
    removing: 'Retrait…',
    reason: 'Motif du retrait (facultatif mais recommandé)',
    removed: 'Programme retiré de la Salle Mondiale des Relations.',
    failed: 'Le programme n’a pas pu être retiré. Veuillez réessayer.',
    status: 'Statut',
    type: 'Type',
    live: 'EN DIRECT',
    disclaimer: 'Le retrait masque immédiatement le programme du planning public et enregistre l’action dans l’historique privé de modération.',
  },
  it: {
    title: 'Gestione Programmi della Sala Globale',
    subtitle: 'Gestisci programmi approvati, pianificati e in diretta senza esporre i controlli di moderazione agli utenti normali.',
    back: 'Torna alla Sala Globale delle Relazioni',
    moderation: 'Coda Moderazione',
    replays: 'Gestione Repliche',
    restricted: 'Accesso moderatore richiesto',
    restrictedCopy: 'Quest’area operativa è riservata ai moderatori fidati della Sala Globale delle Relazioni One2OneLove.',
    loading: 'Caricamento programmi attivi…',
    empty: 'Nessun programma approvato, pianificato o in diretta richiede gestione.',
    remove: 'Rimuovi Programma',
    removing: 'Rimozione…',
    reason: 'Motivo della rimozione (opzionale ma consigliato)',
    removed: 'Programma rimosso dalla Sala Globale delle Relazioni.',
    failed: 'Impossibile rimuovere il programma. Riprova.',
    status: 'Stato',
    type: 'Tipo',
    live: 'IN DIRETTA',
    disclaimer: 'La rimozione nasconde immediatamente il programma dal calendario pubblico e registra l’azione nel registro privato di moderazione.',
  },
  de: {
    title: 'Programmverwaltung des Globalen Raums',
    subtitle: 'Verwalte freigegebene, geplante und laufende Programme, ohne Moderationskontrollen normalen Nutzern zugänglich zu machen.',
    back: 'Zurück zum Globalen Beziehungsraum',
    moderation: 'Moderationsliste',
    replays: 'Wiederholungsverwaltung',
    restricted: 'Moderatorzugang erforderlich',
    restrictedCopy: 'Dieser operative Bereich ist auf vertrauenswürdige Moderatoren des One2OneLove Globalen Beziehungsraums beschränkt.',
    loading: 'Aktive Programme werden geladen…',
    empty: 'Derzeit müssen keine freigegebenen, geplanten oder laufenden Programme verwaltet werden.',
    remove: 'Programm Entfernen',
    removing: 'Wird entfernt…',
    reason: 'Grund für die Entfernung (optional, aber empfohlen)',
    removed: 'Programm aus dem Globalen Beziehungsraum entfernt.',
    failed: 'Das Programm konnte nicht entfernt werden. Bitte versuche es erneut.',
    status: 'Status',
    type: 'Typ',
    live: 'JETZT LIVE',
    disclaimer: 'Das Entfernen blendet ein Programm sofort aus dem öffentlichen Zeitplan aus und protokolliert die Aktion im privaten Moderationsverlauf.',
  },
};

function formatDateTime(value, language) {
  try {
    return new Intl.DateTimeFormat(language || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

function isLive(program) {
  const now = Date.now();
  return new Date(program.scheduled_start).getTime() <= now && new Date(program.scheduled_end).getTime() > now;
}

export default function RoomProgramManager() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [reasons, setReasons] = useState({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const accessQuery = useQuery({
    queryKey: ['globalRoomModeratorAccess', user?.id],
    queryFn: isGlobalRoomModerator,
    enabled: Boolean(user?.id),
  });
  const moderator = accessQuery.data?.success && accessQuery.data.isModerator;

  const programsQuery = useQuery({
    queryKey: ['globalRoomActivePrograms'],
    queryFn: getGlobalRoomActivePrograms,
    enabled: Boolean(moderator),
    refetchInterval: 60 * 1000,
  });
  const programs = programsQuery.data?.success ? programsQuery.data.programs : [];

  const removeMutation = useMutation({
    mutationFn: ({ id, reason }) => removeGlobalRoomProgram(id, reason),
    onSuccess: (result) => {
      if (!result.success) {
        setError(t.failed);
        return;
      }
      setError('');
      setNotice(t.removed);
      queryClient.invalidateQueries({ queryKey: ['globalRoomActivePrograms'] });
      queryClient.invalidateQueries({ queryKey: ['globalRelationshipRoom'] });
      queryClient.invalidateQueries({ queryKey: ['globalRoomModerationQueue'] });
    },
    onError: () => setError(t.failed),
  });

  if (authLoading || (isAuthenticated && accessQuery.isLoading)) {
    return <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">{t.loading}</div>;
  }

  if (!isAuthenticated || !user || !moderator) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link>
          <Card className="mt-6 rounded-3xl">
            <CardHeader><CardTitle>{t.restricted}</CardTitle></CardHeader>
            <CardContent><ShieldCheck className="mb-4 h-10 w-10 text-slate-400" /><p className="text-slate-600">{t.restrictedCopy}</p></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-rose-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to="/GlobalRelationshipRoom" className="font-medium text-rose-700 hover:underline">← {t.back}</Link>
          <Link to="/RoomModeration" className="font-medium text-slate-600 hover:underline">{t.moderation}</Link>
          <Link to="/RoomReplayManager" className="font-medium text-slate-600 hover:underline">{t.replays}</Link>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <div className="flex gap-4">
            <div className="rounded-2xl bg-slate-100 p-3"><Radio className="h-7 w-7 text-slate-700" /></div>
            <div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1><p className="mt-2 text-slate-600">{t.subtitle}</p></div>
          </div>
          <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{t.disclaimer}</p>
        </div>

        {(notice || error) && <div className={`mt-5 rounded-2xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}

        <Card className="mt-6 rounded-3xl">
          <CardContent className="pt-6">
            {programsQuery.isLoading ? <p className="text-slate-500">{t.loading}</p> : programs.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.empty}</p>
            ) : (
              <div className="space-y-4">
                {programs.map((program) => {
                  const live = isLive(program);
                  return (
                    <div key={program.id} className={`rounded-2xl border p-5 ${live ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200'}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {live && <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white">{t.live}</span>}
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{t.status}: {program.status}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{t.type}: {program.program_type}</span>
                          </div>
                          <h2 className="mt-3 text-lg font-semibold text-slate-900">{program.title}</h2>
                          {program.description && <p className="mt-1 text-sm leading-6 text-slate-600">{program.description}</p>}
                          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500"><Clock3 className="h-4 w-4" />{formatDateTime(program.scheduled_start, currentLanguage)}</div>
                        </div>
                        <div className="w-full shrink-0 space-y-2 lg:w-80">
                          <Input value={reasons[program.id] || ''} onChange={(e) => setReasons((current) => ({ ...current, [program.id]: e.target.value }))} placeholder={t.reason} maxLength={1000} />
                          <Button variant="destructive" className="w-full" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate({ id: program.id, reason: reasons[program.id] || '' })}>
                            <Trash2 className="mr-2 h-4 w-4" />{removeMutation.isPending ? t.removing : t.remove}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
