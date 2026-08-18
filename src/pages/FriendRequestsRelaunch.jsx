import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, Loader2, UserPlus, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { acceptBuddyRequest, cancelBuddyRequest, getReceivedBuddyRequests, getSentBuddyRequests, rejectBuddyRequest } from '@/lib/buddyService';

const COPY = {
  en: { title: 'Connection Requests', subtitle: 'Accept, decline or cancel member connection requests. Account email is never shown here.', received: 'Received', sent: 'Sent', loading: 'Loading requests…', emptyReceived: 'No pending requests received.', emptySent: 'No pending requests sent.', find: 'Find Members', accept: 'Accept', decline: 'Decline', cancel: 'Cancel', pending: 'Pending', accepted: 'Connection accepted.', declined: 'Connection declined.', cancelled: 'Connection request canceled.', member: 'One2OneLove member', back: 'Back to Community' },
  es: { title: 'Solicitudes de Conexión', subtitle: 'Acepta, rechaza o cancela solicitudes entre miembros. El correo de la cuenta nunca se muestra aquí.', received: 'Recibidas', sent: 'Enviadas', loading: 'Cargando solicitudes…', emptyReceived: 'No hay solicitudes recibidas pendientes.', emptySent: 'No hay solicitudes enviadas pendientes.', find: 'Encontrar Miembros', accept: 'Aceptar', decline: 'Rechazar', cancel: 'Cancelar', pending: 'Pendiente', accepted: 'Conexión aceptada.', declined: 'Conexión rechazada.', cancelled: 'Solicitud cancelada.', member: 'Miembro de One2OneLove', back: 'Volver a Comunidad' },
  fr: { title: 'Demandes de Connexion', subtitle: 'Acceptez, refusez ou annulez les demandes entre membres. L’e-mail du compte n’est jamais affiché ici.', received: 'Reçues', sent: 'Envoyées', loading: 'Chargement des demandes…', emptyReceived: 'Aucune demande reçue en attente.', emptySent: 'Aucune demande envoyée en attente.', find: 'Trouver des Membres', accept: 'Accepter', decline: 'Refuser', cancel: 'Annuler', pending: 'En Attente', accepted: 'Connexion acceptée.', declined: 'Connexion refusée.', cancelled: 'Demande annulée.', member: 'Membre One2OneLove', back: 'Retour à la Communauté' },
  it: { title: 'Richieste di Connessione', subtitle: 'Accetta, rifiuta o annulla richieste tra membri. L’email dell’account non viene mai mostrata qui.', received: 'Ricevute', sent: 'Inviate', loading: 'Caricamento richieste…', emptyReceived: 'Nessuna richiesta ricevuta in sospeso.', emptySent: 'Nessuna richiesta inviata in sospeso.', find: 'Trova Membri', accept: 'Accetta', decline: 'Rifiuta', cancel: 'Annulla', pending: 'In Attesa', accepted: 'Connessione accettata.', declined: 'Connessione rifiutata.', cancelled: 'Richiesta annullata.', member: 'Membro One2OneLove', back: 'Torna alla Community' },
  de: { title: 'Verbindungsanfragen', subtitle: 'Anfragen zwischen Mitgliedern annehmen, ablehnen oder abbrechen. Konto-E-Mail wird hier nie angezeigt.', received: 'Erhalten', sent: 'Gesendet', loading: 'Anfragen werden geladen…', emptyReceived: 'Keine erhaltenen ausstehenden Anfragen.', emptySent: 'Keine gesendeten ausstehenden Anfragen.', find: 'Mitglieder Finden', accept: 'Annehmen', decline: 'Ablehnen', cancel: 'Abbrechen', pending: 'Ausstehend', accepted: 'Verbindung angenommen.', declined: 'Verbindung abgelehnt.', cancelled: 'Anfrage abgebrochen.', member: 'One2OneLove-Mitglied', back: 'Zurück zur Community' },
  nl: { title: 'Verbindingsverzoeken', subtitle: 'Accepteer, weiger of annuleer verzoeken tussen leden. Account-e-mail wordt hier nooit getoond.', received: 'Ontvangen', sent: 'Verzonden', loading: 'Verzoeken laden…', emptyReceived: 'Geen ontvangen verzoeken in behandeling.', emptySent: 'Geen verzonden verzoeken in behandeling.', find: 'Leden Vinden', accept: 'Accepteren', decline: 'Weigeren', cancel: 'Annuleren', pending: 'In Behandeling', accepted: 'Verbinding geaccepteerd.', declined: 'Verbinding geweigerd.', cancelled: 'Verzoek geannuleerd.', member: 'One2OneLove-lid', back: 'Terug naar Community' },
};

