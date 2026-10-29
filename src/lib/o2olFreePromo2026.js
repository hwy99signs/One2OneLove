// One source of truth for the owner-approved temporary free promotion.
// America/Chicago: Thursday, Oct 29, 2026 through Dec 31, 2026 at 11:59:59.999 PM CST.
// Expiry is exclusive; all paid gates relock automatically on Jan 1, 2027.
// Never modify the stored prices or write permanent entitlements for promo access.
export const O2OL_FREE_PROMO_START = '2026-10-29T05:00:00.000Z'; // midnight CDT
export const O2OL_FREE_PROMO_END_EXCLUSIVE = '2027-01-01T06:00:00.000Z'; // midnight CST
export const O2OL_FREE_PROMO_MESSAGE = '100% FREE until Dec 31, 2026 — from Jan 1, standard prices return ($2.99 to unlock each feature).';

export const O2OL_FREE_PROMO_FEATURES = Object.freeze([
  'memories_unlock', 'journals_unlock', 'milestones_unlock', 'goals_unlock', 'calendar_unlock',
  'studio_episode_unlock', 'podcast_episode_unlock', 'date_idea_unlock',
  'love_note_template_unlock', 'love_language_report', 'compatibility_report',
  'relationship_pattern_report', 'premium_game_session', 'like_minded_session',
  'scratch_game_session',
]);

const freeFeatureSet = new Set(O2OL_FREE_PROMO_FEATURES);

export function isO2OLFreePromoActive(now = new Date()) {
  const time = now instanceof Date ? now.getTime() : new Date(now).getTime();
  return Number.isFinite(time) && time >= Date.parse(O2OL_FREE_PROMO_START)
    && time < Date.parse(O2OL_FREE_PROMO_END_EXCLUSIVE);
}
export function isO2OLPromoFreeFeature(featureCode, now = new Date()) {
  return isO2OLFreePromoActive(now) && freeFeatureSet.has(String(featureCode || ''));
}
