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
