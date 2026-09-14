import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart, MessageSquare, PlusCircle, ShieldCheck } from 'lucide-react';
import { getLoveNoteUsage } from '@/lib/loveNotesService';

const COPY = {
  en: { plan: 'Your Plan', sms: 'SMS Love Notes', included: 'included remaining', extra: 'Extra Sends', extraHint: 'purchased balance', social: 'Social Media', socialHint: '1 per platform', topup: 'Get More Sends', topupHint: 'Buy extra sends', add: '+ Add Sends', loading: 'Loading…' },
  es: { plan: 'Tu Plan', sms: 'Notas de Amor SMS', included: 'incluidos restantes', extra: 'Envíos Extra', extraHint: 'saldo comprado', social: 'Redes Sociales', socialHint: '1 por plataforma', topup: 'Obtener Más Envíos', topupHint: 'Comprar envíos extra', add: '+ Añadir Envíos', loading: 'Cargando…' },
  fr: { plan: 'Votre Forfait', sms: 'Notes d’Amour SMS', included: 'inclus restants', extra: 'Envois Supplémentaires', extraHint: 'solde acheté', social: 'Réseaux Sociaux', socialHint: '1 par plateforme', topup: 'Obtenir Plus d’Envois', topupHint: 'Acheter des envois supplémentaires', add: '+ Ajouter des Envois', loading: 'Chargement…' },
  it: { plan: 'Il Tuo Piano', sms: 'Note d’Amore SMS', included: 'inclusi rimanenti', extra: 'Invii Extra', extraHint: 'saldo acquistato', social: 'Social Media', socialHint: '1 per piattaforma', topup: 'Ottieni Più Invii', topupHint: 'Acquista invii extra', add: '+ Aggiungi Invii', loading: 'Caricamento…' },
  de: { plan: 'Dein Tarif', sms: 'SMS-Liebesnachrichten', included: 'inklusive übrig', extra: 'Zusätzliche Sendungen', extraHint: 'gekauftes Guthaben', social: 'Soziale Medien', socialHint: '1 pro Plattform', topup: 'Mehr Sendungen', topupHint: 'Zusätzliche Sendungen kaufen', add: '+ Sendungen Hinzufügen', loading: 'Wird geladen…' },
};

const LIMIT_HEADINGS = [
  ['en', 'sending limits'],
  ['es', 'límites de envío'],
  ['fr', "limites d'envoi"],
  ['fr', 'limites d’envoi'],
  ['it', 'limiti di invio'],
  ['de', 'sendelimits'],
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

    const attach = () => {
      if (!window.location.pathname.toLowerCase().includes('/lovenotes')) return;
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
    window.addEventListener('o2ol-love-note-usage-changed', onUsage);

    return () => {
      observer.disconnect();
      window.removeEventListener('o2ol-love-note-usage-changed', onUsage);
      if (host?.isConnected) host.remove();
      if (currentGrid?.isConnected) currentGrid.style.display = previousDisplay;
      setMount(null);
    };
  }, []);

  if (!mount) return null;
  const copy = COPY[lang] || COPY.en;
  const plan = usage?.plan || copy.loading;
  const included = usage ? `${usage.includedRemaining}/${usage.monthlyLimit}` : '—';
  const extra = usage ? String(usage.extraAvailable || 0) : '—';
  const daily = usage?.dailyLimit ? `${usage.dailyRemaining}/${usage.dailyLimit} today` : null;

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
