import { DATE_IDEAS_PART_1 } from './dateIdeasPart1';
import { DATE_IDEAS_PART_2 } from './dateIdeasPart2';
import { DATE_IDEAS_PART_3 } from './dateIdeasPart3';
import { DATE_IDEAS_PART_4 } from './dateIdeasPart4';
import { DATE_IDEA_TITLES } from './dateIdeaTitles';

const GENERIC_DESCRIPTIONS = {
  es: 'Disfruten juntos de «{title}». Adapten el plan a su presupuesto, ubicación y ocasión, y hagan espacio para conversar y conectar.',
  fr: 'Profitez ensemble de «{title}». Adaptez le plan à votre budget, au lieu et à l’occasion, et gardez du temps pour discuter et vous reconnecter.',
  it: 'Godetevi insieme «{title}». Adattate il piano al budget, al luogo e all’occasione e lasciate spazio alla conversazione e alla connessione.',
  de: 'Genießen Sie gemeinsam „{title}“. Passen Sie den Plan an Budget, Ort und Anlass an und nehmen Sie sich bewusst Zeit für Gespräche und Verbindung.',
  nl: 'Geniet samen van ‘{title}’. Pas het plan aan jullie budget, locatie en gelegenheid aan en maak bewust tijd voor gesprek en verbinding.',
  pt: 'Aproveitem juntos «{title}». Adaptem o plano ao orçamento, local e ocasião e reservem tempo para conversar e se conectar.'
};

const DATE_IDEA_BASE = [
  ...DATE_IDEAS_PART_1,
  ...DATE_IDEAS_PART_2,
  ...DATE_IDEAS_PART_3,
  ...DATE_IDEAS_PART_4
];

const normalizeLanguage = (language) => (
  Object.prototype.hasOwnProperty.call(DATE_IDEA_TITLES, language) ? language : 'en'
);

export const getDateIdeasForLanguage = (language = 'en') => {
  const lang = normalizeLanguage(language);
  return DATE_IDEA_BASE.map((idea, index) => {
    const title = DATE_IDEA_TITLES[lang][index] || idea.titleEn;
    const description = lang === 'en'
      ? idea.descriptionEn
      : GENERIC_DESCRIPTIONS[lang].replace('{title}', title);

    return {
      ...idea,
      title,
      description,
      category: idea.categories[0],
      location_type: idea.locations[0],
      occasion: idea.occasions[0],
      relationship_stage: idea.stages[0]
    };
  });
};

export const matchesDateIdeaFilter = (idea, filter, value) => {
  if (value === 'all') return true;
  if (filter === 'budget') return idea.budget === value;

  const aliases = {
    category: ['categories', 'category'],
    location: ['locations', 'location_type'],
    occasion: ['occasions', 'occasion'],
    stage: ['stages', 'relationship_stage']
  };

  const [arrayKey, scalarKey] = aliases[filter] || [];
  const list = Array.isArray(idea?.[arrayKey])
    ? idea[arrayKey]
    : idea?.[scalarKey]
      ? [idea[scalarKey]]
      : [];

  return list.includes(value) || (filter === 'stage' && list.includes('any'));
};

export const DATE_IDEA_LIBRARY_SIZE = DATE_IDEA_BASE.length;
