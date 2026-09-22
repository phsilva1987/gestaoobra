/*
# Prevent cross-project "global" categories

1. Changes
   - Add constraint `categories_global_requires_no_project`: a category may only be
     marked global when it is not attached to a project.
   - Rewrite the SELECT policy so a global category is visible to everyone only when
     it has no project, otherwise project membership decides visibility.
   - Rewrite the INSERT and UPDATE policies so a project member can only write
     non-global categories for their own project; only a system administrator can
     create or change a true global category.

2. Security
   - Closes a path where any member of one project could create a row flagged global
     and have it appear in every other project's category lists.

3. Notes
   1. Verified no existing row is both global and attached to a project, so the
      constraint applies cleanly to current data.
*/

ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_global_requires_no_project;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_global_requires_no_project
  CHECK (is_global = false OR project_id IS NULL);

DROP POLICY IF EXISTS "select_categories" ON public.categories;
CREATE POLICY "select_categories" ON public.categories FOR SELECT
  TO authenticated
  USING (
    ((is_global = true) AND (project_id IS NULL))
    OR ((project_id IS NOT NULL) AND is_project_member(project_id))
  );

DROP POLICY IF EXISTS "insert_categories" ON public.categories;
CREATE POLICY "insert_categories" ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (
    ((project_id IS NOT NULL) AND (is_global = false) AND is_project_member(project_id))
    OR ((project_id IS NULL) AND (is_global = true) AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );

DROP POLICY IF EXISTS "update_categories" ON public.categories;
CREATE POLICY "update_categories" ON public.categories FOR UPDATE
  TO authenticated
  USING (
    ((project_id IS NOT NULL) AND (is_global = false) AND is_project_member(project_id))
    OR ((project_id IS NULL) AND (is_global = true) AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  )
  WITH CHECK (
    ((project_id IS NOT NULL) AND (is_global = false) AND is_project_member(project_id))
    OR ((project_id IS NULL) AND (is_global = true) AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );

DROP POLICY IF EXISTS "delete_categories" ON public.categories;
CREATE POLICY "delete_categories" ON public.categories FOR DELETE
  TO authenticated
  USING (
    ((project_id IS NOT NULL) AND (is_global = false) AND is_project_member(project_id))
    OR ((project_id IS NULL) AND (is_global = true) AND EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ))
  );
