// Shared activity / polling discipline for session, profile and admin
// keep-alive traffic.
//
// Ordered by Eisenhower 2026-10-08 after one client generated ~18.9k
// requests overnight (about one /api/auth/get-session, /api/profile and
// /api/admin/mfa/status per full page load, for ~7 hours). Two rules live
// here so every poller shares them instead of growing per-component hacks:
//
// 1. IDLE STOP. Polling halts completely once the page has seen no user
//    interaction for a while — 5 minutes on user-facing pages, 15 minutes
//    on admin pages — even if the tab is left visible on screen. It resumes
//    on renewed activity (click / keypress / pointer / touch). A page load
//    itself counts as activity, so a freshly opened page always starts in
//    the "active" state. This module knows nothing about endpoints; callers
//    ask isIdleFor(limit) before firing and can subscribe with
//    onResumeFromIdle(limit, cb) to refresh immediately when the user comes
//    back after an idle stop.
//
// 2. AUTO-REDIRECT LOOP GUARD. Several auth/admin screens redirect to each
//    other automatically (Admin <-> AdminAccess, trial-expired ->
//    /Subscription). If the two sides ever disagree, those redirects become
//    an unbounded full-page-reload loop — each reload re-fires the session,
//    profile and MFA-status requests. claimAutoRedirect(key, limit,
//    windowMs) records an automatic redirect in sessionStorage and returns
//    false once the same key has redirected too many times inside the
//    window; callers then stay put instead of bouncing again.

export const USER_IDLE_LIMIT_MS = 5 * 60 * 1000;
export const ADMIN_IDLE_LIMIT_MS = 15 * 60 * 1000;

let lastActivityAt = Date.now();
let listenersInstalled = false;
const resumeWatchers = new Set();

function handleActivityEvent() {
  const now = Date.now();
  const idleForMs = now - lastActivityAt;
  lastActivityAt = now;
  if (!resumeWatchers.size) return;
  for (const watcher of Array.from(resumeWatchers)) {
    if (idleForMs >= watcher.limitMs) {
      try { watcher.callback(); } catch { /* a caller's refresh must never break the listener */ }
    }
  }
}

function installActivityListeners() {
  if (listenersInstalled || typeof window === 'undefined') return;
  listenersInstalled = true;
  const options = { passive: true, capture: true };
  for (const type of ['pointerdown', 'keydown', 'click', 'touchstart']) {
    window.addEventListener(type, handleActivityEvent, options);
  }
}

installActivityListeners();

export function lastUserActivityAt() {
  return lastActivityAt;
}

export function isIdleFor(limitMs) {
  return Date.now() - lastActivityAt >= limitMs;
}

export function isDocumentHidden() {
  return typeof document !== 'undefined' && document.visibilityState !== 'visible';
}

// Fire `callback` when user activity resumes after an idle gap of at least
// `limitMs`. Returns an unsubscribe function.
export function onResumeFromIdle(limitMs, callback) {
  const watcher = { limitMs, callback };
  resumeWatchers.add(watcher);
  return () => resumeWatchers.delete(watcher);
}

const REDIRECT_KEY_PREFIX = 'o2ol.autoRedirect.';

function readRedirectLog(key) {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(REDIRECT_KEY_PREFIX + key) || '[]');
    return Array.isArray(parsed) ? parsed.filter((t) => Number.isFinite(t)) : [];
  } catch {
    return [];
  }
}

// Returns true (and records the redirect) when an automatic redirect under
// `key` is still within budget: fewer than `limit` redirects inside the
// trailing `windowMs`. Returns false when the budget is exhausted — the
// caller must NOT redirect.
export function claimAutoRedirect(key, limit, windowMs) {
  if (typeof window === 'undefined') return true;
  const now = Date.now();
  const recent = readRedirectLog(key).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  try {
    window.sessionStorage.setItem(REDIRECT_KEY_PREFIX + key, JSON.stringify(recent));
  } catch { /* storage unavailable: allow the redirect rather than trapping the user */ }
  return true;
}

// Shared budgets. The admin auth screens may legitimately bounce a couple
// of times during sign-in/MFA hand-off, but never six times a minute.
export const ADMIN_AUTH_REDIRECT = { key: 'admin-auth', limit: 3, windowMs: 60 * 1000 };
// An expired-trial notice may send the user to /Subscription once; after
// that the page itself carries the state, no repeated forced navigation.
export const TRIAL_REDIRECT = { key: 'trial-expired', limit: 1, windowMs: 10 * 60 * 1000 };
