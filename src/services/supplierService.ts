import { supabase } from '../lib/supabase';
import type { Supplier } from '../types';
import type { SupplierFormData } from '../components/suppliers/SupplierForm';
import { mapSupplierFromDb, mapSupplierToDb, type SupplierRow } from './mappers';

export async function getSuppliers(projectId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('project_id', projectId)
    .order('nome', { ascending: true });

  if (error) throw error;
  if (!data) return [];
  return (data as SupplierRow[]).map(mapSupplierFromDb);
}

export async function createSupplier(
  projectId: string,
  data: SupplierFormData
): Promise<Supplier> {
  const insertData = mapSupplierToDb(data);
  const { data: row, error } = await supabase
    .from('suppliers')
    .insert({
      project_id: projectId,
      ...insertData,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapSupplierFromDb(row as SupplierRow);
}

export async function updateSupplier(
  id: string,
  data: SupplierFormData
): Promise<void> {
  const updateData = mapSupplierToDb(data);
  const { error } = await supabase
    .from('suppliers')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
