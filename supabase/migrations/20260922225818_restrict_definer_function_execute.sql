/*
# Require a signed-in session to call privileged database routines

1. Changes
   - Revoke EXECUTE from PUBLIC and `anon` on `get_admin_users_overview()`,
     `get_project_members(uuid)`, `restore_project_backup(jsonb)` and
     `search_profiles(text)`, keeping EXECUTE for `authenticated` and `service_role`.
   - Revoke EXECUTE from PUBLIC and `anon` on the trigger helpers
     `protect_last_global_admin()` and `set_updated_at()`, which are only ever run by
     triggers.

2. Security
   - These routines run with owner rights. Their bodies already check `auth.uid()`,
     but there is no reason for an unauthenticated visitor to be able to invoke them
     at all; this removes that surface.
*/

REVOKE EXECUTE ON FUNCTION public.get_admin_users_overview() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_project_members(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.restore_project_backup(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_profiles(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.protect_last_global_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_admin_users_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_project_backup(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;
