import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, LockKeyhole, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const COPY = {
  en: { close:'Close', setupTitle:'Finish Your Membership Setup', setupBody:'Your 24-hour Guest Preview is available without a card and is VIEW ONLY. To use One2OneLove features, add a credit or debit card. Eligible Founding Members automatically receive the 30-day Founding Member offer; the retired 7-day trial is no longer available.', requiredTitle:plan=>`${plan} Access Required`, requiredBody:plan=>`The feature you selected is included with ${plan}. Compare the plans below to continue.` },
  es: { close:'Cerrar', setupTitle:'Completa la Configuración de Tu Membresía', setupBody:'Tu Vista Previa de Invitado de 24 horas está disponible sin tarjeta y es SOLO PARA VER. Para usar las funciones de One2OneLove, añade una tarjeta de crédito o débito. Los Miembros Fundadores elegibles reciben automáticamente la oferta fundadora de 30 días; la antigua prueba de 7 días ya no está disponible.', requiredTitle:plan=>`Se Requiere Acceso ${plan}`, requiredBody:plan=>`La función seleccionada está incluida con ${plan}. Compara los planes a continuación para continuar.` },
  fr: { close:'Fermer', setupTitle:'Terminez la Configuration de Votre Abonnement', setupBody:'Votre Aperçu Invité de 24 heures est disponible sans carte et en CONSULTATION UNIQUEMENT. Pour utiliser les fonctionnalités One2OneLove, ajoutez une carte de crédit ou de débit. Les Membres Fondateurs éligibles reçoivent automatiquement l’offre de 30 jours ; l’ancien essai de 7 jours n’est plus disponible.', requiredTitle:plan=>`Accès ${plan} Requis`, requiredBody:plan=>`La fonctionnalité sélectionnée est incluse avec ${plan}. Comparez les formules ci-dessous pour continuer.` },
  it: { close:'Chiudi', setupTitle:'Completa la Configurazione del Tuo Abbonamento', setupBody:'L’Anteprima Ospite di 24 ore è disponibile senza carta ed è SOLO VISUALIZZAZIONE. Per usare le funzioni One2OneLove, aggiungi una carta di credito o debito. I Membri Fondatori idonei ricevono automaticamente l’offerta di 30 giorni; la precedente prova di 7 giorni non è più disponibile.', requiredTitle:plan=>`Accesso ${plan} Richiesto`, requiredBody:plan=>`La funzione selezionata è inclusa con ${plan}. Confronta i piani qui sotto per continuare.` },
  de: { close:'Schließen', setupTitle:'Mitgliedschaft Fertig Einrichten', setupBody:'Die 24-stündige Gastvorschau ist ohne Karte verfügbar und NUR ZUM ANSEHEN. Um One2OneLove-Funktionen zu verwenden, fügen Sie eine Kredit- oder Debitkarte hinzu. Berechtigte Gründungsmitglieder erhalten automatisch das 30-Tage-Gründungsangebot; der frühere 7-Tage-Test ist nicht mehr verfügbar.', requiredTitle:plan=>`${plan}-Zugang Erforderlich`, requiredBody:plan=>`Die ausgewählte Funktion ist in ${plan} enthalten. Vergleichen Sie unten die Pläne, um fortzufahren.` },
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
