import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CLICK_VOTE_QUESTIONS } from '../../lib/votingQuestions';
import { castClickVote, getMyClickBallots } from '../../lib/votingService';

// Click-to-Vote (owner design, 2026-10-10): the homepage's first card.
// One tap is a vote; the next unvoted question rolls in automatically, and
// a returning member resumes at their first unvoted question. Every vote
// also posts into the question's chat room (server-side), results collect
// in the burgundy tab at the foot of the Chat cards, and Amora may answer
// the vote in the room. Guests keep their tapped choice in hand and are
// invited to join free / sign in to cast it.

const COPY = {
  en: {
    eyebrow: 'Click-to-Vote',
    questionOf: (n, total) => `Question ${n} of ${total}`,
    next: 'Next voting question',
    counted: '✓ Vote counted — it’s live in the chat room',
    changed: '✓ Vote updated — the room sees your new pick',
    commentPlaceholder: 'Add a comment with your vote (optional) — it posts to the chat room',
    joinTitle: 'Members vote free',
    joinBody: 'Your pick is saved in hand. Join free or sign in to cast it — one tap after that.',
    join: 'Join free', signIn: 'Sign in',
    castNow: 'Tap your pick again to cast it',
    doneTitle: 'You’ve voted on every question 🎉',
    doneBody: 'See the results and join the conversation in the Chat Rooms — and keep on the lookout for more votings.',
    openChat: 'Open the Chat Rooms',
    yourPick: 'Your pick',
    error: 'That didn’t go through — please try again.',
    loading: 'Loading the vote…',
  },
  es: {
    eyebrow: 'Vota con un clic',
    questionOf: (n, total) => `Pregunta ${n} de ${total}`,
    next: 'Siguiente pregunta',
    counted: '✓ Voto contado — ya está en la sala de chat',
    changed: '✓ Voto actualizado — la sala ve tu nueva elección',
    commentPlaceholder: 'Añade un comentario con tu voto (opcional) — se publica en la sala de chat',
    joinTitle: 'Los miembros votan gratis',
    joinBody: 'Tu elección quedó guardada. Únete gratis o inicia sesión para emitirla — un toque más.',
    join: 'Unirse gratis', signIn: 'Iniciar sesión',
    castNow: 'Toca tu elección otra vez para emitirla',
    doneTitle: 'Ya votaste en todas las preguntas 🎉',
    doneBody: 'Mira los resultados y únete a la conversación en las salas de chat — y mantente atento a más votaciones.',
    openChat: 'Abrir las salas de chat',
    yourPick: 'Tu elección',
    error: 'No se pudo enviar — inténtalo de nuevo.',
    loading: 'Cargando la votación…',
  },
  fr: {
    eyebrow: 'Vote en un clic',
    questionOf: (n, total) => `Question ${n} sur ${total}`,
    next: 'Question suivante',
    counted: '✓ Vote compté — il est en direct dans le salon',
    changed: '✓ Vote mis à jour — le salon voit votre nouveau choix',
    commentPlaceholder: 'Ajoutez un commentaire avec votre vote (facultatif) — il sera publié dans le salon',
    joinTitle: 'Les membres votent gratuitement',
    joinBody: 'Votre choix est gardé en main. Inscrivez-vous gratuitement ou connectez-vous pour le déposer — un toucher de plus.',
    join: 'Inscription gratuite', signIn: 'Se connecter',
    castNow: 'Touchez à nouveau votre choix pour le déposer',
    doneTitle: 'Vous avez voté à toutes les questions 🎉',
    doneBody: 'Voyez les résultats et rejoignez la conversation dans les salons — et restez à l’affût des prochains votes.',
    openChat: 'Ouvrir les salons',
    yourPick: 'Votre choix',
    error: 'L’envoi a échoué — veuillez réessayer.',
    loading: 'Chargement du vote…',
  },
  it: {
    eyebrow: 'Vota con un clic',
    questionOf: (n, total) => `Domanda ${n} di ${total}`,
    next: 'Prossima domanda',
    counted: '✓ Voto contato — è già nella sala chat',
    changed: '✓ Voto aggiornato — la sala vede la tua nuova scelta',
    commentPlaceholder: 'Aggiungi un commento con il tuo voto (facoltativo) — verrà pubblicato nella sala chat',
    joinTitle: 'I membri votano gratis',
    joinBody: 'La tua scelta è salvata. Iscriviti gratis o accedi per esprimerla — un tocco in più.',
    join: 'Iscriviti gratis', signIn: 'Accedi',
    castNow: 'Tocca di nuovo la tua scelta per esprimerla',
    doneTitle: 'Hai votato a tutte le domande 🎉',
    doneBody: 'Guarda i risultati e unisciti alla conversazione nelle sale chat — e tieni d’occhio le prossime votazioni.',
    openChat: 'Apri le sale chat',
    yourPick: 'La tua scelta',
    error: 'Invio non riuscito — riprova.',
    loading: 'Caricamento della votazione…',
  },
  de: {
    eyebrow: 'Klick-Abstimmung',
    questionOf: (n, total) => `Frage ${n} von ${total}`,
    next: 'Nächste Abstimmungsfrage',
    counted: '✓ Stimme gezählt — sie ist live im Chatroom',
    changed: '✓ Stimme aktualisiert — der Raum sieht deine neue Wahl',
    commentPlaceholder: 'Kommentar zu deiner Stimme (optional) — er erscheint im Chatroom',
    joinTitle: 'Mitglieder stimmen kostenlos',
    joinBody: 'Deine Wahl ist vorgemerkt. Registriere dich kostenlos oder melde dich an, um sie abzugeben — ein Tipp mehr.',
    join: 'Kostenlos registrieren', signIn: 'Anmelden',
    castNow: 'Tippe deine Wahl erneut an, um sie abzugeben',
    doneTitle: 'Du hast bei allen Fragen abgestimmt 🎉',
    doneBody: 'Sieh dir die Ergebnisse an und sprich im Chatroom mit — und halte Ausschau nach weiteren Abstimmungen.',
    openChat: 'Chatrooms öffnen',
    yourPick: 'Deine Wahl',
    error: 'Das hat nicht geklappt — bitte versuch es noch einmal.',
    loading: 'Abstimmung wird geladen…',
  },
};

