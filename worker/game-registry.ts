// @ts-nocheck
// Canonical One2OneLove game registry.
// All game economy, promotion and leaderboard behavior must resolve through this file.

export const GAME_REGISTRY = Object.freeze({
  what_should_they_do: Object.freeze({
    id: 'what_should_they_do',
    title: 'What Should They Do?',
    category: 'brain',
    chargeFeature: 'premium_game_session',
    route: '/WhatShouldTheyDo',
    accessPath: 'standard',
    priceCents: 49,
    leaderboard: false, // No native numeric score is present in the current game code.
    scoreLabel: null,
    scoreCap: null,
  }),
  like_minded: Object.freeze({
    id: 'like_minded',
    title: 'Like Minded?',
    category: 'brain',
    chargeFeature: 'like_minded_session',
    route: '/LikeMinded',
    accessPath: 'like_minded',
    priceCents: 49,
    leaderboard: true,
    scoreLabel: 'matches',
    scoreCap: 1000,
  }),
  scratch: Object.freeze({
    id: 'scratch',
    title: 'One2OneLove Scratch Game',
    category: 'arcade',
    chargeFeature: 'scratch_game_session',
    route: '/ScratchGame',
    accessPath: 'scratch',
    priceCents: 49,
    leaderboard: false,
    scoreLabel: null,
    scoreCap: null,
  }),
  pests: Object.freeze({
    id: 'pests',
    title: "PEST'S",
    category: 'arcade',
    chargeFeature: 'premium_game_session',
    route: '/Pests',
    accessPath: 'standard',
    priceCents: 49,
    leaderboard: true,
    scoreLabel: 'catches',
    scoreCap: 100000,
  }),
  scrabluko: Object.freeze({
    id: 'scrabluko',
    title: 'Scrabluko',
    category: 'brain',
    chargeFeature: 'premium_game_session',
    route: '/Scrabluko',
    accessPath: 'standard',
    priceCents: 49,
    leaderboard: true,
    scoreLabel: 'points',
    scoreCap: 1000000,
  }),
});

export const GAME_IDS = Object.freeze(Object.keys(GAME_REGISTRY));

export function gameDefinition(gameId) {
  return GAME_REGISTRY[String(gameId || '').trim()] || null;
}

export function requireGameDefinition(gameId) {
  const game = gameDefinition(gameId);
  if (!game) {
    throw Object.assign(new Error('This game is not available.'), {
      status: 400,
      code: 'game_invalid',
    });
  }
  return game;
}

export function standardGameIds() {
  return GAME_IDS.filter(id => GAME_REGISTRY[id].accessPath === 'standard');
}
