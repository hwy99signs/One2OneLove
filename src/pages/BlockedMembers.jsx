import React, { useEffect, useState } from 'react';
import { Ban, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  MEMBER_BLOCKING_ENABLED,
  listBlockedMembers,
  unblockMember,
} from '@/lib/memberBlockService';

const COPY = {
  en: { title: 'Blocked members', intro: 'Manage the people you chose to block. Your block list is private.', disabled: 'Member blocking is staged, not live yet.', signIn: 'Sign in to manage blocked members.', empty: 'You have not blocked anyone.', blockedOn: 'Blocked', unblock: 'Unblock', failed: 'Unable to update blocked members.' },
  es: { title: 'Miembros bloqueados', intro: 'Administra a las personas que elegiste bloquear. Tu lista es privada.', disabled: 'El bloqueo de miembros está preparado, pero aún no está activo.', signIn: 'Inicia sesión para administrar miembros bloqueados.', empty: 'No has bloqueado a nadie.', blockedOn: 'Bloqueado', unblock: 'Desbloquear', failed: 'No se pudo actualizar la lista.' },
  fr: { title: 'Membres bloqués', intro: 'Gérez les personnes que vous avez choisi de bloquer. Votre liste est privée.', disabled: 'Le blocage des membres est préparé, mais pas encore actif.', signIn: 'Connectez-vous pour gérer les membres bloqués.', empty: 'Vous n’avez bloqué personne.', blockedOn: 'Bloqué', unblock: 'Débloquer', failed: 'Impossible de mettre à jour la liste.' },
  it: { title: 'Membri bloccati', intro: 'Gestisci le persone che hai scelto di bloccare. La tua lista è privata.', disabled: 'Il blocco dei membri è predisposto, ma non è ancora attivo.', signIn: 'Accedi per gestire i membri bloccati.', empty: 'Non hai bloccato nessuno.', blockedOn: 'Bloccato', unblock: 'Sblocca', failed: 'Impossibile aggiornare la lista.' },
  de: { title: 'Blockierte Mitglieder', intro: 'Verwalte Personen, die du blockiert hast. Deine Blockliste ist privat.', disabled: 'Mitgliederblockierung ist vorbereitet, aber noch nicht aktiv.', signIn: 'Melde dich an, um blockierte Mitglieder zu verwalten.', empty: 'Du hast niemanden blockiert.', blockedOn: 'Blockiert', unblock: 'Entsperren', failed: 'Blockliste konnte nicht aktualisiert werden.' },
  nl: { title: 'Geblokkeerde leden', intro: 'Beheer mensen die je hebt geblokkeerd. Je blokkeerlijst is privé.', disabled: 'Leden blokkeren is voorbereid, maar nog niet actief.', signIn: 'Log in om geblokkeerde leden te beheren.', empty: 'Je hebt niemand geblokkeerd.', blockedOn: 'Geblokkeerd', unblock: 'Deblokkeren', failed: 'De blokkeerlijst kon niet worden bijgewerkt.' },
};

const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL' };

export default function BlockedMembers() {
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const locale = localeByLanguage[language] || 'en-US';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(MEMBER_BLOCKING_ENABLED && isAuthenticated);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    if (!MEMBER_BLOCKING_ENABLED || !isAuthenticated || !user?.id) return;
    setLoading(true);
    try {
      setMembers(await listBlockedMembers());
    } catch {
      toast.error(t.failed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [isAuthenticated, user?.id]);

  const unblock = async (memberId) => {
    setBusyId(memberId);
    try {
      await unblockMember(memberId);
      setMembers((current) => current.filter((member) => member.id !== memberId));
    } catch {
      toast.error(t.failed);
    } finally {
      setBusyId('');
    }
  };

  if (!MEMBER_BLOCKING_ENABLED) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-slate-500" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.disabled}</h1></div></main>;
  }

  if (!isAuthenticated) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><Ban className="mx-auto h-10 w-10 text-rose-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.signIn}</h1></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-[2rem] bg-slate-950 p-7 text-white sm:p-9"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-rose-300"><Ban className="h-4 w-4" />One2OneLove</div><h1 className="mt-3 text-4xl font-black">{t.title}</h1><p className="mt-4 max-w-2xl leading-7 text-slate-300">{t.intro}</p></div>

        <div className="mt-7">
          {loading ? <div className="flex justify-center rounded-[2rem] bg-white py-16 text-slate-500 shadow-sm"><Loader2 className="mr-3 h-5 w-5 animate-spin" /></div> : members.length ? <div className="space-y-3">{members.map((member) => <article key={member.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div><div className="text-lg font-black text-slate-950">{member.name || 'Member'}</div><div className="mt-1 text-xs font-bold text-slate-400">{t.blockedOn}: {new Date(member.blocked_at).toLocaleString(locale)}</div></div><Button variant="outline" disabled={busyId === member.id} onClick={() => unblock(member.id)}>{busyId === member.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}{t.unblock}</Button></article>)}</div> : <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">{t.empty}</div>}
        </div>
      </div>
    </main>
  );
}
