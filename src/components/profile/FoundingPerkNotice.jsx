import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Circle, Gift, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/apiClient';

// Founding Member Giveaway notice (owner directives, 2026-10-10). Shown
// only to members whose account sits in a giveaway cohort (first or
// second 100 qualifying signups). Unclaimed members see the owner's
// message plus a live checklist of the claim requirements (email on
// profile, phone verified, at least $5.00 Credit); the claim action
// enables only when every requirement is met. Claimed members see a
// confirmation of what they received. Translations are Muse's,
// following the site's existing copy convention.
const COPY = {
  en: {
    title1: "You're a Founding Member!", title2: "You're in the Second 100!",
    intro1: 'You are one of the first 100 people to sign up for One2OneLove with a username, email and password.',
    intro2: 'You are one of the next 100 people to sign up for One2OneLove with a username, email and password.',
    grantLine: 'Your Founding perks: {amount} in GAME CREDIT and {sends}.',
    sends2: '2 FREE SEND LOVE NOTES', sends1: '1 FREE SEND LOVE NOTE',
    monthlyLine: 'Plus, once you claim: $10 in Game Credit every month for 6 months.',
    futureLine: 'Future perks will also be awarded to these Founding Members.',
    needEmail: 'Update your profile with an email account to get the {amount} GAME CREDIT AND {sends}.',
    checklistTitle: 'To claim your perks, you need:',
    reqCredential: 'Username & password account',
    reqEmail: 'Email account on your profile',
    reqPhone: 'Phone number verified',
    reqBalance: 'At least $5.00 Credit in your account',
    balanceNow: 'Your Credit balance: {balance}',
    verifyPhoneCta: 'Verify your phone',
    addCreditCta: 'Add Credit',
    claimCta: 'Claim My Perks', claiming: 'Claiming…',
    claimedTitle: 'Founding Perks Claimed',
    claimedBody: '{amount} Game Credit is in your game wallet. Free Love Note sends ready: {remaining} of {total} — they never expire.',
    monthlyProgress: 'Monthly Game Credit: {made} of 6 received ($10/month).',
    claimedFuture: "Future perks will also be awarded to Founding Members — you're on the list.",
  },
  es: {
    title1: '¡Eres Miembro Fundador!', title2: '¡Estás en los Segundos 100!',
    intro1: 'Eres una de las primeras 100 personas en registrarse en One2OneLove con usuario, correo y contraseña.',
    intro2: 'Eres una de las siguientes 100 personas en registrarse en One2OneLove con usuario, correo y contraseña.',
    grantLine: 'Tus beneficios Fundadores: {amount} en CRÉDITO DE JUEGO y {sends}.',
    sends2: '2 ENVÍOS DE NOTAS DE AMOR GRATIS', sends1: '1 ENVÍO DE NOTA DE AMOR GRATIS',
    monthlyLine: 'Además, al reclamar: $10 en Crédito de Juego cada mes durante 6 meses.',
    futureLine: 'También se otorgarán beneficios futuros a estos Miembros Fundadores.',
    needEmail: 'Actualiza tu perfil con una cuenta de correo para recibir los {amount} de CRÉDITO DE JUEGO Y {sends}.',
    checklistTitle: 'Para reclamar tus beneficios, necesitas:',
    reqCredential: 'Cuenta con usuario y contraseña',
    reqEmail: 'Cuenta de correo en tu perfil',
    reqPhone: 'Número de teléfono verificado',
    reqBalance: 'Al menos $5.00 de Crédito en tu cuenta',
    balanceNow: 'Tu saldo de Crédito: {balance}',
    verifyPhoneCta: 'Verifica tu teléfono',
    addCreditCta: 'Agregar Crédito',
    claimCta: 'Reclamar Mis Beneficios', claiming: 'Reclamando…',
    claimedTitle: 'Beneficios Fundadores Reclamados',
    claimedBody: '{amount} de Crédito de Juego están en tu billetera de juego. Envíos de Notas de Amor gratis listos: {remaining} de {total} — nunca vencen.',
    monthlyProgress: 'Crédito de Juego mensual: {made} de 6 recibidos ($10/mes).',
    claimedFuture: 'También se otorgarán beneficios futuros a los Miembros Fundadores — estás en la lista.',
  },
  fr: {
    title1: 'Vous êtes Membre Fondateur !', title2: 'Vous êtes dans les 100 Suivants !',
    intro1: 'Vous êtes l’une des 100 premières personnes inscrites sur One2OneLove avec un nom d’utilisateur, un e-mail et un mot de passe.',
    intro2: 'Vous êtes l’une des 100 personnes suivantes inscrites sur One2OneLove avec un nom d’utilisateur, un e-mail et un mot de passe.',
    grantLine: 'Vos avantages Fondateur : {amount} en CRÉDIT DE JEU et {sends}.',
    sends2: '2 ENVOIS DE NOTES D’AMOUR GRATUITS', sends1: '1 ENVOI DE NOTE D’AMOUR GRATUIT',
    monthlyLine: 'De plus, après réclamation : 10 $ en Crédit de Jeu chaque mois pendant 6 mois.',
    futureLine: 'Des avantages futurs seront également accordés à ces Membres Fondateurs.',
    needEmail: 'Mettez à jour votre profil avec un compte e-mail pour recevoir les {amount} de CRÉDIT DE JEU ET {sends}.',
    checklistTitle: 'Pour réclamer vos avantages, il vous faut :',
    reqCredential: 'Compte avec nom d’utilisateur et mot de passe',
    reqEmail: 'Compte e-mail dans votre profil',
    reqPhone: 'Numéro de téléphone vérifié',
    reqBalance: 'Au moins 5,00 $ de Crédit dans votre compte',
    balanceNow: 'Votre solde de Crédit : {balance}',
    verifyPhoneCta: 'Vérifiez votre téléphone',
    addCreditCta: 'Ajouter du Crédit',
    claimCta: 'Réclamer Mes Avantages', claiming: 'Réclamation…',
    claimedTitle: 'Avantages Fondateurs Réclamés',
    claimedBody: '{amount} de Crédit de Jeu sont dans votre portefeuille de jeu. Envois de Notes d’Amour gratuits prêts : {remaining} sur {total} — ils n’expirent jamais.',
    monthlyProgress: 'Crédit de Jeu mensuel : {made} sur 6 reçus (10 $/mois).',
    claimedFuture: 'Des avantages futurs seront également accordés aux Membres Fondateurs — vous êtes sur la liste.',
  },
  it: {
    title1: 'Sei un Membro Fondatore!', title2: 'Sei nei Secondi 100!',
    intro1: 'Sei una delle prime 100 persone a registrarsi su One2OneLove con nome utente, email e password.',
    intro2: 'Sei una delle successive 100 persone a registrarsi su One2OneLove con nome utente, email e password.',
    grantLine: 'I tuoi vantaggi Fondatore: {amount} in CREDITO DI GIOCO e {sends}.',
    sends2: '2 INVII DI NOTE D’AMORE GRATUITI', sends1: '1 INVIO DI NOTA D’AMORE GRATUITO',
    monthlyLine: 'Inoltre, dopo la richiesta: $10 in Credito di Gioco ogni mese per 6 mesi.',
    futureLine: 'Vantaggi futuri saranno assegnati anche a questi Membri Fondatori.',
    needEmail: 'Aggiorna il tuo profilo con un account email per ricevere i {amount} di CREDITO DI GIOCO E {sends}.',
    checklistTitle: 'Per richiedere i tuoi vantaggi, ti serve:',
    reqCredential: 'Account con nome utente e password',
    reqEmail: 'Account email nel tuo profilo',
    reqPhone: 'Numero di telefono verificato',
    reqBalance: 'Almeno $5.00 di Credito nel tuo account',
    balanceNow: 'Il tuo saldo Credito: {balance}',
    verifyPhoneCta: 'Verifica il tuo telefono',
    addCreditCta: 'Aggiungi Credito',
    claimCta: 'Richiedi i Miei Vantaggi', claiming: 'Richiesta…',
    claimedTitle: 'Vantaggi Fondatori Richiesti',
    claimedBody: '{amount} di Credito di Gioco sono nel tuo portafoglio di gioco. Invii di Note d’Amore gratuiti pronti: {remaining} di {total} — non scadono mai.',
    monthlyProgress: 'Credito di Gioco mensile: {made} di 6 ricevuti ($10/mese).',
    claimedFuture: 'Vantaggi futuri saranno assegnati anche ai Membri Fondatori — sei nella lista.',
  },
  de: {
    title1: 'Du bist ein Gründungsmitglied!', title2: 'Du bist in den zweiten 100!',
    intro1: 'Du bist eine der ersten 100 Personen, die sich mit Benutzername, E-Mail und Passwort bei One2OneLove registriert haben.',
    intro2: 'Du bist eine der nächsten 100 Personen, die sich mit Benutzername, E-Mail und Passwort bei One2OneLove registriert haben.',
    grantLine: 'Deine Gründer-Vorteile: {amount} SPIEL-CREDIT und {sends}.',
    sends2: '2 KOSTENLOSE LIEBESBOTSCAFT-SENDUNGEN', sends1: '1 KOSTENLOSE LIEBESBOTSCAFT-SENDUNG',
    monthlyLine: 'Plus, nach dem Einlösen: $10 Spiel-Credit jeden Monat für 6 Monate.',
    futureLine: 'Zukünftige Vorteile werden auch an diese Gründungsmitglieder vergeben.',
    needEmail: 'Aktualisiere dein Profil mit einem E-Mail-Konto, um die {amount} SPIEL-CREDIT UND {sends} zu erhalten.',
    checklistTitle: 'Zum Einlösen brauchst du:',
    reqCredential: 'Konto mit Benutzername & Passwort',
    reqEmail: 'E-Mail-Konto in deinem Profil',
    reqPhone: 'Telefonnummer verifiziert',
    reqBalance: 'Mindestens $5.00 Credit in deinem Konto',
    balanceNow: 'Dein Credit-Guthaben: {balance}',
    verifyPhoneCta: 'Telefon verifizieren',
    addCreditCta: 'Credit Hinzufügen',
    claimCta: 'Meine Vorteile Einlösen', claiming: 'Wird eingelöst…',
    claimedTitle: 'Gründer-Vorteile Eingelöst',
    claimedBody: '{amount} Spiel-Credit sind in deiner Spiel-Wallet. Kostenlose Liebesbotschaft-Sendungen bereit: {remaining} von {total} — sie verfallen nie.',
    monthlyProgress: 'Monatlicher Spiel-Credit: {made} von 6 erhalten ($10/Monat).',
    claimedFuture: 'Zukünftige Vorteile werden auch an Gründungsmitglieder vergeben — du bist auf der Liste.',
  },
};

