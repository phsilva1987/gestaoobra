import { supabase } from '../lib/supabase';
import type { Professional } from '../types';

export interface ProfessionalRow {
  id: string;
  project_id: string;
  nome: string;
  servico: string;
  telefone: string;
  email: string;
  status: string;
}

export function mapProfessionalFromDb(row: ProfessionalRow): Professional {
  return {
    id: row.id,
    nome: row.nome,
    servico: row.servico,
    telefone: row.telefone,
    email: row.email,
    status: row.status,
  };
}

export async function getProfessionals(projectId: string): Promise<Professional[]> {
  const { data, error } = await supabase
    .from('professionals')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data || []) as ProfessionalRow[]).map(mapProfessionalFromDb);
}

export async function createProfessional(projectId: string, data: {
  nome: string;
  servico: string;
  telefone: string;
  email: string;
  status: string;
}): Promise<Professional> {
  const { data: row, error } = await supabase
    .from('professionals')
    .insert({
      project_id: projectId,
      nome: data.nome,
      servico: data.servico,
      telefone: data.telefone,
      email: data.email,
      status: data.status,
    })
    .select('*').single();
  if (error) throw error;
  return mapProfessionalFromDb(row as ProfessionalRow);
}

export async function updateProfessional(id: string, data: {
  nome: string;
  servico: string;
  telefone: string;
  email: string;
  status: string;
}): Promise<void> {
  const { error } = await supabase
    .from('professionals')
    .update({
      nome: data.nome,
      servico: data.servico,
      telefone: data.telefone,
      email: data.email,
      status: data.status,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProfessional(id: string): Promise<void> {
  const { error } = await supabase.from('professionals').delete().eq('id', id);
  if (error) throw error;
}
