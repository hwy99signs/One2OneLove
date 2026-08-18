-- One2OneLove relaunch: premium AI relationship tools
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch.
--
-- Browser clients never write/read these raw tables. Authenticated callers interact with
-- premium AI only through reviewed Edge Functions that enforce confirmed auth,
-- membership status, rate limits, input/output limits, and server-owned OpenAI secrets.

begin;

create table if not exists public.ai_coach_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Coaching Session' check (char_length(title) between 1 and 120),
  language text not null default 'en' check (language in ('en','es','fr','it','de','nl')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_coach_conversations_user_idx
  on public.ai_coach_conversations(user_id, updated_at desc);

create table if not exists public.ai_coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_coach_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists ai_coach_messages_conversation_idx
  on public.ai_coach_messages(conversation_id, created_at asc);
create index if not exists ai_coach_messages_user_idx
  on public.ai_coach_messages(user_id, created_at desc);

create table if not exists public.premium_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('relationship_coach','ai_content_creator')),
  request_id uuid not null,
  status text not null default 'started' check (status in ('started','succeeded','failed','blocked')),
  model text,
  input_chars integer not null default 0 check (input_chars >= 0),
  output_chars integer not null default 0 check (output_chars >= 0),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, feature, request_id)
);

create index if not exists premium_ai_usage_rate_idx
  on public.premium_ai_usage(user_id, feature, created_at desc);

alter table public.ai_coach_conversations enable row level security;
alter table public.ai_coach_messages enable row level security;
alter table public.premium_ai_usage enable row level security;

-- Raw AI history/usage is server-owned. Edge Functions use service_role after validating
-- the authenticated caller. The browser receives only deliberately shaped JSON responses.
revoke all on table public.ai_coach_conversations from anon, authenticated;
revoke all on table public.ai_coach_messages from anon, authenticated;
revoke all on table public.premium_ai_usage from anon, authenticated;

create or replace function public.set_ai_coach_conversation_updated_at()
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

revoke all on function public.set_ai_coach_conversation_updated_at() from public;

drop trigger if exists ai_coach_conversations_updated_at on public.ai_coach_conversations;
create trigger ai_coach_conversations_updated_at
before update on public.ai_coach_conversations
for each row execute function public.set_ai_coach_conversation_updated_at();

-- Update conversation activity whenever a message is inserted. This runs through trusted
-- server inserts and does not grant browser table access.
create or replace function public.touch_ai_coach_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ai_coach_conversations
  set updated_at = now()
  where id = new.conversation_id and user_id = new.user_id;
  return new;
end;
$$;

revoke all on function public.touch_ai_coach_conversation() from public;

drop trigger if exists touch_ai_coach_conversation on public.ai_coach_messages;
create trigger touch_ai_coach_conversation
after insert on public.ai_coach_messages
for each row execute function public.touch_ai_coach_conversation();

comment on table public.ai_coach_conversations is
  'Private server-managed One2OneLove premium AI Relationship Coach conversation headers.';
comment on table public.ai_coach_messages is
  'Private server-managed One2OneLove premium AI Relationship Coach message history.';
comment on table public.premium_ai_usage is
  'Server-only premium AI request ledger used for idempotency, rate/cost controls and operational review.';

commit;

-- CONTROLLED TESTS
-- 1. anon/authenticated browser roles cannot SELECT/INSERT/UPDATE/DELETE raw AI tables.
-- 2. service_role can create/list/delete a caller-owned coach conversation and messages.
-- 3. deleting an Auth user cascades their AI history/usage.
-- 4. request_id uniqueness prevents a duplicate logical AI request from being charged/run twice.
-- 5. conversation updated_at advances when a message is added.
