/*
# RLS policies — admin/operator authorization

## Overview
Creates row-level security policies on all 14 data tables.
Authorization is based on project_operators membership, checked via
the SECURITY DEFINER helper functions is_project_member() and is_project_admin().

## Anti-recursion strategy
- is_project_member() and is_project_admin() are SECURITY DEFINER functions.
- They bypass RLS on project_operators, so policies on project_operators
  can safely call them without infinite recursion.
- project_operators has its own direct policies using auth.uid() comparisons.

## Policy structure per table (4 policies: SELECT/INSERT/UPDATE/DELETE)

### profiles
- SELECT: user can read own profile
- UPDATE: user can update own profile (but NOT role — enforced by app)
- No INSERT (created by trigger) / No DELETE (managed by auth)

### projects
- SELECT: is_project_member
- INSERT: any authenticated user (project creation; membership must be added separately)
- UPDATE: is_project_admin
- DELETE: is_project_admin

### project_operators
- SELECT: user can read rows for projects where they are a member
- INSERT: is_project_admin of the project (adding operators)
- UPDATE: is_project_admin of the project
- DELETE: is_project_admin of the project
- Self-promotion to admin blocked: WITH CHECK ensures the inserter/updater
  is already admin, and a user cannot set their own role to admin
  (checked via app + the fact that only admins can write)

### stages, professionals, jobs, suppliers, materials, equipment,
### payments, unforeseen, admin_items, stage_checklist
- SELECT: is_project_member
- INSERT/UPDATE/DELETE: is_project_member (both admin and operator can work on operational data)

### categories
- SELECT: global categories readable by any authenticated user;
  project categories readable by project members
- INSERT/UPDATE/DELETE: project categories by project members;
  global categories by admin only (profile.role = 'admin')
*/

-- ============================================================
-- profiles
-- ============================================================
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- projects
-- ============================================================
DROP POLICY IF EXISTS "select_member_projects" ON public.projects;
CREATE POLICY "select_member_projects" ON public.projects
  FOR SELECT TO authenticated
  USING (public.is_project_member(id));

DROP POLICY IF EXISTS "insert_projects" ON public.projects;
CREATE POLICY "insert_projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "update_admin_projects" ON public.projects;
CREATE POLICY "update_admin_projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.is_project_admin(id))
  WITH CHECK (public.is_project_admin(id));

DROP POLICY IF EXISTS "delete_admin_projects" ON public.projects;
CREATE POLICY "delete_admin_projects" ON public.projects
  FOR DELETE TO authenticated
  USING (public.is_project_admin(id));

-- ============================================================
-- project_operators
-- ============================================================
-- SELECT: a user can see operators of projects they belong to
DROP POLICY IF EXISTS "select_member_operators" ON public.project_operators;
CREATE POLICY "select_member_operators" ON public.project_operators
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

-- INSERT: only project admin can add operators
-- The admin's own membership must already exist (checked by is_project_admin)
-- A user cannot add themselves as admin because is_project_admin checks
-- EXISTING rows, not the row being inserted
DROP POLICY IF EXISTS "insert_admin_operators" ON public.project_operators;
CREATE POLICY "insert_admin_operators" ON public.project_operators
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_project_admin(project_id)
    AND user_id <> auth.uid()
  );

-- UPDATE: only project admin can change operator roles
DROP POLICY IF EXISTS "update_admin_operators" ON public.project_operators;
CREATE POLICY "update_admin_operators" ON public.project_operators
  FOR UPDATE TO authenticated
  USING (public.is_project_admin(project_id))
  WITH CHECK (
    public.is_project_admin(project_id)
    AND user_id <> auth.uid()
  );

-- DELETE: only project admin can remove operators (cannot remove self)
DROP POLICY IF EXISTS "delete_admin_operators" ON public.project_operators;
CREATE POLICY "delete_admin_operators" ON public.project_operators
  FOR DELETE TO authenticated
  USING (
    public.is_project_admin(project_id)
    AND user_id <> auth.uid()
  );

