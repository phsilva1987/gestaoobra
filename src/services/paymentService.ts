import { supabase } from '../lib/supabase';
import type { Payment, PaymentSourceType } from '../types';

export interface PaymentRow {
  id: string;
  project_id: string;
  referencia: string;
  tipo: string;
  valor: number;
  vencimento: string | null;
  forma: string;
  status: string;
  source_type: PaymentSourceType;
  source_id: string | null;
  stage_id: string | null;
  paid_at: string | null;
  observacao: string;
}

export function mapPaymentFromDb(row: PaymentRow): Payment {
  return {
    id: row.id,
    referencia: row.referencia,
    tipo: row.tipo,
    valor: Number(row.valor) || 0,
    vencimento: row.vencimento || '',
    forma: row.forma,
    status: row.status,
    sourceType: row.source_type || null,
    sourceId: row.source_id || null,
    stageId: row.stage_id || null,
    paidAt: row.paid_at || '',
    observacao: row.observacao || '',
  };
}

export async function getPayments(projectId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data || []) as PaymentRow[]).map(mapPaymentFromDb);
}

export interface CreatePaymentData {
  referencia: string;
  tipo: string;
  valor: number;
  vencimento: string;
  forma: string;
  status: string;
  sourceType: PaymentSourceType;
  sourceId: string | null;
  stageId: string | null;
  paidAt: string;
  observacao: string;
}

export async function createPayment(projectId: string, data: CreatePaymentData): Promise<Payment> {
  const { data: row, error } = await supabase
    .from('payments')
    .insert({
      project_id: projectId,
      referencia: data.referencia,
      tipo: data.tipo,
      valor: data.valor,
      vencimento: data.vencimento || null,
      forma: data.forma,
      status: data.status,
      source_type: data.sourceType,
      source_id: data.sourceId,
      stage_id: data.stageId,
      paid_at: data.paidAt || null,
      observacao: data.observacao || '',
    })
    .select('*').single();
  if (error) throw error;
  return mapPaymentFromDb(row as PaymentRow);
}

export interface UpdatePaymentData {
  referencia: string;
  tipo: string;
  valor: number;
  vencimento: string;
  forma: string;
  status: string;
  sourceType: PaymentSourceType;
  sourceId: string | null;
  stageId: string | null;
  paidAt: string;
  observacao: string;
}

export async function updatePayment(id: string, data: UpdatePaymentData): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .update({
      referencia: data.referencia,
      tipo: data.tipo,
      valor: data.valor,
      vencimento: data.vencimento || null,
      forma: data.forma,
      status: data.status,
      source_type: data.sourceType,
      source_id: data.sourceId,
      stage_id: data.stageId,
      paid_at: data.paidAt || null,
      observacao: data.observacao || '',
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}
