export const WSTD_CATEGORY_THEMES = {
  communication: {
    label: 'Communication',
    iconKey: 'message',
    accent: '#2563eb',
    gradient: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 48%, #fdf2f8 100%)',
    sceneKeywords: 'couple,conversation',
  },
  'trust-honesty': {
    label: 'Trust & Honesty',
    iconKey: 'lock',
    accent: '#0f766e',
    gradient: 'linear-gradient(135deg, #ecfdf5 0%, #dbeafe 52%, #ffffff 100%)',
    sceneKeywords: 'couple,phone,conversation',
  },
  boundaries: {
    label: 'Boundaries',
    iconKey: 'shield',
    accent: '#7c3aed',
    gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 48%, #fdf2f8 100%)',
    sceneKeywords: 'people,home,conversation',
  },
  'conflict-repair': {
    label: 'Conflict & Repair',
    iconKey: 'refresh',
    accent: '#ea580c',
    gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 46%, #fef2f2 100%)',
    sceneKeywords: 'couple,argument,conversation',
  },
  'emotional-needs': {
    label: 'Emotional Needs',
    iconKey: 'heart',
    accent: '#db2777',
    gradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 46%, #fff7ed 100%)',
    sceneKeywords: 'couple,support,emotion',
  },
  'attachment-closeness': {
    label: 'Attachment & Closeness',
    iconKey: 'link',
    accent: '#0891b2',
    gradient: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 46%, #eef2ff 100%)',
    sceneKeywords: 'couple,closeness,home',
  },
  'independence-togetherness': {
    label: 'Independence vs. Togetherness',
    iconKey: 'split',
    accent: '#4f46e5',
    gradient: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 46%, #ecfeff 100%)',
    sceneKeywords: 'friends,travel,couple',
  },
  'jealousy-insecurity': {
    label: 'Jealousy & Insecurity',
    iconKey: 'eye',
    accent: '#be123c',
    gradient: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 46%, #fdf2f8 100%)',
    sceneKeywords: 'couple,phone,jealousy',
  },
  'forgiveness-resentment': {
    label: 'Forgiveness & Resentment',
    iconKey: 'heartRepair',
    accent: '#c2410c',
    gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 44%, #faf5ff 100%)',
    sceneKeywords: 'couple,apology,emotion',
  },
  'family-in-laws': {
    label: 'Family & In-Laws',
    iconKey: 'home',
    accent: '#15803d',
    gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 46%, #fefce8 100%)',
    sceneKeywords: 'family,home,conversation',
  },
};

const PRESENTATION_CYCLE = [
  'scene', 'text', 'graphic', 'scene', 'text',
  'scene', 'graphic', 'text', 'scene', 'text',
  'graphic', 'scene', 'text', 'scene', 'graphic',
  'text', 'scene', 'text', 'graphic', 'scene',
];

const CATEGORY_ORDER = Object.keys(WSTD_CATEGORY_THEMES);

export function getQuestionPresentation(index = 0) {
  return PRESENTATION_CYCLE[((Number(index) || 0) % PRESENTATION_CYCLE.length + PRESENTATION_CYCLE.length) % PRESENTATION_CYCLE.length];
}

export function getQuestionTheme(category) {
  return WSTD_CATEGORY_THEMES[category] || {
    label: String(category || 'Relationships').replaceAll('-', ' '),
    iconKey: 'message',
    accent: '#2563eb',
    gradient: 'linear-gradient(135deg, #eff6ff 0%, #fdf2f8 100%)',
    sceneKeywords: 'people,conversation',
  };
}

export function getQuestionSceneUrl(question, index = 0, width = 1200, height = 800) {
  const category = question?.category || 'communication';
  const theme = getQuestionTheme(category);
  const categoryIndex = Math.max(0, CATEGORY_ORDER.indexOf(category));
  const sceneSlot = ((Number(index) || 0) % 6 + 6) % 6;
  const lock = 100 + categoryIndex * 10 + sceneSlot;
  return `https://loremflickr.com/${width}/${height}/${theme.sceneKeywords}?lock=${lock}`;
}

export function getQuestionVisual(question, index = 0) {
  return {
    presentation: getQuestionPresentation(index),
    theme: getQuestionTheme(question?.category),
    sceneUrl: getQuestionSceneUrl(question, index),
  };
}
