const SUPPORTED = new Set(['en', 'es', 'fr', 'it', 'de']);

const EXACT = {
  'Oops!': {
    es: '¡Ups!',
    fr: 'Oups !',
    it: 'Ops!',
    de: 'Hoppla!'
  }
};

function currentLanguage() {
  try {
    const value = String(window.localStorage.getItem('preferredLanguage') || 'en').toLowerCase();
    return SUPPORTED.has(value) ? value : 'en';
  } catch {
    return 'en';
  }
}

export function translateI18nFallbackText(value, language = currentLanguage()) {
  if (typeof value !== 'string' || language === 'en') return value;
  const leading = value.match(/^\s*/)?.[0] || '';
  const trailing = value.match(/\s*$/)?.[0] || '';
  const core = value.trim();
  if (!core) return value;
  const translated = EXACT[core]?.[language];
  return translated ? `${leading}${translated}${trailing}` : value;
}

function localizeTree(root) {
  const language = currentLanguage();
  if (language === 'en' || !root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    const translated = translateI18nFallbackText(root.nodeValue, language);
    if (translated !== root.nodeValue) root.nodeValue = translated;
    return;
  }

  if (![Node.ELEMENT_NODE, Node.DOCUMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE].includes(root.nodeType)) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const translated = translateI18nFallbackText(node.nodeValue, language);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }
}

export function installI18nFallbackLocalization() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__o2olI18nFallbackInstalled) return;
  window.__o2olI18nFallbackInstalled = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') localizeTree(mutation.target);
      for (const node of mutation.addedNodes || []) localizeTree(node);
    }
  });

  const start = () => {
    localizeTree(document.body);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  window.addEventListener('storage', (event) => {
    if (event.key === 'preferredLanguage') localizeTree(document.body);
  });
}
