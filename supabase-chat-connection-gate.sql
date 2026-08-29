-- O2OL new-conversation gate
-- Applied live to project hphhmjcutesqsdnubnnw on 2026-08-19.
-- Existing conversations remain usable. A new conversation requires either an
-- accepted buddy connection or a reciprocally linked partner relationship.

create or replace function public.get_or_create_conversation(p_user1_id uuid, p_user2_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_conversation_id uuid;
  v_min_user_id uuid;
  v_max_user_id uuid;
  v_allowed boolean := false;
begin
  if v_actor is null or v_actor not in (p_user1_id, p_user2_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_user1_id = p_user2_id then
    raise exception 'conversation participants must be different' using errcode = '22023';
  end if;

  if p_user1_id < p_user2_id then
    v_min_user_id := p_user1_id; v_max_user_id := p_user2_id;
  else
    v_min_user_id := p_user2_id; v_max_user_id := p_user1_id;
  end if;

  select c.id into v_conversation_id
  from public.conversations c
  where c.user1_id = v_min_user_id and c.user2_id = v_max_user_id;

  if v_conversation_id is not null then return v_conversation_id; end if;

  select exists (
    select 1 from public.buddy_requests br
    where br.status = 'accepted'
      and ((br.from_user_id = p_user1_id and br.to_user_id = p_user2_id)
        or (br.from_user_id = p_user2_id and br.to_user_id = p_user1_id))
  ) into v_allowed;

  if not v_allowed then
    select exists (
      select 1
      from public.users u1
      join public.users u2 on u2.id = p_user2_id
      where u1.id = p_user1_id
        and u1.email is not null and u2.email is not null
        and u1.partner_email is not null and u2.partner_email is not null
        and lower(trim(u1.partner_email)) = lower(trim(u2.email))
        and lower(trim(u2.partner_email)) = lower(trim(u1.email))
    ) into v_allowed;
  end if;

  if not v_allowed then
    raise exception 'A new conversation requires an accepted buddy connection or reciprocal partner link' using errcode = '42501';
  end if;

  insert into public.conversations (user1_id, user2_id)
  values (v_min_user_id, v_max_user_id)
  on conflict (user1_id, user2_id) do update set updated_at = public.conversations.updated_at
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

revoke all on function public.get_or_create_conversation(uuid, uuid) from public;
revoke all on function public.get_or_create_conversation(uuid, uuid) from anon;
grant execute on function public.get_or_create_conversation(uuid, uuid) to authenticated;
