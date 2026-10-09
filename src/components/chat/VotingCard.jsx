import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, LogIn, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { getMyBallot, castBallot } from '@/lib/votingService';

// VotingCard — the standard O2OL voting-question card. Rendered inside the
// chat room that matches a question in src/lib/votingQuestions.js. Guests
// may fill it in; casting requires a verified signed-in member (the worker
// enforces it — worker/voting.ts). Submit unlocks only when BOTH the
// category total and the bills split total exactly 100.

const COPY = {
  en: {
    total: 'Total', left: '{n}% left to allocate', over: '{n}% over — lower a value', exact: 'Exactly 100% — ready!',
    closes: 'Voting closes:', submit: 'Cast my vote', update: 'Update my vote', casting: 'Sending…',
    signInPrompt: 'Sign in with a free account to cast your vote.', signIn: 'Sign in',
    optional: 'Optional — for anonymous group comparison', youIdentify: 'How do you identify?', partnerIdentify: 'How does your partner identify?', noAnswer: 'No answer',
    successTitle: 'Your vote is in! 🎉', successBody: 'Now post your numbers in the room so everyone can compare.',
    alreadyCast: 'You already voted — you can update your answers until voting closes.',
    closedTitle: 'Voting for this question has closed.', closedBody: 'Watch O2OL Studio for the results reveal.',
    submitError: 'Unable to cast your vote. Please try again.',
  },
  es: {
    total: 'Total', left: 'Te queda un {n}% por repartir', over: '{n}% de más: reduce un valor', exact: '¡Exactamente 100%! ¡Listo!',
    closes: 'La votación cierra:', submit: 'Enviar mi voto', update: 'Actualizar mi voto', casting: 'Enviando…',
    signInPrompt: 'Inicia sesión con una cuenta gratuita para votar.', signIn: 'Iniciar sesión',
    optional: 'Opcional — para comparación grupal anónima', youIdentify: '¿Cómo te identificas?', partnerIdentify: '¿Cómo se identifica tu pareja?', noAnswer: 'Sin respuesta',
    successTitle: '¡Tu voto ya cuenta! 🎉', successBody: 'Ahora publica tus números en la sala para que todos puedan comparar.',
    alreadyCast: 'Ya votaste: puedes actualizar tus respuestas hasta que cierre la votación.',
    closedTitle: 'La votación de esta pregunta ha cerrado.', closedBody: 'Mira O2OL Studio para conocer los resultados.',
    submitError: 'No se pudo enviar tu voto. Inténtalo de nuevo.',
  },
  fr: {
    total: 'Total', left: 'Il reste {n} % à répartir', over: '{n} % en trop — réduisez une valeur', exact: 'Exactement 100 % — prêt !',
    closes: 'Fin des votes :', submit: 'Envoyer mon vote', update: 'Mettre à jour mon vote', casting: 'Envoi…',
    signInPrompt: 'Connectez-vous avec un compte gratuit pour voter.', signIn: 'Se connecter',
    optional: 'Optionnel — pour une comparaison de groupe anonyme', youIdentify: 'Comment vous identifiez-vous ?', partnerIdentify: 'Comment votre partenaire s’identifie-t-il ?', noAnswer: 'Pas de réponse',
    successTitle: 'Votre vote est enregistré ! 🎉', successBody: 'Publiez maintenant vos chiffres dans le salon pour que tout le monde puisse comparer.',
    alreadyCast: 'Vous avez déjà voté — vous pouvez modifier vos réponses jusqu’à la clôture.',
    closedTitle: 'Le vote pour cette question est clos.', closedBody: 'Regardez O2OL Studio pour la révélation des résultats.',
    submitError: 'Impossible d’enregistrer votre vote. Veuillez réessayer.',
  },
  it: {
    total: 'Totale', left: 'Resta il {n}% da assegnare', over: '{n}% in più: riduci un valore', exact: 'Esattamente 100%: pronto!',
    closes: 'Chiusura votazioni:', submit: 'Invia il mio voto', update: 'Aggiorna il mio voto', casting: 'Invio…',
    signInPrompt: 'Accedi con un account gratuito per votare.', signIn: 'Accedi',
    optional: 'Facoltativo — per un confronto di gruppo anonimo', youIdentify: 'Come ti identifichi?', partnerIdentify: 'Come si identifica il tuo partner/la tua partner?', noAnswer: 'Nessuna risposta',
    successTitle: 'Il tuo voto è registrato! 🎉', successBody: 'Ora pubblica i tuoi numeri nella stanza così tutti possono confrontarli.',
    alreadyCast: 'Hai già votato: puoi aggiornare le risposte fino alla chiusura.',
    closedTitle: 'Le votazioni per questa domanda sono chiuse.', closedBody: 'Guarda O2OL Studio per la rivelazione dei risultati.',
    submitError: 'Impossibile inviare il tuo voto. Riprova.',
  },
  de: {
    total: 'Gesamt', left: 'Noch {n} % zu verteilen', over: '{n} % zu viel — reduziere einen Wert', exact: 'Genau 100 % — bereit!',
    closes: 'Abstimmung endet:', submit: 'Meine Stimme abgeben', update: 'Meine Stimme aktualisieren', casting: 'Senden…',
    signInPrompt: 'Melde dich mit einem kostenlosen Konto an, um abzustimmen.', signIn: 'Anmelden',
    optional: 'Optional — für einen anonymen Gruppenvergleich', youIdentify: 'Wie identifizierst du dich?', partnerIdentify: 'Wie identifiziert sich dein Partner/deine Partnerin?', noAnswer: 'Keine Angabe',
    successTitle: 'Deine Stimme ist gezählt! 🎉', successBody: 'Poste jetzt deine Zahlen im Raum, damit alle vergleichen können.',
    alreadyCast: 'Du hast bereits abgestimmt — du kannst deine Antworten bis zum Ende der Abstimmung aktualisieren.',
    closedTitle: 'Die Abstimmung zu dieser Frage ist beendet.', closedBody: 'Schau dir die Ergebnisse in O2OL Studio an.',
    submitError: 'Deine Stimme konnte nicht gespeichert werden. Bitte versuche es erneut.',
  },
};

