import fs from 'node:fs';

const failures = [];
const migrationFile = 'supabase/migrations/20260817_live_room_host_cache.sql';
const functionFile = 'supabase/functions/live-room-host/index.ts';
const migration = fs.readFileSync(migrationFile, 'utf8');
const fn = fs.readFileSync(functionFile, 'utf8');

for (const required of [
  "'global-relationship-room'",
  "language in ('en','es','fr','it','de')",
  'live_room_host_prompt_cache_bucket_uidx',
  '(room_slug, language, reason, bucket_start)',
  'revoke all on table public.live_room_host_prompt_cache from public, anon, authenticated;',
  'create or replace function o2ol_private.set_live_room_host_prompt_cache_updated_at()',
  'security invoker',
  "set search_path = ''",
  'revoke all on function o2ol_private.set_live_room_host_prompt_cache_updated_at() from public, anon, authenticated;',
]) {
  if (!migration.includes(required)) failures.push(`${migrationFile}: missing AI-host cache safeguard ${required}.`);
}

for (const forbidden of [
  "language in ('en','es','fr','it','de','nl')",
  'unique (room_slug, language, context_hash, bucket_start)',
  'create or replace function public.set_live_room_host_prompt_cache_updated_at()',
]) {
  if (migration.includes(forbidden)) failures.push(`${migrationFile}: stale AI-host cache behavior remains (${forbidden}).`);
}

for (const required of [
  'const MAX_BODY_BYTES = 64 * 1024',
  "'global-relationship-room':",
  "if (request.method !== 'POST') return json(request, { error: 'METHOD_NOT_ALLOWED' }, 405)",
  "return json(request, { error: 'REQUEST_TOO_LARGE' }, 413)",
  "if (!authHeader.toLowerCase().startsWith('bearer '))",
  "return json(request, { error: 'EMAIL_NOT_CONFIRMED' }, 403)",
  "if (Deno.env.get('LIVE_ROOM_AI_ENABLED') !== 'true') return fallbackResponse(request)",
  'const contextHash = await sha256Hex',
  "eq('reason', reason)",
  "eq('bucket_start', bucket)",
  'lookup intentionally ignores context_hash',
  "model: Deno.env.get('OPENAI_MODEL') || 'gpt-5.6'",
  'store: false',
  'signal: AbortSignal.timeout(15_000)',
]) {
  if (!fn.includes(required)) failures.push(`${functionFile}: missing AI-host request/cost safeguard ${required}.`);
}

for (const forbidden of [
  "eq('context_hash', contextHash)",
  "error: 'Method not allowed'",
  "error: 'Origin not allowed'",
  "error: 'Authentication required'",
  "error: 'Confirm your email",
  "nl: 'Dutch'",
]) {
  if (fn.includes(forbidden)) failures.push(`${functionFile}: AI-host must not permit context-keyed generation, member-facing English error prose, or inactive Dutch runtime (${forbidden}).`);
}

if (failures.length) {
  console.error('\n⛔ One2OneLove Live Room AI-host security check failed:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('✅ Live Room AI host is authenticated, five-language scoped, request-bounded, provider-secret isolated and generation-bucket cost guarded.');
