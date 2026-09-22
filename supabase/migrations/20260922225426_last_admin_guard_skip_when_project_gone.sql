/*
# Allow project deletion while keeping the last-administrator guard

1. Changes
   - `protect_last_admin()` skips its check when the parent project row no longer
     exists (i.e. the membership is being removed by a cascade from deleting the
     project itself).

2. Security
   - The guard still blocks removing or demoting the last administrator of a live
     project; it simply no longer interferes with deleting the whole project.
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

  -- Parent project already gone: nothing left to protect.
  IF v_lock IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

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