const moneyShort = cents => {
  const value = Number(cents || 0) / 100;
  return value % 1 === 0 ? `$${value}` : `$${value.toFixed(2)}`;
};
const moneyFull = cents => `$${(Number(cents || 0) / 100).toFixed(2)}`;
const fill = (text, values) => Object.entries(values).reduce(
  (out, [key, value]) => out.split(`{${key}}`).join(String(value)),
  String(text || ''),
);

export default function FoundingPerkNotice({ currentLanguage = 'en' }) {
  const t = COPY[currentLanguage] || COPY.en;
  const [status, setStatus] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const load = () => apiRequest('/api/founding-perks/status')
    .then(payload => { if (payload?.ok) setStatus(payload.founding || null); })
    .catch(() => {});

  useEffect(() => {
    let active = true;
    apiRequest('/api/founding-perks/status')
      .then(payload => { if (active && payload?.ok) setStatus(payload.founding || null); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!status?.eligible) return null;

  const tier1 = status.tier === 'first100';
  const amount = moneyShort(status.gameCreditCents);
  const sends = status.freeLoveNoteSends === 1 ? t.sends1 : t.sends2;
  const requirements = status.requirements?.requirements || {};
  const allMet = Boolean(status.requirements?.allMet);
  const emailMissing = requirements.email && !requirements.email.met;

  const claim = async () => {
    setClaiming(true);
    try {
      const payload = await apiRequest('/api/founding-perks/claim', { method: 'POST', body: {} });
      if (payload?.founding) setStatus(payload.founding);
    } catch (error) {
      toast.error(error?.message || t.claimCta);
      load();
    } finally {
      setClaiming(false);
    }
  };

  const rows = [
    { key: 'credential', label: t.reqCredential, met: Boolean(requirements.credential?.met) },
    { key: 'email', label: t.reqEmail, met: Boolean(requirements.email?.met) },
    {
      key: 'phone', label: t.reqPhone, met: Boolean(requirements.phoneVerified?.met),
      fix: !requirements.phoneVerified?.met
        ? <Link to="/VerifyPhone" className="font-bold text-purple-700 underline">{t.verifyPhoneCta}</Link>
        : null,
    },
    {
      key: 'balance',
      label: `${t.reqBalance} · ${fill(t.balanceNow, { balance: moneyFull(requirements.minBalance?.balanceCents) })}`,
      met: Boolean(requirements.minBalance?.met),
      fix: !requirements.minBalance?.met
        ? <Link to="/Credit" className="font-bold text-purple-700 underline">{t.addCreditCta}</Link>
        : null,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
      <Card className="border-2 border-amber-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {status.claimed ? t.claimedTitle : (tier1 ? t.title1 : t.title2)}
            </h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.claimed ? (
            <>
              <p className="text-sm leading-6 text-gray-700">
                {fill(t.claimedBody, { amount, remaining: status.freeSendsRemaining, total: status.freeLoveNoteSends })}
              </p>
              {status.monthly?.receives && (
                <p className="text-sm leading-6 text-gray-700">
                  {fill(t.monthlyProgress, { made: status.monthly.grantsMade || 0 })}
                </p>
              )}
              {status.futurePerks && (
                <p className="text-sm font-semibold leading-6 text-purple-800">{t.claimedFuture}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm leading-6 text-gray-700">{tier1 ? t.intro1 : t.intro2}</p>
              <p className="text-sm font-semibold leading-6 text-gray-800">
                {fill(t.grantLine, { amount, sends })}
              </p>
              {status.monthly?.receives && (
                <p className="text-sm leading-6 text-gray-700">{t.monthlyLine}</p>
              )}
              {status.futurePerks && (
                <p className="text-sm leading-6 text-gray-700">{t.futureLine}</p>
              )}
              {emailMissing && (
                <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-900">
                  {fill(t.needEmail, { amount, sends })}
                </p>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">{t.checklistTitle}</p>
                <div className="mt-2 space-y-2">
                  {rows.map(row => (
                    <div key={row.key} className="flex items-center gap-2 text-sm text-gray-700">
                      {row.met
                        ? <Check className="h-4 w-4 flex-shrink-0 text-green-600" />
                        : <Circle className="h-4 w-4 flex-shrink-0 text-gray-400" />}
                      <span>{row.label}</span>
                      {row.fix}
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={claim} disabled={!allMet || claiming} className="w-full">
                {claiming ? t.claiming : t.claimCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
