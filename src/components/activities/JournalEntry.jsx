import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Heart, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const moodEmojis = {
  happy: '😊',
  grateful: '🙏',
  reflective: '🤔',
  excited: '🎉',
  peaceful: '😌',
  challenged: '💪',
  loving: '❤️'
};

export default function JournalEntry({ entry, onEdit, onDelete, canEdit = true, isPartnerEntry = false, sharedByPartnerLabel = 'Shared by partner' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{moodEmojis[entry.mood]}</span>
                <CardTitle className="text-xl">{entry.title}</CardTitle>
                {entry.is_favorite && <Heart className="w-5 h-5 text-red-500 fill-red-500" />}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {format(new Date(entry.entry_date), 'MMMM d, yyyy')}
                {isPartnerEntry && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">
                    {sharedByPartnerLabel}
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap mb-4">{entry.content}</p>
          
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entry.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}