const RequestMember = ({ member, fallback }) => {
  const name = member?.name || fallback;
  const initial = String(name || '?').trim().slice(0, 1).toUpperCase() || '?';
  return <div className="flex min-w-0 items-center gap-3"><Avatar className="h-12 w-12">{member?.avatar_url ? <AvatarImage src={member.avatar_url} alt={name} /> : null}<AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">{initial}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-bold text-gray-900">{name}</p>{member?.bio ? <p className="line-clamp-1 text-sm text-gray-500">{member.bio}</p> : null}</div></div>;
};

export default function FriendRequestsRelaunch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(Boolean(user?.id));
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [incoming, outgoing] = await Promise.all([getReceivedBuddyRequests(user.id), getSentBuddyRequests(user.id)]);
      setReceived(incoming || []);
      setSent(outgoing || []);
    } catch (error) {
      console.error('Unable to load connection requests:', error);
      toast.error(error?.message || 'Unable to load connection requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user?.id]);

  const act = async (request, action) => {
    if (!user?.id) return;
    setBusyId(request.id);
    try {
      if (action === 'accept') {
        await acceptBuddyRequest(request.id, user.id);
        setReceived((items) => items.filter((item) => item.id !== request.id));
        toast.success(t.accepted);
      } else if (action === 'decline') {
        await rejectBuddyRequest(request.id, user.id);
        setReceived((items) => items.filter((item) => item.id !== request.id));
        toast.success(t.declined);
      } else {
        await cancelBuddyRequest(request.id, user.id);
        setSent((items) => items.filter((item) => item.id !== request.id));
        toast.success(t.cancelled);
      }
    } catch (error) {
      toast.error(error?.message || 'Unable to update this connection request.');
    } finally {
      setBusyId(null);
    }
  };

  if (!user?.id) {
    return <div className="min-h-[70vh] bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-16"><Card className="mx-auto max-w-lg"><CardContent className="p-8 text-center"><Users className="mx-auto h-12 w-12 text-purple-500" /><p className="mt-4 font-semibold text-gray-700">Sign in to manage connection requests.</p><Button className="mt-5" onClick={() => navigate('/SignIn?returnTo=%2FFriendRequests')}>Sign In</Button></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Button variant="ghost" onClick={() => navigate('/Community')}><ArrowLeft className="mr-2 h-4 w-4" />{t.back}</Button>
        <div className="mt-5 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white"><UserPlus className="h-6 w-6" /></div><div><h1 className="text-3xl font-black text-gray-900 sm:text-4xl">{t.title}</h1><p className="mt-1 text-gray-600">{t.subtitle}</p></div></div>

        {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-500" /><p className="mt-3 text-gray-600">{t.loading}</p></div> : (
          <Tabs defaultValue="received" className="mt-8">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="received">{t.received} ({received.length})</TabsTrigger><TabsTrigger value="sent">{t.sent} ({sent.length})</TabsTrigger></TabsList>
            <TabsContent value="received" className="mt-5 space-y-4">
              {!received.length ? <EmptyState text={t.emptyReceived} button={t.find} onClick={() => navigate('/FindFriends')} /> : received.map((request) => <Card key={request.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><RequestMember member={request.from_user} fallback={t.member} /><div className="flex gap-2"><Button variant="outline" disabled={busyId === request.id} onClick={() => act(request, 'decline')}><X className="mr-2 h-4 w-4" />{t.decline}</Button><Button disabled={busyId === request.id} onClick={() => act(request, 'accept')}>{busyId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}{t.accept}</Button></div></CardContent></Card>)}
            </TabsContent>
            <TabsContent value="sent" className="mt-5 space-y-4">
              {!sent.length ? <EmptyState text={t.emptySent} button={t.find} onClick={() => navigate('/FindFriends')} /> : sent.map((request) => <Card key={request.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><RequestMember member={request.to_user} fallback={t.member} /><div className="flex items-center gap-3"><Badge variant="secondary"><Clock3 className="mr-1 h-3.5 w-3.5" />{t.pending}</Badge><Button variant="outline" disabled={busyId === request.id} onClick={() => act(request, 'cancel')}>{busyId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}{t.cancel}</Button></div></CardContent></Card>)}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text, button, onClick }) {
  return <Card><CardContent className="p-10 text-center"><Users className="mx-auto h-12 w-12 text-gray-300" /><p className="mt-3 text-gray-600">{text}</p><Button variant="outline" className="mt-5" onClick={onClick}>{button}</Button></CardContent></Card>;
}
