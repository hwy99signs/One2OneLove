import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, LockKeyhole } from 'lucide-react';

const COPY = {
  en: { setupTitle:'Finish Your Membership Setup', setupBody:'Start your 7-day Full Access trial by adding a credit or debit card. You will not be charged today.', requiredTitle:plan=>`${plan} Access Required`, requiredBody:plan=>`The feature you selected is included with ${plan}. Compare the plans below to continue.` },
  es: { setupTitle:'Completa la Configuración de Tu Membresía', setupBody:'Inicia tu prueba de Acceso Completo de 7 días agregando una tarjeta de crédito o débito. No se te cobrará hoy.', requiredTitle:plan=>`Se Requiere Acceso ${plan}`, requiredBody:plan=>`La función seleccionada está incluida con ${plan}. Compara los planes a continuación para continuar.` },
  fr: { setupTitle:'Terminez la Configuration de Votre Abonnement', setupBody:'Commencez votre essai de 7 jours avec Accès Complet en ajoutant une carte de crédit ou de débit. Aucun prélèvement aujourd’hui.', requiredTitle:plan=>`Accès ${plan} Requis`, requiredBody:plan=>`La fonctionnalité sélectionnée est incluse avec ${plan}. Comparez les formules ci-dessous pour continuer.` },
  it: { setupTitle:'Completa la Configurazione del Tuo Abbonamento', setupBody:'Inizia la prova di 7 giorni con Accesso Completo aggiungendo una carta di credito o debito. Oggi non verrà addebitato nulla.', requiredTitle:plan=>`Accesso ${plan} Richiesto`, requiredBody:plan=>`La funzione selezionata è inclusa con ${plan}. Confronta i piani qui sotto per continuare.` },
  de: { setupTitle:'Mitgliedschaft Fertig Einrichten', setupBody:'Starten Sie den 7-Tage-Test mit Vollzugriff, indem Sie eine Kredit- oder Debitkarte hinzufügen. Heute wird nichts berechnet.', requiredTitle:plan=>`${plan}-Zugang Erforderlich`, requiredBody:plan=>`Die ausgewählte Funktion ist in ${plan} enthalten. Vergleichen Sie unten die Pläne, um fortzufahren.` },
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
    const normalizedPlan = required === 'Premiere' ? 'Premier' : required;
    setNotice(setup
      ? { title:t.setupTitle, body:t.setupBody, type:'setup' }
      : { title:t.requiredTitle(normalizedPlan || 'Premier'), body:t.requiredBody(normalizedPlan || 'Premier'), type:'required' });

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
