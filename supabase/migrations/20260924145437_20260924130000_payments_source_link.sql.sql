/*
# Payments: link to source entities (commitments)

## Purpose
Transform the `payments` table from a generic manual expense tracker into
the single source of truth for payment transactions linked to commitments
originated from jobs (professionals), materials, and equipment.

## Changes

### 1. New columns on `payments`
- `source_type` (text, nullable) — origin: 'PROFESSIONAL', 'MATERIAL', 'EQUIPMENT', 'LEGACY'
- `source_id` (uuid, nullable) — FK to the originating row (jobs.id, materials.id, equipment.id)
- `stage_id` (uuid, nullable) — denormalized stage for quick filtering
- `paid_at` (date, nullable) — the actual payment date
- `observacao` (text, not null default '') — note attached to the payment

### 2. Backfill existing paid amounts
For every `jobs` row where `pago > 0`, create a payment record with
source_type='PROFESSIONAL', source_id=jobs.id, valor=jobs.pago, status='Pago'.
Same for `materials` rows where `pago > 0` → source_type='MATERIAL'.
Existing manual payments with no source get source_type='LEGACY'.

### 3. RLS policies
Preserve the existing `is_project_member(project_id)` pattern.

### 4. Zero data loss
No existing payment rows are deleted or modified in value.
The single existing payment (Pendente) gets source_type='LEGACY'.
*/

-- 1. Add new columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source_id uuid;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stage_id uuid;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at date;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS observacao text NOT NULL DEFAULT '';

-- 2. Mark existing manual payments as LEGACY
UPDATE payments SET source_type = 'LEGACY' WHERE source_type IS NULL;

-- 3. Backfill job.pago > 0 as PROFESSIONAL payments
INSERT INTO payments (project_id, referencia, tipo, valor, status, forma, source_type, source_id, stage_id, paid_at, observacao)
SELECT
  j.project_id,
  COALESCE(p.nome, 'Profissional') || ' - ' || COALESCE(s.nome, 'Trabalho'),
  'Profissional',
  j.pago,
  'Pago',
  j.forma,
  'PROFESSIONAL',
  j.id,
  j.stage_id,
  COALESCE(j.updated_at::date, now()::date),
  'Pagamento migrado automaticamente'
FROM jobs j
LEFT JOIN professionals p ON p.id = j.professional_id
LEFT JOIN stages s ON s.id = j.stage_id
WHERE j.pago > 0
  AND NOT EXISTS (
    SELECT 1 FROM payments pay
    WHERE pay.source_type = 'PROFESSIONAL' AND pay.source_id = j.id
  );

-- 4. Backfill material.pago > 0 as MATERIAL payments
INSERT INTO payments (project_id, referencia, tipo, valor, status, forma, source_type, source_id, stage_id, paid_at, observacao)
SELECT
  m.project_id,
  m.nome,
  'Material',
  m.pago,
  'Pago',
  'PIX',
  'MATERIAL',
  m.id,
  m.stage_id,
  COALESCE(m.data, m.updated_at::date, now()::date),
  'Pagamento migrado automaticamente'
FROM materials m
WHERE m.pago > 0
  AND NOT EXISTS (
    SELECT 1 FROM payments pay
    WHERE pay.source_type = 'MATERIAL' AND pay.source_id = m.id
  );

-- 5. CHECK constraint on source_type
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_source_type_check;
ALTER TABLE payments ADD CONSTRAINT payments_source_type_check
  CHECK (source_type IS NULL OR source_type IN ('PROFESSIONAL', 'MATERIAL', 'EQUIPMENT', 'LEGACY'));

-- 6. Recreate RLS policies
DROP POLICY IF EXISTS "select_member_payments" ON payments;
DROP POLICY IF EXISTS "insert_member_payments" ON payments;
DROP POLICY IF EXISTS "update_member_payments" ON payments;
DROP POLICY IF EXISTS "delete_member_payments" ON payments;

CREATE POLICY "select_member_payments" ON payments FOR SELECT
  TO authenticated USING (is_project_member(project_id));

CREATE POLICY "insert_member_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (is_project_member(project_id));

CREATE POLICY "update_member_payments" ON payments FOR UPDATE
  TO authenticated USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "delete_member_payments" ON payments FOR DELETE
  TO authenticated USING (is_project_member(project_id));

-- 7. Index for fast source lookups
CREATE INDEX IF NOT EXISTS idx_payments_source ON payments(source_type, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);
