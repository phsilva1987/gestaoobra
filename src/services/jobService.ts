import { supabase } from '../lib/supabase';
import type { Job } from '../types';

export interface JobRow {
  id: string;
  project_id: string;
  professional_id: string;
  stage_id: string;
  valor: number;
  pago: number;
  forma: string;
  chave_pix: string;
  parcelas: string;
  valor_parcela: number | null;
  status: string;
}

export function mapJobFromDb(row: JobRow): Job {
  return {
    id: row.id,
    etapa_id: row.stage_id,
    profissional_id: row.professional_id,
    valor: Number(row.valor) || 0,
    pago: Number(row.pago) || 0,
    forma: row.forma,
    parcelas: row.parcelas,
    chavePix: row.chave_pix,
    valorParcela: row.valor_parcela !== null ? Number(row.valor_parcela) : null,
    status: row.status,
  };
}

export async function getJobs(projectId: string): Promise<Job[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data || []) as JobRow[]).map(mapJobFromDb);
}

export async function createJob(projectId: string, data: {
  etapa_id: string;
  profissional_id: string;
  valor: number;
  pago: number;
  forma: string;
  parcelas: string;
  chavePix: string;
  status: string;
}): Promise<Job> {
  const n = parseInt(data.parcelas) || 1;
  const { data: row, error } = await supabase
    .from('jobs')
    .insert({
      project_id: projectId,
      professional_id: data.profissional_id,
      stage_id: data.etapa_id,
      valor: data.valor,
      pago: data.pago,
      forma: data.forma,
      chave_pix: data.forma === 'Pix' ? data.chavePix : '',
      parcelas: data.forma === 'Cartão' ? data.parcelas : '1x',
      valor_parcela: data.forma === 'Cartão' && data.valor > 0 ? data.valor / n : null,
      status: data.status,
    })
    .select('*').single();
  if (error) throw error;
  return mapJobFromDb(row as JobRow);
}

export async function updateJob(id: string, data: {
  etapa_id: string;
  profissional_id: string;
  valor: number;
  pago: number;
  forma: string;
  parcelas: string;
  chavePix: string;
  status: string;
}): Promise<void> {
  const n = parseInt(data.parcelas) || 1;
  const { error } = await supabase
    .from('jobs')
    .update({
      stage_id: data.etapa_id,
      professional_id: data.profissional_id,
      valor: data.valor,
      pago: data.pago,
      forma: data.forma,
      chave_pix: data.forma === 'Pix' ? data.chavePix : '',
      parcelas: data.forma === 'Cartão' ? data.parcelas : '1x',
      valor_parcela: data.forma === 'Cartão' && data.valor > 0 ? data.valor / n : null,
      status: data.status,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) throw error;
}
