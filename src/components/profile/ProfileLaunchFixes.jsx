import { useEffect, useRef } from 'react';
import { listMemories } from '@/lib/memoryService';
import { listSentLoveNotes } from '@/lib/loveNotesService';

const MEMORY_LABELS = new Set([
  'Create Memory', 'Crear Recuerdo', 'Créer Souvenir', 'Crea Ricordo', 'Erinnerung Erstellen',
]);
const MEMORY_STATS = new Set([
  'Memories Created', 'Recuerdos Creados', 'Souvenirs Créés', 'Ricordi Creati', 'Erstellte Erinnerungen',
]);
const LOVE_NOTE_STATS = new Set([
  'Love Notes Sent', 'Notas de Amor Enviadas', "Notes d'Amour Envoyées", "Note d'Amore Inviate", 'Gesendete Liebesbotschaften',
]);
const QUIZ_STATS = new Set([
  'Quizzes Taken', 'Cuestionarios Realizados', 'Quiz Réalisés', 'Quiz Completati', 'Absolvierte Quiz',
]);

function go(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function directGridItem(element) {
  let node = element;
  while (node && node !== document.body) {
    const parent = node.parentElement;
    const className = String(parent?.className || '');
    if (parent && className.includes('grid-cols-2') && className.includes('md:grid-cols-4')) return node;
    node = parent;
  }
  return null;
}

function findTextElement(labels) {
  const candidates = Array.from(document.querySelectorAll('p,span,div'));
  return candidates.find(element => labels.has((element.textContent || '').trim())) || null;
}

export default function ProfileLaunchFixes() {
  const countsRef = useRef({ memories: null, notes: null });

  useEffect(() => {
    const clickCleanups = new Map();
    const hiddenElements = new Map();
    let loadingCounts = false;

    const loadCounts = async () => {
      if (loadingCounts || !window.location.pathname.toLowerCase().includes('/profile')) return;
      if (countsRef.current.memories !== null && countsRef.current.notes !== null) return;
      loadingCounts = true;
      try {
        const [memories, notes] = await Promise.all([
          listMemories().catch(() => null),
          listSentLoveNotes().catch(() => null),
        ]);
        if (Array.isArray(memories)) countsRef.current.memories = memories.length;
        if (Array.isArray(notes)) countsRef.current.notes = notes.length;
      } finally {
        loadingCounts = false;
      }
    };

    const applyCount = (labels, value) => {
      if (value === null || value === undefined) return;
      const label = findTextElement(labels);
      const item = label ? directGridItem(label) : null;
      if (!item) return;
      const number = item.querySelector('.text-2xl');
      const next = String(value);
      if (number && number.textContent?.trim() !== next) number.textContent = next;
    };

    const scan = () => {
      const onProfile = window.location.pathname.toLowerCase().includes('/profile');
      if (!onProfile) return;

      loadCounts().then(() => {
        applyCount(MEMORY_STATS, countsRef.current.memories);
        applyCount(LOVE_NOTE_STATS, countsRef.current.notes);
      });

      for (const anchor of Array.from(document.querySelectorAll('a[href]'))) {
        const href = (anchor.getAttribute('href') || '').toLowerCase();
        const text = (anchor.textContent || '').trim();

        if (href.includes('/aicontentcreator')) {
          if (!hiddenElements.has(anchor)) {
            hiddenElements.set(anchor, anchor.style.display);
            anchor.style.display = 'none';
            anchor.setAttribute('data-o2ol-launch-hidden', 'ai-creator');
          }
          continue;
        }

        if (href.includes('/sharedjournals') && Array.from(MEMORY_LABELS).some(label => text.includes(label))) {
          if (!clickCleanups.has(anchor)) {
            const handler = event => {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation?.();
              go('/MemoryLane');
            };
            anchor.addEventListener('click', handler, true);
            anchor.setAttribute('href', '/MemoryLane');
            anchor.setAttribute('data-o2ol-memory-route-fixed', 'true');
            clickCleanups.set(anchor, () => anchor.removeEventListener('click', handler, true));
          }
        }
      }

      const quizLabel = findTextElement(QUIZ_STATS);
      const quizItem = quizLabel ? directGridItem(quizLabel) : null;
      if (quizItem && !hiddenElements.has(quizItem)) {
        hiddenElements.set(quizItem, quizItem.style.display);
        quizItem.style.display = 'none';
        quizItem.setAttribute('data-o2ol-launch-hidden', 'untracked-quiz-stat');
      }
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      for (const cleanup of clickCleanups.values()) cleanup();
      for (const [element, display] of hiddenElements.entries()) {
        if (element?.isConnected) {
          element.style.display = display;
          element.removeAttribute('data-o2ol-launch-hidden');
        }
      }
    };
  }, []);

  return null;
}
