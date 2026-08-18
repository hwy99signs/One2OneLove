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
-- Legacy objects were uploaded under `chat-files/<sender>/<timestamp>` inside the same
-- bucket and their message rows stored a public URL. The read policy below has a narrow
-- compatibility branch that authorizes a legacy object only when an existing message URL
-- ends in that exact object name and the caller is that message sender or receiver.

begin;

insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-files', 'chat-files', false, 10485760)
on conflict (id) do update
set public = false,
    file_size_limit = 10485760;

-- Remove known legacy/permissive policies by name when present. Policy names from older
-- manual setups may vary, so the controlled production test must also inspect the final
-- policy set before attachment activation.
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Anyone can view chat files" on storage.objects;
drop policy if exists "Authenticated users can upload chat files" on storage.objects;
drop policy if exists "Users can upload chat files" on storage.objects;
drop policy if exists "Users can view chat files" on storage.objects;
drop policy if exists "Users can update chat files" on storage.objects;
drop policy if exists "Users can delete chat files" on storage.objects;
drop policy if exists "O2OL chat participants can read attachments" on storage.objects;
drop policy if exists "O2OL chat senders can upload attachments" on storage.objects;
drop policy if exists "O2OL chat senders can update attachments" on storage.objects;
drop policy if exists "O2OL chat senders can delete attachments" on storage.objects;

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
  'One2OneLove chat-files access is participant-scoped through storage RLS; new chat objects use conversation/sender/random object keys and legacy public-url objects have participant-only read compatibility.';

commit;

-- CONTROLLED TESTS BEFORE ATTACHMENT ACTIVATION
-- 1. Confirm the chat-files bucket reports public=false.
-- 2. Inspect every policy on storage.objects for bucket_id='chat-files'; remove any
--    unrecognized legacy permissive policy before enabling attachments.
-- 3. Participant A can upload only under <their conversation>/<A>/... .
-- 4. Participant B can SELECT/sign that object but cannot update/delete A's object.
-- 5. A third authenticated member cannot SELECT/sign/upload into that conversation path.
-- 6. Anonymous/public URL access fails.
-- 7. A signed URL expires and a fresh signed URL can be generated only by a participant.
-- 8. Existing legacy attachment rows remain readable only to their original sender/receiver.
-- 9. 10 MiB+ uploads fail.
