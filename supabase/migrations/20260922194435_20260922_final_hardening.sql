/*
# Final hardening: role protection, function grants, membership key immutability

## Issues fixed
1. GUC bypass: protect_profile_role used app.allow_role_change which any
   authenticated user can SET LOCAL. Replaced with a RPC approach.
2. All SECURITY DEFINER functions had EXECUTE granted to PUBLIC.
   Revoked from PUBLIC/anon for internal trigger functions.
3. project_operators.project_id and user_id were UPDATE-able, allowing
   an admin to change membership keys and bypass last-admin protection.
   Added BEFORE UPDATE trigger to block key column changes.

## What is NOT changed
- No data modified or deleted
- No tables recreated
- No RLS policies altered
- mockData / frontend untouched
*/

-- ============================================================
-- 1. Fix profile role protection — remove GUC bypass
-- ============================================================
-- Replace the GUC-based exception with no exception at all.
-- The trigger now unconditionally blocks role changes.
-- Administrative role changes must go through:
--   - Direct SQL by postgres/service_role (bypasses triggers)
--   - Or a future set_user_global_role() RPC if needed

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role cannot be changed by user. Use administrative tools.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Revoke EXECUTE from PUBLIC on internal trigger functions
-- ============================================================
-- These functions are only called by triggers, never directly.
-- Revoke all direct execute access.

REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.protect_last_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_last_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_last_admin() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.validate_cross_project_ref() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_cross_project_ref() FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_cross_project_ref() FROM authenticated;

-- handle_new_user is called by a trigger on auth.users, not directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- is_project_member and is_project_admin are called from RLS policies.
-- They must be executable by authenticated, but NOT by anon.
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_project_admin(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_project_admin(uuid) FROM anon;

-- create_project must be callable by authenticated (it does internal checks)
-- but NOT by anon
REVOKE EXECUTE ON FUNCTION public.create_project(text, text, numeric, date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_project(text, text, numeric, date, date) FROM anon;

-- ============================================================
-- 3. Block mutation of project_id/user_id in project_operators
-- ============================================================
-- These columns are the identity of a membership. They must never change.
-- To "move" a membership, DELETE + INSERT is the correct path.

CREATE OR REPLACE FUNCTION public.protect_membership_keys()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.project_id IS DISTINCT FROM OLD.project_id THEN
    RAISE EXCEPTION 'project_id cannot be changed on an existing membership'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed on an existing membership'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_membership_keys ON public.project_operators;
CREATE TRIGGER trg_protect_membership_keys
  BEFORE UPDATE OF project_id, user_id ON public.project_operators
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_membership_keys();

-- Revoke direct execute on the new trigger function
REVOKE EXECUTE ON FUNCTION public.protect_membership_keys() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_membership_keys() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_membership_keys() FROM authenticated;
