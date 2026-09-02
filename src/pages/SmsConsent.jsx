import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, MessageSquareText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/Layout';
import {
  normalizeSmsConsentPhone,
  submitSmsConsent,
} from '@/lib/smsConsentService';

const COPY = {
  en: {
    back: 'Back to Love Notes',
    badge: 'OPTIONAL SMS CONSENT',
    title: 'Choose whether One2OneLove may text this number.',
    intro: 'SMS is optional. You can keep using One2OneLove and receive Love Note invitations by email without agreeing to text messages.',
    preview: 'SMS delivery is not active yet. This consent experience is being prepared for the controlled relaunch and final legal/provider approval.',
    phone: 'Your mobile number',
    phoneHelp: 'Include the country code, for example +15551234567.',
    language: 'SMS language',
    owner: 'I confirm this is my mobile number and I control this number.',
    consent: 'I voluntarily agree to receive transactional Love Note invitations and required SMS service messages from One2OneLove at this number.',
    disclosureTitle: 'Before you opt in',
    disclosure: 'Message frequency varies. Message and data rates may apply. Reply STOP to cancel. Reply HELP for help. This consent does not include marketing or promotional text messages and is not required to use One2OneLove.',
    legal: 'Review the SMS-related terms and privacy disclosures before opting in. The relaunch legal documents are still marked for final review.',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    submit: 'Save my SMS choice',
    saving: 'Saving…',
    required: 'Please confirm both that you control this number and that you voluntarily agree to SMS.',
    invalid: 'Enter a mobile number with its country code, such as +15551234567.',
    unavailable: 'SMS consent capture is not active in production yet. Your choice was not submitted and no text message was sent.',
    success: 'Your SMS consent choice was recorded. This does not activate SMS delivery by itself.',
    safe: 'One2OneLove does not make SMS consent a condition of membership, account access, or using email Love Notes.',
    support: 'Help Center',
  },
  es: {
    back: 'Volver a Notas de Amor', badge: 'CONSENTIMIENTO SMS OPCIONAL', title: 'Elige si One2OneLove puede enviar mensajes de texto a este número.',
    intro: 'Los SMS son opcionales. Puedes seguir usando One2OneLove y recibir invitaciones de Notas de Amor por correo electrónico sin aceptar mensajes de texto.',
    preview: 'La entrega por SMS aún no está activa. Esta experiencia de consentimiento se está preparando para el relanzamiento controlado y la aprobación legal y del proveedor.',
    phone: 'Tu número móvil', phoneHelp: 'Incluye el código de país, por ejemplo +15551234567.', language: 'Idioma de los SMS',
    owner: 'Confirmo que este es mi número móvil y que controlo este número.',
    consent: 'Acepto voluntariamente recibir invitaciones transaccionales de Notas de Amor y mensajes SMS de servicio necesarios de One2OneLove en este número.',
    disclosureTitle: 'Antes de aceptar', disclosure: 'La frecuencia de los mensajes varía. Pueden aplicarse tarifas de mensajes y datos. Responde STOP para cancelar. Responde HELP para obtener ayuda. Este consentimiento no incluye mensajes de marketing o promoción y no es necesario para usar One2OneLove.',
    legal: 'Revisa los términos y avisos de privacidad relacionados con SMS antes de aceptar. Los documentos legales del relanzamiento aún están marcados para revisión final.',
    terms: 'Términos de Servicio', privacy: 'Política de Privacidad', submit: 'Guardar mi elección de SMS', saving: 'Guardando…',
    required: 'Confirma que controlas este número y que aceptas voluntariamente los SMS.', invalid: 'Introduce un número móvil con su código de país, como +15551234567.',
    unavailable: 'El registro de consentimiento SMS aún no está activo en producción. Tu elección no fue enviada y no se envió ningún mensaje de texto.',
    success: 'Tu elección de consentimiento SMS fue registrada. Esto no activa por sí solo la entrega por SMS.',
    safe: 'One2OneLove no exige el consentimiento SMS para la membresía, el acceso a la cuenta ni el uso de Notas de Amor por correo electrónico.', support: 'Centro de Ayuda',
  },
  fr: {
    back: 'Retour aux Mots d’Amour', badge: 'CONSENTEMENT SMS FACULTATIF', title: 'Choisissez si One2OneLove peut envoyer des SMS à ce numéro.',
    intro: 'Les SMS sont facultatifs. Vous pouvez continuer à utiliser One2OneLove et recevoir les invitations aux Mots d’Amour par e-mail sans accepter les SMS.',
    preview: 'L’envoi par SMS n’est pas encore actif. Cette expérience de consentement est préparée pour la relance contrôlée et l’approbation juridique et fournisseur finale.',
    phone: 'Votre numéro de mobile', phoneHelp: 'Incluez l’indicatif du pays, par exemple +15551234567.', language: 'Langue des SMS',
    owner: 'Je confirme qu’il s’agit de mon numéro de mobile et que je contrôle ce numéro.',
    consent: 'J’accepte volontairement de recevoir à ce numéro des invitations transactionnelles aux Mots d’Amour et les SMS de service nécessaires de One2OneLove.',
    disclosureTitle: 'Avant de vous inscrire', disclosure: 'La fréquence des messages varie. Des frais de messagerie et de données peuvent s’appliquer. Répondez STOP pour annuler. Répondez HELP pour obtenir de l’aide. Ce consentement n’inclut pas les SMS marketing ou promotionnels et n’est pas requis pour utiliser One2OneLove.',
    legal: 'Consultez les conditions et informations de confidentialité liées aux SMS avant de vous inscrire. Les documents juridiques de la relance restent soumis à une revue finale.',
    terms: 'Conditions d’utilisation', privacy: 'Politique de confidentialité', submit: 'Enregistrer mon choix SMS', saving: 'Enregistrement…',
    required: 'Confirmez que vous contrôlez ce numéro et que vous acceptez volontairement les SMS.', invalid: 'Saisissez un numéro de mobile avec son indicatif pays, par exemple +15551234567.',
    unavailable: 'La collecte du consentement SMS n’est pas encore active en production. Votre choix n’a pas été soumis et aucun SMS n’a été envoyé.',
    success: 'Votre choix de consentement SMS a été enregistré. Cela n’active pas à lui seul l’envoi par SMS.',
    safe: 'One2OneLove ne conditionne pas l’adhésion, l’accès au compte ou les Mots d’Amour par e-mail au consentement SMS.', support: 'Centre d’aide',
  },
  it: {
    back: 'Torna alle Note d’Amore', badge: 'CONSENSO SMS FACOLTATIVO', title: 'Scegli se One2OneLove può inviare SMS a questo numero.',
    intro: 'Gli SMS sono facoltativi. Puoi continuare a usare One2OneLove e ricevere inviti alle Note d’Amore via email senza accettare messaggi di testo.',
    preview: 'La consegna via SMS non è ancora attiva. Questa esperienza di consenso è in preparazione per il rilancio controllato e l’approvazione legale e del provider.',
    phone: 'Il tuo numero di cellulare', phoneHelp: 'Includi il prefisso internazionale, ad esempio +15551234567.', language: 'Lingua degli SMS',
    owner: 'Confermo che questo è il mio numero di cellulare e che controllo questo numero.',
    consent: 'Accetto volontariamente di ricevere a questo numero inviti transazionali alle Note d’Amore e i necessari messaggi SMS di servizio da One2OneLove.',
    disclosureTitle: 'Prima di aderire', disclosure: 'La frequenza dei messaggi varia. Potrebbero essere applicati costi per messaggi e dati. Rispondi STOP per annullare. Rispondi HELP per assistenza. Questo consenso non include messaggi di marketing o promozionali e non è necessario per usare One2OneLove.',
    legal: 'Consulta i termini e le informative sulla privacy relativi agli SMS prima di aderire. I documenti legali del rilancio sono ancora contrassegnati per la revisione finale.',
    terms: 'Termini di Servizio', privacy: 'Informativa sulla Privacy', submit: 'Salva la mia scelta SMS', saving: 'Salvataggio…',
    required: 'Conferma sia di controllare questo numero sia di accettare volontariamente gli SMS.', invalid: 'Inserisci un numero di cellulare con il prefisso internazionale, ad esempio +15551234567.',
    unavailable: 'La raccolta del consenso SMS non è ancora attiva in produzione. La tua scelta non è stata inviata e non è stato inviato alcun SMS.',
    success: 'La tua scelta di consenso SMS è stata registrata. Questo non attiva da solo la consegna via SMS.',
    safe: 'One2OneLove non richiede il consenso SMS per l’abbonamento, l’accesso all’account o l’uso delle Note d’Amore via email.', support: 'Centro Assistenza',
  },
  de: {
    back: 'Zurück zu Liebesnotizen', badge: 'OPTIONALE SMS-EINWILLIGUNG', title: 'Entscheide, ob One2OneLove SMS an diese Nummer senden darf.',
    intro: 'SMS sind optional. Du kannst One2OneLove weiterhin nutzen und Einladungen zu Liebesnotizen per E-Mail erhalten, ohne SMS zuzustimmen.',
    preview: 'Die SMS-Zustellung ist noch nicht aktiv. Diese Einwilligungsfunktion wird für den kontrollierten Relaunch und die abschließende rechtliche und Anbieterfreigabe vorbereitet.',
    phone: 'Deine Mobilnummer', phoneHelp: 'Gib die Landesvorwahl an, zum Beispiel +15551234567.', language: 'SMS-Sprache',
    owner: 'Ich bestätige, dass dies meine Mobilnummer ist und ich diese Nummer kontrolliere.',
    consent: 'Ich stimme freiwillig zu, an diese Nummer transaktionale Einladungen zu Liebesnotizen und erforderliche SMS-Servicenachrichten von One2OneLove zu erhalten.',
    disclosureTitle: 'Vor deiner Zustimmung', disclosure: 'Die Nachrichtenhäufigkeit variiert. Nachrichten- und Datentarife können anfallen. Antworte STOP zum Abbestellen. Antworte HELP für Hilfe. Diese Einwilligung umfasst keine Marketing- oder Werbe-SMS und ist für die Nutzung von One2OneLove nicht erforderlich.',
    legal: 'Lies vor der Zustimmung die SMS-bezogenen Bedingungen und Datenschutzhinweise. Die rechtlichen Relaunch-Dokumente sind weiterhin zur abschließenden Prüfung markiert.',
    terms: 'Nutzungsbedingungen', privacy: 'Datenschutzrichtlinie', submit: 'Meine SMS-Auswahl speichern', saving: 'Wird gespeichert…',
    required: 'Bestätige, dass du diese Nummer kontrollierst und den SMS freiwillig zustimmst.', invalid: 'Gib eine Mobilnummer mit Landesvorwahl ein, zum Beispiel +15551234567.',
    unavailable: 'Die Erfassung der SMS-Einwilligung ist in der Produktion noch nicht aktiv. Deine Auswahl wurde nicht übermittelt und es wurde keine SMS gesendet.',
    success: 'Deine SMS-Einwilligung wurde gespeichert. Dadurch wird die SMS-Zustellung nicht automatisch aktiviert.',
    safe: 'One2OneLove macht die SMS-Einwilligung nicht zur Voraussetzung für Mitgliedschaft, Kontozugang oder Liebesnotizen per E-Mail.', support: 'Hilfe-Center',
  },
};

