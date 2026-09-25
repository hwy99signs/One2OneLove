import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, LockKeyhole } from 'lucide-react';

const COPY = {
  en: { setupTitle:'Finish Your Membership Setup', setupBody:'Your 24-hour Guest Preview is available without a card and is VIEW ONLY. To use One2OneLove features, start the 7-day Full Access trial with a credit or debit card. The subscription price is not charged today. Your first One2OneLove SMS Love Note send during the trial is FREE; every additional send is US$0.29.', requiredTitle:plan=>`${plan} Access Required`, requiredBody:plan=>`The feature you selected is included with ${plan}. Compare the plans below to continue.` },
  es: { setupTitle:'Completa la Configuración de Tu Membresía', setupBody:'Tu Vista Previa de Invitado de 24 horas está disponible sin tarjeta y es SOLO PARA VER. Para usar las funciones de One2OneLove, inicia la prueba de Acceso Completo de 7 días con una tarjeta. Hoy no se cobra el precio de la suscripción. Tu primer envío SMS de Nota de Amor durante la prueba es GRATIS; cada envío adicional cuesta US$0.29.', requiredTitle:plan=>`Se Requiere Acceso ${plan}`, requiredBody:plan=>`La función seleccionada está incluida con ${plan}. Compara los planes a continuación para continuar.` },
  fr: { setupTitle:'Terminez la Configuration de Votre Abonnement', setupBody:'Votre Aperçu Invité de 24 heures est disponible sans carte et est réservé à la CONSULTATION. Pour utiliser les fonctionnalités One2OneLove, commencez l’essai de 7 jours avec Accès Complet avec une carte. Le prix de l’abonnement n’est pas débité aujourd’hui. Votre premier envoi SMS de Note d’Amour pendant l’essai est GRATUIT ; chaque envoi supplémentaire coûte US$0.29.', requiredTitle:plan=>`Accès ${plan} Requis`, requiredBody:plan=>`La fonctionnalité sélectionnée est incluse avec ${plan}. Comparez les formules ci-dessous pour continuer.` },
  it: { setupTitle:'Completa la Configurazione del Tuo Abbonamento', setupBody:'L’Anteprima Ospite di 24 ore è disponibile senza carta ed è SOLO VISUALIZZAZIONE. Per usare le funzioni One2OneLove, avvia la prova di 7 giorni con Accesso Completo con una carta. Oggi non viene addebitato il prezzo dell’abbonamento. Il primo invio SMS di una Nota d’Amore durante la prova è GRATIS; ogni invio successivo costa US$0.29.', requiredTitle:plan=>`Accesso ${plan} Richiesto`, requiredBody:plan=>`La funzione selezionata è inclusa con ${plan}. Confronta i piani qui sotto per continuare.` },
  de: { setupTitle:'Mitgliedschaft Fertig Einrichten', setupBody:'Die 24-stündige Gastvorschau ist ohne Karte verfügbar und dient NUR ZUM ANSEHEN. Um One2OneLove-Funktionen zu verwenden, starten Sie den 7-Tage-Test mit Vollzugriff mit einer Karte. Der Abonnementpreis wird heute nicht berechnet. Ihre erste SMS-Liebesnachricht während des Tests ist KOSTENLOS; jede weitere Sendung kostet US$0.29.', requiredTitle:plan=>`${plan}-Zugang Erforderlich`, requiredBody:plan=>`Die ausgewählte Funktion ist in ${plan} enthalten. Vergleichen Sie unten die Pläne, um fortzufahren.` },
};

function language() {
  try {
    const value = localStorage.getItem('preferredLanguage') || 'en';
    return COPY[value] ? value : 'en';
  } catch (_) { return 'en'; }
}

export default function SubscriptionLaunchNotice() {
  const [mount, setMount] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!window.location.pathname.toLowerCase().includes('/subscription')) return undefined;
    const params = new URLSearchParams(window.location.search);
    const setup = params.get('setup') === 'required';
    const required = params.get('required');
    if (!setup && !required) return undefined;

    const lang = language();
    const t = COPY[lang] || COPY.en;
    const normalizedPlan = required === 'Premier' ? 'Premiere' : required;
    setNotice(setup
      ? { title:t.setupTitle, body:t.setupBody, type:'setup' }
      : { title:t.requiredTitle(normalizedPlan || 'Premiere'), body:t.requiredBody(normalizedPlan || 'Premiere'), type:'required' });

    let host = null;
    const attach = () => {
      if (host?.isConnected) return;
      const heading = document.querySelector('h1');
      const header = heading?.closest('.text-center') || heading?.parentElement;
      if (!header?.parentElement) return;
      host = document.createElement('div');
      host.setAttribute('data-o2ol-subscription-launch-notice', 'true');
      header.insertAdjacentElement('beforebegin', host);
      setMount(host);
    };
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList:true, subtree:true });

    return () => {
      observer.disconnect();
      if (host?.isConnected) host.remove();
      setMount(null);
      setNotice(null);
    };
  }, []);

  if (!mount || !notice) return null;
  const Icon = notice.type === 'setup' ? CreditCard : LockKeyhole;

  return createPortal(
    <div className="mb-7 rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700"><Icon className="h-5 w-5"/></div>
        <div><h2 className="text-lg font-black text-gray-900">{notice.title}</h2><p className="mt-1 text-sm leading-6 text-gray-600">{notice.body}</p></div>
      </div>
    </div>,
    mount,
  );
}
