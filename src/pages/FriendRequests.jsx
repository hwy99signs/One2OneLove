import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, Loader2, Mail, UserCheck, UserX, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { acceptBuddyRequest, cancelBuddyRequest, getReceivedBuddyRequests, getSentBuddyRequests, rejectBuddyRequest } from '@/lib/buddyService';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const translations = {
  en: { back: 'Back', title: 'Friend Requests', subtitle: 'Manage your One2OneLove buddy connections.', received: 'Received', sent: 'Sent', loading: 'Loading requests…', noRequests: 'No friend requests yet', noRequestsDesc: 'When another member sends you a buddy request, it will appear here.', noSentRequests: 'No pending sent requests', noSentRequestsDesc: 'Visit Find Buddies to connect with other community members.', findFriends: 'Find Buddies', accept: 'Accept', reject: 'Reject', cancel: 'Cancel', pending: 'Pending', unknownUser: 'One2OneLove Member', accepted: 'Friend request accepted.', rejected: 'Friend request rejected.', cancelled: 'Friend request cancelled.', errorLoading: 'Friend requests could not be loaded right now.', errorAccept: 'The request could not be accepted.', errorReject: 'The request could not be rejected.', errorCancel: 'The request could not be cancelled.', signIn: 'Please sign in to manage friend requests.', signInButton: 'Sign In', privacy: 'Friend requests display community-profile information only. Account email and billing information are not shown. Private chat becomes available after a connection is accepted.' },
  es: { back: 'Volver', title: 'Solicitudes de Amistad', subtitle: 'Gestiona tus conexiones de amistad en One2OneLove.', received: 'Recibidas', sent: 'Enviadas', loading: 'Cargando solicitudes…', noRequests: 'Aún no hay solicitudes', noRequestsDesc: 'Cuando otro miembro te envíe una solicitud, aparecerá aquí.', noSentRequests: 'No hay solicitudes enviadas pendientes', noSentRequestsDesc: 'Visita Encontrar Amigos para conectar con otros miembros.', findFriends: 'Encontrar Amigos', accept: 'Aceptar', reject: 'Rechazar', cancel: 'Cancelar', pending: 'Pendiente', unknownUser: 'Miembro de One2OneLove', accepted: 'Solicitud aceptada.', rejected: 'Solicitud rechazada.', cancelled: 'Solicitud cancelada.', errorLoading: 'No se pudieron cargar las solicitudes.', errorAccept: 'No se pudo aceptar la solicitud.', errorReject: 'No se pudo rechazar la solicitud.', errorCancel: 'No se pudo cancelar la solicitud.', signIn: 'Inicia sesión para gestionar solicitudes.', signInButton: 'Iniciar Sesión', privacy: 'Las solicitudes muestran solo información del perfil comunitario. No se muestra el correo de la cuenta ni información de facturación. El chat privado queda disponible después de aceptar una conexión.' },
  fr: { back: 'Retour', title: 'Demandes d’Amitié', subtitle: 'Gérez vos connexions entre membres One2OneLove.', received: 'Reçues', sent: 'Envoyées', loading: 'Chargement des demandes…', noRequests: 'Aucune demande pour le moment', noRequestsDesc: 'Lorsqu’un autre membre vous envoie une demande, elle apparaît ici.', noSentRequests: 'Aucune demande envoyée en attente', noSentRequestsDesc: 'Visitez Trouver des Amis pour vous connecter avec d’autres membres.', findFriends: 'Trouver des Amis', accept: 'Accepter', reject: 'Refuser', cancel: 'Annuler', pending: 'En attente', unknownUser: 'Membre One2OneLove', accepted: 'Demande acceptée.', rejected: 'Demande refusée.', cancelled: 'Demande annulée.', errorLoading: 'Les demandes ne peuvent pas être chargées actuellement.', errorAccept: 'La demande ne peut pas être acceptée.', errorReject: 'La demande ne peut pas être refusée.', errorCancel: 'La demande ne peut pas être annulée.', signIn: 'Connectez-vous pour gérer les demandes.', signInButton: 'Se Connecter', privacy: 'Les demandes affichent uniquement les informations du profil communautaire. L’e-mail du compte et les informations de facturation ne sont pas affichés. Le chat privé devient disponible après acceptation d’une connexion.' },
  it: { back: 'Indietro', title: 'Richieste di Amicizia', subtitle: 'Gestisci le connessioni tra membri One2OneLove.', received: 'Ricevute', sent: 'Inviate', loading: 'Caricamento richieste…', noRequests: 'Nessuna richiesta per ora', noRequestsDesc: 'Quando un altro membro ti invia una richiesta, apparirà qui.', noSentRequests: 'Nessuna richiesta inviata in sospeso', noSentRequestsDesc: 'Visita Trova Amici per connetterti con altri membri.', findFriends: 'Trova Amici', accept: 'Accetta', reject: 'Rifiuta', cancel: 'Annulla', pending: 'In attesa', unknownUser: 'Membro One2OneLove', accepted: 'Richiesta accettata.', rejected: 'Richiesta rifiutata.', cancelled: 'Richiesta annullata.', errorLoading: 'Le richieste non possono essere caricate in questo momento.', errorAccept: 'La richiesta non può essere accettata.', errorReject: 'La richiesta non può essere rifiutata.', errorCancel: 'La richiesta non può essere annullata.', signIn: 'Accedi per gestire le richieste.', signInButton: 'Accedi', privacy: 'Le richieste mostrano solo informazioni del profilo comunitario. Email dell’account e dati di fatturazione non vengono mostrati. La chat privata diventa disponibile dopo l’accettazione della connessione.' },
  de: { back: 'Zurück', title: 'Freundschaftsanfragen', subtitle: 'Verwalte deine One2OneLove-Verbindungen.', received: 'Erhalten', sent: 'Gesendet', loading: 'Anfragen werden geladen…', noRequests: 'Noch keine Anfragen', noRequestsDesc: 'Wenn ein anderes Mitglied dir eine Anfrage sendet, erscheint sie hier.', noSentRequests: 'Keine ausstehenden gesendeten Anfragen', noSentRequestsDesc: 'Besuche Freunde Finden, um dich mit anderen Mitgliedern zu verbinden.', findFriends: 'Freunde Finden', accept: 'Annehmen', reject: 'Ablehnen', cancel: 'Abbrechen', pending: 'Ausstehend', unknownUser: 'One2OneLove-Mitglied', accepted: 'Anfrage angenommen.', rejected: 'Anfrage abgelehnt.', cancelled: 'Anfrage abgebrochen.', errorLoading: 'Anfragen können derzeit nicht geladen werden.', errorAccept: 'Die Anfrage kann nicht angenommen werden.', errorReject: 'Die Anfrage kann nicht abgelehnt werden.', errorCancel: 'Die Anfrage kann nicht abgebrochen werden.', signIn: 'Bitte melde dich an, um Anfragen zu verwalten.', signInButton: 'Anmelden', privacy: 'Anfragen zeigen nur Community-Profilinformationen. Konto-E-Mail und Abrechnungsdaten werden nicht angezeigt. Privater Chat wird nach Annahme einer Verbindung verfügbar.' },
};

