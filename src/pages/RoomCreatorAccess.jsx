import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Clock3, Radio, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  cancelMyRoomSlot,
  createRoomCreatorProfile,
  getMyRoomCreatorProfile,
  getMyRoomSlots,
  submitRoomSlot,
} from '@/lib/globalRelationshipRoomService';

const translations = {
  en: {
    title: 'Global Relationship Room Creator Access',
    subtitle: 'Apply once, then self-book open programming times after approval.',
    back: 'Back to the Global Relationship Room',
    signInTitle: 'Sign in required',
    signInCopy: 'Creator profiles and programming reservations are connected to your One2OneLove account.',
    signIn: 'Sign In',
    profileTitle: 'Creator Profile',
    displayName: 'Creator / Program Name',
    bio: 'Short creator bio',
    agree: 'I understand that my programming and opinions are my own and do not necessarily represent One2OneLove or ERANT.',
    apply: 'Submit Creator Application',
    submitting: 'Submitting…',
    pending: 'Application pending review',
    approved: 'Creator approved',
    suspended: 'Creator access suspended',
    rejected: 'Application not approved',
    approvalCopy: 'Programming can be booked after creator approval. This protects viewers and preserves room quality.',
    bookingTitle: 'Book Programming',
    programTitle: 'Program title',
    description: 'Program description',
    start: 'Start time',
    end: 'End time',
    book: 'Submit Time Slot',
    booking: 'Submitting…',
    freeLimit: 'Free creator accounts may book up to 2 programming slots per day.',
    moderation: 'Every submitted slot enters moderation before it appears on the public schedule.',
    mySlots: 'My Programming',
    noSlots: 'You have not submitted any programming yet.',
    cancel: 'Cancel',
    cancelled: 'Cancelled',
    pendingSlot: 'Pending review',
    approvedSlot: 'Approved',
    scheduledSlot: 'Scheduled',
    liveSlot: 'Live',
    completedSlot: 'Completed',
    removedSlot: 'Removed',
    required: 'Please complete the required fields and accept the creator disclaimer.',
    submitted: 'Your creator application has been submitted.',
    slotSubmitted: 'Your programming slot has been submitted for review.',
    slotCancelled: 'Programming slot cancelled.',
  },
  es: {
    title: 'Acceso de Creadores a la Sala Global de Relaciones',
    subtitle: 'Solicita una vez y, después de la aprobación, reserva horarios disponibles por tu cuenta.',
    back: 'Volver a la Sala Global de Relaciones',
    signInTitle: 'Se requiere iniciar sesión',
    signInCopy: 'Los perfiles de creadores y las reservas están vinculados a tu cuenta de One2OneLove.',
    signIn: 'Iniciar Sesión',
    profileTitle: 'Perfil de Creador',
    displayName: 'Nombre del Creador / Programa',
    bio: 'Breve biografía del creador',
    agree: 'Entiendo que mi programación y opiniones son propias y no representan necesariamente a One2OneLove o ERANT.',
    apply: 'Enviar Solicitud de Creador',
    submitting: 'Enviando…',
    pending: 'Solicitud pendiente de revisión',
    approved: 'Creador aprobado',
    suspended: 'Acceso de creador suspendido',
    rejected: 'Solicitud no aprobada',
    approvalCopy: 'La programación puede reservarse después de la aprobación del creador. Esto protege a los espectadores y la calidad de la sala.',
    bookingTitle: 'Reservar Programación',
    programTitle: 'Título del programa',
    description: 'Descripción del programa',
    start: 'Hora de inicio',
    end: 'Hora de finalización',
    book: 'Enviar Horario',
    booking: 'Enviando…',
    freeLimit: 'Las cuentas gratuitas pueden reservar hasta 2 espacios de programación por día.',
    moderation: 'Cada horario enviado pasa por moderación antes de aparecer públicamente.',
    mySlots: 'Mi Programación',
    noSlots: 'Todavía no has enviado programación.',
    cancel: 'Cancelar',
    cancelled: 'Cancelado',
    pendingSlot: 'Pendiente de revisión',
    approvedSlot: 'Aprobado',
    scheduledSlot: 'Programado',
    liveSlot: 'En vivo',
    completedSlot: 'Completado',
    removedSlot: 'Retirado',
    required: 'Completa los campos requeridos y acepta el aviso del creador.',
    submitted: 'Tu solicitud de creador ha sido enviada.',
    slotSubmitted: 'Tu horario fue enviado para revisión.',
    slotCancelled: 'Horario cancelado.',
  },
  fr: {
    title: 'Accès Créateur à la Salle Mondiale des Relations',
    subtitle: 'Postulez une fois, puis réservez vous-même les créneaux disponibles après approbation.',
    back: 'Retour à la Salle Mondiale des Relations',
    signInTitle: 'Connexion requise',
    signInCopy: 'Les profils créateurs et les réservations sont liés à votre compte One2OneLove.',
    signIn: 'Se Connecter',
    profileTitle: 'Profil Créateur',
    displayName: 'Nom du Créateur / Programme',
    bio: 'Courte biographie du créateur',
    agree: 'Je comprends que mes programmes et opinions sont les miens et ne représentent pas nécessairement One2OneLove ou ERANT.',
    apply: 'Envoyer la Candidature',
    submitting: 'Envoi…',
    pending: 'Candidature en attente',
    approved: 'Créateur approuvé',
    suspended: 'Accès créateur suspendu',
    rejected: 'Candidature non approuvée',
    approvalCopy: 'La programmation peut être réservée après approbation du créateur afin de protéger le public et la qualité de la salle.',
    bookingTitle: 'Réserver un Programme',
    programTitle: 'Titre du programme',
    description: 'Description du programme',
    start: 'Heure de début',
    end: 'Heure de fin',
    book: 'Soumettre le Créneau',
    booking: 'Envoi…',
    freeLimit: 'Les comptes créateurs gratuits peuvent réserver jusqu’à 2 créneaux par jour.',
    moderation: 'Chaque créneau soumis passe par la modération avant d’apparaître au programme public.',
    mySlots: 'Mes Programmes',
    noSlots: 'Vous n’avez encore soumis aucun programme.',
    cancel: 'Annuler',
    cancelled: 'Annulé',
    pendingSlot: 'En attente',
    approvedSlot: 'Approuvé',
    scheduledSlot: 'Programmé',
    liveSlot: 'En direct',
    completedSlot: 'Terminé',
    removedSlot: 'Retiré',
    required: 'Complétez les champs requis et acceptez l’avis créateur.',
    submitted: 'Votre candidature créateur a été envoyée.',
    slotSubmitted: 'Votre créneau a été envoyé pour examen.',
    slotCancelled: 'Créneau annulé.',
  },
  it: {
    title: 'Accesso Creator alla Sala Globale delle Relazioni',
    subtitle: 'Invia la richiesta una volta e, dopo l’approvazione, prenota autonomamente gli orari disponibili.',
    back: 'Torna alla Sala Globale delle Relazioni',
    signInTitle: 'Accesso richiesto',
    signInCopy: 'I profili creator e le prenotazioni sono collegati al tuo account One2OneLove.',
    signIn: 'Accedi',
    profileTitle: 'Profilo Creator',
    displayName: 'Nome Creator / Programma',
    bio: 'Breve biografia del creator',
    agree: 'Comprendo che i miei programmi e le mie opinioni sono personali e non rappresentano necessariamente One2OneLove o ERANT.',
    apply: 'Invia Richiesta Creator',
    submitting: 'Invio…',
    pending: 'Richiesta in revisione',
    approved: 'Creator approvato',
    suspended: 'Accesso creator sospeso',
    rejected: 'Richiesta non approvata',
    approvalCopy: 'La programmazione può essere prenotata dopo l’approvazione del creator per proteggere il pubblico e la qualità della sala.',
    bookingTitle: 'Prenota Programmazione',
    programTitle: 'Titolo del programma',
    description: 'Descrizione del programma',
    start: 'Ora di inizio',
    end: 'Ora di fine',
    book: 'Invia Fascia Oraria',
    booking: 'Invio…',
    freeLimit: 'Gli account creator gratuiti possono prenotare fino a 2 slot al giorno.',
    moderation: 'Ogni slot inviato viene moderato prima di apparire nel programma pubblico.',
    mySlots: 'La Mia Programmazione',
    noSlots: 'Non hai ancora inviato alcun programma.',
    cancel: 'Annulla',
    cancelled: 'Annullato',
    pendingSlot: 'In revisione',
    approvedSlot: 'Approvato',
    scheduledSlot: 'Programmato',
    liveSlot: 'In diretta',
    completedSlot: 'Completato',
    removedSlot: 'Rimosso',
    required: 'Completa i campi richiesti e accetta l’avviso creator.',
    submitted: 'La tua richiesta creator è stata inviata.',
    slotSubmitted: 'Il tuo slot è stato inviato per la revisione.',
    slotCancelled: 'Slot annullato.',
  },
  de: {
    title: 'Creator-Zugang zum O2OL Globalen Beziehungsraum',
    subtitle: 'Einmal bewerben und nach Freigabe verfügbare Programmzeiten selbst buchen.',
    back: 'Zurück zum Globalen Beziehungsraum',
    signInTitle: 'Anmeldung erforderlich',
    signInCopy: 'Creator-Profile und Reservierungen sind mit deinem One2OneLove-Konto verbunden.',
    signIn: 'Anmelden',
    profileTitle: 'Creator-Profil',
    displayName: 'Creator- / Programmname',
    bio: 'Kurze Creator-Biografie',
    agree: 'Ich verstehe, dass meine Programme und Meinungen meine eigenen sind und nicht zwingend One2OneLove oder ERANT vertreten.',
    apply: 'Creator-Bewerbung Senden',
    submitting: 'Wird gesendet…',
    pending: 'Bewerbung wird geprüft',
    approved: 'Creator freigegeben',
    suspended: 'Creator-Zugang gesperrt',
    rejected: 'Bewerbung nicht freigegeben',
    approvalCopy: 'Programmzeiten können nach Creator-Freigabe gebucht werden. Das schützt Zuschauer und die Qualität des Raums.',
    bookingTitle: 'Programmzeit Buchen',
    programTitle: 'Programmtitel',
    description: 'Programmbeschreibung',
    start: 'Startzeit',
    end: 'Endzeit',
    book: 'Zeitslot Einreichen',
    booking: 'Wird gesendet…',
    freeLimit: 'Kostenlose Creator-Konten können bis zu 2 Programm-Slots pro Tag buchen.',
    moderation: 'Jeder eingereichte Slot wird geprüft, bevor er im öffentlichen Programm erscheint.',
    mySlots: 'Meine Programme',
    noSlots: 'Du hast noch keine Programme eingereicht.',
    cancel: 'Stornieren',
    cancelled: 'Storniert',
    pendingSlot: 'In Prüfung',
    approvedSlot: 'Freigegeben',
    scheduledSlot: 'Geplant',
    liveSlot: 'Live',
    completedSlot: 'Abgeschlossen',
    removedSlot: 'Entfernt',
    required: 'Fülle die Pflichtfelder aus und akzeptiere den Creator-Hinweis.',
    submitted: 'Deine Creator-Bewerbung wurde gesendet.',
    slotSubmitted: 'Dein Programmslot wurde zur Prüfung eingereicht.',
    slotCancelled: 'Programmslot storniert.',
  },
};

