import React, { useEffect, useState } from 'react';
import { Ban, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  MEMBER_BLOCKING_ENABLED,
  blockMember,
  listBlockedMemberIds,
  unblockMember,
} from '@/lib/memberBlockService';

const COPY = {
  en: { block: 'Block', unblock: 'Unblock', blocked: (name) => `${name || 'Member'} blocked.`, unblocked: (name) => `${name || 'Member'} unblocked.`, failed: 'Unable to update this block.' },
  es: { block: 'Bloquear', unblock: 'Desbloquear', blocked: (name) => `${name || 'Miembro'} bloqueado.`, unblocked: (name) => `${name || 'Miembro'} desbloqueado.`, failed: 'No se pudo actualizar el bloqueo.' },
  fr: { block: 'Bloquer', unblock: 'Débloquer', blocked: (name) => `${name || 'Membre'} bloqué.`, unblocked: (name) => `${name || 'Membre'} débloqué.`, failed: 'Impossible de mettre à jour ce blocage.' },
  it: { block: 'Blocca', unblock: 'Sblocca', blocked: (name) => `${name || 'Membro'} bloccato.`, unblocked: (name) => `${name || 'Membro'} sbloccato.`, failed: 'Impossibile aggiornare il blocco.' },
  de: { block: 'Blockieren', unblock: 'Entsperren', blocked: (name) => `${name || 'Mitglied'} blockiert.`, unblocked: (name) => `${name || 'Mitglied'} entsperrt.`, failed: 'Blockierung konnte nicht aktualisiert werden.' },
  nl: { block: 'Blokkeren', unblock: 'Deblokkeren', blocked: (name) => `${name || 'Lid'} geblokkeerd.`, unblocked: (name) => `${name || 'Lid'} gedeblokkeerd.`, failed: 'De blokkering kon niet worden bijgewerkt.' },
};

export default function MemberBlockButton({ memberId, memberName = '', variant = 'outline', onChange }) {
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [blocked, setBlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    setReady(false);
    if (!MEMBER_BLOCKING_ENABLED || !isAuthenticated || !user?.id || !memberId || memberId === user.id) return () => { mounted = false; };
    listBlockedMemberIds()
      .then((ids) => {
        if (!mounted) return;
        setBlocked(ids.includes(memberId));
        setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(false);
      });
    return () => { mounted = false; };
  }, [memberId, isAuthenticated, user?.id]);

  if (!MEMBER_BLOCKING_ENABLED || !isAuthenticated || !memberId || memberId === user?.id || !ready) return null;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (blocked) {
        await unblockMember(memberId);
        setBlocked(false);
        toast.success(t.unblocked(memberName));
        onChange?.(false);
      } else {
        await blockMember(memberId);
        setBlocked(true);
        toast.success(t.blocked(memberName));
        onChange?.(true);
      }
    } catch {
      toast.error(t.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button type="button" size="sm" variant={variant} disabled={busy} onClick={toggle} className={blocked ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}>
      {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : blocked ? <ShieldCheck className="mr-2 h-3.5 w-3.5" /> : <Ban className="mr-2 h-3.5 w-3.5" />}
      {blocked ? t.unblock : t.block}
    </Button>
  );
}
