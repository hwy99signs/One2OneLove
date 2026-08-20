-- Production correction approved as Approval #1A on 2026-08-20.
-- Keeps the Love Notes history projection under caller RLS and limits browser
-- SELECT privileges to the exact non-sensitive columns needed by that view.

begin;

alter view public.love_note_invitation_history
  set (security_invoker = true);

revoke all on table public.love_note_invitations from anon, authenticated;

grant select (
  id,
  sender_user_id,
  recipient_user_id,
  sender_name,
  recipient_name,
  delivery_method,
  note_content,
  scheduled_for,
  schedule_timezone,
  status,
  sent_at,
  delivered_at,
  revealed_at,
  created_at,
  updated_at
) on table public.love_note_invitations to authenticated;

revoke all on public.love_note_invitation_history from public, anon;
grant select on public.love_note_invitation_history to authenticated;

comment on view public.love_note_invitation_history is
  'Participant-only Love Note history projection. SECURITY INVOKER enforces caller RLS; excludes recipient contact, request IDs, token hashes, provider IDs and failure internals.';

commit;
