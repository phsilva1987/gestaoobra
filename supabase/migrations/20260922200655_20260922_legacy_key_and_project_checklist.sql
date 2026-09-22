/*
# Add legacy_key to projects + project_checklist table

## Changes
1. Add `legacy_key` text column to `projects` (nullable)
2. Create unique partial index on legacy_key (non-null values only)
3. Create `project_checklist` table for project-level checklist items

## project_checklist
- id: uuid PK
- project_id: FK to projects, ON DELETE CASCADE
- nome: text (checklist item label)
- feito: boolean (completed flag)
- source_obra_id: uuid nullable (optional link to a stage)
- sort_order: integer for ordering
- created_at / updated_at: timestamps

## Security
- RLS enabled on project_checklist
- Same membership-based policies as other project tables
*/

-- 1. Add legacy_key to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS legacy_key text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_legacy_key
  ON projects (legacy_key)
  WHERE legacy_key IS NOT NULL;

-- 2. Create project_checklist table
CREATE TABLE IF NOT EXISTS project_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nome text NOT NULL,
  feito boolean NOT NULL DEFAULT false,
  source_obra_id uuid,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_checklist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_project_checklist" ON project_checklist;
CREATE POLICY "select_project_checklist" ON project_checklist FOR SELECT
  TO authenticated USING (is_project_member(project_id));

DROP POLICY IF EXISTS "insert_project_checklist" ON project_checklist;
CREATE POLICY "insert_project_checklist" ON project_checklist FOR INSERT
  TO authenticated WITH CHECK (is_project_member(project_id));

DROP POLICY IF EXISTS "update_project_checklist" ON project_checklist;
CREATE POLICY "update_project_checklist" ON project_checklist FOR UPDATE
  TO authenticated USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

DROP POLICY IF EXISTS "delete_project_checklist" ON project_checklist;
CREATE POLICY "delete_project_checklist" ON project_checklist FOR DELETE
  TO authenticated USING (is_project_member(project_id));

CREATE INDEX IF NOT EXISTS idx_project_checklist_project ON project_checklist(project_id);

-- Add updated_at trigger
CREATE TRIGGER trg_set_updated_at_project_checklist
  BEFORE UPDATE ON project_checklist
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
