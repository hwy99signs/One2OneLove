-- One2OneLove relaunch: private pairwise Chat attachments
-- DEVELOPMENT MIGRATION ONLY. Requires a later production approval batch.
--
-- Object key contract used by src/lib/chatService.js:
--   <conversation_uuid>/<uploader_user_uuid>/<random_object_id>.<extension>
--
-- Security goals:
--   * chat-files bucket is PRIVATE even if a legacy bucket already exists;
--   * only an authenticated participant may upload to a conversation;
--   * uploader path identity is derived from auth.uid();
--   * participants can read/sign only an attachment that is referenced by a currently
--     visible (not soft-deleted) message in that same conversation;
--   * only the original uploader may remove the object directly;
--   * no browser UPDATE/upsert policy is granted.

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
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Keep storage ownership with Supabase/storage service; policies are the browser boundary.

drop policy if exists "Public chat attachments" on storage.objects;
drop policy if exists "Authenticated users can upload chat files" on storage.objects;
drop policy if exists "Authenticated users can view chat files" on storage.objects;
drop policy if exists "Users can delete own chat files" on storage.objects;
drop policy if exists "Chat participants upload private attachments" on storage.objects;
drop policy if exists "Chat participants read private attachments" on storage.objects;
drop policy if exists "Chat uploaders delete private attachments" on storage.objects;

-- INSERT: caller must be a participant in the conversation encoded in folder #1 and
-- folder #2 must be exactly the authenticated uploader UUID.
create policy "Chat participants upload private attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.conversations c
    where c.id = case
      when coalesce((storage.foldername(name))[1], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (storage.foldername(name))[1]::uuid
      else null
    end
    and auth.uid() in (c.user1_id, c.user2_id)
  )
);

-- SELECT is what Supabase Storage checks before issuing a signed URL. Requiring a live
-- message reference means a soft-deleted message cannot be used to mint fresh signed
-- links even though the underlying object can remain temporarily for cleanup/audit.
create policy "Chat participants read private attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-files'
  and exists (
    select 1
    from public.conversations c
    join public.messages m
      on m.conversation_id = c.id
     and m.file_url = storage.objects.name
     and coalesce(m.is_deleted, false) = false
    where c.id = case
      when coalesce((storage.foldername(storage.objects.name))[1], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (storage.foldername(storage.objects.name))[1]::uuid
      else null
    end
      and auth.uid() in (c.user1_id, c.user2_id)
  )
);

-- DELETE supports client cleanup when an upload succeeds but message insertion fails.
-- It also permits a sender-owned cleanup path later. A participant cannot delete the
-- other member's uploaded object directly.
create policy "Chat uploaders delete private attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-files'
  and (storage.foldername(name))[2] = auth.uid()::text
  and exists (
    select 1
    from public.conversations c
    where c.id = case
      when coalesce((storage.foldername(name))[1], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then (storage.foldername(name))[1]::uuid
      else null
    end
      and auth.uid() in (c.user1_id, c.user2_id)
  )
);

comment on policy "Chat participants upload private attachments" on storage.objects is
  'Private chat upload: path conversation must contain auth.uid and uploader folder must equal auth.uid.';
comment on policy "Chat participants read private attachments" on storage.objects is
  'Private chat read/sign: caller must participate and object must be referenced by a non-deleted message in that conversation.';
comment on policy "Chat uploaders delete private attachments" on storage.objects is
  'Only the authenticated uploader may directly remove a private chat object.';

commit;

-- CONTROLLED TESTS
-- 1. Bucket reports public=false, 10 MB limit, and only approved MIME types.
-- 2. User A can upload only under <conversation-with-A>/<A>/... .
-- 3. User A cannot upload under another user's folder or a third-party conversation.
-- 4. Before a message references a newly uploaded path, neither participant can mint a
--    signed URL for it; after message insertion both conversation participants can.
-- 5. An unrelated authenticated member cannot list/read/sign the object.
-- 6. Soft-delete the message and confirm no new signed URL can be minted.
-- 7. User A can delete A's object; User B cannot directly delete A's object.
-- 8. Unsupported MIME type and >10 MB upload fail at Storage even if client validation is bypassed.