function ProfileSummary({ profile, unknownUser }) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <Avatar className="h-14 w-14 shrink-0"><AvatarImage src={profile?.avatar_url || undefined} alt="" /><AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">{profile?.name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback></Avatar>
      <div className="min-w-0"><h3 className="truncate font-semibold text-gray-900">{profile?.name || unknownUser}</h3>{profile?.location && <p className="truncate text-sm text-gray-500">{profile.location}</p>}{profile?.bio && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{profile.bio}</p>}</div>
    </div>
  );
}

export default function FriendRequests() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user?.id) { setLoading(false); return; }
      setLoading(true);
      try {
        const [received, sent] = await Promise.all([getReceivedBuddyRequests(user.id), getSentBuddyRequests(user.id)]);
        if (!active) return;
        setReceivedRequests(received);
        setSentRequests(sent);
      } catch {
        if (active) toast.error(t.errorLoading);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user?.id, t.errorLoading]);

  const handleAccept = async (requestId) => {
    try { await acceptBuddyRequest(requestId, user?.id); setReceivedRequests((items) => items.filter((item) => item.id !== requestId)); toast.success(t.accepted); }
    catch { toast.error(t.errorAccept); }
  };
  const handleReject = async (requestId) => {
    try { await rejectBuddyRequest(requestId, user?.id); setReceivedRequests((items) => items.filter((item) => item.id !== requestId)); toast.success(t.rejected); }
    catch { toast.error(t.errorReject); }
  };
  const handleCancel = async (requestId) => {
    try { await cancelBuddyRequest(requestId, user?.id); setSentRequests((items) => items.filter((item) => item.id !== requestId)); toast.success(t.cancelled); }
    catch { toast.error(t.errorCancel); }
  };

  if (!user?.id) {
    return <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-12"><Card className="mx-auto max-w-xl py-10 text-center"><CardContent><Users className="mx-auto mb-4 h-12 w-12 text-gray-300" aria-hidden="true" /><p className="text-gray-600">{t.signIn}</p><Button className="mt-5" onClick={() => navigate(createPageUrl('SignIn'))}>{t.signInButton}</Button></CardContent></Card></main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Community'))} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />{t.back}</Button>
        <header className="mb-8"><div className="mb-2 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"><Mail className="h-6 w-6 text-white" aria-hidden="true" /></div><h1 className="text-4xl font-bold text-gray-900">{t.title}</h1></div><p className="text-gray-600">{t.subtitle}</p><p className="mt-2 text-xs leading-5 text-gray-500">{t.privacy}</p></header>

        {loading ? <Card className="py-12 text-center"><CardContent><Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-purple-500" aria-hidden="true" /><p role="status" className="text-gray-600">{t.loading}</p></CardContent></Card> : (
          <Tabs defaultValue="received">
            <TabsList className="mb-6 grid w-full grid-cols-2"><TabsTrigger value="received"><Mail className="mr-2 h-4 w-4" aria-hidden="true" />{t.received} ({receivedRequests.length})</TabsTrigger><TabsTrigger value="sent"><Clock className="mr-2 h-4 w-4" aria-hidden="true" />{t.sent} ({sentRequests.length})</TabsTrigger></TabsList>
            <TabsContent value="received">
              {receivedRequests.length === 0 ? <Card className="py-12 text-center"><CardContent><Mail className="mx-auto mb-4 h-14 w-14 text-gray-300" aria-hidden="true" /><p className="text-lg text-gray-600">{t.noRequests}</p><p className="mt-2 text-sm text-gray-400">{t.noRequestsDesc}</p></CardContent></Card> : <div className="space-y-4">{receivedRequests.map((request) => <Card key={request.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><ProfileSummary profile={request.from_user} unknownUser={t.unknownUser} /><div className="flex shrink-0 gap-2"><Button onClick={() => handleAccept(request.id)}><UserCheck className="mr-2 h-4 w-4" aria-hidden="true" />{t.accept}</Button><Button variant="outline" onClick={() => handleReject(request.id)}><UserX className="mr-2 h-4 w-4" aria-hidden="true" />{t.reject}</Button></div></CardContent></Card>)}</div>}
            </TabsContent>
            <TabsContent value="sent">
              {sentRequests.length === 0 ? <Card className="py-12 text-center"><CardContent><CheckCircle className="mx-auto mb-4 h-14 w-14 text-gray-300" aria-hidden="true" /><p className="text-lg text-gray-600">{t.noSentRequests}</p><p className="mt-2 text-sm text-gray-400">{t.noSentRequestsDesc}</p><Button className="mt-5" onClick={() => navigate(createPageUrl('FindFriends'))}>{t.findFriends}</Button></CardContent></Card> : <div className="space-y-4">{sentRequests.map((request) => <Card key={request.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><ProfileSummary profile={request.to_user} unknownUser={t.unknownUser} /><div className="flex shrink-0 items-center gap-3"><Badge variant="secondary"><Clock className="mr-1 h-3 w-3" aria-hidden="true" />{t.pending}</Badge><Button variant="outline" onClick={() => handleCancel(request.id)}><X className="mr-2 h-4 w-4" aria-hidden="true" />{t.cancel}</Button></div></CardContent></Card>)}</div>}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
