/*
# Create project-images storage bucket with RLS policies

## Decision: PUBLIC bucket
Cover images are displayed in sidebar, projects page, and settings — they need
to be accessible via direct URL without signed URL complexity. A public bucket
with restricted WRITE policies (only project admins can upload/delete) is the
right tradeoff. Reads are public, writes are admin-only.

## Structure
project-images/{project_id}/cover.webp

## Policies
- SELECT (read): public — anyone can view project cover images
- INSERT (upload): only project admins
- UPDATE (replace): only project admins
- DELETE (remove): only project admins

## Security
- Uses is_project_admin() helper for write operations
- Path must match project_id/{filename} pattern
- No service_role in frontend
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage.objects in project-images bucket

-- SELECT: public read
DROP POLICY IF EXISTS "read_project_images" ON storage.objects;
CREATE POLICY "read_project_images" ON storage.objects
  FOR SELECT TO authenticated, anon
  USING (bucket_id = 'project-images');

-- INSERT: project admin only, path must start with project_id
DROP POLICY IF EXISTS "upload_project_images" ON storage.objects;
CREATE POLICY "upload_project_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-images'
    AND is_project_admin((storage.foldername(name))[1]::uuid)
  );

-- UPDATE: project admin only
DROP POLICY IF EXISTS "update_project_images" ON storage.objects;
CREATE POLICY "update_project_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-images'
    AND is_project_admin((storage.foldername(name))[1]::uuid)
  )
  WITH CHECK (
    bucket_id = 'project-images'
    AND is_project_admin((storage.foldername(name))[1]::uuid)
  );

-- DELETE: project admin only
DROP POLICY IF EXISTS "delete_project_images" ON storage.objects;
CREATE POLICY "delete_project_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-images'
    AND is_project_admin((storage.foldername(name))[1]::uuid)
  );
