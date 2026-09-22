/*
# Initial Schema — Gestão de Obra

## Overview
Creates the complete PostgreSQL schema for the construction management app.
All tables use UUID primary keys, timestamptz audit columns, and Row Level Security.
No RLS policies are created in this migration — they will be added in Phase 2B.
The frontend continues to use mock data; no application code is changed.

## Tables Created (15)
1. **profiles** — user profiles, linked to auth.users for future auth integration
2. **projects** — construction projects with budget, dates, client info, cover image path
3. **project_operators** — N:N relationship between profiles and projects (admin/operator roles)
4. **stages** — work stages (etapas) with category, status, progress, dependency, priority
5. **professionals** — workers/companies (cadastral only, no financial fields)
6. **jobs** — financial contract between a professional and a stage (valor, pago, forma, parcelas)
7. **suppliers** — material/equipment suppliers, scoped per project
8. **materials** — materials linked to stage + supplier (quantity × unit_price = derived total, not stored)
9. **equipment** — equipment linked to stage + supplier (enters contratado, NO pago field)
10. **categories** — unified table for obra/material categories, global or project-scoped
11. **payments** — scheduled payments with reference, type, due date, status
12. **unforeseen** — unexpected expenses with cost and day impact
13. **admin_items** — administrative costs, kept separate from contratado/saldo
14. **stage_checklist** — normalized checklist items per stage (replaces 5 fixed boolean columns)

## Financial Rules Preserved (not enforced in DB, derived in app)
- CONTRATADO = SUM(jobs.valor) + SUM(materials.quantidade × materials.valor_unitario) + SUM(equipment.valor)
- PAGO = SUM(jobs.pago) + SUM(materials.pago)
- Equipment has NO pago field — enters contratado only
- Admin items are separate from contratado/saldo
- No aggregate columns stored in the database

## Security
- RLS enabled on ALL data tables (14 tables; profiles is the 15th).
- No policies created yet — tables are locked down by default.
- Phase 2B will implement admin/operator policies via project_operators membership.

## ON DELETE Strategy
- CASCADE: stage_checklist (child of stage), categories (child of project when project-scoped)
- RESTRICT: jobs → professionals/stages, materials → stages/suppliers, equipment → stages/suppliers
  (prevents silent data loss when a stage/professional/supplier has financial records)
- CASCADE: stages → projects, professionals → projects, suppliers → projects, etc.
  (these children cannot exist without their parent project)
- CASCADE: project_operators → both profiles and projects
- profiles → auth.users CASCADE (standard Supabase pattern)
*/

-- ============================================================
-- 0. Shared updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. projects
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  type             text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'Planejamento',
  empresa          text NOT NULL DEFAULT '',
  documento        text NOT NULL DEFAULT '',
  responsavel      text NOT NULL DEFAULT '',
  telefone         text NOT NULL DEFAULT '',
  email            text NOT NULL DEFAULT '',
  endereco         text NOT NULL DEFAULT '',
  cidade           text NOT NULL DEFAULT '',
  resp_obra        text NOT NULL DEFAULT '',
  orcamento        numeric(14, 2) NOT NULL DEFAULT 0 CHECK (orcamento >= 0),
  data_inicio      date,
  data_fim         date,
  cover_image_path text NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);

