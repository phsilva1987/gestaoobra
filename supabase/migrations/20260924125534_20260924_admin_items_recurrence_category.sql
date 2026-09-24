/*
# Evolve admin_items with recurrence, category, status, and notes

## Purpose
The "Administrativo da Obra" feature needs to classify administrative costs
by recurrence type (one-time / monthly / annual), category (legal, accounting,
rent, etc.), active/inactive status, and free-form notes. This migration
adds those columns to the existing `admin_items` table without touching
existing data.

## Changes
1. New columns on `admin_items`:
   - `category` (text, nullable) — administrative category. Old rows stay
     NULL and the UI shows "Não classificado" until the user edits them.
   - `recurrence_type` (text, nullable, CHECK in 'ONE_TIME','MONTHLY','ANNUAL')
     — how the cost repeats. Old rows stay NULL → UI shows "Não classificado".
     No automatic inference is applied to existing rows.
   - `admin_status` (text, NOT NULL, DEFAULT 'ACTIVE', CHECK in 'ACTIVE','INACTIVE')
     — operational visibility. Old rows default to ACTIVE so they remain
     visible exactly as before.
   - `notes` (text, nullable) — optional observations.

2. Existing columns (`id`, `project_id`, `nome`, `valor`, `pago`, `status`,
   `created_at`, `updated_at`) are untouched. The old `status` column
   ('Pendente'/'Em andamento'/'Pago') and `pago` column remain for backward
   compatibility but are no longer shown in the new administrative UI.

3. No RLS changes — existing policies use `is_project_member(project_id)`
   which is unaffected by new columns.

4. No data migration, no inference, no defaults that change semantics.
   All new columns are added with `IF NOT EXISTS` guards.
*/

-- Add category (nullable — old rows remain NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_items' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.admin_items ADD COLUMN category text;
  END IF;
END $$;

-- Add recurrence_type (nullable — old rows remain NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_items' AND column_name = 'recurrence_type'
  ) THEN
    ALTER TABLE public.admin_items ADD COLUMN recurrence_type text
      CHECK (recurrence_type IS NULL OR recurrence_type IN ('ONE_TIME', 'MONTHLY', 'ANNUAL'));
  END IF;
END $$;

-- Add admin_status (NOT NULL, default ACTIVE — old rows become ACTIVE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_items' AND column_name = 'admin_status'
  ) THEN
    ALTER TABLE public.admin_items ADD COLUMN admin_status text NOT NULL DEFAULT 'ACTIVE'
      CHECK (admin_status IN ('ACTIVE', 'INACTIVE'));
  END IF;
END $$;

-- Add notes (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_items' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.admin_items ADD COLUMN notes text;
  END IF;
END $$;
