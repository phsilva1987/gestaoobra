/*
# get_admin_users_overview RPC

Returns an aggregated view of all users and their project memberships,
scoped to projects where the caller is a project admin.

## Security
- SECURITY DEFINER with search_path = public
- Caller must be authenticated AND profiles.role = 'admin'
- Returns only: user_id, name, email, global_role, project_id, project_name, project_role
- Only shows memberships for projects where caller is project_admin
- Users with no memberships in caller's projects are still shown (with NULL project fields)
  so the admin can see all system users and add them to projects

## Returns
One row per (user, project) membership. Users with no memberships get one row with NULL project fields.
*/

CREATE OR REPLACE FUNCTION public.get_admin_users_overview()
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  global_role text,
  project_id uuid,
  project_name text,
  project_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_profile profiles;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_caller;
  IF NOT FOUND OR v_profile.role <> 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem acessar esta visao' USING ERRCODE = '42501';
  END IF;

  -- Return all profiles, LEFT JOINed to project_operators filtered to caller's admin projects
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.name AS name,
    p.email AS email,
    p.role AS global_role,
    po.project_id AS project_id,
    proj.name AS project_name,
    po.role AS project_role
  FROM profiles p
  LEFT JOIN project_operators po ON po.user_id = p.id
  LEFT JOIN projects proj ON proj.id = po.project_id
  WHERE
    -- Include all users, but only show memberships for projects where caller is admin
    (po.project_id IS NULL OR EXISTS (
      SELECT 1 FROM project_operators po2
      WHERE po2.project_id = po.project_id
        AND po2.user_id = v_caller
        AND po2.role = 'admin'
    ))
  ORDER BY p.name, proj.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users_overview() TO authenticated;
