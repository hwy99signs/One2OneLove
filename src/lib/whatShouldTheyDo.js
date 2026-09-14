import { apiRequest } from '@/lib/apiClient';

const VISITOR_KEY = 'o2ol_wstd_visitor_id';

function makeVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
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
  const payload = await apiRequest(`/api/what-should-they-do/questions?limit=${limit}`);
  return payload?.questions || [];
}

export async function submitWhatShouldTheyDoVote(questionId, optionId) {
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
  return apiRequest(`/api/what-should-they-do/results/${questionId}`);
}