const LOCALES = { en: 'en-US', es: 'es', fr: 'fr', it: 'it', de: 'de' };

function toInt(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function TotalStatus({ total, v }) {
  if (total < 100) return <span className="font-bold text-amber-700">{v.left.replace('{n}', String(100 - total))}</span>;
  if (total > 100) return <span className="font-bold text-rose-600">{v.over.replace('{n}', String(total - 100))}</span>;
  return <span className="inline-flex items-center gap-1 font-bold text-emerald-600"><CheckCircle2 size={15} />{v.exact}</span>;
}

function PercentInput({ value, onChange, label }) {
  const step = (delta) => onChange(String(Math.min(100, Math.max(0, toInt(value) + delta))));
  const handleChange = (event) => {
    const raw = event.target.value.replace(/[^0-9]/g, '').slice(0, 3);
    if (raw === '' || Number(raw) <= 100) onChange(raw);
  };
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => step(-1)} aria-label={`${label} −`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-purple-300 hover:text-purple-700"><Minus size={15} /></button>
      <div className="relative">
        <input value={value} onChange={handleChange} inputMode="numeric" pattern="[0-9]*" aria-label={label} className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 pr-5 text-center text-sm font-bold text-slate-800 outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100" />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
      </div>
      <button type="button" onClick={() => step(1)} aria-label={`${label} +`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:border-purple-300 hover:text-purple-700"><Plus size={15} /></button>
    </div>
  );
}

export default function VotingCard({ question, language = 'en', isAuthenticated = false }) {
  const v = COPY[language] || COPY.en;
  const pick = (table) => (table?.[language] || table?.en || '');
  const [values, setValues] = useState(() => Object.fromEntries(question.categories.map((category) => [category.key, ''])));
  const [bills, setBills] = useState({ you: '', partner: '' });
  const [respondentIdentity, setRespondentIdentity] = useState('');
  const [partnerIdentity, setPartnerIdentity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cast, setCast] = useState(null);
  const [justCast, setJustCast] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  const closed = question.closesAt ? Date.parse(question.closesAt) <= Date.now() : false;
  const prioritiesTotal = useMemo(
    () => question.categories.reduce((sum, category) => sum + toInt(values[category.key]), 0),
    [question, values],
  );
  const billsTotal = toInt(bills.you) + toInt(bills.partner);
  const ready = prioritiesTotal === 100 && billsTotal === 100;

  useEffect(() => {
    if (!isAuthenticated || closed) return;
    let cancelled = false;
    getMyBallot(question.slug)
      .then((ballot) => {
        if (cancelled || !ballot) return;
        setCast(ballot);
        setValues(Object.fromEntries(question.categories.map((category) => [
          category.key,
          ballot.priorities?.[category.key] === undefined || ballot.priorities?.[category.key] === null ? '' : String(ballot.priorities[category.key]),
        ])));
        setBills({
          you: ballot.expenseSplit?.you === null || ballot.expenseSplit?.you === undefined ? '' : String(ballot.expenseSplit.you),
          partner: ballot.expenseSplit?.partner === null || ballot.expenseSplit?.partner === undefined ? '' : String(ballot.expenseSplit.partner),
        });
        setRespondentIdentity(ballot.respondentIdentity || '');
        setPartnerIdentity(ballot.partnerIdentity || '');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, closed, question]);

  const submit = async () => {
    if (!ready || submitting) return;
    if (!isAuthenticated) {
      setShowSignIn(true);
      toast.error(v.signInPrompt);
      return;
    }
    setSubmitting(true);
    try {
      const ballot = await castBallot({
        topicSlug: question.slug,
        priorities: Object.fromEntries(question.categories.map((category) => [category.key, toInt(values[category.key])])),
        expenseSplit: { you: toInt(bills.you), partner: toInt(bills.partner) },
        respondentIdentity,
        partnerIdentity,
      });
      setCast(ballot);
      setJustCast(true);
      toast.success(v.successTitle);
    } catch (error) {
      toast.error(language === 'en' ? (error?.message || v.submitError) : v.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const closesLabel = question.closesAt
    ? new Intl.DateTimeFormat(LOCALES[language] || 'en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', timeZone: 'America/Chicago' }).format(new Date(question.closesAt))
    : null;

  return (
    <div className="border-b border-purple-100 bg-white">
      <div className="bg-gradient-to-br from-[#5c0e1a] via-[#7f1d2d] to-[#5c0e1a] px-4 py-4 text-[#f7f2e7] sm:px-5">
        <p className="text-base font-black leading-6">{pick(question.title)}</p>
        <p className="mt-1 text-sm leading-5 text-[#f7f2e7]/85">{pick(question.stem)}</p>
        {closesLabel && !closed && <p className="mt-2 text-xs font-bold uppercase tracking-wide text-amber-300">{v.closes} {closesLabel} CT</p>}
      </div>

      <div className="p-4 sm:p-5">
        {closed ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
            <p className="font-black text-slate-700">{v.closedTitle}</p>
            <p className="mt-1 text-sm text-slate-500">{v.closedBody}</p>
          </div>
        ) : (
          <>
            {justCast ? (
              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="inline-flex items-center gap-2 font-black text-emerald-800"><CheckCircle2 size={17} />{v.successTitle}</p>
                <p className="mt-1 text-sm text-emerald-700">{v.successBody}</p>
              </div>
            ) : cast ? (
              <p className="mb-4 rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-800">{v.alreadyCast}</p>
            ) : null}

            <div className="space-y-2.5">
              {question.categories.map((category, index) => (
                <div key={category.key} className="flex items-center justify-between gap-3">
                  <label className="min-w-0 flex-1 text-sm font-semibold leading-5 text-slate-700">{index + 1}. {pick(category.labels)}</label>
                  <PercentInput value={values[category.key]} onChange={(next) => setValues((current) => ({ ...current, [category.key]: next }))} label={pick(category.labels)} />
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <span className="text-sm font-black text-slate-800">{v.total}: {prioritiesTotal}%</span>
              <span className="text-sm"><TotalStatus total={prioritiesTotal} v={v} /></span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all ${prioritiesTotal > 100 ? 'bg-rose-500' : prioritiesTotal === 100 ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(prioritiesTotal, 100)}%` }} />
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold leading-6 text-slate-800">{pick(question.bills.stem)}</p>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex-1 text-sm font-semibold text-slate-700">{pick(question.bills.youLabels)}</label>
                  <PercentInput value={bills.you} onChange={(next) => setBills((current) => ({ ...current, you: next }))} label={pick(question.bills.youLabels)} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex-1 text-sm font-semibold text-slate-700">{pick(question.bills.partnerLabels)}</label>
                  <PercentInput value={bills.partner} onChange={(next) => setBills((current) => ({ ...current, partner: next }))} label={pick(question.bills.partnerLabels)} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm font-black text-slate-800">{v.total}: {billsTotal}%</span>
                <span className="text-sm"><TotalStatus total={billsTotal} v={v} /></span>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">{v.optional}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">{v.youIdentify}</span>
                  <select value={respondentIdentity} onChange={(event) => setRespondentIdentity(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100">
                    <option value="">{v.noAnswer}</option>
                    {question.identity.respondent.map((option) => <option key={option.value} value={option.value}>{pick(option.labels)}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">{v.partnerIdentify}</span>
                  <select value={partnerIdentity} onChange={(event) => setPartnerIdentity(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100">
                    <option value="">{v.noAnswer}</option>
                    {question.identity.partner.map((option) => <option key={option.value} value={option.value}>{pick(option.labels)}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {showSignIn && !isAuthenticated && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <span>{v.signInPrompt}</span>
                <Link to={createPageUrl('SignIn')} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 font-bold text-white"><LogIn size={15} />{v.signIn}</Link>
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={!ready || submitting}
              className={`mt-4 w-full rounded-2xl px-4 py-3 font-black text-white shadow-sm transition ${ready ? 'bg-gradient-to-r from-[#5c0e1a] to-[#7f1d2d] hover:opacity-95' : 'cursor-not-allowed bg-slate-300'}`}
            >
              {submitting ? v.casting : cast ? v.update : v.submit}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
