const BRAND_NAME = 'One2One Love';
const BRAND_PATTERN = /One\s*2\s*One\s*Love/gi;
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE']);
const BRAND_ATTRIBUTES = ['title', 'aria-label', 'alt', 'placeholder'];

function normalizeBrandString(value) {
  if (typeof value !== 'string' || !value) return value;
  return value.replace(BRAND_PATTERN, BRAND_NAME);
}

function normalizeTextNode(node) {
  const parent = node.parentElement;
  if (!parent || SKIP_TAGS.has(parent.tagName) || parent.isContentEditable) return;

  const nextValue = normalizeBrandString(node.nodeValue);
  if (nextValue !== node.nodeValue) {
    node.nodeValue = nextValue;
  }
}

function normalizeElementAttributes(element) {
  if (!(element instanceof Element)) return;

  for (const attribute of BRAND_ATTRIBUTES) {
    if (!element.hasAttribute(attribute)) continue;
    const currentValue = element.getAttribute(attribute);
    const nextValue = normalizeBrandString(currentValue);
    if (nextValue !== currentValue) {
      element.setAttribute(attribute, nextValue);
    }
  }
}

function normalizeSubtree(root) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    normalizeTextNode(root);
    return;
  }

  if (!(root instanceof Element) && root !== document.body) return;

  if (root instanceof Element) {
    if (SKIP_TAGS.has(root.tagName) || root.isContentEditable) return;
    normalizeElementAttributes(root);
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );

  let currentNode = walker.nextNode();
  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      normalizeTextNode(currentNode);
    } else if (currentNode instanceof Element) {
      if (!SKIP_TAGS.has(currentNode.tagName) && !currentNode.isContentEditable) {
        normalizeElementAttributes(currentNode);
      }
    }
    currentNode = walker.nextNode();
  }
}

export function installBrandNameNormalizer() {
  document.title = BRAND_NAME;

  const applicationName = document.querySelector('meta[name="application-name"]');
  if (applicationName) {
    applicationName.setAttribute('content', BRAND_NAME);
  }

  normalizeSubtree(document.body);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        normalizeTextNode(mutation.target);
        continue;
      }

      mutation.addedNodes.forEach((node) => normalizeSubtree(node));
    }
  });

  observer.observe(document.body, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  return () => observer.disconnect();
}

export { BRAND_NAME };
