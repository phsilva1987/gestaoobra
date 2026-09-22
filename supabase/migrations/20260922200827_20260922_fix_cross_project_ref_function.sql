/*
# Fix validate_cross_project_ref for tables without professional_id/supplier_id

The function unconditionally references NEW.professional_id and NEW.supplier_id,
which don't exist on stage_checklist. This causes errors when inserting into
stage_checklist because the function tries to access those columns.

Fix: Use TG_TABLE_NAME to guard which checks run for which tables.
*/

CREATE OR REPLACE FUNCTION public.validate_cross_project_ref()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_stage_project_id uuid;
  v_prof_project_id uuid;
  v_supplier_project_id uuid;
BEGIN
  -- Check stage belongs to same project (applies to jobs, materials, equipment, stage_checklist)
  IF TG_ARGV[0] = 'has_stage' AND NEW.stage_id IS NOT NULL THEN
    SELECT project_id INTO v_stage_project_id FROM public.stages WHERE id = NEW.stage_id;
    IF v_stage_project_id IS NULL OR v_stage_project_id <> NEW.project_id THEN
      RAISE EXCEPTION 'stage_id % does not belong to project %', NEW.stage_id, NEW.project_id
      USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;

  -- Check professional belongs to same project (applies to jobs only)
  IF TG_ARGV[0] = 'has_professional' AND TG_TABLE_NAME = 'jobs' THEN
    IF NEW.professional_id IS NOT NULL THEN
      SELECT project_id INTO v_prof_project_id FROM public.professionals WHERE id = NEW.professional_id;
      IF v_prof_project_id IS NULL OR v_prof_project_id <> NEW.project_id THEN
        RAISE EXCEPTION 'professional_id % does not belong to project %', NEW.professional_id, NEW.project_id
        USING ERRCODE = 'foreign_key_violation';
      END IF;
    END IF;
  END IF;

  -- Check supplier belongs to same project (applies to materials, equipment)
  IF TG_ARGV[0] = 'has_supplier' AND TG_TABLE_NAME IN ('materials', 'equipment') THEN
    IF NEW.supplier_id IS NOT NULL THEN
      SELECT project_id INTO v_supplier_project_id FROM public.suppliers WHERE id = NEW.supplier_id;
      IF v_supplier_project_id IS NULL OR v_supplier_project_id <> NEW.project_id THEN
        RAISE EXCEPTION 'supplier_id % does not belong to project %', NEW.supplier_id, NEW.project_id
        USING ERRCODE = 'foreign_key_violation';
      END IF;
    END IF;
  END IF;

  -- Check second argument if present (jobs has two checks)
  IF array_length(TG_ARGV, 1) >= 2 AND TG_ARGV[1] = 'has_professional' AND TG_TABLE_NAME = 'jobs' THEN
    IF NEW.professional_id IS NOT NULL THEN
      SELECT project_id INTO v_prof_project_id FROM public.professionals WHERE id = NEW.professional_id;
      IF v_prof_project_id IS NULL OR v_prof_project_id <> NEW.project_id THEN
        RAISE EXCEPTION 'professional_id % does not belong to project %', NEW.professional_id, NEW.project_id
        USING ERRCODE = 'foreign_key_violation';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
