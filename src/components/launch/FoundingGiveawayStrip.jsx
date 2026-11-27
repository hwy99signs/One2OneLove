import React, { useEffect, useState } from 'react';

// RETIRED 2026-11-25 — Founding Member Giveaway (owner ruling,
// 2026-11-25 12:40 CT: "no credit prizes or offers").
//
// The giveaway ran on signups + Game Credit prizes + free SMS Love
// Note sends; all three are disabled in the 100% free model, so the
// giveaway cannot run or pay out and is retired from the site. This
// component (the Home hero strip, its copy, and the hero-state fetch)
// is NOT imported anywhere and ships in no bundle. It is kept in the
// repo — disable, don't delete — so the owner can re-activate the
// giveaway at a future date if he chooses. The matching API
// (/api/founding-perks/*) answers 410 feature_retired in the worker;
// the claim notice lives, also unmounted, in
// src/components/profile/FoundingPerkNotice.jsx.
const FOUNDING_STRIP_COPY = {
  en:{eyebrow:'FOUNDING MEMBER GIVEAWAY',body1:'The first 100 signups with a username, email and password get $10 in Game Credit AND 2 FREE Love Note sends.',body2:'The next 100 signups get $5 in Game Credit AND 1 FREE Love Note send.',monthly:'The first 100 also get $10 in Game Credit every month for 6 months.',future:'Future perks will also be awarded to these Founding Members.',requirements:'To claim: an email on your profile, a verified phone number, and at least $5 Credit in your account.',cta:'Join Free'},
  es:{eyebrow:'OBSEQUIO PARA MIEMBROS FUNDADORES',body1:'Las primeras 100 inscripciones con usuario, correo y contraseña reciben $10 en Crédito de Juego Y 2 ENVÍOS DE NOTAS DE AMOR GRATIS.',body2:'Las siguientes 100 inscripciones reciben $5 en Crédito de Juego Y 1 ENVÍO DE NOTA DE AMOR GRATIS.',monthly:'Los primeros 100 también reciben $10 en Crédito de Juego cada mes durante 6 meses.',future:'También se otorgarán beneficios futuros a estos Miembros Fundadores.',requirements:'Para reclamar: un correo en tu perfil, un número de teléfono verificado y al menos $5 de Crédito en tu cuenta.',cta:'Únete Gratis'},
  fr:{eyebrow:'CADEAU MEMBRES FONDATEURS',body1:'Les 100 premières inscriptions avec nom d’utilisateur, e-mail et mot de passe reçoivent 10 $ en Crédit de Jeu ET 2 ENVOIS DE NOTES D’AMOUR GRATUITS.',body2:'Les 100 inscriptions suivantes reçoivent 5 $ en Crédit de Jeu ET 1 ENVOI DE NOTE D’AMOUR GRATUIT.',monthly:'Les 100 premiers reçoivent aussi 10 $ en Crédit de Jeu chaque mois pendant 6 mois.',future:'Des avantages futurs seront également accordés à ces Membres Fondateurs.',requirements:'Pour réclamer : un e-mail dans votre profil, un numéro de téléphone vérifié et au moins 5 $ de Crédit dans votre compte.',cta:'Rejoindre Gratuitement'},
  it:{eyebrow:'OMAGGIO MEMBRI FONDATORI',body1:'Le prime 100 iscrizioni con nome utente, email e password ricevono $10 in Credito di Gioco E 2 INVII DI NOTE D’AMORE GRATUITI.',body2:'Le successive 100 iscrizioni ricevono $5 in Credito di Gioco E 1 INVIO DI NOTA D’AMORE GRATUITO.',monthly:'I primi 100 ricevono anche $10 in Credito di Gioco ogni mese per 6 mesi.',future:'Vantaggi futuri saranno assegnati anche a questi Membri Fondatori.',requirements:'Per richiedere: un’email nel tuo profilo, un numero di telefono verificato e almeno $5 di Credito nel tuo account.',cta:'Iscriviti Gratis'},
  de:{eyebrow:'GRÜNDUNGSMITGLIEDER-GESCHENK',body1:'Die ersten 100 Anmeldungen mit Benutzername, E-Mail und Passwort erhalten $10 Spiel-Credit UND 2 KOSTENLOSE LIEBESBOTSCAFT-SENDUNGEN.',body2:'Die nächsten 100 Anmeldungen erhalten $5 Spiel-Credit UND 1 KOSTENLOSE LIEBESBOTSCAFT-SENDUNG.',monthly:'Die ersten 100 erhalten außerdem $10 Spiel-Credit jeden Monat für 6 Monate.',future:'Zukünftige Vorteile werden auch an diese Gründungsmitglieder vergeben.',requirements:'Zum Einlösen: eine E-Mail in deinem Profil, eine verifizierte Telefonnummer und mindestens $5 Credit in deinem Konto.',cta:'Kostenlos Beitreten'}
};

export default function FoundingGiveawayStrip({ currentLanguage = 'en', go }) {
  const [foundingOffer, setFoundingOffer] = useState(null);
  const foundingStrip = FOUNDING_STRIP_COPY[currentLanguage] || FOUNDING_STRIP_COPY.en;

  useEffect(() => {
    let active = true;
    fetch('/api/founding-perks/hero', { credentials:'same-origin', headers:{ accept:'application/json' } })
      .then(response => response.ok ? response.json() : null)
      .then(payload => { if (active && payload?.ok) setFoundingOffer(payload.hero || null); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!foundingOffer?.open) return null;

  return (
    <section style={{ background:'linear-gradient(90deg,#a23be6 0%,#c630ca 55%,#db2a6e 100%)' }} className="border-y-2 border-amber-300 px-5 py-5 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 text-center">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">🎉 {foundingStrip.eyebrow}</div>
        <p className="max-w-4xl text-lg font-extrabold leading-snug drop-shadow md:text-xl">
          {foundingOffer.tier === 'first100' ? foundingStrip.body1 : foundingStrip.body2}
          {foundingOffer.tier === 'first100' && foundingOffer.monthlyPerk ? ` ${foundingStrip.monthly}` : ''}
          {foundingOffer.futurePerks ? ` ${foundingStrip.future}` : ''}
        </p>
        <p className="text-sm text-white/85">{foundingStrip.requirements}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" data-analytics-id="home-founding-giveaway" data-analytics-destination="/SignUp" onClick={() => go('SignUp')} className="rounded-full bg-white px-5 py-2 text-sm font-black text-pink-700 shadow-lg transition hover:bg-slate-50">
            {foundingStrip.cta}
          </button>
        </div>
      </div>
    </section>
  );
}
