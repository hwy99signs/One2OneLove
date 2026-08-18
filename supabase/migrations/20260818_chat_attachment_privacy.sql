-- One2OneLove relaunch: private pairwise-chat attachment storage
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through Approval Batch 002.
--
-- Object-key contract for NEW attachments:
--   <conversation_uuid>/<sender_uuid>/<random_uuid>.<extension>
--
-- The bucket is private. New objects become readable/signable only after a visible
-- message in that conversation references the exact object key. Upload/delete remains
-- limited to objects whose second path segment equals auth.uid(). Browser clients receive
-- short-lived signed URLs; persistent public URLs are not part of the relaunch model.
--
-- IMPORTANT: this migration does NOT delete or rewrite generic Storage policies that may
-- support other One2OneLove buckets. Instead it adds RESTRICTIVE chat-files-only boundary
-- policies. PostgreSQL ANDs restrictive policies with permissive policies, so a legacy
-- broad storage.objects policy cannot bypass the chat-files participant/message boundary.
-- Other buckets pass the restrictive policies through unchanged.
--
-- Legacy chat objects were uploaded under older key shapes and message rows stored a
-- public URL. The read boundary keeps a narrow compatibility branch: the caller must be
-- the original message sender/receiver and that visible message URL must end in the exact
-- object name. The bucket itself is still made private, so permanent public access stops.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-files',
  'chat-files',
  false,
  10485760,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Remove only policies owned by this relaunch migration. Never drop an unknown generic
-- policy because it may intentionally serve avatars, professional assets, etc.
drop policy if exists "O2OL chat-files read boundary" on storage.objects;
drop policy if exists "O2OL chat-files insert boundary" on storage.objects;
drop policy if exists "O2OL chat-files update boundary" on storage.objects;
drop policy if exists "O2OL chat-files delete boundary" on storage.objects;
drop policy if exists "O2OL chat participants can read attachments" on storage.objects;
drop policy if exists "O2OL chat senders can upload attachments" on storage.objects;
drop policy if exists "O2OL chat senders can update attachments" on storage.objects;
drop policy if exists "O2OL chat senders can delete attachments" on storage.objects;

-- ---------------------------------------------------------------------------
-- Restrictive boundaries: apply to PUBLIC so anon/authenticated cannot bypass them through
-- another permissive storage.objects policy. Every other bucket passes unchanged.
-- ---------------------------------------------------------------------------

create policy "O2OL chat-files read boundary"
on storage.objects
as restrictive
for select
to public
using (
  bucket_id <> 'chat-files'
  or (
    auth.uid() is not null
    and (
      -- New private object-key model. The exact object must be referenced by a visible
      -- message, and the reader must be one of that conversation's participants.
      exists (
        select 1
        from public.messages m
        join public.conversations c on c.id = m.conversation_id
        where m.file_url = storage.objects.name
          and coalesce(m.is_deleted, false) = false
          and c.id::text = (storage.foldername(storage.objects.name))[1]
          and auth.uid() in (c.user1_id, c.user2_id)
      )
      or
      -- Legacy public-URL rows: keep participant history available after the bucket is
      -- made private, but only for the sender/receiver of the visible original message.
      exists (
        select 1
        from public.messages m
        where m.file_url is not null
          and coalesce(m.is_deleted, false) = false
          and m.file_url like ('%/object/public/chat-files/' || storage.objects.name)
          and auth.uid() in (m.sender_id, m.receiver_id)
      )
    )
  )
);

create policy "O2OL chat-files insert boundary"
on storage.objects
as restrictive
for insert
to public
with check (
  bucket_id <> 'chat-files'
  or (
    auth.uid() is not null
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1
      from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user1_id, c.user2_id)
    )
  )
);

create policy "O2OL chat-files update boundary"
on storage.objects
as restrictive
for update
to public
using (
  bucket_id <> 'chat-files'
  or (
    auth.uid() is not null
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1
      from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user1_id, c.user2_id)
    )
  )
)
with check (
  bucket_id <> 'chat-files'
  or (
    auth.uid() is not null
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1
      from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user1_id, c.user2_id)
    )
  )
);

create policy "O2OL chat-files delete boundary"
on storage.objects
as restrictive
for delete
to public
using (
  bucket_id <> 'chat-files'
  or (
    auth.uid() is not null
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1
      from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user1_id, c.user2_id)
    )
  )
);

-- ---------------------------------------------------------------------------
-- Permissive grants for environments without a generic authenticated Storage policy.
-- Restrictive boundaries above still cap these permissions.
-- ---------------------------------------------------------------------------

create policy "O2OL chat participants can read attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-files'
  and (
    exists (
      select 1
      from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where m.file_url = storage.objects.name
        and coalesce(m.is_deleted, false) = false
        and c.id::text = (storage.foldername(storage.objects.name))[1]
        and auth.uid() in (c.user1_id, c.user2_id)
    )
    or exists (
      select 1
      from public.messages m
      where m.file_url is not null
        and coalesce(m.is_deleted, false) = false
        and m.file_url like ('%/object/public/chat-files/' || storage.objects.name)
        and auth.uid() in (m.sender_id, m.receiver_id)
    )
  )
);

create policy "O2OL chat senders can upload attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.user1_id, c.user2_id)
  )
);

-- The relaunch client never upserts attachment objects. Keep an explicit sender-only
-- UPDATE policy only for compatibility with Storage internals/legacy tooling; the sender
-- and conversation path cannot be changed by the policy boundary.
create policy "O2OL chat senders can update attachments"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.user1_id, c.user2_id)
  )
)
with check (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.user1_id, c.user2_id)
  )
);

create policy "O2OL chat senders can delete attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.conversations c
    where c.id::text = (storage.foldername(name))[1]
      and auth.uid() in (c.user1_id, c.user2_id)
  )
);

comment on table storage.objects is
  'One2OneLove chat-files access is participant/message-scoped through restrictive + permissive Storage RLS; unrelated buckets are not modified by the chat boundary.';

commit;

-- CONTROLLED TESTS BEFORE ATTACHMENT ACTIVATION
-- 1. Confirm chat-files reports public=false, 10 MiB, and only approved MIME types.
-- 2. Inspect every pre-existing policy on storage.objects. Even if a broad legacy policy
--    remains, verify the RESTRICTIVE chat-files boundaries prevent bypass.
-- 3. Confirm unrelated buckets still behave exactly as before this migration.
-- 4. Participant A can upload only under <their conversation>/<A>/... .
-- 5. Before a message references the new object, neither A nor B can mint a signed URL;
--    after message insertion both participants can sign/read it.
-- 6. Participant B cannot update/delete A's object; participant C cannot read/sign it.
-- 7. Anonymous/public URL access fails.
-- 8. A signed URL expires and a fresh signed URL can be generated only while the message
--    remains visible to the participant.
-- 9. Soft-delete the message and confirm no fresh signed URL can be minted.
-- 10. Existing legacy attachment rows remain readable only to original sender/receiver.
-- 11. >10 MiB and unsupported MIME uploads fail even if client validation is bypassed.
