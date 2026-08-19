import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock3, RotateCcw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  getGlobalRoomReplaySources,
  isGlobalRoomModerator,
  scheduleGlobalRoomReplay,
} from '@/lib/globalRoomModerationService';
import { translateGlobalRoomServiceError } from '@/lib/globalRoomI18n';

const translations = {
  en: { title: 'Global Room Replay Manager', subtitle: 'Schedule approved past programming into open future times.', back: 'Back to the Global Relationship Room', moderation: 'Moderation', restricted: 'Moderator access required', restrictedCopy: 'Replay scheduling is limited to trusted One2OneLove Global Relationship Room moderators.', loading: 'Loading replay library…', source: 'Source program', choose: 'Choose a past program', customTitle: 'Replay title (optional)', start: 'Replay start', end: 'Replay end', schedule: 'Schedule Replay', scheduling: 'Scheduling…', empty: 'No eligible past programs are available for replay yet.', scheduled: 'Replay scheduled.', required: 'Choose a source program and valid start/end times.', failed: 'Replay could not be scheduled. Please try another time.', original: 'Originally aired' },
  es: { title: 'Administrador de Repeticiones de la Sala Global', subtitle: 'Programa contenido pasado aprobado en horarios futuros disponibles.', back: 'Volver a la Sala Global de Relaciones', moderation: 'Moderación', restricted: 'Se requiere acceso de moderador', restrictedCopy: 'La programación de repeticiones está limitada a moderadores de confianza de One2OneLove.', loading: 'Cargando biblioteca de repeticiones…', source: 'Programa de origen', choose: 'Elige un programa pasado', customTitle: 'Título de repetición (opcional)', start: 'Inicio de repetición', end: 'Fin de repetición', schedule: 'Programar Repetición', scheduling: 'Programando…', empty: 'Todavía no hay programas pasados elegibles para repetición.', scheduled: 'Repetición programada.', required: 'Elige un programa de origen y horas válidas de inicio y fin.', failed: 'No se pudo programar la repetición. Prueba otro horario.', original: 'Emitido originalmente' },
  fr: { title: 'Gestionnaire des Rediffusions', subtitle: 'Planifiez d’anciens programmes approuvés dans des créneaux futurs disponibles.', back: 'Retour à la Salle Mondiale des Relations', moderation: 'Modération', restricted: 'Accès modérateur requis', restrictedCopy: 'La planification des rediffusions est réservée aux modérateurs de confiance One2OneLove.', loading: 'Chargement de la bibliothèque…', source: 'Programme source', choose: 'Choisissez un ancien programme', customTitle: 'Titre de rediffusion (facultatif)', start: 'Début de rediffusion', end: 'Fin de rediffusion', schedule: 'Planifier la Rediffusion', scheduling: 'Planification…', empty: 'Aucun ancien programme éligible n’est encore disponible.', scheduled: 'Rediffusion planifiée.', required: 'Choisissez un programme source et des heures de début et de fin valides.', failed: 'La rediffusion n’a pas pu être planifiée. Essayez un autre créneau.', original: 'Diffusé initialement' },
  it: { title: 'Gestione Repliche della Sala Globale', subtitle: 'Programma contenuti passati approvati negli orari futuri disponibili.', back: 'Torna alla Sala Globale delle Relazioni', moderation: 'Moderazione', restricted: 'Accesso moderatore richiesto', restrictedCopy: 'La programmazione delle repliche è riservata ai moderatori fidati One2OneLove.', loading: 'Caricamento libreria repliche…', source: 'Programma di origine', choose: 'Scegli un programma passato', customTitle: 'Titolo replica (opzionale)', start: 'Inizio replica', end: 'Fine replica', schedule: 'Programma Replica', scheduling: 'Programmazione…', empty: 'Non sono ancora disponibili programmi passati idonei alla replica.', scheduled: 'Replica programmata.', required: 'Scegli un programma di origine e orari di inizio e fine validi.', failed: 'Impossibile programmare la replica. Prova un altro orario.', original: 'Trasmissione originale' },
  de: { title: 'Wiederholungsverwaltung des Globalen Raums', subtitle: 'Plane freigegebene vergangene Programme in freie zukünftige Zeiten ein.', back: 'Zurück zum Globalen Beziehungsraum', moderation: 'Moderation', restricted: 'Moderatorzugang erforderlich', restrictedCopy: 'Die Planung von Wiederholungen ist auf vertrauenswürdige One2OneLove-Moderatoren beschränkt.', loading: 'Wiederholungsbibliothek wird geladen…', source: 'Quellprogramm', choose: 'Vergangenes Programm auswählen', customTitle: 'Wiederholungstitel (optional)', start: 'Start der Wiederholung', end: 'Ende der Wiederholung', schedule: 'Wiederholung Planen', scheduling: 'Wird geplant…', empty: 'Es sind noch keine geeigneten vergangenen Programme verfügbar.', scheduled: 'Wiederholung geplant.', required: 'Wähle ein Quellprogramm und gültige Start- und Endzeiten.', failed: 'Die Wiederholung konnte nicht geplant werden. Versuche eine andere Zeit.', original: 'Ursprünglich gesendet' },
};

