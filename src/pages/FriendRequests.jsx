import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserX, ArrowLeft, Users, Mail, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  getReceivedBuddyRequests,
  getSentBuddyRequests,
  acceptBuddyRequest,
  rejectBuddyRequest,
  cancelBuddyRequest,
} from '@/lib/buddyService';

const translations = {
  en: {
    back: "Back",
    title: "Friend Requests",
    subtitle: "Manage your beautiful friend connections",
    received: "Received",
    sent: "Sent",
    loading: "Loading requests...",
    noRequests: "No friend requests yet",
    noRequestsDesc: "When someone sends you a friend request, it will appear here with love",
    noSentRequests: "No pending sent requests",
    noSentRequestsDesc: "Visit Find Buddies to send friend requests and connect with others",
    findFriends: "Find Friends",
    accept: "Accept",
    reject: "Reject",
    cancel: "Cancel",
    pending: "Pending",
    unknownUser: "Unknown User",
    sentLabel: "Sent",
    justNow: "Just now",
    ago: "ago",
    accepted: "Friend request accepted! 🎉",
    rejected: "Friend request rejected",
    cancelled: "Friend request cancelled",
    errorLoading: "Failed to load friend requests. Please try again with love.",
    errorAccept: "Failed to accept request. Please try again.",
    errorReject: "Failed to reject request. Please try again.",
    errorCancel: "Failed to cancel request. Please try again."
  },
  es: {
    back: "Volver",
    title: "Solicitudes de Amistad",
    subtitle: "Gestiona tus hermosas conexiones de amistad",
    received: "Recibidas",
    sent: "Enviadas",
    loading: "Cargando solicitudes...",
    noRequests: "Aún no hay solicitudes de amistad",
    noRequestsDesc: "Cuando alguien te envíe una solicitud de amistad, aparecerá aquí con amor",
    noSentRequests: "No hay solicitudes enviadas pendientes",
    noSentRequestsDesc: "Visita Encontrar Compañeros para enviar solicitudes de amistad y conectar con otros",
    findFriends: "Encontrar Amigos",
    accept: "Aceptar",
    reject: "Rechazar",
    cancel: "Cancelar",
    pending: "Pendiente",
    unknownUser: "Usuario Desconocido",
    sentLabel: "Enviada",
    justNow: "Ahora mismo",
    ago: "hace",
    accepted: "¡Solicitud de amistad aceptada! 🎉",
    rejected: "Solicitud de amistad rechazada",
    cancelled: "Solicitud de amistad cancelada",
    errorLoading: "No se pudieron cargar las solicitudes de amistad. Por favor, inténtalo de nuevo con amor.",
    errorAccept: "No se pudo aceptar la solicitud. Por favor, inténtalo de nuevo.",
    errorReject: "No se pudo rechazar la solicitud. Por favor, inténtalo de nuevo.",
    errorCancel: "No se pudo cancelar la solicitud. Por favor, inténtalo de nuevo."
  },
  fr: {
    back: "Retour",
    title: "Demandes d'Amitié",
    subtitle: "Gérez vos belles connexions d'amitié",
    received: "Reçues",
    sent: "Envoyées",
    loading: "Chargement des demandes...",
    noRequests: "Pas encore de demandes d'amitié",
    noRequestsDesc: "Lorsque quelqu'un vous envoie une demande d'amitié, elle apparaîtra ici avec amour",
    noSentRequests: "Aucune demande envoyée en attente",
    noSentRequestsDesc: "Visitez Trouver des Compagnons pour envoyer des demandes d'amitié et vous connecter avec d'autres",
    findFriends: "Trouver des Amis",
    accept: "Accepter",
    reject: "Refuser",
    cancel: "Annuler",
    pending: "En Attente",
    unknownUser: "Utilisateur Inconnu",
    sentLabel: "Envoyée",
    justNow: "À l'instant",
    ago: "il y a",
    accepted: "Demande d'amitié acceptée ! 🎉",
    rejected: "Demande d'amitié refusée",
    cancelled: "Demande d'amitié annulée",
    errorLoading: "Échec du chargement des demandes d'amitié. Veuillez réessayer avec amour.",
    errorAccept: "Échec de l'acceptation de la demande. Veuillez réessayer.",
    errorReject: "Échec du refus de la demande. Veuillez réessayer.",
    errorCancel: "Échec de l'annulation de la demande. Veuillez réessayer."
  },
  it: {
    back: "Indietro",
    title: "Richieste di Amicizia",
    subtitle: "Gestisci le tue bellissime connessioni di amicizia",
    received: "Ricevute",
    sent: "Inviate",
    loading: "Caricamento richieste...",
    noRequests: "Nessuna richiesta di amicizia ancora",
    noRequestsDesc: "Quando qualcuno ti invia una richiesta di amicizia, apparirà qui con amore",
    noSentRequests: "Nessuna richiesta inviata in sospeso",
    noSentRequestsDesc: "Visita Trova Compagni per inviare richieste di amicizia e connetterti con altri",
    findFriends: "Trova Amici",
    accept: "Accetta",
    reject: "Rifiuta",
    cancel: "Annulla",
    pending: "In Attesa",
    unknownUser: "Utente Sconosciuto",
    sentLabel: "Inviata",
    justNow: "Proprio ora",
    ago: "fa",
    accepted: "Richiesta di amicizia accettata! 🎉",
    rejected: "Richiesta di amicizia rifiutata",
    cancelled: "Richiesta di amicizia annullata",
    errorLoading: "Impossibile caricare le richieste di amicizia. Per favore, riprova con amore.",
    errorAccept: "Impossibile accettare la richiesta. Per favore, riprova.",
    errorReject: "Impossibile rifiutare la richiesta. Per favore, riprova.",
    errorCancel: "Impossibile annullare la richiesta. Per favore, riprova."
  },
  de: {
    back: "Zurück",
    title: "Freundschaftsanfragen",
    subtitle: "Verwalte deine wunderschönen Freundschaftsverbindungen",
    received: "Erhalten",
    sent: "Gesendet",
    loading: "Anfragen werden geladen...",
    noRequests: "Noch keine Freundschaftsanfragen",
    noRequestsDesc: "Wenn dir jemand eine Freundschaftsanfrage sendet, erscheint sie hier mit Liebe",
    noSentRequests: "Keine ausstehenden gesendeten Anfragen",
    noSentRequestsDesc: "Besuche Freunde Finden, um Freundschaftsanfragen zu senden und dich mit anderen zu verbinden",
    findFriends: "Freunde Finden",
    accept: "Annehmen",
    reject: "Ablehnen",
    cancel: "Abbrechen",
    pending: "Ausstehend",
    unknownUser: "Unbekannter Benutzer",
    sentLabel: "Gesendet",
    justNow: "Gerade eben",
    ago: "vor",
    accepted: "Freundschaftsanfrage angenommen! 🎉",
    rejected: "Freundschaftsanfrage abgelehnt",
    cancelled: "Freundschaftsanfrage abgebrochen",
    errorLoading: "Freundschaftsanfragen konnten nicht geladen werden. Bitte versuche es mit Liebe erneut.",
    errorAccept: "Anfrage konnte nicht angenommen werden. Bitte versuche es erneut.",
    errorReject: "Anfrage konnte nicht abgelehnt werden. Bitte versuche es erneut.",
    errorCancel: "Anfrage konnte nicht abgebrochen werden. Bitte versuche es erneut."
  }
};

