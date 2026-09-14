import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PlusCircle } from 'lucide-react';

const COPY = {
  en: { title: 'Get More Sends', subtitle: 'Plans & send options' },
  es: { title: 'Obtener Más Envíos', subtitle: 'Planes y opciones de envío' },
  fr: { title: 'Obtenir Plus d’Envois', subtitle: 'Forfaits et options d’envoi' },
  it: { title: 'Ottieni Più Invii', subtitle: 'Piani e opzioni di invio' },
  de: { title: 'Mehr Sendungen', subtitle: 'Tarife und Sendeoptionen' },
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

export default function LoveNotesLimitAddSends() {
  const [mount, setMount] = useState(null);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    let currentGrid = null;
    let host = null;

    const attach = () => {
      if (host?.isConnected) return;
      const found = findTarget();
      if (!found) return;

      currentGrid = found.grid;
      setLang(found.lang || 'en');
      currentGrid.classList.remove('md:grid-cols-3');
      currentGrid.classList.add('md:grid-cols-4');

      host = document.createElement('div');
      host.setAttribute('data-o2ol-add-sends', 'true');
      currentGrid.appendChild(host);
      setMount(host);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (host?.isConnected) host.remove();
      if (currentGrid?.isConnected) {
        currentGrid.classList.remove('md:grid-cols-4');
        currentGrid.classList.add('md:grid-cols-3');
      }
      setMount(null);
    };
  }, []);

  if (!mount) return null;
  const copy = COPY[lang] || COPY.en;

  return createPortal(
    <button
      type="button"
      onClick={() => window.location.assign('/Subscription')}
      className="h-full w-full rounded-xl border-2 border-dashed border-pink-300 bg-white p-4 text-left shadow-sm transition hover:border-pink-500 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2"
      aria-label={copy.title}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{copy.title}</span>
        <PlusCircle className="h-5 w-5 text-pink-500" />
      </div>
      <div className="text-sm font-bold text-pink-600">+ Add Sends</div>
      <div className="mt-1 text-xs text-gray-500">{copy.subtitle}</div>
    </button>,
    mount,
  );
}
