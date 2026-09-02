import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleHelp, Loader2, LockKeyhole, Send, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_REQUESTS_ENABLED,
  closeSupportRequest,
  createSupportRequest,
  listMySupportRequests,
  markSupportResponseRead,
} from '@/lib/supportRequestService';

const COPY = {
  en: {
    badge: 'MEMBER SUPPORT', title: 'How can One2OneLove help?', intro: 'Send a private in-app support request and track the response here. This support channel does not send email or SMS.', disabled: 'Member support requests are staged, not live yet.', signIn: 'Sign in to use private member support.', signInButton: 'Sign In', back: 'Back to Help Center', boundary: 'Member Support is not an emergency or crisis-response channel and is not continuously monitored.', safetyNotice: 'For an immediate safety emergency, use the appropriate local emergency service rather than waiting for a support reply.', newRequest: 'New support request', category: 'Category', subject: 'Subject', message: 'What happened?', submit: 'Send request', sending: 'Sending…', requests: 'Your requests', empty: 'You have not submitted a support request yet.', close: 'Close request', response: 'One2OneLove response', submitted: 'Submitted', updated: 'Updated', success: 'Support request sent.', failed: 'The support request could not be completed.', openLimit: 'You already have the maximum of five open or in-progress support requests.', categories: { account: 'Account', technical: 'Technical problem', billing: 'Billing', safety: 'Safety concern', feedback: 'Feedback', other: 'Other' }, statuses: { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' },
  },
  es: {
    badge: 'SOPORTE PARA MIEMBROS', title: '¿Cómo puede ayudarte One2OneLove?', intro: 'Envía una solicitud privada dentro de la aplicación y sigue la respuesta aquí. Este canal no envía correo ni SMS.', disabled: 'El soporte para miembros está preparado, pero aún no está activo.', signIn: 'Inicia sesión para usar el soporte privado.', signInButton: 'Iniciar Sesión', back: 'Volver al Centro de Ayuda', boundary: 'El Soporte para Miembros no es un canal de emergencias o crisis y no se supervisa continuamente.', safetyNotice: 'Para una emergencia de seguridad inmediata, utiliza el servicio de emergencia local apropiado en lugar de esperar una respuesta de soporte.', newRequest: 'Nueva solicitud de soporte', category: 'Categoría', subject: 'Asunto', message: '¿Qué ocurrió?', submit: 'Enviar solicitud', sending: 'Enviando…', requests: 'Tus solicitudes', empty: 'Aún no has enviado una solicitud.', close: 'Cerrar solicitud', response: 'Respuesta de One2OneLove', submitted: 'Enviada', updated: 'Actualizada', success: 'Solicitud de soporte enviada.', failed: 'No se pudo completar la solicitud.', openLimit: 'Ya tienes el máximo de cinco solicitudes abiertas o en progreso.', categories: { account: 'Cuenta', technical: 'Problema técnico', billing: 'Facturación', safety: 'Preocupación de seguridad', feedback: 'Comentarios', other: 'Otro' }, statuses: { open: 'Abierta', in_progress: 'En progreso', resolved: 'Resuelta', closed: 'Cerrada' },
  },
  fr: {
    badge: 'ASSISTANCE MEMBRES', title: 'Comment One2OneLove peut-il vous aider ?', intro: 'Envoyez une demande privée dans l’application et suivez la réponse ici. Ce canal n’envoie ni e-mail ni SMS.', disabled: 'L’assistance membres est préparée, mais pas encore active.', signIn: 'Connectez-vous pour utiliser l’assistance privée.', signInButton: 'Se Connecter', back: 'Retour au Centre d’Aide', boundary: 'L’Assistance Membres n’est pas un service d’urgence ou de crise et n’est pas surveillée en continu.', safetyNotice: 'En cas d’urgence immédiate liée à la sécurité, utilisez le service d’urgence local approprié plutôt que d’attendre une réponse du support.', newRequest: 'Nouvelle demande', category: 'Catégorie', subject: 'Objet', message: 'Que s’est-il passé ?', submit: 'Envoyer', sending: 'Envoi…', requests: 'Vos demandes', empty: 'Vous n’avez encore envoyé aucune demande.', close: 'Fermer la demande', response: 'Réponse One2OneLove', submitted: 'Envoyée', updated: 'Mise à jour', success: 'Demande d’assistance envoyée.', failed: 'La demande n’a pas pu être traitée.', openLimit: 'Vous avez déjà le maximum de cinq demandes ouvertes ou en cours.', categories: { account: 'Compte', technical: 'Problème technique', billing: 'Facturation', safety: 'Préoccupation de sécurité', feedback: 'Commentaire', other: 'Autre' }, statuses: { open: 'Ouverte', in_progress: 'En cours', resolved: 'Résolue', closed: 'Fermée' },
  },
  it: {
    badge: 'ASSISTENZA MEMBRI', title: 'Come può aiutarti One2OneLove?', intro: 'Invia una richiesta privata in-app e segui qui la risposta. Questo canale non invia email o SMS.', disabled: 'L’assistenza membri è predisposta, ma non è ancora attiva.', signIn: 'Accedi per usare l’assistenza privata.', signInButton: 'Accedi', back: 'Torna al Centro Assistenza', boundary: 'L’Assistenza Membri non è un canale di emergenza o crisi e non è monitorata continuamente.', safetyNotice: 'Per un’emergenza di sicurezza immediata, usa il servizio di emergenza locale appropriato invece di attendere una risposta dell’assistenza.', newRequest: 'Nuova richiesta', category: 'Categoria', subject: 'Oggetto', message: 'Cosa è successo?', submit: 'Invia richiesta', sending: 'Invio…', requests: 'Le tue richieste', empty: 'Non hai ancora inviato richieste.', close: 'Chiudi richiesta', response: 'Risposta One2OneLove', submitted: 'Inviata', updated: 'Aggiornata', success: 'Richiesta di assistenza inviata.', failed: 'Impossibile completare la richiesta.', openLimit: 'Hai già il massimo di cinque richieste aperte o in lavorazione.', categories: { account: 'Account', technical: 'Problema tecnico', billing: 'Fatturazione', safety: 'Problema di sicurezza', feedback: 'Feedback', other: 'Altro' }, statuses: { open: 'Aperta', in_progress: 'In lavorazione', resolved: 'Risolta', closed: 'Chiusa' },
  },
  de: {
    badge: 'MITGLIEDER-SUPPORT', title: 'Wie kann One2OneLove helfen?', intro: 'Sende eine private In-App-Supportanfrage und verfolge hier die Antwort. Dieser Kanal sendet keine E-Mail oder SMS.', disabled: 'Mitglieder-Support ist vorbereitet, aber noch nicht aktiv.', signIn: 'Melde dich an, um privaten Support zu nutzen.', signInButton: 'Anmelden', back: 'Zurück zum Hilfe-Center', boundary: 'Mitglieder-Support ist kein Notfall- oder Krisendienst und wird nicht durchgehend überwacht.', safetyNotice: 'Bei einem unmittelbaren Sicherheitsnotfall nutze den geeigneten örtlichen Notdienst, anstatt auf eine Supportantwort zu warten.', newRequest: 'Neue Supportanfrage', category: 'Kategorie', subject: 'Betreff', message: 'Was ist passiert?', submit: 'Anfrage senden', sending: 'Wird gesendet…', requests: 'Deine Anfragen', empty: 'Du hast noch keine Supportanfrage gesendet.', close: 'Anfrage schließen', response: 'One2OneLove-Antwort', submitted: 'Gesendet', updated: 'Aktualisiert', success: 'Supportanfrage gesendet.', failed: 'Die Supportanfrage konnte nicht abgeschlossen werden.', openLimit: 'Du hast bereits maximal fünf offene oder laufende Supportanfragen.', categories: { account: 'Konto', technical: 'Technisches Problem', billing: 'Abrechnung', safety: 'Sicherheitsanliegen', feedback: 'Feedback', other: 'Sonstiges' }, statuses: { open: 'Offen', in_progress: 'In Bearbeitung', resolved: 'Gelöst', closed: 'Geschlossen' },
  },
  nl: {
    badge: 'LEDENONDERSTEUNING', title: 'Hoe kan One2OneLove helpen?', intro: 'Stuur een privé-supportverzoek in de app en volg hier het antwoord. Dit kanaal verstuurt geen e-mail of sms.', disabled: 'Ledenondersteuning is voorbereid, maar nog niet actief.', signIn: 'Log in om privé-support te gebruiken.', signInButton: 'Inloggen', back: 'Terug naar Helpcentrum', boundary: 'Ledenondersteuning is geen nood- of crisisservice en wordt niet voortdurend bewaakt.', safetyNotice: 'Gebruik bij een onmiddellijke veiligheidsnoodsituatie de passende lokale hulpdienst in plaats van op een supportantwoord te wachten.', newRequest: 'Nieuw supportverzoek', category: 'Categorie', subject: 'Onderwerp', message: 'Wat is er gebeurd?', submit: 'Verzoek versturen', sending: 'Versturen…', requests: 'Jouw verzoeken', empty: 'Je hebt nog geen supportverzoek ingediend.', close: 'Verzoek sluiten', response: 'Antwoord van One2OneLove', submitted: 'Ingediend', updated: 'Bijgewerkt', success: 'Supportverzoek verstuurd.', failed: 'Het supportverzoek kon niet worden voltooid.', openLimit: 'Je hebt al maximaal vijf open of lopende supportverzoeken.', categories: { account: 'Account', technical: 'Technisch probleem', billing: 'Facturering', safety: 'Veiligheidszorg', feedback: 'Feedback', other: 'Anders' }, statuses: { open: 'Open', in_progress: 'In behandeling', resolved: 'Opgelost', closed: 'Gesloten' },
  },
};

const localeByLanguage = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE', nl: 'nl-NL' };

export default function SupportRequests() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentLanguage } = useLanguage();
  const language = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[language];
  const locale = localeByLanguage[language] || 'en-US';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(SUPPORT_REQUESTS_ENABLED && isAuthenticated);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState('technical');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!SUPPORT_REQUESTS_ENABLED || !isAuthenticated || !user?.id) return;
    setLoading(true);
    try {
      const rows = await listMySupportRequests();
      const unreadResponses = rows.filter((item) => item.staff_response && !item.member_response_read_at);
      if (!unreadResponses.length) {
        setRequests(rows);
      } else {
        const settled = await Promise.allSettled(unreadResponses.map((item) => markSupportResponseRead(item.id)));
        const updates = new Map();
        settled.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value?.member_response_read_at) {
            updates.set(unreadResponses[index].id, result.value.member_response_read_at);
          }
        });
        setRequests(rows.map((item) => updates.has(item.id) ? { ...item, member_response_read_at: updates.get(item.id) } : item));
      }
    } catch {
      toast.error(t.failed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [isAuthenticated, user?.id]);

  const submit = async (event) => {
    event.preventDefault();
    if (busy || subject.trim().length < 3 || message.trim().length < 10) return;
    setBusy(true);
    try {
      const created = await createSupportRequest({ category, subject, message });
      if (created) setRequests((current) => [created, ...current]);
      setSubject('');
      setMessage('');
      toast.success(t.success);
    } catch (error) {
      const text = String(error?.message || '');
      toast.error(text.includes('OPEN_REQUEST_LIMIT_REACHED') ? t.openLimit : t.failed);
    } finally {
      setBusy(false);
    }
  };

  const close = async (requestId) => {
    try {
      const updated = await closeSupportRequest(requestId);
      if (updated) setRequests((current) => current.map((item) => item.id === requestId ? updated : item));
    } catch {
      toast.error(t.failed);
    }
  };

  if (!SUPPORT_REQUESTS_ENABLED) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><LockKeyhole className="mx-auto h-10 w-10 text-violet-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.disabled}</h1><Button variant="outline" className="mt-6" onClick={() => navigate('/HelpCenter')}><ArrowLeft className="mr-2 h-4 w-4" />{t.back}</Button></div></main>;
  }

  if (!isAuthenticated) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><CircleHelp className="mx-auto h-10 w-10 text-violet-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.signIn}</h1><div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={() => navigate('/SignIn?returnTo=%2FSupportRequests')}>{t.signInButton}</Button><Button variant="outline" onClick={() => navigate('/HelpCenter')}><ArrowLeft className="mr-2 h-4 w-4" />{t.back}</Button></div></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-600 px-5 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <Button variant="ghost" className="-ml-3 mb-4 text-white/90 hover:bg-white/10 hover:text-white" onClick={() => navigate('/HelpCenter')}><ArrowLeft className="mr-2 h-4 w-4" />{t.back}</Button>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black tracking-[0.16em]"><CircleHelp className="h-4 w-4" />{t.badge}</div>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{t.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/90">{t.intro}</p>
          <div className="mt-6 max-w-3xl rounded-2xl border border-white/20 bg-white/10 p-4 text-sm font-semibold leading-6 text-white/95">{t.boundary}</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[.85fr_1.15fr]">
        <form onSubmit={submit} className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">{t.newRequest}</h2>
          <div className="mt-5 space-y-4">
            <div><label className="mb-1.5 block text-sm font-bold">{t.category}</label><select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">{SUPPORT_CATEGORIES.map((value) => <option key={value} value={value}>{t.categories[value]}</option>)}</select></div>
            {category === 'safety' ? <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><span>{t.safetyNotice}</span></div> : null}
            <div><label className="mb-1.5 block text-sm font-bold">{t.subject}</label><Input value={subject} onChange={(event) => setSubject(event.target.value.slice(0, 120))} required /></div>
            <div><label className="mb-1.5 block text-sm font-bold">{t.message}</label><textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 4000))} minLength={10} rows={7} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400" required /></div>
            <Button type="submit" disabled={busy || subject.trim().length < 3 || message.trim().length < 10} className="w-full bg-violet-700 text-white hover:bg-violet-800">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{busy ? t.sending : t.submit}</Button>
          </div>
        </form>

        <div>
          <h2 className="text-2xl font-black">{t.requests}</h2>
          {loading ? <div className="flex justify-center py-16 text-slate-500"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.requests}</div> : requests.length ? (
            <div className="mt-5 space-y-4">
              {requests.map((item) => <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase text-violet-800">{t.categories[item.category] || item.category}</span><h3 className="mt-3 text-xl font-black text-slate-950">{item.subject}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-black ${item.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : item.status === 'closed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>{t.statuses[item.status] || item.status}</span></div>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{item.message}</p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-400"><span>{t.submitted}: {new Date(item.created_at).toLocaleString(locale)}</span><span>{t.updated}: {new Date(item.updated_at).toLocaleString(locale)}</span></div>
                {item.staff_response ? <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-black text-emerald-900"><CheckCircle2 className="h-4 w-4" />{t.response}</div><p className="mt-2 whitespace-pre-wrap leading-7 text-emerald-950">{item.staff_response}</p></div> : null}
                {item.status !== 'closed' ? <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => close(item.id)}><XCircle className="mr-2 h-4 w-4" />{t.close}</Button> : null}
              </article>)}
            </div>
          ) : <div className="mt-5 rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">{t.empty}</div>}
        </div>
      </section>
    </main>
  );
}
