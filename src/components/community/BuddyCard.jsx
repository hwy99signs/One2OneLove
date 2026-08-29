import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Heart, MapPin, MessageCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UserPresenceBadge } from "@/components/presence/UserPresenceIndicator";
import { useLanguage } from "@/Layout";

const locales = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' };
const translations = {
  en: { unknown: 'Member', connected: 'Connected', pending: 'Pending', since: 'Connected since', accept: 'Accept', decline: 'Decline', message: 'Message' },
  es: { unknown: 'Miembro', connected: 'Conectado', pending: 'Pendiente', since: 'Conectados desde', accept: 'Aceptar', decline: 'Rechazar', message: 'Mensaje' },
  fr: { unknown: 'Membre', connected: 'Connecté', pending: 'En attente', since: 'Connectés depuis', accept: 'Accepter', decline: 'Refuser', message: 'Message' },
  it: { unknown: 'Membro', connected: 'Connesso', pending: 'In attesa', since: 'Connessi dal', accept: 'Accetta', decline: 'Rifiuta', message: 'Messaggio' },
  de: { unknown: 'Mitglied', connected: 'Verbunden', pending: 'Ausstehend', since: 'Verbunden seit', accept: 'Annehmen', decline: 'Ablehnen', message: 'Nachricht' },
};

export default function BuddyCard({ buddy, onAccept, onDecline, showActions = false }) {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const locale = locales[currentLanguage] || locales.en;
  const buddyName = buddy.name || buddy.user2_name || buddy.user1_name || t.unknown;
  const buddyUserId = buddy.id || buddy.user_id || buddy.from_user_id || buddy.to_user_id;
  const connectedDate = buddy.connected_since ? new Date(buddy.connected_since) : null;
  const formattedDate = connectedDate && !Number.isNaN(connectedDate.getTime())
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(connectedDate)
    : null;

  return (
    <Card className="border-2 border-purple-100 transition-all duration-300 hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14 border-2 border-purple-300">
            <AvatarImage src={buddy.avatar_url || undefined} alt="" />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold text-white">{buddyName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-lg font-bold text-gray-900">{buddyName}</CardTitle>
            {buddyUserId && <div className="mt-1"><UserPresenceBadge userId={buddyUserId} showDot showText size="sm" /></div>}
            {buddy.status === 'active' && <Badge className="mt-1 bg-green-100 text-green-800"><Check className="mr-1 h-3 w-3" />{t.connected}</Badge>}
            {buddy.status === 'pending' && <Badge className="mt-1 bg-yellow-100 text-yellow-800">{t.pending}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {buddy.location && <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="h-4 w-4 text-purple-500" aria-hidden="true" /><span>{buddy.location}</span></div>}
        {buddy.relationship_status && <div className="flex items-center gap-2 text-sm text-gray-600"><Heart className="h-4 w-4 text-purple-500" aria-hidden="true" /><span>{buddy.relationship_status}</span></div>}
        {buddy.bio && <div className="rounded-lg bg-purple-50 p-3"><p className="line-clamp-3 text-sm text-gray-700">{buddy.bio}</p></div>}
        {formattedDate && <div className="border-t border-gray-100 pt-2 text-center text-xs text-gray-500">{t.since} {formattedDate}</div>}
        {showActions && buddy.status === 'pending' ? (
          <div className="flex gap-2 pt-2">
            <Button onClick={() => onAccept?.(buddy)} className="flex-1 bg-green-600 hover:bg-green-700"><Check className="mr-1 h-4 w-4" />{t.accept}</Button>
            <Button onClick={() => onDecline?.(buddy)} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50"><X className="mr-1 h-4 w-4" />{t.decline}</Button>
          </div>
        ) : buddyUserId ? (
          <Button asChild className="mt-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"><Link to={`${createPageUrl("Chat")}?userId=${buddyUserId}`}><MessageCircle className="mr-2 h-4 w-4" />{t.message} {buddyName.split(' ')[0]}</Link></Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
