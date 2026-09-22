/*
# Fix Supplier FK ON DELETE behavior

## Problem
The initial schema created `materials.supplier_id` and `equipment.supplier_id`
with ON DELETE SET NULL. This means deleting a supplier silently nullifies the
reference on linked materials/equipment, which violates the business rule:
a supplier in use cannot be deleted.

## Change
Drop and recreate exactly two foreign key constraints:
1. `materials_supplier_id_fkey` → ON DELETE RESTRICT
2. `equipment_supplier_id_fkey` → ON DELETE RESTRICT

## What is NOT changed
- No data is deleted or modified
- supplier_id remains nullable (material/equipment without supplier is allowed)
- No other constraints, indexes, or tables are touched
- RLS policies remain unchanged (still none — Phase 2B)
- Financial rules remain unchanged (no aggregate columns, equipment has no pago)
*/

-- 1. materials.supplier_id: SET NULL → RESTRICT
ALTER TABLE public.materials
  DROP CONSTRAINT IF EXISTS materials_supplier_id_fkey;

ALTER TABLE public.materials
  ADD CONSTRAINT materials_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
  ON DELETE RESTRICT;

-- 2. equipment.supplier_id: SET NULL → RESTRICT
ALTER TABLE public.equipment
  DROP CONSTRAINT IF EXISTS equipment_supplier_id_fkey;

ALTER TABLE public.equipment
  ADD CONSTRAINT equipment_supplier_id_fkey
  FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
  ON DELETE RESTRICT;
