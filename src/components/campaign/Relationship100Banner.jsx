import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

// Relationship100Banner — site-wide campaign strip for the Relationship 100
// survey (the same campaign running across One2OneLove's social channels).
// Rendered once in App.jsx next to AccessCountdownBanner, so it appears at
// the top of every public page, the homepage and the Chat Room included.
//
// Timeline (America/Chicago):
// - Until Wed Oct 7, 2026 at midnight CT: voting copy + answer CTA.
// - Oct 8-9: "voting closed" copy pointing at the Friday Oct 9 reveal.
// - From Sat Oct 10, 2026 at midnight CT: renders nothing (auto-expires).
const VOTING_CLOSES_UTC = Date.parse('2026-10-08T05:00:00Z');
const CAMPAIGN_ENDS_UTC = Date.parse('2026-10-10T05:00:00Z');

const COPY = {
  en: {
    votingText:
      'What matters most in YOUR relationship? Divide 100% across money, communication, intimacy, faith and more — then see how everyone else divided theirs.',
    votingMeta: 'Voting closes Wednesday, October 7 at midnight CT · Results revealed Friday, October 9',
    votingAction: 'Answer in the Chat Room',
    closedText: 'Voting is closed — thank you to everyone who divided their 100%.',
    closedMeta: 'Results revealed Friday, October 9 in the Chat Room',
    closedAction: 'Join the Chat Room',
  },
  es: {
    votingText:
      '¿Qué es lo más importante en TU relación? Reparte el 100% entre el dinero, la comunicación, la intimidad, la fe y más — y descubre cómo lo repartieron los demás.',
    votingMeta: 'La votación cierra el miércoles 7 de octubre a la medianoche CT · Resultados el viernes 9 de octubre',
    votingAction: 'Responde en la Sala de Chat',
    closedText: 'La votación está cerrada — gracias a todos los que repartieron su 100%.',
    closedMeta: 'Resultados el viernes 9 de octubre en la Sala de Chat',
    closedAction: 'Entra a la Sala de Chat',
  },
  fr: {
    votingText:
      "Qu'est-ce qui compte le plus dans VOTRE relation ? Répartissez 100 % entre l'argent, la communication, l'intimité, la foi et plus encore — puis découvrez comment les autres ont fait leur répartition.",
    votingMeta: 'Fin des votes mercredi 7 octobre à minuit CT · Résultats révélés vendredi 9 octobre',
    votingAction: 'Répondre dans le Salon de Discussion',
    closedText: 'Les votes sont clos — merci à toutes celles et ceux qui ont réparti leurs 100 %.',
    closedMeta: 'Résultats révélés vendredi 9 octobre dans le Salon de Discussion',
    closedAction: 'Rejoindre le Salon de Discussion',
  },
  de: {
    votingText:
      'Was zählt in EURER Beziehung am meisten? Verteilen Sie 100 % auf Geld, Kommunikation, Nähe, Glauben und mehr — und sehen Sie, wie alle anderen verteilt haben.',
    votingMeta: 'Abstimmung endet Mittwoch, 7. Oktober um Mitternacht CT · Ergebnisse am Freitag, 9. Oktober',
    votingAction: 'Im Chatraum antworten',
    closedText: 'Die Abstimmung ist geschlossen — danke an alle, die ihre 100 % verteilt haben.',
    closedMeta: 'Ergebnisse am Freitag, 9. Oktober im Chatraum',
    closedAction: 'Zum Chatraum',
  },
  it: {
    votingText:
      'Cosa conta di più nella VOSTRA relazione? Dividete il 100% tra denaro, comunicazione, intimità, fede e altro — e scoprite come lo hanno diviso gli altri.',
    votingMeta: 'Votazioni chiuse mercoledì 7 ottobre a mezzanotte CT · Risultati venerdì 9 ottobre',
    votingAction: 'Rispondi nella Sala Chat',
    closedText: 'Le votazioni sono chiuse — grazie a tutti coloro che hanno diviso il loro 100%.',
    closedMeta: 'Risultati venerdì 9 ottobre nella Sala Chat',
    closedAction: 'Entra nella Sala Chat',
  },
};

function language() {
  try {
    const value = localStorage.getItem('preferredLanguage') || 'en';
    return COPY[value] ? value : 'en';
  } catch (_) {
    return 'en';
  }
}

export default function Relationship100Banner() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (now >= CAMPAIGN_ENDS_UTC) return null;

  const t = COPY[language()];
  const votingOpen = now < VOTING_CLOSES_UTC;
  const text = votingOpen ? t.votingText : t.closedText;
  const meta = votingOpen ? t.votingMeta : t.closedMeta;
  const action = votingOpen ? t.votingAction : t.closedAction;

  return (
    <div className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-[#f7f2e7]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-center sm:text-left">
        <span className="flex items-center gap-2 text-base font-bold tracking-[0.14em]">
          <Heart className="h-4 w-4 fill-[#d4a24e] text-[#d4a24e]" aria-hidden="true" />
          RELATIONSHIP 100
        </span>
        <span className="text-base leading-snug">{text}</span>
        <a
          href="/chat"
          className="rounded-full bg-[#d4a24e] px-4 py-1.5 text-base font-semibold text-[#1c2b4a] transition hover:bg-[#e2b566]"
        >
          {action}
        </a>
        <span className="w-full text-sm text-white/85 sm:w-auto">{meta}</span>
      </div>
    </div>
  );
}
