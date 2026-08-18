-- One2OneLove relaunch: private pairwise-chat attachment storage
-- DEVELOPMENT MIGRATION ONLY. Apply to production only through an approved batch/addendum.
--
-- Object-key contract for NEW attachments:
--   <conversation_uuid>/<sender_uuid>/<random_uuid>.<extension>
--
-- The bucket is private. Authenticated members can read objects only when the first path
-- segment names a conversation they participate in. Upload/update/delete is additionally
-- limited to objects whose second path segment equals auth.uid(). Browser clients receive
-- short-lived signed URLs; persistent public URLs are not part of the relaunch model.
--
-- IMPORTANT: this migration does NOT delete or rewrite generic Storage policies that may
-- support other One2OneLove buckets. Instead it adds RESTRICTIVE chat-files-only boundary
-- policies. PostgreSQL ANDs restrictive policies with any permissive policies, so even a
-- legacy broad storage.objects policy cannot bypass the chat-files participant boundary.
-- Other buckets pass the `bucket_id <> 'chat-files'` branch unchanged.
--
-- Legacy chat objects were uploaded under `chat-files/<sender>/<timestamp>` inside the
-- bucket and their message rows stored a public URL. The read boundary has a narrow
-- compatibility branch that authorizes a legacy object only when an existing message URL
-- ends in that exact object name and the caller is that message sender or receiver.

begin;

insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-files', 'chat-files', false, 10485760)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760;

-- Remove only policies owned by this relaunch migration. Never drop an unknown generic
-- policy by name because it may intentionally serve avatars, professional assets, etc.
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
-- another permissive storage.objects policy. Rows in every other bucket pass unchanged.
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
      exists (
        select 1
        from public.conversations c
        where c.id::text = (storage.foldername(name))[1]
          and auth.uid() in (c.user1_id, c.user2_id)
      )
      or exists (
        select 1
        from public.messages m
        where m.file_url is not null
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
-- Permissive grants for environments that do not already have a generic authenticated
-- Storage policy. Restrictive boundaries above still cap these permissions.
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
      from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and auth.uid() in (c.user1_id, c.user2_id)
    )
    or exists (
      select 1
      from public.messages m
      where m.file_url is not null
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
  'One2OneLove chat-files access is participant-scoped through restrictive + permissive Storage RLS; other buckets are not modified by the chat boundary.';

commit;

-- CONTROLLED TESTS BEFORE ATTACHMENT ACTIVATION
-- 1. Confirm the chat-files bucket reports public=false.
-- 2. Inspect every pre-existing policy on storage.objects. Even if a broad legacy policy
--    remains, verify the RESTRICTIVE chat-files boundaries prevent bypass.
-- 3. Confirm unrelated buckets still behave exactly as before this migration.
-- 4. Participant A can upload only under <their conversation>/<A>/... .
-- 5. Participant B can SELECT/sign that object but cannot update/delete A's object.
-- 6. A third authenticated member cannot SELECT/sign/upload into that conversation path.
-- 7. Anonymous/public URL access fails.
-- 8. A signed URL expires and a fresh signed URL can be generated only by a participant.
-- 9. Existing legacy attachment rows remain readable only to their original sender/receiver.
-- 10. 10 MiB+ uploads fail.
