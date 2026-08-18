import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, Loader2, MapPin, MessageCircle, Search, UserCheck, UserPlus, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import { cancelBuddyRequest, getAllUsers, getMyBuddies, getSentBuddyRequests, sendBuddyRequest } from '@/lib/buddyService';

const COPY = {
  en: { title: 'Find Members', subtitle: 'Discover people in the One2OneLove member directory. Private Chat opens after a connection request is accepted.', search: 'Search name, location or profile…', loading: 'Loading members…', none: 'No matching members found.', signIn: 'Sign in to discover members.', request: 'Connect', pending: 'Request Pending', cancel: 'Cancel Request', connected: 'Connected', chat: 'Private Chat', sent: 'Connection request sent.', cancelled: 'Connection request canceled.', member: 'One2OneLove member', since: 'Member since', back: 'Back to Community', privacy: 'Member discovery uses the privacy-limited directory. Account email and billing information are not shown here.' },
  es: { title: 'Encontrar Miembros', subtitle: 'Descubre personas en el directorio de One2OneLove. El Chat Privado se abre después de aceptar una solicitud de conexión.', search: 'Buscar nombre, ubicación o perfil…', loading: 'Cargando miembros…', none: 'No se encontraron miembros.', signIn: 'Inicia sesión para descubrir miembros.', request: 'Conectar', pending: 'Solicitud Pendiente', cancel: 'Cancelar Solicitud', connected: 'Conectado', chat: 'Chat Privado', sent: 'Solicitud de conexión enviada.', cancelled: 'Solicitud de conexión cancelada.', member: 'Miembro de One2OneLove', since: 'Miembro desde', back: 'Volver a Comunidad', privacy: 'El descubrimiento usa un directorio limitado para privacidad. Aquí no se muestran correo de cuenta ni datos de facturación.' },
  fr: { title: 'Trouver des Membres', subtitle: 'Découvrez des personnes dans l’annuaire One2OneLove. Le Chat Privé s’ouvre après acceptation d’une demande de connexion.', search: 'Rechercher nom, lieu ou profil…', loading: 'Chargement des membres…', none: 'Aucun membre correspondant.', signIn: 'Connectez-vous pour découvrir les membres.', request: 'Se Connecter', pending: 'Demande en Attente', cancel: 'Annuler la Demande', connected: 'Connecté', chat: 'Chat Privé', sent: 'Demande de connexion envoyée.', cancelled: 'Demande de connexion annulée.', member: 'Membre One2OneLove', since: 'Membre depuis', back: 'Retour à la Communauté', privacy: 'La découverte utilise un annuaire limité pour la confidentialité. L’e-mail du compte et les données de facturation ne sont pas affichés.' },
  it: { title: 'Trova Membri', subtitle: 'Scopri persone nella directory One2OneLove. Il Chat Privato si apre dopo l’accettazione di una richiesta di connessione.', search: 'Cerca nome, località o profilo…', loading: 'Caricamento membri…', none: 'Nessun membro corrispondente.', signIn: 'Accedi per scoprire i membri.', request: 'Connetti', pending: 'Richiesta in Attesa', cancel: 'Annulla Richiesta', connected: 'Connesso', chat: 'Chat Privata', sent: 'Richiesta di connessione inviata.', cancelled: 'Richiesta di connessione annullata.', member: 'Membro One2OneLove', since: 'Membro dal', back: 'Torna alla Community', privacy: 'La scoperta usa una directory limitata per la privacy. Email account e dati di fatturazione non vengono mostrati.' },
  de: { title: 'Mitglieder Finden', subtitle: 'Entdecken Sie Menschen im One2OneLove-Mitgliederverzeichnis. Privater Chat öffnet sich nach Annahme einer Verbindungsanfrage.', search: 'Name, Ort oder Profil suchen…', loading: 'Mitglieder werden geladen…', none: 'Keine passenden Mitglieder gefunden.', signIn: 'Melden Sie sich an, um Mitglieder zu entdecken.', request: 'Verbinden', pending: 'Anfrage Ausstehend', cancel: 'Anfrage Abbrechen', connected: 'Verbunden', chat: 'Privater Chat', sent: 'Verbindungsanfrage gesendet.', cancelled: 'Verbindungsanfrage abgebrochen.', member: 'One2OneLove-Mitglied', since: 'Mitglied seit', back: 'Zurück zur Community', privacy: 'Die Mitgliedersuche nutzt ein datenschutzbegrenztes Verzeichnis. Konto-E-Mail und Abrechnungsdaten werden hier nicht angezeigt.' },
  nl: { title: 'Leden Vinden', subtitle: 'Ontdek mensen in de One2OneLove-ledendirectory. Privéchat opent nadat een verbindingsverzoek is geaccepteerd.', search: 'Zoek naam, locatie of profiel…', loading: 'Leden laden…', none: 'Geen passende leden gevonden.', signIn: 'Log in om leden te ontdekken.', request: 'Verbinden', pending: 'Verzoek in Behandeling', cancel: 'Verzoek Annuleren', connected: 'Verbonden', chat: 'Privéchat', sent: 'Verbindingsverzoek verzonden.', cancelled: 'Verbindingsverzoek geannuleerd.', member: 'One2OneLove-lid', since: 'Lid sinds', back: 'Terug naar Community', privacy: 'Leden ontdekken gebruikt een privacybeperkte directory. Account-e-mail en factureringsgegevens worden hier niet getoond.' },
};

export default function FindFriendsRelaunch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [members, setMembers] = useState([]);
  const [pendingByMember, setPendingByMember] = useState(new Map());
  const [connectedIds, setConnectedIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(Boolean(user?.id));
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [directory, sent, buddies] = await Promise.all([
        getAllUsers(user.id, { limit: 100, sortBy: 'name', sortOrder: 'asc' }),
        getSentBuddyRequests(user.id),
        getMyBuddies(user.id),
      ]);
      setMembers(directory || []);
      setPendingByMember(new Map((sent || []).map((request) => [request.to_user_id, request.id])));
      setConnectedIds(new Set((buddies || []).map((buddy) => buddy.id)));
    } catch (error) {
      console.error('Unable to load member discovery:', error);
      toast.error(error?.message || 'Unable to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [user?.id]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) => [member.name, member.location, member.bio, member.relationship_status]
      .some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [members, query]);

  const sendRequest = async (memberId) => {
    if (!user?.id) return;
    setBusyId(memberId);
    try {
      const request = await sendBuddyRequest(user.id, memberId);
      setPendingByMember((current) => new Map(current).set(memberId, request.id));
      toast.success(t.sent);
    } catch (error) {
      toast.error(error?.message || 'Unable to send connection request.');
    } finally {
      setBusyId(null);
    }
  };

  const cancelRequest = async (memberId) => {
    const requestId = pendingByMember.get(memberId);
    if (!requestId || !user?.id) return;
    setBusyId(memberId);
    try {
      await cancelBuddyRequest(requestId, user.id);
      setPendingByMember((current) => {
        const next = new Map(current);
        next.delete(memberId);
        return next;
      });
      toast.success(t.cancelled);
    } catch (error) {
      toast.error(error?.message || 'Unable to cancel request.');
    } finally {
      setBusyId(null);
    }
  };

  if (!user?.id) {
    return <div className="min-h-[70vh] bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-16"><Card className="mx-auto max-w-lg"><CardContent className="p-8 text-center"><Users className="mx-auto h-12 w-12 text-purple-500" /><p className="mt-4 font-semibold text-gray-700">{t.signIn}</p><Button className="mt-5" onClick={() => navigate('/SignIn?returnTo=%2FFindFriends')}>Sign In</Button></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/Community')}><ArrowLeft className="mr-2 h-4 w-4" />{t.back}</Button>
        <div className="mt-5 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white"><Users className="h-6 w-6" /></div><div><h1 className="text-3xl font-black text-gray-900 sm:text-4xl">{t.title}</h1><p className="mt-1 text-gray-600">{t.subtitle}</p></div></div>
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{t.privacy}</div>
        <div className="relative mt-7"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} className="h-12 pl-12" /></div>

        {loading ? <div className="py-16 text-center text-gray-600"><Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-purple-500" />{t.loading}</div> : !visible.length ? <p className="py-16 text-center text-gray-500">{t.none}</p> : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((member) => {
              const connected = connectedIds.has(member.id);
              const pendingRequestId = pendingByMember.get(member.id);
              const busy = busyId === member.id;
              const initials = String(member.name || '?').trim().slice(0, 1).toUpperCase() || '?';
              return (
                <Card key={member.id} className="border-gray-200 shadow-sm">
                  <CardHeader><div className="flex items-center gap-3"><Avatar className="h-14 w-14">{member.avatar_url ? <AvatarImage src={member.avatar_url} alt={member.name || t.member} /> : null}<AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">{initials}</AvatarFallback></Avatar><div><CardTitle className="text-lg">{member.name || t.member}</CardTitle><p className="text-xs text-gray-500">{connected ? t.connected : t.member}</p></div></div></CardHeader>
                  <CardContent>
                    {member.bio ? <p className="line-clamp-3 min-h-12 text-sm leading-6 text-gray-600">{member.bio}</p> : <div className="min-h-12" />}
                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      {member.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{member.location}</div>}
                      {member.relationship_status && <div className="flex items-center gap-2"><Heart className="h-4 w-4" /><span className="capitalize">{member.relationship_status}</span></div>}
                      {member.created_at && <div className="flex items-center gap-2"><Users className="h-4 w-4" />{t.since} {new Date(member.created_at).toLocaleDateString()}</div>}
                    </div>
                    <div className="mt-5">
                      {connected ? <Button className="w-full" onClick={() => navigate(`/Chat?userId=${encodeURIComponent(member.id)}`)}><MessageCircle className="mr-2 h-4 w-4" />{t.chat}</Button> : pendingRequestId ? <Button variant="outline" disabled={busy} className="w-full" onClick={() => cancelRequest(member.id)}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}{t.cancel}</Button> : <Button disabled={busy} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white" onClick={() => sendRequest(member.id)}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}{t.request}</Button>}
                      {connected && <div className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-green-700"><UserCheck className="h-3.5 w-3.5" />{t.connected}</div>}
                      {!connected && pendingRequestId && <div className="mt-2 text-center text-xs font-semibold text-amber-700">{t.pending}</div>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
