-- One2OneLove relaunch: Live Room AI Host generation cache / cost guard
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- The browser never reads this table directly. The authenticated Edge Function uses
-- service_role to atomically claim one generation slot per room/language/time bucket so
-- many members entering the same quiet room do not create duplicate OpenAI calls.

begin;

create table if not exists public.live_room_host_prompt_cache (
  id uuid primary key default gen_random_uuid(),
  room_slug text not null check (room_slug in (
    'vent-room',
    'modern-dating-unfiltered',
    'love-talk',
    'marriage-matters',
    'starting-over'
  )),
  language text not null default 'en' check (language in ('en','es','fr','it','de','nl')),
  bucket_start timestamptz not null,
  reason text not null check (reason in ('room_empty', 'room_quiet')),
  status text not null default 'generating' check (status in ('generating', 'ready', 'failed')),
  prompt text check (prompt is null or char_length(prompt) <= 500),
  source text check (source is null or source in ('ai', 'fallback')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_slug, language, bucket_start)
);

create index if not exists live_room_host_prompt_cache_created_idx
  on public.live_room_host_prompt_cache (created_at desc);

alter table public.live_room_host_prompt_cache enable row level security;
revoke all on table public.live_room_host_prompt_cache from anon, authenticated;

create or replace function public.set_live_room_host_prompt_cache_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists live_room_host_prompt_cache_updated_at on public.live_room_host_prompt_cache;
create trigger live_room_host_prompt_cache_updated_at
before update on public.live_room_host_prompt_cache
for each row execute function public.set_live_room_host_prompt_cache_updated_at();

comment on table public.live_room_host_prompt_cache is
  'Server-only AI Host cache/cost guard. One generation claim per room/language/time bucket; browser roles have no direct access.';

commit;

-- PRE-APPLY CHECKLIST
-- 1. Deploy live-room-host with LIVE_ROOM_AI_ENABLED=false first.
-- 2. Configure LIVE_ROOM_HOST_MIN_INTERVAL_SECONDS and allowed origins.
-- 3. Confirm simultaneous same-language requests produce at most one AI generation per room bucket.
-- 4. Confirm different enabled languages do not receive another language cache entry.
-- 5. Add a periodic retention cleanup later if prompt volume makes it necessary.
