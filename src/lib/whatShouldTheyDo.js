import { apiRequest } from '@/lib/apiClient';

const VISITOR_KEY = 'o2ol_wstd_visitor_id';
export const IS_WSTD_PREVIEW_DEMO = import.meta.env.VITE_WSTD_DEMO_MODE === 'true';

const DEMO_QUESTIONS = [
  {
    id: 1,
    slug: 'late-night-ex-texts',
    prompt: 'What should they do?',
    scenario: 'Your partner’s ex keeps texting late at night. Your partner says it is harmless, but it is making you uncomfortable.',
    category: 'boundaries',
    options: [
      { id: 101, optionKey: 'boundary', label: 'Set a clear boundary together' },
      { id: 102, optionKey: 'trust', label: 'Trust the partner and leave it alone' },
      { id: 103, optionKey: 'block', label: 'Ask the ex to be blocked' },
      { id: 104, optionKey: 'rethink', label: 'Reconsider the relationship' },
    ],
  },
  {
    id: 2,
    slug: 'move-in-timing',
    prompt: 'What should they do?',
    scenario: 'One person is ready to move in together now. The other wants to wait another six months before sharing a home.',
    category: 'commitment',
    options: [
      { id: 201, optionKey: 'wait', label: 'Wait the six months' },
      { id: 202, optionKey: 'date', label: 'Agree on a firm middle-ground date' },
      { id: 203, optionKey: 'now', label: 'Move in now and work through concerns' },
      { id: 204, optionKey: 'reassess', label: 'Reassess whether they want the same future' },
    ],
  },
  {
    id: 3,
    slug: 'family-disrespect',
    prompt: 'What should they do?',
    scenario: 'Your partner’s family repeatedly makes disrespectful comments about you, and your partner usually stays quiet to avoid conflict.',
    category: 'family',
    options: [
      { id: 301, optionKey: 'partner', label: 'The partner should address the family directly' },
      { id: 302, optionKey: 'together', label: 'They should address the family together' },
      { id: 303, optionKey: 'distance', label: 'Create distance from the family' },
      { id: 304, optionKey: 'ignore', label: 'Ignore the comments to keep the peace' },
    ],
  },
  {
    id: 4,
    slug: 'money-secret',
    prompt: 'What should they do?',
    scenario: 'One partner discovers the other has been hiding a large credit-card balance because they were embarrassed to talk about it.',
    category: 'money',
    options: [
      { id: 401, optionKey: 'plan', label: 'Disclose everything and make a repayment plan together' },
      { id: 402, optionKey: 'separate', label: 'Keep finances separate until trust is rebuilt' },
      { id: 403, optionKey: 'counsel', label: 'Get professional financial counseling' },
      { id: 404, optionKey: 'leave', label: 'End the relationship over the secrecy' },
    ],
  },
  {
    id: 5,
    slug: 'phone-privacy',
    prompt: 'What should they do?',
    scenario: 'A partner asks to see the other person’s phone after noticing secretive behavior. The other partner says that crosses a privacy boundary.',
    category: 'trust',
    options: [
      { id: 501, optionKey: 'show', label: 'Show the phone this one time' },
      { id: 502, optionKey: 'talk', label: 'Talk through the suspicious behavior without a phone search' },
      { id: 503, optionKey: 'open-policy', label: 'Agree on an open-phone policy going forward' },
      { id: 504, optionKey: 'privacy', label: 'Keep phones private and require trust' },
    ],
  },
  {
    id: 6,
    slug: 'career-relocation',
    prompt: 'What should they do?',
    scenario: 'One partner receives a major career opportunity in another state, but accepting it would mean relocating the relationship.',
    category: 'life-decisions',
    options: [
      { id: 601, optionKey: 'move', label: 'Relocate together' },
      { id: 602, optionKey: 'distance', label: 'Try long-distance for a set period' },
      { id: 603, optionKey: 'decline', label: 'Decline the opportunity for the relationship' },
      { id: 604, optionKey: 'separate', label: 'Separate if neither person can compromise' },
    ],
  },
  {
    id: 7,
    slug: 'wedding-budget',
    prompt: 'What should they do?',
    scenario: 'They want to get married, but one person wants a large wedding and the other wants to use most of the money toward a home.',
    category: 'money',
    options: [
      { id: 701, optionKey: 'small', label: 'Have a smaller wedding and prioritize the home' },
      { id: 702, optionKey: 'wedding', label: 'Have the large wedding they want' },
      { id: 703, optionKey: 'split', label: 'Set a hard budget and split the remaining money toward a home' },
      { id: 704, optionKey: 'delay', label: 'Delay the wedding until they can afford both goals' },
    ],
  },
  {
    id: 8,
    slug: 'friendship-boundary',
    prompt: 'What should they do?',
    scenario: 'One partner has a very close friendship with someone the other partner believes is crossing emotional boundaries.',
    category: 'boundaries',
    options: [
      { id: 801, optionKey: 'boundaries', label: 'Set mutually agreed friendship boundaries' },
      { id: 802, optionKey: 'end-friendship', label: 'End the friendship' },
      { id: 803, optionKey: 'trust', label: 'Trust the partner and make no changes' },
      { id: 804, optionKey: 'counsel', label: 'Discuss the issue with a neutral counselor' },
    ],
  },
];