const PENDING_KEY = 'o2ol-ctv-pending';

export default function ClickToVoteCard({ language = 'en' }) {
  const t = COPY[language] || COPY.en;
  const navigate = useNavigate();
  const questions = CLICK_VOTE_QUESTIONS;
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [ballots, setBallots] = useState({});
  const [index, setIndex] = useState(0);
  const [flash, setFlash] = useState('');
  const [comment, setComment] = useState('');
  const [pendingChoice, setPendingChoice] = useState(null);
  const [error, setError] = useState('');
  const [casting, setCasting] = useState(false);
  const advanceTimer = useRef(null);

  const pick = (table) => table?.[language] || table?.en || '';
  const firstUnvoted = useCallback((map, from = 0) => {
    for (let step = 0; step < questions.length; step += 1) {
      const i = (from + step) % questions.length;
      if (!map[questions[i].slug]) return i;
    }
    return -1;
  }, [questions]);

  useEffect(() => {
    let alive = true;
    (async () => {
      let map = {};
      let member = false;
      try {
        map = await getMyClickBallots();
        member = true;
      } catch { member = false; }
      if (!alive) return;
      setIsMember(member);
      setBallots(map);
      const pending = (() => { try { return JSON.parse(localStorage.getItem(PENDING_KEY) || 'null'); } catch { return null; } })();
      if (pending?.slug) {
        const pIdx = questions.findIndex((q) => q.slug === pending.slug);
        if (pIdx >= 0 && !map[pending.slug]) {
          setIndex(pIdx);
          setPendingChoice(pending.choice || null);
        }
      }
      if (!pending?.slug) {
        const start = firstUnvoted(map);
        setIndex(start >= 0 ? start : 0);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [firstUnvoted, questions]);

  const allVoted = useMemo(
    () => isMember && questions.every((q) => ballots[q.slug]),
    [isMember, ballots, questions],
  );
  const question = questions[index];
  const myChoice = question ? ballots[question.slug] : null;

  const advance = useCallback((map) => {
    const next = firstUnvoted(map, index + 1);
    if (next >= 0) setIndex(next);
  }, [firstUnvoted, index]);

  useEffect(() => () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); }, []);

  const handleChoice = async (choiceKey) => {
    if (!question || casting) return;
    setError('');
    if (!isMember) {
      setPendingChoice(choiceKey);
      try { localStorage.setItem(PENDING_KEY, JSON.stringify({ slug: question.slug, choice: choiceKey })); } catch { /* private mode */ }
      return;
    }
    setCasting(true);
    const wasUpdate = Boolean(ballots[question.slug]);
    try {
      const payload = await castClickVote({ topicSlug: question.slug, choice: choiceKey, comment });
      const nextMap = { ...ballots, [question.slug]: choiceKey };
      setBallots(nextMap);
      setComment('');
      setPendingChoice(null);
      try { localStorage.removeItem(PENDING_KEY); } catch { /* private mode */ }
      setFlash(wasUpdate ? t.changed : t.counted);
      if (payload?.results) { /* results live in the Chat tab; nothing to render here */ }
      advanceTimer.current = setTimeout(() => { setFlash(''); advance(nextMap); }, 1100);
    } catch {
      setError(t.error);
    } finally {
      setCasting(false);
    }
  };

  const handleNext = () => {
    setFlash('');
    setError('');
    setPendingChoice(null);
    setIndex((index + 1) % questions.length);
  };

  // Compact presentation (owner order, 2026-10-10, later the same day):
  // no white anywhere behind or inside the card — translucent burgundy
  // throughout — and roughly half the original height: the Next tab rides
  // on the eyebrow row, the question and choices are set tighter, and the
  // comment line is slim.
  if (loading) {
    return (
      <section className="border-b border-[#7f1d2d]/25 bg-[#7f1d2d]/[.10] px-4 py-2 sm:px-6" aria-label={t.eyebrow}>
        <div className="mx-auto max-w-7xl rounded-2xl border border-[#7f1d2d]/30 bg-[#7f1d2d]/[.12] px-4 py-2.5 text-[13px] font-semibold text-[#7f1d2d] shadow-sm">{t.loading}</div>
      </section>
    );
  }

  return (
    <section className="border-b border-[#7f1d2d]/25 bg-[#7f1d2d]/[.10] px-4 py-2 sm:px-6" aria-label={t.eyebrow}>
      <div className="mx-auto max-w-7xl rounded-2xl border border-[#7f1d2d]/35 bg-[#7f1d2d]/[.13] px-4 py-2.5 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7f1d2d]">🗳️ {t.eyebrow}</div>
          <div className="flex items-center gap-3">
            {!allVoted && <div className="text-[11px] font-bold text-[#7f1d2d]/70">{t.questionOf(index + 1, questions.length)}</div>}
            {!allVoted && question && (
              <button type="button" onClick={handleNext} className="rounded-t-md rounded-b-lg border border-amber-400/60 bg-gradient-to-br from-[#5c0e1a] via-[#7f1d2d] to-[#5c0e1a] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#f7f2e7] shadow transition hover:brightness-110">
                {t.next} →
              </button>
            )}
          </div>
        </div>

        {allVoted ? (
          <div className="mt-1.5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-[#5c0e1a] sm:text-xl">{t.doneTitle}</h2>
              <p className="mt-0.5 max-w-3xl text-[13px] leading-5 text-slate-700">{t.doneBody}</p>
            </div>
            <button type="button" onClick={() => navigate('/Chat')} className="shrink-0 rounded-lg bg-gradient-to-br from-[#5c0e1a] to-[#7f1d2d] px-4 py-2 text-[13px] font-black text-[#f7f2e7] shadow-md transition hover:brightness-110">{t.openChat}</button>
          </div>
        ) : question && (
          <>
            <h2 className="mt-1.5 text-lg font-black leading-tight tracking-tight text-[#5c0e1a] sm:text-xl">{pick(question.question)}</h2>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
              {question.choices.map((choice, i) => {
                const selected = myChoice === choice.key || pendingChoice === choice.key;
                return (
                  <button
                    key={choice.key}
                    type="button"
                    disabled={casting}
                    onClick={() => handleChoice(choice.key)}
                    className={`rounded-lg border px-3 py-1.5 text-left text-[13px] font-extrabold shadow-sm transition disabled:opacity-60 ${selected ? 'border-[#7f1d2d] bg-[#7f1d2d] text-[#f7f2e7]' : 'border-[#7f1d2d]/45 bg-[#7f1d2d]/[.10] text-[#5c0e1a] hover:border-[#7f1d2d] hover:bg-[#7f1d2d]/[.18]'}`}
                  >
                    <span className={`mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black ${selected ? 'bg-white/20 text-[#f7f2e7]' : 'bg-[#7f1d2d]/[.14] text-[#7f1d2d]'}`}>{String.fromCharCode(65 + i)}</span>
                    {pick(choice.labels)}
                    {myChoice === choice.key && <span className="ml-1.5 text-[10px] font-black uppercase tracking-wide opacity-80">· {t.yourPick}</span>}
                  </button>
                );
              })}
            </div>

            {isMember && !flash && (
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder={t.commentPlaceholder}
                className="mt-2 w-full rounded-lg border border-[#7f1d2d]/30 bg-[#7f1d2d]/[.07] px-3 py-1.5 text-[13px] text-slate-800 outline-none placeholder:text-slate-500 focus:border-[#7f1d2d]/60"
              />
            )}

            {flash && <p className="mt-2 text-[13px] font-black text-[#7f1d2d]" role="status">{flash}</p>}
            {error && <p className="mt-2 text-[13px] font-bold text-red-700" role="alert">{error}</p>}

            {!isMember && pendingChoice && (
              <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[#7f1d2d]/30 bg-[#7f1d2d]/[.09] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-black text-[#5c0e1a]">{t.joinTitle}</p>
                  <p className="text-[13px] text-slate-600">{t.joinBody}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => navigate('/SignUp')} className="rounded-lg bg-gradient-to-br from-[#5c0e1a] to-[#7f1d2d] px-3.5 py-2 text-[13px] font-black text-[#f7f2e7] shadow-sm">{t.join}</button>
                  <button type="button" onClick={() => navigate('/SignIn')} className="rounded-lg border border-[#7f1d2d]/45 bg-[#7f1d2d]/[.08] px-3.5 py-2 text-[13px] font-black text-[#5c0e1a]">{t.signIn}</button>
                </div>
              </div>
            )}
            {isMember && pendingChoice && !myChoice && (
              <p className="mt-1.5 text-[13px] font-bold text-[#7f1d2d]">{t.castNow}</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
