-- One2OneLove relaunch: Live Room AI Host generation cache / cost guard
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- The browser never reads this table directly. The authenticated Edge Function uses
-- service_role to atomically claim at most one generation slot per room/language/reason
-- and time bucket. Caller-supplied conversation text may change context_hash for audit
-- purposes, but cannot create additional AI generations inside the same bucket.

begin;

create schema if not exists o2ol_private;
revoke all on schema o2ol_private from public, anon;

create table if not exists public.live_room_host_prompt_cache (
  id uuid primary key default gen_random_uuid(),
  room_slug text not null check (room_slug in (
    'global-relationship-room',
    'vent-room',
    'modern-dating-unfiltered',
    'love-talk',
    'marriage-matters',
    'starting-over'
  )),
  language text not null default 'en' check (language in ('en','es','fr','it','de')),
  context_hash text not null check (char_length(context_hash) = 64),
  bucket_start timestamptz not null,
  reason text not null check (reason in ('room_empty', 'room_quiet')),
  status text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  prompt text check (prompt is null or char_length(prompt) <= 500),
  source text check (source is null or source in ('ai', 'fallback')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_slug, language, reason, bucket_start)
);

-- This explicit index also hardens an already-created development table that may still
-- carry the older context_hash-inclusive unique constraint. Different context must not
-- bypass the per-bucket generation ceiling.
create unique index if not exists live_room_host_prompt_cache_bucket_uidx
  on public.live_room_host_prompt_cache (room_slug, language, reason, bucket_start);

create index if not exists live_room_host_prompt_cache_created_idx
  on public.live_room_host_prompt_cache (created_at desc);

alter table public.live_room_host_prompt_cache enable row level security;
revoke all on table public.live_room_host_prompt_cache from public, anon, authenticated;

create or replace function o2ol_private.set_live_room_host_prompt_cache_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function o2ol_private.set_live_room_host_prompt_cache_updated_at() from public, anon, authenticated;

drop function if exists public.set_live_room_host_prompt_cache_updated_at() cascade;
drop trigger if exists live_room_host_prompt_cache_updated_at on public.live_room_host_prompt_cache;
create trigger live_room_host_prompt_cache_updated_at
before update on public.live_room_host_prompt_cache
for each row execute function o2ol_private.set_live_room_host_prompt_cache_updated_at();

comment on table public.live_room_host_prompt_cache is
  'Server-only AI Host cache/cost guard. One generation claim per room/language/reason/time bucket; context variation cannot multiply AI calls.';
comment on function o2ol_private.set_live_room_host_prompt_cache_updated_at() is
  'Private SECURITY INVOKER timestamp trigger helper for the AI Host cache.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Deploy live-room-host with LIVE_ROOM_AI_ENABLED=false first.
-- 2. Configure LIVE_ROOM_HOST_MIN_INTERVAL_SECONDS and allowed origins.
-- 3. Confirm simultaneous requests with different recent_messages still produce at most
--    one AI generation per room/language/reason/time bucket.
-- 4. Confirm the Global Relationship Room can use the same guarded AI-host path.
-- 5. Confirm only EN/ES/FR/IT/DE cache entries are accepted.
-- 6. Confirm public/anon/authenticated cannot read/write the cache or execute its helper.
-- 7. Add a periodic retention cleanup later if prompt volume makes it necessary.
