-- One2OneLove mutual-partner Love Notes delivery
-- Converts Love Notes from sender-only records into real recipient-visible notes
-- without exposing arbitrary account lookup or browser-controlled recipients.

begin;

alter table public.love_notes
  add column if not exists recipient_user_id uuid references public.users(id) on delete set null;

create index if not exists love_notes_recipient_user_sent_idx
  on public.love_notes (recipient_user_id, sent_at desc)
  where recipient_user_id is not null and is_sent = true;

alter table public.love_notes enable row level security;

drop policy if exists "recipients can read delivered love notes" on public.love_notes;
create policy "recipients can read delivered love notes"
on public.love_notes
for select
to authenticated
using (
  recipient_user_id = (select auth.uid())
  and coalesce(is_sent, false) = true
);

-- Browser clients no longer create or update Love Notes directly. Delivery and
-- recipient read state are handled through constrained security-definer RPCs.
revoke insert, update on table public.love_notes from authenticated;
grant select, delete on table public.love_notes to authenticated;

create or replace function public.send_love_note_to_mutual_partner(
  p_content text,
  p_background_color text default '#FFF7ED',
  p_text_color text default '#1F2937',
  p_font_family text default 'Georgia',
  p_font_size integer default 18,
  p_alignment text default 'center'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_email text;
  v_partner_id uuid;
  v_partner_email text;
  v_content text := btrim(coalesce(p_content, ''));
  v_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if char_length(v_content) < 1 or char_length(v_content) > 5000 then
    raise exception 'Love note content must be between 1 and 5000 characters';
  end if;

  select u.email, partner.id, partner.email
  into v_actor_email, v_partner_id, v_partner_email
  from public.users u
  join public.users partner
    on u.partner_email is not null
   and lower(partner.email) = lower(u.partner_email)
   and partner.partner_email is not null
   and lower(partner.partner_email) = lower(u.email)
  where u.id = v_actor_id
  limit 1;

  if v_partner_id is null then
    raise exception 'Mutual partner link required';
  end if;

  insert into public.love_notes (
    user_id,
    recipient_user_id,
    recipient_email,
    content,
    background_color,
    text_color,
    font_family,
    font_size,
    alignment,
    is_sent,
    sent_at,
    is_read,
    is_favorite,
    is_archived,
    note_type
  ) values (
    v_actor_id,
    v_partner_id,
    v_partner_email,
    v_content,
    case when coalesce(p_background_color, '') ~ '^#[0-9A-Fa-f]{6}$' then p_background_color else '#FFF7ED' end,
    case when coalesce(p_text_color, '') ~ '^#[0-9A-Fa-f]{6}$' then p_text_color else '#1F2937' end,
    left(coalesce(nullif(btrim(p_font_family), ''), 'Georgia'), 80),
    greatest(12, least(coalesce(p_font_size, 18), 32)),
    case when p_alignment in ('left', 'center', 'right') then p_alignment else 'center' end,
    true,
    now(),
    false,
    false,
    false,
    'text'
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.send_love_note_to_mutual_partner(text,text,text,text,integer,text) from public, anon;
grant execute on function public.send_love_note_to_mutual_partner(text,text,text,text,integer,text) to authenticated;

create or replace function public.mark_received_love_note_read(p_note_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_count integer;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  update public.love_notes
  set is_read = true,
      updated_at = now()
  where id = p_note_id
    and recipient_user_id = v_actor_id
    and coalesce(is_sent, false) = true;

  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

revoke execute on function public.mark_received_love_note_read(uuid) from public, anon;
grant execute on function public.mark_received_love_note_read(uuid) to authenticated;

comment on function public.send_love_note_to_mutual_partner(text,text,text,text,integer,text) is
  'Sends a Love Note only to the authenticated caller''s reciprocally linked partner. Recipient identity is resolved server-side.';
comment on function public.mark_received_love_note_read(uuid) is
  'Marks a delivered Love Note read only when the authenticated caller is its recipient.';

commit;
