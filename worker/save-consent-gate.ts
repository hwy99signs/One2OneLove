// @ts-nocheck
// Save gate (owner, 2026-11-01): "users can create memories and the like but
// MUST sign up and accept the Terms and Conditions & Disclaimer to save."
// Runs before the record handlers. No session -> falls through so the handler
// returns its normal 401. Signed in without the current Terms + Disclaimer
// acceptance -> 428 terms_consent_required; the app shows the agreement and
// retries the save once accepted. Deletes are never blocked.
import { Client } from 'pg';
import { hasSaveConsent, SAVE_CONSENT_VERSION } from './consents';
import { isConsentProtectedSave } from './save-consent-rules.js';

export { isConsentProtectedSave };

async function sessionUser(request, env) {
  const cookie = request.headers.get('cookie');
  if (!cookie || !env.NEON_AUTH_BASE_URL) return null;
  const res = await fetch(env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/get-session', { headers: { cookie, accept: 'application/json' } }).catch(() => null);
  if (!res?.ok) return null;
  const payload = await res.json().catch(() => null);
  const user = payload?.user ?? payload?.data?.user ?? null;
  const active = payload?.session ?? payload?.data?.session ?? null;
  return user?.id && active ? user : null;
}

export async function saveConsentGate(request, env, url) {
  if (!isConsentProtectedSave(request.method, url.pathname)) return null;
  const user = await sessionUser(request, env);
  if (!user) return null;
  const db = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await db.connect();
  try {
    if (await hasSaveConsent(db, user.id)) return null;
  } finally {
    await db.end().catch(() => {});
  }
  return new Response(JSON.stringify({
    ok: false,
    error: {
      code: 'terms_consent_required',
      message: 'Please accept the One2OneLove Terms of Service and Disclaimer to save.',
      consentVersion: SAVE_CONSENT_VERSION,
    },
  }), { status: 428, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
