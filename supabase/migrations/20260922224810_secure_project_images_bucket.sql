/*
  # Restrict the project-images bucket to project members

  1. Bucket
     - `project-images` becomes private, so the public object route no longer
       serves files without a session.
     - Server-side MIME and size limits are added (previously only enforced in
       the browser).

  2. Security
     - `read_project_images` is replaced: SELECT is now limited to
       `authenticated` callers who are members of the project the first path
       segment names, instead of `anon, authenticated` with an always-true
       bucket check.
     - Clients must use signed URLs (createSignedUrl) to display covers.
*/

UPDATE storage.buckets
SET public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'project-images';

DROP POLICY IF EXISTS "read_project_images" ON storage.objects;

CREATE POLICY "read_project_images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-images'
    AND is_project_member(((storage.foldername(name))[1])::uuid)
  );
