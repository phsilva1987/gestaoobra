import { supabase } from '../lib/supabase';
import type { Payment } from '../types';

export interface PaymentRow {
  id: string;
  project_id: string;
  referencia: string;
  tipo: string;
  valor: number;
  vencimento: string | null;
  forma: string;
  status: string;
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
  };
}

export async function getPayments(projectId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('vencimento', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data || []) as PaymentRow[]).map(mapPaymentFromDb);
}

export async function createPayment(projectId: string, data: {
  referencia: string;
  tipo: string;
  valor: number;
  vencimento: string;
  forma: string;
  status: string;
}): Promise<Payment> {
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
    })
    .select('*').single();
  if (error) throw error;
  return mapPaymentFromDb(row as PaymentRow);
}

export async function updatePayment(id: string, data: {
  referencia: string;
  tipo: string;
  valor: number;
  vencimento: string;
  forma: string;
  status: string;
}): Promise<void> {
  const { error } = await supabase
    .from('payments')
    .update({
      referencia: data.referencia,
      tipo: data.tipo,
      valor: data.valor,
      vencimento: data.vencimento || null,
      forma: data.forma,
      status: data.status,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}
