-- One2OneLove private chat attachment storage
-- Chat files are private and readable only by authenticated participants
-- in the message that references the stored object.

begin;

insert into storage.buckets (id, name, public)
values ('chat-files', 'chat-files', false)
on conflict (id) do update set public = false;

-- Remove legacy bucket-specific chat policies before installing participant-aware rules.
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (
        lower(policyname) like '%chat%file%'
        or lower(policyname) like '%chat%upload%'
        or lower(policyname) like '%chat%read%'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy "chat participants can read referenced attachments"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-files'
  and exists (
    select 1
    from public.messages m
    where (select auth.uid()) in (m.sender_id, m.receiver_id)
      and (
        m.file_url = storage.objects.name
        or m.file_url like '%/chat-files/' || storage.objects.name
      )
      and coalesce(m.is_deleted, false) = false
  )
);

create policy "users can upload own chat attachments"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'chat-files'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (
      (storage.foldername(name))[1] = 'chat-files'
      and (storage.foldername(name))[2] = (select auth.uid())::text
    )
  )
);

create policy "users can delete own chat attachments"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'chat-files'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (
      (storage.foldername(name))[1] = 'chat-files'
      and (storage.foldername(name))[2] = (select auth.uid())::text
    )
  )
);

commit;
