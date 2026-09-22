/*
# Cross-project integrity triggers

## Problem
RLS ensures users can only write to projects they belong to, but it does NOT
prevent a user from writing a row with project_id = A while pointing a foreign
key (stage_id, professional_id, supplier_id) at a row from project B.

Example attack:
  INSERT INTO jobs (project_id, stage_id, professional_id, ...)
  VALUES ('project-A-id', 'stage-from-project-B', 'prof-from-project-A', ...)

The RLS policy checks is_project_member(project_id) = true for project A,
but stage_id from project B would silently link data across projects.

## Solution
BEFORE INSERT/UPDATE triggers on jobs, materials, equipment, and stage_checklist
that verify the referenced row belongs to the same project_id.

## Triggers created
1. jobs: verify professional.project_id = jobs.project_id AND stage.project_id = jobs.project_id
2. materials: verify stage.project_id = materials.project_id AND (supplier is null OR supplier.project_id = materials.project_id)
3. equipment: verify stage.project_id = equipment.project_id AND (supplier is null OR supplier.project_id = equipment.project_id)
4. stage_checklist: verify stage.project_id = stage_checklist.project_id

## What is NOT changed
- No data modified
- No tables recreated
- No RLS policies altered
- Financial rules unchanged
*/

-- ============================================================
-- Shared validation function
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_cross_project_ref()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Check professional belongs to same project (applies to jobs)
  IF TG_ARGV[0] = 'has_professional' AND NEW.professional_id IS NOT NULL THEN
    SELECT project_id INTO v_prof_project_id FROM public.professionals WHERE id = NEW.professional_id;
    IF v_prof_project_id IS NULL OR v_prof_project_id <> NEW.project_id THEN
      RAISE EXCEPTION 'professional_id % does not belong to project %', NEW.professional_id, NEW.project_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;

  -- Check supplier belongs to same project (applies to materials, equipment)
  IF TG_ARGV[0] = 'has_supplier' AND NEW.supplier_id IS NOT NULL THEN
    SELECT project_id INTO v_supplier_project_id FROM public.suppliers WHERE id = NEW.supplier_id;
    IF v_supplier_project_id IS NULL OR v_supplier_project_id <> NEW.project_id THEN
      RAISE EXCEPTION 'supplier_id % does not belong to project %', NEW.supplier_id, NEW.project_id
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- jobs: validate stage + professional same project
-- ============================================================
DROP TRIGGER IF EXISTS trg_jobs_cross_project ON public.jobs;
CREATE TRIGGER trg_jobs_cross_project
  BEFORE INSERT OR UPDATE OF project_id, stage_id, professional_id ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cross_project_ref('has_stage', 'has_professional');

-- ============================================================
-- materials: validate stage + supplier same project
-- ============================================================
DROP TRIGGER IF EXISTS trg_materials_cross_project ON public.materials;
CREATE TRIGGER trg_materials_cross_project
  BEFORE INSERT OR UPDATE OF project_id, stage_id, supplier_id ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cross_project_ref('has_stage', 'has_supplier');

-- ============================================================
-- equipment: validate stage + supplier same project
-- ============================================================
DROP TRIGGER IF EXISTS trg_equipment_cross_project ON public.equipment;
CREATE TRIGGER trg_equipment_cross_project
  BEFORE INSERT OR UPDATE OF project_id, stage_id, supplier_id ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cross_project_ref('has_stage', 'has_supplier');

-- ============================================================
-- stage_checklist: validate stage same project
-- ============================================================
DROP TRIGGER IF EXISTS trg_stage_checklist_cross_project ON public.stage_checklist;
CREATE TRIGGER trg_stage_checklist_cross_project
  BEFORE INSERT OR UPDATE OF project_id, stage_id ON public.stage_checklist
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cross_project_ref('has_stage');
