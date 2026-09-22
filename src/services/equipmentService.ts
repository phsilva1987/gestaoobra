import { supabase } from '../lib/supabase';
import type { Equipment } from '../types';

export interface EquipmentRow {
  id: string;
  project_id: string;
  stage_id: string;
  supplier_id: string | null;
  nome: string;
  quantidade: number;
  valor: number;
  forma: string;
  chave_pix: string;
  parcelas: string;
  valor_parcela: number | null;
  data_compra: string | null;
  data_entrega: string | null;
  status: string;
}

export function mapEquipmentFromDb(row: EquipmentRow): Equipment {
  return {
    id: row.id,
    etapa_id: row.stage_id,
    nome: row.nome,
    quantidade: row.quantidade,
    valor: Number(row.valor) || 0,
    fornecedorId: row.supplier_id || '',
    forma: row.forma,
    chavePix: row.chave_pix,
    parcelas: row.parcelas,
    valorParcela: row.valor_parcela !== null ? Number(row.valor_parcela) : null,
    compra: row.data_compra || '',
    entrega: row.data_entrega || '',
    status: row.status,
  };
}

export async function getEquipment(projectId: string): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data || []) as EquipmentRow[]).map(mapEquipmentFromDb);
}

export async function createEquipment(projectId: string, data: {
  etapa_id: string;
  nome: string;
  quantidade: number;
  valor: number;
  fornecedorId: string;
  forma: string;
  chavePix: string;
  parcelas: string;
  compra: string;
  entrega: string;
  status: string;
}): Promise<Equipment> {
  const n = parseInt(data.parcelas) || 1;
  const { data: row, error } = await supabase
    .from('equipment')
    .insert({
      project_id: projectId,
      stage_id: data.etapa_id,
      supplier_id: data.fornecedorId || null,
      nome: data.nome,
      quantidade: data.quantidade,
      valor: data.valor,
      forma: data.forma,
      chave_pix: data.forma === 'Pix' ? data.chavePix : '',
      parcelas: data.forma === 'Cartão' ? data.parcelas : '1x',
      valor_parcela: data.forma === 'Cartão' && data.valor > 0 ? data.valor / n : null,
      data_compra: data.compra || null,
      data_entrega: data.entrega || null,
      status: data.status,
    })
    .select('*').single();
  if (error) throw error;
  return mapEquipmentFromDb(row as EquipmentRow);
}

export async function updateEquipment(id: string, data: {
  etapa_id: string;
  nome: string;
  quantidade: number;
  valor: number;
  fornecedorId: string;
  forma: string;
  chavePix: string;
  parcelas: string;
  compra: string;
  entrega: string;
  status: string;
}): Promise<void> {
  const n = parseInt(data.parcelas) || 1;
  const { error } = await supabase
    .from('equipment')
    .update({
      stage_id: data.etapa_id,
      supplier_id: data.fornecedorId || null,
      nome: data.nome,
      quantidade: data.quantidade,
      valor: data.valor,
      forma: data.forma,
      chave_pix: data.forma === 'Pix' ? data.chavePix : '',
      parcelas: data.forma === 'Cartão' ? data.parcelas : '1x',
      valor_parcela: data.forma === 'Cartão' && data.valor > 0 ? data.valor / n : null,
      data_compra: data.compra || null,
      data_entrega: data.entrega || null,
      status: data.status,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteEquipment(id: string): Promise<void> {
  const { error } = await supabase.from('equipment').delete().eq('id', id);
  if (error) throw error;
}
