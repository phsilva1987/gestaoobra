/*
# Seed global categories

Inserts the base category lists currently used by the frontend as global
categories (is_global = true, project_id = NULL).

Idempotent: uses ON CONFLICT to avoid duplicates.
*/

INSERT INTO public.categories (project_id, type, name, is_global)
SELECT NULL, t.type, t.name, true
FROM (VALUES
  -- Categorias de Obra
  ('obra', 'Demolição'),
  ('obra', 'Alvenaria'),
  ('obra', 'Elétrica'),
  ('obra', 'Hidráulica'),
  ('obra', 'Iluminação'),
  ('obra', 'Pintura'),
  ('obra', 'Piso'),
  ('obra', 'Climatização'),
  ('obra', 'Limpeza'),
  ('obra', 'Acabamentos'),
  ('obra', 'Imprevistos'),
  -- Categorias de Material
  ('material', 'Demolição'),
  ('material', 'Alvenaria'),
  ('material', 'Elétrica'),
  ('material', 'Hidráulica'),
  ('material', 'Iluminação'),
  ('material', 'Pintura'),
  ('material', 'Piso'),
  ('material', 'Climatização'),
  ('material', 'Banheiros'),
  ('material', 'Acabamentos'),
  ('material', 'Limpeza'),
  ('material', 'Ferragens e fixação'),
  ('material', 'Outros')
) AS t(type, name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categories c
  WHERE c.project_id IS NULL
    AND c.type = t.type
    AND c.name = t.name
    AND c.is_global = true
);