function formatDateTime(value, language) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(language || 'en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

function statusLabel(status, t) {
  const labels = {
    pending: t.pendingSlot,
    approved: t.approvedSlot,
    scheduled: t.scheduledSlot,
    live: t.liveSlot,
    completed: t.completedSlot,
    cancelled: t.cancelled,
    removed: t.removedSlot,
  };
  return labels[status] || status;
}

export default function RoomCreatorAccess() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [programTitle, setProgramTitle] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const profileQuery = useQuery({
    queryKey: ['roomCreatorProfile', user?.id],
    queryFn: () => getMyRoomCreatorProfile(user.id),
    enabled: Boolean(user?.id),
  });

  const creatorProfile = profileQuery.data?.success ? profileQuery.data.profile : null;

  const slotsQuery = useQuery({
    queryKey: ['myRoomSlots', user?.id],
    queryFn: () => getMyRoomSlots(user.id),
    enabled: Boolean(user?.id),
  });

  const slots = useMemo(
    () => (slotsQuery.data?.success ? slotsQuery.data.slots : []),
    [slotsQuery.data]
  );

  const createProfileMutation = useMutation({
    mutationFn: () => createRoomCreatorProfile(user.id, { displayName, bio }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.error || 'Unable to submit creator application.');
        return;
      }
      setError('');
      setNotice(t.submitted);
      queryClient.invalidateQueries({ queryKey: ['roomCreatorProfile', user.id] });
    },
  });

  const bookMutation = useMutation({
    mutationFn: () => submitRoomSlot({
      userId: user.id,
      creatorProfile,
      title: programTitle,
      description: programDescription,
      scheduledStart: startTime,
      scheduledEnd: endTime,
    }),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.error || 'Unable to submit programming slot.');
        return;
      }
      setError('');
      setNotice(t.slotSubmitted);
      setProgramTitle('');
      setProgramDescription('');
      setStartTime('');
      setEndTime('');
      queryClient.invalidateQueries({ queryKey: ['myRoomSlots', user.id] });
      queryClient.invalidateQueries({ queryKey: ['globalRelationshipRoom'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (slotId) => cancelMyRoomSlot(slotId, user.id),
    onSuccess: (result) => {
      if (!result.success) {
        setError(result.error || 'Unable to cancel programming slot.');
        return;
      }
      setError('');
      setNotice(t.slotCancelled);
      queryClient.invalidateQueries({ queryKey: ['myRoomSlots', user.id] });
    },
  });

  const submitProfile = (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!displayName.trim() || !termsAccepted) {
      setError(t.required);
      return;
    }
    createProfileMutation.mutate();
  };

  const submitBooking = (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!programTitle.trim() || !startTime || !endTime) {
      setError(t.required);
      return;
    }
    bookMutation.mutate();
  };

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">Loading…</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link>
          <Card className="mt-6 rounded-3xl">
            <CardHeader><CardTitle>{t.signInTitle}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-600">{t.signInCopy}</p>
              <Button className="mt-5" asChild><Link to="/SignIn">{t.signIn}</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const profileStatusText = creatorProfile
    ? ({ pending: t.pending, approved: t.approved, suspended: t.suspended, rejected: t.rejected }[creatorProfile.status] || creatorProfile.status)
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link>

        <div className="mt-5 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm md:p-9">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-rose-50 p-3"><Radio className="h-7 w-7 text-rose-600" /></div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1>
              <p className="mt-2 text-slate-600">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {(notice || error) && (
          <div className={`mt-5 rounded-2xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            {error || notice}
          </div>
        )}

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl">
            <CardHeader><CardTitle>{t.profileTitle}</CardTitle></CardHeader>
            <CardContent>
              {profileQuery.isLoading ? (
                <p className="text-slate-500">Loading…</p>
              ) : creatorProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                    {creatorProfile.status === 'approved' ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <ShieldCheck className="h-6 w-6 text-amber-600" />}
                    <div>
                      <div className="font-semibold text-slate-900">{creatorProfile.display_name}</div>
                      <div className="text-sm text-slate-600">{profileStatusText}</div>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{t.approvalCopy}</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={submitProfile}>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t.displayName} maxLength={120} />
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t.bio}
                    rows={5}
                    maxLength={1200}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                  <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1" />
                    <span>{t.agree}</span>
                  </label>
                  <Button type="submit" disabled={createProfileMutation.isPending} className="w-full">
                    {createProfileMutation.isPending ? t.submitting : t.apply}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle>{t.bookingTitle}</CardTitle></CardHeader>
            <CardContent>
              {creatorProfile?.status === 'approved' ? (
                <form className="space-y-4" onSubmit={submitBooking}>
                  <Input value={programTitle} onChange={(e) => setProgramTitle(e.target.value)} placeholder={t.programTitle} maxLength={160} />
                  <textarea
                    value={programDescription}
                    onChange={(e) => setProgramDescription(e.target.value)}
                    placeholder={t.description}
                    rows={4}
                    maxLength={2000}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">{t.start}<Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" /></label>
                    <label className="text-sm font-medium text-slate-700">{t.end}<Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" /></label>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                    <div className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0" /><span>{t.freeLimit}</span></div>
                    <div className="mt-2 flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>{t.moderation}</span></div>
                  </div>
                  <Button type="submit" disabled={bookMutation.isPending} className="w-full">
                    {bookMutation.isPending ? t.booking : t.book}
                  </Button>
                </form>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm leading-6 text-slate-600">
                  <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-amber-500" />
                  {t.approvalCopy}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 rounded-3xl">
          <CardHeader><CardTitle>{t.mySlots}</CardTitle></CardHeader>
          <CardContent>
            {slotsQuery.isLoading ? (
              <p className="text-slate-500">Loading…</p>
            ) : slots.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.noSlots}</p>
            ) : (
              <div className="space-y-3">
                {slots.map((slot) => (
                  <div key={slot.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{slot.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Clock3 className="h-4 w-4" />{formatDateTime(slot.scheduled_start, currentLanguage)}</div>
                      <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{statusLabel(slot.status, t)}</div>
                    </div>
                    {['draft', 'pending'].includes(slot.status) ? (
                      <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(slot.id)} disabled={cancelMutation.isPending}>
                        <XCircle className="mr-2 h-4 w-4" />{t.cancel}
                      </Button>
                    ) : null}
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
