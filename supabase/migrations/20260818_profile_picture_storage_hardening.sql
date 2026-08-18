-- One2OneLove relaunch: profile-picture Storage hardening
-- DEVELOPMENT MIGRATION ONLY. Do not apply to production without explicit approval.
--
-- Product/privacy contract:
-- - Profile pictures are intentionally publicly viewable because they are part of the
--   authenticated member-discovery experience and their public URL may be stored on the
--   member profile.
-- - Publicly viewable MUST NOT mean publicly writable or listable.
-- - Only the authenticated owner may list/upload/replace/delete objects under:
--       <auth.uid()>/profile.<approved extension>
-- - Bucket-level file size and MIME constraints are authoritative even if browser
--   validation is bypassed.
--
-- IMPORTANT: older projects may contain broad permissive storage.objects policies. This
-- migration therefore adds profile-pictures-only RESTRICTIVE boundaries that cap those
-- policies without changing unrelated buckets.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Remove only policies owned by this migration. Do not drop unknown generic Storage
-- policies because they may serve unrelated One2OneLove buckets.
drop policy if exists "O2OL profile-pictures list boundary" on storage.objects;
drop policy if exists "O2OL profile-pictures insert boundary" on storage.objects;
drop policy if exists "O2OL profile-pictures update boundary" on storage.objects;
drop policy if exists "O2OL profile-pictures delete boundary" on storage.objects;
drop policy if exists "O2OL profile owners can list pictures" on storage.objects;
drop policy if exists "O2OL profile owners can upload pictures" on storage.objects;
drop policy if exists "O2OL profile owners can update pictures" on storage.objects;
drop policy if exists "O2OL profile owners can delete pictures" on storage.objects;

-- ---------------------------------------------------------------------------
-- Restrictive owner boundaries. Every unrelated bucket passes through unchanged.
-- ---------------------------------------------------------------------------

create policy "O2OL profile-pictures list boundary"
on storage.objects
as restrictive
for select
to public
using (
  bucket_id <> 'profile-pictures'
  or (
    auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "O2OL profile-pictures insert boundary"
on storage.objects
as restrictive
for insert
to public
with check (
  bucket_id <> 'profile-pictures'
  or (
    auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "O2OL profile-pictures update boundary"
on storage.objects
as restrictive
for update
to public
using (
  bucket_id <> 'profile-pictures'
  or (
    auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
)
with check (
  bucket_id <> 'profile-pictures'
  or (
    auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "O2OL profile-pictures delete boundary"
on storage.objects
as restrictive
for delete
to public
using (
  bucket_id <> 'profile-pictures'
  or (
    auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- ---------------------------------------------------------------------------
-- Explicit owner grants for projects without an existing generic authenticated Storage
-- policy. The restrictive boundaries above still cap these grants.
--
-- SELECT here governs Storage metadata/list operations. Public object delivery remains
-- intentional because the bucket is public; callers do not need to enumerate another
-- member's bucket contents in order to render the avatar URL stored on that profile.
-- ---------------------------------------------------------------------------

create policy "O2OL profile owners can list pictures"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "O2OL profile owners can upload pictures"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "O2OL profile owners can update pictures"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "O2OL profile owners can delete pictures"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;

-- CONTROLLED TESTS BEFORE PROFILE-PHOTO EDITING IS ACTIVATED
-- 1. Confirm profile-pictures reports public=true, max 5 MiB, and only JPEG/PNG/WebP/GIF.
-- 2. Inspect existing storage.objects policies and verify the RESTRICTIVE boundaries cap
--    any broad legacy write/list policy for profile-pictures without changing other buckets.
-- 3. Member A can upload/list/replace/delete only A/profile.<approved extension>.
-- 4. Member A cannot upload, update, list or delete B's folder by direct Storage API call.
-- 5. Anonymous and other authenticated members cannot enumerate the bucket metadata.
-- 6. A profile image URL already published on a member profile remains publicly viewable.
-- 7. >5 MiB, SVG and unsupported/non-image MIME types fail even if client checks are bypassed.
-- 8. Confirm unrelated Storage buckets behave exactly as they did before this migration.
