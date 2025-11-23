import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Check, X, MessageCircle, Mail, MapPin, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BuddyCard({ buddy, onAccept, onDecline, showActions = false }) {
  // Handle both old format (user2_name) and new format (name) from Supabase
  const buddyName = buddy.name || buddy.user2_name || buddy.user1_name || 'Unknown';
  const buddyEmail = buddy.email;
  const buddyAvatar = buddy.avatar_url;
  const buddyLocation = buddy.location;
  const buddyBio = buddy.bio;
  const buddyRelationshipStatus = buddy.relationship_status;
  
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-2 border-purple-100">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 border-2 border-purple-300">
            <AvatarImage src={buddyAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
              {buddyName?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-gray-900">
              {buddyName}
            </CardTitle>
            {buddy.status === 'active' && (
              <Badge className="bg-green-100 text-green-800 mt-1">
                <Check className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
            {buddy.status === 'pending' && (
              <Badge className="bg-yellow-100 text-yellow-800 mt-1">
                Pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Email */}
        {buddyEmail && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-purple-500" />
            <span className="truncate">{buddyEmail}</span>
          </div>
        )}

        {/* Location */}
        {buddyLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span>{buddyLocation}</span>
          </div>
        )}

        {/* Relationship Status */}
        {buddyRelationshipStatus && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Heart className="w-4 h-4 text-purple-500" />
            <span className="capitalize">{buddyRelationshipStatus}</span>
          </div>
        )}

        {/* Bio */}
        {buddyBio && (
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 line-clamp-3">{buddyBio}</p>
          </div>
        )}

        {/* OLD FORMAT: Match Reason */}
        {buddy.match_reason && (
          <p className="text-sm text-gray-600">{buddy.match_reason}</p>
        )}
        
        {/* OLD FORMAT: Shared Interests */}
        {buddy.shared_interests && buddy.shared_interests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {buddy.shared_interests.map((interest, idx) => (
              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* OLD FORMAT: Accountability Goal */}
        {buddy.accountability_goal && (
          <div className="bg-pink-50 rounded-lg p-3">
            <p className="text-sm font-semibold text-pink-900 mb-1">Shared Goal:</p>
            <p className="text-sm text-pink-700">{buddy.accountability_goal}</p>
          </div>
        )}

        {/* Connected Since */}
        {buddy.connected_since && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
            Friends since {new Date(buddy.connected_since).toLocaleDateString()}
          </div>
        )}

        {/* Actions */}
        {showActions && buddy.status === 'pending' ? (
          <div className="flex gap-2 pt-2">
            <Button onClick={() => onAccept(buddy)} className="flex-1 bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button onClick={() => onDecline(buddy)} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
              <X className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </div>
        ) : (
          <Link to={`${createPageUrl("Chat")}?userId=${buddy.user_id || buddy.id}`}>
            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 mt-2">
              <MessageCircle className="w-4 h-4 mr-2" />
              Message {buddyName.split(' ')[0]}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}