function formatDate(value, language) {
  try {
    return new Intl.DateTimeFormat(language || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

export default function RoomReplayManager() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [sourceId, setSourceId] = useState('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const accessQuery = useQuery({ queryKey: ['globalRoomModeratorAccess', user?.id], queryFn: isGlobalRoomModerator, enabled: Boolean(user?.id) });
  const isModerator = accessQuery.data?.success && accessQuery.data.isModerator;
  const sourcesQuery = useQuery({ queryKey: ['globalRoomReplaySources'], queryFn: getGlobalRoomReplaySources, enabled: Boolean(isModerator) });
  const sources = sourcesQuery.data?.success ? sourcesQuery.data.sources : [];
  const selectedSource = useMemo(() => sources.find((item) => item.id === sourceId) || null, [sources, sourceId]);

  const scheduleMutation = useMutation({
    mutationFn: () => scheduleGlobalRoomReplay({ sourceSlotId: sourceId, scheduledStart: startTime, scheduledEnd: endTime, title }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(translateGlobalRoomServiceError(result.error, currentLanguage, 'genericError') || t.failed);
        return;
      }
      setError('');
      setNotice(t.scheduled);
      setSourceId(''); setTitle(''); setStartTime(''); setEndTime('');
      queryClient.invalidateQueries({ queryKey: ['globalRelationshipRoom'] });
    },
    onError: () => setError(t.failed),
  });

  const submit = (event) => {
    event.preventDefault(); setNotice(''); setError('');
    if (!sourceId || !startTime || !endTime) { setError(t.required); return; }
    scheduleMutation.mutate();
  };

  if (authLoading || (isAuthenticated && accessQuery.isLoading)) return <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">{t.loading}</div>;

  if (!isAuthenticated || !user || !isModerator) {
    return <div className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-2xl"><Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link><Card className="mt-6 rounded-3xl"><CardHeader><CardTitle>{t.restricted}</CardTitle></CardHeader><CardContent><ShieldCheck className="mb-4 h-10 w-10 text-slate-400" /><p className="text-slate-600">{t.restrictedCopy}</p></CardContent></Card></div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-rose-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap gap-4 text-sm"><Link to="/GlobalRelationshipRoom" className="font-medium text-rose-700 hover:underline">← {t.back}</Link><Link to="/RoomModeration" className="font-medium text-slate-600 hover:underline">{t.moderation}</Link></div>
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10"><div className="flex gap-4"><div className="rounded-2xl bg-slate-100 p-3"><RotateCcw className="h-7 w-7 text-slate-700" /></div><div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1><p className="mt-2 text-slate-600">{t.subtitle}</p></div></div></div>
        {(notice || error) && <div className={`mt-5 rounded-2xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}
        <Card className="mt-6 rounded-3xl"><CardContent className="pt-6">
          {sourcesQuery.isLoading ? <p className="text-slate-500">{t.loading}</p> : sources.length === 0 ? <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.empty}</p> : (
            <form className="space-y-5" onSubmit={submit}>
              <label className="block text-sm font-medium text-slate-700">{t.source}<select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">{t.choose}</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}</select></label>
              {selectedSource && <div className="rounded-2xl bg-slate-50 p-4"><div className="font-semibold text-slate-900">{selectedSource.title}</div><div className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Clock3 className="h-4 w-4" />{t.original}: {formatDate(selectedSource.scheduled_start, currentLanguage)}</div></div>}
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.customTitle} maxLength={160} />
              <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">{t.start}<Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" /></label><label className="text-sm font-medium text-slate-700">{t.end}<Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" /></label></div>
              <Button type="submit" className="w-full" disabled={scheduleMutation.isPending}><RotateCcw className="mr-2 h-4 w-4" />{scheduleMutation.isPending ? t.scheduling : t.schedule}</Button>
            </form>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