export default function FriendRequests() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');

  // Fetch requests on mount
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        console.log('Fetching friend requests for user:', user.id);
        const [received, sent] = await Promise.all([
          getReceivedBuddyRequests(user.id),
          getSentBuddyRequests(user.id),
        ]);
        
        console.log('Received requests:', received);
        console.log('Sent requests:', sent);
        
        setReceivedRequests(received);
        setSentRequests(sent);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast.error(error.message || t.errorLoading);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?.id]);

  const handleAccept = async (requestId) => {
    try {
      await acceptBuddyRequest(requestId, user.id);
      setReceivedRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success(t.accepted);
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error.message || t.errorAccept);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectBuddyRequest(requestId, user.id);
      setReceivedRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success(t.rejected);
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || t.errorReject);
    }
  };

  const handleCancelSent = async (requestId) => {
    try {
      await cancelBuddyRequest(requestId, user.id);
      setSentRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success(t.cancelled);
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(error.message || t.errorCancel);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.justNow;
    if (diffMins < 60) return `${diffMins}m ${t.ago}`;
    if (diffHours < 24) return `${diffHours}h ${t.ago}`;
    if (diffDays < 7) return `${diffDays}d ${t.ago}`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Community'))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.back}
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{t.title}</h1>
          </div>
          <p className="text-gray-600 mt-2">{t.subtitle}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t.received} ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t.sent} ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Received Requests Tab */}
          <TabsContent value="received">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">{t.loading}</p>
              </div>
            ) : receivedRequests.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">{t.noRequests}</p>
                  <p className="text-gray-400 mt-2">{t.noRequestsDesc}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {receivedRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={request.from_user?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                            {request.from_user?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.from_user?.name || t.unknownUser}
                          </h3>
                          <p className="text-sm text-gray-600">{request.from_user?.email}</p>
                          {request.from_user?.bio && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {request.from_user.bio}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDate(request.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleAccept(request.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {t.accept}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleReject(request.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            {t.reject}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent Requests Tab */}
          <TabsContent value="sent">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">{t.loading}</p>
              </div>
            ) : sentRequests.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent className="pt-6">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">{t.noSentRequests}</p>
                  <p className="text-gray-400 mt-2">{t.noSentRequestsDesc}</p>
                  <Button
                    onClick={() => navigate(createPageUrl('FindFriends'))}
                    className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t.findFriends}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={request.to_user?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                            {request.to_user?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.to_user?.name || t.unknownUser}
                          </h3>
                          <p className="text-sm text-gray-600">{request.to_user?.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {t.sentLabel} {formatDate(request.created_at)}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {t.pending}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => handleCancelSent(request.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          {t.cancel}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

