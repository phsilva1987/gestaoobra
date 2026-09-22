/*
# Auth/RLS hardening

## Changes
1. Remove permissive INSERT policy on projects (WITH CHECK true)
2. Create create_project() RPC — atomic project + admin membership creation
3. Lock profiles.role via column-level REVOKE + UPDATE trigger
4. Last-admin protection trigger on project_operators
5. Audit all SECURITY DEFINER functions for search_path

## What is NOT changed
- No data modified or deleted
- No tables recreated
- No RLS policies on operational tables (stages, jobs, etc.) altered
- mockData / frontend untouched
*/

-- ============================================================
-- 1. Remove permissive INSERT policy on projects
-- ============================================================
-- Direct INSERT into projects is no longer allowed for any user.
-- Project creation must go through create_project() RPC.
DROP POLICY IF EXISTS "insert_projects" ON public.projects;

-- ============================================================
-- 2. create_project() RPC
-- ============================================================
-- Creates a project AND a project_operators row (role='admin') for
-- the calling user, atomically in a single transaction.
-- Only users with profile.role = 'admin' can create projects.
CREATE OR REPLACE FUNCTION public.create_project(
  p_name text,
  p_type text DEFAULT '',
  p_orcamento numeric DEFAULT 0,
  p_data_inicio date DEFAULT NULL,
  p_data_fim date DEFAULT NULL
)
RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_project public.projects;
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Load profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = '42501';
  END IF;

  -- Only global admins can create projects
  IF v_profile.role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can create projects' USING ERRCODE = '42501';
  END IF;

  -- Validate name
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Project name is required' USING ERRCODE = '23502';
  END IF;

  -- Insert project
  INSERT INTO public.projects (name, type, orcamento, data_inicio, data_fim)
  VALUES (p_name, p_type, p_orcamento, p_data_inicio, p_data_fim)
  RETURNING * INTO v_project;

  -- Insert admin membership for the creator
  INSERT INTO public.project_operators (project_id, user_id, role)
  VALUES (v_project.id, v_user_id, 'admin');

  RETURN v_project;
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.create_project(text, text, numeric, date, date) TO authenticated;

-- ============================================================
-- 3. Lock profiles.role — prevent self-promotion
-- ============================================================
-- Strategy: revoke UPDATE on the role column from authenticated/anon,
-- then add a BEFORE UPDATE trigger that blocks role changes via RLS-context.
-- The trigger allows role changes only when called by a SECURITY DEFINER
-- function (which runs as the owner, bypassing the trigger's auth check)
-- or by the postgres/service role directly.

-- Revoke column-level UPDATE on profiles.role
REVOKE UPDATE (role) ON public.profiles FROM authenticated, anon;

-- Trigger to block role changes from client context
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed, block it.
  -- SECURITY DEFINER functions that need to change role should
  -- use SET LOCAL to bypass this check, or operate as the owner.
  -- The service role / postgres user bypasses RLS and triggers
  -- can check current_setting to allow admin operations.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow if explicitly authorized via a server-side context
    IF current_setting('app.allow_role_change', true) = 'true' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Role cannot be changed by user' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ============================================================
-- 4. Last-admin protection on project_operators
-- ============================================================
-- Prevents removing or demoting the last admin of a project.
-- Fires BEFORE DELETE and BEFORE UPDATE on project_operators.

CREATE OR REPLACE FUNCTION public.protect_last_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_count int;
  v_project_id uuid;
  v_is_admin_being_removed boolean;
BEGIN
  -- Determine the project and whether the affected row is an admin
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
    v_is_admin_being_removed := (OLD.role = 'admin');
  ELSE
    -- UPDATE: check if role is changing away from admin
    v_project_id := NEW.project_id;
    v_is_admin_being_removed := (OLD.role = 'admin' AND NEW.role <> 'admin');
  END IF;

  -- Only check if an admin is being removed or demoted
  IF NOT v_is_admin_being_removed THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Count remaining admins (excluding the row being removed/demoted)
  SELECT count(*) INTO v_admin_count
  FROM public.project_operators
  WHERE project_id = v_project_id
    AND role = 'admin'
    AND id <> COALESCE(OLD.id, NEW.id);

  IF v_admin_count = 0 THEN
    RAISE EXCEPTION 'Cannot remove or demote the last admin of a project'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_admin_del ON public.project_operators;
CREATE TRIGGER trg_protect_last_admin_del
  BEFORE DELETE ON public.project_operators
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_last_admin();

DROP TRIGGER IF EXISTS trg_protect_last_admin_upd ON public.project_operators;
CREATE TRIGGER trg_protect_last_admin_upd
  BEFORE UPDATE OF role ON public.project_operators
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_last_admin();

-- ============================================================
-- 5. Audit: verify all SECURITY DEFINER functions have search_path
-- ============================================================
-- This is a query to run manually, not a migration step.
-- All functions created in this and prior migrations use:
--   SET search_path = public
-- Listed for audit:
--   is_project_member     — SECURITY DEFINER, SET search_path = public  ✓
--   is_project_admin      — SECURITY DEFINER, SET search_path = public  ✓
--   handle_new_user       — SECURITY DEFINER, SET search_path = public  ✓
--   validate_cross_project_ref — SECURITY DEFINER, SET search_path = public ✓
--   create_project        — SECURITY DEFINER, SET search_path = public  ✓
--   protect_profile_role  — SECURITY DEFINER, SET search_path = public  ✓
--   protect_last_admin    — SECURITY DEFINER, SET search_path = public  ✓
