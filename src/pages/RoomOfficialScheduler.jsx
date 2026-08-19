import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Radio, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { isGlobalRoomModerator } from '@/lib/globalRoomModerationService';
import { scheduleGlobalRoomOfficialProgram } from '@/lib/globalRoomOfficialService';
import { translateGlobalRoomServiceError } from '@/lib/globalRoomI18n';

const translations = {
  en: {
    title: 'One2OneLove Official Programming',
    subtitle: 'Schedule One2OneLove-owned programs directly into the Global Relationship Room.',
    back: 'Back to the Global Relationship Room',
    moderation: 'Moderation Queue',
    programs: 'Program Manager',
    replays: 'Replay Manager',
    restricted: 'Moderator access required',
    restrictedCopy: 'Official One2OneLove programming can only be scheduled by trusted Global Relationship Room moderators.',
    programTitle: 'Official program title',
    description: 'Program description',
    start: 'Start time',
    end: 'End time',
    schedule: 'Schedule Official Program',
    scheduling: 'Scheduling…',
    scheduled: 'Official One2OneLove program scheduled.',
    required: 'Enter a title, start time, and end time.',
    failed: 'The official program could not be scheduled. Please try another time.',
    note: 'Official One2OneLove programming appears with the One2OneLove program badge and does not receive the third-party creator disclaimer.',
    loading: 'Verifying moderator access…',
  },
  es: {
    title: 'Programación Oficial de One2OneLove',
    subtitle: 'Programa contenido propio de One2OneLove directamente en la Sala Global de Relaciones.',
    back: 'Volver a la Sala Global de Relaciones',
    moderation: 'Cola de Moderación',
    programs: 'Administrador de Programas',
    replays: 'Administrador de Repeticiones',
    restricted: 'Se requiere acceso de moderador',
    restrictedCopy: 'Solo moderadores de confianza pueden programar contenido oficial de One2OneLove.',
    programTitle: 'Título del programa oficial',
    description: 'Descripción del programa',
    start: 'Hora de inicio',
    end: 'Hora de finalización',
    schedule: 'Programar Contenido Oficial',
    scheduling: 'Programando…',
    scheduled: 'Programa oficial de One2OneLove programado.',
    required: 'Ingresa un título, hora de inicio y hora de finalización.',
    failed: 'No se pudo programar el contenido oficial. Prueba otro horario.',
    note: 'La programación oficial aparece con la insignia One2OneLove y no recibe el aviso de creador externo.',
    loading: 'Verificando acceso de moderador…',
  },
  fr: {
    title: 'Programmation Officielle One2OneLove',
    subtitle: 'Planifiez les programmes officiels One2OneLove directement dans la Salle Mondiale des Relations.',
    back: 'Retour à la Salle Mondiale des Relations',
    moderation: 'File de Modération',
    programs: 'Gestionnaire des Programmes',
    replays: 'Gestionnaire des Rediffusions',
    restricted: 'Accès modérateur requis',
    restrictedCopy: 'Seuls les modérateurs de confiance peuvent planifier les programmes officiels One2OneLove.',
    programTitle: 'Titre du programme officiel',
    description: 'Description du programme',
    start: 'Heure de début',
    end: 'Heure de fin',
    schedule: 'Planifier le Programme Officiel',
    scheduling: 'Planification…',
    scheduled: 'Programme officiel One2OneLove planifié.',
    required: 'Saisissez un titre, une heure de début et une heure de fin.',
    failed: 'Le programme officiel n’a pas pu être planifié. Essayez un autre créneau.',
    note: 'Les programmes officiels portent l’indicateur One2OneLove et n’affichent pas l’avis destiné aux créateurs tiers.',
    loading: 'Vérification de l’accès modérateur…',
  },
  it: {
    title: 'Programmazione Ufficiale One2OneLove',
    subtitle: 'Programma contenuti ufficiali One2OneLove direttamente nella Sala Globale delle Relazioni.',
    back: 'Torna alla Sala Globale delle Relazioni',
    moderation: 'Coda Moderazione',
    programs: 'Gestione Programmi',
    replays: 'Gestione Repliche',
    restricted: 'Accesso moderatore richiesto',
    restrictedCopy: 'Solo i moderatori fidati possono programmare contenuti ufficiali One2OneLove.',
    programTitle: 'Titolo del programma ufficiale',
    description: 'Descrizione del programma',
    start: 'Ora di inizio',
    end: 'Ora di fine',
    schedule: 'Programma Contenuto Ufficiale',
    scheduling: 'Programmazione…',
    scheduled: 'Programma ufficiale One2OneLove pianificato.',
    required: 'Inserisci titolo, ora di inizio e ora di fine.',
    failed: 'Impossibile programmare il contenuto ufficiale. Prova un altro orario.',
    note: 'La programmazione ufficiale mostra l’indicatore One2OneLove e non riceve l’avviso dedicato ai creator esterni.',
    loading: 'Verifica accesso moderatore…',
  },
  de: {
    title: 'Offizielle One2OneLove-Programme',
    subtitle: 'Plane One2OneLove-eigene Programme direkt im Globalen Beziehungsraum.',
    back: 'Zurück zum Globalen Beziehungsraum',
    moderation: 'Moderationsliste',
    programs: 'Programmverwaltung',
    replays: 'Wiederholungsverwaltung',
    restricted: 'Moderatorzugang erforderlich',
    restrictedCopy: 'Offizielle One2OneLove-Programme können nur von vertrauenswürdigen Moderatoren geplant werden.',
    programTitle: 'Titel des offiziellen Programms',
    description: 'Programmbeschreibung',
    start: 'Startzeit',
    end: 'Endzeit',
    schedule: 'Offizielles Programm Planen',
    scheduling: 'Wird geplant…',
    scheduled: 'Offizielles One2OneLove-Programm geplant.',
    required: 'Gib Titel, Startzeit und Endzeit ein.',
    failed: 'Das offizielle Programm konnte nicht geplant werden. Versuche eine andere Zeit.',
    note: 'Offizielle Programme tragen die One2OneLove-Kennzeichnung und erhalten keinen Hinweis für externe Creator.',
    loading: 'Moderatorzugang wird überprüft…',
  },
};

