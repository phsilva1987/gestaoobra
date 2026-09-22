/*
# Always keep at least one system administrator

1. New function
   - `protect_last_global_admin()`: raises an error when the last profile with the
     `admin` role would be deleted or demoted. Takes a transaction-level advisory
     lock first so two concurrent deletions cannot both pass the check.

2. New trigger
   - `trg_protect_last_global_admin` BEFORE DELETE OR UPDATE OF role ON `profiles`.

3. Security
   - Prevents the application from ending up with no administrator at all, which
     would make user management permanently unreachable.
*/

CREATE OR REPLACE FUNCTION public.protect_last_global_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_count int;
  v_removing boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_removing := (OLD.role = 'admin');
  ELSE
    v_removing := (OLD.role = 'admin' AND NEW.role IS DISTINCT FROM 'admin');
  END IF;

  IF NOT v_removing THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Serialise concurrent admin removals.
  PERFORM pg_advisory_xact_lock(hashtext('public.profiles:last_global_admin'));

  SELECT count(*) INTO v_admin_count
  FROM public.profiles
  WHERE role = 'admin' AND id <> OLD.id;

  IF v_admin_count = 0 THEN
    RAISE EXCEPTION 'Cannot remove or demote the last system administrator'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_last_global_admin ON public.profiles;
CREATE TRIGGER trg_protect_last_global_admin
  BEFORE DELETE OR UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_global_admin();
