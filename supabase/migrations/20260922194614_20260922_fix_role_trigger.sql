/*
# Fix: allow server-side role changes

## Problem
The previous migration made protect_profile_role unconditionally block
ALL role changes, including by postgres/service_role. This prevents
administrative bootstrap of the first admin.

## Fix
The trigger now checks current_user. If the current user is 'postgres'
or 'service_role' (server-side contexts that authenticated/anon users
cannot impersonate), the role change is allowed.

This is NOT a GUC — it's the actual database session user, which is
set by PostgreSQL internally and cannot be spoofed by client roles.
*/

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow server-side administrative roles (cannot be impersonated by clients)
    IF current_user IN ('postgres', 'service_role') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Role cannot be changed by user. Use administrative tools.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Re-grant EXECUTE only to postgres and service_role (not PUBLIC/anon/authenticated)
-- Trigger functions don't need explicit EXECUTE grants to fire, but we keep it clean.
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM authenticated;
