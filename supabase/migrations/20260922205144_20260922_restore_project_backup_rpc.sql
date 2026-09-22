/*
# restore_project_backup RPC (fix return)

Fixes the RETURN NEXT syntax for RETURNS TABLE function.
Instead of RETURN NEXT (val1, val2), assign to output columns then RETURN NEXT.
*/

CREATE OR REPLACE FUNCTION public.restore_project_backup(p_backup jsonb)
RETURNS TABLE (project_name text, records integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_profile profiles;
  v_projects jsonb;
  v_proj jsonb;
  v_project_id uuid;
  v_old_project_id text;
  v_count integer;
  v_stage_map jsonb;
  v_prof_map jsonb;
  v_supplier_map jsonb;
  v_stage_id uuid;
  v_prof_id uuid;
  v_supplier_id uuid;
  v_new_stage_id uuid;
  v_new_prof_id uuid;
  v_new_supplier_id uuid;
  v_stage jsonb;
  v_prof jsonb;
  v_supplier jsonb;
  v_job jsonb;
  v_material jsonb;
  v_equip jsonb;
  v_checklist jsonb;
  v_payment jsonb;
  v_unforeseen jsonb;
  v_admin jsonb;
  v_proj_checklist jsonb;
  v_total_records integer;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_caller;
  IF NOT FOUND OR v_profile.role <> 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem restaurar backups' USING ERRCODE = '42501';
  END IF;

  v_projects := p_backup->'data'->'projects';
  IF v_projects IS NULL OR jsonb_array_length(v_projects) = 0 THEN
    RAISE EXCEPTION 'Backup invalido: nenhum projeto encontrado';
  END IF;

  v_total_records := 0;

  FOR v_proj IN SELECT * FROM jsonb_array_elements(v_projects)
  LOOP
    v_old_project_id := v_proj->>'id';
    v_stage_map := '{}'::jsonb;
    v_prof_map := '{}'::jsonb;
    v_supplier_map := '{}'::jsonb;

    INSERT INTO projects (
      name, type, status, empresa, documento, responsavel, telefone, email,
      endereco, cidade, resp_obra, orcamento, data_inicio, data_fim, cover_image_path
    ) VALUES (
      COALESCE(v_proj->>'nome', 'Projeto Restaurado') || ' (Restaurado)',
      COALESCE(v_proj->>'tipo', 'Outro'),
      COALESCE(v_proj->>'status', 'Planejamento'),
      COALESCE(v_proj#>>'{config,empresa}', ''),
      COALESCE(v_proj#>>'{config,documento}', ''),
      COALESCE(v_proj#>>'{config,responsavel}', ''),
      COALESCE(v_proj#>>'{config,telefone}', ''),
      COALESCE(v_proj#>>'{config,email}', ''),
      COALESCE(v_proj#>>'{config,endereco}', ''),
      COALESCE(v_proj#>>'{config,cidade}', ''),
      COALESCE(v_proj#>>'{config,respObra}', ''),
      COALESCE((v_proj#>>'{config,orcamento}')::numeric, 0),
      NULLIF(v_proj#>>'{config,inicio}', ''),
      NULLIF(v_proj#>>'{config,fim}', ''),
      COALESCE(v_proj->>'coverImage', '')
    )
    RETURNING id INTO v_project_id;

    v_count := 1;

    INSERT INTO project_operators (project_id, user_id, role)
    VALUES (v_project_id, v_caller, 'admin');

    -- Categories obra
    FOR v_stage IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'categoriasObraExtra', '[]'::jsonb))
    LOOP
      INSERT INTO categories (project_id, type, name, is_global)
      VALUES (v_project_id, 'obra', v_stage->>'name', false)
      ON CONFLICT DO NOTHING;
      v_count := v_count + 1;
    END LOOP;

    -- Categories material
    FOR v_stage IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'categoriasMaterialExtra', '[]'::jsonb))
    LOOP
      INSERT INTO categories (project_id, type, name, is_global)
      VALUES (v_project_id, 'material', v_stage->>'name', false)
      ON CONFLICT DO NOTHING;
      v_count := v_count + 1;
    END LOOP;

    -- Suppliers
    FOR v_supplier IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'fornecedores', '[]'::jsonb))
    LOOP
      v_new_supplier_id := gen_random_uuid();
      INSERT INTO suppliers (id, project_id, nome, telefone, email, site)
      VALUES (
        v_new_supplier_id, v_project_id,
        COALESCE(v_supplier->>'nome', ''),
        COALESCE(v_supplier->>'telefone', ''),
        COALESCE(v_supplier->>'email', ''),
        COALESCE(v_supplier->>'site', '')
      );
      v_supplier_map := v_supplier_map || jsonb_build_object(v_supplier->>'id', v_new_supplier_id);
      v_count := v_count + 1;
    END LOOP;

    -- Stages (no deps yet)
    FOR v_stage IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'obra', '[]'::jsonb))
    LOOP
      v_new_stage_id := gen_random_uuid();
      INSERT INTO stages (
        id, project_id, nome, categoria, prioridade, status, progresso, previsto,
        inicio, fim, fim_real, dependencia, profissional_id, observacao
      ) VALUES (
        v_new_stage_id, v_project_id,
        COALESCE(v_stage->>'nome', ''),
        COALESCE(v_stage->>'categoria', ''),
        COALESCE(v_stage->>'prioridade', 'Media'),
        COALESCE(v_stage->>'status', 'Planejamento'),
        COALESCE((v_stage->>'progresso')::integer, 0),
        COALESCE((v_stage->>'previsto')::numeric, 0),
        NULLIF(v_stage->>'inicio', ''),
        NULLIF(v_stage->>'fim', ''),
        NULLIF(v_stage->>'fimReal', ''),
        NULL,
        NULL,
        COALESCE(v_stage->>'observacao', '')
      );
      v_stage_map := v_stage_map || jsonb_build_object(v_stage->>'id', v_new_stage_id);
      v_count := v_count + 1;
    END LOOP;

    -- Update stage dependencies
    FOR v_stage IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'obra', '[]'::jsonb))
    LOOP
      IF v_stage->>'dependencia' IS NOT NULL AND v_stage->>'dependencia' <> '' THEN
        v_new_stage_id := (v_stage_map ->> (v_stage->>'id'))::uuid;
        UPDATE stages SET dependencia = (v_stage_map ->> (v_stage->>'dependencia'))::uuid
        WHERE id = v_new_stage_id;
      END IF;
    END LOOP;

    -- Professionals
    FOR v_prof IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'profissionais', '[]'::jsonb))
    LOOP
      v_new_prof_id := gen_random_uuid();
      INSERT INTO professionals (id, project_id, nome, servico, telefone, email, status)
      VALUES (
        v_new_prof_id, v_project_id,
        COALESCE(v_prof->>'nome', ''),
        COALESCE(v_prof->>'servico', ''),
        COALESCE(v_prof->>'telefone', ''),
        COALESCE(v_prof->>'email', ''),
        COALESCE(v_prof->>'status', 'Ativo')
      );
      v_prof_map := v_prof_map || jsonb_build_object(v_prof->>'id', v_new_prof_id);
      v_count := v_count + 1;
    END LOOP;

    -- Update stage profissional_id
    FOR v_stage IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'obra', '[]'::jsonb))
    LOOP
      IF v_stage->>'profissionalId' IS NOT NULL AND v_stage->>'profissionalId' <> '' THEN
        v_new_stage_id := (v_stage_map ->> (v_stage->>'id'))::uuid;
        v_new_prof_id := (v_prof_map ->> (v_stage->>'profissionalId'))::uuid;
        IF v_new_prof_id IS NOT NULL THEN
          UPDATE stages SET profissional_id = v_new_prof_id WHERE id = v_new_stage_id;
        END IF;
      END IF;
    END LOOP;

    -- Jobs
    FOR v_job IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'jobs', '[]'::jsonb))
    LOOP
      v_new_stage_id := (v_stage_map ->> (v_job->>'etapa_id'))::uuid;
      v_new_prof_id := (v_prof_map ->> (v_job->>'profissional_id'))::uuid;
      IF v_new_stage_id IS NULL OR v_new_prof_id IS NULL THEN
        RAISE EXCEPTION 'Job referencia etapa ou profissional inexistente';
      END IF;
      INSERT INTO jobs (
        project_id, professional_id, stage_id, valor, pago, forma, chave_pix,
        parcelas, valor_parcela, status
      ) VALUES (
        v_project_id, v_new_prof_id, v_new_stage_id,
        COALESCE((v_job->>'valor')::numeric, 0),
        COALESCE((v_job->>'pago')::numeric, 0),
        COALESCE(v_job->>'forma', 'Dinheiro'),
        COALESCE(v_job->>'chavePix', ''),
        COALESCE(v_job->>'parcelas', '1x'),
        NULLIF(v_job->>'valorParcela', '')::numeric,
        COALESCE(v_job->>'status', 'Pendente')
      );
      v_count := v_count + 1;
    END LOOP;

    -- Materials
    FOR v_material IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'materiais', '[]'::jsonb))
    LOOP
      v_new_stage_id := (v_stage_map ->> (v_material->>'etapa_id'))::uuid;
      IF v_new_stage_id IS NULL THEN
        RAISE EXCEPTION 'Material referencia etapa inexistente';
      END IF;
      v_supplier_id := NULL;
      IF v_material->>'fornecedorId' IS NOT NULL AND v_material->>'fornecedorId' <> '' THEN
        v_supplier_id := (v_supplier_map ->> (v_material->>'fornecedorId'))::uuid;
      END IF;
      INSERT INTO materials (
        project_id, stage_id, supplier_id, nome, categoria, quantidade, unidade,
        valor_unitario, pago, data, status
      ) VALUES (
        v_project_id, v_new_stage_id, v_supplier_id,
        COALESCE(v_material->>'nome', ''),
        COALESCE(v_material->>'categoria', ''),
        COALESCE((v_material->>'quantidade')::numeric, 0),
        COALESCE(v_material->>'unidade', 'un'),
        COALESCE((v_material->>'unitario')::numeric, 0),
        COALESCE((v_material->>'pago')::numeric, 0),
        NULLIF(v_material->>'data', ''),
        COALESCE(v_material->>'status', 'Pendente')
      );
      v_count := v_count + 1;
    END LOOP;

    -- Equipment
    FOR v_equip IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'equipamentos', '[]'::jsonb))
    LOOP
      v_new_stage_id := (v_stage_map ->> (v_equip->>'etapa_id'))::uuid;
      IF v_new_stage_id IS NULL THEN
        RAISE EXCEPTION 'Equipamento referencia etapa inexistente';
      END IF;
      v_supplier_id := NULL;
      IF v_equip->>'fornecedorId' IS NOT NULL AND v_equip->>'fornecedorId' <> '' THEN
        v_supplier_id := (v_supplier_map ->> (v_equip->>'fornecedorId'))::uuid;
      END IF;
      INSERT INTO equipment (
        project_id, stage_id, supplier_id, nome, quantidade, valor, forma,
        chave_pix, parcelas, valor_parcela, data_compra, data_entrega, status
      ) VALUES (
        v_project_id, v_new_stage_id, v_supplier_id,
        COALESCE(v_equip->>'nome', ''),
        COALESCE((v_equip->>'quantidade')::integer, 1),
        COALESCE((v_equip->>'valor')::numeric, 0),
        COALESCE(v_equip->>'forma', 'Dinheiro'),
        COALESCE(v_equip->>'chavePix', ''),
        COALESCE(v_equip->>'parcelas', '1x'),
        NULLIF(v_equip->>'valorParcela', '')::numeric,
        NULLIF(v_equip->>'compra', ''),
        NULLIF(v_equip->>'entrega', ''),
        COALESCE(v_equip->>'status', 'Pendente')
      );
      v_count := v_count + 1;
    END LOOP;

    -- Project checklist
    FOR v_proj_checklist IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'checklist', '[]'::jsonb))
    LOOP
      INSERT INTO project_checklist (project_id, nome, feito, sort_order)
      VALUES (
        v_project_id,
        COALESCE(v_proj_checklist->>'nome', ''),
        COALESCE((v_proj_checklist->>'feito')::boolean, false),
        COALESCE((v_proj_checklist->>'sort_order')::integer, 0)
      );
      v_count := v_count + 1;
    END LOOP;

    -- Payments
    FOR v_payment IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'pagamentos', '[]'::jsonb))
    LOOP
      INSERT INTO payments (
        project_id, referencia, tipo, valor, vencimento, forma, status
      ) VALUES (
        v_project_id,
        COALESCE(v_payment->>'referencia', ''),
        COALESCE(v_payment->>'tipo', 'Entrada'),
        COALESCE((v_payment->>'valor')::numeric, 0),
        NULLIF(v_payment->>'vencimento', ''),
        COALESCE(v_payment->>'forma', 'Pix'),
        COALESCE(v_payment->>'status', 'Pendente')
      );
      v_count := v_count + 1;
    END LOOP;

    -- Unforeseen
    FOR v_unforeseen IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'imprevistos', '[]'::jsonb))
    LOOP
      INSERT INTO unforeseen (
        project_id, nome, categoria, valor, impacto_dias, status
      ) VALUES (
        v_project_id,
        COALESCE(v_unforeseen->>'nome', ''),
        COALESCE(v_unforeseen->>'categoria', ''),
        COALESCE((v_unforeseen->>'valor')::numeric, 0),
        COALESCE((v_unforeseen->>'impactoDias')::integer, 0),
        COALESCE(v_unforeseen->>'status', 'Pendente')
      );
      v_count := v_count + 1;
    END LOOP;

    -- Admin items
    FOR v_admin IN SELECT * FROM jsonb_array_elements(COALESCE(v_proj->'admin', '[]'::jsonb))
    LOOP
      INSERT INTO admin_items (
        project_id, nome, valor, pago, status
      ) VALUES (
        v_project_id,
        COALESCE(v_admin->>'nome', ''),
        COALESCE((v_admin->>'valor')::numeric, 0),
        COALESCE((v_admin->>'pago')::numeric, 0),
        COALESCE(v_admin->>'status', 'Pendente')
      );
      v_count := v_count + 1;
    END LOOP;

    v_total_records := v_total_records + v_count;
    project_name := COALESCE(v_proj->>'nome', 'Projeto') || ' (Restaurado)';
    records := v_count;
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_project_backup(jsonb) TO authenticated;

-- Drop the old broken version if it exists
DROP POLICY IF EXISTS "temp_dummy" ON projects;
