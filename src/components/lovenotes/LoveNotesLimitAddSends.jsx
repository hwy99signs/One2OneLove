import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Heart, MessageSquare, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getLoveNoteDeliveryReadiness, getLoveNoteUsage } from '@/lib/loveNotesService';

const COPY = {
  en: {
    plan:'Your Plan', first:'First Paid SMS Send', free:'FREE', used:'Benefit used or reserved',
    additional:'Additional SMS Love Notes', price:'$0.29', perSend:'per send',
    billing:'Billing', grouped:'Usage may be grouped on your payment method on file.',
    ready:'SMS sending unlocked', providerPending:'SMS provider activation pending',
    subscribeTitle:'Ready to send it?', subscribeBody:'Subscribe to One2OneLove and receive your first Love Note send FREE. Each additional Love Note SMS is $0.29 and will be billed to your payment method on file.',
    trialBody:'Love Note SMS sends are not available during the 7-day free trial. Your first free send unlocks after your first successful paid subscription payment.',
    subscribe:'Subscribe & Get 1 Free Love Note Send',
  },
  es: {
    plan:'Tu Plan', first:'Primer Envío SMS de Pago', free:'GRATIS', used:'Beneficio usado o reservado',
    additional:'Notas de Amor SMS Adicionales', price:'$0.29', perSend:'por envío',
    billing:'Facturación', grouped:'Los cargos de uso pueden agruparse en tu método de pago guardado.',
    ready:'Envío SMS habilitado', providerPending:'Activación del proveedor SMS pendiente',
    subscribeTitle:'¿Listo para enviarla?', subscribeBody:'Suscríbete a One2OneLove y recibe tu primer envío de Nota de Amor GRATIS. Cada envío SMS adicional cuesta $0.29 y se factura a tu método de pago guardado.',
    trialBody:'Los envíos SMS de Notas de Amor no están disponibles durante la prueba gratuita de 7 días. Tu primer envío gratis se habilita después del primer pago exitoso de la suscripción.',
    subscribe:'Suscríbete y Obtén 1 Envío Gratis',
  },
  fr: {
    plan:'Votre Formule', first:'Premier Envoi SMS Payant', free:'GRATUIT', used:'Avantage utilisé ou réservé',
    additional:'Notes d’Amour SMS Supplémentaires', price:'0,29 $', perSend:'par envoi',
    billing:'Facturation', grouped:'Les frais d’utilisation peuvent être regroupés sur votre moyen de paiement enregistré.',
    ready:'Envoi SMS débloqué', providerPending:'Activation du fournisseur SMS en attente',
    subscribeTitle:'Prêt à l’envoyer ?', subscribeBody:'Abonnez-vous à One2OneLove et recevez votre premier envoi de Note d’Amour GRATUIT. Chaque envoi SMS supplémentaire coûte 0,29 $ et est facturé au moyen de paiement enregistré.',
    trialBody:'Les envois SMS de Notes d’Amour ne sont pas disponibles pendant l’essai gratuit de 7 jours. Votre premier envoi gratuit se débloque après le premier paiement réussi de l’abonnement.',
    subscribe:'S’abonner et Obtenir 1 Envoi Gratuit',
  },
  it: {
    plan:'Il Tuo Piano', first:'Primo Invio SMS a Pagamento', free:'GRATIS', used:'Vantaggio usato o riservato',
    additional:'Note d’Amore SMS Aggiuntive', price:'$0.29', perSend:'per invio',
    billing:'Fatturazione', grouped:'Gli addebiti di utilizzo possono essere raggruppati sul metodo di pagamento registrato.',
    ready:'Invio SMS sbloccato', providerPending:'Attivazione del provider SMS in attesa',
    subscribeTitle:'Pronto a inviarla?', subscribeBody:'Abbonati a One2OneLove e ricevi il primo invio di una Nota d’Amore GRATIS. Ogni invio SMS aggiuntivo costa $0.29 e viene addebitato al metodo di pagamento registrato.',
    trialBody:'Gli invii SMS delle Note d’Amore non sono disponibili durante la prova gratuita di 7 giorni. Il primo invio gratuito si sblocca dopo il primo pagamento riuscito dell’abbonamento.',
    subscribe:'Abbonati e Ottieni 1 Invio Gratis',
  },
  de: {
    plan:'Dein Plan', first:'Erste Bezahlte SMS-Sendung', free:'GRATIS', used:'Vorteil genutzt oder reserviert',
    additional:'Weitere SMS-Liebesnachrichten', price:'0,29 $', perSend:'pro Sendung',
    billing:'Abrechnung', grouped:'Nutzungsgebühren können gesammelt über die hinterlegte Zahlungsmethode abgerechnet werden.',
    ready:'SMS-Versand freigeschaltet', providerPending:'SMS-Anbieter-Aktivierung ausstehend',
    subscribeTitle:'Bereit zum Senden?', subscribeBody:'Abonniere One2OneLove und erhalte deine erste Liebesnachricht-Sendung GRATIS. Jede weitere SMS kostet 0,29 $ und wird über deine hinterlegte Zahlungsmethode abgerechnet.',
    trialBody:'Während des kostenlosen 7-Tage-Tests sind keine SMS-Liebesnachrichten möglich. Deine erste kostenlose Sendung wird nach der ersten erfolgreichen Abonnementzahlung freigeschaltet.',
    subscribe:'Abonnieren & 1 Gratis-Sendung Erhalten',
  },
};

const HEADINGS = [
  'love note sending & billing','your sending limits',
  'envío y facturación de notas de amor','límites de envío',
  'envoi et facturation des notes d’amour','limites d’envoi',"limites d'envoi",
  'invio e fatturazione delle note d’amore','limiti di invio',
  'versand und abrechnung von liebesnachrichten','sendelimits',
];

