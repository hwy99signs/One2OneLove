// Smoke test for worker/tiktok.ts — runs WITHOUT real credentials, a database,
// or network access to TikTok/Neon. Verifies the graceful states:
//   - non-TikTok paths are ignored (returns null)
//   - every route requires a verified site session (401, no crash)
//   - the OAuth callback with missing configuration redirects gracefully
// Run: node worker/tiktok.smoke.mjs   (requires worker deps: npm --prefix worker install)
import assert from 'node:assert';
import { handleTikTokRequest, tiktokConfig } from './tiktok.ts';

const base = 'https://one2onelove.com';
let passed = 0;
function ok(name) { passed += 1; console.log(`PASS ${name}`); }

// Config detection
assert.equal(tiktokConfig({}).configured, false);
assert.equal(tiktokConfig({ TIKTOK_CLIENT_KEY: 'k', TIKTOK_CLIENT_SECRET: 's' }).configured, true);
assert.equal(tiktokConfig({}).redirectUri, 'https://one2onelove.com/api/tiktok/callback');
assert.equal(tiktokConfig({}).environment, 'sandbox');
assert.equal(tiktokConfig({ TIKTOK_ENV: 'production' }).environment, 'production');
ok('config detection + locked default redirect URI');

// Non-TikTok path returns null (dispatcher falls through)
{
  const res = await handleTikTokRequest(new Request(`${base}/api/health`), {}, new URL(`${base}/api/health`));
  assert.equal(res, null);
  ok('non-tiktok path falls through');
}

// Status without a session cookie -> 401 JSON, no crash, configured=false env
{
  const res = await handleTikTokRequest(new Request(`${base}/api/tiktok/status`), {}, new URL(`${base}/api/tiktok/status`));
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.equal(body.ok, false);
  ok('status requires session (401, graceful)');
}

// Connect without a session -> 401 (never redirects to TikTok unauthenticated)
{
  const res = await handleTikTokRequest(new Request(`${base}/api/tiktok/connect`), {}, new URL(`${base}/api/tiktok/connect`));
  assert.equal(res.status, 401);
  ok('connect requires session (401)');
}

// Connect WITH a cookie but no Neon auth configured -> session cannot be
// established, still 401 and no crash (graceful missing-config behaviour).
{
  const req = new Request(`${base}/api/tiktok/connect`, { headers: { cookie: 'session=abc' } });
  const res = await handleTikTokRequest(req, { TIKTOK_CLIENT_KEY: 'k', TIKTOK_CLIENT_SECRET: 's' }, new URL(`${base}/api/tiktok/connect`));
  assert.equal(res.status, 401);
  ok('connect with unverifiable session stays 401');
}

// Callback without TikTok configuration -> graceful redirect back to the page
{
  const url = new URL(`${base}/api/tiktok/callback?code=x&state=y`);
  const res = await handleTikTokRequest(new Request(url), {}, url);
  assert.equal(res.status, 302);
  assert.match(res.headers.get('location'), /\/TikTokPost\?tiktok=error&reason=not_configured/);
  ok('callback without config redirects gracefully');
}

// Unknown TikTok sub-route -> 404 JSON
{
  const res = await handleTikTokRequest(new Request(`${base}/api/tiktok/nope`), {}, new URL(`${base}/api/tiktok/nope`));
  assert.equal(res.status, 404);
  ok('unknown sub-route 404');
}

console.log(`\n${passed}/7 smoke checks passed`);
