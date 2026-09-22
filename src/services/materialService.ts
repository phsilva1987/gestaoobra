import { supabase } from '../lib/supabase';
import type { Material } from '../types';

export interface MaterialRow {
  id: string;
  project_id: string;
  stage_id: string;
  supplier_id: string | null;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  pago: number;
  data: string | null;
  status: string;
}

export function mapMaterialFromDb(row: MaterialRow): Material {
  return {
    id: row.id,
    etapa_id: row.stage_id,
    nome: row.nome,
    categoria: row.categoria,
    fornecedorId: row.supplier_id || '',
    quantidade: Number(row.quantidade) || 0,
    unidade: row.unidade,
    unitario: Number(row.valor_unitario) || 0,
    pago: Number(row.pago) || 0,
    data: row.data || '',
    status: row.status,
  };
}

export async function getMaterials(projectId: string): Promise<Material[]> {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data || []) as MaterialRow[]).map(mapMaterialFromDb);
}

export async function createMaterial(projectId: string, data: {
  etapa_id: string;
  nome: string;
  categoria: string;
  fornecedorId: string;
  quantidade: number;
  unidade: string;
  unitario: number;
  pago: number;
  data: string;
  status: string;
}): Promise<Material> {
  const { data: row, error } = await supabase
    .from('materials')
    .insert({
      project_id: projectId,
      stage_id: data.etapa_id,
      supplier_id: data.fornecedorId || null,
      nome: data.nome,
      categoria: data.categoria,
      quantidade: data.quantidade,
      unidade: data.unidade,
      valor_unitario: data.unitario,
      pago: data.pago,
      data: data.data || null,
      status: data.status,
    })
    .select('*').single();
  if (error) throw error;
  return mapMaterialFromDb(row as MaterialRow);
}

export async function updateMaterial(id: string, data: {
  etapa_id: string;
  nome: string;
  categoria: string;
  fornecedorId: string;
  quantidade: number;
  unidade: string;
  unitario: number;
  pago: number;
  data: string;
  status: string;
}): Promise<void> {
  const { error } = await supabase
    .from('materials')
    .update({
      stage_id: data.etapa_id,
      supplier_id: data.fornecedorId || null,
      nome: data.nome,
      categoria: data.categoria,
      quantidade: data.quantidade,
      unidade: data.unidade,
      valor_unitario: data.unitario,
      pago: data.pago,
      data: data.data || null,
      status: data.status,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}
