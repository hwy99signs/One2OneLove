import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Heart, Loader2, MapPin, MessageCircle, Search, UserPlus, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { cancelBuddyRequest, getAllUsers, getSentBuddyRequests, sendBuddyRequest } from '@/lib/buddyService';
import { useLanguage } from '@/Layout';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };

const translations = {
  en: {
    title: 'Find Buddies', subtitle: 'Discover people in the One2OneLove community and send a buddy request when you would like to connect.', searchPlaceholder: 'Search by name, location, bio, or relationship status…', loading: 'Loading community profiles…', noResults: 'No matching community profiles found.', send: 'Send Request', cancel: 'Cancel Request', sent: 'Buddy request sent.', cancelled: 'Buddy request cancelled.', loadError: 'Community profiles could not be loaded right now.', requestError: 'The buddy request could not be sent right now.', cancelError: 'The buddy request could not be cancelled right now.', signIn: 'Please sign in to use buddy connections.', location: 'Location', relationship: 'Relationship status', memberSince: 'Member since', message: 'Message', back: 'Back to Community', privacy: 'Only profile information members choose to share for community discovery is shown here. Account email and billing information are not part of the buddy directory.' },
  es: {
    title: 'Encontrar Amigos', subtitle: 'Descubre personas de la comunidad One2OneLove y envía una solicitud cuando quieras conectar.', searchPlaceholder: 'Buscar por nombre, ubicación, biografía o estado de relación…', loading: 'Cargando perfiles de la comunidad…', noResults: 'No se encontraron perfiles que coincidan.', send: 'Enviar Solicitud', cancel: 'Cancelar Solicitud', sent: 'Solicitud enviada.', cancelled: 'Solicitud cancelada.', loadError: 'No se pudieron cargar los perfiles de la comunidad en este momento.', requestError: 'No se pudo enviar la solicitud en este momento.', cancelError: 'No se pudo cancelar la solicitud en este momento.', signIn: 'Inicia sesión para usar las conexiones de amistad.', location: 'Ubicación', relationship: 'Estado de relación', memberSince: 'Miembro desde', message: 'Mensaje', back: 'Volver a Comunidad', privacy: 'Aquí solo se muestra la información de perfil que los miembros comparten para descubrir la comunidad. El correo de la cuenta y la información de facturación no forman parte del directorio.' },
  fr: {
    title: 'Trouver des Amis', subtitle: 'Découvrez des personnes de la communauté One2OneLove et envoyez une demande lorsque vous souhaitez vous connecter.', searchPlaceholder: 'Rechercher par nom, lieu, bio ou statut relationnel…', loading: 'Chargement des profils de la communauté…', noResults: 'Aucun profil correspondant trouvé.', send: 'Envoyer une Demande', cancel: 'Annuler la Demande', sent: 'Demande envoyée.', cancelled: 'Demande annulée.', loadError: 'Les profils de la communauté ne peuvent pas être chargés actuellement.', requestError: 'La demande ne peut pas être envoyée actuellement.', cancelError: 'La demande ne peut pas être annulée actuellement.', signIn: 'Connectez-vous pour utiliser les connexions entre membres.', location: 'Lieu', relationship: 'Statut relationnel', memberSince: 'Membre depuis', message: 'Message', back: 'Retour à la Communauté', privacy: 'Seules les informations de profil que les membres choisissent de partager pour la découverte communautaire sont affichées ici. L’e-mail du compte et les informations de facturation ne font pas partie du répertoire.' },
  it: {
    title: 'Trova Amici', subtitle: 'Scopri persone nella comunità One2OneLove e invia una richiesta quando vuoi entrare in contatto.', searchPlaceholder: 'Cerca per nome, località, bio o stato della relazione…', loading: 'Caricamento profili della comunità…', noResults: 'Nessun profilo corrispondente trovato.', send: 'Invia Richiesta', cancel: 'Annulla Richiesta', sent: 'Richiesta inviata.', cancelled: 'Richiesta annullata.', loadError: 'I profili della comunità non possono essere caricati in questo momento.', requestError: 'La richiesta non può essere inviata in questo momento.', cancelError: 'La richiesta non può essere annullata in questo momento.', signIn: 'Accedi per usare le connessioni tra membri.', location: 'Località', relationship: 'Stato della relazione', memberSince: 'Membro dal', message: 'Messaggio', back: 'Torna alla Comunità', privacy: 'Qui vengono mostrate solo le informazioni di profilo che i membri scelgono di condividere per la scoperta della comunità. Email dell’account e dati di fatturazione non fanno parte della directory.' },
  de: {
    title: 'Freunde Finden', subtitle: 'Entdecke Menschen in der One2OneLove-Community und sende eine Anfrage, wenn du dich verbinden möchtest.', searchPlaceholder: 'Nach Name, Ort, Bio oder Beziehungsstatus suchen…', loading: 'Community-Profile werden geladen…', noResults: 'Keine passenden Community-Profile gefunden.', send: 'Anfrage Senden', cancel: 'Anfrage Abbrechen', sent: 'Freundschaftsanfrage gesendet.', cancelled: 'Freundschaftsanfrage abgebrochen.', loadError: 'Community-Profile können derzeit nicht geladen werden.', requestError: 'Die Anfrage kann derzeit nicht gesendet werden.', cancelError: 'Die Anfrage kann derzeit nicht abgebrochen werden.', signIn: 'Bitte melde dich an, um Freundschaftsverbindungen zu nutzen.', location: 'Ort', relationship: 'Beziehungsstatus', memberSince: 'Mitglied seit', message: 'Nachricht', back: 'Zurück zur Community', privacy: 'Hier werden nur Profilinformationen angezeigt, die Mitglieder für die Community-Suche freigeben. Konto-E-Mail und Abrechnungsdaten gehören nicht zum Verzeichnis.' },
};

export default function FindFriends() {
  const navigate = useNavigate();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const t = translations[currentLanguage] || translations.en;
  const locale = localeByLanguage[currentLanguage] || localeByLanguage.en;

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [usersData, sentRequestsData] = await Promise.all([
          getAllUsers(user.id, { limit: 100, sortBy: 'created_at', sortOrder: 'desc' }),
          getSentBuddyRequests(user.id),
        ]);
        if (!active) return;
        setUsers(usersData);
        setSentRequests(new Map(sentRequestsData.map((request) => [request.to_user_id, request.id])));
      } catch {
        if (active) toast.error(t.loadError);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [user?.id, t.loadError]);

  const filteredUsers = useMemo(() => {
    const needle = searchQuery.trim().toLocaleLowerCase(locale);
    if (!needle) return users;
    return users.filter((profile) => [profile.name, profile.location, profile.bio, profile.relationship_status]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase(locale).includes(needle)));
  }, [locale, searchQuery, users]);

  const handleSendRequest = async (toUserId) => {
    if (!user?.id) {
      toast.error(t.signIn);
      return;
    }
    try {
      const request = await sendBuddyRequest(user.id, toUserId);
      setSentRequests((previous) => new Map([...previous, [toUserId, request.id]]));
      toast.success(t.sent);
    } catch {
      toast.error(t.requestError);
    }
  };

  const handleCancelRequest = async (toUserId) => {
    const requestId = sentRequests.get(toUserId);
    if (!requestId || !user?.id) return;
    try {
      await cancelBuddyRequest(requestId, user.id);
      setSentRequests((previous) => {
        const next = new Map(previous);
        next.delete(toUserId);
        return next;
      });
      toast.success(t.cancelled);
    } catch {
      toast.error(t.cancelError);
    }
  };

  const formatMemberDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('Community'))} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />{t.back}
        </Button>

        <header className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg"><Users className="h-6 w-6 text-white" aria-hidden="true" /></div>
            <h1 className="text-4xl font-bold text-gray-900">{t.title}</h1>
          </div>
          <p className="mt-2 max-w-3xl text-gray-600">{t.subtitle}</p>
          <p className="mt-3 max-w-4xl text-xs leading-5 text-gray-500">{t.privacy}</p>
        </header>

        {!user?.id ? (
          <Card className="py-10 text-center"><CardContent><Users className="mx-auto mb-4 h-12 w-12 text-gray-300" aria-hidden="true" /><p className="text-gray-600">{t.signIn}</p><Button className="mt-5" onClick={() => navigate(createPageUrl('SignIn'))}>{t.signIn}</Button></CardContent></Card>
        ) : (
          <>
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input type="search" aria-label={t.searchPlaceholder} placeholder={t.searchPlaceholder} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="rounded-xl border-2 border-gray-200 py-6 pl-12 text-lg focus:border-purple-500" />
            </div>

            {loading ? (
              <Card className="py-12 text-center"><CardContent><Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-500" aria-hidden="true" /><p className="text-gray-600" role="status">{t.loading}</p></CardContent></Card>
            ) : filteredUsers.length === 0 ? (
              <Card className="py-12 text-center"><CardContent><Users className="mx-auto mb-4 h-16 w-16 text-gray-300" aria-hidden="true" /><p className="text-lg text-gray-600">{t.noResults}</p></CardContent></Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((profile) => {
                  const hasSentRequest = sentRequests.has(profile.id);
                  const avatarUrl = profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'O2OL')}`;
                  const initials = profile.name?.trim()?.charAt(0)?.toUpperCase() || '?';
                  return (
                    <Card key={profile.id} className="transition-shadow hover:shadow-xl">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-16 w-16"><AvatarImage src={avatarUrl} alt="" /><AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">{initials}</AvatarFallback></Avatar>
                          <CardTitle className="text-lg">{profile.name || 'One2OneLove Member'}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {profile.bio && <p className="mb-4 line-clamp-3 text-sm leading-6 text-gray-600">{profile.bio}</p>}
                        <div className="mb-4 space-y-2">
                          {profile.location && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="h-4 w-4" aria-hidden="true" /><span><span className="sr-only">{t.location}: </span>{profile.location}</span></div>}
                          {profile.relationship_status && <div className="flex items-center gap-2 text-sm text-gray-600"><Heart className="h-4 w-4" aria-hidden="true" /><span><span className="sr-only">{t.relationship}: </span>{profile.relationship_status}</span></div>}
                          {profile.created_at && <div className="flex items-center gap-2 text-sm text-gray-500"><Users className="h-4 w-4" aria-hidden="true" /><span>{t.memberSince} {formatMemberDate(profile.created_at)}</span></div>}
                        </div>
                        <div className="mt-4 flex gap-2">
                          {hasSentRequest ? (
                            <Button variant="outline" className="flex-1" onClick={() => handleCancelRequest(profile.id)}><X className="mr-2 h-4 w-4" aria-hidden="true" />{t.cancel}</Button>
                          ) : (
                            <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" onClick={() => handleSendRequest(profile.id)}><UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />{t.send}</Button>
                          )}
                          <Button variant="outline" aria-label={`${t.message}: ${profile.name || ''}`} onClick={() => navigate(`${createPageUrl('Chat')}?user=${profile.id}&name=${encodeURIComponent(profile.name || '')}`)}><MessageCircle className="h-4 w-4" aria-hidden="true" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
