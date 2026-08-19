import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock3, FileClock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { isGlobalRoomModerator } from '@/lib/globalRoomModerationService';
import { getGlobalRoomModerationAudit } from '@/lib/globalRoomAuditService';

const translations = {
  en: {
    title: 'Global Room Moderation History',
    subtitle: 'Recent creator and programming decisions recorded by the Global Relationship Room.',
    back: 'Back to the Global Relationship Room',
    moderation: 'Moderation Queue',
    programs: 'Program Manager',
    restricted: 'Moderator access required',
    restrictedCopy: 'The moderation history is available only to trusted One2OneLove Global Relationship Room moderators.',
    loading: 'Loading moderation history…',
    empty: 'No moderation actions have been recorded yet.',
    creator: 'Creator',
    program: 'Program',
    action: 'Action',
    target: 'Target',
  },
  es: {
    title: 'Historial de Moderación de la Sala Global',
    subtitle: 'Decisiones recientes sobre creadores y programación registradas por la Sala Global de Relaciones.',
    back: 'Volver a la Sala Global de Relaciones',
    moderation: 'Cola de Moderación',
    programs: 'Administrador de Programas',
    restricted: 'Se requiere acceso de moderador',
    restrictedCopy: 'El historial de moderación está disponible solo para moderadores de confianza de One2OneLove.',
    loading: 'Cargando historial de moderación…',
    empty: 'Todavía no se han registrado acciones de moderación.',
    creator: 'Creador',
    program: 'Programa',
    action: 'Acción',
    target: 'Objetivo',
  },
  fr: {
    title: 'Historique de Modération de la Salle Mondiale',
    subtitle: 'Décisions récentes concernant les créateurs et les programmes de la Salle Mondiale des Relations.',
    back: 'Retour à la Salle Mondiale des Relations',
    moderation: 'File de Modération',
    programs: 'Gestionnaire des Programmes',
    restricted: 'Accès modérateur requis',
    restrictedCopy: 'L’historique de modération est réservé aux modérateurs de confiance One2OneLove.',
    loading: 'Chargement de l’historique…',
    empty: 'Aucune action de modération n’a encore été enregistrée.',
    creator: 'Créateur',
    program: 'Programme',
    action: 'Action',
    target: 'Cible',
  },
  it: {
    title: 'Cronologia Moderazione della Sala Globale',
    subtitle: 'Decisioni recenti su creator e programmi registrate dalla Sala Globale delle Relazioni.',
    back: 'Torna alla Sala Globale delle Relazioni',
    moderation: 'Coda Moderazione',
    programs: 'Gestione Programmi',
    restricted: 'Accesso moderatore richiesto',
    restrictedCopy: 'La cronologia di moderazione è disponibile solo ai moderatori fidati One2OneLove.',
    loading: 'Caricamento cronologia…',
    empty: 'Non sono ancora state registrate azioni di moderazione.',
    creator: 'Creator',
    program: 'Programma',
    action: 'Azione',
    target: 'Obiettivo',
  },
  de: {
    title: 'Moderationsverlauf des Globalen Raums',
    subtitle: 'Kürzlich protokollierte Entscheidungen zu Creators und Programmen im Globalen Beziehungsraum.',
    back: 'Zurück zum Globalen Beziehungsraum',
    moderation: 'Moderationsliste',
    programs: 'Programmverwaltung',
    restricted: 'Moderatorzugang erforderlich',
    restrictedCopy: 'Der Moderationsverlauf ist nur für vertrauenswürdige One2OneLove-Moderatoren verfügbar.',
    loading: 'Moderationsverlauf wird geladen…',
    empty: 'Es wurden noch keine Moderationsaktionen protokolliert.',
    creator: 'Creator',
    program: 'Programm',
    action: 'Aktion',
    target: 'Ziel',
  },
};

function formatDateTime(value, language) {
  try {
    return new Intl.DateTimeFormat(language || 'en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

function actionLabel(decision) {
  return String(decision || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function RoomModerationAudit() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const accessQuery = useQuery({
    queryKey: ['globalRoomModeratorAccess', user?.id],
    queryFn: isGlobalRoomModerator,
    enabled: Boolean(user?.id),
  });
  const moderator = accessQuery.data?.success && accessQuery.data.isModerator;

  const auditQuery = useQuery({
    queryKey: ['globalRoomModerationAudit'],
    queryFn: () => getGlobalRoomModerationAudit(100),
    enabled: Boolean(moderator),
  });
  const entries = auditQuery.data?.success ? auditQuery.data.entries : [];

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
          <Link to="/RoomProgramManager" className="font-medium text-slate-600 hover:underline">{t.programs}</Link>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <div className="flex gap-4">
            <div className="rounded-2xl bg-slate-100 p-3"><FileClock className="h-7 w-7 text-slate-700" /></div>
            <div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1><p className="mt-2 text-slate-600">{t.subtitle}</p></div>
          </div>
        </div>

        <Card className="mt-6 rounded-3xl">
          <CardContent className="pt-6">
            {auditQuery.isLoading ? <p className="text-slate-500">{t.loading}</p> : entries.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.empty}</p>
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{entry.target_type === 'creator' ? t.creator : t.program}</span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{t.action}: {actionLabel(entry.decision)}</span>
                        </div>
                        {entry.details?.title && <div className="mt-3 font-semibold text-slate-900">{entry.details.title}</div>}
                        <div className="mt-2 break-all text-xs text-slate-400">{t.target}: {entry.target_id}</div>
                      </div>
                      <div className="shrink-0 text-sm text-slate-500"><Clock3 className="mr-1 inline h-4 w-4" />{formatDateTime(entry.created_at, currentLanguage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
