/*
# Fix: protect_profile_role must be SECURITY INVOKER

## Problem
protect_profile_role was SECURITY DEFINER. Inside a SECURITY DEFINER function,
current_user returns the function OWNER (postgres), not the calling user.
This means the `current_user IN ('postgres', 'service_role')` check always
passed, allowing any authenticated user to change their role.

## Fix
Change the function to SECURITY INVOKER (the default). Now current_user
reflects the actual role executing the statement:
- Client requests via Supabase API: current_user = 'authenticated' → blocked
- Server-side SQL (SQL editor, service role): current_user = 'postgres' → allowed

The function only compares NEW vs OLD and raises an exception — it does not
query any tables, so SECURITY INVOKER is safe and sufficient.
*/

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow server-side administrative roles only
    -- These cannot be impersonated by authenticated/anon clients
    IF current_user IN ('postgres', 'service_role') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Role cannot be changed by user. Use administrative tools.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Keep EXECUTE revoked from client roles
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_profile_role() FROM authenticated;
