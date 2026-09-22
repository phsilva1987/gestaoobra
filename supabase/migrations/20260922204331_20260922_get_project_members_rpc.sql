/*
# get_project_members RPC

Allows project members to see the profiles of other members in the same project.
Profiles SELECT is restricted to own-profile-only, so this RPC provides
the necessary access for team management without exposing the full user directory.

## Security
- Caller must be authenticated
- Caller must be a member of the project
- Returns only id, name, email, global role, and project role
*/

CREATE OR REPLACE FUNCTION public.get_project_members(p_project_id uuid)
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  global_role text,
  project_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Caller must be a member of this project
  IF NOT EXISTS (
    SELECT 1 FROM project_operators
    WHERE project_id = p_project_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a project member';
  END IF;

  RETURN QUERY
    SELECT po.user_id, p.name, p.email, p.role, po.role
    FROM project_operators po
    JOIN profiles p ON p.id = po.user_id
    WHERE po.project_id = p_project_id
    ORDER BY po.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_project_members(uuid) TO authenticated;
