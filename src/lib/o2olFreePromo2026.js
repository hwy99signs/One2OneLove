// One2OneLove is a free platform during its launch period (owner decision, 2026-11-25; wording rule 2026-11-27: never promise free-forever or no-card-ever — charging may return).
//
// This module used to describe the temporary Oct 29 – Dec 31, 2026 free
// promotion (with a Jan 1, 2027 relock). That promotion is over because the
// whole platform went free for good: every feature that remains is free for
// everyone, no signup and no card required, and the per-use-cost features
// (AI replies, AI content generation, AI reports, SMS sending) were retired
// instead of charged for. The exports keep their historical names so existing
// imports keep working, but the semantics are now the open launch period, not a dated window:
// "promo active" always reads true and every listed feature is free during our launch period.
// There is no relock date.
export const O2OL_FREE_PROMO_START = '2026-10-29T05:00:00.000Z'; // historical: midnight CDT
export const O2OL_FREE_PROMO_END_EXCLUSIVE = null; // no end date in code — ending the free period is an owner decision (100-user trigger, 2026-11-27)
// RE-ACTIVATION RULE (owner ruling, 2026-11-27): subscription may be turned on when
// One2OneLove reaches 100 users. Members who joined while it was free are
// GRANDFATHERED FREE — charging applies to new joiners after the trigger only.
export const O2OL_SUBSCRIPTION_TRIGGER_USERS = 100;
export const O2OL_EARLY_MEMBERS_GRANDFATHERED_FREE = true;
export const O2OL_FREE_PROMO_MESSAGE = 'One2OneLove is 100% FREE — every feature is free for everyone. No signup, no card, no Credit.';

export const O2OL_FREE_PROMO_MESSAGES = Object.freeze({
  en: O2OL_FREE_PROMO_MESSAGE,
  es: 'One2OneLove es 100% GRATIS — todas las funciones son gratuitas para todos. Sin registro, sin tarjeta, sin Crédito.',
  fr: 'One2OneLove est 100 % GRATUIT — chaque fonctionnalité est gratuite pour tout le monde. Sans inscription, sans carte, sans Crédit.',
  it: 'One2OneLove è 100% GRATIS — ogni funzione è gratuita per tutti. Nessuna registrazione, nessuna carta, nessun Credito.',
  de: 'One2OneLove ist 100 % KOSTENLOS — jede Funktion ist für alle kostenlos. Keine Anmeldung, keine Karte, kein Credit.',
});
export const freePromoMessage = (language = 'en') => O2OL_FREE_PROMO_MESSAGES[language] || O2OL_FREE_PROMO_MESSAGE;

// Every feature that still exists on the platform is free. (AI and SMS
// features are NOT listed: they were retired, not made free.)
export const O2OL_FREE_PROMO_FEATURES = Object.freeze([
  'memories_unlock', 'journals_unlock', 'milestones_unlock', 'goals_unlock', 'calendar_unlock',
  'date_idea_unlock',
  'love_note_template_unlock', 'love_language_report', 'compatibility_report',
  'relationship_pattern_report', 'premium_report', 'report_export',
  'love_note_custom', 'love_note_schedule',
  'studio_episode_unlock', 'podcast_episode_unlock',
  'like_minded_session', 'scratch_game_session', 'premium_game_session',
  'free_core', 'profile_photos', 'chat_presence', 'community_chat', 'communities', 'buddies',
]);

const freeFeatureSet = new Set(O2OL_FREE_PROMO_FEATURES);

export function isO2OLFreePromoActive(now = new Date()) {
  // Free platform (2026-11-25): the free period has no coded end date; the owner ends it by decision.
  void now;
  return true;
}
export function isO2OLPromoFreeFeature(featureCode, now = new Date()) {
  void now;
  return freeFeatureSet.has(String(featureCode || ''));
}

// Studio/podcast media features stay free under the current-shows-free ruling.
// Games have their separate free-games rule in o2olGamePolicy.js.
export const O2OL_PERMANENT_FREE_MEDIA_FEATURES = Object.freeze(['studio_episode_unlock','podcast_episode_unlock']);
const permanentFreeMediaSet = new Set(O2OL_PERMANENT_FREE_MEDIA_FEATURES);
export function isO2OLPermanentlyFreeMediaFeature(featureCode) {
  return permanentFreeMediaSet.has(String(featureCode||''));
}