const DEFERRED_AI_LABELS = [
  'ai personalize','personalización con ia','personnaliser avec ia','personalizza con ia','ki personalisieren',
];

function findTarget() {
  const headings = Array.from(document.querySelectorAll('h3'));
  for (const heading of headings) {
    const text = (heading.textContent || '').trim().toLowerCase();
    if (!HEADINGS.some(phrase => text.includes(phrase))) continue;
    const grid = heading.nextElementSibling;
    if (grid && grid.classList.contains('grid')) return grid;
  }
  return null;
}

function hideDeferredAiButtons(hiddenButtons) {
  if (!window.location.pathname.toLowerCase().includes('/lovenotes')) return;
  for (const button of Array.from(document.querySelectorAll('button'))) {
    const text = (button.textContent || '').trim().toLowerCase();
    if (!DEFERRED_AI_LABELS.some(label => text.includes(label))) continue;
    if (!hiddenButtons.has(button)) {
      hiddenButtons.set(button, button.style.display);
      button.style.display = 'none';
      button.setAttribute('data-o2ol-launch-deferred-ai', 'true');
    }
  }
}

function language() {
  try {
    const value = localStorage.getItem('preferredLanguage') || 'en';
    return COPY[value] ? value : 'en';
  } catch (_) {
    return 'en';
  }
}

function goToSubscription() {
  window.history.pushState({}, '', '/Subscription');
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top:0, left:0, behavior:'auto' });
}

export default function LoveNotesLimitAddSends() {
  const [mount, setMount] = useState(null);
  const [usage, setUsage] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [lang, setLang] = useState('en');

  const refresh = async () => {
    try {
      const [nextUsage, nextDelivery] = await Promise.all([
        getLoveNoteUsage(),
        getLoveNoteDeliveryReadiness(),
      ]);
      setUsage(nextUsage);
      setDelivery(nextDelivery);
    } catch (_) {
      setUsage(null);
      setDelivery(null);
    }
  };

  useEffect(() => {
    let grid = null;
    let host = null;
    let previousDisplay = '';
    const hiddenButtons = new Map();

    const attach = () => {
      if (!window.location.pathname.toLowerCase().includes('/lovenotes')) return;
      hideDeferredAiButtons(hiddenButtons);
      if (host?.isConnected) return;
      grid = findTarget();
      if (!grid) return;
      previousDisplay = grid.style.display;
      grid.style.display = 'none';
      host = document.createElement('div');
      host.setAttribute('data-o2ol-love-note-billing', 'true');
      grid.insertAdjacentElement('afterend', host);
      setLang(language());
      setMount(host);
      refresh();
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });

    const onUsage = () => refresh();
    const onQuotaError = event => {
      const message = event?.detail?.message;
      if (message) toast.error(message);
      refresh();
    };
    window.addEventListener('o2ol-love-note-usage-changed', onUsage);
    window.addEventListener('o2ol-love-note-quota-error', onQuotaError);

    return () => {
      observer.disconnect();
      window.removeEventListener('o2ol-love-note-usage-changed', onUsage);
      window.removeEventListener('o2ol-love-note-quota-error', onQuotaError);
      if (host?.isConnected) host.remove();
      if (grid?.isConnected) grid.style.display = previousDisplay;
      for (const [button, display] of hiddenButtons.entries()) {
        if (button?.isConnected) {
          button.style.display = display;
          button.removeAttribute('data-o2ol-launch-deferred-ai');
        }
      }
      setMount(null);
    };
  }, []);

  if (!mount) return null;
  const t = COPY[lang] || COPY.en;
  const status = String(usage?.subscriptionStatus || '').toLowerCase();
  const trial = status === 'trial' || status === 'trialing';
  const providerReady = delivery?.scheduledSmsReady === true;

  return createPortal(
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{t.plan}</span><ShieldCheck className="h-5 w-5 text-emerald-500"/></div>
          <div className="text-xl font-bold text-emerald-600">{usage?.plan || '—'}</div>
          <div className="text-xs text-gray-500">{status || '—'}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{t.first}</span><Heart className="h-5 w-5 text-pink-500"/></div>
          <div className="text-2xl font-bold text-pink-600">{usage?.firstFreeAvailable ? t.free : usage?.firstPaidSendFree ? t.used : '—'}</div>
          <div className="text-xs text-gray-500">{trial ? t.trialBody : usage?.smsSendingAllowed ? t.ready : t.subscribeTitle}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{t.additional}</span><MessageSquare className="h-5 w-5 text-blue-500"/></div>
          <div className="text-2xl font-bold text-blue-600">{t.price}</div>
          <div className="text-xs text-gray-500">{t.perSend}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{t.billing}</span><CreditCard className="h-5 w-5 text-purple-500"/></div>
          <div className="text-sm font-bold text-purple-700">{providerReady ? t.ready : t.providerPending}</div>
          <div className="mt-1 text-xs text-gray-500">{t.grouped}</div>
        </div>
      </div>

      {!usage?.smsSendingAllowed && (
        <div className="rounded-xl border border-pink-200 bg-white p-5 shadow-sm">
          <p className="font-bold text-gray-900">{t.subscribeTitle}</p>
          <p className="mt-1 text-sm leading-6 text-gray-600">{trial ? t.trialBody : t.subscribeBody}</p>
          <button type="button" onClick={goToSubscription} className="mt-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-sm">
            {t.subscribe}
          </button>
        </div>
      )}
    </div>,
    mount,
  );
}
