import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart, MessageSquare, PlusCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getLoveNoteUsage } from '@/lib/loveNotesService';

const COPY = {
  en: { includedUsed: 'Your included sends are used.', allowanceReached: 'Your Love Note sending allowance has been reached.', plan: 'Your Plan', sms: 'SMS Love Notes', included: 'included remaining', extra: 'Extra Sends', extraHint: 'purchased balance', social: 'Social Media', socialHint: '1 per platform', topup: 'Get More Sends', topupHint: 'Buy extra sends', add: '+ Add Sends', loading: 'Loading…', today: 'today' },
  es: { includedUsed: 'Tus envíos incluidos se han agotado.', allowanceReached: 'Has alcanzado tu límite de envío de Notas de Amor.', plan: 'Tu Plan', sms: 'Notas de Amor SMS', included: 'incluidos restantes', extra: 'Envíos Extra', extraHint: 'saldo comprado', social: 'Redes Sociales', socialHint: '1 por plataforma', topup: 'Obtener Más Envíos', topupHint: 'Comprar envíos extra', add: '+ Añadir Envíos', loading: 'Cargando…', today: 'hoy' },
  fr: { includedUsed: 'Vos envois inclus sont épuisés.', allowanceReached: 'Vous avez atteint votre limite d’envoi de Notes d’Amour.', plan: 'Votre Forfait', sms: 'Notes d’Amour SMS', included: 'inclus restants', extra: 'Envois Supplémentaires', extraHint: 'solde acheté', social: 'Réseaux Sociaux', socialHint: '1 par plateforme', topup: 'Obtenir Plus d’Envois', topupHint: 'Acheter des envois supplémentaires', add: '+ Ajouter des Envois', loading: 'Chargement…', today: 'aujourd’hui' },
  it: { includedUsed: 'Hai utilizzato tutti gli invii inclusi.', allowanceReached: 'Hai raggiunto il limite di invio delle Note d’Amore.', plan: 'Il Tuo Piano', sms: 'Note d’Amore SMS', included: 'inclusi rimanenti', extra: 'Invii Extra', extraHint: 'saldo acquistato', social: 'Social Media', socialHint: '1 per piattaforma', topup: 'Ottieni Più Invii', topupHint: 'Acquista invii extra', add: '+ Aggiungi Invii', loading: 'Caricamento…', today: 'oggi' },
  de: { includedUsed: 'Ihre enthaltenen Sendungen sind aufgebraucht.', allowanceReached: 'Sie haben Ihr Sendelimit für Liebesnachrichten erreicht.', plan: 'Dein Tarif', sms: 'SMS-Liebesnachrichten', included: 'inklusive übrig', extra: 'Zusätzliche Sendungen', extraHint: 'gekauftes Guthaben', social: 'Soziale Medien', socialHint: '1 pro Plattform', topup: 'Mehr Sendungen', topupHint: 'Zusätzliche Sendungen kaufen', add: '+ Sendungen Hinzufügen', loading: 'Wird geladen…', today: 'heute' },
};

const LIMIT_HEADINGS = [
  ['en', 'sending limits'],
  ['es', 'límites de envío'],
  ['fr', "limites d'envoi"],
  ['fr', 'limites d’envoi'],
  ['it', 'limiti di invio'],
  ['de', 'sendelimits'],
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

function readSocialValue(grid) {
  try {
    const cards = Array.from(grid.children || []);
    const value = cards[2]?.querySelector('.text-2xl')?.textContent?.trim();
    return value || '7/7';
  } catch (_) {
    return '7/7';
  }
}

function goToTopUp() {
  window.history.pushState({}, '', '/SendCredits');
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

export default function LoveNotesLimitAddSends() {
  const [mount, setMount] = useState(null);
  const [lang, setLang] = useState('en');
  const [usage, setUsage] = useState(null);
  const [socialValue, setSocialValue] = useState('7/7');

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
      if (host?.isConnected) {
        if (currentGrid) setSocialValue(readSocialValue(currentGrid));
        return;
      }
      const found = findTarget();
      if (!found) return;

      currentGrid = found.grid;
      previousDisplay = currentGrid.style.display;
      setLang(found.lang || 'en');
      setSocialValue(readSocialValue(currentGrid));
      currentGrid.style.display = 'none';

      host = document.createElement('div');
      host.setAttribute('data-o2ol-live-sending-limits', 'true');
      currentGrid.insertAdjacentElement('afterend', host);
      setMount(host);
      refreshUsage();
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const onUsage = () => refreshUsage();
    const onQuotaError = event => {
      const detail = event?.detail || {};
      const preferred = (() => { try { return localStorage.getItem('preferredLanguage') || 'en'; } catch (_) { return 'en'; } })();
      const preferredCopy = COPY[preferred] || COPY.en;
      const actionLabel = preferredCopy.topup;
      if (detail.code === 'send_limit_reached' && detail.topUpUrl) {
        toast.error(detail.message || preferredCopy.includedUsed, {
          action: { label: actionLabel, onClick: goToTopUp },
        });
      } else {
        toast.error(detail.message || preferredCopy.allowanceReached);
      }
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
  const included = usage ? `${usage.includedRemaining}/${usage.monthlyLimit}` : '—';
  const extra = usage ? String(usage.extraAvailable || 0) : '—';
  const daily = usage?.dailyLimit ? `${usage.dailyRemaining}/${usage.dailyLimit} ${copy.today}` : null;

  return createPortal(
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.plan}</span><ShieldCheck className="h-5 w-5 text-emerald-500"/></div>
        <div className="text-xl font-bold text-emerald-600">{plan}</div>
        <div className="text-xs text-gray-500">{usage?.subscriptionStatus || ''}</div>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.sms}</span><Heart className="h-5 w-5 text-pink-500"/></div>
        <div className="text-2xl font-bold text-pink-600">{included}</div>
        <div className="text-xs text-gray-500">{copy.included}{daily ? ` · ${daily}` : ''}</div>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.extra}</span><PlusCircle className="h-5 w-5 text-blue-500"/></div>
        <div className="text-2xl font-bold text-blue-600">{extra}</div>
        <div className="text-xs text-gray-500">{copy.extraHint}</div>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.social}</span><MessageSquare className="h-5 w-5 text-purple-500"/></div>
        <div className="text-2xl font-bold text-purple-600">{socialValue}</div>
        <div className="text-xs text-gray-500">{copy.socialHint}</div>
      </div>
      <button type="button" onClick={goToTopUp} className="h-full w-full rounded-xl border-2 border-dashed border-pink-300 bg-white p-4 text-left shadow-sm transition hover:border-pink-500 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2" aria-label={copy.topup}>
        <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-700">{copy.topup}</span><PlusCircle className="h-5 w-5 text-pink-500"/></div>
        <div className="text-sm font-bold text-pink-600">{copy.add}</div>
        <div className="mt-1 text-xs text-gray-500">{copy.topupHint}</div>
      </button>
    </div>,
    mount,
  );
}
