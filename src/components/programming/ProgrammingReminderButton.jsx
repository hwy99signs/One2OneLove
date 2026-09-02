import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  PROGRAMMING_REMINDERS_ENABLED,
  cancelProgrammingReminder,
  getProgrammingReminderStatus,
  setProgrammingReminder,
} from '@/lib/programmingReminderService';

const COPY = {
  en: { add: 'Remind me', remove: 'Remove reminder', sending: 'Reminder sending', sent: 'Reminder sent', added: 'Programming reminder set.', removed: 'Programming reminder removed.', failed: 'Unable to update the reminder.' },
  es: { add: 'Recordarme', remove: 'Quitar recordatorio', sending: 'Enviando recordatorio', sent: 'Recordatorio enviado', added: 'Recordatorio de programación activado.', removed: 'Recordatorio eliminado.', failed: 'No se pudo actualizar el recordatorio.' },
  fr: { add: 'Me rappeler', remove: 'Supprimer le rappel', sending: 'Envoi du rappel', sent: 'Rappel envoyé', added: 'Rappel de programmation activé.', removed: 'Rappel supprimé.', failed: 'Impossible de mettre à jour le rappel.' },
  it: { add: 'Ricordamelo', remove: 'Rimuovi promemoria', sending: 'Invio promemoria', sent: 'Promemoria inviato', added: 'Promemoria della programmazione attivato.', removed: 'Promemoria rimosso.', failed: 'Impossibile aggiornare il promemoria.' },
  de: { add: 'Erinnere mich', remove: 'Erinnerung entfernen', sending: 'Erinnerung wird gesendet', sent: 'Erinnerung gesendet', added: 'Programmerinnerung aktiviert.', removed: 'Erinnerung entfernt.', failed: 'Erinnerung konnte nicht aktualisiert werden.' },
  nl: { add: 'Herinner mij', remove: 'Herinnering verwijderen', sending: 'Herinnering wordt verzonden', sent: 'Herinnering verzonden', added: 'Programmaherinnering ingesteld.', removed: 'Herinnering verwijderd.', failed: 'De herinnering kon niet worden bijgewerkt.' },
};

export default function ProgrammingReminderButton({ slot }) {
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [serverEnabled, setServerEnabled] = useState(false);
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(PROGRAMMING_REMINDERS_ENABLED);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    setReminder(null);

    if (!PROGRAMMING_REMINDERS_ENABLED || !isAuthenticated || !user?.id || !slot?.id) {
      setServerEnabled(false);
      setLoading(false);
      return () => { mounted = false; };
    }

    setLoading(true);
    getProgrammingReminderStatus(slot.id)
      .then((result) => {
        if (!mounted) return;
        setServerEnabled(Boolean(result?.enabled));
        setReminder(result?.reminder || null);
      })
      .catch(() => {
        if (!mounted) return;
        setServerEnabled(false);
        setReminder(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [slot?.id, isAuthenticated, user?.id]);

  if (!PROGRAMMING_REMINDERS_ENABLED || !isAuthenticated || !slot?.id) return null;
  if (new Date(slot.starts_at).getTime() <= Date.now()) return null;
  if (loading) return <Button type="button" size="sm" variant="outline" disabled><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{t.add}</Button>;
  if (!serverEnabled) return null;

  const active = reminder?.status === 'active';
  const processing = reminder?.status === 'processing';
  const sent = reminder?.status === 'sent';

  if (processing) {
    return <Button type="button" size="sm" variant="outline" disabled><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />{t.sending}</Button>;
  }

  if (sent) {
    return <Button type="button" size="sm" variant="outline" disabled><Check className="mr-2 h-3.5 w-3.5" />{t.sent}</Button>;
  }

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (active) {
        const updated = await cancelProgrammingReminder(slot.id);
        setReminder(updated || { status: 'cancelled', slot_id: slot.id });
        if (updated?.status === 'cancelled' || !updated) toast.success(t.removed);
      } else {
        const updated = await setProgrammingReminder(slot.id);
        setReminder(updated);
        if (updated?.status === 'active') toast.success(t.added);
      }
    } catch {
      toast.error(t.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" size="sm" variant="outline" onClick={toggle} disabled={busy} className={active ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : ''}>
      {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : active ? <BellOff className="mr-2 h-3.5 w-3.5" /> : <Bell className="mr-2 h-3.5 w-3.5" />}
      {active ? t.remove : t.add}
    </Button>
  );
}
