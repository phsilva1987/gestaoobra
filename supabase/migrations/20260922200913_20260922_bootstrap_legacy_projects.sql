/*
# Bootstrap legacy projects with full data

Inserts 2 projects with legacy_key, plus all their associated data.
Idempotent: checks legacy_key before inserting.
*/

DO $$
DECLARE
  v_proj1 uuid;
  v_proj2 uuid;
  v_s1_1 uuid; v_s1_2 uuid; v_s1_3 uuid; v_s1_4 uuid; v_s1_5 uuid; v_s1_6 uuid; v_s1_7 uuid; v_s1_8 uuid;
  v_p1_1 uuid; v_p1_2 uuid; v_p1_3 uuid; v_p1_4 uuid; v_p1_5 uuid;
  v_f1_1 uuid; v_f1_2 uuid; v_f1_3 uuid;
  v_s2_1 uuid; v_s2_2 uuid; v_s2_3 uuid; v_s2_4 uuid;
  v_p2_1 uuid; v_p2_2 uuid;
  v_f2_1 uuid;
BEGIN
  -- PROJECT 1: Noremati Studio
  SELECT id INTO v_proj1 FROM projects WHERE legacy_key = 'noremati-studio';
  IF v_proj1 IS NULL THEN
    INSERT INTO projects (legacy_key, name, type, status, empresa, documento, responsavel, telefone, email, endereco, cidade, resp_obra, orcamento, data_inicio, data_fim, cover_image_path)
    VALUES ('noremati-studio', 'Reforma do Studio - Noremati Pilates', 'Studio / Comercial', 'Em andamento', 'Noremati Pilates Clássico', '12.345.678/0001-90', 'Paulo Henrique', '(13) 99999-9999', 'contato@noremati.com.br', 'Av. Ana Costa, 450', 'Santos / SP', 'João Pedreiro', 45000, '2026-09-01', '2026-10-30', '/noremati-studio.webp')
    RETURNING id INTO v_proj1;
  END IF;

  v_s1_1 := gen_random_uuid(); v_s1_2 := gen_random_uuid(); v_s1_3 := gen_random_uuid();
  v_s1_4 := gen_random_uuid(); v_s1_5 := gen_random_uuid(); v_s1_6 := gen_random_uuid();
  v_s1_7 := gen_random_uuid(); v_s1_8 := gen_random_uuid();

  INSERT INTO stages (id, project_id, nome, categoria, prioridade, status, progresso, previsto, inicio, fim, fim_real, dependencia, observacao) VALUES
    (v_s1_1, v_proj1, 'Demolição de paredes', 'Demolição', 'Alta', 'Concluído', 100, 3000, '2026-09-01', '2026-09-10', '2026-09-10', NULL, ''),
    (v_s1_2, v_proj1, 'Reposicionar iluminação', 'Elétrica', 'Média', 'Em andamento', 50, 4000, '2026-09-12', '2026-09-24', NULL, v_s1_1, ''),
    (v_s1_3, v_proj1, 'Trocar vasos sanitários', 'Hidráulica', 'Média', 'Em andamento', 30, 2500, '2026-09-15', '2026-09-18', NULL, v_s1_1, ''),
    (v_s1_4, v_proj1, 'Pintura do estúdio', 'Pintura', 'Baixa', 'Não iniciado', 0, 3500, '2026-09-25', '2026-10-02', NULL, v_s1_2, ''),
    (v_s1_5, v_proj1, 'Instalação piso click', 'Piso', 'Alta', 'Não iniciado', 0, 5000, '2026-09-28', '2026-10-05', NULL, v_s1_3, ''),
    (v_s1_6, v_proj1, 'Manutenção ar-condicionado', 'Climatização', 'Média', 'Contratado', 40, 3000, '2026-10-05', '2026-10-15', NULL, v_s1_2, ''),
    (v_s1_7, v_proj1, 'Limpeza pós-obra', 'Limpeza', 'Baixa', 'Não iniciado', 0, 800, '2026-10-18', '2026-10-25', NULL, v_s1_4, ''),
    (v_s1_8, v_proj1, 'Acabamentos finais', 'Acabamentos', 'Média', 'Não iniciado', 0, 2500, '2026-10-12', '2026-10-20', NULL, v_s1_5, '')
  ON CONFLICT (id) DO NOTHING;

  -- Stage checklist for project 1
  INSERT INTO stage_checklist (project_id, stage_id, label, completed, sort_order)
  SELECT v_proj1, s.id, lbl.label, lbl.completed, lbl.ord
  FROM stages s
  CROSS JOIN (VALUES
    ('Serviço executado', false, 1), ('Serviço conferido', false, 2), ('Ambiente limpo', false, 3), ('Pagamento conferido', false, 4), ('Sem pendências', false, 5)
  ) AS lbl(label, completed, ord)
  WHERE s.project_id = v_proj1 AND s.id IN (v_s1_1, v_s1_2, v_s1_3, v_s1_4, v_s1_5, v_s1_6, v_s1_7, v_s1_8)
    AND NOT EXISTS (SELECT 1 FROM stage_checklist sc WHERE sc.stage_id = s.id);

  UPDATE stage_checklist SET completed = true WHERE stage_id = v_s1_1 AND project_id = v_proj1;
  UPDATE stage_checklist SET completed = true WHERE stage_id = v_s1_2 AND project_id = v_proj1 AND sort_order = 1;

  v_p1_1 := gen_random_uuid(); v_p1_2 := gen_random_uuid(); v_p1_3 := gen_random_uuid(); v_p1_4 := gen_random_uuid(); v_p1_5 := gen_random_uuid();

  INSERT INTO professionals (id, project_id, nome, servico, telefone, email, status) VALUES
    (v_p1_1, v_proj1, 'João Pedro', 'Pedreiro / Demolição', '(13) 98888-1111', 'joao@email.com', 'Concluído'),
    (v_p1_2, v_proj1, 'Carlos Eletricista', 'Eletricista', '(13) 98888-2222', 'carlos@email.com', 'Em andamento'),
    (v_p1_3, v_proj1, 'Marcos Pintor', 'Pintor', '(13) 98888-3333', 'marcos@email.com', 'Cotação'),
    (v_p1_4, v_proj1, 'Ana Encanadora', 'Encanadora', '(13) 98888-4444', 'ana@email.com', 'Em andamento'),
    (v_p1_5, v_proj1, 'Antonio Acabamentos', 'Acabamentos / Geral', '(13) 98888-5555', 'antonio@pix.com', 'Em andamento')
  ON CONFLICT (id) DO NOTHING;

  v_f1_1 := gen_random_uuid(); v_f1_2 := gen_random_uuid(); v_f1_3 := gen_random_uuid();

  INSERT INTO suppliers (id, project_id, nome, telefone, email, site) VALUES
    (v_f1_1, v_proj1, 'Casa do Construtor', '(13) 3222-1111', 'vendas@casadoconstrutor.com', ''),
    (v_f1_2, v_proj1, 'Hidráulica Santos', '(13) 3222-3333', 'contato@hidraulicasantos.com', ''),
    (v_f1_3, v_proj1, 'Pilates Pro Equipamentos', '(11) 4000-1234', 'comercial@pilatespro.com', 'pilatespro.com.br')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO jobs (project_id, professional_id, stage_id, valor, pago, forma, chave_pix, parcelas, valor_parcela, status) VALUES
    (v_proj1, v_p1_1, v_s1_1, 3000, 3000, 'Pix', '', '1x', NULL, 'Concluído'),
    (v_proj1, v_p1_2, v_s1_2, 2500, 1500, 'Pix', '', '1x', NULL, 'Em andamento'),
    (v_proj1, v_p1_4, v_s1_3, 1800, 800, 'Em Dinheiro', '', '1x', NULL, 'Em andamento'),
    (v_proj1, v_p1_1, v_s1_3, 1200, 0, 'Pix', '', '1x', NULL, 'Em andamento'),
    (v_proj1, v_p1_5, v_s1_1, 5000, 2000, 'Pix', 'antonio@pix.com', '1x', NULL, 'Em andamento'),
    (v_proj1, v_p1_5, v_s1_2, 3000, 0, 'Cartão', '', '3x', 1000, 'Em andamento')
  ON CONFLICT DO NOTHING;

  INSERT INTO materials (project_id, stage_id, supplier_id, nome, categoria, quantidade, unidade, valor_unitario, pago, data, status) VALUES
    (v_proj1, v_s1_2, v_f1_1, 'Fios e cabos elétricos', 'Elétrica', 100, 'm', 15, 1500, '2026-09-12', 'Entregue'),
    (v_proj1, v_s1_3, v_f1_2, 'Tubos PVC 40mm', 'Hidráulica', 20, 'm', 35, 700, '2026-09-15', 'Entregue'),
    (v_proj1, v_s1_1, v_f1_1, 'Sacos de cimento', 'Demolição', 10, 'caixa', 28, 280, '2026-09-01', 'Entregue')
  ON CONFLICT DO NOTHING;

  INSERT INTO equipment (project_id, stage_id, supplier_id, nome, quantidade, valor, forma, chave_pix, parcelas, valor_parcela, data_compra, data_entrega, status) VALUES
    (v_proj1, v_s1_1, v_f1_1, 'Martelete elétrico', 1, 10000, 'Pix', '', '1x', NULL, '2026-09-01', '2026-09-05', 'Comprado'),
    (v_proj1, v_s1_5, v_f1_3, 'Reformer Pilates', 1, 8000, 'Cartão', '', '4x', 2000, '2026-09-28', '2026-10-10', 'Comprado'),
    (v_proj1, v_s1_5, v_f1_3, 'Cadillac Pilates', 1, 12000, 'Cartão', '', '6x', 2000, '2026-09-28', '2026-10-15', 'Aguardando entrega')
  ON CONFLICT DO NOTHING;

  INSERT INTO unforeseen (project_id, nome, categoria, valor, impacto_dias, status) VALUES
    (v_proj1, 'Cano quebrado na parede', 'Hidráulica', 500, 2, 'Aberto'),
    (v_proj1, 'Fio adicional para ar-condicionado', 'Elétrica', 200, 0, 'Resolvido')
  ON CONFLICT DO NOTHING;

  INSERT INTO payments (project_id, referencia, tipo, valor, vencimento, forma, status) VALUES
    (v_proj1, 'João - Demolição', 'Profissional', 3000, '2026-09-15', 'PIX', 'Pago'),
    (v_proj1, 'Carlos - Elétrica (2ª parcela)', 'Profissional', 1000, '2026-09-25', 'PIX', 'Pendente'),
    (v_proj1, 'Material hidráulico', 'Material', 700, '2026-09-28', 'Boleto', 'Pendente')
  ON CONFLICT DO NOTHING;

  INSERT INTO admin_items (project_id, nome, valor, pago, status) VALUES
    (v_proj1, 'Abertura CNPJ', 800, 800, 'Pago'),
    (v_proj1, 'Contador - mensalidade', 300, 300, 'Pago')
  ON CONFLICT DO NOTHING;

  INSERT INTO project_checklist (project_id, nome, feito, sort_order) VALUES
    (v_proj1, 'Paredes e correções concluídas', true, 1),
    (v_proj1, 'Elétrica, tomadas e interruptores testados', false, 2),
    (v_proj1, 'Vasos, torneiras e hidráulica testados', false, 3),
    (v_proj1, 'Pintura revisada e sem retoques pendentes', false, 4),
    (v_proj1, 'Piso click e rodapés concluídos', false, 5),
    (v_proj1, 'Ar-condicionado revisado e funcionando', false, 6),
    (v_proj1, 'Limpeza pós-obra concluída', false, 7),
    (v_proj1, 'Vistoria final realizada', false, 8)
  ON CONFLICT DO NOTHING;

  -- PROJECT 2: Apartamento Porto
  SELECT id INTO v_proj2 FROM projects WHERE legacy_key = 'apartamento-porto';
  IF v_proj2 IS NULL THEN
    INSERT INTO projects (legacy_key, name, type, status, empresa, documento, responsavel, telefone, email, endereco, cidade, resp_obra, orcamento, data_inicio, data_fim, cover_image_path)
    VALUES ('apartamento-porto', 'Reforma Apartamento Centro', 'Apartamento', 'Em andamento', 'Família Silva', '123.456.789-00', 'Roberto Silva', '(13) 97777-1234', 'roberto.silva@email.com', 'R. Marechal Deodoro, 200, Apto 32', 'Santos / SP', 'Pedro Alvenaria', 25000, '2026-08-15', '2026-10-15', '/apartamento-porto.webp')
    RETURNING id INTO v_proj2;
  END IF;

  v_s2_1 := gen_random_uuid(); v_s2_2 := gen_random_uuid(); v_s2_3 := gen_random_uuid(); v_s2_4 := gen_random_uuid();

  INSERT INTO stages (id, project_id, nome, categoria, prioridade, status, progresso, previsto, inicio, fim, fim_real, dependencia, observacao) VALUES
    (v_s2_1, v_proj2, 'Demolição e remoção', 'Demolição', 'Alta', 'Concluído', 100, 2000, '2026-08-15', '2026-08-30', '2026-08-30', NULL, ''),
    (v_s2_2, v_proj2, 'Alvenaria e reboco', 'Alvenaria', 'Alta', 'Em andamento', 60, 6000, '2026-08-25', '2026-09-10', NULL, v_s2_1, ''),
    (v_s2_3, v_proj2, 'Pintura completa', 'Pintura', 'Média', 'Não iniciado', 0, 3000, '2026-09-23', '2026-10-01', NULL, v_s2_2, ''),
    (v_s2_4, v_proj2, 'Acabamento e instalações', 'Acabamentos', 'Média', 'Cotação', 20, 4000, '2026-10-01', '2026-10-10', NULL, v_s2_2, '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO stage_checklist (project_id, stage_id, label, completed, sort_order)
  SELECT v_proj2, s.id, lbl.label, lbl.completed, lbl.ord
  FROM stages s
  CROSS JOIN (VALUES
    ('Serviço executado', false, 1), ('Serviço conferido', false, 2), ('Ambiente limpo', false, 3), ('Pagamento conferido', false, 4), ('Sem pendências', false, 5)
  ) AS lbl(label, completed, ord)
  WHERE s.project_id = v_proj2 AND s.id IN (v_s2_1, v_s2_2, v_s2_3, v_s2_4)
    AND NOT EXISTS (SELECT 1 FROM stage_checklist sc WHERE sc.stage_id = s.id);

  UPDATE stage_checklist SET completed = true WHERE stage_id = v_s2_1 AND project_id = v_proj2;

  v_p2_1 := gen_random_uuid(); v_p2_2 := gen_random_uuid();

  INSERT INTO professionals (id, project_id, nome, servico, telefone, email, status) VALUES
    (v_p2_1, v_proj2, 'Pedro Alvenaria', 'Pedreiro', '(13) 96666-5555', 'pedro@email.com', 'Em andamento'),
    (v_p2_2, v_proj2, 'Lucia Pintora', 'Pintora', '(13) 96666-6666', 'lucia@email.com', 'Cotação')
  ON CONFLICT (id) DO NOTHING;

  v_f2_1 := gen_random_uuid();

  INSERT INTO suppliers (id, project_id, nome, telefone, email, site) VALUES
    (v_f2_1, v_proj2, 'Casa do Construtor', '(13) 3222-1111', 'vendas@casadoconstrutor.com', '')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO jobs (project_id, professional_id, stage_id, valor, pago, forma, chave_pix, parcelas, valor_parcela, status) VALUES
    (v_proj2, v_p2_1, v_s2_1, 2000, 2000, 'Pix', '', '1x', NULL, 'Concluído'),
    (v_proj2, v_p2_1, v_s2_2, 5000, 3000, 'Em Dinheiro', '', '1x', NULL, 'Em andamento')
  ON CONFLICT DO NOTHING;

  INSERT INTO materials (project_id, stage_id, supplier_id, nome, categoria, quantidade, unidade, valor_unitario, pago, data, status) VALUES
    (v_proj2, v_s2_2, v_f2_1, 'Tijolos cerâmicos', 'Alvenaria', 500, 'un', 2.5, 1250, '2026-08-25', 'Entregue'),
    (v_proj2, v_s2_2, v_f2_1, 'Argamassa', 'Alvenaria', 30, 'caixa', 45, 1350, '2026-08-25', 'Entregue')
  ON CONFLICT DO NOTHING;

  INSERT INTO payments (project_id, referencia, tipo, valor, vencimento, forma, status) VALUES
    (v_proj2, 'Pedro - Alvenaria (2ª parcela)', 'Profissional', 2000, '2026-09-25', 'PIX', 'Pendente')
  ON CONFLICT DO NOTHING;

  INSERT INTO admin_items (project_id, nome, valor, pago, status) VALUES
    (v_proj2, 'Projeto legal', 500, 500, 'Pago')
  ON CONFLICT DO NOTHING;

  INSERT INTO project_checklist (project_id, nome, feito, sort_order) VALUES
    (v_proj2, 'Demolição concluída', true, 1),
    (v_proj2, 'Alvenaria finalizada', false, 2),
    (v_proj2, 'Pintura concluída', false, 3),
    (v_proj2, 'Acabamento e instalações', false, 4),
    (v_proj2, 'Limpeza final', false, 5)
  ON CONFLICT DO NOTHING;
END $$;
