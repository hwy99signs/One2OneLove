// Owner rulings: games are free under the all-free launch (2026-11-25); wording rule 2026-11-27 — never promise FREE DURING LAUNCH; charging may be re-activated later.
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
  en:'ALL GAMES FREE DURING LAUNCH', es:'TODOS LOS JUEGOS GRATIS DURANTE EL LANZAMIENTO',
  fr:'TOUS LES JEUX GRATUITS PENDANT LE LANCEMENT', it:'TUTTI I GIOCHI GRATIS DURANTE IL LANCIO',
  de:'ALLE SPIELE KOSTENLOS IN DER STARTPHASE',
});
export function permanentFreeGamesLabel(language='en'){
  return O2OL_GAME_FREE_LABELS[language] || O2OL_GAME_FREE_LABELS.en;
}