-- ============================================================
-- 3. project_operators (N:N profiles ↔ projects)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_operators (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

ALTER TABLE public.project_operators ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_project_operators_user ON public.project_operators (user_id);
CREATE INDEX IF NOT EXISTS idx_project_operators_project ON public.project_operators (project_id);

-- ============================================================
-- 4. stages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  categoria     text NOT NULL DEFAULT '',
  prioridade    text NOT NULL DEFAULT 'Média',
  status        text NOT NULL DEFAULT 'Não iniciado',
  progresso     integer NOT NULL DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  previsto      numeric(14, 2) NOT NULL DEFAULT 0 CHECK (previsto >= 0),
  inicio        date,
  fim           date,
  fim_real      date,
  dependencia   uuid REFERENCES public.stages(id) ON DELETE SET NULL,
  profissional_id uuid,  -- deprecated: use jobs table instead; kept for compatibility
  observacao    text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stages_project ON public.stages (project_id);
CREATE INDEX IF NOT EXISTS idx_stages_status ON public.stages (status);
CREATE INDEX IF NOT EXISTS idx_stages_fim ON public.stages (fim);
CREATE INDEX IF NOT EXISTS idx_stages_inicio ON public.stages (inicio);

-- ============================================================
-- 5. professionals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.professionals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  servico     text NOT NULL DEFAULT '',
  telefone    text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'Cotação',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_professionals_project ON public.professionals (project_id);

-- ============================================================
-- 6. jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
  stage_id        uuid NOT NULL REFERENCES public.stages(id) ON DELETE RESTRICT,
  valor           numeric(14, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  pago            numeric(14, 2) NOT NULL DEFAULT 0 CHECK (pago >= 0),
  forma           text NOT NULL DEFAULT 'Pix',
  chave_pix       text NOT NULL DEFAULT '',
  parcelas        text NOT NULL DEFAULT '1x',
  valor_parcela   numeric(14, 2),
  status          text NOT NULL DEFAULT 'Em andamento',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_jobs_project ON public.jobs (project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_professional ON public.jobs (professional_id);
CREATE INDEX IF NOT EXISTS idx_jobs_stage ON public.jobs (stage_id);

-- ============================================================
-- 7. suppliers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  telefone    text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  site        text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_suppliers_project ON public.suppliers (project_id);

-- ============================================================
-- 8. materials
-- ============================================================
CREATE TABLE IF NOT EXISTS public.materials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id      uuid NOT NULL REFERENCES public.stages(id) ON DELETE RESTRICT,
  supplier_id   uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  nome          text NOT NULL,
  categoria     text NOT NULL DEFAULT '',
  quantidade    numeric(14, 3) NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  unidade       text NOT NULL DEFAULT 'un',
  valor_unitario numeric(14, 2) NOT NULL DEFAULT 0 CHECK (valor_unitario >= 0),
  pago          numeric(14, 2) NOT NULL DEFAULT 0 CHECK (pago >= 0),
  data          date,
  status        text NOT NULL DEFAULT 'Pendente',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- No "total" column: total = quantidade × valor_unitario (derived)

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_materials_project ON public.materials (project_id);
CREATE INDEX IF NOT EXISTS idx_materials_stage ON public.materials (stage_id);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON public.materials (supplier_id);

-- ============================================================
-- 9. equipment
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipment (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id      uuid NOT NULL REFERENCES public.stages(id) ON DELETE RESTRICT,
  supplier_id   uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  nome          text NOT NULL,
  quantidade    integer NOT NULL DEFAULT 1 CHECK (quantidade >= 0),
  valor         numeric(14, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  -- NO "pago" column: equipment enters contratado only, not pago
  forma         text NOT NULL DEFAULT 'Pix',
  chave_pix     text NOT NULL DEFAULT '',
  parcelas      text NOT NULL DEFAULT '1x',
  valor_parcela numeric(14, 2),
  data_compra   date,
  data_entrega  date,
  status        text NOT NULL DEFAULT 'Aguardando entrega',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_equipment_project ON public.equipment (project_id);
CREATE INDEX IF NOT EXISTS idx_equipment_stage ON public.equipment (stage_id);
CREATE INDEX IF NOT EXISTS idx_equipment_supplier ON public.equipment (supplier_id);

-- ============================================================
-- 10. categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('obra', 'material')),
  name        text NOT NULL,
  is_global   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- When project_id is NULL and is_global = true → base/default category for all projects
-- When project_id is set → project-specific extra category

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_categories_project ON public.categories (project_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories (type);

-- ============================================================
-- 11. payments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  referencia  text NOT NULL,
  tipo        text NOT NULL DEFAULT 'Profissional',
  valor       numeric(14, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  vencimento  date,
  forma       text NOT NULL DEFAULT 'PIX',
  status      text NOT NULL DEFAULT 'Pendente',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_project ON public.payments (project_id);
CREATE INDEX IF NOT EXISTS idx_payments_vencimento ON public.payments (vencimento);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);

-- ============================================================
-- 12. unforeseen
-- ============================================================
CREATE TABLE IF NOT EXISTS public.unforeseen (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  categoria     text NOT NULL DEFAULT '',
  valor         numeric(14, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  impacto_dias  integer NOT NULL DEFAULT 0 CHECK (impacto_dias >= 0),
  status        text NOT NULL DEFAULT 'Aberto',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unforeseen ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_unforeseen_project ON public.unforeseen (project_id);

-- ============================================================
-- 13. admin_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  valor       numeric(14, 2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  pago        numeric(14, 2) NOT NULL DEFAULT 0 CHECK (pago >= 0),
  status      text NOT NULL DEFAULT 'Pendente',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Admin items are NOT included in contratado or saldo — kept separate

ALTER TABLE public.admin_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_items_project ON public.admin_items (project_id);

-- ============================================================
-- 14. stage_checklist (normalized — replaces 5 fixed boolean columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stage_checklist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id    uuid NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
  label       text NOT NULL,
  completed   boolean NOT NULL DEFAULT false,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stage_checklist ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stage_checklist_stage ON public.stage_checklist (stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_checklist_project ON public.stage_checklist (project_id);

-- ============================================================
-- 15. updated_at triggers (shared function, one trigger per table)
-- ============================================================
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'projects', 'stages', 'professionals', 'jobs',
      'suppliers', 'materials', 'equipment', 'payments', 'unforeseen',
      'admin_items', 'stage_checklist'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;
       CREATE TRIGGER trg_set_updated_at
         BEFORE UPDATE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;
