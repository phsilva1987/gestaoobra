/*
# Make the "last project administrator" guard race-free

1. Changes
   - `protect_last_admin()` now locks the parent project row (SELECT ... FOR UPDATE)
     before counting the remaining administrators.

2. Security
   - Two administrators removing each other at the same moment could previously both
     pass the check and leave a project with no administrator. The lock forces the
     two removals to be evaluated one after the other.

3. Notes
   1. Behaviour for normal single-user operations is unchanged.
*/

CREATE OR REPLACE FUNCTION public.protect_last_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_count int;
  v_project_id uuid;
  v_is_admin_being_removed boolean;
  v_lock uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_project_id := OLD.project_id;
    v_is_admin_being_removed := (OLD.role = 'admin');
  ELSE
    v_project_id := NEW.project_id;
    v_is_admin_being_removed := (OLD.role = 'admin' AND NEW.role <> 'admin');
  END IF;

  IF NOT v_is_admin_being_removed THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Serialise concurrent removals for the same project.
  SELECT p.id INTO v_lock FROM public.projects p
  WHERE p.id = v_project_id FOR UPDATE;

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
$function$;
