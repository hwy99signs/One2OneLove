import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';
import {
  PROFESSIONAL_APPLICATION_REVIEW_ENABLED,
  approveProfessionalApplicationReview,
  getProfessionalApplicationReviewAccess,
  listProfessionalApplicationsForReview,
  rejectProfessionalApplicationReview,
  reopenProfessionalApplicationReview,
  startProfessionalApplicationReview,
} from '@/lib/professionalApplicationReviewService';

const COPY = {
  en: {
    title: 'Professional application review', intro: 'Private review queue for therapist, influencer and professional applications. Approval here does not create an account or assign a One2OneLove role.',
    disabled: 'Professional application review is staged, not live yet.', denied: 'O2OL application reviewer access required.', loading: 'Loading applications…', empty: 'No applications in this queue.', active: 'Active queue', submitted: 'Submitted', underReview: 'Under review', approved: 'Approved', rejected: 'Rejected', withdrawn: 'Withdrawn', allTypes: 'All types', therapist: 'Therapist', influencer: 'Influencer', professional: 'Professional', start: 'Start review', approve: 'Approve application', reject: 'Reject application', reopen: 'Reopen', notes: 'Review notes', verificationRequired: 'Approval requires verified email and phone first.', separation: 'Important: approving this application does not create an Auth user, change users.user_type, or grant staff/member authority.', verified: 'Verified', notVerified: 'Not verified', email: 'Email', phone: 'Phone', details: 'Application details', actionFailed: 'The review action could not be completed.', notesRequired: 'Add review notes before rejecting.',
  },
  es: {
    title: 'Revisión de solicitudes profesionales', intro: 'Cola privada para solicitudes de terapeutas, influencers y profesionales. Aprobar aquí no crea una cuenta ni asigna un rol de One2OneLove.',
    disabled: 'La revisión de solicitudes está preparada, pero aún no está activa.', denied: 'Se requiere acceso de revisor O2OL.', loading: 'Cargando solicitudes…', empty: 'No hay solicitudes en esta cola.', active: 'Cola activa', submitted: 'Enviada', underReview: 'En revisión', approved: 'Aprobada', rejected: 'Rechazada', withdrawn: 'Retirada', allTypes: 'Todos los tipos', therapist: 'Terapeuta', influencer: 'Influencer', professional: 'Profesional', start: 'Iniciar revisión', approve: 'Aprobar solicitud', reject: 'Rechazar solicitud', reopen: 'Reabrir', notes: 'Notas de revisión', verificationRequired: 'La aprobación requiere primero correo y teléfono verificados.', separation: 'Importante: aprobar esta solicitud no crea un usuario Auth, no cambia users.user_type ni concede autoridad de miembro/personal.', verified: 'Verificado', notVerified: 'No verificado', email: 'Correo', phone: 'Teléfono', details: 'Detalles de la solicitud', actionFailed: 'No se pudo completar la acción.', notesRequired: 'Añade notas antes de rechazar.',
  },
  fr: {
    title: 'Examen des candidatures professionnelles', intro: 'File privée pour les candidatures de thérapeutes, influenceurs et professionnels. L’approbation ici ne crée pas de compte et n’attribue aucun rôle One2OneLove.',
    disabled: 'L’examen des candidatures est préparé, mais pas encore actif.', denied: 'Accès examinateur O2OL requis.', loading: 'Chargement des candidatures…', empty: 'Aucune candidature dans cette file.', active: 'File active', submitted: 'Soumise', underReview: 'En cours', approved: 'Approuvée', rejected: 'Refusée', withdrawn: 'Retirée', allTypes: 'Tous les types', therapist: 'Thérapeute', influencer: 'Influenceur', professional: 'Professionnel', start: 'Commencer l’examen', approve: 'Approuver la candidature', reject: 'Refuser la candidature', reopen: 'Rouvrir', notes: 'Notes d’examen', verificationRequired: 'L’approbation exige d’abord un e-mail et un téléphone vérifiés.', separation: 'Important : approuver cette candidature ne crée pas d’utilisateur Auth, ne change pas users.user_type et n’accorde aucun droit de membre/personnel.', verified: 'Vérifié', notVerified: 'Non vérifié', email: 'E-mail', phone: 'Téléphone', details: 'Détails de la candidature', actionFailed: 'L’action d’examen a échoué.', notesRequired: 'Ajoutez des notes avant de refuser.',
  },
  it: {
    title: 'Revisione candidature professionali', intro: 'Coda privata per candidature di terapeuti, influencer e professionisti. L’approvazione qui non crea un account né assegna un ruolo One2OneLove.',
    disabled: 'La revisione candidature è predisposta, ma non ancora attiva.', denied: 'È richiesto l’accesso revisore O2OL.', loading: 'Caricamento candidature…', empty: 'Nessuna candidatura in questa coda.', active: 'Coda attiva', submitted: 'Inviata', underReview: 'In revisione', approved: 'Approvata', rejected: 'Rifiutata', withdrawn: 'Ritirata', allTypes: 'Tutti i tipi', therapist: 'Terapeuta', influencer: 'Influencer', professional: 'Professionista', start: 'Avvia revisione', approve: 'Approva candidatura', reject: 'Rifiuta candidatura', reopen: 'Riapri', notes: 'Note di revisione', verificationRequired: 'L’approvazione richiede prima email e telefono verificati.', separation: 'Importante: approvare questa candidatura non crea un utente Auth, non modifica users.user_type e non concede autorità a membri/personale.', verified: 'Verificato', notVerified: 'Non verificato', email: 'Email', phone: 'Telefono', details: 'Dettagli candidatura', actionFailed: 'Impossibile completare l’azione.', notesRequired: 'Aggiungi note prima di rifiutare.',
  },
  de: {
    title: 'Prüfung professioneller Bewerbungen', intro: 'Private Warteschlange für Therapeut-, Influencer- und professionelle Bewerbungen. Eine Genehmigung hier erstellt kein Konto und weist keine One2OneLove-Rolle zu.',
    disabled: 'Die Bewerbungsprüfung ist vorbereitet, aber noch nicht aktiv.', denied: 'O2OL-Prüferzugang erforderlich.', loading: 'Bewerbungen werden geladen…', empty: 'Keine Bewerbungen in dieser Warteschlange.', active: 'Aktive Warteschlange', submitted: 'Eingereicht', underReview: 'In Prüfung', approved: 'Genehmigt', rejected: 'Abgelehnt', withdrawn: 'Zurückgezogen', allTypes: 'Alle Typen', therapist: 'Therapeut', influencer: 'Influencer', professional: 'Professionell', start: 'Prüfung starten', approve: 'Bewerbung genehmigen', reject: 'Bewerbung ablehnen', reopen: 'Wieder öffnen', notes: 'Prüfnotizen', verificationRequired: 'Vor der Genehmigung müssen E-Mail und Telefon verifiziert sein.', separation: 'Wichtig: Die Genehmigung erstellt keinen Auth-Benutzer, ändert users.user_type nicht und gewährt keine Mitarbeiter-/Mitgliederrechte.', verified: 'Verifiziert', notVerified: 'Nicht verifiziert', email: 'E-Mail', phone: 'Telefon', details: 'Bewerbungsdetails', actionFailed: 'Die Prüfaktion konnte nicht abgeschlossen werden.', notesRequired: 'Vor der Ablehnung Prüfnotizen hinzufügen.',
  },
};

