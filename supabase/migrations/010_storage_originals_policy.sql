-- Fix storage policies to allow uploads/deletes under originals/{user_id}/
-- Previously, foldername[1] was 'originals' which never matched auth.uid().

-- Drop old policies
drop policy "Authenticated users can upload images" on storage.objects;
drop policy "Users can delete own images" on storage.objects;

-- Recreate INSERT policy supporting both direct and originals paths
create policy "Authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'moment-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (
        (storage.foldername(name))[1] = 'originals'
        and (storage.foldername(name))[2] = (select auth.uid())::text
      )
    )
  );

-- Recreate DELETE policy supporting both direct and originals paths
create policy "Users can delete own images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'moment-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (
        (storage.foldername(name))[1] = 'originals'
        and (storage.foldername(name))[2] = (select auth.uid())::text
      )
    )
  );
