import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, LockKeyhole, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const COPY = {
  en: { close:'Close', setupTitle:'Finish Your Membership Setup', setupBody:'To use One2OneLove member features, complete membership setup with a credit or debit card. Your first One2OneLove SMS Love Note send during the trial is FREE; every additional send is US$0.29.', requiredTitle:plan=>`${plan} Access Required`, requiredBody:plan=>`The feature you selected is included with ${plan}. Compare the plans below to continue.` },
  es: { close:'Cerrar', setupTitle:'Completa la Configuración de Tu Membresía', setupBody:'Para usar las funciones de miembro de One2OneLove, completa la configuración de la membresía con una tarjeta de crédito o débito. Tu primer envío SMS de Nota de Amor durante la prueba es GRATIS; cada envío adicional cuesta US$0.29.', requiredTitle:plan=>`Se Requiere Acceso ${plan}`, requiredBody:plan=>`La función seleccionada está incluida con ${plan}. Compara los planes a continuación para continuar.` },
  fr: { close:'Fermer', setupTitle:'Terminez la Configuration de Votre Abonnement', setupBody:'Pour utiliser les fonctionnalités membres One2OneLove, terminez la configuration de votre abonnement avec une carte de crédit ou de débit. Votre premier envoi de Note d’Amour par SMS pendant l’essai est GRATUIT ; chaque envoi supplémentaire coûte US$0.29.', requiredTitle:plan=>`Accès ${plan} Requis`, requiredBody:plan=>`La fonctionnalité sélectionnée est incluse avec ${plan}. Comparez les formules ci-dessous pour continuer.` },
  it: { close:'Chiudi', setupTitle:'Completa la Configurazione del Tuo Abbonamento', setupBody:'Per usare le funzioni per membri One2OneLove, completa la configurazione dell’abbonamento con una carta di credito o debito. Il primo invio SMS di una Nota d’Amore durante la prova è GRATIS; ogni invio successivo costa US$0.29.', requiredTitle:plan=>`Accesso ${plan} Richiesto`, requiredBody:plan=>`La funzione selezionata è inclusa con ${plan}. Confronta i piani qui sotto per continuare.` },
  de: { close:'Schließen', setupTitle:'Mitgliedschaft Fertig Einrichten', setupBody:'Um One2OneLove-Mitgliederfunktionen zu verwenden, schließen Sie die Mitgliedschaftseinrichtung mit einer Kredit- oder Debitkarte ab. Ihre erste SMS-Liebesnachricht während des Tests ist KOSTENLOS; jede weitere Sendung kostet US$0.29.', requiredTitle:plan=>`${plan}-Zugang Erforderlich`, requiredBody:plan=>`Die ausgewählte Funktion ist in ${plan} enthalten. Vergleichen Sie unten die Pläne, um fortzufahren.` },
};

function language() {
  try {
    const value = localStorage.getItem('preferredLanguage') || 'en';
    return COPY[value] ? value : 'en';
  } catch (_) { return 'en'; }
}

export default function SubscriptionLaunchNotice() {
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [location.pathname, location.search]);

  const notice = useMemo(() => {
    if (location.pathname.toLowerCase() !== '/subscription') return null;
    const params = new URLSearchParams(location.search);
    const setup = params.get('setup') === 'required';
    const required = params.get('required');
    if (!setup && !required) return null;
    const t = COPY[language()] || COPY.en;
    const normalizedPlan = required === 'Premier' ? 'Premiere' : required;
    return setup
      ? { title:t.setupTitle, body:t.setupBody, type:'setup', close:t.close }
      : { title:t.requiredTitle(normalizedPlan || 'Premiere'), body:t.requiredBody(normalizedPlan || 'Premiere'), type:'required', close:t.close };
  }, [location.pathname, location.search]);

  if (!notice || dismissed) return null;
  const Icon = notice.type === 'setup' ? CreditCard : LockKeyhole;

  return (
    <div className="mx-auto mt-4 w-full max-w-[1400px] px-4 sm:px-6 lg:px-8" data-o2ol-subscription-launch-notice="true">
      <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700"><Icon className="h-5 w-5"/></div>
          <div className="min-w-0 flex-1"><h2 className="text-lg font-black text-gray-900">{notice.title}</h2><p className="mt-1 text-sm leading-6 text-gray-600">{notice.body}</p></div>
          <button type="button" onClick={() => setDismissed(true)} aria-label={notice.close} title={notice.close} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