const GLOBAL_COUNT_SETS = [
  [612, 389, 233, 142],
  [487, 441, 286, 173],
  [530, 368, 252, 157],
  [455, 397, 311, 184],
];

const COUNTRY_BASE_COUNTS = {
  US: [243, 151, 92, 61],
  GB: [118, 96, 64, 37],
  CA: [94, 77, 51, 28],
  AU: [71, 58, 43, 24],
};

function makeVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

function rotate(values, amount) {
  const shift = ((amount % values.length) + values.length) % values.length;
  return [...values.slice(shift), ...values.slice(0, shift)];
}

function toResultOptions(question, counts) {
  const total = counts.reduce((sum, value) => sum + value, 0);
  return question.options.map((option, index) => ({
    optionId: option.id,
    optionKey: option.optionKey,
    label: option.label,
    votes: counts[index] || 0,
    percentage: total ? Math.round(((counts[index] || 0) / total) * 100) : 0,
  }));
}

function buildDemoResults(questionId, selectedOptionId = null) {
  const question = DEMO_QUESTIONS.find(item => Number(item.id) === Number(questionId));
  if (!question) throw new Error('Preview question was not found.');

  const globalCounts = [...GLOBAL_COUNT_SETS[(Number(questionId) - 1) % GLOBAL_COUNT_SETS.length]];
  const selectedIndex = question.options.findIndex(option => Number(option.id) === Number(selectedOptionId));
  if (selectedIndex >= 0) globalCounts[selectedIndex] += 1;

  const countries = Object.entries(COUNTRY_BASE_COUNTS).map(([countryCode, baseCounts], countryIndex) => {
    const counts = rotate(baseCounts, (Number(questionId) + countryIndex - 1) % baseCounts.length);
    const totalVotes = counts.reduce((sum, value) => sum + value, 0);
    return {
      countryCode,
      totalVotes,
      options: toResultOptions(question, counts),
    };
  });

  return {
    totalVotes: globalCounts.reduce((sum, value) => sum + value, 0),
    global: toResultOptions(question, globalCounts),
    countries,
    countryMinimumVotes: 5,
    preview: true,
  };
}

function previewDelay() {
  return new Promise(resolve => window.setTimeout(resolve, 220));
}

export function getVisitorId() {
  if (typeof window === 'undefined') return 'server-rendered-visitor';
  let visitorId = window.localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = makeVisitorId();
    window.localStorage.setItem(VISITOR_KEY, visitorId);
  }
  return visitorId;
}

export async function getWhatShouldTheyDoQuestions(limit = 20) {
  if (IS_WSTD_PREVIEW_DEMO) {
    await previewDelay();
    return DEMO_QUESTIONS.slice(0, Math.max(1, Math.min(Number(limit) || 20, DEMO_QUESTIONS.length)));
  }

  const payload = await apiRequest(`/api/what-should-they-do/questions?limit=${limit}`);
  return payload?.questions || [];
}

export async function submitWhatShouldTheyDoVote(questionId, optionId) {
  if (IS_WSTD_PREVIEW_DEMO) {
    await previewDelay();
    return {
      ok: true,
      preview: true,
      selectedOptionId: Number(optionId),
      alreadyVoted: false,
      countryCode: 'US',
      results: buildDemoResults(questionId, optionId),
    };
  }

  return apiRequest('/api/what-should-they-do/votes', {
    method: 'POST',
    body: {
      questionId,
      optionId,
      visitorId: getVisitorId(),
    },
  });
}

export async function getWhatShouldTheyDoResults(questionId) {
  if (IS_WSTD_PREVIEW_DEMO) {
    await previewDelay();
    return {
      ok: true,
      preview: true,
      results: buildDemoResults(questionId),
    };
  }

  return apiRequest(`/api/what-should-they-do/results/${questionId}`);
}
