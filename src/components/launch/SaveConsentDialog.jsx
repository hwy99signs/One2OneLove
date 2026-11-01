import React, { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/Layout';
import { apiRequest } from '@/lib/apiClient';
import { registerSaveConsentHandler, SAVE_CONSENT_VERSION } from '@/lib/saveConsentBus';

// Owner rule (2026-11-01): members can create memories, journals, goals and the
// like, but must accept the Terms of Service AND Disclaimer before anything is
// saved or sent. Shown once, the first time a save is attempted.
const copy = {
  en:{title:'Before you save',intro:'To save or send anything on One2OneLove, please read and accept our Terms of Service and Disclaimer.',
    disclaimerTitle:'Disclaimer',
    disclaimer:['One2OneLove provides relationship education, games, and tools for general information and entertainment. It is not therapy, counseling, or medical, mental-health, legal, or financial advice, and it is not a substitute for a qualified professional.','You are responsible for what you create, save, share, and send, including having permission to share anything about other people.','Features are provided “as is,” as described in the Terms of Service. If you are in danger or in crisis, contact your local emergency number (in the U.S., call or text 988).'],
    terms:'I have read and agree to the One2OneLove',termsLink:'Terms of Service',and:'and the Disclaimer above.',age:'I confirm I am 18 or older.',
    accept:'I agree — save',cancel:'Not now',saving:'Saving…',error:'We could not record your agreement. Please try again.'},
  es:{title:'Antes de guardar',intro:'Para guardar o enviar algo en One2OneLove, lee y acepta nuestros Términos del Servicio y el Aviso Legal.',
    disclaimerTitle:'Aviso legal',
    disclaimer:['One2OneLove ofrece educación sobre relaciones, juegos y herramientas con fines informativos y de entretenimiento. No es terapia, asesoría ni consejo médico, de salud mental, legal o financiero, y no sustituye a un profesional calificado.','Eres responsable de lo que creas, guardas, compartes y envías, incluido tener permiso para compartir información sobre otras personas.','Las funciones se ofrecen “tal cual”, según los Términos del Servicio. Si estás en peligro o en crisis, comunícate con tu número local de emergencia (en EE. UU., llama o envía un mensaje al 988).'],
    terms:'He leído y acepto los',termsLink:'Términos del Servicio',and:'de One2OneLove y el Aviso Legal anterior.',age:'Confirmo que tengo 18 años o más.',
    accept:'Acepto — guardar',cancel:'Ahora no',saving:'Guardando…',error:'No pudimos registrar tu aceptación. Inténtalo de nuevo.'},
  fr:{title:'Avant d’enregistrer',intro:'Pour enregistrer ou envoyer quoi que ce soit sur One2OneLove, veuillez lire et accepter nos Conditions d’utilisation et l’Avertissement.',
    disclaimerTitle:'Avertissement',
    disclaimer:['One2OneLove propose de l’éducation relationnelle, des jeux et des outils à des fins d’information générale et de divertissement. Ce n’est pas une thérapie, ni un conseil médical, psychologique, juridique ou financier, et cela ne remplace pas un professionnel qualifié.','Vous êtes responsable de ce que vous créez, enregistrez, partagez et envoyez, y compris d’avoir l’autorisation de partager des informations sur d’autres personnes.','Les fonctionnalités sont fournies « en l’état », comme décrit dans les Conditions d’utilisation. Si vous êtes en danger ou en crise, contactez votre numéro d’urgence local (aux États-Unis, appelez ou écrivez au 988).'],
    terms:'J’ai lu et j’accepte les',termsLink:'Conditions d’utilisation',and:'de One2OneLove et l’Avertissement ci-dessus.',age:'Je confirme avoir 18 ans ou plus.',
    accept:'J’accepte — enregistrer',cancel:'Pas maintenant',saving:'Enregistrement…',error:'Nous n’avons pas pu enregistrer votre accord. Veuillez réessayer.'},
  it:{title:'Prima di salvare',intro:'Per salvare o inviare qualsiasi cosa su One2OneLove, leggi e accetta i nostri Termini di Servizio e la Dichiarazione di esclusione di responsabilità.',
    disclaimerTitle:'Esclusione di responsabilità',
    disclaimer:['One2OneLove offre educazione relazionale, giochi e strumenti a scopo informativo e di intrattenimento. Non è terapia, consulenza né consiglio medico, psicologico, legale o finanziario, e non sostituisce un professionista qualificato.','Sei responsabile di ciò che crei, salvi, condividi e invii, incluso avere il permesso di condividere informazioni su altre persone.','Le funzioni sono fornite “così come sono”, come descritto nei Termini di Servizio. Se sei in pericolo o in crisi, contatta il numero di emergenza locale (negli Stati Uniti, chiama o scrivi al 988).'],
    terms:'Ho letto e accetto i',termsLink:'Termini di Servizio',and:'di One2OneLove e l’Esclusione di responsabilità sopra.',age:'Confermo di avere almeno 18 anni.',
    accept:'Accetto — salva',cancel:'Non ora',saving:'Salvataggio…',error:'Non siamo riusciti a registrare il tuo consenso. Riprova.'},
  de:{title:'Vor dem Speichern',intro:'Um auf One2OneLove etwas zu speichern oder zu senden, lesen und akzeptieren Sie bitte unsere Nutzungsbedingungen und den Haftungsausschluss.',
    disclaimerTitle:'Haftungsausschluss',
    disclaimer:['One2OneLove bietet Beziehungswissen, Spiele und Tools zur allgemeinen Information und Unterhaltung. Es ist keine Therapie, Beratung oder medizinische, psychologische, rechtliche oder finanzielle Beratung und ersetzt keine qualifizierte Fachperson.','Sie sind verantwortlich für alles, was Sie erstellen, speichern, teilen und senden, einschließlich der Erlaubnis, Informationen über andere Personen zu teilen.','Funktionen werden „wie besehen“ bereitgestellt, wie in den Nutzungsbedingungen beschrieben. Wenn Sie in Gefahr oder in einer Krise sind, wenden Sie sich an Ihre örtliche Notrufnummer (in den USA: Anruf oder SMS an 988).'],
    terms:'Ich habe die',termsLink:'Nutzungsbedingungen',and:'von One2OneLove und den obigen Haftungsausschluss gelesen und stimme zu.',age:'Ich bestätige, dass ich mindestens 18 Jahre alt bin.',
    accept:'Ich stimme zu — speichern',cancel:'Nicht jetzt',saving:'Speichern…',error:'Ihre Zustimmung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.'},
};

export default function SaveConsentDialog() {
  const { currentLanguage } = useLanguage() || {};
  const t = copy[currentLanguage] || copy.en;
  const [open, setOpen] = useState(false);
  const [agree, setAgree] = useState(false);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const resolver = useRef(null);

  useEffect(() => registerSaveConsentHandler(() => new Promise((resolve) => {
    resolver.current = resolve;
    setAgree(false); setAdult(false); setError(''); setOpen(true);
  })), []);

  const finish = (value) => { setOpen(false); const r = resolver.current; resolver.current = null; if (r) r(value); };

  const accept = async () => {
    setBusy(true); setError('');
    try {
      await apiRequest('/api/consents/terms', { method:'PUT', body:{ accepted:true, age18Confirmed:true, version:SAVE_CONSENT_VERSION, language:currentLanguage || 'en', source:'save_terms_disclaimer' } });
      finish(true);
    } catch {
      setError(t.error);
    } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <div data-save-consent-dialog className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="save-consent-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 shrink-0 text-rose-600"/><h2 id="save-consent-title" className="text-xl font-black text-slate-900">{t.title}</h2></div>
        <p className="mt-3 text-sm leading-6 text-slate-700">{t.intro}</p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-black text-slate-900">{t.disclaimerTitle}</h3>
          {t.disclaimer.map((line) => <p key={line} className="mt-2 text-sm leading-6 text-slate-700">{line}</p>)}
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-slate-800">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4"/>
          <span>{t.terms} <a href="/TermsOfService" target="_blank" rel="noopener noreferrer" className="font-bold text-rose-600 underline">{t.termsLink}</a> {t.and}</span>
        </label>
        <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-slate-800">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1 h-4 w-4"/>
          <span>{t.age}</span>
        </label>
        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => finish(false)} disabled={busy}>{t.cancel}</Button>
          <Button type="button" onClick={accept} disabled={!agree || !adult || busy} className="bg-rose-600 hover:bg-rose-700">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{t.saving}</> : t.accept}
          </Button>
        </div>
      </div>
    </div>
  );
}
