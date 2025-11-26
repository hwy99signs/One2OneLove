import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Trash2, CheckCircle, XCircle, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/Layout";
import { toast } from "sonner";
import { format } from "date-fns";

const translations = {
  en: {
    title: "Scheduled Love Notes",
    subtitle: "Your upcoming love notes ready to be sent",
    noScheduled: "No scheduled notes yet",
    noScheduledDesc: "Schedule a love note to surprise your partner at the perfect time!",
    cancel: "Cancel",
    scheduled: "Scheduled",
    sent: "Sent",
    failed: "Failed",
    cancelled: "Cancelled",
    noteCancelled: "Scheduled note cancelled",
    errorCancelling: "Error cancelling note",
    sendAt: "Send at",
    via: "via",
    methods: {
      sms: "Text Message",
      email: "Email",
      whatsapp: "WhatsApp"
    }
  },
  es: {
    title: "Notas de Amor Programadas",
    subtitle: "Tus próximas notas de amor listas para ser enviadas",
    noScheduled: "Aún no hay notas programadas",
    noScheduledDesc: "¡Programa una nota de amor para sorprender a tu pareja en el momento perfecto!",
    cancel: "Cancelar",
    scheduled: "Programado",
    sent: "Enviado",
    failed: "Fallido",
    cancelled: "Cancelado",
    noteCancelled: "Nota programada cancelada",
    errorCancelling: "Error al cancelar nota",
    sendAt: "Enviar a las",
    via: "vía",
    methods: {
      sms: "Mensaje de Texto",
      email: "Correo Electrónico",
      whatsapp: "WhatsApp"
    }
  },
  fr: {
    title: "Notes d'Amour Programmées",
    subtitle: "Vos prochaines notes d'amour prêtes à être envoyées",
    noScheduled: "Pas encore de notes programmées",
    noScheduledDesc: "Programmez une note d'amour pour surprendre votre partenaire au moment parfait!",
    cancel: "Annuler",
    scheduled: "Programmé",
    sent: "Envoyé",
    failed: "Échoué",
    cancelled: "Annulé",
    noteCancelled: "Note programmée annulée",
    errorCancelling: "Erreur lors de l'annulation de la note",
    sendAt: "Envoyer à",
    via: "par",
    methods: {
      sms: "Message Texte",
      email: "E-mail",
      whatsapp: "WhatsApp"
    }
  },
  it: {
    title: "Note d'Amore Programmate",
    subtitle: "Le tue prossime note d'amore pronte per essere inviate",
    noScheduled: "Nessuna nota programmata ancora",
    noScheduledDesc: "Programma una nota d'amore per sorprendere il tuo partner al momento perfetto!",
    cancel: "Annulla",
    scheduled: "Programmato",
    sent: "Inviato",
    failed: "Fallito",
    cancelled: "Annullato",
    noteCancelled: "Nota programmata annullata",
    errorCancelling: "Errore nell'annullamento della nota",
    sendAt: "Invia alle",
    via: "tramite",
    methods: {
      sms: "Messaggio di Testo",
      email: "Email",
      whatsapp: "WhatsApp"
    }
  },
  de: {
    title: "Geplante Liebesbotschaften",
    subtitle: "Deine bevorstehenden Liebesbotschaften bereit zum Versand",
    noScheduled: "Noch keine geplanten Botschaften",
    noScheduledDesc: "Plane eine Liebesbotschaft, um deinen Partner zum perfekten Zeitpunkt zu überraschen!",
    cancel: "Abbrechen",
    scheduled: "Geplant",
    sent: "Gesendet",
    failed: "Fehlgeschlagen",
    cancelled: "Abgebrochen",
    noteCancelled: "Geplante Botschaft abgebrochen",
    errorCancelling: "Fehler beim Abbrechen der Botschaft",
    sendAt: "Senden um",
    via: "über",
    methods: {
      sms: "SMS",
      email: "E-Mail",
      whatsapp: "WhatsApp"
    }
  }
};

export default function ScheduledNotesManager() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: scheduledNotes = [] } = useQuery({
    queryKey: ['scheduledNotes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('scheduled_love_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true });
      if (error) {
        console.error('Error fetching scheduled notes:', error);
        return [];
      }
      return data || [];
    },
    initialData: [],
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('scheduled_love_notes')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledNotes'] });
      toast.success(t.noteCancelled);
    },
    onError: () => {
      toast.error(t.errorCancelling);
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: t.scheduled, icon: Clock },
      sent: { bg: 'bg-green-100', text: 'text-green-700', label: t.sent, icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: t.failed, icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: t.cancelled, icon: XCircle }
    };
    return badges[status] || badges.scheduled;
  };

  if (scheduledNotes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
        <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.noScheduled}</h3>
        <p className="text-gray-500">{t.noScheduledDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h2>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <AnimatePresence>
        {scheduledNotes.map((note, index) => {
          const statusBadge = getStatusBadge(note.status);
          const StatusIcon = statusBadge.icon;

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{note.note_title}</CardTitle>
                      <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(note.scheduled_date), 'PPP')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {note.scheduled_time}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                    {note.status === 'scheduled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelMutation.mutate(note.id)}
                        disabled={cancelMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3 italic">"{note.note_content}"</p>
                  <div className="text-sm text-gray-500">
                    {t.via} {t.methods[note.delivery_method]} → {note.recipient_phone || note.recipient_email}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}