const LANGUAGE_OPTIONS = [
  ['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['it', 'Italiano'], ['de', 'Deutsch'],
];

export default function SmsConsent() {
  const { currentLanguage } = useLanguage();
  const activeLanguage = COPY[currentLanguage] ? currentLanguage : 'en';
  const t = COPY[activeLanguage];
  const [phone, setPhone] = useState('');
  const [smsLanguage, setSmsLanguage] = useState(activeLanguage);
  const [ownsNumber, setOwnsNumber] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setSmsLanguage(activeLanguage), [activeLanguage]);

  const phoneValid = useMemo(() => Boolean(normalizeSmsConsentPhone(phone)), [phone]);
  const canSubmit = phoneValid && ownsNumber && consentChecked && !busy;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');
    if (!phoneValid) {
      setStatus(t.invalid);
      return;
    }
    if (!ownsNumber || !consentChecked) {
      setStatus(t.required);
      return;
    }

    setBusy(true);
    try {
      await submitSmsConsent({ phone, language: smsLanguage, consentChecked, ownsNumber });
      setStatus(t.success);
    } catch (error) {
      if (error?.code === 'SMS_PHONE_E164_REQUIRED') setStatus(t.invalid);
      else if (error?.code === 'EXPLICIT_RECIPIENT_CONSENT_REQUIRED') setStatus(t.required);
      else setStatus(t.unavailable);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-violet-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/LoveNotes" className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />{t.back}
        </Link>

        <section className="mt-6 rounded-[2rem] border border-white bg-white p-6 shadow-xl sm:p-9">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-pink-700"><MessageSquareText className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-700">{t.badge}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{t.title}</h1>
              <p className="mt-3 leading-7 text-slate-600">{t.intro}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">{t.preview}</div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-6">
            <div>
              <label htmlFor="sms-consent-phone" className="text-sm font-black text-slate-700">{t.phone}</label>
              <input id="sms-consent-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 32))} placeholder="+15551234567" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pink-300 focus:ring-4 focus:ring-pink-100" />
              <p className="mt-2 text-xs leading-5 text-slate-500">{t.phoneHelp}</p>
            </div>

            <div>
              <label htmlFor="sms-consent-language" className="text-sm font-black text-slate-700">{t.language}</label>
              <select id="sms-consent-language" value={smsLanguage} onChange={(e) => setSmsLanguage(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100">
                {LANGUAGE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
                <input type="checkbox" checked={ownsNumber} onChange={(e) => setOwnsNumber(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                <span>{t.owner}</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-sm font-semibold leading-6 text-slate-700">
                <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                <span>{t.consent}</span>
              </label>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 text-sm leading-6 text-violet-950">
              <div className="flex items-center gap-2 font-black"><ShieldCheck className="h-4 w-4" />{t.disclosureTitle}</div>
              <p className="mt-2">{t.disclosure}</p>
              <p className="mt-3 text-xs font-semibold text-violet-900/80">{t.safe}</p>
            </div>

            <div className="text-sm leading-6 text-slate-600">
              <p>{t.legal}</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 font-black text-purple-700">
                <Link to="/TermsOfService" className="underline underline-offset-4">{t.terms}</Link>
                <Link to="/PrivacyPolicy" className="underline underline-offset-4">{t.privacy}</Link>
                <Link to="/HelpCenter" className="underline underline-offset-4">{t.support}</Link>
              </div>
            </div>

            {status && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold leading-6 text-slate-700">{status}</div>}

            <button type="submit" disabled={!canSubmit} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-pink-600 px-5 py-3.5 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-40">
              <CheckCircle2 className="h-4 w-4" />{busy ? t.saving : t.submit}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
