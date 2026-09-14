import { useEffect } from 'react';

const GIFT_LABELS = new Set([
  'Gift Suggestions', 'Sugerencias de Regalos', 'Suggestions de Cadeaux', 'Suggerimenti per Regali', 'Geschenkvorschläge',
]);
const SUPPORT_LABELS = new Set([
  'Contact Support', 'Contactar Soporte', 'Contacter le Support', 'Contatta il Supporto', 'Support Kontaktieren',
]);

function findGridChild(node) {
  let current = node;
  while (current && current !== document.body) {
    const parent = current.parentElement;
    const classes = String(parent?.className || '');
    if (parent && classes.includes('grid') && classes.includes('md:grid-cols-3')) return current;
    current = parent;
  }
  return null;
}

export default function LaunchSurfaceCleanup() {
  useEffect(() => {
    const hidden = new Map();
    const handlers = new Map();

    const scan = () => {
      const path = window.location.pathname.toLowerCase();

      // Friend requests/direct private chat are deferred. The supported launch
      // community surface is the public topic-based Community Chat.
      for (const anchor of Array.from(document.querySelectorAll('a[href]'))) {
        const href = String(anchor.getAttribute('href') || '').toLowerCase();
        if (href.includes('/friendrequests')) {
          if (!hidden.has(anchor)) {
            hidden.set(anchor, anchor.style.display);
            anchor.style.display = 'none';
            anchor.setAttribute('data-o2ol-launch-hidden', 'friend-requests');
          }
        }
      }

      if (path.includes('/relationshipmilestones')) {
        for (const heading of Array.from(document.querySelectorAll('h3'))) {
          if (!GIFT_LABELS.has((heading.textContent || '').trim())) continue;
          const item = findGridChild(heading);
          if (item && !hidden.has(item)) {
            hidden.set(item, item.style.display);
            item.style.display = 'none';
            item.setAttribute('data-o2ol-launch-hidden', 'gift-suggestions');
          }
        }
      }

      if (path.includes('/subscription')) {
        for (const button of Array.from(document.querySelectorAll('button'))) {
          if (!SUPPORT_LABELS.has((button.textContent || '').trim()) || handlers.has(button)) continue;
          const handler = event => {
            event.preventDefault();
            window.history.pushState({}, '', '/ContactUs');
            window.dispatchEvent(new PopStateEvent('popstate'));
            window.scrollTo({ top:0, left:0, behavior:'auto' });
          };
          button.addEventListener('click', handler, true);
          button.setAttribute('data-o2ol-contact-support-fixed', 'true');
          handlers.set(button, handler);
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
      for (const [element, display] of hidden.entries()) {
        if (element?.isConnected) {
          element.style.display = display;
          element.removeAttribute('data-o2ol-launch-hidden');
        }
      }
      for (const [button, handler] of handlers.entries()) {
        if (button?.isConnected) {
          button.removeEventListener('click', handler, true);
          button.removeAttribute('data-o2ol-contact-support-fixed');
        }
      }
    };
  }, []);

  return null;
}
