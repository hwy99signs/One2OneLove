-- One2OneLove partner profile-photo storage hardening
-- Profile photos are public profile assets, but uploads require an authenticated
-- account and are constrained to common image types and 5 MB per object.

begin;

update storage.buckets
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']::text[]
where id in ('influencer-photos','professional-photos');

-- Remove legacy bucket-specific write policies before replacing them.
do $$
declare r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname='storage'
      and tablename='objects'
      and (
        lower(policyname) like '%influencer%photo%'
        or lower(policyname) like '%professional%photo%'
      )
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

create policy "authenticated users can upload influencer profile photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id='influencer-photos'
  and owner_id=(select auth.uid())::text
);

create policy "owners can update influencer profile photos"
on storage.objects
for update
to authenticated
using (
  bucket_id='influencer-photos'
  and owner_id=(select auth.uid())::text
)
with check (
  bucket_id='influencer-photos'
  and owner_id=(select auth.uid())::text
);

create policy "owners can delete influencer profile photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id='influencer-photos'
  and owner_id=(select auth.uid())::text
);

create policy "authenticated users can upload professional profile photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id='professional-photos'
  and owner_id=(select auth.uid())::text
);

create policy "owners can update professional profile photos"
on storage.objects
for update
to authenticated
using (
  bucket_id='professional-photos'
  and owner_id=(select auth.uid())::text
)
with check (
  bucket_id='professional-photos'
  and owner_id=(select auth.uid())::text
);

create policy "owners can delete professional profile photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id='professional-photos'
  and owner_id=(select auth.uid())::text
);

commit;
