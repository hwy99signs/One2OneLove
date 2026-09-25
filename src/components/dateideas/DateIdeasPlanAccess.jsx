import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isGuestPreviewActive } from '@/lib/guestPreview';

const COPY = {
  en: { basic:'Basic unlocks 1 Date Idea this month.', premier:'Premier unlocks 8 Date Ideas this month.', note:'Your custom dates remain available and do not count against this allowance.', upgrade:'Compare Plans' },
  es: { basic:'Basic desbloquea 1 Idea de Cita este mes.', premier:'Premier desbloquea 8 Ideas de Cita este mes.', note:'Tus citas personalizadas siguen disponibles y no cuentan para este límite.', upgrade:'Comparar Planes' },
  fr: { basic:'Basic débloque 1 Idée de Rendez-vous ce mois-ci.', premier:'Premier débloque 8 Idées de Rendez-vous ce mois-ci.', note:'Vos rendez-vous personnalisés restent disponibles et ne comptent pas dans cette limite.', upgrade:'Comparer les Formules' },
  it: { basic:'Basic sblocca 1 Idea per Appuntamento questo mese.', premier:'Premier sblocca 8 Idee per Appuntamenti questo mese.', note:'Gli appuntamenti personalizzati restano disponibili e non contano in questo limite.', upgrade:'Confronta i Piani' },
  de: { basic:'Basic schaltet diesen Monat 1 Date-Idee frei.', premier:'Premier schaltet diesen Monat 8 Date-Ideen frei.', note:'Eigene Dates bleiben verfügbar und zählen nicht zu diesem Limit.', upgrade:'Pläne Vergleichen' },
};

function customerPlan(user) {
  const role = String(user?.role || '').toLowerCase();
  if (role === 'admin' || isGuestPreviewActive(user)) return 'Exclusive';
  const status = String(user?.subscription_status || '').toLowerCase();
  if (status === 'trial' || status === 'trialing') return 'Exclusive';
  const raw = String(user?.subscription_plan || 'Basic').toLowerCase();
  if (raw === 'exclusive') return 'Exclusive';
  if (raw === 'premier' || raw === 'premiere') return 'Premier';
  return 'Basic';
}

function hashSeed(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function selectedIndices(count, limit, seedText) {
  if (!Number.isFinite(limit) || limit >= count) return new Set(Array.from({ length: count }, (_, i) => i));
  const indices = Array.from({ length: count }, (_, i) => i);
  let state = hashSeed(seedText) || 1;
  const rand = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, Math.max(0, limit)));
}

function ideaButtons() {
  return Array.from(document.querySelectorAll('button')).filter(button =>
    String(button.className || '').includes('min-h-[86px]') && button.querySelector('span')
  );
}

export default function DateIdeasPlanAccess() {
  const { user } = useAuth();
  const [mount, setMount] = useState(null);
  const [language, setLanguage] = useState('en');
  const plan = customerPlan(user);
  const limit = plan === 'Basic' ? 1 : plan === 'Premier' ? 8 : Infinity;
  const monthKey = new Date().toISOString().slice(0, 7);
  const seedText = `${user?.id || 'member'}:${monthKey}`;

  const allowed = useMemo(() => selectedIndices(52, limit, seedText), [limit, seedText]);

  useEffect(() => {
    if (!window.location.pathname.toLowerCase().includes('/dateideas') || !Number.isFinite(limit)) return undefined;

    let host = null;
    let grid = null;
    let titleToIndex = new Map();
    const hidden = new Map();

    const restoreHidden = () => {
      for (const [node, display] of hidden.entries()) {
        if (node?.isConnected) node.style.display = display;
      }
      hidden.clear();
    };

    const scan = () => {
      if (!window.location.pathname.toLowerCase().includes('/dateideas')) return;
      const buttons = ideaButtons();
      if (!buttons.length) return;

      const preferred = (() => { try { return localStorage.getItem('preferredLanguage') || 'en'; } catch (_) { return 'en'; } })();
      setLanguage(COPY[preferred] ? preferred : 'en');

      // On the default All Dates view, built-in ideas are rendered first. Capture
      // their stable order so custom user-created dates always remain accessible.
      if (buttons.length >= 52 && titleToIndex.size < 52) {
        titleToIndex = new Map();
        buttons.slice(0, 52).forEach((button, index) => {
          const title = button.querySelector('span')?.textContent?.trim();
          if (title) titleToIndex.set(title, index);
        });
      }

      if (titleToIndex.size < 52) return;

      grid = buttons[0]?.parentElement || grid;
      if (grid && !host?.isConnected) {
        host = document.createElement('div');
        host.setAttribute('data-o2ol-date-idea-plan-access', 'true');
        grid.insertAdjacentElement('beforebegin', host);
        setMount(host);
      }

      for (const button of buttons) {
        const title = button.querySelector('span')?.textContent?.trim();
        const index = titleToIndex.get(title);
        if (index == null) continue; // custom date: always leave visible
        if (!allowed.has(index)) {
          if (!hidden.has(button)) hidden.set(button, button.style.display);
          button.style.display = 'none';
          button.setAttribute('data-o2ol-date-locked', 'true');
        } else if (hidden.has(button)) {
          button.style.display = hidden.get(button);
          hidden.delete(button);
          button.removeAttribute('data-o2ol-date-locked');
        }
      }
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList:true, subtree:true, characterData:true });
    const onPopState = () => window.setTimeout(scan, 0);
    window.addEventListener('popstate', onPopState);

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', onPopState);
      restoreHidden();
      if (host?.isConnected) host.remove();
      setMount(null);
    };
  }, [allowed, limit]);

  if (!mount || !Number.isFinite(limit)) return null;
  const t = COPY[language] || COPY.en;

  return createPortal(
    <div className="mb-6 rounded-2xl border border-purple-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            {plan === 'Basic' ? <LockKeyhole className="h-5 w-5"/> : <CalendarDays className="h-5 w-5"/>}
          </div>
          <div>
            <p className="font-bold text-gray-900">{plan === 'Basic' ? t.basic : t.premier}</p>
            <p className="mt-1 text-sm text-gray-600">{t.note}</p>
          </div>
        </div>
        <button type="button" onClick={() => { window.history.pushState({}, '', '/Subscription'); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top:0, left:0, behavior:'auto' }); }} className="rounded-xl border border-purple-300 px-4 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-50">
          {t.upgrade}
        </button>
      </div>
    </div>,
    mount,
  );
}
