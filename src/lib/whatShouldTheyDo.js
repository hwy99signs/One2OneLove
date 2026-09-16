import { apiRequest } from '@/lib/apiClient';
import { QUESTION_BANK_BATCH_1 } from '@/features/whatShouldTheyDo/questionBankBatch1';
import { QUESTION_BANK_BATCH_2 } from '@/features/whatShouldTheyDo/questionBankBatch2';

const VISITOR_KEY = 'o2ol_wstd_visitor_id';
export const IS_WSTD_PREVIEW_DEMO = import.meta.env.VITE_WSTD_DEMO_MODE === 'true';

const DEMO_QUESTIONS = [...QUESTION_BANK_BATCH_1, ...QUESTION_BANK_BATCH_2];

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
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
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
    return {
      countryCode,
      totalVotes: counts.reduce((sum, value) => sum + value, 0),
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
    body: { questionId, optionId, visitorId: getVisitorId() },
  });
}

export async function getWhatShouldTheyDoResults(questionId) {
  if (IS_WSTD_PREVIEW_DEMO) {
    await previewDelay();
    return { ok: true, preview: true, results: buildDemoResults(questionId) };
  }
  return apiRequest(`/api/what-should-they-do/results/${questionId}`);
}
