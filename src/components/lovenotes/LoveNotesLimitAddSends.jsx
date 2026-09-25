import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CreditCard, Heart, MessageSquare, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getLoveNoteUsage } from '@/lib/loveNotesService';

const COPY = {
  en: { plan:'Your Plan', sms:'One2OneLove SMS', first:'First paid-member send', firstFree:'FREE', used:'Used', rate:'Additional sends', price:'$0.29 each', billing:'Billing', billingHint:'Grouped with your subscription billing', social:'Social Sharing', socialHint:'Share through your own apps', loading:'Loading…', error:'Love Note billing information could not be refreshed.' },
  es: { plan:'Tu Plan', sms:'SMS de One2OneLove', first:'Primer envío como miembro de pago', firstFree:'GRATIS', used:'Usado', rate:'Envíos adicionales', price:'$0.29 cada uno', billing:'Facturación', billingHint:'Agrupados con la facturación de tu suscripción', social:'Compartir en Redes', socialHint:'Comparte mediante tus propias aplicaciones', loading:'Cargando…', error:'No se pudo actualizar la información de facturación de Notas de Amor.' },
  fr: { plan:'Votre Formule', sms:'SMS One2OneLove', first:'Premier envoi comme membre payant', firstFree:'GRATUIT', used:'Utilisé', rate:'Envois supplémentaires', price:'0,29 $ chacun', billing:'Facturation', billingHint:'Regroupés avec la facturation de votre abonnement', social:'Partage Social', socialHint:'Partagez via vos propres applications', loading:'Chargement…', error:'Les informations de facturation des Notes d’Amour n’ont pas pu être actualisées.' },
  it: { plan:'Il Tuo Piano', sms:'SMS One2OneLove', first:'Primo invio da membro pagante', firstFree:'GRATIS', used:'Usato', rate:'Invii aggiuntivi', price:'$0.29 ciascuno', billing:'Fatturazione', billingHint:'Raggruppati con la fatturazione dell’abbonamento', social:'Condivisione Social', socialHint:'Condividi tramite le tue app', loading:'Caricamento…', error:'Impossibile aggiornare le informazioni di fatturazione delle Note d’Amore.' },
  de: { plan:'Ihr Plan', sms:'One2OneLove-SMS', first:'Erste Sendung als zahlendes Mitglied', firstFree:'KOSTENLOS', used:'Verwendet', rate:'Weitere Sendungen', price:'je 0,29 $', billing:'Abrechnung', billingHint:'Mit Ihrer Abonnementabrechnung zusammengefasst', social:'Soziales Teilen', socialHint:'Über Ihre eigenen Apps teilen', loading:'Wird geladen…', error:'Die Abrechnungsinformationen für Liebesnachrichten konnten nicht aktualisiert werden.' },
};

const LIMIT_HEADINGS = [
  ['en', 'sending limits'],
  ['es', 'límites de envío'],
  ['fr', "limites d'envoi"],
  ['fr', 'limites d’envoi'],
  ['it', 'limiti di invio'],
  ['de', 'sendelimits'],
  ['en', 'sending & billing'],
  ['es', 'envío y facturación'],
  ['fr', 'envoi et facturation'],
  ['it', 'invio e fatturazione'],
  ['de', 'versand und abrechnung'],
];

const DEFERRED_AI_LABELS = [
  'ai personalize',
  'personalización con ia',
  'personnaliser avec ia',
  'personalizza con ia',
  'ki personalisieren',
];

function findTarget() {
  const headings = Array.from(document.querySelectorAll('h3'));
  for (const heading of headings) {
    const text = (heading.textContent || '').trim().toLowerCase();
    const match = LIMIT_HEADINGS.find(([, phrase]) => text.includes(phrase));
    if (!match) continue;
    const grid = heading.nextElementSibling;
    if (grid && grid.classList.contains('grid')) return { grid, lang: match[0] };
  }
  return null;
}

function hideDeferredAiButtons(hiddenButtons) {
  if (!window.location.pathname.toLowerCase().includes('/lovenotes')) return;
  const buttons = Array.from(document.querySelectorAll('button'));
  for (const button of buttons) {
    const text = (button.textContent || '').trim().toLowerCase();
    if (!DEFERRED_AI_LABELS.some(label => text.includes(label))) continue;
    if (!hiddenButtons.has(button)) {
      hiddenButtons.set(button, button.style.display);
      button.style.display = 'none';
      button.setAttribute('data-o2ol-launch-deferred-ai', 'true');
    }
  }
}

export default function LoveNotesLimitAddSends() {
  const [mount, setMount] = useState(null);
  const [lang, setLang] = useState('en');
  const [usage, setUsage] = useState(null);

  const refreshUsage = async () => {
    try { setUsage(await getLoveNoteUsage()); } catch (_) { setUsage(null); }
  };

  useEffect(() => {
    let currentGrid = null;
    let host = null;
    let previousDisplay = '';
    const hiddenButtons = new Map();

    const attach = () => {
      if (!window.location.pathname.toLowerCase().includes('/lovenotes')) return;
      hideDeferredAiButtons(hiddenButtons);
      if (host?.isConnected) return;
      const found = findTarget();
      if (!found) return;

      currentGrid = found.grid;
      previousDisplay = currentGrid.style.display;
      setLang(found.lang || 'en');
      currentGrid.style.display = 'none';

      host = document.createElement('div');
      host.setAttribute('data-o2ol-love-note-billing', 'true');
      currentGrid.insertAdjacentElement('afterend', host);
      setMount(host);
      refreshUsage();
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const onUsage = () => refreshUsage();
    const onQuotaError = event => {
      const preferred = (() => { try { return localStorage.getItem('preferredLanguage') || 'en'; } catch (_) { return 'en'; } })();
      const copy = COPY[preferred] || COPY.en;
      toast.error(event?.detail?.message || copy.error);
      refreshUsage();
    };
    window.addEventListener('o2ol-love-note-usage-changed', onUsage);
    window.addEventListener('o2ol-love-note-quota-error', onQuotaError);

    return () => {
      observer.disconnect();
      window.removeEventListener('o2ol-love-note-usage-changed', onUsage);
      window.removeEventListener('o2ol-love-note-quota-error', onQuotaError);
      if (host?.isConnected) host.remove();
      if (currentGrid?.isConnected) currentGrid.style.display = previousDisplay;
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
  const copy = COPY[lang] || COPY.en;
  const plan = usage?.plan || copy.loading;
  const firstFree = usage ? (usage.firstFreeAvailable ? copy.firstFree : copy.used) : '—';

  return createPortal(
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.plan}</span><ShieldCheck className="h-5 w-5 text-emerald-500"/></div>
        <div className="text-xl font-bold text-emerald-600">{plan}</div>
        <div className="text-xs text-gray-500">{usage?.subscriptionStatus || ''}</div>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.first}</span><Heart className="h-5 w-5 text-pink-500"/></div>
        <div className="text-2xl font-bold text-pink-600">{firstFree}</div>
        <div className="text-xs text-gray-500">{copy.sms}</div>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.rate}</span><Heart className="h-5 w-5 text-pink-500"/></div>
        <div className="text-2xl font-bold text-pink-600">{copy.price}</div>
        <div className="text-xs text-gray-500">{copy.sms}</div>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.billing}</span><CreditCard className="h-5 w-5 text-blue-500"/></div>
        <div className="text-sm font-bold text-blue-700">{copy.billingHint}</div>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.social}</span><MessageSquare className="h-5 w-5 text-purple-500"/></div>
        <div className="text-sm font-bold text-purple-700">{copy.socialHint}</div>
      </div>
    </div>,
    mount,
  );
}
