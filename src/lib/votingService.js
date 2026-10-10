import { apiRequest } from './apiClient';

// Ballots for the standard voting-question feature (see
// src/lib/votingQuestions.js for the question registry and
// worker/voting.ts for the endpoint).

export async function getMyBallot(topicSlug) {
  const payload = await apiRequest(`/api/voting/ballots/me?topic=${encodeURIComponent(topicSlug)}`);
  return payload?.ballot || null;
}

export async function castBallot({ topicSlug, priorities, expenseSplit, respondentIdentity = '', partnerIdentity = '' }) {
  const payload = await apiRequest('/api/voting/ballots', {
    method: 'POST',
    body: {
      topicSlug,
      priorities,
      expenseSplit,
      respondentIdentity: respondentIdentity || null,
      partnerIdentity: partnerIdentity || null,
    },
  });
  return payload?.ballot || null;
}

// --- Click-to-Vote (owner design, 2026-10-10) ------------------------------
// Choice ballots for CLICK_VOTE_QUESTIONS. A cast vote also posts into the
// question's chat room (server-side), and Amora may answer it there.

export async function getMyClickBallots() {
  const payload = await apiRequest('/api/voting/click/me');
  return payload?.ballots || {};
}

export async function getClickResults() {
  const payload = await apiRequest('/api/voting/click/results');
  return payload?.results || {};
}

export async function castClickVote({ topicSlug, choice = '', comment = '' }) {
  const payload = await apiRequest('/api/voting/click/ballots', {
    method: 'POST',
    body: { topicSlug, choice: choice || undefined, comment: comment || undefined },
  });
  return payload;
}
