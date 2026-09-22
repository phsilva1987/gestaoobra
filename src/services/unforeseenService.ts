import { supabase } from '../lib/supabase';
import type { Unforeseen } from '../types';

export interface UnforeseenRow {
  id: string;
  project_id: string;
  nome: string;
  categoria: string;
  valor: number;
  impacto_dias: number;
  status: string;
}

export function mapUnforeseenFromDb(row: UnforeseenRow): Unforeseen {
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    valor: Number(row.valor) || 0,
    impactoDias: row.impacto_dias,
    status: row.status,
  };
}

export async function getUnforeseen(projectId: string): Promise<Unforeseen[]> {
  const { data, error } = await supabase
    .from('unforeseen')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data || []) as UnforeseenRow[]).map(mapUnforeseenFromDb);
}

export async function createUnforeseen(projectId: string, data: {
  nome: string;
  categoria: string;
  valor: number;
  impactoDias: number;
  status: string;
}): Promise<Unforeseen> {
  const { data: row, error } = await supabase
    .from('unforeseen')
    .insert({
      project_id: projectId,
      nome: data.nome,
      categoria: data.categoria,
      valor: data.valor,
      impacto_dias: data.impactoDias,
      status: data.status,
    })
    .select('*').single();
  if (error) throw error;
  return mapUnforeseenFromDb(row as UnforeseenRow);
}

export async function updateUnforeseen(id: string, data: {
  nome: string;
  categoria: string;
  valor: number;
  impactoDias: number;
  status: string;
}): Promise<void> {
  const { error } = await supabase
    .from('unforeseen')
    .update({
      nome: data.nome,
      categoria: data.categoria,
      valor: data.valor,
      impacto_dias: data.impactoDias,
      status: data.status,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteUnforeseen(id: string): Promise<void> {
  const { error } = await supabase.from('unforeseen').delete().eq('id', id);
  if (error) throw error;
}
