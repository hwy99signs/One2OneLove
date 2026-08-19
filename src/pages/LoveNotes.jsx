import React, { useMemo, useState } from "react";
import { Heart, Inbox, Loader2, Send, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/Layout";
import LoveNoteCard from "../components/love-notes/LoveNoteCard";
import { getMutualPartnerDirectoryProfile } from "@/lib/coupleProfileService";
import {
  deleteSentLoveNote,
  getMyLoveNotes,
  markLoveNoteRead,
  sendLoveNoteToMutualPartner,
} from "@/lib/loveNotesService";

const translations = {
  en: {
    title: "Love Notes",
    subtitle: "Write something meaningful and deliver it privately to your mutually linked partner.",
    signIn: "Sign in to send and receive private Love Notes.",
    signInButton: "Sign In",
    compose: "Write a Love Note",
    placeholder: "Tell your partner what you appreciate, remember, hope for, or simply want them to know...",
    send: "Send to Partner",
    sending: "Sending...",
    partner: "Connected partner",
    noPartner: "Love Notes delivery becomes available after both partners link their accounts to each other.",
    privacy: "Love Notes are delivered only to your mutually linked partner. You cannot address another member by email or search private account data from this page.",
    sentSuccess: "Love Note delivered privately.",
    sendError: "We could not deliver that Love Note.",
    tooLong: "Keep your Love Note between 1 and 5,000 characters.",
    notes: "Your Love Notes",
    all: "All",
    sent: "Sent",
    received: "Received",
    unread: "Unread",
    empty: "No Love Notes match this view yet.",
    loading: "Loading Love Notes...",
    readError: "We could not update that Love Note.",
    deleted: "Sent Love Note deleted.",
    deleteError: "We could not delete that Love Note.",
    deleteConfirm: "Delete this sent Love Note?",
    refresh: "Refresh",
  },
  es: {
    title: "Notas de Amor",
    subtitle: "Escribe algo significativo y entrégalo en privado a tu pareja vinculada mutuamente.",
    signIn: "Inicia sesión para enviar y recibir Notas de Amor privadas.",
    signInButton: "Iniciar Sesión",
    compose: "Escribe una Nota de Amor",
    placeholder: "Dile a tu pareja lo que aprecias, recuerdas, esperas o simplemente quieres que sepa...",
    send: "Enviar a tu Pareja",
    sending: "Enviando...",
    partner: "Pareja conectada",
    noPartner: "La entrega de Notas de Amor estará disponible cuando ambos vinculen sus cuentas entre sí.",
    privacy: "Las Notas de Amor se entregan únicamente a tu pareja vinculada mutuamente. No puedes dirigirlas a otro miembro por correo electrónico ni buscar datos privados de cuentas desde esta página.",
    sentSuccess: "Nota de Amor entregada en privado.",
    sendError: "No pudimos entregar esa Nota de Amor.",
    tooLong: "Mantén tu Nota de Amor entre 1 y 5.000 caracteres.",
    notes: "Tus Notas de Amor",
    all: "Todas",
    sent: "Enviadas",
    received: "Recibidas",
    unread: "No leídas",
    empty: "Aún no hay Notas de Amor en esta vista.",
    loading: "Cargando Notas de Amor...",
    readError: "No pudimos actualizar esa Nota de Amor.",
    deleted: "Nota de Amor enviada eliminada.",
    deleteError: "No pudimos eliminar esa Nota de Amor.",
    deleteConfirm: "¿Eliminar esta Nota de Amor enviada?",
    refresh: "Actualizar",
  },
  fr: {
    title: "Notes d’Amour",
    subtitle: "Écrivez quelque chose de sincère et envoyez-le en privé à votre partenaire lié réciproquement.",
    signIn: "Connectez-vous pour envoyer et recevoir des Notes d’Amour privées.",
    signInButton: "Se Connecter",
    compose: "Écrire une Note d’Amour",
    placeholder: "Dites à votre partenaire ce que vous appréciez, ce dont vous vous souvenez, ce que vous espérez ou simplement ce que vous voulez lui dire...",
    send: "Envoyer au Partenaire",
    sending: "Envoi...",
    partner: "Partenaire connecté",
    noPartner: "L’envoi de Notes d’Amour devient disponible lorsque les deux partenaires relient mutuellement leurs comptes.",
    privacy: "Les Notes d’Amour sont envoyées uniquement à votre partenaire lié réciproquement. Vous ne pouvez pas choisir un autre membre par e-mail ni rechercher des données de compte privées depuis cette page.",
    sentSuccess: "Note d’Amour envoyée en privé.",
    sendError: "Nous n’avons pas pu envoyer cette Note d’Amour.",
    tooLong: "Gardez votre Note d’Amour entre 1 et 5 000 caractères.",
    notes: "Vos Notes d’Amour",
    all: "Toutes",
    sent: "Envoyées",
    received: "Reçues",
    unread: "Non lues",
    empty: "Aucune Note d’Amour ne correspond encore à cette vue.",
    loading: "Chargement des Notes d’Amour...",
    readError: "Nous n’avons pas pu mettre à jour cette Note d’Amour.",
    deleted: "Note d’Amour envoyée supprimée.",
    deleteError: "Nous n’avons pas pu supprimer cette Note d’Amour.",
    deleteConfirm: "Supprimer cette Note d’Amour envoyée ?",
    refresh: "Actualiser",
  },
  it: {
    title: "Note d’Amore",
    subtitle: "Scrivi qualcosa di significativo e consegnalo in privato al partner collegato reciprocamente.",
    signIn: "Accedi per inviare e ricevere Note d’Amore private.",
    signInButton: "Accedi",
    compose: "Scrivi una Nota d’Amore",
    placeholder: "Di’ al tuo partner cosa apprezzi, ricordi, speri o semplicemente cosa vuoi che sappia...",
    send: "Invia al Partner",
    sending: "Invio...",
    partner: "Partner collegato",
    noPartner: "La consegna delle Note d’Amore diventa disponibile quando entrambi i partner collegano reciprocamente i propri account.",
    privacy: "Le Note d’Amore vengono consegnate solo al partner collegato reciprocamente. Da questa pagina non puoi indirizzarle a un altro membro via e-mail né cercare dati privati dell’account.",
    sentSuccess: "Nota d’Amore consegnata in privato.",
    sendError: "Non è stato possibile consegnare questa Nota d’Amore.",
    tooLong: "Mantieni la Nota d’Amore tra 1 e 5.000 caratteri.",
    notes: "Le Tue Note d’Amore",
    all: "Tutte",
    sent: "Inviate",
    received: "Ricevute",
    unread: "Non lette",
    empty: "Nessuna Nota d’Amore corrisponde ancora a questa vista.",
    loading: "Caricamento Note d’Amore...",
    readError: "Non è stato possibile aggiornare questa Nota d’Amore.",
    deleted: "Nota d’Amore inviata eliminata.",
    deleteError: "Non è stato possibile eliminare questa Nota d’Amore.",
    deleteConfirm: "Eliminare questa Nota d’Amore inviata?",
    refresh: "Aggiorna",
  },
  de: {
    title: "Liebesbotschaften",
    subtitle: "Schreibt etwas Bedeutungsvolles und sendet es privat an euren gegenseitig verknüpften Partner.",
    signIn: "Meldet euch an, um private Liebesbotschaften zu senden und zu empfangen.",
    signInButton: "Anmelden",
    compose: "Liebesbotschaft Schreiben",
    placeholder: "Sagt eurem Partner, was ihr schätzt, woran ihr euch erinnert, was ihr hofft oder einfach, was er wissen soll...",
    send: "An Partner Senden",
    sending: "Wird gesendet...",
    partner: "Verknüpfter Partner",
    noPartner: "Liebesbotschaften können zugestellt werden, sobald beide Partner ihre Konten gegenseitig miteinander verknüpft haben.",
    privacy: "Liebesbotschaften werden ausschließlich an euren gegenseitig verknüpften Partner zugestellt. Auf dieser Seite könnt ihr weder ein anderes Mitglied per E-Mail adressieren noch private Kontodaten durchsuchen.",
    sentSuccess: "Liebesbotschaft privat zugestellt.",
    sendError: "Diese Liebesbotschaft konnte nicht zugestellt werden.",
    tooLong: "Die Liebesbotschaft muss zwischen 1 und 5.000 Zeichen lang sein.",
    notes: "Eure Liebesbotschaften",
    all: "Alle",
    sent: "Gesendet",
    received: "Empfangen",
    unread: "Ungelesen",
    empty: "In dieser Ansicht gibt es noch keine Liebesbotschaften.",
    loading: "Liebesbotschaften werden geladen...",
    readError: "Diese Liebesbotschaft konnte nicht aktualisiert werden.",
    deleted: "Gesendete Liebesbotschaft gelöscht.",
    deleteError: "Diese Liebesbotschaft konnte nicht gelöscht werden.",
    deleteConfirm: "Diese gesendete Liebesbotschaft löschen?",
    refresh: "Aktualisieren",
  },
};

export default function LoveNotes() {
  const { currentLanguage } = useLanguage();
  const t = translations[currentLanguage] || translations.en;
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [filter, setFilter] = useState("all");

  const partnerQuery = useQuery({
    queryKey: ["mutualPartner", user?.id],
    queryFn: getMutualPartnerDirectoryProfile,
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  const notesQuery = useQuery({
    queryKey: ["loveNotes", user?.id],
    queryFn: getMyLoveNotes,
    enabled: Boolean(user?.id),
  });

  const sendMutation = useMutation({
    mutationFn: sendLoveNoteToMutualPartner,
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({ queryKey: ["loveNotes", user?.id] });
      toast.success(t.sentSuccess);
    },
    onError: () => toast.error(t.sendError),
  });

  const markReadMutation = useMutation({
    mutationFn: markLoveNoteRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["loveNotes", user?.id] }),
    onError: () => toast.error(t.readError),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSentLoveNote,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loveNotes", user?.id] });
      toast.success(t.deleted);
    },
    onError: () => toast.error(t.deleteError),
  });

  const filterOptions = [['all', t.all], ['sent', t.sent], ['received', t.received], ['unread', t.unread]];
  const notes = notesQuery.data || [];
  const filteredNotes = useMemo(() => {
    if (filter === "sent") return notes.filter((note) => note.direction === "sent");
    if (filter === "received") return notes.filter((note) => note.direction === "received");
    if (filter === "unread") return notes.filter((note) => note.direction === "received" && !note.is_read);
    return notes;
  }, [filter, notes]);

  const submitNote = () => {
    const clean = content.trim();
    if (!clean || clean.length > 5000) {
      toast.error(t.tooLong);
      return;
    }
    sendMutation.mutate({ content: clean });
  };

  const deleteNote = (noteId) => {
    if (window.confirm(t.deleteConfirm)) deleteMutation.mutate(noteId);
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" aria-label={t.loading} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4">
        <div className="max-w-xl text-center">
          <Heart className="mx-auto h-14 w-14 text-pink-600" aria-hidden="true" />
          <h1 className="mt-4 text-4xl font-bold text-slate-900">{t.title}</h1>
          <p className="mt-3 text-slate-600">{t.signIn}</p>
          <Button asChild className="mt-6"><Link to="/SignIn">{t.signInButton}</Link></Button>
        </div>
      </main>
    );
  }

  const partner = partnerQuery.data;
  const partnerName = partner?.full_name || t.partner;

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg">
            <Heart className="h-8 w-8 fill-current" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{t.title}</h1>
          <p className="mt-3 text-lg leading-7 text-slate-600">{t.subtitle}</p>
          <p className="mt-3 text-xs font-medium leading-5 text-purple-800">{t.privacy}</p>
        </header>

        <Card className="mx-auto mt-9 max-w-3xl border-pink-100 bg-white/95 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-pink-600" aria-hidden="true" />{t.compose}</CardTitle>
          </CardHeader>
          <CardContent>
            {partnerQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t.loading}</div>
            ) : !partner ? (
              <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{t.noPartner}</div>
            ) : (
              <>
                <div className="mb-3 text-sm font-semibold text-slate-700">{t.partner}: {partnerName}</div>
                <Textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={t.placeholder}
                  maxLength={5000}
                  className="min-h-40 resize-y"
                  aria-label={t.compose}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{content.length.toLocaleString()} / 5,000</span>
                  <Button type="button" onClick={submitNote} disabled={sendMutation.isPending || !content.trim()} className="bg-gradient-to-r from-pink-500 to-purple-600">
                    {sendMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}
                    {sendMutation.isPending ? t.sending : t.send}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <section className="mt-10" aria-labelledby="love-notes-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="love-notes-heading" className="flex items-center gap-2 text-2xl font-bold text-slate-900"><Inbox className="h-6 w-6 text-purple-600" aria-hidden="true" />{t.notes}</h2>
            <Button type="button" variant="outline" onClick={() => notesQuery.refetch()} disabled={notesQuery.isFetching}>{notesQuery.isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}{t.refresh}</Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t.notes}>
            {filterOptions.map(([value, label]) => (
              <Button key={value} type="button" size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)}>{label}</Button>
            ))}
          </div>

          {notesQuery.isLoading ? (
            <div className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-white p-8 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{t.loading}</div>
          ) : filteredNotes.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-600">{t.empty}</div>
          ) : (
            <div className="mt-6 space-y-5">
              {filteredNotes.map((note) => (
                <LoveNoteCard
                  key={note.id}
                  note={note}
                  partnerName={partnerName}
                  onMarkRead={(noteId) => markReadMutation.mutate(noteId)}
                  onDelete={deleteNote}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
