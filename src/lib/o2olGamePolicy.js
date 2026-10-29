// Owner amendment (2026-10-29): every current and future O2OL game is FREE forever.
// Independent of the time-boxed non-game feature promotion and its Jan 1 relock.
// Keep verified sign-in, play sessions and leaderboards; never charge Credit for games.
export const PERMANENT_FREE_GAMES = true;
const LEGACY_GAME_FEATURES = new Set([
  'like_minded_session','scratch_game_session','premium_game_session',
]);
export function isO2OLPermanentFreeGameFeature(featureCode) {
  const code=String(featureCode || '').trim().toLowerCase();
  return LEGACY_GAME_FEATURES.has(code) || code.startsWith('game_') || code.endsWith('_game_session');
}
export const O2OL_GAME_FREE_LABELS = Object.freeze({
  en:'ALL GAMES FREE FOREVER', es:'TODOS LOS JUEGOS GRATIS PARA SIEMPRE',
  fr:'TOUS LES JEUX GRATUITS POUR TOUJOURS', it:'TUTTI I GIOCHI GRATIS PER SEMPRE',
  de:'ALLE SPIELE FÜR IMMER KOSTENLOS',
});
export function permanentFreeGamesLabel(language='en'){
  return O2OL_GAME_FREE_LABELS[language] || O2OL_GAME_FREE_LABELS.en;
}
