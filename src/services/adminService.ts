import { supabase } from '../lib/supabase';
import type { AdminItem } from '../types';

export interface AdminItemRow {
  id: string;
  project_id: string;
  nome: string;
  valor: number;
  pago: number;
  status: string;
}

export function mapAdminItemFromDb(row: AdminItemRow): AdminItem {
  return {
    id: row.id,
    nome: row.nome,
    valor: Number(row.valor) || 0,
    pago: Number(row.pago) || 0,
    status: row.status,
  };
}

export async function getAdminItems(projectId: string): Promise<AdminItem[]> {
  const { data, error } = await supabase
    .from('admin_items')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data || []) as AdminItemRow[]).map(mapAdminItemFromDb);
}

export async function createAdminItem(projectId: string, data: {
  nome: string;
  valor: number;
  pago: number;
  status: string;
}): Promise<AdminItem> {
  const { data: row, error } = await supabase
    .from('admin_items')
    .insert({
      project_id: projectId,
      nome: data.nome,
      valor: data.valor,
      pago: data.pago,
      status: data.status,
    })
    .select('*').single();
  if (error) throw error;
  return mapAdminItemFromDb(row as AdminItemRow);
}

export async function updateAdminItem(id: string, data: {
  nome: string;
  valor: number;
  pago: number;
  status: string;
}): Promise<void> {
  const { error } = await supabase
    .from('admin_items')
    .update({
      nome: data.nome,
      valor: data.valor,
      pago: data.pago,
      status: data.status,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAdminItem(id: string): Promise<void> {
  const { error } = await supabase.from('admin_items').delete().eq('id', id);
  if (error) throw error;
}