const STATUS_KEYS = { submitted: 'submitted', under_review: 'underReview', approved: 'approved', rejected: 'rejected', withdrawn: 'withdrawn' };
const TYPE_KEYS = { therapist: 'therapist', influencer: 'influencer', professional: 'professional' };

export default function ProfessionalApplicationsAdmin() {
  const { currentLanguage } = useLanguage();
  const t = COPY[currentLanguage] || COPY.en;
  const [access, setAccess] = useState(null);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [applications, setApplications] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(PROFESSIONAL_APPLICATION_REVIEW_ENABLED);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!PROFESSIONAL_APPLICATION_REVIEW_ENABLED) return;
    setLoading(true);
    setError('');
    try {
      const permission = await getProfessionalApplicationReviewAccess();
      setAccess(permission);
      if (!permission.eligible) return;
      setApplications(await listProfessionalApplicationsForReview({ status, applicationType: type }));
    } catch {
      setError(t.actionFailed);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [status, type]);

  const act = async (item, action) => {
    const reviewNotes = (notes[item.id] || '').trim();
    if (action === 'reject' && reviewNotes.length < 3) {
      setError(t.notesRequired);
      return;
    }
    setBusyId(item.id);
    setError('');
    try {
      if (action === 'start') await startProfessionalApplicationReview(item.id);
      else if (action === 'approve') await approveProfessionalApplicationReview(item.id, reviewNotes);
      else if (action === 'reject') await rejectProfessionalApplicationReview(item.id, reviewNotes);
      else if (action === 'reopen') await reopenProfessionalApplicationReview(item.id, reviewNotes);
      await load();
    } catch (err) {
      setError(err?.code === 'APPLICATION_VERIFICATION_REQUIRED' ? t.verificationRequired : t.actionFailed);
    } finally {
      setBusyId('');
    }
  };

  if (!PROFESSIONAL_APPLICATION_REVIEW_ENABLED) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-slate-500" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.disabled}</h1></div></main>;
  }
  if (loading && !access) {
    return <main className="min-h-[70vh] px-5 py-16"><div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl bg-white p-10 text-slate-600 shadow-lg"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div></main>;
  }
  if (access && !access.eligible) {
    return <main className="min-h-[70vh] bg-slate-50 px-5 py-16"><div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-lg"><ShieldCheck className="mx-auto h-10 w-10 text-rose-600" /><h1 className="mt-5 text-3xl font-black text-slate-950">{t.denied}</h1></div></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[2rem] bg-slate-950 p-7 text-white sm:p-9">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300"><ShieldCheck className="h-4 w-4" />O2OL</div>
          <h1 className="mt-3 text-4xl font-black">{t.title}</h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">{t.intro}</p>
          <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm font-bold leading-6 text-amber-100">{t.separation}</p>
        </section>

        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {[['', t.active], ['submitted', t.submitted], ['under_review', t.underReview], ['approved', t.approved], ['rejected', t.rejected]].map(([value, label]) => <Button key={value || 'active'} size="sm" variant={status === value ? 'default' : 'outline'} onClick={() => setStatus(value)}>{label}</Button>)}
          <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold">
            <option value="">{t.allTypes}</option>
            {Object.keys(TYPE_KEYS).map((value) => <option key={value} value={value}>{t[TYPE_KEYS[value]]}</option>)}
          </select>
          <Button size="sm" variant="ghost" onClick={load} aria-label={t.loading}><RotateCcw className="h-4 w-4" /></Button>
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 font-bold text-rose-800">{error}</div> : null}

        <div className="mt-6 space-y-5">
          {loading ? <div className="flex justify-center py-16 text-slate-500"><Loader2 className="mr-3 h-5 w-5 animate-spin" />{t.loading}</div> : applications.length ? applications.map((item) => {
            const verified = item.email_verified && item.phone_verified;
            return <article key={item.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2"><span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-800">{t[TYPE_KEYS[item.application_type]] || item.application_type}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-700">{t[STATUS_KEYS[item.status]] || item.status}</span></div>
                  <h2 className="mt-3 text-2xl font-black">{item.first_name} {item.last_name}</h2>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><div><strong>{t.email}:</strong> {item.email}</div><div><strong>{t.phone}:</strong> {item.phone}</div></div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black"><span className={item.email_verified ? 'text-emerald-700' : 'text-amber-700'}>{t.email}: {item.email_verified ? t.verified : t.notVerified}</span><span className={item.phone_verified ? 'text-emerald-700' : 'text-amber-700'}>{t.phone}: {item.phone_verified ? t.verified : t.notVerified}</span></div>
                  <details className="mt-4 rounded-2xl bg-slate-50 p-4"><summary className="cursor-pointer font-black">{t.details}</summary><pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-slate-600">{JSON.stringify(item.details || {}, null, 2)}</pre></details>
                  <textarea aria-label={t.notes} value={notes[item.id] ?? item.review_notes ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value.slice(0, 4000) }))} rows={3} placeholder={t.notes} className="mt-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400" />
                  {!verified ? <p className="mt-2 text-sm font-bold text-amber-700">{t.verificationRequired}</p> : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-56">
                  {item.status === 'submitted' ? <Button variant="outline" disabled={busyId === item.id} onClick={() => act(item, 'start')}>{t.start}</Button> : null}
                  {item.status === 'under_review' ? <Button disabled={busyId === item.id || !verified} onClick={() => act(item, 'approve')}><CheckCircle2 className="mr-2 h-4 w-4" />{t.approve}</Button> : null}
                  {['submitted','under_review'].includes(item.status) ? <Button variant="outline" disabled={busyId === item.id} onClick={() => act(item, 'reject')}><XCircle className="mr-2 h-4 w-4" />{t.reject}</Button> : null}
                  {['approved','rejected'].includes(item.status) ? <Button variant="outline" disabled={busyId === item.id} onClick={() => act(item, 'reopen')}><RotateCcw className="mr-2 h-4 w-4" />{t.reopen}</Button> : null}
                </div>
              </div>
            </article>;
          }) : <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-16 text-center text-slate-500 shadow-sm">{t.empty}</div>}
        </div>
      </div>
    </main>
  );
}