-- ============================================================
-- stages
-- ============================================================
DROP POLICY IF EXISTS "select_member_stages" ON public.stages;
CREATE POLICY "select_member_stages" ON public.stages
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_stages" ON public.stages;
CREATE POLICY "insert_member_stages" ON public.stages
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_stages" ON public.stages;
CREATE POLICY "update_member_stages" ON public.stages
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_stages" ON public.stages;
CREATE POLICY "delete_member_stages" ON public.stages
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- professionals
-- ============================================================
DROP POLICY IF EXISTS "select_member_professionals" ON public.professionals;
CREATE POLICY "select_member_professionals" ON public.professionals
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_professionals" ON public.professionals;
CREATE POLICY "insert_member_professionals" ON public.professionals
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_professionals" ON public.professionals;
CREATE POLICY "update_member_professionals" ON public.professionals
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_professionals" ON public.professionals;
CREATE POLICY "delete_member_professionals" ON public.professionals
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- jobs
-- ============================================================
DROP POLICY IF EXISTS "select_member_jobs" ON public.jobs;
CREATE POLICY "select_member_jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_jobs" ON public.jobs;
CREATE POLICY "insert_member_jobs" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_jobs" ON public.jobs;
CREATE POLICY "update_member_jobs" ON public.jobs
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_jobs" ON public.jobs;
CREATE POLICY "delete_member_jobs" ON public.jobs
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- suppliers
-- ============================================================
DROP POLICY IF EXISTS "select_member_suppliers" ON public.suppliers;
CREATE POLICY "select_member_suppliers" ON public.suppliers
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_suppliers" ON public.suppliers;
CREATE POLICY "insert_member_suppliers" ON public.suppliers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_suppliers" ON public.suppliers;
CREATE POLICY "update_member_suppliers" ON public.suppliers
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_suppliers" ON public.suppliers;
CREATE POLICY "delete_member_suppliers" ON public.suppliers
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- materials
-- ============================================================
DROP POLICY IF EXISTS "select_member_materials" ON public.materials;
CREATE POLICY "select_member_materials" ON public.materials
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_materials" ON public.materials;
CREATE POLICY "insert_member_materials" ON public.materials
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_materials" ON public.materials;
CREATE POLICY "update_member_materials" ON public.materials
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_materials" ON public.materials;
CREATE POLICY "delete_member_materials" ON public.materials
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- equipment
-- ============================================================
DROP POLICY IF EXISTS "select_member_equipment" ON public.equipment;
CREATE POLICY "select_member_equipment" ON public.equipment
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_equipment" ON public.equipment;
CREATE POLICY "insert_member_equipment" ON public.equipment
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_equipment" ON public.equipment;
CREATE POLICY "update_member_equipment" ON public.equipment
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_equipment" ON public.equipment;
CREATE POLICY "delete_member_equipment" ON public.equipment
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- payments
-- ============================================================
DROP POLICY IF EXISTS "select_member_payments" ON public.payments;
CREATE POLICY "select_member_payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_payments" ON public.payments;
CREATE POLICY "insert_member_payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_payments" ON public.payments;
CREATE POLICY "update_member_payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_payments" ON public.payments;
CREATE POLICY "delete_member_payments" ON public.payments
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- unforeseen
-- ============================================================
DROP POLICY IF EXISTS "select_member_unforeseen" ON public.unforeseen;
CREATE POLICY "select_member_unforeseen" ON public.unforeseen
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_unforeseen" ON public.unforeseen;
CREATE POLICY "insert_member_unforeseen" ON public.unforeseen
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_unforeseen" ON public.unforeseen;
CREATE POLICY "update_member_unforeseen" ON public.unforeseen
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_unforeseen" ON public.unforeseen;
CREATE POLICY "delete_member_unforeseen" ON public.unforeseen
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- admin_items
-- ============================================================
DROP POLICY IF EXISTS "select_member_admin_items" ON public.admin_items;
CREATE POLICY "select_member_admin_items" ON public.admin_items
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_admin_items" ON public.admin_items;
CREATE POLICY "insert_member_admin_items" ON public.admin_items
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_admin_items" ON public.admin_items;
CREATE POLICY "update_member_admin_items" ON public.admin_items
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_admin_items" ON public.admin_items;
CREATE POLICY "delete_member_admin_items" ON public.admin_items
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- stage_checklist
-- ============================================================
DROP POLICY IF EXISTS "select_member_stage_checklist" ON public.stage_checklist;
CREATE POLICY "select_member_stage_checklist" ON public.stage_checklist
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

DROP POLICY IF EXISTS "insert_member_stage_checklist" ON public.stage_checklist;
CREATE POLICY "insert_member_stage_checklist" ON public.stage_checklist
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "update_member_stage_checklist" ON public.stage_checklist;
CREATE POLICY "update_member_stage_checklist" ON public.stage_checklist
  FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "delete_member_stage_checklist" ON public.stage_checklist;
CREATE POLICY "delete_member_stage_checklist" ON public.stage_checklist
  FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));

-- ============================================================
-- categories
-- ============================================================
-- SELECT: global categories readable by all authenticated users;
-- project categories readable by project members
DROP POLICY IF EXISTS "select_categories" ON public.categories;
CREATE POLICY "select_categories" ON public.categories
  FOR SELECT TO authenticated
  USING (
    is_global = true
    OR public.is_project_member(project_id)
  );

-- INSERT/UPDATE/DELETE: project categories by project members;
-- global categories by global admin only
DROP POLICY IF EXISTS "insert_categories" ON public.categories;
CREATE POLICY "insert_categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (
    (project_id IS NOT NULL AND public.is_project_member(project_id))
    OR (
      project_id IS NULL AND is_global = true
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "update_categories" ON public.categories;
CREATE POLICY "update_categories" ON public.categories
  FOR UPDATE TO authenticated
  USING (
    (project_id IS NOT NULL AND public.is_project_member(project_id))
    OR (
      project_id IS NULL AND is_global = true
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    (project_id IS NOT NULL AND public.is_project_member(project_id))
    OR (
      project_id IS NULL AND is_global = true
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "delete_categories" ON public.categories;
CREATE POLICY "delete_categories" ON public.categories
  FOR DELETE TO authenticated
  USING (
    (project_id IS NOT NULL AND public.is_project_member(project_id))
    OR (
      project_id IS NULL AND is_global = true
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );
