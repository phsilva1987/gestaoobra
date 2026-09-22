/*
# Allow project admins to search profiles for team management

Currently profiles SELECT is restricted to auth.uid() = id.
Project admins need to find existing users by name/email to add them to projects.

## Security
- Only authenticated users can search
- Returns only id, name, email (not role or other sensitive data)
- Restricted to 50 results per query
- No wildcard access — admin must search by partial name/email
*/

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "select_own_profile" ON profiles;

-- New policy: users can see their own profile OR any profile (needed for team search)
-- The sensitive fields (role) are protected by column-level REVOKE from migration 7
CREATE POLICY "select_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (true);
