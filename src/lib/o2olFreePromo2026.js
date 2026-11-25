// One2OneLove is now a permanently free platform (owner decision, 2026-11-25).
//
// This module used to describe the temporary Oct 29 – Dec 31, 2026 free
// promotion (with a Jan 1, 2027 relock). That promotion is over because the
// whole platform went free for good: every feature that remains is free for
// everyone, no signup and no card required, and the per-use-cost features
// (AI replies, AI content generation, AI reports, SMS sending) were retired
// instead of charged for. The exports keep their historical names so existing
// imports keep working, but the semantics are now PERMANENT, not a window:
// "promo active" always reads true and every listed feature is free forever.
// There is no relock date.
export const O2OL_FREE_PROMO_START = '2026-10-29T05:00:00.000Z'; // historical: midnight CDT
export const O2OL_FREE_PROMO_END_EXCLUSIVE = null; // permanent — no end, no relock
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
  // Permanent free platform (2026-11-25): the "promotion" never ends.
  void now;
  return true;
}
export function isO2OLPromoFreeFeature(featureCode, now = new Date()) {
  void now;
  return freeFeatureSet.has(String(featureCode || ''));
}

// Permanently free media stays free. All current/future One2OneLove games
// have their separate permanent-free rule.
export const O2OL_PERMANENT_FREE_MEDIA_FEATURES = Object.freeze(['studio_episode_unlock','podcast_episode_unlock']);
const permanentFreeMediaSet = new Set(O2OL_PERMANENT_FREE_MEDIA_FEATURES);
export function isO2OLPermanentlyFreeMediaFeature(featureCode) {
  return permanentFreeMediaSet.has(String(featureCode||''));
}
