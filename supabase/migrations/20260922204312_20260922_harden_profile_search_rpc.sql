/*
# Harden profiles SELECT: replace USING(true) with restricted RPC

The previous migration (allow_profile_search) opened profiles SELECT to all
authenticated users. This was needed for team search but exposed the full
user directory to any operator.

## Fix
1. Revert profiles SELECT to own-profile-only
2. Create search_profiles() SECURITY DEFINER RPC that:
   - Requires auth.uid()
   - Requires caller to be admin of at least one project
   - Returns only id, name, email (not role)
   - Limits to 20 results
3. Revoke UPDATE on profiles.role from authenticated (belt + suspenders)
*/

-- Revert to own-profile-only SELECT
DROP POLICY IF EXISTS "select_profiles" ON profiles;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Ensure role column UPDATE is protected
REVOKE UPDATE (role) ON profiles FROM authenticated;

-- SECURITY DEFINER function for admin-only profile search
CREATE OR REPLACE FUNCTION public.search_profiles(p_query text)
RETURNS TABLE (id uuid, name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Must be admin of at least one project
  IF NOT EXISTS (
    SELECT 1 FROM project_operators po
    WHERE po.user_id = auth.uid() AND po.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized: admin role required';
  END IF;

  -- Search by name or email, return only safe fields
  RETURN QUERY
    SELECT p.id, p.name, p.email
    FROM profiles p
    WHERE p.name ILIKE '%' || p_query || '%'
       OR p.email ILIKE '%' || p_query || '%'
    ORDER BY p.name
    LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;