export default function RoomOfficialScheduler() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const accessQuery = useQuery({
    queryKey: ['globalRoomModeratorAccess', user?.id],
    queryFn: isGlobalRoomModerator,
    enabled: Boolean(user?.id),
  });
  const moderator = accessQuery.data?.success && accessQuery.data.isModerator;

  const scheduleMutation = useMutation({
    mutationFn: () => scheduleGlobalRoomOfficialProgram({ title, description, scheduledStart: startTime, scheduledEnd: endTime }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(translateGlobalRoomServiceError(result.error, currentLanguage, 'genericError') || t.failed);
        return;
      }
      setError('');
      setNotice(t.scheduled);
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      queryClient.invalidateQueries({ queryKey: ['globalRelationshipRoom'] });
      queryClient.invalidateQueries({ queryKey: ['globalRoomActivePrograms'] });
    },
    onError: () => setError(t.failed),
  });

  const submit = (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!title.trim() || !startTime || !endTime) {
      setError(t.required);
      return;
    }
    scheduleMutation.mutate();
  };

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
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link to="/GlobalRelationshipRoom" className="font-medium text-rose-700 hover:underline">← {t.back}</Link>
          <Link to="/RoomModeration" className="font-medium text-slate-600 hover:underline">{t.moderation}</Link>
          <Link to="/RoomProgramManager" className="font-medium text-slate-600 hover:underline">{t.programs}</Link>
          <Link to="/RoomReplayManager" className="font-medium text-slate-600 hover:underline">{t.replays}</Link>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <div className="flex gap-4">
            <div className="rounded-2xl bg-rose-50 p-3"><Radio className="h-7 w-7 text-rose-600" /></div>
            <div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1><p className="mt-2 text-slate-600">{t.subtitle}</p></div>
          </div>
          <p className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900"><ShieldCheck className="mr-2 inline h-4 w-4" />{t.note}</p>
        </div>

        {(notice || error) && <div className={`mt-5 rounded-2xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>}

        <Card className="mt-6 rounded-3xl">
          <CardContent className="pt-6">
            <form className="space-y-5" onSubmit={submit}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.programTitle} maxLength={160} />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.description} rows={5} maxLength={2000} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">{t.start}<Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" /></label>
                <label className="text-sm font-medium text-slate-700">{t.end}<Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" /></label>
              </div>
              <Button type="submit" className="w-full" disabled={scheduleMutation.isPending}><CalendarClock className="mr-2 h-4 w-4" />{scheduleMutation.isPending ? t.scheduling : t.schedule}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
