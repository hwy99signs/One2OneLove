import { useEffect } from 'react';

function findFeatureUsageHeader() {
  const tables = Array.from(document.querySelectorAll('table'));
  for (const table of tables) {
    const head = table.querySelector('thead');
    if (!head) continue;
    const text = (head.textContent || '').toLowerCase();
    if (text.includes('unique users') && text.includes('total activity') && text.includes('last used')) {
      return head;
    }
  }
  return null;
}

export default function AdminFeatureHeaderLock() {
  useEffect(() => {
    if (!window.location.pathname.toLowerCase().startsWith('/admin')) return undefined;
    let currentHead = null;
    let styledCells = [];

    const apply = () => {
      const head = findFeatureUsageHeader();
      if (!head || head === currentHead) return;

      styledCells.forEach(cell => {
        cell.style.position = '';
        cell.style.top = '';
        cell.style.zIndex = '';
        cell.style.backgroundColor = '';
        cell.style.boxShadow = '';
      });

      currentHead = head;
      styledCells = Array.from(head.querySelectorAll('th'));
      styledCells.forEach(cell => {
        cell.style.position = 'sticky';
        cell.style.top = '72px';
        cell.style.zIndex = '18';
        cell.style.backgroundColor = '#f8fafc';
        cell.style.boxShadow = '0 1px 0 rgba(148,163,184,.35)';
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', apply, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', apply);
      styledCells.forEach(cell => {
        cell.style.position = '';
        cell.style.top = '';
        cell.style.zIndex = '';
        cell.style.backgroundColor = '';
        cell.style.boxShadow = '';
      });
    };
  }, []);

  return null;
}
