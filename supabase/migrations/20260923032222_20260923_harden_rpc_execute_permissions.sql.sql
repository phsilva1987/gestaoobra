/*
# Harden RPC EXECUTE permissions

1. Audit summary
   - admin_set_user_password: only called from the manage-user edge function
     with the service_role key. The frontend never invokes it directly.
     REVOKE from authenticated to remove the REST/RPC surface entirely.
   - All other SECURITY DEFINER functions (create_project, restore_project_backup,
     get_admin_users_overview, get_project_members, search_profiles,
     is_project_admin, is_project_member) are called from the frontend and
     already have internal auth/role checks. Keep EXECUTE for authenticated.
   - Trigger-only functions (handle_new_user, protect_last_admin,
     protect_last_global_admin, protect_membership_keys, protect_profile_role,
     set_updated_at, validate_cross_project_ref) already have EXECUTE revoked
     from anon/authenticated in prior migrations.

2. Changes
   - Revoke EXECUTE on admin_set_user_password from authenticated.
   - Keep EXECUTE on admin_set_user_password for service_role only.
   - Ensure PUBLIC and anon never have EXECUTE on any SECURITY DEFINER function
     (idempotent belt-and-suspenders REVOKE).
*/

-- admin_set_user_password: server-side only (edge function via service_role)
REVOKE EXECUTE ON FUNCTION public.admin_set_user_password(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_password(uuid, text) TO service_role;

-- Belt-and-suspenders: ensure no SECURITY DEFINER function is executable by PUBLIC or anon
REVOKE EXECUTE ON FUNCTION public.create_project(text, text, numeric, date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.restore_project_backup(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_users_overview() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_project_members(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_profiles(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_project_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.protect_last_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_last_global_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_membership_keys() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_cross_project_ref() FROM PUBLIC, anon, authenticated;

-- Keep authenticated EXECUTE on functions the frontend calls directly
GRANT EXECUTE ON FUNCTION public.create_project(text, text, numeric, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_project_backup(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;
